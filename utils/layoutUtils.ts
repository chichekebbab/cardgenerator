import { CardData, CardType } from '../types';

export const getLayoutFilename = (data: CardData): string => {
    if (data.type === CardType.CLASS) return 'layout_class.png';
    if (data.type === CardType.RACE) return 'layout_race.png';
    if (data.type === CardType.CURSE) return 'layout_malediction.png';
    if (data.type === CardType.ITEM) {
        if (data.itemSlot === 'Amélioration') return 'layout_malediction.png';
        if (data.itemSlot === 'Amélioration de Monture') return 'layout_equipement.png';
        if (data.itemSlot || data.isBig) return 'layout_equipement.png';
        return 'layout_item.png';
    }
    if (data.type === CardType.LEVEL_UP) return 'layout_lvlup.png';
    if (data.type === CardType.FAITHFUL_SERVANT) return 'layout_malediction.png';
    if (data.type === CardType.DUNGEON_TRAP || data.type === CardType.DUNGEON_BONUS || data.type === CardType.TREASURE_TRAP) return 'layout_malediction.png';
    return 'layout_monstre.png';
};

export const getCardCategory = (data: CardData): string => {
    // Catégorie "Donjon" : Monstre, Fidèle serviteur, Piège Donjon, Bonus Donjon, Classe, Race, Malédiction
    if (
        data.type === CardType.MONSTER ||
        data.type === CardType.FAITHFUL_SERVANT ||
        data.type === CardType.DUNGEON_TRAP ||
        data.type === CardType.DUNGEON_BONUS ||
        data.type === CardType.CLASS ||
        data.type === CardType.RACE ||
        data.type === CardType.CURSE
    ) {
        return 'Donjon';
    }
    // Catégorie "Trésors" : Objet, Gain de niveau, Piège Trésor, Autre
    return 'Tresor';
};

export const getExportFilename = (card: CardData, index?: number): string => {
    // Déterminer la catégorie (Donjon ou Trésor)
    const category = getCardCategory(card);

    // Nettoyer le type de carte (remplacer espaces par tirets, enlever accents)
    const cardType = card.type
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") // Enlever les accents
        .replace(/\s+/g, '-'); // Remplacer espaces par tirets

    // Numéro de la carte (3 chiffres)
    const cardNumber = typeof index === 'number' ? String(index + 1).padStart(3, '0') : 'XXX';

    // Nettoyer le nom de la carte (enlever caractères spéciaux, garder underscores et tirets)
    const cleanTitle = (card.title || "carte")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") // Enlever les accents
        .replace(/[^a-z0-9\-_]/gi, '-') // Remplacer caractères spéciaux par tirets
        .replace(/-+/g, '-') // Remplacer tirets multiples par un seul
        .replace(/^-|-$/g, '') // Enlever tirets au début et à la fin
        .toLowerCase();

    // Format final : CATEGORIE_TYPE-DE-CARTE_NUMERO-DE-LA-CARTE_NOM
    return `${category}_${cardType}_${cardNumber}_${cleanTitle}.png`;
};

/**
 * Formate un bonus pour l'affichage
 * - Si positif : ajoute un "+" devant (ex: 5 -> "+5")
 * - Si négatif : laisse tel quel (ex: -5 -> "-5")
 * - Si vide ou 0 : retourne une chaîne vide
 * - Supporte les fourchettes avec "/" : l'opérateur n'est affiché qu'une seule fois
 *   (ex: "2/4" -> "+2/4", "-2/-4" -> "-2/4")
 */
export const formatBonus = (bonus: string | number): string => {
    if (bonus === '' || bonus === 0) return '';

    const bonusStr = String(bonus);

    // Gérer les fourchettes avec "/" (ex: "2/4" -> "+2/4", "-2/-4" -> "-2/4")
    if (bonusStr.includes('/')) {
        const parts = bonusStr.split('/');
        const numParts = parts.map(part => {
            const trimmedPart = part.trim();
            if (trimmedPart === '') return NaN;
            return parseFloat(trimmedPart);
        });

        // Vérifier que toutes les parties sont des nombres valides
        if (numParts.some(n => isNaN(n))) return bonusStr;

        // Déterminer le signe commun (basé sur la première valeur)
        const sign = numParts[0] >= 0 ? '+' : '-';

        // Formater : opérateur une seule fois, puis valeurs absolues séparées par "/"
        const absValues = numParts.map(n => Math.abs(n));
        return `${sign}${absValues.join('/')}`;
    }

    // Cas simple : valeur unique
    const numBonus = parseFloat(bonusStr);

    if (isNaN(numBonus)) return '';

    // Si positif, ajouter le "+"
    if (numBonus > 0) {
        return `+${numBonus}`;
    }

    // Si négatif, le signe "-" est déjà présent
    return String(numBonus);
};
