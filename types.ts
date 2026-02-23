export enum CardType {
  MONSTER = 'Monstre',
  CURSE = 'Malédiction',
  ITEM = 'Objet',
  CLASS = 'Classe',
  RACE = 'Race',
  LEVEL_UP = 'Gain de niveau',
  FAITHFUL_SERVANT = 'Fidèle serviteur',
  DUNGEON_TRAP = 'Piège Donjon',
  DUNGEON_BONUS = 'Bonus Donjon',
  TREASURE_TRAP = 'Piège Trésor',
  OTHER = 'Autre',
}

export type CardLayout = 'standard';

export interface CardData {
  id: string; // Identifiant unique pour la persistance
  title: string;
  type: CardType;
  layout: CardLayout; // Nouveau champ pour le style
  level: number | '';
  bonus: number | string;
  description: string;
  badStuff: string;
  gold: string;
  imagePrePrompt: string;
  imagePrompt: string;
  imageData: string | null; // Base64 string (temporaire pour la génération)
  storedImageUrl?: string; // URL Google Drive (persistant)
  // New fields for extended editing
  itemSlot: string;
  isBig: boolean;
  restrictions: string;
  levelsGained: number | ''; // Niveaux gagnés en cas de victoire (Monstre)
  imageScale?: number; // Pourcentage de taille de l'image (défaut 100)
  imageOffsetX?: number; // Décalage horizontal en %
  imageOffsetY?: number; // Décalage vertical en %
  descriptionBoxScale?: number; // Pourcentage de taille de l'encart description (défaut 100)
  isBaseCard: boolean;
  isValidated: boolean;
  internalComment: string;
}

export interface PlaceholderCardData {
  level: number;
  type: CardType;
  targetTreasures: number;
  targetLevelsGained: number;
  isPlaceholder: true;
}

export const INITIAL_CARD_DATA: CardData = {
  id: '', // Sera généré à l'initialisation
  title: 'Horreur Indicible',
  type: CardType.MONSTER,
  layout: 'standard',
  level: 10,
  bonus: '',
  description: 'Elle met le bazar sur le tapis.',
  badStuff: 'Perdez votre Couvre-chef et 2 Niveaux.',
  gold: '3 Trésors',
  imagePrePrompt:
    "Génère une illustration au format carré (1x1). Le style artistique doit imiter parfaitement celui du jeu de cartes 'Munchkin' et du dessinateur John Kovalic : un style cartoon satirique, dessiné à la main, avec des contours noirs épais et une ambiance humoristique de fantasy. L'image doit présenter un seul élément isolé, centré. Il ne doit y avoir absolument aucun texte sur l'image. Le fond doit être une couleur unie, neutre et simple, sans aucun décor ni détail. Voici l'élément à générer :",
  imagePrompt: 'Un monstre de dessin animé drôle fait de spaghettis',
  imageData: null,
  storedImageUrl: '/demo/demo_card.png',
  itemSlot: '',
  isBig: false,
  restrictions: '',
  levelsGained: 1,
  imageScale: 100,
  imageOffsetX: 0,
  imageOffsetY: 0,
  descriptionBoxScale: 100,
  isBaseCard: false,
  isValidated: false,
  internalComment: '',
};

export interface GlobalSettings {
  // Custom card backs (base64 data URL or null = use default)
  customBackDonjon: string | null;
  customBackTresor: string | null;
  // Custom layouts (front faces)
  customLayoutClass: string | null;
  customLayoutRace: string | null;
  customLayoutMalediction: string | null;
  customLayoutEquipement: string | null;
  customLayoutItem: string | null;
  customLayoutLvlup: string | null;
  customLayoutMonstre: string | null;
  // Fonts per text type (Google Fonts family names)
  fontTitle: string;
  fontDescription: string;
  fontMeta: string;
  // Language for automatic labels
  language: 'fr' | 'en';
  // Default pre-prompt for AI image generation
  defaultImagePrePrompt: string;
}

export const AVAILABLE_FONTS = [
  'Windlass',
  'IM Fell English SC',
  'Rye',
  'Metamorphous',
  'Caslon Antique',
  'IM Fell DW Pica',
  'IM Fell English',
  'MedievalSharp',
  'Cinzel',
  'Pirata One',
  'EB Garamond',
  'Lora',
  'Merriweather',
  'Inter',
  'Roboto',
  'Outfit',
  'Playfair Display',
  'Spectral',
] as const;

export const DEFAULT_GLOBAL_SETTINGS: GlobalSettings = {
  customBackDonjon: null,
  customBackTresor: null,
  customLayoutClass: null,
  customLayoutRace: null,
  customLayoutMalediction: null,
  customLayoutEquipement: null,
  customLayoutItem: null,
  customLayoutLvlup: null,
  customLayoutMonstre: null,
  fontTitle: 'Windlass',
  fontDescription: 'Caslon Antique',
  fontMeta: 'MedievalSharp',
  language: 'fr',
  defaultImagePrePrompt: INITIAL_CARD_DATA.imagePrePrompt,
};
