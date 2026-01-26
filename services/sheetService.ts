import { CardData } from '../types';

/**
 * Envoie les données au Google Apps Script.
 * IMPORTANT : On utilise le Content-Type 'text/plain' pour éviter le "Preflight" CORS (OPTIONS)
 * que Google Apps Script ne gère pas nativement.
 */
export const saveCardToSheet = async (scriptUrl: string, card: CardData): Promise<{ status: string, imageUrl?: string }> => {
  if (!scriptUrl) throw new Error("URL du Script Google manquante");

  const response = await fetch(scriptUrl, {
    method: 'POST',
    headers: {
      "Content-Type": "text/plain;charset=utf-8",
    },
    body: JSON.stringify({ action: 'save', card }),
  });

  if (!response.ok) {
    throw new Error(`Erreur HTTP: ${response.status} - Vérifiez l'URL du script`);
  }

  const data = await response.json();
  if (data.status === 'error') throw new Error(data.message);
  return data;
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

    return Array.isArray(data) ? data : [];
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