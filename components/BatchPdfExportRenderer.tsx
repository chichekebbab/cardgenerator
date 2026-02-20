import React, { useState, useEffect, useRef } from 'react';
import { CardData } from '../types';
import ExportCardRenderer from './ExportCardRenderer';
import { getLayoutFilename, getCardCategory } from '../utils/layoutUtils';
import { toJpeg, getFontEmbedCSS } from 'html-to-image';
import { jsPDF } from 'jspdf';
import { useNotification } from './NotificationContext';

interface BatchPdfExportRendererProps {
    cards: CardData[];
    onComplete: () => void;
    onProgress: (current: number, total: number, chunkInfo?: { chunk: number; totalChunks: number }) => void;
}

const CHUNK_SIZE = 81; // 9 cards per page * 9 pages max per PDF (~80 cards)
const CARDS_PER_PAGE = 9;
const GC_PAUSE_INTERVAL = 9; // Pause after every page
const GC_PAUSE_MS = 200;

// Dimensions (mm)
const PAGE_W = 210;
const PAGE_H = 297;
const CARD_W = 56;
const CARD_H = 88;
const COLS = 3;
const ROWS = 3;
const CUT_LINE_WIDTH = 0.1;

const MARGIN_X = (PAGE_W - COLS * CARD_W) / 2;
const MARGIN_Y = (PAGE_H - ROWS * CARD_H) / 2;

// Colors
const COLOR_BG_FACE = "#0d0804";
const COLOR_BG_BACK_TRESOR = "#051471";
const COLOR_BG_BACK_DONJON = "#0d0804";

