import React, { useState, useEffect } from 'react';
import { CardData, CardType } from '../types';
import {
  getTargetCountForLevel,
  getAllTargets,
  getTargetCountForSlot,
} from '../utils/balancingConfig';
import { useTranslation } from '../i18n/LanguageContext';

interface DeckStatsProps {
  cards: CardData[];
  targetTotal?: number;
  onTargetTotalChange?: (newTarget: number) => void;
}

// Valeurs de base par défaut (total: 350 cartes)

// Fonction utilitaire pour la couleur de progression
const getStatusColor = (current: number, target: number, isDark: boolean = false) => {
  const percentage = target > 0 ? current / target : 0;
  if (percentage >= 1.0) return isDark ? 'text-emerald-400' : 'text-emerald-600';
  if (percentage >= 0.85) return isDark ? 'text-green-400' : 'text-green-600';
  if (percentage >= 0.5) return isDark ? 'text-amber-400' : 'text-amber-500';
  return isDark ? 'text-rose-400' : 'text-rose-500';
};

const StatRow: React.FC<{
  label: string;
  current: number;
  validated: number;
  target: number;
}> = ({ label, current, validated, target }) => {
  const { t } = useTranslation();
  const colorClass = getStatusColor(validated, target);
  const secondaryColorClass = getStatusColor(current, target);

  return (
    <div className="flex justify-between items-center text-xs py-1.5 px-2 hover:bg-stone-50 transition-colors border-b border-stone-100 last:border-0">
      <span className="text-gray-600 truncate max-w-[80px]" title={label}>
        {label}
      </span>
      <div className="flex items-center gap-1.5 font-mono text-xs">
        <span className={`${colorClass} font-bold`} title={t('deckStats.validated')}>
          ✓{validated}
        </span>
        <span className="text-stone-300">/</span>
        <span
          className={`${secondaryColorClass} opacity-60 text-[10px]`}
          title={t('deckStats.generated')}
        >
          {current}
        </span>
        <span className="text-stone-300">/</span>
        <span className="text-stone-400" title={t('deckStats.target')}>
          {target}
        </span>
      </div>
    </div>
  );
};

