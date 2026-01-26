/**
 * Service for removing backgrounds from images using the remove.bg API
 * API Documentation: https://www.remove.bg/api
 */

const REMOVE_BG_API_URL = 'https://api.remove.bg/v1.0/removebg';

/**
 * Removes the background from an image using the remove.bg API
 * @param imageBase64 The base64 encoded image string (without the data:image/png;base64, prefix)
 * @param apiKey The remove.bg API key
 * @returns The processed image as a base64 string (without prefix)
 * @throws Error if the API request fails
 */
export const removeBackground = async (imageBase64: string, apiKey: string): Promise<string> => {
    if (!apiKey) {
        throw new Error("Clé API remove.bg non configurée. Veuillez l'ajouter dans les paramètres.");
    }

    if (!imageBase64) {
        throw new Error("Aucune image fournie pour le traitement.");
    }

    try {
        // Clean the base64 string (remove data URL prefix if present)
        const cleanBase64 = imageBase64.replace(/^data:image\/[a-z]+;base64,/, '');

        const formData = new FormData();
        formData.append('image_file_b64', cleanBase64);
        formData.append('size', 'auto'); // Can be 'auto', 'preview', 'full', etc.

        const response = await fetch(REMOVE_BG_API_URL, {
            method: 'POST',
            headers: {
                'X-Api-Key': apiKey,
            },
            body: formData,
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => null);

            if (response.status === 403) {
                throw new Error("Clé API invalide ou expirée. Vérifiez votre clé dans les paramètres.");
            } else if (response.status === 402) {
                throw new Error("Quota API dépassé. Vérifiez votre compte remove.bg.");
            } else if (errorData?.errors) {
                const errorMessage = errorData.errors.map((e: any) => e.title).join(', ');
                throw new Error(`Erreur API remove.bg: ${errorMessage}`);
            } else {
                throw new Error(`Erreur HTTP ${response.status}: ${response.statusText}`);
            }
        }

        // Get the image as a blob
        const blob = await response.blob();

        // Convert blob to base64
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                const result = reader.result as string;
                // Remove the data URL prefix to get just the base64 string
                const base64 = result.replace(/^data:image\/[a-z]+;base64,/, '');
                resolve(base64);
            };
            reader.onerror = () => {
                reject(new Error("Erreur lors de la conversion de l'image."));
            };
            reader.readAsDataURL(blob);
        });
    } catch (error: any) {
        console.error("Erreur lors de la suppression de l'arrière-plan:", error);

        // Re-throw with a user-friendly message if not already formatted
        if (error.message.includes('Failed to fetch')) {
            throw new Error("Impossible de contacter l'API remove.bg. Vérifiez votre connexion internet.");
        }

        throw error;
    }
};

/**
 * Removes the background from an image URL using the remove.bg API
 * This method is preferred for URLs (like Google Drive) as it avoids CORS issues
 * @param imageUrl The URL of the image to process
 * @param apiKey The remove.bg API key
 * @returns The processed image as a base64 string (without prefix)
 * @throws Error if the API request fails
 */
export const removeBackgroundFromUrl = async (imageUrl: string, apiKey: string): Promise<string> => {
    if (!apiKey) {
        throw new Error("Clé API remove.bg non configurée. Veuillez l'ajouter dans les paramètres.");
    }

    if (!imageUrl) {
        throw new Error("Aucune URL d'image fournie pour le traitement.");
    }

    try {
        const formData = new FormData();
        formData.append('image_url', imageUrl);
        formData.append('size', 'auto');

        const response = await fetch(REMOVE_BG_API_URL, {
            method: 'POST',
            headers: {
                'X-Api-Key': apiKey,
            },
            body: formData,
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => null);

            if (response.status === 403) {
                throw new Error("Clé API invalide ou expirée. Vérifiez votre clé dans les paramètres.");
            } else if (response.status === 402) {
                throw new Error("Quota API dépassé. Vérifiez votre compte remove.bg.");
            } else if (errorData?.errors) {
                const errorMessage = errorData.errors.map((e: any) => e.title).join(', ');
                throw new Error(`Erreur API remove.bg: ${errorMessage}`);
            } else {
                throw new Error(`Erreur HTTP ${response.status}: ${response.statusText}`);
            }
        }

        // Get the image as a blob
        const blob = await response.blob();

        // Convert blob to base64
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                const result = reader.result as string;
                // Remove the data URL prefix to get just the base64 string
                const base64 = result.replace(/^data:image\/[a-z]+;base64,/, '');
                resolve(base64);
            };
            reader.onerror = () => {
                reject(new Error("Erreur lors de la conversion de l'image."));
            };
            reader.readAsDataURL(blob);
        });
    } catch (error: any) {
        console.error("Erreur lors de la suppression de l'arrière-plan depuis URL:", error);

        // Re-throw with a user-friendly message if not already formatted
        if (error.message.includes('Failed to fetch')) {
            throw new Error("Impossible de contacter l'API remove.bg. Vérifiez votre connexion internet.");
        }

        throw error;
    }
};

/**
 * Converts an image URL to base64
 * Useful for converting storedImageUrl to base64 before processing
 * @param imageUrl The URL of the image to convert
 * @returns The image as a base64 string (without prefix)
 */
export const imageUrlToBase64 = async (imageUrl: string): Promise<string> => {
    try {
        const response = await fetch(imageUrl);
        if (!response.ok) {
            throw new Error(`Impossible de charger l'image depuis l'URL: ${response.statusText}`);
        }

        const blob = await response.blob();

        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                const result = reader.result as string;
                // Remove the data URL prefix
                const base64 = result.replace(/^data:image\/[a-z]+;base64,/, '');
                resolve(base64);
            };
            reader.onerror = () => {
                reject(new Error("Erreur lors de la conversion de l'URL en base64."));
            };
            reader.readAsDataURL(blob);
        });
    } catch (error: any) {
        console.error("Erreur lors de la conversion URL vers base64:", error);
        throw new Error("Impossible de charger l'image. Vérifiez l'URL.");
    }
};