const BatchPdfExportRenderer: React.FC<BatchPdfExportRendererProps> = ({ cards, onComplete, onProgress }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const exportRef = useRef<HTMLDivElement>(null);
    const pdfRef = useRef<jsPDF | null>(null);
    const capturedCardsRef = useRef<{ imgData: string; category: string }[]>([]);

    const isProcessingRef = useRef(false);
    const cancelledRef = useRef(false);
    const fontCSSRef = useRef<string | undefined>(undefined);
    const fontCSSComputedRef = useRef(false);

    // Preload back images
    const backImagesRef = useRef<{ [key: string]: string }>({});

    const { showNotification } = useNotification();

    const onCompleteRef = useRef(onComplete);
    const onProgressRef = useRef(onProgress);
    const showNotifRef = useRef(showNotification);

    useEffect(() => {
        onCompleteRef.current = onComplete;
        onProgressRef.current = onProgress;
        showNotifRef.current = showNotification;
    });

    const totalChunks = Math.ceil(cards.length / CHUNK_SIZE);

    const getBackImageForCategory = (category: string) => {
        if (category === 'Donjon') return backImagesRef.current['Donjon'];
        return backImagesRef.current['Tresor'];
    };

    const loadImage = (src: string): Promise<string> => {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'Anonymous';
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = img.naturalWidth;
                canvas.height = img.naturalHeight;
                const ctx = canvas.getContext('2d');
                if (ctx) {
                    ctx.drawImage(img, 0, 0);
                    resolve(canvas.toDataURL('image/jpeg', 0.9));
                } else {
                    reject(new Error('Canvas context failed'));
                }
            };
            img.onerror = (e) => reject(e);
            img.src = src;
        });
    };

    useEffect(() => {
        cancelledRef.current = false;
        isProcessingRef.current = false;
        capturedCardsRef.current = [];
        pdfRef.current = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
        });

        const loadResources = async () => {
            try {
                const donjonBack = await loadImage('/layouts/layout_back_donjon.png');
                const tresorBack = await loadImage('/layouts/layout_back_tresors.png');

                backImagesRef.current = {
                    'Donjon': donjonBack,
                    'Tresor': tresorBack
                };

                const uniqueLayouts = new Set(cards.map(c => `layouts/${getLayoutFilename(c)}`));
                uniqueLayouts.add('/texture/texture_description.png');

                const preloadPromises: Promise<void>[] = [];
                uniqueLayouts.forEach(src => {
                    const p = new Promise<void>((resolve) => {
                        const img = new Image();
                        img.crossOrigin = 'anonymous';
                        img.onload = () => resolve();
                        img.onerror = () => resolve();
                        img.src = src;
                    });
                    preloadPromises.push(p);
                });

                await Promise.all(preloadPromises);
                console.log('[PDF Export] Resources loaded');

            } catch (e) {
                console.error('[PDF Export] Failed to load resources', e);
                showNotifRef.current('Erreur de chargement des ressources', 'error');
            }
        };

        loadResources();

        return () => {
            cancelledRef.current = true;
        };
    }, []);

    const waitForImages = (container: HTMLElement, timeoutMs = 5000): Promise<void> => {
        return new Promise<void>((resolve) => {
            const images = container.querySelectorAll('img');
            if (images.length === 0) { resolve(); return; }

            let pending = 0;
            let resolved = false;
            const done = () => { if (!resolved) { resolved = true; resolve(); } };

            const timeout = setTimeout(() => {
                if (!resolved) {
                    console.warn(`[PDF Export] Image wait timeout`);
                    done();
                }
            }, timeoutMs);

            images.forEach((img) => {
                if (img.complete && img.naturalWidth > 0) return;
                pending++;
                const onFinish = () => {
                    pending--;
                    if (pending <= 0) { clearTimeout(timeout); done(); }
                };
                img.addEventListener('load', onFinish, { once: true });
                img.addEventListener('error', onFinish, { once: true });
            });

            if (pending === 0) { clearTimeout(timeout); done(); }
        });
    };

    useEffect(() => {
        const processNext = async () => {
            if (cancelledRef.current) return;

            if (currentIndex >= cards.length) {
                if (capturedCardsRef.current.length > 0) {
                    await generatePdfPages();
                }
                onCompleteRef.current();
                return;
            }

            if (isProcessingRef.current) return;
            isProcessingRef.current = true;

            try {
                await new Promise(r => setTimeout(r, 50));

                if (!exportRef.current) {
                    isProcessingRef.current = false;
                    return;
                }

                if (!fontCSSComputedRef.current) {
                    fontCSSComputedRef.current = true;
                    try {
                        const fontPromise = getFontEmbedCSS(exportRef.current);
                        const racePromise = new Promise<string>((_, r) => setTimeout(() => r('timeout'), 5000));
                        fontCSSRef.current = await Promise.race([fontPromise, racePromise]);
                    } catch (e) {
                        console.warn('[PDF Export] Font CSS failed or timed out', e);
                    }
                }

                await waitForImages(exportRef.current);

                const options = {
                    quality: 0.85,
                    pixelRatio: 1,
                    cacheBust: false,
                    fontEmbedCSS: fontCSSRef.current
                };

                const imgData = await toJpeg(exportRef.current, options);

                capturedCardsRef.current.push({
                    imgData,
                    category: getCardCategory(cards[currentIndex])
                });

                if (capturedCardsRef.current.length % CARDS_PER_PAGE === 0) {
                    await new Promise(r => setTimeout(r, GC_PAUSE_MS));
                }

                if (capturedCardsRef.current.length >= CHUNK_SIZE) {
                    await generatePdfPages();
                    pdfRef.current = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
                    capturedCardsRef.current = [];

                    await new Promise(r => setTimeout(r, 1000));
                }

            } catch (err) {
                console.error(`[PDF Export] Error processing card ${currentIndex}`, err);
            } finally {
                if (!cancelledRef.current) {
                    const chunkIdx = Math.floor(currentIndex / CHUNK_SIZE);
                    onProgressRef.current(currentIndex + 1, cards.length, { chunk: chunkIdx + 1, totalChunks });
                    setCurrentIndex(prev => prev + 1);
                    isProcessingRef.current = false;
                }
            }
        };

        const timer = setTimeout(processNext, 50);
        return () => clearTimeout(timer);
    }, [currentIndex, cards.length]);

    const generatePdfPages = async () => {
        if (!pdfRef.current || capturedCardsRef.current.length === 0) return;

        const pdf = pdfRef.current;
        const totalCards = capturedCardsRef.current.length;
        const totalPages = Math.ceil(totalCards / CARDS_PER_PAGE);

        console.log(`[PDF Export] Generating PDF with ${totalCards} cards (${totalPages} pages)...`);

        for (let p = 0; p < totalPages; p++) {
            const startIdx = p * CARDS_PER_PAGE;
            const pageCards = capturedCardsRef.current.slice(startIdx, startIdx + CARDS_PER_PAGE);

            // --- PAGE RECTO (FACES) ---
            if (p > 0 || pdf.internal.getNumberOfPages() > 1) pdf.addPage();

            pdf.setFillColor(COLOR_BG_FACE);
            pdf.rect(0, 0, PAGE_W, PAGE_H, 'F');
            drawCutLines(pdf);

            pageCards.forEach((card, i) => {
                const col = i % COLS;
                const row = Math.floor(i / COLS);
                const x = MARGIN_X + col * CARD_W;
                const y_pdf = MARGIN_Y + row * CARD_H;
                pdf.addImage(card.imgData, 'JPEG', x, y_pdf, CARD_W, CARD_H);
            });

            // --- PAGE VERSO (BACKS) ---
            pdf.addPage();

            const firstCardCat = pageCards[0].category;
            const bgCol = firstCardCat === 'Donjon' ? COLOR_BG_BACK_DONJON : COLOR_BG_BACK_TRESOR;

            pdf.setFillColor(bgCol);
            pdf.rect(0, 0, PAGE_W, PAGE_H, 'F');
            drawCutLines(pdf);

            pageCards.forEach((card, i) => {
                const col = i % COLS;
                const row = Math.floor(i / COLS);

                // MIRROR COLUMN for back side
                const col_mirror = (COLS - 1) - col;
                const x = MARGIN_X + col_mirror * CARD_W;
                const y_pdf = MARGIN_Y + row * CARD_H;

                const backImg = getBackImageForCategory(card.category);
                if (backImg) {
                    pdf.addImage(backImg, 'PNG', x, y_pdf, CARD_W, CARD_H);
                }
            });
        }

        const chunkIdx = Math.floor((currentIndex - 1) / CHUNK_SIZE);
        const fileName = totalChunks > 1
            ? `munchkin_bat_partie${chunkIdx + 1}.pdf`
            : `munchkin_bat.pdf`;

        pdf.save(fileName);
        showNotifRef.current(`📄 PDF généré : ${fileName}`, 'success');
    };

    const drawCutLines = (doc: jsPDF) => {
        doc.setDrawColor(255, 255, 255);
        doc.setLineWidth(CUT_LINE_WIDTH);

        for (let col = 0; col <= COLS; col++) {
            const x = MARGIN_X + col * CARD_W;
            doc.line(x, 0, x, MARGIN_Y);
            doc.line(x, PAGE_H - MARGIN_Y, x, PAGE_H);
        }

        for (let row = 0; row <= ROWS; row++) {
            const y = MARGIN_Y + row * CARD_H;
            doc.line(0, y, MARGIN_X, y);
            doc.line(PAGE_W - MARGIN_X, y, PAGE_W, y);
        }
    };

    if (currentIndex >= cards.length) return null;
    const currentCard = cards[currentIndex];

    return (
        <div style={{ position: 'fixed', left: '-10000px', top: '-10000px' }}>
            <ExportCardRenderer
                ref={exportRef}
                data={currentCard}
                layoutSrc={`layouts/${getLayoutFilename(currentCard)}`}
            />
        </div>
    );
};

export default BatchPdfExportRenderer;
