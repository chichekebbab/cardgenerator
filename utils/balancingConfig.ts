/**
 * Configuration de l'équilibrage des cartes Munchkin
 * Basé sur les statistiques pour un deck de 350 cartes
 */

// Données de référence pour un deck de 350 cartes
export interface MonsterLevelBalance {
    level: number;
    cardCount: number;
    treasuresGained: number;
    levelsGained: number;
}

// Table de référence basée sur l'image fournie
export const MONSTER_BALANCE_REFERENCE: MonsterLevelBalance[] = [
    { level: 1, cardCount: 11, treasuresGained: 1, levelsGained: 1 },
    { level: 2, cardCount: 14, treasuresGained: 1, levelsGained: 1 },
    { level: 3, cardCount: 8, treasuresGained: 1, levelsGained: 1 },
    { level: 4, cardCount: 12, treasuresGained: 2, levelsGained: 1 },
    { level: 5, cardCount: 8, treasuresGained: 2, levelsGained: 1 },
    { level: 6, cardCount: 9, treasuresGained: 2, levelsGained: 1 },
    { level: 7, cardCount: 6, treasuresGained: 2, levelsGained: 1 },
    { level: 8, cardCount: 7, treasuresGained: 2, levelsGained: 1 },
    { level: 9, cardCount: 7, treasuresGained: 3, levelsGained: 1 },
    { level: 10, cardCount: 7, treasuresGained: 3, levelsGained: 1 },
    { level: 11, cardCount: 5, treasuresGained: 3, levelsGained: 1 },
    { level: 12, cardCount: 7, treasuresGained: 3, levelsGained: 1 },
    { level: 13, cardCount: 5, treasuresGained: 3, levelsGained: 1 },
    { level: 14, cardCount: 8, treasuresGained: 4, levelsGained: 1 },
    { level: 15, cardCount: 5, treasuresGained: 4, levelsGained: 2 },
    { level: 16, cardCount: 6, treasuresGained: 4, levelsGained: 2 },
    { level: 17, cardCount: 4, treasuresGained: 4, levelsGained: 2 },
    { level: 18, cardCount: 5, treasuresGained: 5, levelsGained: 2 },
    { level: 19, cardCount: 3, treasuresGained: 5, levelsGained: 2 },
    { level: 20, cardCount: 4, treasuresGained: 5, levelsGained: 2 },
];

// Groupes de niveaux pour l'affichage dans le dashboard
export interface LevelRange {
    label: string;
    min: number;
    max: number;
}

export const LEVEL_RANGES: LevelRange[] = [
    { label: "1-4", min: 1, max: 4 },
    { label: "5-8", min: 5, max: 8 },
    { label: "9-12", min: 9, max: 12 },
    { label: "13-16", min: 13, max: 16 },
    { label: "17-20", min: 17, max: 20 },
];

/**
 * Obtenir les valeurs recommandées pour un niveau de monstre donné
 */
export const getRecommendedValues = (level: number) => {
    const entry = MONSTER_BALANCE_REFERENCE.find(b => b.level === level);

    if (!entry) {
        // Valeurs par défaut si le niveau n'est pas dans la table
        return {
            treasuresGained: 1,
            levelsGained: 1,
            exists: false
        };
    }

    return {
        treasuresGained: entry.treasuresGained,
        levelsGained: entry.levelsGained,
        exists: true
    };
};

/**
 * Formater le nombre de trésors au format texte
 */
export const formatTreasures = (count: number): string => {
    if (count === 1) {
        return "1 trésor";
    }
    return `${count} trésors`;
};

/**
 * Parser le texte de trésors pour extraire le nombre
 */
export const parseTreasures = (text: string): number | null => {
    if (!text) return null;

    // Match patterns like "3 trésors", "1 trésor", "2 Trésors", etc.
    const match = text.match(/(\d+)\s*trésor/i);
    if (match) {
        return parseInt(match[1], 10);
    }

    return null;
};

/**
 * Vérifier si les valeurs d'une carte monstre respectent l'équilibrage recommandé
 */
export const validateMonsterBalance = (level: number, treasures: string, levelsGained: number | '') => {
    const recommended = getRecommendedValues(level);

    if (!recommended.exists) {
        // Pas de recommandation pour ce niveau, on accepte tout
        return {
            isBalanced: true,
            warnings: [] as string[]
        };
    }

    const warnings: string[] = [];

    // Vérifier les niveaux gagnés
    if (levelsGained !== '' && levelsGained !== recommended.levelsGained) {
        warnings.push(`Niveaux recommandés : ${recommended.levelsGained}`);
    }

    // Vérifier les trésors
    const treasureCount = parseTreasures(treasures);
    if (treasureCount !== null && treasureCount !== recommended.treasuresGained) {
        warnings.push(`Trésors recommandés : ${formatTreasures(recommended.treasuresGained)}`);
    }

    return {
        isBalanced: warnings.length === 0,
        warnings
    };
};

/**
 * Calculer le nombre cible de cartes par niveau pour un deck de taille donnée
 */
export const getTargetCountForLevel = (level: number, deckSize: number): number => {
    const BASE_DECK_SIZE = 350;
    const ratio = deckSize / BASE_DECK_SIZE;

    const entry = MONSTER_BALANCE_REFERENCE.find(b => b.level === level);
    if (!entry) return 0;

    return Math.ceil(entry.cardCount * ratio);
};

/**
 * Calculer le nombre cible de cartes par tranche de niveaux
 */
export const getTargetCountForRange = (range: LevelRange, deckSize: number): number => {
    let total = 0;
    for (let level = range.min; level <= range.max; level++) {
        total += getTargetCountForLevel(level, deckSize);
    }
    return total;
};
