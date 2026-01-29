import { GoogleGenAI } from "@google/genai";
import { CardData, CardType } from '../types';

// Cache pour l'instance par défaut (celle avec la clé d'environnement)
let defaultAiInstance: GoogleGenAI | null = null;

const getAiInstance = (userApiKey?: string) => {
  // Si une clé utilisateur est fournie, on crée une nouvelle instance
  if (userApiKey) {
    return new GoogleGenAI({ apiKey: userApiKey });
  }

  // Sinon on utilise l'instance par défaut (avec la clé du .env)
  if (!defaultAiInstance) {
    const envApiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!envApiKey) {
      console.warn("Aucune clé API Gemini trouvée dans l'environnement ni fournie par l'utilisateur.");
    }
    defaultAiInstance = new GoogleGenAI({ apiKey: envApiKey });
  }
  return defaultAiInstance;
};

/**
 * Generates an image using the 'nano banana' model (gemini-2.5-flash-image).
 * @param prompt The full text description of the image (pre-prompt + user prompt).
 * @param apiKey Optional user-provided API key.
 * @returns The base64 encoded image string or throws an error.
 */
export const generateCardArt = async (prompt: string, apiKey?: string): Promise<string> => {
  try {
    const ai = getAiInstance(apiKey);

    // Si on n'a ni clé utilisateur ni clé d'environnement (et que l'instance a été créée sans clé valide), ça plantera probablement ici.
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image', // Nano Banana mapping
      contents: {
        parts: [
          {
            text: prompt,
          },
        ],
      },
      config: {
        imageConfig: {
          aspectRatio: "1:1",
        },
      },
    });

    // Vérification de base des candidats
    if (!response.candidates || response.candidates.length === 0) {
      throw new Error("La réponse de l'IA est vide.");
    }

    const candidate = response.candidates[0];

    // Vérification des parties de contenu
    if (candidate.content && candidate.content.parts) {
      for (const part of candidate.content.parts) {
        // Priorité à l'image
        if (part.inlineData && part.inlineData.data) {
          return part.inlineData.data;
        }
      }

      // Si pas d'image, on regarde s'il y a du texte (souvent un refus ou une explication)
      for (const part of candidate.content.parts) {
        if (part.text) {
          console.warn("Le modèle a retourné du texte au lieu d'une image :", part.text);
          throw new Error(`Le modèle a refusé de générer l'image : "${part.text}"`);
        }
      }
    }

    // Si on arrive ici, c'est peut-être un blocage de sécurité sans contenu
    if (candidate.finishReason && candidate.finishReason !== 'STOP') {
      throw new Error(`Génération bloquée par le filtre de sécurité. Raison: ${candidate.finishReason}`);
    }

    throw new Error("Aucune donnée d'image trouvée dans la réponse (Raison inconnue).");
  } catch (error: any) {
    console.error("Erreur lors de la génération de l'image :", error);
    // On propage l'erreur pour l'afficher dans l'UI
    throw error;
  }
};

/**
 * Generates card data content based on a concept or randomly using gemini-2.0-flash.
 * @param concept User input concept or empty for random.
 * @param apiKey Optional user-provided API key.
 * @returns Partial CardData object.
 */
export const generateCardSuggestion = async (concept: string, apiKey?: string): Promise<Partial<CardData>> => {
  try {
    const ai = getAiInstance(apiKey);
    const isRandom = !concept || concept.trim() === '';

    // Utilisation de gemini-2.0-flash pour une meilleure qualité de texte
    // Note: getGenerativeModel logic might differ slightly in @google/genai vs google-generative-ai
    // The current file uses `ai.models.generateContent` which suggests a specific client structure.
    // Let's check how `getAiInstance` returns the client. 
    // It returns `new GoogleGenAI({ apiKey })`. 
    // According to new SDK, we might need to verify the method to call a specific model.
    // However, looking at line 34: `ai.models.generateContent`.

    const prompt = `
      Tu es un assistant créatif pour le jeu de cartes Munchkin.
      Ta tâche est de créer une nouvelle carte de jeu ${isRandom ? 'aléatoire et drôle' : 'basée sur le concept fourni'}.
      
      ${!isRandom ? `CONCEPT: "${concept}"` : ''}

      Règles:
      1. L'humour doit être satirique, absurde et "munchkinesque" (parodie de JDR/Fantasy).
      2. Le type de carte DOIT être l'une des valeurs exactes suivantes: ${Object.values(CardType).map(v => `"${v}"`).join(', ')}.
      3. Génère uniquement un SEUL objet JSON (pas un tableau).
      4. Structure JSON attendue:
      {
        "title": "Nom de la carte",
        "type": "Valeur parmi les types listés",
        "level": number (si Monstre, entre 1 et 20, varie souvent),
        "bonus": string (ex: "+3" ou "+2 contre les Elfes" ou "1"),
        "description": "Texte d'effet principal",
        "badStuff": "Incident Fâcheux (si Monstre, vide sinon)",
        "gold": "Valeur (ex: '300 Pièces d'Or' ou '2 Trésors', le nombre de trésors varie entre 1 et 5)",
        "imagePrompt": "Description visuelle détaillée pour le dessinateur (style John Kovalic), centrée sur un élément unique, sans décor complexe.",
        "levelsGained": number (si Monstre, généralement 1, parfois 2 pour les gros monstres),
        "itemSlot": "Usage Unique" | "1 Main" | "2 Mains" | "Armure" | "Couvre-chef" | "Chaussures" | "NoSlot" | "Monture" (si Objet),
        "restrictions": "Restrictions d'usage (ex: Elfes uniquement)",
        "isBig": boolean (si Objet)
      }

      IMPORTANT: Varie les niveaux des monstres (ne donne pas toujours la même valeur) et les récompenses.
      IMPORTANT: Ne génère JAMAIS de champ "id" ou "uuid". L'identifiant est géré par le système.
      Réponds uniquement avec le JSON.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: {
        parts: [
          {
            text: prompt,
          },
        ],
      },
      config: {
        responseMimeType: 'application/json',
      }
    });

    if (!response.candidates || response.candidates.length === 0) {
      throw new Error("La réponse de l'IA est vide.");
    }

    const candidate = response.candidates[0];
    console.log("[GEMINI SERVICE] Full candidate response:", JSON.stringify(candidate, null, 2));
    let textResult = '';

    if (candidate.content && candidate.content.parts) {
      for (const part of candidate.content.parts) {
        if (part.text) {
          textResult += part.text;
        }
      }
    }

    if (!textResult) {
      throw new Error("Aucun texte généré par l'IA.");
    }

    // Nettoyage basique si jamais il y a des backticks markdown
    const jsonStr = textResult.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    let data = JSON.parse(jsonStr);

    // Si l'IA a quand même renvoyé un tableau, on prend le premier élément
    if (Array.isArray(data)) {
      data = data[0];
    }

    return data;

  } catch (error: any) {
    console.error("Erreur génération suggestion:", error);
    throw error;
  }
};
