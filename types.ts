
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
  OTHER = 'Autre'
}

export type CardLayout = 'standard';

export interface CardData {
  id: string; // Identifiant unique pour la persistance
  title: string;
  type: CardType;
  layout: CardLayout; // Nouveau champ pour le style
  level: number | '';
  bonus: number | '';
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
  isBaseCard: boolean;
  isValidated: boolean;
  internalComment: string;
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
  imagePrePrompt: "Génère une illustration au format carré (1x1). Le style artistique doit imiter parfaitement celui du jeu de cartes 'Munchkin' et du dessinateur John Kovalic : un style cartoon satirique, dessiné à la main, avec des contours noirs épais et une ambiance humoristique de fantasy. L'image doit présenter un seul élément isolé, centré. Il ne doit y avoir absolument aucun texte sur l'image. Le fond doit être une couleur unie, neutre et simple, sans aucun décor ni détail. Voici l'élément à générer :",
  imagePrompt: 'Un monstre de dessin animé drôle fait de spaghettis',
  imageData: null,
  itemSlot: '',
  isBig: false,
  restrictions: '',
  levelsGained: 1,
  imageScale: 100,
  imageOffsetX: 0,
  imageOffsetY: 0,
  isBaseCard: false,
  isValidated: false,
  internalComment: '',
};