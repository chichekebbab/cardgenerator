import { CardData } from '../types';

/**
 * Sanitize card data to remove any non-serializable properties (like DOM references)
 * that might have been accidentally added to the card object.
 */
const sanitizeCardData = (card: CardData): CardData => {
  // Create a clean copy with only the expected CardData properties
  const cleanCard: CardData = {
    id: card.id,
    title: card.title,
    type: card.type,
    layout: card.layout,
    level: card.level,
    bonus: card.bonus,
    description: card.description,
    badStuff: card.badStuff,
    gold: card.gold,
    imagePrePrompt: card.imagePrePrompt,
    imagePrompt: card.imagePrompt,
    imageData: card.imageData,
    storedImageUrl: card.storedImageUrl,
    itemSlot: card.itemSlot,
    isBig: card.isBig,
    restrictions: card.restrictions,
    levelsGained: card.levelsGained,
    imageScale: card.imageScale,
    imageOffsetX: card.imageOffsetX,
    imageOffsetY: card.imageOffsetY,
    descriptionBoxScale: card.descriptionBoxScale,
    isBaseCard: card.isBaseCard,
    isValidated: card.isValidated,
    internalComment: card.internalComment,
  };

  return cleanCard;
};

/**
 * Envoie les données au Google Apps Script.
 * IMPORTANT : On utilise le Content-Type 'text/plain' pour éviter le "Preflight" CORS (OPTIONS)
 * que Google Apps Script ne gère pas nativement.
 */
export const saveCardToSheet = async (scriptUrl: string, card: CardData): Promise<{ status: string, imageUrl?: string }> => {
  if (!scriptUrl) throw new Error("URL du Script Google manquante");

  // Sanitize the card data to remove any DOM references or unexpected properties
  const cleanCard = sanitizeCardData(card);

  const response = await fetch(scriptUrl, {
    method: 'POST',
    headers: {
      "Content-Type": "text/plain;charset=utf-8",
    },
    body: JSON.stringify({ action: 'save', card: cleanCard }),
  });

  if (!response.ok) {
    throw new Error(`Erreur HTTP: ${response.status} - Vérifiez l'URL du script`);
  }

  const data = await response.json();
  if (data.status === 'error') throw new Error(data.message);
  return data;
};

/**
 * Normalize card data from the sheet to ensure correct types.
 * Google Sheets / JSON can sometimes store booleans as strings ("true"/"false")
 * which causes bugs because "false" is truthy in JavaScript.
 */
const normalizeCardData = (card: any): CardData => {
  return {
    ...card,
    // Ensure booleans are actual booleans, not strings
    isValidated: card.isValidated === true || card.isValidated === 'true',
    isBaseCard: card.isBaseCard === true || card.isBaseCard === 'true',
    isBig: card.isBig === true || card.isBig === 'true',
    // Ensure numbers have defaults
    imageScale: card.imageScale ?? 100,
    imageOffsetX: card.imageOffsetX ?? 0,
    imageOffsetY: card.imageOffsetY ?? 0,
    descriptionBoxScale: card.descriptionBoxScale ?? 100,
    // Ensure strings have defaults
    internalComment: card.internalComment || '',
  };
};

/**
 * Récupère les cartes depuis le Google Apps Script.
 * Si cela échoue avec "Failed to fetch", c'est souvent un problème de permissions (CORS).
 */
export const fetchCardsFromSheet = async (scriptUrl: string): Promise<CardData[]> => {
  if (!scriptUrl) return [];

  // Nettoyage basique de l'URL pour éviter les erreurs courantes de copier-coller
  const cleanUrl = scriptUrl.trim();

  try {
    const response = await fetch(cleanUrl, {
      method: 'GET'
    });

    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }

    const data = await response.json();

    // Gestion du cas où le script renvoie une erreur JSON explicite
    if (data && !Array.isArray(data) && data.status === 'error') {
      throw new Error(data.message);
    }

    // Normalize all card data to ensure correct types
    return Array.isArray(data) ? data.map(normalizeCardData) : [];
  } catch (e) {
    console.error("Erreur détaillée fetchCardsFromSheet:", e);
    // On relance l'erreur pour que l'UI puisse l'afficher ou la logger
    throw e;
  }
};

export const deleteCardFromSheet = async (scriptUrl: string, cardId: string): Promise<{ status: string }> => {
  if (!scriptUrl) throw new Error("URL du Script Google manquante");

  const response = await fetch(scriptUrl, {
    method: 'POST',
    headers: {
      "Content-Type": "text/plain;charset=utf-8",
    },
    body: JSON.stringify({ action: 'delete', cardId }),
  });

  if (!response.ok) {
    throw new Error(`Erreur HTTP: ${response.status} - Vérifiez l'URL du script`);
  }

  const data = await response.json();
  if (data.status === 'error') throw new Error(data.message);
  return data;
};