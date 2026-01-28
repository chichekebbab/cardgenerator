import React, { useRef, useState, useEffect, useCallback } from 'react';
import { CardData, CardType } from '../types';
import { toPng } from 'html-to-image';
import ExportCardRenderer from './ExportCardRenderer';
import { useNotification } from './NotificationContext';
import { getExportFilename } from '../utils/layoutUtils';

interface CardPreviewProps {
    data: CardData;
    index?: number;
}

const CardPreview: React.FC<CardPreviewProps> = ({ data, index }) => {
    const cardRef = useRef<HTMLDivElement>(null);
    const exportRef = useRef<HTMLDivElement>(null);
    const [isDownloading, setIsDownloading] = useState(false);
    const { showNotification } = useNotification();

    // States pour l'image centrale (Art)
    const [imgError, setImgError] = useState(false);
    const [displaySrc, setDisplaySrc] = useState<string | undefined>(undefined);

    // States pour le fond (Layout)
    const [layoutSrc, setLayoutSrc] = useState<string>('');
    const [layoutError, setLayoutError] = useState(false);
    const [layoutTryCount, setLayoutTryCount] = useState(0);

    // --- COORDONNÉES DE RÉFÉRENCE ---
    // Coordonnées basées sur layout_monstre.png (661x1028 pixels)
    // Le composant affiche à 330x514 pixels
    const REF_WIDTH = 661;
    const REF_HEIGHT = 1028;
    const CARD_WIDTH = 330;
    const CARD_HEIGHT = 514;

    // Helper pour convertir les coordonnées de référence en px du composant
    const scaleX = (refX: number) => (refX / REF_WIDTH) * CARD_WIDTH;
    const scaleY = (refY: number) => (refY / REF_HEIGHT) * CARD_HEIGHT;

    // State pour le text fitting de la description (pour les monstres)
    const descriptionRef = useRef<HTMLDivElement>(null);
    const [descriptionFontSize, setDescriptionFontSize] = useState(13);

    // Text Fitter: réduit la taille de police si le texte déborde
    useEffect(() => {
        if (!descriptionRef.current) return;

        const container = descriptionRef.current;
        const maxHeight = scaleY(500 - 229); // Hauteur max disponible

        // Reset to base size
        let fontSize = 13;
        setDescriptionFontSize(fontSize);

        // Use requestAnimationFrame to ensure DOM is updated
        requestAnimationFrame(() => {
            while (container.scrollHeight > maxHeight && fontSize > 8) {
                fontSize -= 0.5;
                setDescriptionFontSize(fontSize);
            }
        });
    }, [data.description, data.badStuff, data.restrictions, data.type]);

    // --- GESTION IMAGE CENTRALE (Art) ---
    useEffect(() => {
        setImgError(false);

        if (data.imageData) {
            setDisplaySrc(`data:image/png;base64,${data.imageData}`);
            return;
        }

        if (data.storedImageUrl) {
            const url = data.storedImageUrl.trim();
            // Vérification basique
            if (!url.startsWith('http') && !url.startsWith('data:')) {
                setImgError(true);
                setDisplaySrc(undefined);
                return;
            }

            // Gestion Google Drive
            const idMatch = url.match(/\/d\/([a-zA-Z0-9_-]+)|[?&]id=([a-zA-Z0-9_-]+)/);
            if (idMatch) {
                const id = idMatch[1] || idMatch[2];
                setDisplaySrc(`https://lh3.googleusercontent.com/d/${id}`);
            } else {
                setDisplaySrc(url);
            }
        } else {
            setDisplaySrc(undefined);
        }
    }, [data.imageData, data.storedImageUrl]);

    // --- GESTION DU FOND (LAYOUT) ---
    const getLayoutFilename = useCallback(() => {
        if (data.type === CardType.CLASS) return 'layout_class.png';
        if (data.type === CardType.RACE) return 'layout_race.png';
        if (data.type === CardType.CURSE) return 'layout_malediction.png';
        if (data.type === CardType.ITEM) {
            if (data.itemSlot === 'Amélioration') return 'layout_malediction.png';
            if (data.itemSlot || data.isBig) return 'layout_equipement.png';
            return 'layout_item.png';
        }
        if (data.type === CardType.LEVEL_UP) return 'layout_lvlup.png';
        if (data.type === CardType.FAITHFUL_SERVANT) return 'layout_malediction.png';
        if (data.type === CardType.DUNGEON_TRAP || data.type === CardType.DUNGEON_BONUS || data.type === CardType.TREASURE_TRAP) return 'layout_malediction.png';
        return 'layout_monstre.png';
    }, [data.type, data.itemSlot, data.isBig]);

    useEffect(() => {
        const filename = getLayoutFilename();
        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/189801d3-a0b6-4ecb-8ee2-4fabaa314149', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'CardPreview.tsx:64', message: 'useEffect layout - filename computed', data: { filename, cardType: data.type, baseUrl: window.location.href, pathname: window.location.pathname }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId: 'A' }) }).catch(() => { });
        // #endregion
        // 1. D'abord on essaie le chemin relatif 'layouts/...' 
        // C'est le plus robuste pour les déploiements (GitHub Pages, etc.) où l'app n'est pas à la racine
        const initialPath = `layouts/${filename}`;
        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/189801d3-a0b6-4ecb-8ee2-4fabaa314149', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'CardPreview.tsx:69', message: 'Setting initial layoutSrc', data: { initialPath, resolvedUrl: new URL(initialPath, window.location.href).href }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId: 'A' }) }).catch(() => { });
        // #endregion
        setLayoutSrc(initialPath);
        setLayoutError(false);
        setLayoutTryCount(0);
    }, [getLayoutFilename]);

    const handleLayoutError = (event: any) => {
        const filename = getLayoutFilename();
        // #region agent log
        const errorTarget = event?.target;
        const errorSrc = errorTarget?.src || errorTarget?.currentSrc || layoutSrc;
        const errorHref = errorTarget?.href;
        fetch('http://127.0.0.1:7243/ingest/189801d3-a0b6-4ecb-8ee2-4fabaa314149', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'CardPreview.tsx:73', message: 'handleLayoutError called', data: { filename, layoutTryCount, currentLayoutSrc: layoutSrc, errorSrc, errorHref, baseUrl: window.location.href, computedAbsolute: new URL(layoutSrc, window.location.href).href }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId: 'B' }) }).catch(() => { });
        // #endregion

        if (layoutTryCount === 0) {
            // Tentative 2: Peut-être que l'utilisateur a mis les images à la racine de public/ ?
            // ou que le mapping de dossiers est différent
            console.warn(`Layout non trouvé dans layouts/, tentative à la racine: ${filename}`);
            const nextPath = filename;
            // #region agent log
            fetch('http://127.0.0.1:7243/ingest/189801d3-a0b6-4ecb-8ee2-4fabaa314149', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'CardPreview.tsx:80', message: 'Tentative 2 - root path', data: { nextPath, resolvedUrl: new URL(nextPath, window.location.href).href }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId: 'C' }) }).catch(() => { });
            // #endregion
            setLayoutSrc(nextPath);
            setLayoutTryCount(1);
        } else if (layoutTryCount === 1) {
            // Tentative 3: Forcer le chemin absolu /layouts/ (pour serveur local strict)
            console.warn(`Tentative chemin absolu: /layouts/${filename}`);
            const nextPath = `/layouts/${filename}`;
            // #region agent log
            fetch('http://127.0.0.1:7243/ingest/189801d3-a0b6-4ecb-8ee2-4fabaa314149', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'CardPreview.tsx:86', message: 'Tentative 3 - absolute path', data: { nextPath, resolvedUrl: new URL(nextPath, window.location.href).href }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId: 'D' }) }).catch(() => { });
            // #endregion
            setLayoutSrc(nextPath);
            setLayoutTryCount(2);
        } else {
            // #region agent log
            fetch('http://127.0.0.1:7243/ingest/189801d3-a0b6-4ecb-8ee2-4fabaa314149', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'CardPreview.tsx:89', message: 'All layout paths failed', data: { filename, pathsTested: [`layouts/${filename}`, filename, `/layouts/${filename}`], finalError: true }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId: 'E' }) }).catch(() => { });
            // #endregion
            console.error(`Erreur chargement layout définitive pour ${filename}. Chemins testés: layouts/${filename}, ${filename}, /layouts/${filename}`);
            setLayoutError(true);
        }
    };

    const handleDownload = async () => {
        setIsDownloading(true);

        try {
            // Attendre le rendu du composant d'export
            await new Promise(resolve => setTimeout(resolve, 500));

            if (!exportRef.current) {
                console.error("Export ref not found");
                return;
            }

            // Utiliser html-to-image qui gère mieux les CSS transforms
            const dataUrl = await toPng(exportRef.current, {
                quality: 1.0,
                pixelRatio: 1,
                cacheBust: true
            });

            const filename = getExportFilename(data, index);

            const link = document.createElement("a");
            link.href = dataUrl;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (err) {
            console.error("Erreur lors du téléchargement :", err);
            showNotification("Impossible de générer l'image. Vérifiez que toutes les images sont chargées.", 'error');
        } finally {
            setIsDownloading(false);
        }
    };

    // --- COMPOSANTS DE L'IMAGE ---
    const CardImage = ({ className }: { className?: string }) => {
        // Permet de surcharger overflow-hidden si "overflow-visible" est passé dans className
        const baseClass = `w-full relative bg-gray-200/50 ${className?.includes('overflow-visible') ? '' : 'overflow-hidden'} ${className}`;

        return (
            <div className={baseClass}>
                {displaySrc && !imgError ? (
                    <img
                        src={displaySrc}
                        alt="Art"
                        crossOrigin="anonymous"
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-contain mix-blend-multiply transition-transform duration-200"
                        style={{
                            transform: `scale(${((data.imageScale || 100) / 100) * 1.3}) translate(${data.imageOffsetX || 0}%, ${data.imageOffsetY || 0}%)`
                        }}
                        onError={() => setImgError(true)}
                    />
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-gray-500/50 text-center p-4">
                        {imgError ? "❌ Donnée Invalide" : "L'image générée apparaîtra ici"}
                    </div>
                )}
            </div>
        );
    };

    // --- STYLES & THÈMES ---
    const isTreasure = data.type === CardType.ITEM;

    // Couleurs de base
    const colors = isTreasure ? {
        border: 'border-[#b8860b]', // Or
        text: 'text-[#5c4033]',
    } : {
        border: 'border-[#4a3b2a]', // Brun
        text: 'text-[#2c241b]',
    };

    // Helper pour les infos des losanges
    const getDiamondInfo = () => {
        const baseStyle = "diamond-style";

        switch (data.type) {
            case CardType.MONSTER:
                return {
                    style: baseStyle,
                    label: 'NIVEAU',
                    value: data.level,
                    textColor: 'text-white'
                };
            case CardType.ITEM:
                return {
                    style: baseStyle,
                    label: 'BONUS',
                    value: data.bonus !== '' ? `+${data.bonus}` : '',
                    textColor: 'text-white'
                };
            case CardType.CURSE:
                return { style: baseStyle, label: '', value: '', textColor: 'text-white' };
            case CardType.CLASS:
                return { style: baseStyle, label: '', value: '', textColor: 'text-white' };
            case CardType.LEVEL_UP:
                return {
                    style: baseStyle,
                    label: 'BONUS',
                    value: data.bonus !== '' ? `+${data.bonus}` : '',
                    textColor: 'text-white'
                };
            case CardType.FAITHFUL_SERVANT:
                return {
                    style: baseStyle,
                    label: 'BONUS',
                    value: data.bonus !== '' ? `+${data.bonus}` : '',
                    textColor: 'text-white'
                };
            case CardType.DUNGEON_TRAP:
            case CardType.DUNGEON_BONUS:
            case CardType.TREASURE_TRAP:
                return {
                    style: baseStyle,
                    label: 'BONUS',
                    value: data.bonus !== '' ? `+${data.bonus}` : '',
                    textColor: 'text-white'
                };
            default:
                return { style: baseStyle, label: '', value: '', textColor: 'text-white' };
        }
    };

    // --- RENDU : TYPE 1 (NOUVEAUX LAYOUTS PNG) ---
    const renderStandardLayout = () => {
        const diamond = getDiamondInfo();

        return (
            <div
                ref={cardRef}
                className="relative w-[330px] h-[514px] rounded-[10px] overflow-hidden group shadow-card bg-[#100c08]"
            >
                {/* COUCHE 0 : Fond Parchemin (Sécurité si l'image png a de la transparence ou charge mal) */}
                <div className="absolute inset-0 z-0 bg-parchment-body">
                    {layoutError && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-red-600 font-bold bg-white/90 p-4 text-center text-sm z-50 border-4 border-red-500">
                            <div className="text-2xl mb-2">⚠️</div>
                            <div>Image de fond manquante</div>
                            <div className="text-[10px] font-mono mt-2 bg-gray-100 p-1 rounded text-gray-600 max-w-full break-all">
                                {getLayoutFilename()}
                            </div>
                            <div className="text-[10px] mt-2 font-normal text-gray-800 leading-tight">
                                Dossier attendu :<br />
                                <code className="font-bold">/public/layouts/</code><br />
                                <span className="italic">Redémarrez le serveur si dossier créé récemment.</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* COUCHE 1 : Image de Fond PNG (Layout) */}
                <div className="absolute inset-0 z-[1]">
                    <img
                        key={layoutSrc} // Force le re-render si la source change
                        src={layoutSrc}
                        alt={`Fond ${data.type}`}
                        className="w-full h-full object-cover"
                        crossOrigin="anonymous"
                        onError={handleLayoutError}
                        onLoad={() => {
                            // #region agent log
                            fetch('http://127.0.0.1:7243/ingest/189801d3-a0b6-4ecb-8ee2-4fabaa314149', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'CardPreview.tsx:223', message: 'Layout image loaded successfully', data: { layoutSrc, resolvedUrl: new URL(layoutSrc, window.location.href).href }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId: 'F' }) }).catch(() => { });
                            // #endregion
                        }}
                    />
                </div>

                {/* COUCHE 2 : CONTENU (Superposé au layout - Positionnement Absolu UNIFIÉ) */}
                <div className="absolute inset-0 z-[10]">

                    {/* 1. NIVEAUX / BONUS (Haut Gauche & Haut Droite) */}
                    {/* Centrés sur 108;119 et 550;119 */}
                    {diamond.value && (
                        <>
                            <div className="absolute pointer-events-none z-30"
                                style={{
                                    left: scaleX(108),
                                    top: scaleY(119),
                                }}>
                                <span className="font-munchkin-title font-bold text-white text-shadow-strong leading-none block transform -translate-x-1/2 -translate-y-1/2"
                                    style={{ fontSize: '1.4rem' }}>
                                    {diamond.value}
                                </span>
                            </div>
                            <div className="absolute pointer-events-none z-30"
                                style={{
                                    left: scaleX(550),
                                    top: scaleY(119),
                                }}>
                                <span className="font-munchkin-title font-bold text-white text-shadow-strong leading-none block transform -translate-x-1/2 -translate-y-1/2"
                                    style={{ fontSize: '1.4rem' }}>
                                    {diamond.value}
                                </span>
                            </div>
                        </>
                    )}

                    {/* 2. TITRE */}
                    {/* Centré verticalement sur Y=133, contraint horizontalement entre 169 et 488 */}
                    <div className="absolute z-30 text-center transform -translate-y-1/2"
                        style={{
                            left: scaleX(169),
                            top: scaleY(133),
                            width: scaleX(488 - 169),
                        }}>
                        <h2 className="font-munchkin-title font-bold uppercase tracking-wide text-[#5C1B15] leading-[1.15] break-words"
                            style={{ fontSize: '1.1rem' }}>
                            {data.title}
                        </h2>
                    </div>

                    {/* 3. DESCRIPTION - Masquée pour LEVEL_UP si vide */}
                    {(data.type !== CardType.LEVEL_UP || data.description.trim() !== '') && (
                        <div className="absolute z-30"
                            ref={descriptionRef}
                            style={{
                                left: scaleX(60),
                                top: scaleY(229),
                                width: scaleX(600 - 60),
                                maxHeight: scaleY(500 - 229),
                                overflow: 'hidden',
                                backgroundImage: 'url(/texture/texture_description.png)',
                                backgroundSize: 'cover',
                                backgroundPosition: 'center',
                                borderRadius: '4px',
                                border: '2px solid #5a4a3a',
                                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.15), inset 0 -1px 0 rgba(0, 0, 0, 0.2)'
                            }}>
                            {/* Overlay vignette - assombrit uniquement les bords */}
                            <div className="absolute inset-0 pointer-events-none rounded-[2px]"
                                style={{
                                    background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0, 0, 0, 0.35) 100%)'
                                }}
                            />
                            <div className="relative w-full text-center font-munchkin-body font-medium text-black p-2"
                                style={{ fontSize: `${descriptionFontSize}px`, lineHeight: '1.1' }}>
                                {data.restrictions && (
                                    <div className="font-bold uppercase mb-1">{data.restrictions}</div>
                                )}
                                {data.description && data.description.trim() !== '' && <p>{data.description}</p>}
                                {/* Affichage de l'Incident Fâcheux ou Effect si applicable */}
                                {(data.type === CardType.MONSTER && data.badStuff) && (
                                    <div className="mt-2 text-left border-t border-black/20 pt-1">
                                        <span className="font-bold">Incident Fâcheux : </span>
                                        <span className="italic">{data.badStuff}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* 4. IMAGE (Bas - Espace restant) */}
                    {/* Je la place sous la zone de description (Y=500) jusqu'en bas (Y=900 approx) */}
                    <div className="absolute z-20 flex items-center justify-center overflow-visible"
                        style={{
                            left: scaleX(60),
                            top: scaleY(510),
                            width: scaleX(600 - 60),
                            height: scaleY(400) // ~510 -> 910
                        }}>
                        <CardImage className="w-full h-full object-contain mix-blend-multiply bg-transparent overflow-visible" />
                    </div>

                    {/* 5. VARIABLES DE BAS DE CARTE */}

                    {/* COIN GAUCHE (90;914) : Niveaux Gagnés, Gros, Emplacement */}
                    <div className="absolute z-30 flex flex-col items-start"
                        style={{ left: scaleX(90), top: scaleY(914) }}>

                        {data.type === CardType.MONSTER && data.levelsGained && (
                            <span className="font-medieval font-bold text-[#682A22] whitespace-nowrap"
                                style={{ fontSize: '0.9rem' }}>
                                {data.levelsGained} Niv.
                            </span>
                        )}

                        {data.type === CardType.ITEM && (
                            <div className="relative">
                                {data.isBig && (
                                    <span className="font-medieval font-bold text-[#682A22] whitespace-nowrap absolute bottom-full left-0 mb-[-0.1rem]"
                                        style={{ fontSize: '0.9rem' }}>
                                        Gros
                                    </span>
                                )}
                                {data.itemSlot && data.itemSlot !== 'NoSlot' && data.itemSlot !== 'Amélioration' ? (
                                    <span className="font-medieval font-bold text-[#682A22] whitespace-nowrap block"
                                        style={{ fontSize: '0.9rem' }}>
                                        {data.itemSlot}
                                    </span>
                                ) : (
                                    /* Espace réservé pour maintenir la position si pas de slot */
                                    <span className="block h-[0.9rem]">&nbsp;</span>
                                )}
                            </div>
                        )}
                    </div>

                    {/* COIN DROIT (390;914) : Trésor / Or - Masqué pour FAITHFUL_SERVANT et Amélioration */}
                    {data.type !== CardType.FAITHFUL_SERVANT && !(data.type === CardType.ITEM && data.itemSlot === 'Amélioration') && (
                        <div className="absolute z-30 flex flex-col items-start"
                            style={{ left: scaleX(390), top: scaleY(914) }}>

                            <span className="font-medieval font-bold text-[#682A22] whitespace-nowrap block"
                                style={{ fontSize: '0.9rem' }}>
                                {data.gold ? data.gold : (
                                    <>
                                        {data.type === CardType.ITEM && "Sans Valeur"}
                                        {data.type === CardType.MONSTER && "Pas de Trésor"}
                                        {data.type !== CardType.ITEM && data.type !== CardType.MONSTER && data.type !== CardType.DUNGEON_TRAP && data.type !== CardType.DUNGEON_BONUS && data.type !== CardType.TREASURE_TRAP && (
                                            <span className="opacity-80">{data.type}</span>
                                        )}
                                    </>
                                )}
                            </span>
                        </div>
                    )}

                </div>
            </div>
        );
    };



    return (
        <div className="flex flex-col items-center justify-center p-8 bg-wood-pattern min-h-[600px] gap-8">

            {renderStandardLayout()}

            <button
                onClick={handleDownload}
                disabled={isDownloading}
                className="group flex items-center gap-2 px-6 py-3 bg-amber-700 text-amber-50 font-bold rounded-full shadow-lg hover:bg-amber-600 transition-all transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed border-2 border-amber-900"
            >
                {isDownloading ? (
                    <svg className="animate-spin h-5 w-5 text-amber-200" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                )}
                {isDownloading ? 'Traitement...' : 'Télécharger la Carte'}
            </button>

            <style>{`
        .clip-polygon {
            clip-path: polygon(0 0, 100% 0, 95% 100%, 5% 100%);
        }
      `}</style>
            {isDownloading && (
                <div style={{ position: 'fixed', left: '-9999px', top: '-9999px' }}>
                    <ExportCardRenderer
                        ref={exportRef}
                        data={data}
                        layoutSrc={layoutSrc}
                    />
                </div>
            )}
        </div>
    );
};

export default CardPreview;