const DeckStats: React.FC<DeckStatsProps> = ({ cards, targetTotal = 350, onTargetTotalChange }) => {
  const { t } = useTranslation();
  // État local pour l'édition temporaire
  const [isEditingTarget, setIsEditingTarget] = useState(false);
  const [tempTarget, setTempTarget] = useState<string>(String(targetTotal));

  // Update temp target when prop changes
  useEffect(() => {
    if (!isEditingTarget) {
      setTempTarget(String(targetTotal));
    }
  }, [targetTotal, isEditingTarget]);

  // État pour les sections repliables
  const [isDungeonExpanded, setIsDungeonExpanded] = useState(false);
  const [isTreasureExpanded, setIsTreasureExpanded] = useState(false);
  const [isMonsterLevelExpanded, setIsMonsterLevelExpanded] = useState(false);
  const [isItemDetailExpanded, setIsItemDetailExpanded] = useState(false);

  // Charger les préférences d'affichage depuis localStorage
  useEffect(() => {
    const savedDungeonExpanded = localStorage.getItem('deckstats_dungeon_expanded');
    if (savedDungeonExpanded !== null) {
      setIsDungeonExpanded(savedDungeonExpanded === 'true');
    }

    const savedTreasureExpanded = localStorage.getItem('deckstats_treasure_expanded');
    if (savedTreasureExpanded !== null) {
      setIsTreasureExpanded(savedTreasureExpanded === 'true');
    }

    const savedMonsterLevelExpanded = localStorage.getItem('deckstats_monster_level_expanded');
    if (savedMonsterLevelExpanded !== null) {
      setIsMonsterLevelExpanded(savedMonsterLevelExpanded === 'true');
    }

    const savedItemDetailExpanded = localStorage.getItem('deckstats_item_detail_expanded');
    if (savedItemDetailExpanded !== null) {
      setIsItemDetailExpanded(savedItemDetailExpanded === 'true');
    }
  }, []);

  // Sauvegarder le nouveau total via le callback parent
  const saveTargetTotal = (newTarget: number) => {
    if (onTargetTotalChange) {
      onTargetTotalChange(newTarget);
    }
  };

  const toggleDungeonExpanded = () => {
    const newValue = !isDungeonExpanded;
    setIsDungeonExpanded(newValue);
    localStorage.setItem('deckstats_dungeon_expanded', String(newValue));
  };

  const toggleTreasureExpanded = () => {
    const newValue = !isTreasureExpanded;
    setIsTreasureExpanded(newValue);
    localStorage.setItem('deckstats_treasure_expanded', String(newValue));
  };

  const toggleMonsterLevelExpanded = () => {
    const newValue = !isMonsterLevelExpanded;
    setIsMonsterLevelExpanded(newValue);
    localStorage.setItem('deckstats_monster_level_expanded', String(newValue));
  };

  const toggleItemDetailExpanded = () => {
    const newValue = !isItemDetailExpanded;
    setIsItemDetailExpanded(newValue);
    localStorage.setItem('deckstats_item_detail_expanded', String(newValue));
  };

  // Calculer les cibles ajustées
  const adjustedTargets = getAllTargets(targetTotal);

  // --- CALCULS DONJON ---
  const raceCards = cards.filter((c) => c.type === CardType.RACE);
  const classCards = cards.filter((c) => c.type === CardType.CLASS);
  const dungeonTrapCards = cards.filter((c) => c.type === CardType.DUNGEON_TRAP);
  const faithfulServantCards = cards.filter((c) => c.type === CardType.FAITHFUL_SERVANT);
  const dungeonBonusCards = cards.filter((c) => c.type === CardType.DUNGEON_BONUS);
  const levelUpCards = cards.filter((c) => c.type === CardType.LEVEL_UP);
  const curseCards = cards.filter((c) => c.type === CardType.CURSE);
  const monsterCards = cards.filter((c) => c.type === CardType.MONSTER);

  const raceCount = raceCards.length;
  const raceValidated = raceCards.filter((c) => c.isValidated).length;

  const classCount = classCards.length;
  const classValidated = classCards.filter((c) => c.isValidated).length;

  const dungeonTrapCount = dungeonTrapCards.length;
  const dungeonTrapValidated = dungeonTrapCards.filter((c) => c.isValidated).length;

  const faithfulServantCount = faithfulServantCards.length;
  const faithfulServantValidated = faithfulServantCards.filter((c) => c.isValidated).length;

  const dungeonBonusCount = dungeonBonusCards.length;
  const dungeonBonusValidated = dungeonBonusCards.filter((c) => c.isValidated).length;

  const levelUpCount = levelUpCards.length;
  const levelUpValidated = levelUpCards.filter((c) => c.isValidated).length;

  const curseCount = curseCards.length;
  const curseValidated = curseCards.filter((c) => c.isValidated).length;

  const monsterCount = monsterCards.length;
  const monsterValidated = monsterCards.filter((c) => c.isValidated).length;

  // Total Donjon
  const totalDungeonCurrent =
    raceCount +
    classCount +
    dungeonTrapCount +
    faithfulServantCount +
    dungeonBonusCount +
    levelUpCount +
    curseCount +
    monsterCount;
  const totalDungeonValidated =
    raceValidated +
    classValidated +
    dungeonTrapValidated +
    faithfulServantValidated +
    dungeonBonusValidated +
    levelUpValidated +
    curseValidated +
    monsterValidated;
  const totalDungeonTarget =
    adjustedTargets.RACE +
    adjustedTargets.CLASS +
    adjustedTargets.DUNGEON_TRAP +
    adjustedTargets.FAITHFUL_SERVANT +
    adjustedTargets.DUNGEON_BONUS +
    adjustedTargets.LEVEL_UP +
    adjustedTargets.CURSE +
    adjustedTargets.MONSTER;

  // --- CALCULS TRÉSOR ---
  const treasureTrapCards = cards.filter((c) => c.type === CardType.TREASURE_TRAP);
  const itemCards = cards.filter((c) => c.type === CardType.ITEM);

  const treasureTrapCount = treasureTrapCards.length;
  const treasureTrapValidated = treasureTrapCards.filter((c) => c.isValidated).length;

  const itemCount = itemCards.length;
  const itemValidated = itemCards.filter((c) => c.isValidated).length;

  // Total Trésor
  const totalTreasureCurrent = treasureTrapCount + itemCount;
  const totalTreasureValidated = treasureTrapValidated + itemValidated;
  const totalTreasureTarget = adjustedTargets.TREASURE_TRAP + adjustedTargets.ITEM;

  // --- CALCULS AUTRE ---
  const otherCards = cards.filter((c) => c.type === CardType.OTHER);
  const otherCount = otherCards.length;
  const otherValidated = otherCards.filter((c) => c.isValidated).length;

  // --- TOTAUX GLOBAUX (toutes les cartes, y compris "Autre") ---
  const grandTotalCurrent = cards.length;
  const grandTotalValidated = cards.filter((c) => c.isValidated).length;
  const grandTotalTarget = targetTotal;

  // Gestion de l'édition du nombre cible
  const handleEditTarget = () => {
    setIsEditingTarget(true);
    setTempTarget(String(targetTotal));
  };

  const handleSaveTarget = () => {
    const parsed = parseInt(tempTarget, 10);
    if (!isNaN(parsed) && parsed > 0) {
      saveTargetTotal(parsed);
    } else {
      setTempTarget(String(targetTotal));
    }
    setIsEditingTarget(false);
  };

  const handleCancelEdit = () => {
    setTempTarget(String(targetTotal));
    setIsEditingTarget(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveTarget();
    } else if (e.key === 'Escape') {
      handleCancelEdit();
    }
  };

  return (
    <div className="flex flex-col h-full bg-stone-50 overflow-hidden font-sans">
      <div className="bg-stone-800 text-stone-200 text-xs font-bold uppercase p-2 text-center tracking-wider border-b border-stone-600 shadow-md z-10">
        📊 {t('deckStats.title')}
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-stone-400 space-y-2">
        {/* EDITABLE TARGET TOTAL - Compact */}
        <div className="bg-blue-50 border border-blue-200 rounded p-2">
          <div className="flex justify-between items-center mb-1">
            <span className="text-blue-900 font-bold text-[11px] uppercase">
              🎯 {t('deckStats.targetTitle')}
            </span>
            {!isEditingTarget && (
              <button
                onClick={handleEditTarget}
                className="text-blue-600 hover:text-blue-800 text-[10px] underline"
              >
                {t('deckStats.edit')}
              </button>
            )}
          </div>

          {isEditingTarget ? (
            <div className="flex items-center gap-1">
              <input
                type="number"
                value={tempTarget}
                onChange={(e) => setTempTarget(e.target.value)}
                onKeyDown={handleKeyDown}
                className="flex-1 px-2 py-1 text-sm border border-blue-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                autoFocus
                min="1"
              />
              <button
                onClick={handleSaveTarget}
                className="bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded text-xs"
              >
                ✓
              </button>
              <button
                onClick={handleCancelEdit}
                className="bg-gray-400 hover:bg-gray-500 text-white px-2 py-1 rounded text-xs"
              >
                ✕
              </button>
            </div>
          ) : (
            <div className="text-center">
              <span className="text-2xl font-bold text-blue-800 font-mono">{targetTotal}</span>
            </div>
          )}
        </div>

        {/* PROGRESSION GLOBALE - Refonte */}
        <div className="bg-stone-100 border border-stone-200 rounded p-2 shadow-sm">
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-stone-700 font-bold text-[11px] uppercase tracking-wider">
              {t('deckStats.globalState')}
            </span>
            <div className="font-mono text-sm font-bold flex items-center gap-1.5">
              <span
                className={`${getStatusColor(grandTotalValidated, grandTotalTarget)}`}
                title={t('deckStats.validated')}
              >
                ✓{grandTotalValidated}
              </span>
              <span className="text-stone-300">/</span>
              <span className="text-stone-400 text-xs" title={t('deckStats.generated')}>
                {grandTotalCurrent}
              </span>
              <span className="text-stone-300">/</span>
              <span className="text-stone-400" title={t('deckStats.target')}>
                {grandTotalTarget}
              </span>
            </div>
          </div>

          <div className="space-y-1.5">
            {/* Barre de progression Validée (Primaire) */}
            <div className="relative">
              <div className="w-full bg-stone-200 rounded-full h-2 overflow-hidden">
                <div
                  className={`h-2 rounded-full transition-all duration-700 ease-out ${getStatusColor(grandTotalValidated, grandTotalTarget).replace('text-', 'bg-')}`}
                  style={{
                    width: `${Math.min(100, (grandTotalValidated / grandTotalTarget) * 100)}%`,
                  }}
                ></div>
              </div>
              <div className="flex justify-between items-center mt-0.5 px-0.5">
                <span className="text-[9px] text-stone-500 uppercase font-bold">
                  {t('deckStats.validationTarget')}
                </span>
                <span
                  className={`text-[10px] font-bold ${getStatusColor(grandTotalValidated, grandTotalTarget)}`}
                >
                  {Math.round((grandTotalValidated / grandTotalTarget) * 100)}%
                </span>
              </div>
            </div>

            {/* Barre de progression Générée (Secondaire) */}
            <div>
              <div className="w-full bg-stone-200 rounded-full h-1 overflow-hidden">
                <div
                  className="bg-stone-400 h-1 rounded-full transition-all duration-700 ease-out opacity-40"
                  style={{
                    width: `${Math.min(100, (grandTotalCurrent / grandTotalTarget) * 100)}%`,
                  }}
                ></div>
              </div>
              <div className="flex justify-between items-center mt-0.5 px-0.5">
                <span className="text-[9px] text-stone-400 uppercase font-medium">
                  {t('deckStats.totalGeneration')}
                </span>
                <span className="text-[10px] text-stone-400 font-bold">
                  {Math.round((grandTotalCurrent / grandTotalTarget) * 100)}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION DONJON - Compact */}
        <div className="border border-gray-200 rounded overflow-hidden">
          <button
            onClick={toggleDungeonExpanded}
            className="w-full bg-gradient-to-r from-red-900 to-red-800 hover:from-red-800 hover:to-red-700 text-white p-2 flex items-center justify-between transition-colors"
          >
            <div className="flex items-center gap-1.5">
              <span className="text-base">🚪</span>
              <span className="text-xs font-bold uppercase">{t('deckStats.dungeon')}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold flex items-center gap-1">
                <span className={getStatusColor(totalDungeonValidated, totalDungeonTarget, true)}>
                  ✓{totalDungeonValidated}
                </span>
                <span className="text-white/20">/</span>
                <span className="text-white/40 text-[10px]">{totalDungeonCurrent}</span>
                <span className="text-white/20">/</span>
                <span className="text-white/60">{totalDungeonTarget}</span>
              </span>
              <span
                className="text-sm transition-transform duration-200"
                style={{ transform: isDungeonExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
              >
                ▼
              </span>
            </div>
          </button>

          {isDungeonExpanded && (
            <div className="bg-white p-2">
              <StatRow
                label={t('deckStats.labels.race')}
                current={raceCount}
                validated={raceValidated}
                target={adjustedTargets.RACE}
              />
              <StatRow
                label={t('deckStats.labels.class')}
                current={classCount}
                validated={classValidated}
                target={adjustedTargets.CLASS}
              />
              <StatRow
                label={t('deckStats.labels.dungeonTrap')}
                current={dungeonTrapCount}
                validated={dungeonTrapValidated}
                target={adjustedTargets.DUNGEON_TRAP}
              />
              <StatRow
                label={t('deckStats.labels.faithfulServant')}
                current={faithfulServantCount}
                validated={faithfulServantValidated}
                target={adjustedTargets.FAITHFUL_SERVANT}
              />
              <StatRow
                label={t('deckStats.labels.dungeonBonus')}
                current={dungeonBonusCount}
                validated={dungeonBonusValidated}
                target={adjustedTargets.DUNGEON_BONUS}
              />
              <StatRow
                label={t('deckStats.labels.levelUp')}
                current={levelUpCount}
                validated={levelUpValidated}
                target={adjustedTargets.LEVEL_UP}
              />
              <StatRow
                label={t('deckStats.labels.curse')}
                current={curseCount}
                validated={curseValidated}
                target={adjustedTargets.CURSE}
              />
              <StatRow
                label={t('deckStats.labels.monsters')}
                current={monsterCount}
                validated={monsterValidated}
                target={adjustedTargets.MONSTER}
              />

              {/* Monster Level Distribution Subsection */}
              <div className="mt-2 border-t border-gray-200 pt-2">
                <button
                  onClick={toggleMonsterLevelExpanded}
                  className="w-full flex items-center justify-between text-xs hover:bg-stone-50 transition-colors py-1.5 px-2 rounded"
                >
                  <span className="text-gray-600 font-medium flex items-center gap-1">
                    <span className="text-[10px]">📊</span> {t('deckStats.monsterDistribution')}
                  </span>
                  <span
                    className="text-[10px] transition-transform duration-200"
                    style={{
                      transform: isMonsterLevelExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                    }}
                  >
                    ▼
                  </span>
                </button>

                {isMonsterLevelExpanded && (
                  <div className="mt-1 space-y-1 pl-2">
                    {Array.from({ length: 20 }, (_, i) => i + 1).map((level) => {
                      // Count monsters at this specific level
                      const monstersAtLevel = monsterCards.filter((c) => {
                        const cLevel = typeof c.level === 'number' ? c.level : 0;
                        return cLevel === level;
                      });
                      const currentCount = monstersAtLevel.length;
                      const validatedCount = monstersAtLevel.filter((c) => c.isValidated).length;
                      const targetCount = getTargetCountForLevel(level, targetTotal);

                      return (
                        <StatRow
                          key={level}
                          label={t('deckStats.levelLabel', { level })}
                          current={currentCount}
                          validated={validatedCount}
                          target={targetCount}
                        />
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* SECTION TRÉSOR - Compact */}
        <div className="border border-gray-200 rounded overflow-hidden">
          <button
            onClick={toggleTreasureExpanded}
            className="w-full bg-gradient-to-r from-yellow-700 to-yellow-600 hover:from-yellow-600 hover:to-yellow-500 text-white p-2 flex items-center justify-between transition-colors"
          >
            <div className="flex items-center gap-1.5">
              <span className="text-base">💰</span>
              <span className="text-xs font-bold uppercase">{t('deckStats.treasure')}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold flex items-center gap-1">
                <span className={getStatusColor(totalTreasureValidated, totalTreasureTarget, true)}>
                  ✓{totalTreasureValidated}
                </span>
                <span className="text-white/20">/</span>
                <span className="text-white/40 text-[10px]">{totalTreasureCurrent}</span>
                <span className="text-white/20">/</span>
                <span className="text-white/60">{totalTreasureTarget}</span>
              </span>
              <span
                className="text-sm transition-transform duration-200"
                style={{ transform: isTreasureExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
              >
                ▼
              </span>
            </div>
          </button>

          {isTreasureExpanded && (
            <div className="bg-white p-2">
              <StatRow
                label={t('deckStats.labels.treasureTrap')}
                current={treasureTrapCount}
                validated={treasureTrapValidated}
                target={adjustedTargets.TREASURE_TRAP}
              />

              <div className="border-t border-gray-100 mt-1 pt-1">
                <button
                  onClick={toggleItemDetailExpanded}
                  className="w-full flex items-center justify-between text-xs hover:bg-stone-50 transition-colors py-1.5 px-2 rounded"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="text-gray-600 truncate max-w-[80px]"
                      title={t('deckStats.labels.items')}
                    >
                      {t('deckStats.labels.items')}
                    </span>
                    <div className="flex items-center gap-1.5 font-mono text-[10px]">
                      <span
                        className={`${getStatusColor(itemValidated, adjustedTargets.ITEM)} font-bold`}
                      >
                        ✓{itemValidated}
                      </span>
                      <span className="text-stone-300">/</span>
                      <span className="text-stone-400">{adjustedTargets.ITEM}</span>
                    </div>
                  </div>
                  <span
                    className="text-[10px] transition-transform duration-200"
                    style={{ transform: isItemDetailExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
                  >
                    ▼
                  </span>
                </button>

                {isItemDetailExpanded && (
                  <div className="mt-1 space-y-1 pl-2 border-l border-stone-100 ml-1">
                    {(() => {
                      const itemStats = {
                        USAGE_UNIQUE: { current: 0, validated: 0 },
                        AUTRE: { current: 0, validated: 0 },
                        AMELIORATION_MONTURE: { current: 0, validated: 0 },
                        ONE_HAND: { current: 0, validated: 0 },
                        NO_SLOT: { current: 0, validated: 0 },
                        BIG: { current: 0, validated: 0 },
                        ARMOR: { current: 0, validated: 0 },
                        HEADGEAR: { current: 0, validated: 0 },
                        FOOTGEAR: { current: 0, validated: 0 },
                        TWO_HANDS: { current: 0, validated: 0 },
                      };

                      itemCards.forEach((c) => {
                        if (c.isBig) {
                          itemStats.BIG.current++;
                          if (c.isValidated) itemStats.BIG.validated++;
                        } else if (!c.itemSlot || c.itemSlot === '') {
                          itemStats.USAGE_UNIQUE.current++;
                          if (c.isValidated) itemStats.USAGE_UNIQUE.validated++;
                        } else if (c.itemSlot === '1 Main') {
                          itemStats.ONE_HAND.current++;
                          if (c.isValidated) itemStats.ONE_HAND.validated++;
                        } else if (c.itemSlot === '2 Mains') {
                          itemStats.TWO_HANDS.current++;
                          if (c.isValidated) itemStats.TWO_HANDS.validated++;
                        } else if (c.itemSlot === 'Couvre-chef') {
                          itemStats.HEADGEAR.current++;
                          if (c.isValidated) itemStats.HEADGEAR.validated++;
                        } else if (c.itemSlot === 'Chaussures') {
                          itemStats.FOOTGEAR.current++;
                          if (c.isValidated) itemStats.FOOTGEAR.validated++;
                        } else if (c.itemSlot === 'Armure') {
                          itemStats.ARMOR.current++;
                          if (c.isValidated) itemStats.ARMOR.validated++;
                        } else if (c.itemSlot === 'NoSlot') {
                          itemStats.NO_SLOT.current++;
                          if (c.isValidated) itemStats.NO_SLOT.validated++;
                        } else if (
                          c.itemSlot === 'Amélioration' ||
                          c.itemSlot === 'Monture' ||
                          c.itemSlot === 'Amélioration de Monture'
                        ) {
                          itemStats.AMELIORATION_MONTURE.current++;
                          if (c.isValidated) itemStats.AMELIORATION_MONTURE.validated++;
                        } else {
                          itemStats.AUTRE.current++;
                          if (c.isValidated) itemStats.AUTRE.validated++;
                        }
                      });

                      const labelsMap = {
                        USAGE_UNIQUE: t('deckStats.usageUnique'),
                        AUTRE: t('deckStats.other'),
                        AMELIORATION_MONTURE: t('deckStats.steedEnhancement'),
                        ONE_HAND: t('deckStats.oneHand'),
                        NO_SLOT: t('deckStats.noSlot'),
                        BIG: t('deckStats.big'),
                        ARMOR: t('deckStats.armor'),
                        HEADGEAR: t('deckStats.headgear'),
                        FOOTGEAR: t('deckStats.footgear'),
                        TWO_HANDS: t('deckStats.twoHands'),
                      };

                      return (Object.keys(itemStats) as Array<keyof typeof itemStats>).map(
                        (key) => (
                          <StatRow
                            key={key}
                            label={labelsMap[key]}
                            current={itemStats[key].current}
                            validated={itemStats[key].validated}
                            target={getTargetCountForSlot(key, targetTotal)}
                          />
                        ),
                      );
                    })()}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* SECTION AUTRE (si des cartes "Autre" existent) */}
          {otherCount > 0 && (
            <div className="bg-gray-50 border border-gray-200 rounded p-2">
              <StatRow
                label={t('deckStats.other')}
                current={otherCount}
                validated={otherValidated}
                target={0}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DeckStats;
