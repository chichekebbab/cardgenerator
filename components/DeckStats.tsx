import React from 'react';
import { CardData, CardType } from '../types';

interface DeckStatsProps {
  cards: CardData[];
}

const TARGETS = {
  // DONJON (Total ~80 basé sur la somme des sous-totaux fournis)
  CLASSES: 12,
  RACES: 9,
  MONSTER_1_5: 15,
  MONSTER_6_10: 12,
  MONSTER_11_15: 7,
  MONSTER_16_20: 4,
  CURSES: 15,
  MODIFIERS: 6,

  // TRÉSOR (Total ~73)
  HEAD: 5,
  ARMOR: 5,
  FEET: 5,
  HANDS: 25,
  TREASURE_OTHER: 5, // "Autres" équipements
  ONESHOT_GUAL: 28, // 18 One-shot + 10 GUAL
};

// Fonction utilitaire pour la couleur
const getStatusColor = (current: number, target: number) => {
  const percentage = target > 0 ? current / target : 0;
  if (percentage >= 1.0) return 'text-green-600'; // Atteint ou dépassé
  if (percentage >= 0.9) return 'text-green-500'; // Très proche
  if (percentage >= 0.5) return 'text-orange-500'; // En cours
  return 'text-red-500'; // Début
};

const StatRow: React.FC<{ label: string; current: number; target: number; isHeader?: boolean }> = ({ label, current, target, isHeader = false }) => {
  const colorClass = getStatusColor(current, target);

  // Style différent pour les lignes standards vs les totaux
  const containerClass = isHeader
    ? `flex justify-between items-center p-2 rounded border-b-2 mb-2 bg-gray-50 border-gray-200`
    : `flex justify-between items-center text-xs p-1 px-2 rounded border mb-1 bg-white border-gray-100`;

  const textClass = isHeader ? "font-bold text-sm text-gray-800 uppercase" : "text-gray-600 font-medium truncate pr-2";
  const numberClass = isHeader ? `font-bold font-mono text-sm ${colorClass}` : `font-bold font-mono ${colorClass}`;

  return (
    <div className={containerClass}>
      <span className={textClass}>{label}</span>
      <span className={numberClass}>
        {current} <span className="text-gray-400 font-normal text-[10px]">/ {target}</span>
      </span>
    </div>
  );
};

