import React, { useState, useMemo } from 'react';
import { CardData, CardType } from '../types';
import CardThumbnail from './CardThumbnail';
import BatchExportRenderer from './BatchExportRenderer';

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
  CardType.LEVEL_UP,
  CardType.FAITHFUL_SERVANT,
  CardType.DUNGEON_TRAP,
  CardType.DUNGEON_BONUS,
  CardType.TREASURE_TRAP,
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
    case CardType.LEVEL_UP:
      return { bg: 'bg-cyan-50', border: 'border-cyan-200', header: 'bg-cyan-600', icon: '🆙' };
    case CardType.FAITHFUL_SERVANT:
      return { bg: 'bg-indigo-50', border: 'border-indigo-200', header: 'bg-indigo-600', icon: '🐕' };
    case CardType.DUNGEON_TRAP:
      return { bg: 'bg-rose-50', border: 'border-rose-200', header: 'bg-rose-600', icon: '🕸️' };
    case CardType.DUNGEON_BONUS:
      return { bg: 'bg-orange-50', border: 'border-orange-200', header: 'bg-orange-600', icon: '✨' };
    case CardType.TREASURE_TRAP:
      return { bg: 'bg-emerald-50', border: 'border-emerald-200', header: 'bg-emerald-600', icon: '💣' };
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
  const [filterBase, setFilterBase] = useState<'all' | 'oui' | 'non'>('all');
  const [filterValidated, setFilterValidated] = useState<'all' | 'oui' | 'non'>('all');
  const [isExportingAll, setIsExportingAll] = useState(false);
  const [exportProgress, setExportProgress] = useState({ current: 0, total: 0 });

  // Filter cards based on search query and filters
  const filteredCards = useMemo(() => {
    let result = cards;

    // Filter by Search Query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter(card =>
        card.title.toLowerCase().includes(query) ||
        card.description.toLowerCase().includes(query) ||
        card.type.toLowerCase().includes(query) ||
        (card.internalComment && card.internalComment.toLowerCase().includes(query))
      );
    }

    // Filter by Base Card
    if (filterBase === 'oui') {
      result = result.filter(card => card.isBaseCard);
    } else if (filterBase === 'non') {
      result = result.filter(card => !card.isBaseCard);
    }

    // Filter by Validated
    if (filterValidated === 'oui') {
      result = result.filter(card => card.isValidated);
    } else if (filterValidated === 'non') {
      result = result.filter(card => !card.isValidated);
    }

    return result;
  }, [cards, searchQuery, filterBase, filterValidated]);

  // Define item slot order for subcategories
  const ITEM_SLOT_ORDER = [
    'Couvre-chef',
    'Armure',
    'Chaussures',
    '1 Main',
    '2 Mains',
    'Monture',
    '' // Empty string for one-shot items
  ];

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

  // Group ITEM cards by itemSlot
  const itemsBySlot = useMemo(() => {
    const items = cardsByType.get(CardType.ITEM) || [];
    const grouped = new Map<string, CardData[]>();

    // Initialize all slots with empty arrays
    ITEM_SLOT_ORDER.forEach(slot => grouped.set(slot, []));

    // Group items by slot
    items.forEach(item => {
      const slot = item.itemSlot || ''; // Empty for one-shot items
      // Check if slot is in standard slots, otherwise put in "Monture"
      if (ITEM_SLOT_ORDER.includes(slot)) {
        const slotItems = grouped.get(slot) || [];
        slotItems.push(item);
        grouped.set(slot, slotItems);
      } else if (slot !== '') {
        // Non-empty slot not in standard list goes to "Monture"
        const montureItems = grouped.get('Monture') || [];
        montureItems.push(item);
        grouped.set('Monture', montureItems);
      } else {
        // Empty slot (one-shot)
        const oneshotItems = grouped.get('') || [];
        oneshotItems.push(item);
        grouped.set('', oneshotItems);
      }
    });

    return grouped;
  }, [cardsByType]);

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

          {/* Filters */}
          <div className="flex gap-2">
            <select
              value={filterBase}
              onChange={(e) => setFilterBase(e.target.value as 'all' | 'oui' | 'non')}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-amber-500 focus:border-amber-500"
            >
              <option value="all">Toutes (Base ?)</option>
              <option value="oui">Base: Oui</option>
              <option value="non">Base: Non</option>
            </select>
            <select
              value={filterValidated}
              onChange={(e) => setFilterValidated(e.target.value as 'all' | 'oui' | 'non')}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-amber-500 focus:border-amber-500"
            >
              <option value="all">Toutes (Valid ?)</option>
              <option value="oui">Validée: Oui</option>
              <option value="non">Validée: Non</option>
            </select>
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
          {filteredCards.length > 0 && (
            <button
              onClick={() => {
                setExportProgress({ current: 0, total: filteredCards.length });
                setIsExportingAll(true);
              }}
              disabled={isExportingAll}
              className="hidden sm:flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg shadow-md transition-colors whitespace-nowrap"
            >
              {isExportingAll ? (
                <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              )}
              <span>Exporter ({filteredCards.length})</span>
            </button>
          )}
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
      {
        isLoading && (
          <div className="flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-4">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-amber-600 border-t-transparent"></div>
              <p className="text-gray-600 font-medium">Chargement des cartes...</p>
            </div>
          </div>
        )
      }

      {/* Empty State */}
      {
        !isLoading && cards.length === 0 && (
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
        )
      }

      {/* No Search Results */}
      {
        !isLoading && cards.length > 0 && filteredCards.length === 0 && (
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
        )
      }

      {/* Card Sections by Type */}
      {
        !isLoading && filteredCards.length > 0 && (
          <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
            {CARD_TYPE_ORDER.map(type => {
              const typeCards = cardsByType.get(type) || [];
              if (typeCards.length === 0) return null;

              const style = getSectionStyle(type);
              const isCollapsed = collapsedSections.has(type);

              // Special handling for ITEM type with subcategories
              if (type === CardType.ITEM) {
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

                    {/* Section Content with Subcategories */}
                    <div
                      className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${isCollapsed ? 'grid-rows-[0fr]' : 'grid-rows-[1fr]'
                        }`}
                    >
                      <div className="overflow-hidden">
                        <div className="p-4 space-y-4">
                          {ITEM_SLOT_ORDER.map(slot => {
                            const slotCards = itemsBySlot.get(slot) || [];
                            if (slotCards.length === 0) return null;

                            const slotLabel = slot === '' ? 'Usage unique' : slot;

                            return (
                              <div key={slot} className="space-y-2">
                                {/* Subcategory Header */}
                                <div className="flex items-center gap-2 px-2 py-1.5 bg-amber-100 border-l-4 border-amber-600 rounded">
                                  <h4 className="font-semibold text-amber-900 text-sm">
                                    {slotLabel}
                                  </h4>
                                  <span className="text-xs text-amber-700">
                                    ({slotCards.length} carte{slotCards.length !== 1 ? 's' : ''})
                                  </span>
                                </div>
                                {/* Cards Grid */}
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                                  {slotCards.map(card => (
                                    <CardThumbnail
                                      key={card.id}
                                      card={card}
                                      onClick={() => onSelectCard(card)}
                                      isSelected={card.id === selectedCardId}
                                    />
                                  ))}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </section>
                );
              }

              // Default rendering for other types
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
                    className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${isCollapsed ? 'grid-rows-[0fr]' : 'grid-rows-[1fr]'
                      }`}
                  >
                    <div className="overflow-hidden">
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
                  </div>
                </section>
              );
            })}
          </div>
        )
      }

      {/* Mobile card count */}
      {
        !isLoading && cards.length > 0 && (
          <div className="sm:hidden text-center py-4 text-sm text-gray-500">
            {searchQuery ? (
              <span>{totalMatchingCards} carte{totalMatchingCards !== 1 ? 's' : ''} trouvée{totalMatchingCards !== 1 ? 's' : ''}</span>
            ) : (
              <span>{cards.length} carte{cards.length !== 1 ? 's' : ''} au total</span>
            )}
          </div>
        )
      }

      {/* Batch Export Renderer and Overlay */}
      {isExportingAll && (
        <>
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-xl p-8 shadow-2xl max-w-sm w-full text-center">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Export en cours...</h3>
              <div className="w-full bg-gray-200 rounded-full h-4 mb-2 overflow-hidden">
                <div
                  className="bg-green-600 h-full transition-all duration-300 ease-out"
                  style={{ width: `${(exportProgress.current / (exportProgress.total || 1)) * 100}%` }}
                />
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <span>Carte {exportProgress.current} / {exportProgress.total}</span>
                <span>{Math.round((exportProgress.current / (exportProgress.total || 1)) * 100)}%</span>
              </div>
              <p className="text-xs text-gray-400 mt-4">Veuillez patienter pendant la génération du fichier ZIP.</p>
            </div>
          </div>

          <BatchExportRenderer
            cards={filteredCards}
            onComplete={() => setIsExportingAll(false)}
            onProgress={(current, total) => setExportProgress({ current, total })}
          />
        </>
      )}
    </div >
  );
};

export default CardGallery;
