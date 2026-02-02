/**
 * Configuration du deck de base Munchkin (350 cartes)
 * Basé sur la répartition standard du jeu
 */

export interface MonsterLevelConfig {
    level: number;
    count: number;
    treasures: number;
    levelsGained: number;
}

/**
 * Répartition des monstres dans le deck de base
 * Source: Distribution officielle du jeu
 */
export const BASE_DECK_MONSTERS: MonsterLevelConfig[] = [
    { level: 1, count: 11, treasures: 1, levelsGained: 1 },
    { level: 2, count: 14, treasures: 1, levelsGained: 1 },
    { level: 3, count: 8, treasures: 1, levelsGained: 1 },
    { level: 4, count: 12, treasures: 2, levelsGained: 1 },
    { level: 5, count: 8, treasures: 2, levelsGained: 1 },
    { level: 6, count: 9, treasures: 2, levelsGained: 1 },
    { level: 7, count: 6, treasures: 2, levelsGained: 1 },
    { level: 8, count: 7, treasures: 2, levelsGained: 1 },
    { level: 9, count: 7, treasures: 3, levelsGained: 2 },
    { level: 10, count: 7, treasures: 3, levelsGained: 1 },
    { level: 11, count: 5, treasures: 3, levelsGained: 1 },
    { level: 12, count: 7, treasures: 3, levelsGained: 1 },
    { level: 13, count: 5, treasures: 3, levelsGained: 1 },
    { level: 14, count: 8, treasures: 4, levelsGained: 1 },
    { level: 15, count: 5, treasures: 4, levelsGained: 2 },
    { level: 16, count: 6, treasures: 4, levelsGained: 2 },
    { level: 17, count: 4, treasures: 4, levelsGained: 2 },
    { level: 18, count: 5, treasures: 5, levelsGained: 2 },
    { level: 19, count: 3, treasures: 5, levelsGained: 2 },
    { level: 20, count: 4, treasures: 5, levelsGained: 2 },
];

/**
 * Nombre total de cartes monstres dans le deck de base
 */
export const TOTAL_BASE_MONSTERS = BASE_DECK_MONSTERS.reduce(
    (sum, config) => sum + config.count,
    0
);

/**
 * Récupère la configuration pour un niveau de monstre donné
 */
export function getMonsterConfig(level: number): MonsterLevelConfig | undefined {
    return BASE_DECK_MONSTERS.find(config => config.level === level);
}

/**
 * Calcule le nombre de cartes manquantes pour un niveau donné
 */
export function getMissingCardsCount(level: number, existingCount: number): number {
    const config = getMonsterConfig(level);
    if (!config) return 0;
    return Math.max(0, config.count - existingCount);
}