const DeckStats: React.FC<DeckStatsProps> = ({ cards }) => {
  // --- CALCULS DONJON ---
  const classes = cards.filter(c => c.type === CardType.CLASS).length;
  const races = cards.filter(c => c.type === CardType.RACE).length;
  const curses = cards.filter(c => c.type === CardType.CURSE).length;
  const modifiers = cards.filter(c => c.type === CardType.OTHER || c.type === CardType.FAITHFUL_SERVANT).length;

  const monsters = cards.filter(c => c.type === CardType.MONSTER);
  const m1_5 = monsters.filter(c => (c.level || 0) >= 1 && (c.level || 0) <= 5).length;
  const m6_10 = monsters.filter(c => (c.level || 0) >= 6 && (c.level || 0) <= 10).length;
  const m11_15 = monsters.filter(c => (c.level || 0) >= 11 && (c.level || 0) <= 15).length;
  const m16_20 = monsters.filter(c => (c.level || 0) >= 16).length;

  // Total Donjon Actuel
  const totalDungeonCurrent = classes + races + curses + modifiers + monsters.length;
  // Total Donjon Cible (Somme des constantes)
  const totalDungeonTarget = TARGETS.CLASSES + TARGETS.RACES + TARGETS.CURSES + TARGETS.MODIFIERS + TARGETS.MONSTER_1_5 + TARGETS.MONSTER_6_10 + TARGETS.MONSTER_11_15 + TARGETS.MONSTER_16_20;

  // --- CALCULS TRÉSOR ---
  const items = cards.filter(c => c.type === CardType.ITEM);

  const head = items.filter(c => c.itemSlot === 'Couvre-chef').length;
  const armor = items.filter(c => c.itemSlot === 'Armure').length;
  const feet = items.filter(c => c.itemSlot === 'Chaussures').length;
  const hands = items.filter(c => c.itemSlot === '1 Main' || c.itemSlot === '2 Mains').length;

  // "Autres" : Items avec slot mais pas l'un des standards (ex: Accessoire) OU slot explicitement "Autre"
  // Pour simplifier ici, on compte ce qui a un slot mais n'est pas dans les catégories ci-dessus
  const standardSlots = ['Couvre-chef', 'Armure', 'Chaussures', '1 Main', '2 Mains'];
  const otherEquip = items.filter(c => c.itemSlot && !standardSlots.includes(c.itemSlot)).length;

  // One shot / GUAL : Pas de slot défini
  const oneshot = items.filter(c => !c.itemSlot).length;

  // Total Trésor Actuel
  const totalTreasureCurrent = items.length;
  // Total Trésor Cible
  const totalTreasureTarget = TARGETS.HEAD + TARGETS.ARMOR + TARGETS.FEET + TARGETS.HANDS + TARGETS.TREASURE_OTHER + TARGETS.ONESHOT_GUAL;

  // --- TOTAUX GLOBAUX ---
  const grandTotalCurrent = totalDungeonCurrent + totalTreasureCurrent;
  const grandTotalTarget = totalDungeonTarget + totalTreasureTarget;

  return (
    <div className="flex flex-col h-full bg-stone-50 overflow-hidden font-sans">
      <div className="bg-stone-800 text-stone-200 text-xs font-bold uppercase p-3 text-center tracking-wider border-b border-stone-600 shadow-md z-10">
        📊 Tableau de Bord
      </div>

      <div className="overflow-y-auto p-3 scrollbar-thin scrollbar-thumb-stone-400 space-y-6">

        {/* GLOBAL TOTAL */}
        <div className="bg-amber-100 border border-amber-300 rounded-lg p-3 shadow-sm">
          <div className="flex justify-between items-end mb-1">
            <span className="text-amber-900 font-bold uppercase text-xs tracking-wider">Progression Totale</span>
            <span className={`text-lg font-bold font-mono ${getStatusColor(grandTotalCurrent, grandTotalTarget)}`}>
              {grandTotalCurrent} <span className="text-sm text-gray-500 font-medium">/ {grandTotalTarget}</span>
            </span>
          </div>
          <div className="w-full bg-amber-200 rounded-full h-2.5 overflow-hidden">
            <div
              className="bg-amber-600 h-2.5 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, (grandTotalCurrent / grandTotalTarget) * 100)}%` }}
            ></div>
          </div>
        </div>

        {/* SECTION DONJON */}
        <div>
          <div className="flex items-center justify-between mb-2 border-b-2 border-[#8b0000]/30 pb-1">
            <h4 className="text-sm font-bold text-[#8b0000] uppercase flex items-center gap-2">
              🚪 Donjon
            </h4>
            <span className={`font-mono text-xs font-bold ${getStatusColor(totalDungeonCurrent, totalDungeonTarget)}`}>
              {totalDungeonCurrent} / {totalDungeonTarget}
            </span>
          </div>

          <div className="space-y-0.5 pl-1">
            <StatRow label="Classes" current={classes} target={TARGETS.CLASSES} />
            <StatRow label="Races" current={races} target={TARGETS.RACES} />
            <StatRow label="Malédictions" current={curses} target={TARGETS.CURSES} />
            <StatRow label="Modificateurs/Autres" current={modifiers} target={TARGETS.MODIFIERS} />

            <div className="mt-3 mb-1">
              <span className="text-[10px] text-gray-500 font-bold uppercase block mb-1 border-b border-gray-200">Monstres</span>
              <StatRow label="Niv 1-5" current={m1_5} target={TARGETS.MONSTER_1_5} />
              <StatRow label="Niv 6-10" current={m6_10} target={TARGETS.MONSTER_6_10} />
              <StatRow label="Niv 11-15" current={m11_15} target={TARGETS.MONSTER_11_15} />
              <StatRow label="Niv 16-20" current={m16_20} target={TARGETS.MONSTER_16_20} />
            </div>
          </div>
        </div>

        {/* SECTION TRÉSOR */}
        <div>
          <div className="flex items-center justify-between mb-2 border-b-2 border-[#b8860b]/30 pb-1">
            <h4 className="text-sm font-bold text-[#b8860b] uppercase flex items-center gap-2">
              💰 Trésor
            </h4>
            <span className={`font-mono text-xs font-bold ${getStatusColor(totalTreasureCurrent, totalTreasureTarget)}`}>
              {totalTreasureCurrent} / {totalTreasureTarget}
            </span>
          </div>

          <div className="space-y-0.5 pl-1">
            <StatRow label="Couvre-chef" current={head} target={TARGETS.HEAD} />
            <StatRow label="Armures" current={armor} target={TARGETS.ARMOR} />
            <StatRow label="Chaussures" current={feet} target={TARGETS.FEET} />
            <StatRow label="Mains / Armes" current={hands} target={TARGETS.HANDS} />
            <StatRow label="Autres Équip." current={otherEquip} target={TARGETS.TREASURE_OTHER} />
            <StatRow label="Usage Unique / GUAL" current={oneshot} target={TARGETS.ONESHOT_GUAL} />
          </div>
        </div>

      </div>
    </div>
  );
};

export default DeckStats;