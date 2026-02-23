import React, { useState, useMemo } from 'react';
import ReactDOM from 'react-dom';
import { CardData, CardType, PlaceholderCardData, GlobalSettings } from '../types';
import CardThumbnail from './CardThumbnail';
import BatchExportRenderer from './BatchExportRenderer';
import BatchPdfExportRenderer from './BatchPdfExportRenderer';
import PlaceholderCard from './PlaceholderCard';
import { getCardCategory } from '../utils/layoutUtils';
import {
  MONSTER_BALANCE_REFERENCE,
  getTargetCountForLevel,
  getRecommendedValues,
  getAllTargets,
} from '../utils/balancingConfig';
import { useTranslation } from '../i18n/LanguageContext';

interface CardGalleryProps {
  cards: CardData[];
  onSelectCard: (card: CardData) => void;
  onNewCard: (initialData?: Partial<CardData>) => void;
  isLoading: boolean;
  selectedCardId?: string;
  targetTotal?: number;
  globalSettings: GlobalSettings;
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

// Define item slot order for subcategories (module-level constant to avoid re-creation on each render)
const ITEM_SLOT_ORDER = [
  'Couvre-chef',
  'Armure',
  'Chaussures',
  '1 Main',
  '2 Mains',
  'Monture',
  'Amélioration de Monture',
  'NoSlot',
  'Amélioration',
  '', // Empty string for one-shot items
];

// Get section styling by type
const getSectionStyle = (type: CardType) => {
  switch (type) {
    case CardType.MONSTER:
      // Keeping existing structure but we will use the same dynamic logic for all
      return { bg: 'bg-red-50', border: 'border-red-200', header: 'bg-red-600', icon: '👹' };
    case CardType.CURSE:
      return {
        bg: 'bg-purple-50',
        border: 'border-purple-200',
        header: 'bg-purple-600',
        icon: '💀',
      };
    case CardType.ITEM:
      return { bg: 'bg-amber-50', border: 'border-amber-200', header: 'bg-amber-600', icon: '⚔️' };
    case CardType.CLASS:
      return { bg: 'bg-blue-50', border: 'border-blue-200', header: 'bg-blue-600', icon: '🎭' };
    case CardType.RACE:
      return { bg: 'bg-green-50', border: 'border-green-200', header: 'bg-green-600', icon: '🧝' };
    case CardType.LEVEL_UP:
      return { bg: 'bg-cyan-50', border: 'border-cyan-200', header: 'bg-cyan-600', icon: '🆙' };
    case CardType.FAITHFUL_SERVANT:
      return {
        bg: 'bg-indigo-50',
        border: 'border-indigo-200',
        header: 'bg-indigo-600',
        icon: '🐕',
      };
    case CardType.DUNGEON_TRAP:
      return { bg: 'bg-rose-50', border: 'border-rose-200', header: 'bg-rose-600', icon: '🕸️' };
    case CardType.DUNGEON_BONUS:
      return {
        bg: 'bg-orange-50',
        border: 'border-orange-200',
        header: 'bg-orange-600',
        icon: '✨',
      };
    case CardType.TREASURE_TRAP:
      return {
        bg: 'bg-emerald-50',
        border: 'border-emerald-200',
        header: 'bg-emerald-600',
        icon: '💣',
      };
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
  targetTotal = 350,
  globalSettings,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [collapsedSections, setCollapsedSections] = useState<Set<CardType>>(new Set());
  const [filterBase, setFilterBase] = useState<'all' | 'oui' | 'non'>('all');
  const [filterValidated, setFilterValidated] = useState<'all' | 'oui' | 'non'>('all');
  const [filterImage, setFilterImage] = useState<'all' | 'avec' | 'sans'>('all');
  const { t } = useTranslation();
  const [isExportingSelection, setIsExportingSelection] = useState(false);
  const [exportProgress, setExportProgress] = useState({ current: 0, total: 0 });
  const [exportChunkInfo, setExportChunkInfo] = useState<{
    chunk: number;
    totalChunks: number;
  } | null>(null);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [exportMode, setExportMode] = useState<'all' | 'Donjon' | 'Tresor'>('all');
  const [sortByLevel, setSortByLevel] = useState(true);
  const [showMissingCards, setShowMissingCards] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [monsterTooltip, setMonsterTooltip] = useState<{ visible: boolean; x: number; y: number }>({
    visible: false,
    x: 0,
    y: 0,
  });

  // Filter cards based on search query and filters
  const filteredCards = useMemo(() => {
    let result = cards;

    // Filter by Search Query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter(
        (card) =>
          card.title.toLowerCase().includes(query) ||
          card.description.toLowerCase().includes(query) ||
          card.type.toLowerCase().includes(query) ||
          (card.internalComment && card.internalComment.toLowerCase().includes(query)),
      );
    }

    // Filter by Base Card
    if (filterBase === 'oui') {
      result = result.filter((card) => card.isBaseCard);
    } else if (filterBase === 'non') {
      result = result.filter((card) => !card.isBaseCard);
    }

    // Filter by Validated
    if (filterValidated === 'oui') {
      result = result.filter((card) => card.isValidated);
    } else if (filterValidated === 'non') {
      result = result.filter((card) => !card.isValidated);
    }

    // Filter by Image
    if (filterImage === 'avec') {
      result = result.filter((card) => card.imageData || card.storedImageUrl);
    } else if (filterImage === 'sans') {
      result = result.filter((card) => !card.imageData && !card.storedImageUrl);
    }

    return result;
  }, [cards, searchQuery, filterBase, filterValidated, filterImage]);

