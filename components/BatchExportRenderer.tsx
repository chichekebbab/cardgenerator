import React, { useState, useEffect, useRef } from 'react';
import { CardData } from '../types';
import ExportCardRenderer from './ExportCardRenderer';
import { getLayoutFilename, getExportFilename } from '../utils/layoutUtils';
import { toPng, getFontEmbedCSS } from 'html-to-image';
import JSZip from 'jszip';
import { useNotification } from './NotificationContext';

interface BatchExportRendererProps {
    cards: CardData[];
    onComplete: () => void;
    onProgress: (current: number, total: number, chunkInfo?: { chunk: number; totalChunks: number }) => void;
}

const CHUNK_SIZE = 40;
const GC_PAUSE_INTERVAL = 10;
const GC_PAUSE_MS = 150;
const CHUNK_PAUSE_MS = 1500;

async function dataUrlToBlob(dataUrl: string): Promise<Blob> {
    const res = await fetch(dataUrl);
    return res.blob();
}

function downloadBlob(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 3000);
}

/**
 * Wait until all <img> elements inside the given container are fully loaded.
 * Returns a promise that resolves when all images are loaded (or failed).
 * Has a global timeout to avoid hanging forever.
 */
function waitForImages(container: HTMLElement, timeoutMs = 5000): Promise<void> {
    return new Promise<void>((resolve) => {
        const images = container.querySelectorAll('img');
        if (images.length === 0) {
            resolve();
            return;
        }

        let pending = 0;
        let resolved = false;

        const done = () => {
            if (resolved) return;
            resolved = true;
            resolve();
        };

        const timeout = setTimeout(() => {
            if (!resolved) {
                console.warn(`[Export] Image loading timeout (${timeoutMs}ms) - ${pending} image(s) still pending`);
                done();
            }
        }, timeoutMs);

        images.forEach((img) => {
            if (img.complete && img.naturalWidth > 0) return; // Already loaded
            pending++;

            const onFinish = () => {
                pending--;
                if (pending <= 0) {
                    clearTimeout(timeout);
                    done();
                }
            };

            img.addEventListener('load', onFinish, { once: true });
            img.addEventListener('error', () => {
                console.warn(`[Export] Image failed to load: ${img.src?.substring(0, 100)}`);
                onFinish();
            }, { once: true });
        });

        // If all images were already complete
        if (pending === 0) {
            clearTimeout(timeout);
            done();
        }
    });
}

