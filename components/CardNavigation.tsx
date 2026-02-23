import React from 'react';
import { CardData } from '../types';
import { useTranslation } from '../i18n/LanguageContext';

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
  const { t } = useTranslation();
  // Don't show navigation if there's only one card or none
  if (sameTypeCards.length <= 1) {
    return null;
  }

  const currentIndex = sameTypeCards.findIndex((c) => c.id === currentCard.id);

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
        title={t('cardNavigation.prevTitle', {
          title: prevCard?.title || t('cardThumbnail.untitled'),
        })}
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
        <span className="hidden sm:inline">{t('cardNavigation.prev')}</span>
      </button>

      {/* Card Counter */}
      <div className="flex flex-col items-center justify-center flex-grow">
        <div className="text-sm font-bold text-amber-900">{currentCard.type}</div>
        <div className="text-xs text-gray-600">
          {t('cardNavigation.counter', { current: currentIndex + 1, total: sameTypeCards.length })}
        </div>
        <div className="text-[10px] text-gray-400 mt-0.5 hidden md:block">
          {t('cardNavigation.keyboardHint')}
        </div>
      </div>

      {/* Next Button */}
      <button
        onClick={() => onNavigate('next')}
        className="flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all bg-amber-600 hover:bg-amber-700 text-white shadow-md hover:shadow-lg hover:scale-105 active:scale-95"
        title={t('cardNavigation.nextTitle', {
          title: nextCard?.title || t('cardThumbnail.untitled'),
        })}
      >
        <span className="hidden sm:inline">{t('cardNavigation.next')}</span>
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
