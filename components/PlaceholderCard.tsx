import React from 'react';
import { CardType } from '../types';
import { getRecommendedValues } from '../utils/balancingConfig';

interface PlaceholderCardProps {
    level: number;
    type: CardType;
    onClick: () => void;
}

/**
 * Composant pour afficher une carte manquante (placeholder)
 * Affiche uniquement le niveau du monstre avec un style grisé
 */
const PlaceholderCard: React.FC<PlaceholderCardProps> = ({ level, type, onClick }) => {
    const recommended = getRecommendedValues(level);

    return (
        <div
            onClick={onClick}
            className="relative aspect-[2.5/3.5] rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 hover:bg-gray-100 hover:border-gray-400 cursor-pointer transition-all duration-200 flex flex-col items-center justify-center gap-2 opacity-60 hover:opacity-80 group"
            title={`Créer une carte ${type} de niveau ${level}`}
        >
            {/* Icône centrale */}
            <div className="text-4xl text-gray-400 group-hover:text-gray-500 transition-colors">
                ➕
            </div>

            {/* Niveau */}
            <div className="absolute top-3 left-3 bg-white/80 rounded-full w-10 h-10 flex items-center justify-center border border-gray-300 shadow-sm">
                <span className="text-lg font-bold text-gray-600">{level}</span>
            </div>

            {/* Badge "Manquante" */}
            <div className="absolute bottom-2 left-2 right-2">
                <div className="bg-gray-200/80 backdrop-blur-sm rounded px-2 py-1 text-center">
                    <p className="text-xs font-semibold text-gray-600">Carte manquante</p>
                    {recommended.exists && (
                        <p className="text-xxs text-gray-500">
                            {recommended.treasuresGained} trésors · {recommended.levelsGained} niveau{recommended.levelsGained > 1 ? 'x' : ''}
                        </p>
                    )}
                </div>
            </div>

            {/* Overlay au survol */}
            <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-amber-500/0 to-amber-600/0 group-hover:from-amber-500/10 group-hover:to-amber-600/10 transition-all duration-200 pointer-events-none" />
        </div>
    );
};

export default PlaceholderCard;
