import { GoogleGenAI } from "@google/genai";

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
