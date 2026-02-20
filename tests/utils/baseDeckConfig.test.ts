import { describe, it, expect } from 'vitest';
import {
  BASE_DECK_MONSTERS,
  TOTAL_BASE_MONSTERS,
  getMonsterConfig,
  getMissingCardsCount,
} from '../../utils/baseDeckConfig';

describe('BASE_DECK_MONSTERS', () => {
  it('has 20 levels (1-20)', () => {
    expect(BASE_DECK_MONSTERS).toHaveLength(20);
    expect(BASE_DECK_MONSTERS[0].level).toBe(1);
    expect(BASE_DECK_MONSTERS[19].level).toBe(20);
  });

  it('every entry has positive count', () => {
    for (const config of BASE_DECK_MONSTERS) {
      expect(config.count).toBeGreaterThan(0);
    }
  });
});

describe('TOTAL_BASE_MONSTERS', () => {
  it('equals the sum of all monster counts', () => {
    const sum = BASE_DECK_MONSTERS.reduce((acc, c) => acc + c.count, 0);
    expect(TOTAL_BASE_MONSTERS).toBe(sum);
  });

  it('is a reasonable number (> 100)', () => {
    expect(TOTAL_BASE_MONSTERS).toBeGreaterThan(100);
  });
});

describe('getMonsterConfig', () => {
  it('returns config for level 1', () => {
    const config = getMonsterConfig(1);
    expect(config).toBeDefined();
    expect(config!.level).toBe(1);
    expect(config!.treasures).toBe(1);
    expect(config!.levelsGained).toBe(1);
  });

  it('returns config for level 20', () => {
    const config = getMonsterConfig(20);
    expect(config).toBeDefined();
    expect(config!.level).toBe(20);
    expect(config!.treasures).toBe(5);
    expect(config!.levelsGained).toBe(2);
  });

  it('returns undefined for non-existent level', () => {
    expect(getMonsterConfig(0)).toBeUndefined();
    expect(getMonsterConfig(21)).toBeUndefined();
    expect(getMonsterConfig(-1)).toBeUndefined();
  });
});

describe('getMissingCardsCount', () => {
  it('returns full count when no existing cards', () => {
    const config = getMonsterConfig(1);
    expect(getMissingCardsCount(1, 0)).toBe(config!.count);
  });

  it('returns 0 when existing count meets target', () => {
    const config = getMonsterConfig(1);
    expect(getMissingCardsCount(1, config!.count)).toBe(0);
  });

  it('returns 0 when existing count exceeds target', () => {
    const config = getMonsterConfig(1);
    expect(getMissingCardsCount(1, config!.count + 5)).toBe(0);
  });

  it('returns difference when partially filled', () => {
    const config = getMonsterConfig(5);
    expect(getMissingCardsCount(5, 3)).toBe(config!.count - 3);
  });

  it('returns 0 for non-existent level', () => {
    expect(getMissingCardsCount(99, 0)).toBe(0);
  });
});
