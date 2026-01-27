import { CardData, CardType } from '../types';

export const getLayoutFilename = (data: CardData): string => {
    if (data.type === CardType.CLASS) return 'layout_class.png';
    if (data.type === CardType.RACE) return 'layout_race.png';
    if (data.type === CardType.CURSE) return 'layout_malediction.png';
    if (data.type === CardType.ITEM) {
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
