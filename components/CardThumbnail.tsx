import React, { useState, useEffect } from 'react';
import { CardData, CardType } from '../types';

interface CardThumbnailProps {
  card: CardData;
  onClick: () => void;
  isSelected?: boolean;
}

const CardThumbnail: React.FC<CardThumbnailProps> = ({ card, onClick, isSelected = false }) => {
  const [imgError, setImgError] = useState(false);
  const [displaySrc, setDisplaySrc] = useState<string | undefined>(undefined);

  // Handle image source similar to CardPreview
  useEffect(() => {
    setImgError(false);

    if (card.imageData) {
      setDisplaySrc(`data:image/png;base64,${card.imageData}`);
      return;
    }

    if (card.storedImageUrl) {
      const url = card.storedImageUrl.trim();
      if (!url.startsWith('http') && !url.startsWith('data:')) {
        setImgError(true);
        setDisplaySrc(undefined);
        return;
      }

      // Handle Google Drive URLs
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
  }, [card.imageData, card.storedImageUrl]);

  // Get type-specific colors
  const getTypeColor = () => {
    switch (card.type) {
      case CardType.MONSTER:
        return { bg: 'bg-red-100', border: 'border-red-300', text: 'text-red-800', badge: 'bg-red-600' };
      case CardType.CURSE:
        return { bg: 'bg-purple-100', border: 'border-purple-300', text: 'text-purple-800', badge: 'bg-purple-600' };
      case CardType.ITEM:
        return { bg: 'bg-amber-100', border: 'border-amber-300', text: 'text-amber-800', badge: 'bg-amber-600' };
      case CardType.CLASS:
        return { bg: 'bg-blue-100', border: 'border-blue-300', text: 'text-blue-800', badge: 'bg-blue-600' };
      case CardType.RACE:
        return { bg: 'bg-green-100', border: 'border-green-300', text: 'text-green-800', badge: 'bg-green-600' };
      case CardType.FAITHFUL_SERVANT:
        return { bg: 'bg-indigo-100', border: 'border-indigo-300', text: 'text-indigo-800', badge: 'bg-indigo-600' };
      case CardType.LEVEL_UP:
        return { bg: 'bg-cyan-100', border: 'border-cyan-300', text: 'text-cyan-800', badge: 'bg-cyan-600' };
      default:
        return { bg: 'bg-gray-100', border: 'border-gray-300', text: 'text-gray-800', badge: 'bg-gray-600' };
    }
  };

  const colors = getTypeColor();

  // Get type emoji
  const getTypeEmoji = () => {
    switch (card.type) {
      case CardType.MONSTER:
        return '👹';
      case CardType.CURSE:
        return '💀';
      case CardType.ITEM:
        return '⚔️';
      case CardType.CLASS:
        return '🎭';
      case CardType.RACE:
        return '🧝';
      case CardType.FAITHFUL_SERVANT:
        return '🐕';
      case CardType.LEVEL_UP:
        return '🆙';
      default:
        return '📜';
    }
  };

  return (
    <button
      onClick={onClick}
      className={`
        group relative w-full aspect-[2/3] rounded-lg overflow-hidden
        transition-all duration-200 ease-out
        hover:scale-105 hover:shadow-xl hover:z-10
        focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2
        ${isSelected ? 'ring-2 ring-amber-500 scale-105 shadow-xl' : 'shadow-md'}
        ${colors.bg} ${colors.border} border-2
      `}
    >
      {/* Image area */}
      <div className="absolute inset-0 bg-white/50">
        {displaySrc && !imgError ? (
          <img
            src={displaySrc}
            alt={card.title}
            className="w-full h-full object-cover"
            crossOrigin="anonymous"
            referrerPolicy="no-referrer"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl opacity-30">
            {getTypeEmoji()}
          </div>
        )}
      </div>

      {/* Gradient overlay for text readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

      {/* Type badge */}
      <div className={`absolute top-2 right-2 ${colors.badge} text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm`}>
        {getTypeEmoji()} {card.type}
      </div>

      {/* Level/Bonus badge for monsters/items */}
      {card.type === CardType.MONSTER && card.level !== '' && (
        <div className="absolute top-2 left-2 bg-red-700 text-white text-xs font-bold w-8 h-8 rounded-full flex items-center justify-center shadow-sm">
          {card.level}
        </div>
      )}
      {(card.type === CardType.ITEM || card.type === CardType.FAITHFUL_SERVANT || card.type === CardType.LEVEL_UP) && card.bonus !== '' && (
        <div className="absolute top-2 left-2 bg-amber-700 text-white text-xs font-bold w-8 h-8 rounded-full flex items-center justify-center shadow-sm">
          +{card.bonus}
        </div>
      )}

      {/* Card title */}
      <div className="absolute bottom-0 left-0 right-0 p-3 text-left">
        <h3 className="text-white font-bold text-sm leading-tight line-clamp-2 drop-shadow-lg">
          {card.title || 'Sans Titre'}
        </h3>
        {card.description && (
          <p className="text-white/70 text-[10px] mt-1 line-clamp-1">
            {card.description}
          </p>
        )}
      </div>

      {/* Hover overlay */}
      <div className="absolute inset-0 bg-amber-500/0 group-hover:bg-amber-500/10 transition-colors duration-200" />

      {/* Click indicator */}
      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <div className="bg-white/90 rounded-full p-2 shadow-lg">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
        </div>
      </div>
    </button>
  );
};

export default CardThumbnail;
