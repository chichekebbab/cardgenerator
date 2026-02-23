import { CardType } from '../types';

/**
 * Extracts the numeric value from a gold/treasure string
 * Handles various formats: "3 trésors", "500 PO", "3", "500 Pièces d'Or", etc.
 * Returns null if no valid number is found
 */
export function extractGoldValue(goldString: string | undefined): number | null {
    if (!goldString || goldString.trim() === '') {
        return null;
    }

    // Extract all numbers from the string
    const matches = goldString.match(/\d+/);
    if (!matches) {
        return null;
    }

    const value = parseInt(matches[0], 10);
    return isNaN(value) ? null : value;
}

/**
 * Formats the gold value based on card type and language
 * Returns null if the field should not be displayed for this card type
 */
export function formatGoldDisplay(
    cardType: CardType,
    goldValue: string | undefined,
    language: 'fr' | 'en' = 'fr'
): string | null {
    // These card types should never display the gold field
    if (
        cardType === CardType.CURSE ||
        cardType === CardType.RACE ||
        cardType === CardType.CLASS ||
        cardType === CardType.LEVEL_UP ||
        cardType === CardType.FAITHFUL_SERVANT
    ) {
        return null;
    }

    // Extract numeric value
    const numericValue = extractGoldValue(goldValue);

    // If no value, return null (don't display anything)
    if (numericValue === null) {
        return null;
    }

    // Format based on card type
    if (cardType === CardType.MONSTER) {
        if (language === 'en') {
            return `${numericValue} treasure${numericValue > 1 ? 's' : ''}`;
        }
        return `${numericValue} trésor${numericValue > 1 ? 's' : ''}`;
    }

    if (cardType === CardType.ITEM) {
        if (numericValue === 0) {
            return language === 'en' ? 'No value' : 'Aucune valeur';
        }
        if (language === 'en') {
            return `${numericValue} gold piece${numericValue > 1 ? 's' : ''}`;
        }
        return `${numericValue} pièce${numericValue > 1 ? 's' : ''} d'or`;
    }

    // For other types (DUNGEON_TRAP, DUNGEON_BONUS, TREASURE_TRAP, OTHER)
    // Just display the raw value if it exists
    return goldValue || null;
}
