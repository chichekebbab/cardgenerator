import React from 'react';
import { CardData } from '../types';

interface CardNavigationProps {
    currentCard: CardData;
    sameTypeCards: CardData[];
    onNavigate: (direction: 'prev' | 'next') => void;
}

const CardNavigation: React.FC<CardNavigationProps> = ({
    currentCard,
    sameTypeCards,
    onNavigate,
}) => {
    // Don't show navigation if there's only one card or none
    if (sameTypeCards.length <= 1) {
        return null;
    }

    const currentIndex = sameTypeCards.findIndex(c => c.id === currentCard.id);

    // Always enable navigation for circular navigation
    const prevIndex = currentIndex > 0 ? currentIndex - 1 : sameTypeCards.length - 1;
    const nextIndex = currentIndex < sameTypeCards.length - 1 ? currentIndex + 1 : 0;

    const prevCard = sameTypeCards[prevIndex];
    const nextCard = sameTypeCards[nextIndex];

    return (
        <div className="flex items-center justify-between gap-4 bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-200 rounded-lg p-3 shadow-sm">
            {/* Previous Button */}
            <button
                onClick={() => onNavigate('prev')}
                className="flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all bg-amber-600 hover:bg-amber-700 text-white shadow-md hover:shadow-lg hover:scale-105 active:scale-95"
                title={`Carte précédente : ${prevCard?.title || 'Sans titre'}`}
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span className="hidden sm:inline">Précédent</span>
            </button>

            {/* Card Counter */}
            <div className="flex flex-col items-center justify-center flex-grow">
                <div className="text-sm font-bold text-amber-900">
                    {currentCard.type}
                </div>
                <div className="text-xs text-gray-600">
                    Carte {currentIndex + 1} sur {sameTypeCards.length}
                </div>
                <div className="text-[10px] text-gray-400 mt-0.5 hidden md:block">
                    ← → pour naviguer
                </div>
            </div>

            {/* Next Button */}
            <button
                onClick={() => onNavigate('next')}
                className="flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all bg-amber-600 hover:bg-amber-700 text-white shadow-md hover:shadow-lg hover:scale-105 active:scale-95"
                title={`Carte suivante : ${nextCard?.title || 'Sans titre'}`}
            >
                <span className="hidden sm:inline">Suivant</span>
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
            </button>
        </div>
    );
};

export default CardNavigation;
