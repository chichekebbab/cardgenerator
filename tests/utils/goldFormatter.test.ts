import { describe, it, expect } from 'vitest';
import { extractGoldValue, formatGoldDisplay } from '../../utils/goldFormatter';
import { CardType } from '../../types';

describe('extractGoldValue', () => {
  it('returns null for undefined', () => {
    expect(extractGoldValue(undefined)).toBeNull();
  });

  it('returns null for empty string', () => {
    expect(extractGoldValue('')).toBeNull();
    expect(extractGoldValue('   ')).toBeNull();
  });

  it('returns null for string without numbers', () => {
    expect(extractGoldValue('aucun')).toBeNull();
  });

  it('extracts number from "3 trésors"', () => {
    expect(extractGoldValue('3 trésors')).toBe(3);
  });

  it('extracts number from "500 PO"', () => {
    expect(extractGoldValue('500 PO')).toBe(500);
  });

  it('extracts plain number', () => {
    expect(extractGoldValue('3')).toBe(3);
  });

  it('extracts number from "500 Pièces d\'Or"', () => {
    expect(extractGoldValue("500 Pièces d'Or")).toBe(500);
  });
});

describe('formatGoldDisplay', () => {
  it('returns null for Curse cards', () => {
    expect(formatGoldDisplay(CardType.CURSE, '3 trésors')).toBeNull();
  });

  it('returns null for Race cards', () => {
    expect(formatGoldDisplay(CardType.RACE, '100')).toBeNull();
  });

  it('returns null for Class cards', () => {
    expect(formatGoldDisplay(CardType.CLASS, '100')).toBeNull();
  });

  it('returns null for Level Up cards', () => {
    expect(formatGoldDisplay(CardType.LEVEL_UP, '100')).toBeNull();
  });

  it('returns null for Faithful Servant cards', () => {
    expect(formatGoldDisplay(CardType.FAITHFUL_SERVANT, '100')).toBeNull();
  });

  it('returns null when no gold value', () => {
    expect(formatGoldDisplay(CardType.MONSTER, '')).toBeNull();
    expect(formatGoldDisplay(CardType.MONSTER, undefined)).toBeNull();
  });

  it('formats Monster gold as treasures (singular)', () => {
    expect(formatGoldDisplay(CardType.MONSTER, '1 trésor')).toBe('1 trésor');
  });

  it('formats Monster gold as treasures (plural)', () => {
    expect(formatGoldDisplay(CardType.MONSTER, '3 trésors')).toBe('3 trésors');
  });

  it("formats Item gold as pieces d'or (singular)", () => {
    expect(formatGoldDisplay(CardType.ITEM, '1')).toBe("1 pièce d'or");
  });

  it("formats Item gold as pieces d'or (plural)", () => {
    expect(formatGoldDisplay(CardType.ITEM, '500')).toBe("500 pièces d'or");
  });

  it('formats Item gold as "Aucune valeur" for 0', () => {
    expect(formatGoldDisplay(CardType.ITEM, '0')).toBe('Aucune valeur');
  });

  it('returns raw value for other card types', () => {
    expect(formatGoldDisplay(CardType.DUNGEON_BONUS, '3 trésors')).toBe('3 trésors');
  });
});
