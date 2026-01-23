import React, { useState, useMemo } from 'react';
import { CardData, CardType } from '../types';
import CardThumbnail from './CardThumbnail';

interface CardGalleryProps {
  cards: CardData[];
  onSelectCard: (card: CardData) => void;
  onNewCard: () => void;
  isLoading: boolean;
  selectedCardId?: string;
}

// Define the order of card types for display
const CARD_TYPE_ORDER: CardType[] = [
  CardType.MONSTER,
  CardType.CURSE,
  CardType.ITEM,
  CardType.CLASS,
  CardType.RACE,
  CardType.OTHER,
];

// Get section styling by type
const getSectionStyle = (type: CardType) => {
  switch (type) {
    case CardType.MONSTER:
      return { bg: 'bg-red-50', border: 'border-red-200', header: 'bg-red-600', icon: '👹' };
    case CardType.CURSE:
      return { bg: 'bg-purple-50', border: 'border-purple-200', header: 'bg-purple-600', icon: '💀' };
    case CardType.ITEM:
      return { bg: 'bg-amber-50', border: 'border-amber-200', header: 'bg-amber-600', icon: '⚔️' };
    case CardType.CLASS:
      return { bg: 'bg-blue-50', border: 'border-blue-200', header: 'bg-blue-600', icon: '🎭' };
    case CardType.RACE:
      return { bg: 'bg-green-50', border: 'border-green-200', header: 'bg-green-600', icon: '🧝' };
    default:
      return { bg: 'bg-gray-50', border: 'border-gray-200', header: 'bg-gray-600', icon: '📜' };
  }
};

const CardGallery: React.FC<CardGalleryProps> = ({
  cards,
  onSelectCard,
  onNewCard,
  isLoading,
  selectedCardId,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [collapsedSections, setCollapsedSections] = useState<Set<CardType>>(new Set());

  // Filter cards based on search query
  const filteredCards = useMemo(() => {
    if (!searchQuery.trim()) return cards;
    
    const query = searchQuery.toLowerCase().trim();
    return cards.filter(card => 
      card.title.toLowerCase().includes(query) ||
      card.description.toLowerCase().includes(query) ||
      card.type.toLowerCase().includes(query)
    );
  }, [cards, searchQuery]);

  // Group cards by type
  const cardsByType = useMemo(() => {
    const grouped = new Map<CardType, CardData[]>();
    
    // Initialize all types with empty arrays
    CARD_TYPE_ORDER.forEach(type => grouped.set(type, []));
    
    // Group filtered cards
    filteredCards.forEach(card => {
      const typeCards = grouped.get(card.type) || [];
      typeCards.push(card);
      grouped.set(card.type, typeCards);
    });
    
    return grouped;
  }, [filteredCards]);

  // Toggle section collapse
  const toggleSection = (type: CardType) => {
    setCollapsedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(type)) {
        newSet.delete(type);
      } else {
        newSet.add(type);
      }
      return newSet;
    });
  };

  // Count total cards matching search
  const totalMatchingCards = filteredCards.length;

  return (
    <div className="min-h-full">
      {/* Search Bar and Actions */}
      <div className="sticky top-0 z-20 bg-stone-100/95 backdrop-blur-sm px-4 py-4 border-b border-stone-300 shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
          {/* Search Input */}
          <div className="relative flex-grow">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher des cartes..."
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white shadow-sm"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* Card count */}
          <div className="text-sm text-gray-600 hidden sm:block whitespace-nowrap">
            {searchQuery ? (
              <span>{totalMatchingCards} carte{totalMatchingCards !== 1 ? 's' : ''} trouvée{totalMatchingCards !== 1 ? 's' : ''}</span>
            ) : (
              <span>{cards.length} carte{cards.length !== 1 ? 's' : ''} au total</span>
            )}
          </div>

          {/* New Card Button */}
          <button
            onClick={onNewCard}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg shadow-md transition-colors whitespace-nowrap"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>Nouvelle Carte</span>
          </button>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-amber-600 border-t-transparent"></div>
            <p className="text-gray-600 font-medium">Chargement des cartes...</p>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && cards.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 px-4">
          <div className="text-6xl mb-4">🃏</div>
          <h3 className="text-xl font-bold text-gray-700 mb-2">Aucune carte créée</h3>
          <p className="text-gray-500 text-center mb-6 max-w-md">
            Commencez par créer votre première carte Munchkin ! Chaque carte apparaîtra ici organisée par type.
          </p>
          <button
            onClick={onNewCard}
            className="flex items-center gap-2 px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg shadow-lg transition-all transform hover:scale-105"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Créer ma première carte
          </button>
        </div>
      )}

      {/* No Search Results */}
      {!isLoading && cards.length > 0 && filteredCards.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 px-4">
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-xl font-bold text-gray-700 mb-2">Aucun résultat</h3>
          <p className="text-gray-500 text-center mb-4">
            Aucune carte ne correspond à "{searchQuery}"
          </p>
          <button
            onClick={() => setSearchQuery('')}
            className="text-amber-600 hover:text-amber-700 font-medium underline"
          >
            Effacer la recherche
          </button>
        </div>
      )}

      {/* Card Sections by Type */}
      {!isLoading && filteredCards.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
          {CARD_TYPE_ORDER.map(type => {
            const typeCards = cardsByType.get(type) || [];
            if (typeCards.length === 0) return null;
            
            const style = getSectionStyle(type);
            const isCollapsed = collapsedSections.has(type);
            
            return (
              <section
                key={type}
                className={`rounded-xl overflow-hidden border-2 ${style.border} ${style.bg}`}
              >
                {/* Section Header */}
                <button
                  onClick={() => toggleSection(type)}
                  className={`w-full flex items-center justify-between px-4 py-3 ${style.header} text-white font-bold text-lg transition-colors hover:brightness-110`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{style.icon}</span>
                    <span>{type}</span>
                    <span className="text-white/80 font-normal text-sm">
                      ({typeCards.length} carte{typeCards.length !== 1 ? 's' : ''})
                    </span>
                  </div>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className={`h-6 w-6 transition-transform duration-200 ${isCollapsed ? '' : 'rotate-180'}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Section Content */}
                <div
                  className={`transition-all duration-300 ease-in-out overflow-hidden ${
                    isCollapsed ? 'max-h-0' : 'max-h-[2000px]'
                  }`}
                >
                  <div className="p-4">
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                      {typeCards.map(card => (
                        <CardThumbnail
                          key={card.id}
                          card={card}
                          onClick={() => onSelectCard(card)}
                          isSelected={card.id === selectedCardId}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </section>
            );
          })}
        </div>
      )}

      {/* Mobile card count */}
      {!isLoading && cards.length > 0 && (
        <div className="sm:hidden text-center py-4 text-sm text-gray-500">
          {searchQuery ? (
            <span>{totalMatchingCards} carte{totalMatchingCards !== 1 ? 's' : ''} trouvée{totalMatchingCards !== 1 ? 's' : ''}</span>
          ) : (
            <span>{cards.length} carte{cards.length !== 1 ? 's' : ''} au total</span>
          )}
        </div>
      )}
    </div>
  );
};

export default CardGallery;
