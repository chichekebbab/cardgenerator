import React, { useState, useEffect, useRef } from 'react';
import { CardData } from '../types';
import ExportCardRenderer from './ExportCardRenderer';
import { getLayoutFilename, getCardCategory } from '../utils/layoutUtils';
import { toPng } from 'html-to-image';
import JSZip from 'jszip';
import { useNotification } from './NotificationContext';

interface BatchExportRendererProps {
    cards: CardData[];
    onComplete: () => void;
    onProgress: (current: number, total: number) => void;
}

const BatchExportRenderer: React.FC<BatchExportRendererProps> = ({ cards, onComplete, onProgress }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const exportRef = useRef<HTMLDivElement>(null);
    const zipRef = useRef<JSZip>(new JSZip());
    const isProcessingRef = useRef(false);
    const { showNotification } = useNotification();

    useEffect(() => {
        const processNext = async () => {
            if (currentIndex >= cards.length) {
                // Terminé : Générer et Télécharger le ZIP
                try {
                    const content = await zipRef.current.generateAsync({ type: 'blob' });
                    const link = document.createElement("a");
                    link.href = URL.createObjectURL(content);
                    link.download = "munchkin_cards.zip";
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                } catch (e) {
                    console.error("Error generating zip", e);
                    showNotification("Erreur lors de la création du fichier ZIP.", 'error');
                }
                onComplete();
                return;
            }

            if (isProcessingRef.current) return;
            isProcessingRef.current = true;

            try {
                // Attendre le rendu du layout et de l'image
                await new Promise(resolve => setTimeout(resolve, 500));

                if (exportRef.current) {
                    const dataUrl = await toPng(exportRef.current, {
                        quality: 1.0,
                        pixelRatio: 1,
                        cacheBust: true
                    });

                    // Convertir dataUrl en blob
                    const response = await fetch(dataUrl);
                    const blob = await response.blob();

                    if (blob) {
                        const card = cards[currentIndex];

                        // Déterminer la catégorie (Donjon ou Trésor)
                        const category = getCardCategory(card);

                        // Nettoyer le type de carte (remplacer espaces par tirets, enlever accents)
                        const cardType = card.type
                            .normalize("NFD")
                            .replace(/[\u0300-\u036f]/g, "") // Enlever les accents
                            .replace(/\s+/g, '-'); // Remplacer espaces par tirets

                        // Numéro de la carte (3 chiffres)
                        const cardNumber = String(currentIndex + 1).padStart(3, '0');

                        // Nettoyer le nom de la carte (enlever caractères spéciaux, garder underscores et tirets)
                        const cleanTitle = (card.title || "carte")
                            .normalize("NFD")
                            .replace(/[\u0300-\u036f]/g, "") // Enlever les accents
                            .replace(/[^a-z0-9\-_]/gi, '-') // Remplacer caractères spéciaux par tirets
                            .replace(/-+/g, '-') // Remplacer tirets multiples par un seul
                            .replace(/^-|-$/g, '') // Enlever tirets au début et à la fin
                            .toLowerCase();

                        // Format final : CATEGORIE_TYPE-DE-CARTE_NUMERO-DE-LA-CARTE_NOM
                        const filename = `${category}_${cardType}_${cardNumber}_${cleanTitle}.png`;

                        zipRef.current.file(filename, blob);
                    }
                }
            } catch (error) {
                console.error("Error exporting card index", currentIndex, error);
            } finally {
                onProgress(currentIndex + 1, cards.length);
                isProcessingRef.current = false;
                setCurrentIndex(prev => prev + 1);
            }
        };

        // Petit délai initial pour s'assurer que le re-render a eu lieu et que le DOM est à jour pour la nouvelle carte
        const timer = setTimeout(processNext, 100);
        return () => clearTimeout(timer);

    }, [currentIndex, cards, onComplete, onProgress]); // Dépendances strictes

    if (currentIndex >= cards.length) return null;

    const currentCard = cards[currentIndex];

    // Détermination layout
    const layoutFilename = getLayoutFilename(currentCard);
    // On suppose que les layouts sont dans public/layouts/
    // Pour l'export batch, on utilise le chemin relatif standard qui devrait marcher
    const layoutSrc = `layouts/${layoutFilename}`;

    return (
        <div style={{ position: 'fixed', left: '-9999px', top: '-9999px' }}>
            {/* Clé unique pour forcer le remount complet à chaque carte et éviter les leaks d'état */}
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