const BatchExportRenderer: React.FC<BatchExportRendererProps> = ({ cards, onComplete, onProgress }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const exportRef = useRef<HTMLDivElement>(null);
    const zipRef = useRef<JSZip>(new JSZip());
    const isProcessingRef = useRef(false);
    const cancelledRef = useRef(false);
    const fontCSSRef = useRef<string | undefined>(undefined);
    const fontCSSComputedRef = useRef(false); // true after first attempt (success or fail)
    const successCountRef = useRef(0); // Track how many cards were successfully captured
    const { showNotification } = useNotification();

    const onCompleteRef = useRef(onComplete);
    const onProgressRef = useRef(onProgress);
    const showNotifRef = useRef(showNotification);
    onCompleteRef.current = onComplete;
    onProgressRef.current = onProgress;
    showNotifRef.current = showNotification;

    const totalChunks = Math.ceil(cards.length / CHUNK_SIZE);

    // Setup on mount
    useEffect(() => {
        // Reset cancelled flag (StrictMode may have set it to true during cleanup)
        cancelledRef.current = false;
        isProcessingRef.current = false;
        successCountRef.current = 0;

        // Pre-cache layout images
        const uniqueLayouts = new Set(cards.map(c => `layouts/${getLayoutFilename(c)}`));
        uniqueLayouts.add('/texture/texture_description.png');
        const preloadPromises: Promise<void>[] = [];

        uniqueLayouts.forEach(src => {
            const p = new Promise<void>((resolve) => {
                const img = new Image();
                img.crossOrigin = 'anonymous';
                img.onload = () => resolve();
                img.onerror = () => {
                    console.warn(`[Export] Failed to preload layout: ${src}`);
                    resolve();
                };
                img.src = src;
            });
            preloadPromises.push(p);
        });

        // Wait for all layout images to preload before starting
        Promise.all(preloadPromises).then(() => {
            console.log(`[Export] ${preloadPromises.length} layout images preloaded`);
        });

        // Silent AudioContext to prevent background tab throttling
        let audioCtx: AudioContext | null = null;
        try {
            audioCtx = new AudioContext();
            const oscillator = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            oscillator.frequency.value = 1;
            gain.gain.value = 0.001;
            oscillator.connect(gain);
            gain.connect(audioCtx.destination);
            oscillator.start();
        } catch (e) { /* not available */ }

        return () => {
            cancelledRef.current = true;
            audioCtx?.close().catch(() => { });
        };
    }, []);

    // Sequential processing
    useEffect(() => {
        const processNext = async () => {
            if (cancelledRef.current) return;

            if (currentIndex >= cards.length) {
                const filesInZip = Object.keys(zipRef.current.files).length;
                console.log(`[Export] All cards processed. Files in final ZIP: ${filesInZip}, total successes: ${successCountRef.current}`);

                if (filesInZip > 0) {
                    try {
                        const chunkIdx = Math.floor((currentIndex - 1) / CHUNK_SIZE);
                        const zipBlob = await zipRef.current.generateAsync({ type: 'blob', compression: 'STORE' });
                        console.log(`[Export] Final ZIP generated: ${(zipBlob.size / 1024).toFixed(1)} KB`);
                        const zipName = totalChunks === 1
                            ? 'munchkin_cards.zip'
                            : `munchkin_cards_partie${chunkIdx + 1}_sur_${totalChunks}.zip`;
                        downloadBlob(zipBlob, zipName);
                        if (totalChunks > 1) {
                            showNotifRef.current(`📦 Lot ${chunkIdx + 1}/${totalChunks} téléchargé !`, 'success');
                        }
                    } catch (e) {
                        console.error('[Export] Error generating final ZIP:', e);
                    }
                } else {
                    console.error('[Export] ZIP is EMPTY! No cards were captured.');
                    showNotifRef.current('❌ Erreur : aucune carte n\'a pu être capturée. Vérifiez la console.', 'error');
                }

                if (totalChunks > 1) {
                    showNotifRef.current(`✅ Export terminé ! ${totalChunks} fichiers ZIP.`, 'success');
                }
                onCompleteRef.current();
                return;
            }

            if (isProcessingRef.current) return;
            isProcessingRef.current = true;

            try {
                // Wait for React to commit the new ExportCardRenderer to the DOM
                await new Promise(r => setTimeout(r, 100));
                if (cancelledRef.current || !exportRef.current) {
                    console.warn(`[Export] Card ${currentIndex}: ref is null or cancelled`);
                    return;
                }

                // ONE-TIME: try to compute font CSS (with 10s timeout)
                if (!fontCSSComputedRef.current) {
                    fontCSSComputedRef.current = true;
                    try {
                        console.log('[Export] Computing font CSS...');
                        const fontPromise = getFontEmbedCSS(exportRef.current);
                        const timeoutPromise = new Promise<string>((_, reject) =>
                            setTimeout(() => reject(new Error('Font CSS timeout after 10s')), 10000)
                        );
                        fontCSSRef.current = await Promise.race([fontPromise, timeoutPromise]);
                        console.log(`[Export] Font CSS ready (${fontCSSRef.current.length} chars)`);
                    } catch (e) {
                        console.warn('[Export] Font CSS failed, using per-card embedding (slower):', e);
                        fontCSSRef.current = undefined;
                    }
                }

                if (cancelledRef.current) return;

                // Wait for all images inside the ExportCardRenderer to be fully loaded
                await waitForImages(exportRef.current, 5000);

                if (cancelledRef.current || !exportRef.current) return;

                // GC pause
                const posInChunk = currentIndex % CHUNK_SIZE;
                if (posInChunk > 0 && posInChunk % GC_PAUSE_INTERVAL === 0) {
                    await new Promise(r => setTimeout(r, GC_PAUSE_MS));
                }
                if (cancelledRef.current) return;

                // Capture
                const t0 = Date.now();
                const toPngOptions: Record<string, unknown> = {
                    quality: 1.0,
                    pixelRatio: 1,
                    cacheBust: false,
                };
                if (fontCSSRef.current) {
                    toPngOptions.fontEmbedCSS = fontCSSRef.current;
                }

                const dataUrl = await toPng(exportRef.current, toPngOptions);

                // Validate the data URL is not empty/minimal
                if (!dataUrl || dataUrl.length < 1000) {
                    console.error(`[Export] Card ${currentIndex} (${cards[currentIndex].title}): toPng returned empty/minimal data (${dataUrl?.length || 0} chars)`);
                    // Retry once with a longer delay
                    await new Promise(r => setTimeout(r, 500));
                    if (exportRef.current) {
                        await waitForImages(exportRef.current, 3000);
                        const retryDataUrl = await toPng(exportRef.current, toPngOptions);
                        if (retryDataUrl && retryDataUrl.length >= 1000) {
                            console.log(`[Export] Card ${currentIndex}: retry succeeded (${retryDataUrl.length} chars)`);
                            const blob = await dataUrlToBlob(retryDataUrl);
                            if (blob && blob.size > 100) {
                                zipRef.current.file(getExportFilename(cards[currentIndex], currentIndex), blob);
                                successCountRef.current++;
                            }
                        } else {
                            console.error(`[Export] Card ${currentIndex}: retry also failed`);
                        }
                    }
                } else {
                    if (currentIndex < 5) {
                        console.log(`[Export] Card ${currentIndex + 1} (${cards[currentIndex].title}) captured in ${Date.now() - t0}ms, dataUrl size: ${dataUrl.length} chars`);
                    }

                    const blob = await dataUrlToBlob(dataUrl);
                    if (blob && blob.size > 100) {
                        zipRef.current.file(getExportFilename(cards[currentIndex], currentIndex), blob);
                        successCountRef.current++;
                    } else {
                        console.error(`[Export] Card ${currentIndex}: blob is empty or too small (${blob?.size || 0} bytes)`);
                    }
                }
            } catch (error) {
                console.error(`[Export] Error card ${currentIndex} (${cards[currentIndex]?.title}):`, error);
            } finally {
                if (!cancelledRef.current) {
                    const chunkIdx = Math.floor(currentIndex / CHUNK_SIZE);
                    onProgressRef.current(currentIndex + 1, cards.length, { chunk: chunkIdx + 1, totalChunks });

                    const isChunkBoundary = (currentIndex + 1) % CHUNK_SIZE === 0;
                    if (isChunkBoundary && currentIndex + 1 < cards.length) {
                        try {
                            const zipBlob = await zipRef.current.generateAsync({ type: 'blob', compression: 'STORE' });
                            console.log(`[Export] Chunk ${chunkIdx + 1} ZIP generated: ${(zipBlob.size / 1024).toFixed(1)} KB, ${Object.keys(zipRef.current.files).length} files`);
                            downloadBlob(zipBlob, `munchkin_cards_partie${chunkIdx + 1}_sur_${totalChunks}.zip`);
                            showNotifRef.current(`📦 Lot ${chunkIdx + 1}/${totalChunks} téléchargé !`, 'success');
                        } catch (e) {
                            console.error(`[Export] Error ZIP chunk ${chunkIdx + 1}:`, e);
                        }
                        zipRef.current = new JSZip();
                        await new Promise(r => setTimeout(r, CHUNK_PAUSE_MS));
                    }

                    isProcessingRef.current = false;
                    setCurrentIndex(prev => prev + 1);
                }
            }
        };

        const timer = setTimeout(processNext, 50);
        return () => clearTimeout(timer);
    }, [currentIndex]);

    if (currentIndex >= cards.length) return null;

    const currentCard = cards[currentIndex];
    const layoutSrc = `layouts/${getLayoutFilename(currentCard)}`;

    return (
        <div style={{ position: 'fixed', left: '-9999px', top: '-9999px' }}>
            <ExportCardRenderer
                key={currentCard.id || currentIndex}
                ref={exportRef}
                data={currentCard}
                layoutSrc={layoutSrc}
            />
        </div>
    );
};

export default BatchExportRenderer;
