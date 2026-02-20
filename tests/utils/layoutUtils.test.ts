import { describe, it, expect } from 'vitest';
import {
  getLayoutFilename,
  getCardCategory,
  getExportFilename,
  formatBonus,
} from '../../utils/layoutUtils';
import { CardData, CardType, INITIAL_CARD_DATA } from '../../types';

function makeCard(overrides: Partial<CardData> = {}): CardData {
  return { ...INITIAL_CARD_DATA, id: 'test-id', ...overrides };
}

describe('getLayoutFilename', () => {
  it('returns layout_class.png for Classe cards', () => {
    expect(getLayoutFilename(makeCard({ type: CardType.CLASS }))).toBe('layout_class.png');
  });

  it('returns layout_race.png for Race cards', () => {
    expect(getLayoutFilename(makeCard({ type: CardType.RACE }))).toBe('layout_race.png');
  });

  it('returns layout_malediction.png for Malediction cards', () => {
    expect(getLayoutFilename(makeCard({ type: CardType.CURSE }))).toBe('layout_malediction.png');
  });

  it('returns layout_equipement.png for Item with itemSlot', () => {
    expect(getLayoutFilename(makeCard({ type: CardType.ITEM, itemSlot: '1 Main' }))).toBe(
      'layout_equipement.png',
    );
  });

  it('returns layout_equipement.png for Item with isBig', () => {
    expect(getLayoutFilename(makeCard({ type: CardType.ITEM, itemSlot: '', isBig: true }))).toBe(
      'layout_equipement.png',
    );
  });

  it('returns layout_item.png for Item without slot or big', () => {
    expect(getLayoutFilename(makeCard({ type: CardType.ITEM, itemSlot: '', isBig: false }))).toBe(
      'layout_item.png',
    );
  });

  it('returns layout_equipement.png for Amelioration de Monture items', () => {
    expect(
      getLayoutFilename(makeCard({ type: CardType.ITEM, itemSlot: 'Amélioration de Monture' })),
    ).toBe('layout_equipement.png');
  });

  it('returns layout_lvlup.png for Gain de niveau cards', () => {
    expect(getLayoutFilename(makeCard({ type: CardType.LEVEL_UP }))).toBe('layout_lvlup.png');
  });

  it('returns layout_malediction.png for Fidele serviteur cards', () => {
    expect(getLayoutFilename(makeCard({ type: CardType.FAITHFUL_SERVANT }))).toBe(
      'layout_malediction.png',
    );
  });

  it('returns layout_malediction.png for trap cards', () => {
    expect(getLayoutFilename(makeCard({ type: CardType.DUNGEON_TRAP }))).toBe(
      'layout_malediction.png',
    );
    expect(getLayoutFilename(makeCard({ type: CardType.TREASURE_TRAP }))).toBe(
      'layout_malediction.png',
    );
  });

  it('returns layout_monstre.png for Monster cards (default)', () => {
    expect(getLayoutFilename(makeCard({ type: CardType.MONSTER }))).toBe('layout_monstre.png');
  });
});

describe('getCardCategory', () => {
  it('returns Donjon for Monster', () => {
    expect(getCardCategory(makeCard({ type: CardType.MONSTER }))).toBe('Donjon');
  });

  it('returns Donjon for Curse', () => {
    expect(getCardCategory(makeCard({ type: CardType.CURSE }))).toBe('Donjon');
  });

  it('returns Donjon for Class and Race', () => {
    expect(getCardCategory(makeCard({ type: CardType.CLASS }))).toBe('Donjon');
    expect(getCardCategory(makeCard({ type: CardType.RACE }))).toBe('Donjon');
  });

  it('returns Donjon for dungeon-type cards', () => {
    expect(getCardCategory(makeCard({ type: CardType.DUNGEON_TRAP }))).toBe('Donjon');
    expect(getCardCategory(makeCard({ type: CardType.DUNGEON_BONUS }))).toBe('Donjon');
    expect(getCardCategory(makeCard({ type: CardType.FAITHFUL_SERVANT }))).toBe('Donjon');
  });

  it('returns Tresor for Item', () => {
    expect(getCardCategory(makeCard({ type: CardType.ITEM }))).toBe('Tresor');
  });

  it('returns Tresor for Level Up', () => {
    expect(getCardCategory(makeCard({ type: CardType.LEVEL_UP }))).toBe('Tresor');
  });

  it('returns Tresor for Treasure Trap', () => {
    expect(getCardCategory(makeCard({ type: CardType.TREASURE_TRAP }))).toBe('Tresor');
  });

  it('returns Tresor for Other', () => {
    expect(getCardCategory(makeCard({ type: CardType.OTHER }))).toBe('Tresor');
  });
});

describe('getExportFilename', () => {
  it('generates correct filename with index', () => {
    const card = makeCard({ title: 'Dragon Enflammé', type: CardType.MONSTER });
    const result = getExportFilename(card, 0);
    expect(result).toBe('Donjon_Monstre_001_dragon-enflamme.png');
  });

  it('generates filename with XXX when no index', () => {
    const card = makeCard({ title: 'Épée Magique', type: CardType.ITEM, itemSlot: '' });
    const result = getExportFilename(card);
    expect(result).toBe('Tresor_Objet_XXX_epee-magique.png');
  });

  it('handles empty title', () => {
    const card = makeCard({ title: '', type: CardType.MONSTER });
    const result = getExportFilename(card, 5);
    expect(result).toBe('Donjon_Monstre_006_carte.png');
  });

  it('pads index to 3 digits', () => {
    const card = makeCard({ title: 'Test', type: CardType.MONSTER });
    expect(getExportFilename(card, 99)).toContain('_100_');
  });
});

describe('formatBonus', () => {
  it('returns empty string for empty input', () => {
    expect(formatBonus('')).toBe('');
  });

  it('returns empty string for 0', () => {
    expect(formatBonus(0)).toBe('');
  });

  it('adds + prefix for positive numbers', () => {
    expect(formatBonus(5)).toBe('+5');
    expect(formatBonus('3')).toBe('+3');
  });

  it('keeps - prefix for negative numbers', () => {
    expect(formatBonus(-5)).toBe('-5');
    expect(formatBonus('-3')).toBe('-3');
  });

  it('handles range with /', () => {
    expect(formatBonus('2/4')).toBe('+2/4');
  });

  it('handles negative range with /', () => {
    expect(formatBonus('-2/-4')).toBe('-2/4');
  });

  it('returns empty for non-numeric single values', () => {
    expect(formatBonus('abc')).toBe('');
  });

  it('returns raw string for non-numeric range parts', () => {
    expect(formatBonus('a/b')).toBe('a/b');
  });
});