  // Group cards by type
  const cardsByType = useMemo(() => {
    const grouped = new Map<CardType, CardData[]>();

    // Initialize all types with empty arrays
    CARD_TYPE_ORDER.forEach((type) => grouped.set(type, []));

    // Group filtered cards
    filteredCards.forEach((card) => {
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
    ITEM_SLOT_ORDER.forEach((slot) => grouped.set(slot, []));

    // Group items by slot
    items.forEach((item) => {
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

  // Calculate missing monster cards
  const getMissingMonsterCards = useMemo((): PlaceholderCardData[] => {
    if (!showMissingCards) return [];

    const monsterCards = cardsByType.get(CardType.MONSTER) || [];
    const missingCards: PlaceholderCardData[] = [];

    // For each level in the new balancing configuration
    MONSTER_BALANCE_REFERENCE.forEach((config) => {
      const existingCount = monsterCards.filter((card) => card.level === config.level).length;
      const targetForLevel = getTargetCountForLevel(config.level, targetTotal);
      const missingCount = Math.max(0, targetForLevel - existingCount);

      // Create placeholder cards for missing ones
      for (let i = 0; i < missingCount; i++) {
        missingCards.push({
          level: config.level,
          type: CardType.MONSTER,
          targetTreasures: config.treasuresGained,
          targetLevelsGained: config.levelsGained,
          isPlaceholder: true,
        });
      }
    });

    return missingCards;
  }, [showMissingCards, cardsByType, targetTotal]);

  // Sort cards by level if enabled
  const sortCardsByLevel = (cards: CardData[]): CardData[] => {
    if (!sortByLevel) return cards;

    return [...cards].sort((a, b) => {
      const levelA = typeof a.level === 'number' ? a.level : 0;
      const levelB = typeof b.level === 'number' ? b.level : 0;
      return levelA - levelB;
    });
  };

  // Combine real cards with placeholders and sort
  const getCombinedMonsterCards = (): (CardData | PlaceholderCardData)[] => {
    const realCards = cardsByType.get(CardType.MONSTER) || [];
    const combined: (CardData | PlaceholderCardData)[] = [...realCards, ...getMissingMonsterCards];

    if (sortByLevel) {
      return combined.sort((a, b) => {
        const levelA = 'isPlaceholder' in a ? a.level : typeof a.level === 'number' ? a.level : 0;
        const levelB = 'isPlaceholder' in b ? b.level : typeof b.level === 'number' ? b.level : 0;
        return levelA - levelB;
      });
    }

    return combined;
  };

  // Toggle section collapse
  const toggleSection = (type: CardType) => {
    setCollapsedSections((prev) => {
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

  // Get total targets for all types
  const allTargets = useMemo(() => getAllTargets(targetTotal), [targetTotal]);

  // Utility to get target for a type
  const getTargetForType = (type: CardType): number => {
    // Map CardType to Target Key if names differ, assuming strict match for now or manual mapping
    // The keys in allTargets match CardType enum values generally?
    // Check enum: RACE = 'Race', but keys are RACE.
    // We need a mapping if they don't match or logic to access.
    // Actually `allTargets` keys are strings 'RACE', 'CLASS', etc.
    // CardType enum values are 'Race', 'Classe', etc.
    // We need a mapping.
    switch (type) {
      case CardType.RACE:
        return allTargets.RACE;
      case CardType.CLASS:
        return allTargets.CLASS;
      case CardType.DUNGEON_TRAP:
        return allTargets.DUNGEON_TRAP;
      case CardType.FAITHFUL_SERVANT:
        return allTargets.FAITHFUL_SERVANT;
      case CardType.DUNGEON_BONUS:
        return allTargets.DUNGEON_BONUS;
      case CardType.LEVEL_UP:
        return allTargets.LEVEL_UP;
      case CardType.CURSE:
        return allTargets.CURSE;
      case CardType.MONSTER:
        return allTargets.MONSTER;
      case CardType.TREASURE_TRAP:
        return allTargets.TREASURE_TRAP;
      case CardType.ITEM:
        return allTargets.ITEM;
      default:
        return 0;
    }
  };

  return (
    <div className="min-h-full">
      {/* Search Bar and Actions */}
      <div className="sticky top-0 z-20 bg-stone-100/95 backdrop-blur-sm border-b border-stone-300 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
            {/* Search Input */}
            <div className="relative flex-grow">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('cardGallery.searchPlaceholder')}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white shadow-sm"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              )}
            </div>

            {/* Toggle Filters Button */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center justify-center gap-2 px-4 py-2.5 border rounded-lg font-medium transition-colors whitespace-nowrap ${
                showFilters
                  ? 'bg-amber-100 border-amber-300 text-amber-800'
                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                />
              </svg>
              <span>{t('cardGallery.filtersAndOptions')}</span>
              {(filterBase !== 'all' ||
                filterValidated !== 'all' ||
                filterImage !== 'all' ||
                sortByLevel ||
                showMissingCards) && (
                <span className="flex h-2.5 w-2.5 rounded-full bg-amber-500 -ml-1"></span>
              )}
            </button>

            {/* New Card Button */}
            <button
              onClick={() => onNewCard()}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg shadow-md transition-colors whitespace-nowrap"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              <span>{t('cardGallery.newCard')}</span>
            </button>
          </div>

          {/* Collapsible Filters & Options Panel */}
          {showFilters && (
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="flex flex-col md:flex-row gap-6">
                {/* Display Options */}
                <div className="flex-1 space-y-3">
                  <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
                    {t('cardGallery.display')}
                  </h4>
                  <div className="flex flex-wrap gap-4">
                    <label className="flex items-center gap-2 cursor-pointer select-none px-3 py-2 rounded-lg bg-gray-50 hover:bg-gray-100 border border-transparent hover:border-gray-200 transition-colors">
                      <input
                        type="checkbox"
                        checked={sortByLevel}
                        onChange={(e) => setSortByLevel(e.target.checked)}
                        className="w-5 h-5 rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                      />
                      <span className="text-gray-700">{t('cardGallery.sortByLevel')}</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer select-none px-3 py-2 rounded-lg bg-gray-50 hover:bg-gray-100 border border-transparent hover:border-gray-200 transition-colors">
                      <input
                        type="checkbox"
                        checked={showMissingCards}
                        onChange={(e) => setShowMissingCards(e.target.checked)}
                        className="w-5 h-5 rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                      />
                      <span className="text-gray-700">{t('cardGallery.showMissing')}</span>
                    </label>
                  </div>
                </div>

                {/* Filters */}
                <div className="flex-1 space-y-3">
                  <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
                    {t('cardGallery.filters')}
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    <select
                      value={filterBase}
                      onChange={(e) => setFilterBase(e.target.value as 'all' | 'oui' | 'non')}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-amber-500 focus:border-amber-500 bg-white"
                    >
                      <option value="all">{t('cardGallery.baseAll')}</option>
                      <option value="oui">{t('cardGallery.baseOnly')}</option>
                      <option value="non">{t('cardGallery.customOnly')}</option>
                    </select>
                    <select
                      value={filterValidated}
                      onChange={(e) => setFilterValidated(e.target.value as 'all' | 'oui' | 'non')}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-amber-500 focus:border-amber-500 bg-white"
                    >
                      <option value="all">{t('cardGallery.validationAll')}</option>
                      <option value="oui">{t('cardGallery.validated')}</option>
                      <option value="non">{t('cardGallery.unvalidated')}</option>
                    </select>
                    <select
                      value={filterImage}
                      onChange={(e) => setFilterImage(e.target.value as 'all' | 'avec' | 'sans')}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-amber-500 focus:border-amber-500 bg-white"
                    >
                      <option value="all">{t('cardGallery.imageAll')}</option>
                      <option value="avec">{t('cardGallery.withImage')}</option>
                      <option value="sans">{t('cardGallery.withoutImage')}</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Export Actions */}
              <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                <div className="text-sm text-gray-500">
                  {searchQuery ? (
                    <span>
                      {totalMatchingCards}{' '}
                      {totalMatchingCards !== 1
                        ? t('cardGallery.cardWordPlural')
                        : t('cardGallery.cardWord')}{' '}
                      {totalMatchingCards !== 1
                        ? t('cardGallery.cardsFoundPlural')
                        : t('cardGallery.cardsFound')}
                    </span>
                  ) : (
                    <span>
                      {cards.length}{' '}
                      {cards.length !== 1
                        ? t('cardGallery.cardWordPlural')
                        : t('cardGallery.cardWord')}{' '}
                      {t('cardGallery.cardsTotal')}
                    </span>
                  )}
                </div>

                {filteredCards.length > 0 && (
                  <div className="flex items-center gap-2">
                    <select
                      value={exportMode}
                      onChange={(e) => setExportMode(e.target.value as 'all' | 'Donjon' | 'Tresor')}
                      className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-amber-500 focus:border-amber-500 bg-white"
                      disabled={isExportingSelection || isExportingPdf}
                    >
                      <option value="all">{t('cardGallery.exportAll')}</option>
                      <option value="Donjon">{t('cardGallery.exportDungeon')}</option>
                      <option value="Tresor">{t('cardGallery.exportTreasure')}</option>
                    </select>
                    <button
                      onClick={() => {
                        const cardsToExport = filteredCards.filter((c) => {
                          if (exportMode === 'all') return true;
                          return getCardCategory(c) === exportMode;
                        });
                        if (cardsToExport.length === 0) {
                          alert(t('cardGallery.noTypeToExport'));
                          return;
                        }
                        setExportProgress({ current: 0, total: cardsToExport.length });
                        setIsExportingSelection(true);
                      }}
                      disabled={isExportingSelection}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg shadow-sm transition-colors"
                    >
                      {isExportingSelection ? (
                        <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                      ) : (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                          />
                        </svg>
                      )}
                      <span>ZIP</span>
                    </button>
                    {/* BAT Button */}
                    <button
                      onClick={() => {
                        const cardsToExport = filteredCards.filter((c) => {
                          if (exportMode === 'all') return true;
                          return getCardCategory(c) === exportMode;
                        });
                        if (cardsToExport.length === 0) {
                          alert(t('cardGallery.noTypeToExport'));
                          return;
                        }
                        setExportProgress({ current: 0, total: cardsToExport.length });
                        setIsExportingPdf(true);
                      }}
                      disabled={isExportingSelection || isExportingPdf}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg shadow-sm transition-colors"
                    >
                      {isExportingPdf ? (
                        <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                      ) : (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                          />
                        </svg>
                      )}
                      <span>BAT</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Always-visible card count summary */}
          {!showFilters && cards.length > 0 && (
            <div className="flex items-center justify-between text-sm text-gray-500 pt-1">
              <div className="flex items-center gap-3">
                {searchQuery ||
                filterBase !== 'all' ||
                filterValidated !== 'all' ||
                filterImage !== 'all' ? (
                  <span>
                    {totalMatchingCards}{' '}
                    {totalMatchingCards !== 1
                      ? t('cardGallery.cardWordPlural')
                      : t('cardGallery.cardWord')}{' '}
                    {totalMatchingCards !== 1
                      ? t('cardGallery.cardsFilteredPlural')
                      : t('cardGallery.cardsFiltered')}
                  </span>
                ) : (
                  <span>
                    {cards.length}{' '}
                    {cards.length !== 1
                      ? t('cardGallery.cardWordPlural')
                      : t('cardGallery.cardWord')}{' '}
                    {t('cardGallery.cardsTotal')}
                  </span>
                )}
                <span className="text-gray-300">•</span>
                <span className="text-emerald-600 font-medium">
                  ✓ {cards.filter((c) => c.isValidated).length}{' '}
                  {cards.filter((c) => c.isValidated).length !== 1
                    ? t('cardGallery.validatedWordPlural')
                    : t('cardGallery.validatedWord')}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-amber-600 border-t-transparent"></div>
            <p className="text-gray-600 font-medium">{t('cardGallery.loading')}</p>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && cards.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 px-4">
          <div className="text-6xl mb-4">🃏</div>
          <h3 className="text-xl font-bold text-gray-700 mb-2">
            {t('cardGallery.noCardsCreated')}
          </h3>
          <p className="text-gray-500 text-center mb-6 max-w-md">{t('cardGallery.noCardsDesc')}</p>
          <button
            onClick={onNewCard}
            className="flex items-center gap-2 px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg shadow-lg transition-all transform hover:scale-105"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            {t('cardGallery.createFirstCard')}
          </button>
        </div>
      )}

      {/* No Search Results */}
      {!isLoading && cards.length > 0 && filteredCards.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 px-4">
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-xl font-bold text-gray-700 mb-2">{t('cardGallery.noResults')}</h3>
          <p className="text-gray-500 text-center mb-4">
            {t('cardGallery.noResultFor')} "{searchQuery}"
          </p>
          <button
            onClick={() => setSearchQuery('')}
            className="text-amber-600 hover:text-amber-700 font-medium underline"
          >
            {t('cardGallery.clearSearch')}
          </button>
        </div>
      )}

      {/* Card Sections by Type */}
      {!isLoading && (filteredCards.length > 0 || showMissingCards) && (
        <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
          {CARD_TYPE_ORDER.map((type) => {
            // Prepare cards for this section
            let sectionCards: (CardData | PlaceholderCardData)[] = [];

            if (type === CardType.MONSTER) {
              sectionCards = getCombinedMonsterCards();
            } else {
              // Standard behavior for other types
              const rawCards = cardsByType.get(type) || [];
              sectionCards = sortCardsByLevel(rawCards);
            }

            if (sectionCards.length === 0) return null;

            const style = getSectionStyle(type);
            const isCollapsed = collapsedSections.has(type);

            // Calculate counts
            const nonPlaceholderCards = sectionCards.filter(
              (c) => !('isPlaceholder' in c),
            ) as CardData[];
            const validatedCount = nonPlaceholderCards.filter((c) => c.isValidated).length;
            const globalTargetCount = getTargetForType(type) || 0;

            const progressPercent =
              globalTargetCount > 0 ? Math.min(100, (validatedCount / globalTargetCount) * 100) : 0;

            // Special handling for ITEM type with subcategories
            if (type === CardType.ITEM) {
              return (
                <section
                  key={type}
                  className={`rounded-xl overflow-hidden border-2 transition-all duration-300 ${style.border} ${style.bg} shadow-sm hover:shadow-md`}
                >
                  {/* Section Header */}
                  <button
                    onClick={() => toggleSection(type)}
                    className={`w-full flex items-center justify-between px-4 py-3 ${style.header} text-white font-bold text-lg transition-colors hover:brightness-110`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{style.icon}</span>
                      <span>{type}</span>
                      {/* Unified Counter Display for Items */}
                      <div className="flex items-center gap-3 ml-2">
                        <div className="flex flex-col gap-0.5 w-32 sm:w-48">
                          <div className="flex justify-between text-xs text-white/90 font-medium px-0.5">
                            <span>{t('cardGallery.progressValidated')}</span>
                            <span>
                              {validatedCount}/{globalTargetCount}
                            </span>
                          </div>
                          <div className="w-full bg-black/20 rounded-full h-1.5 overflow-hidden border border-white/20">
                            <div
                              className="bg-white/90 h-full rounded-full shadow-sm transition-all duration-500"
                              style={{ width: `${progressPercent}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className={`h-6 w-6 transition-transform duration-200 ${isCollapsed ? '' : 'rotate-180'}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>

                  {/* Section Content with Subcategories */}
                  <div
                    className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${
                      isCollapsed ? 'grid-rows-[0fr]' : 'grid-rows-[1fr]'
                    }`}
                  >
                    <div className="overflow-hidden">
                      <div className="p-4 space-y-4">
                        {ITEM_SLOT_ORDER.map((slot) => {
                          // Need to handle sorting here too for consistency
                          const rawSlotCards = itemsBySlot.get(slot) || [];
                          const slotCards = sortCardsByLevel(rawSlotCards);

                          if (slotCards.length === 0) return null;

                          const slotLabel =
                            slot === ''
                              ? t('cardGallery.slotOneShot')
                              : slot === 'NoSlot'
                                ? t('cardGallery.slotNoSlot')
                                : slot === 'Amélioration'
                                  ? t('cardGallery.slotEnhancement')
                                  : slot === 'Amélioration de Monture'
                                    ? t('cardGallery.slotSteedEnhancement')
                                    : slot;

                          return (
                            <div key={slot} className="space-y-2">
                              {/* Subcategory Header */}
                              <div className="flex items-center gap-2 px-2 py-1.5 bg-amber-100 border-l-4 border-amber-600 rounded">
                                <h4 className="font-semibold text-amber-900 text-sm">
                                  {slotLabel}
                                </h4>
                                <span className="text-xs text-amber-700 font-medium">
                                  ({slotCards.length})
                                </span>
                              </div>
                              {/* Cards Grid */}
                              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                                {slotCards.map((card) => (
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

            // Default rendering for other types (including MONSTER with mixed placeholders)
            return (
              <section
                key={type}
                className={`rounded-xl border-2 transition-all duration-300 ${style.border} ${style.bg} shadow-sm hover:shadow-md ${type === CardType.MONSTER ? 'overflow-visible' : 'overflow-hidden'}`}
              >
                {/* Section Header */}
                <button
                  onClick={() => toggleSection(type)}
                  className={`w-full flex items-center justify-between px-4 py-3 ${style.header} text-white font-bold text-lg transition-colors hover:brightness-110 ${type === CardType.MONSTER ? 'overflow-visible' : ''}`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{style.icon}</span>
                    <span>{type}</span>
                    {/* Unified Counter Display for All Types */}
                    <div className="flex items-center gap-3 ml-2">
                      <div
                        className="flex flex-col gap-0.5 w-32 sm:w-48 cursor-help"
                        onMouseEnter={(e) => {
                          if (type === CardType.MONSTER) {
                            const rect = e.currentTarget.getBoundingClientRect();
                            setMonsterTooltip({
                              visible: true,
                              x: rect.left + rect.width / 2,
                              y: rect.bottom + 8,
                            });
                          }
                        }}
                        onMouseLeave={() => setMonsterTooltip({ visible: false, x: 0, y: 0 })}
                      >
                        <div className="flex justify-between text-xs text-white/90 font-medium px-0.5">
                          <span>{t('cardGallery.progressValidated')}</span>
                          <span>
                            {validatedCount}/{globalTargetCount}
                          </span>
                        </div>
                        <div className="w-full bg-black/20 rounded-full h-1.5 overflow-hidden border border-white/20">
                          <div
                            className="bg-white/90 h-full rounded-full shadow-sm transition-all duration-500"
                            style={{ width: `${progressPercent}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className={`h-6 w-6 transition-transform duration-200 ${isCollapsed ? '' : 'rotate-180'}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>

                {/* Section Content */}
                <div
                  className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${
                    isCollapsed ? 'grid-rows-[0fr]' : 'grid-rows-[1fr]'
                  }`}
                >
                  <div className="overflow-hidden">
                    <div className="p-4">
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                        {sectionCards.map((item, index) => {
                          // Check if it's a placeholder
                          if ('isPlaceholder' in item) {
                            return (
                              <PlaceholderCard
                                key={`placeholder-${item.level}-${index}`}
                                level={item.level}
                                type={item.type}
                                onClick={() => {
                                  // Pre-fill creation data
                                  const recommended = getRecommendedValues(item.level);
                                  if (recommended.exists) {
                                    onNewCard({
                                      type: CardType.MONSTER,
                                      level: item.level,
                                      levelsGained: recommended.levelsGained,
                                      gold: `${recommended.treasuresGained} Trésor${recommended.treasuresGained > 1 ? 's' : ''}`,
                                      title: '', // Reset title to force user input
                                      description: '',
                                      badStuff: '',
                                    });
                                  } else {
                                    onNewCard({ type: CardType.MONSTER });
                                  }
                                }}
                              />
                            );
                          }
                          // Regular card
                          return (
                            <CardThumbnail
                              key={item.id}
                              card={item}
                              onClick={() => onSelectCard(item)}
                              isSelected={item.id === selectedCardId}
                            />
                          );
                        })}
                      </div>
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
            <span>
              {totalMatchingCards}{' '}
              {totalMatchingCards !== 1
                ? t('cardGallery.cardWordPlural')
                : t('cardGallery.cardWord')}{' '}
              {totalMatchingCards !== 1
                ? t('cardGallery.cardsFoundPlural')
                : t('cardGallery.cardsFound')}
            </span>
          ) : (
            <span>
              {cards.length}{' '}
              {cards.length !== 1 ? t('cardGallery.cardWordPlural') : t('cardGallery.cardWord')}{' '}
              {t('cardGallery.cardsTotal')}
            </span>
          )}
        </div>
      )}

      {/* Batch Export Renderer and Overlay */}
      {isExportingSelection && (
        <>
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-xl p-8 shadow-2xl max-w-sm w-full text-center">
              <h3 className="text-xl font-bold text-gray-800 mb-4">
                {t('cardGallery.exportingZip')}
              </h3>
              <div className="w-full bg-gray-200 rounded-full h-4 mb-2 overflow-hidden">
                <div
                  className="bg-green-600 h-full transition-all duration-300 ease-out"
                  style={{
                    width: `${(exportProgress.current / (exportProgress.total || 1)) * 100}%`,
                  }}
                />
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <span>
                  Carte {exportProgress.current} / {exportProgress.total}
                </span>
                <span>
                  {Math.round((exportProgress.current / (exportProgress.total || 1)) * 100)}%
                </span>
              </div>
              {exportChunkInfo && exportChunkInfo.totalChunks > 1 && (
                <p className="text-sm text-amber-600 font-medium mt-2">
                  📦{' '}
                  {t('cardGallery.exportProgressLot', {
                    chunk: exportChunkInfo.chunk,
                    totalChunks: exportChunkInfo.totalChunks,
                  })}
                </p>
              )}
              <p className="text-xs text-gray-400 mt-3">
                {exportChunkInfo && exportChunkInfo.totalChunks > 1
                  ? t('cardGallery.exportZipDescMulti')
                  : t('cardGallery.exportZipDescSingle')}
              </p>
              <button
                onClick={() => setIsExportingSelection(false)}
                className="mt-4 px-5 py-2 bg-red-500 hover:bg-red-600 text-white text-sm font-medium rounded-lg shadow transition-colors"
              >
                ✕ {t('cardGallery.cancelExport')}
              </button>
            </div>
          </div>

          <BatchExportRenderer
            cards={filteredCards.filter((c) => {
              if (exportMode === 'all') return true;
              return getCardCategory(c) === exportMode;
            })}
            onComplete={() => {
              setIsExportingSelection(false);
              setExportChunkInfo(null);
            }}
            onProgress={(current, total, chunkInfo) => {
              setExportProgress({ current, total });
              if (chunkInfo) setExportChunkInfo(chunkInfo);
            }}
            globalSettings={globalSettings}
          />
        </>
      )}
      {/* PDF Export Overlay */}
      {isExportingPdf && (
        <>
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-xl p-8 shadow-2xl max-w-sm w-full text-center">
              <h3 className="text-xl font-bold text-gray-800 mb-4">
                {t('cardGallery.exportingPdf')}
              </h3>
              <div className="w-full bg-gray-200 rounded-full h-4 mb-2 overflow-hidden">
                <div
                  className="bg-indigo-600 h-full transition-all duration-300 ease-out"
                  style={{
                    width: `${(exportProgress.current / (exportProgress.total || 1)) * 100}%`,
                  }}
                />
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <span>
                  Carte {exportProgress.current} / {exportProgress.total}
                </span>
                <span>
                  {Math.round((exportProgress.current / (exportProgress.total || 1)) * 100)}%
                </span>
              </div>
              {exportChunkInfo && exportChunkInfo.totalChunks > 1 && (
                <p className="text-sm text-indigo-600 font-medium mt-2">
                  📦{' '}
                  {t('cardGallery.exportProgressFile', {
                    chunk: exportChunkInfo.chunk,
                    totalChunks: exportChunkInfo.totalChunks,
                  })}
                </p>
              )}
              <p className="text-xs text-gray-400 mt-3">
                {exportChunkInfo && exportChunkInfo.totalChunks > 1
                  ? t('cardGallery.exportPdfDescMulti')
                  : t('cardGallery.exportPdfDescSingle')}
              </p>
              <button
                onClick={() => setIsExportingPdf(false)}
                className="mt-4 px-5 py-2 bg-red-500 hover:bg-red-600 text-white text-sm font-medium rounded-lg shadow transition-colors"
              >
                ✕ {t('cardGallery.cancelExport')}
              </button>
            </div>
          </div>

          <BatchPdfExportRenderer
            cards={filteredCards.filter((c) => {
              if (exportMode === 'all') return true;
              return getCardCategory(c) === exportMode;
            })}
            onComplete={() => {
              setIsExportingPdf(false);
              setExportChunkInfo(null);
            }}
            onProgress={(current, total, chunkInfo) => {
              setExportProgress({ current, total });
              if (chunkInfo) setExportChunkInfo(chunkInfo);
            }}
            globalSettings={globalSettings}
          />
        </>
      )}
      {/* Monster Level Distribution Tooltip - Rendered via Portal */}
      {monsterTooltip.visible &&
        ReactDOM.createPortal(
          <div
            className="fixed z-[99999] pointer-events-none"
            style={{ left: monsterTooltip.x, top: monsterTooltip.y, transform: 'translateX(-50%)' }}
          >
            <div className="bg-gray-900 text-white text-xs rounded-lg shadow-2xl p-3 w-[280px] border border-gray-700">
              <div className="font-bold mb-2 text-center border-b border-gray-700 pb-2">
                📊 {t('cardGallery.levelDistribution')}
              </div>
              <div className="space-y-0.5">
                {Array.from({ length: 20 }, (_, i) => i + 1).map((level) => {
                  const monstersAtLevel = (cardsByType.get(CardType.MONSTER) || []).filter((c) => {
                    const cLevel = typeof c.level === 'number' ? c.level : 0;
                    return cLevel === level;
                  });
                  const currentCount = monstersAtLevel.length;
                  const validatedCountAtLevel = monstersAtLevel.filter((c) => c.isValidated).length;
                  const targetCount = getTargetCountForLevel(level, targetTotal);

                  // Color coding based on progress
                  const progressRatio = targetCount > 0 ? validatedCountAtLevel / targetCount : 0;
                  let statusColor = 'text-red-400';
                  if (progressRatio >= 1.0) statusColor = 'text-emerald-400';
                  else if (progressRatio >= 0.85) statusColor = 'text-green-400';
                  else if (progressRatio >= 0.5) statusColor = 'text-amber-400';

                  return (
                    <div
                      key={level}
                      className="flex justify-between items-center py-0.5 px-1 hover:bg-gray-800 rounded"
                    >
                      <span className="text-gray-300">
                        {t('cardGallery.levelLabel', { level })}
                      </span>
                      <div className="flex items-center gap-1.5 font-mono">
                        <span
                          className={`${statusColor} font-bold`}
                          title={t('cardGallery.validatedTitle')}
                        >
                          ✓{validatedCountAtLevel}
                        </span>
                        <span className="text-gray-500">/</span>
                        <span
                          className="text-gray-400 text-[10px]"
                          title={t('cardGallery.generatedTitle')}
                        >
                          {currentCount}
                        </span>
                        <span className="text-gray-500">/</span>
                        <span className="text-gray-400" title={t('cardGallery.targetTitle')}>
                          {targetCount}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
};

export default CardGallery;
