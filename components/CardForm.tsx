import React, { useState, useEffect } from 'react';
import { CardData, CardType, CardLayout } from '../types';
import { generateCardArt, generateCardSuggestion } from '../services/geminiService';
import { removeBackground, removeBackgroundFromUrl, hasDefaultRemoveBgKey } from '../services/removeBgService';
import { useNotification } from './NotificationContext';
import { getRecommendedValues, formatTreasures, validateMonsterBalance } from '../utils/balancingConfig';

interface CardFormProps {
  cardData: CardData;
  onChange: (data: CardData) => void;
  onSave: (cardToSave?: CardData) => void;
  onNew: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  isSaving: boolean;
  hasScriptUrl: boolean;
  hasUnsavedChanges: boolean; // New: track if card has unsaved changes
  onImport: () => void;

  removeBgApiKey?: string; // remove.bg API key
  geminiApiKey?: string; // New: Gemini API key
}

// Pré-prompt technique imposé (ne change jamais)
const FIXED_PRE_PROMPT = "Génère une illustration au format carré (1x1). Le style artistique doit imiter parfaitement celui du jeu de cartes 'Munchkin' et du dessinateur John Kovalic : un style cartoon satirique, dessiné à la main, avec des contours noirs épais et une ambiance humoristique de fantasy. L'image doit présenter un seul élément isolé, centré. Il ne doit y avoir absolument aucun texte sur l'image. Le fond doit être une couleur unie, neutre et simple, sans aucun décor ni détail. Voici l'élément à générer :";

const CardForm: React.FC<CardFormProps> = ({ cardData, onChange, onSave, onNew, onDuplicate, onDelete, isSaving, hasScriptUrl, hasUnsavedChanges, onImport, removeBgApiKey, geminiApiKey }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSuggesting, setIsSuggesting] = useState(false); // New: suggestion state
  const [suggestionInput, setSuggestionInput] = useState(""); // New: suggestion input
  const [isRemovingBg, setIsRemovingBg] = useState(false); // New: background removal state
  const [error, setError] = useState<string | null>(null);
  const { showNotification } = useNotification();

  const handleChange = (field: keyof CardData, value: string | number | boolean | CardLayout) => {
    onChange({ ...cardData, [field]: value });
  };

  const handleGenerateImage = async () => {
    if (!cardData.imagePrompt) {
      setError("Veuillez d'abord entrer une description.");
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      // On utilise le FIXED_PRE_PROMPT quoi qu'il arrive, en ignorant la DB
      const fullPrompt = `${FIXED_PRE_PROMPT} ${cardData.imagePrompt}`;
      const base64Image = await generateCardArt(fullPrompt, geminiApiKey);
      // On sauvegarde l'image et on garde le pré-prompt technique dans les data pour info (même s'il n'est plus éditable)
      onChange({
        ...cardData,
        imageData: base64Image,
        storedImageUrl: undefined,
        imagePrePrompt: FIXED_PRE_PROMPT
      });
    } catch (err) {
      setError("Échec de la génération de l'image. Veuillez réessayer.");
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRemoveBackground = async () => {
    if (!removeBgApiKey && !hasDefaultRemoveBgKey) {
      setError("Clé API remove.bg non configurée. Ajoutez-la dans les paramètres (⚙️).");
      return;
    }

    // Check if there's an image to process
    if (!cardData.imageData && !cardData.storedImageUrl) {
      setError("Aucune image à traiter. Générez d'abord une image.");
      return;
    }

    setIsRemovingBg(true);
    setError(null);

    try {
      console.log("[BG REMOVAL] Starting background removal...");
      console.log("[BG REMOVAL] Current state:", { hasImageData: !!cardData.imageData, hasStoredUrl: !!cardData.storedImageUrl });

      let processedImage: string;

      // Use URL-based API when storedImageUrl exists (avoids CORS issues with Google Drive)
      if (cardData.storedImageUrl && !cardData.imageData) {
        console.log("[BG REMOVAL] Using URL-based API with:", cardData.storedImageUrl);
        processedImage = await removeBackgroundFromUrl(cardData.storedImageUrl, removeBgApiKey);
      } else if (cardData.imageData) {
        console.log("[BG REMOVAL] Using base64 API");
        // Use base64-based API for locally generated images
        processedImage = await removeBackground(cardData.imageData, removeBgApiKey);
      } else {
        throw new Error("Impossible de charger l'image.");
      }

      console.log("[BG REMOVAL] Background removed successfully, updating state...");
      console.log("[BG REMOVAL] Processed image length:", processedImage.length);

      // Create a new card object with the processed image
      const updatedCard = {
        ...cardData,
        imageData: processedImage,
        storedImageUrl: undefined // Clear stored URL to indicate unsaved changes
      };

      console.log("[BG REMOVAL] Updated card:", { hasImageData: !!updatedCard.imageData, hasStoredUrl: !!updatedCard.storedImageUrl });

      // Update the card data with the new image FIRST
      onChange(updatedCard);

      // Don't wait for React state updates - pass the updated card directly to save
      console.log("[BG REMOVAL] Calling save with updated card data...");

      // Pass the updated card directly to avoid async state update issues
      await onSave(updatedCard);

      console.log("[BG REMOVAL] Save completed successfully");
      showNotification("Arrière-plan supprimé et carte sauvegardée avec succès !", 'success');
    } catch (err: any) {
      console.error("[BG REMOVAL] Error:", err);
      setError(err.message || "Erreur lors de la suppression de l'arrière-plan.");
    } finally {
      setIsRemovingBg(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (optional but recommended, e.g., 5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      setError("L'image est trop lourde (max 5Mo).");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1];

      onChange({
        ...cardData,
        imageData: base64,
        storedImageUrl: undefined,
        imagePrompt: `Image importée: ${file.name}`
      });
    };
    reader.onerror = () => {
      setError("Erreur lors de la lecture du fichier.");
    };
    reader.readAsDataURL(file);
  };

  const handleSuggestCard = async () => {
    setIsSuggesting(true);
    setError(null);
    try {
      console.log("[CARD FORM] Requesting suggestion for:", suggestionInput);
      const suggestion = await generateCardSuggestion(suggestionInput, geminiApiKey);
      console.log("[CARD FORM] Received suggestion:", suggestion);

      // On s'assure que la suggestion ne contient pas d'ID qui pourrait écraser l'actuel
      // ou entrer en conflit avec une autre carte.
      const cleanSuggestion = { ...suggestion };
      delete (cleanSuggestion as any).id;
      delete (cleanSuggestion as any).uuid;

      // On génère un nouvel ID pour que la proposition soit considérée comme une NOUVELLE carte
      // et n'écrase pas l'ancienne carte si on était en train d'en éditer une.
      const newId = crypto.randomUUID ? crypto.randomUUID() : Date.now().toString();

      // On fusionne et on nettoie selon le type pour éviter les données incohérentes
      const updatedCard: CardData = {
        ...cardData,
        ...cleanSuggestion,
        id: newId,
        // Fallback pour les champs obligatoires ou numériques
        level: cleanSuggestion.type === CardType.MONSTER ? (cleanSuggestion.level || 1) : '',
        levelsGained: cleanSuggestion.type === CardType.MONSTER ? (cleanSuggestion.levelsGained || 1) : '',
        badStuff: cleanSuggestion.type === CardType.MONSTER ? (cleanSuggestion.badStuff || '') : '',
        bonus: (cleanSuggestion.type === CardType.ITEM || cleanSuggestion.type === CardType.LEVEL_UP || cleanSuggestion.type === CardType.FAITHFUL_SERVANT || cleanSuggestion.type === CardType.DUNGEON_TRAP || cleanSuggestion.type === CardType.DUNGEON_BONUS || cleanSuggestion.type === CardType.TREASURE_TRAP)
          ? (cleanSuggestion.bonus || '')
          : '',
        gold: cleanSuggestion.gold || '',
        itemSlot: cleanSuggestion.type === CardType.ITEM ? (cleanSuggestion.itemSlot || '') : '',
        isBig: cleanSuggestion.type === CardType.ITEM ? (!!cleanSuggestion.isBig) : false,
        restrictions: cleanSuggestion.restrictions || '',
        imagePrompt: cleanSuggestion.imagePrompt || '',
        imageData: null, // Reset image for new suggestion
        storedImageUrl: undefined, // Reset stored image
        internalComment: '',
      };

      console.log("[CARD FORM] Updating card with new ID:", updatedCard.id);
      onChange(updatedCard);

      showNotification("Proposition générée ! Ajustez si besoin.", 'success');
    } catch (err: any) {
      console.error("Erreur suggestion:", err);
      setError("Erreur lors de la suggestion : " + (err.message || "Inconnue"));
    } finally {
      setIsSuggesting(false);
    }
  };

  // Auto-fill monster balancing fields when level changes
  useEffect(() => {
    if (cardData.type === CardType.MONSTER && typeof cardData.level === 'number' && cardData.level > 0) {
      const recommended = getRecommendedValues(cardData.level);

      // Auto-fill levelsGained if empty or if it's a new card
      if (cardData.levelsGained === '' || cardData.levelsGained === null) {
        handleChange('levelsGained', recommended.levelsGained);
      }

      // Auto-fill gold (treasures) if empty or if it's a new card
      if (!cardData.gold || cardData.gold.trim() === '') {
        handleChange('gold', formatTreasures(recommended.treasuresGained));
      }
    }
  }, [cardData.level, cardData.type]); // Only run when level or type changes

  return (
    <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200 h-full overflow-y-auto">
      <div className="flex items-center justify-between gap-2 mb-6 overflow-x-auto pb-1">
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onNew}
            className="h-[34px] px-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded border border-gray-300 transition-colors flex items-center gap-1.5 whitespace-nowrap"
            title="Nouvelle Carte"
          >
            <span>➕</span> Nouvelle
          </button>
          <button
            onClick={onDuplicate}
            className="h-[34px] px-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded border border-gray-300 transition-colors flex items-center gap-1.5 whitespace-nowrap"
            title="Dupliquer la carte"
          >
            <span>👥</span> Dupliquer
          </button>
          <button
            onClick={onImport}
            className="h-[34px] px-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded border border-gray-300 transition-colors flex items-center gap-1.5 whitespace-nowrap"
            title="Importer via JSON"
          >
            <span>📥</span> Import
          </button>
        </div>

        {hasScriptUrl && (
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={onDelete}
              disabled={isSaving}
              className="h-[34px] w-[34px] text-red-600 bg-red-50 hover:bg-red-100 rounded border border-red-200 transition-colors disabled:opacity-50 flex items-center justify-center shrink-0"
              title="Supprimer la carte"
            >
              <span className="text-base leading-none">🗑️</span>
            </button>
            <button
              onClick={() => onSave()}
              disabled={isSaving || !hasUnsavedChanges}
              className={`h-[34px] px-3 text-sm font-bold rounded shadow transition-all flex items-center gap-1.5 whitespace-nowrap ${hasUnsavedChanges
                ? 'text-white bg-green-600 hover:bg-green-700 cursor-pointer'
                : 'text-green-800 bg-green-100 cursor-not-allowed opacity-75'
                } ${isSaving ? 'opacity-50' : ''}`}
              title={hasUnsavedChanges ? 'Enregistrer les modifications' : 'Carte sauvegardée'}
            >
              {isSaving ? (
                <>
                  <span className="animate-spin text-xs">⏳</span>
                  ...
                </>
              ) : hasUnsavedChanges ? (
                <>
                  <span>💾</span> Sauvegarder
                </>
              ) : (
                <>
                  <span>✓</span> Sauvegardée
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {!hasScriptUrl && (
        <div className="mb-4 p-3 bg-blue-50 text-blue-800 text-xs rounded border border-blue-200">
          ℹ️ Connectez une base de données Google Sheet (via l'icône ⚙️ en haut) pour sauvegarder vos cartes dans le cloud.
        </div>
      )}

      <div className="space-y-4">



        {/* Assistant Creation (Gemini) */}
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-4 rounded-lg border border-amber-200 shadow-sm">
          <label className="block text-sm font-bold text-amber-900 mb-2 flex items-center gap-2">
            <span>✨ Assistant Création</span>
            <span className="text-[10px] font-normal text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">Gemini 2.0 Flash</span>
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={suggestionInput}
              onChange={(e) => setSuggestionInput(e.target.value)}
              placeholder="Concept (ex: grille-pain maléfique)... laissez vide pour du hasard !"
              className="flex-grow p-2 text-sm border border-amber-300 rounded focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white"
              onKeyDown={(e) => e.key === 'Enter' && handleSuggestCard()}
            />
            <button
              onClick={handleSuggestCard}
              disabled={isSuggesting}
              className="bg-amber-600 hover:bg-amber-700 text-white font-bold py-2 px-4 rounded transition-colors disabled:opacity-50 whitespace-nowrap shadow-sm text-sm"
              title={suggestionInput ? "Générer une carte basée sur ce concept" : "Générer une carte totalement aléatoire"}
            >
              {isSuggesting ? 'Réflexion...' : 'Suggérer'}
            </button>
          </div>
          <p className="text-[10px] text-amber-700/70 mt-1 italic">
            Remplit automatiquement les champs (titre, stats, description...) et propose un prompt pour l'image.
          </p>
        </div>

        {/* Basic Info */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type de Carte</label>
            <select
              value={cardData.type}
              onChange={(e) => {
                const newType = e.target.value as CardType;
                onChange({
                  ...cardData,
                  type: newType,
                  bonus: newType === CardType.LEVEL_UP ? 1 : (newType === CardType.DUNGEON_TRAP || newType === CardType.DUNGEON_BONUS || newType === CardType.TREASURE_TRAP) ? '' : cardData.bonus,
                  gold: (newType === CardType.DUNGEON_TRAP || newType === CardType.DUNGEON_BONUS || newType === CardType.TREASURE_TRAP) ? '' : cardData.gold
                });
              }}
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
            >
              {Object.values(CardType).map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Titre</label>
            <input
              type="text"
              value={cardData.title || ''}
              onChange={(e) => handleChange('title', e.target.value)}
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
            />
          </div>
        </div>

        {/* Stats Row 1 */}
        <div className="grid grid-cols-2 gap-4">
          {cardData.type === CardType.MONSTER && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Niveau</label>
              <input
                type="number"
                value={cardData.level || ''}
                onChange={(e) => handleChange('level', parseInt(e.target.value) || '')}
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              />
            </div>
          )}
          {(cardData.type === CardType.ITEM || cardData.type === CardType.LEVEL_UP || cardData.type === CardType.FAITHFUL_SERVANT || cardData.type === CardType.DUNGEON_TRAP || cardData.type === CardType.DUNGEON_BONUS || cardData.type === CardType.TREASURE_TRAP) && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Bonus</label>
              <input
                type="text"
                value={cardData.bonus || ''}
                onChange={(e) => handleChange('bonus', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              />
            </div>
          )}
          {/* Val/Trésors - Only for Monster and Item types */}
          {(cardData.type === CardType.MONSTER || cardData.type === CardType.ITEM) && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Val/Trésors</label>
              <div className="relative">
                <input
                  type="text"
                  value={cardData.gold || ''}
                  onChange={(e) => handleChange('gold', e.target.value)}
                  className={`w-full p-2 border rounded focus:ring-2 focus:ring-amber-500 focus:border-amber-500 ${cardData.type === CardType.MONSTER && typeof cardData.level === 'number' && cardData.level > 0
                    ? (() => {
                      const validation = validateMonsterBalance(cardData.level, cardData.gold || '', cardData.levelsGained);
                      const hasGoldWarning = validation.warnings.some(w => w.includes('Trésors'));
                      return hasGoldWarning ? 'border-yellow-400 bg-yellow-50' : 'border-gray-300';
                    })()
                    : 'border-gray-300'
                    }`}
                  placeholder={cardData.type === CardType.MONSTER ? "ex: 2" : "ex: 500"}
                />
                {cardData.type === CardType.MONSTER && typeof cardData.level === 'number' && cardData.level > 0 && (() => {
                  const validation = validateMonsterBalance(cardData.level, cardData.gold || '', cardData.levelsGained);
                  const goldWarning = validation.warnings.find(w => w.includes('Trésors'));
                  return goldWarning ? (
                    <div
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-yellow-600 cursor-help"
                      title={goldWarning}
                    >
                      ⚠️
                    </div>
                  ) : null;
                })()}
              </div>
              <p className="text-xs text-gray-500 mt-1 italic">
                {cardData.type === CardType.MONSTER
                  ? "Entrez uniquement la valeur numérique. Le texte « trésors » sera ajouté automatiquement."
                  : "Entrez uniquement la valeur numérique. Le texte « pièces d'or » sera ajouté automatiquement."}
              </p>
            </div>
          )}
        </div>

        {/* Monster Specifics */}
        {cardData.type === CardType.MONSTER && (
          <div className="bg-green-50 p-3 rounded border border-green-100 space-y-3">
            <h3 className="text-sm font-bold text-green-800 uppercase tracking-wide">Propriétés du Monstre</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Niveaux Gagnés</label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    value={cardData.levelsGained || ''}
                    onChange={(e) => handleChange('levelsGained', parseInt(e.target.value) || '')}
                    className={`w-full p-2 border rounded text-sm focus:ring-1 focus:ring-green-500 ${typeof cardData.level === 'number' && cardData.level > 0
                      ? (() => {
                        const validation = validateMonsterBalance(cardData.level, cardData.gold || '', cardData.levelsGained);
                        const hasLevelWarning = validation.warnings.some(w => w.includes('Niveaux'));
                        return hasLevelWarning ? 'border-yellow-400 bg-yellow-50' : 'border-gray-300';
                      })()
                      : 'border-gray-300'
                      }`}
                    placeholder="1"
                  />
                  {typeof cardData.level === 'number' && cardData.level > 0 && (() => {
                    const validation = validateMonsterBalance(cardData.level, cardData.gold || '', cardData.levelsGained);
                    const levelWarning = validation.warnings.find(w => w.includes('Niveaux'));
                    return levelWarning ? (
                      <div
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-yellow-600 cursor-help"
                        title={levelWarning}
                      >
                        ⚠️
                      </div>
                    ) : null;
                  })()}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Item Specifics */}
        {cardData.type === CardType.ITEM && (
          <div className="bg-amber-50 p-3 rounded border border-amber-100 space-y-3">
            <h3 className="text-sm font-bold text-amber-800 uppercase tracking-wide">Propriétés de l'Objet</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Emplacement</label>
                <select
                  value={cardData.itemSlot || ''}
                  onChange={(e) => handleChange('itemSlot', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-amber-500"
                >
                  <option value="">Usage Unique</option>
                  <option value="1 Main">1 Main</option>
                  <option value="2 Mains">2 Mains</option>
                  <option value="Couvre-chef">Couvre-chef</option>
                  <option value="Chaussures">Chaussures</option>
                  <option value="Armure">Armure</option>
                  <option value="Monture">Monture</option>
                  <option value="NoSlot">Sans emplacement</option>
                  <option value="Amélioration">Amélioration</option>
                </select>
              </div>
              <div className="flex items-end pb-2">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={cardData.isBig}
                    onChange={(e) => handleChange('isBig', e.target.checked)}
                    className="w-4 h-4 text-amber-600 rounded focus:ring-amber-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Gros Objet</span>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Generic Restrictions */}
        {cardData.type !== CardType.FAITHFUL_SERVANT && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Restrictions / Utilisable par</label>
            <input
              type="text"
              value={cardData.restrictions || ''}
              onChange={(e) => handleChange('restrictions', e.target.value)}
              placeholder="ex: Utilisable par l'Elfe uniquement"
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
            />
          </div>

        )}

        {/* Metadata */}
        <div className="flex gap-6 p-3 bg-gray-50 rounded border border-gray-200">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={cardData.isBaseCard}
              onChange={(e) => handleChange('isBaseCard', e.target.checked)}
              className="w-4 h-4 text-amber-600 rounded focus:ring-amber-500"
            />
            <span className="text-sm font-medium text-gray-700">Carte de base</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={cardData.isValidated}
              onChange={(e) => handleChange('isValidated', e.target.checked)}
              className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
            />
            <span className="text-sm font-medium text-gray-700">Carte validée</span>
          </label>
        </div>

        {/* Image Generation Section */}
        <div className="border-t border-b border-gray-200 py-4 my-4 bg-gray-50 -mx-6 px-6">
          <label className="block text-sm font-bold text-gray-800 mb-2">
            Générateur d'Art Visuel (Nano Banana)
          </label>

          <div className="flex gap-2">
            <input
              type="text"
              value={cardData.imagePrompt || ''}
              onChange={(e) => handleChange('imagePrompt', e.target.value)}
              placeholder="Décrivez le monstre/objet..."
              className="flex-grow p-2 border border-gray-300 rounded focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
            />
            <button
              onClick={handleGenerateImage}
              disabled={isGenerating}
              className="bg-amber-600 hover:bg-amber-700 text-white font-bold py-2 px-4 rounded transition-colors disabled:opacity-50 whitespace-nowrap shadow-sm"
            >
              {isGenerating ? 'Peinture...' : 'Générer'}
            </button>
          </div>
          {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
          <p className="text-[10px] text-gray-500 mt-2 italic">
            * Le style artistique "Munchkin/John Kovalic" est appliqué automatiquement.
          </p>

          <div className="mt-3">
            <input
              type="file"
              accept="image/*"
              className="hidden"
              id="image-upload"
              onChange={handleImageUpload}
              disabled={isGenerating || isRemovingBg}
            />
            <label
              htmlFor="image-upload"
              className={`w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition-colors cursor-pointer shadow-sm flex items-center justify-center gap-2 ${(isGenerating || isRemovingBg) ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <span>🖼️</span>
              Importer une image
            </label>
          </div>

          {/* Background Removal Button - Show if image exists */}
          {(cardData.imageData || cardData.storedImageUrl) && (
            <div className="mt-3 pt-3 border-t border-gray-200">
              <button
                onClick={handleRemoveBackground}
                disabled={isRemovingBg || (!removeBgApiKey && !hasDefaultRemoveBgKey)}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded transition-colors disabled:opacity-50 shadow-sm flex items-center justify-center gap-2"
                title={(!removeBgApiKey && !hasDefaultRemoveBgKey) ? "Configurez d'abord votre clé API dans les paramètres" : "Supprimer l'arrière-plan de l'image"}
              >
                {isRemovingBg ? (
                  <>
                    <span className="animate-spin">⏳</span>
                    Suppression en cours...
                  </>
                ) : (
                  <>
                    <span>✂️</span>
                    Supprimer l'arrière-plan
                  </>
                )}
              </button>

              {(!removeBgApiKey && !hasDefaultRemoveBgKey) && (
                <p className="text-xs text-gray-500 mt-1 text-center">
                  Configurez votre clé API remove.bg dans les paramètres (⚙️) pour utiliser cette fonction.
                </p>
              )}
              {(!removeBgApiKey && hasDefaultRemoveBgKey) && (
                <p className="text-xs text-gray-400 mt-1 text-center italic">
                  Utilisation de la clé API par défaut du serveur.
                </p>
              )}
            </div>
          )}
        </div>

        {/* Image Style Options */}
        <div className="mb-4 grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Taille de l'image</label>
            <select
              value={cardData.imageScale || 100}
              onChange={(e) => handleChange('imageScale', parseInt(e.target.value))}
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
            >
              <option value={150}>150%</option>
              <option value={140}>140%</option>
              <option value={130}>130%</option>
              <option value={120}>120%</option>
              <option value={110}>110%</option>
              <option value={100}>100% (Défaut)</option>
              <option value={95}>95%</option>
              <option value={90}>90%</option>
              <option value={80}>80%</option>
              <option value={70}>70%</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Position (X / Y)</label>
            <div className="flex gap-2">
              <input
                type="number"
                title="Décalage Horizontal %"
                value={cardData.imageOffsetX || 0}
                onChange={(e) => handleChange('imageOffsetX', parseInt(e.target.value) || 0)}
                className="w-1/2 p-2 border border-gray-300 rounded focus:ring-2 focus:ring-amber-500 text-center"
                placeholder="X"
              />
              <input
                type="number"
                title="Décalage Vertical %"
                value={cardData.imageOffsetY || 0}
                onChange={(e) => handleChange('imageOffsetY', parseInt(e.target.value) || 0)}
                className="w-1/2 p-2 border border-gray-300 rounded focus:ring-2 focus:ring-amber-500 text-center"
                placeholder="Y"
              />
            </div>
          </div>
        </div>

        {/* Description Box Size Control */}
        <div className="mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Taille de l'encart "Description"</label>
            <select
              value={cardData.descriptionBoxScale || 100}
              onChange={(e) => handleChange('descriptionBoxScale', parseInt(e.target.value))}
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
            >
              <option value={100}>100% (Défaut)</option>
              <option value={110}>110%</option>
              <option value={120}>120%</option>
              <option value={130}>130%</option>
              <option value={140}>140%</option>
              <option value={150}>150%</option>
              <option value={160}>160%</option>
              <option value={170}>170%</option>
            </select>
            <p className="text-xs text-gray-500 mt-1 italic">
              Augmentez la taille si le texte est trop petit. L'encart s'agrandira vers le bas.
            </p>
          </div>
        </div>

        {/* Descriptions */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            value={cardData.description || ''}
            onChange={(e) => handleChange('description', e.target.value)}
            rows={4}
            className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
          />
        </div>

        {cardData.type === CardType.MONSTER && (
          <div>
            <label className="block text-sm font-medium text-red-700 mb-1">Incident Fâcheux</label>
            <textarea
              value={cardData.badStuff || ''}
              onChange={(e) => handleChange('badStuff', e.target.value)}
              rows={2}
              className="w-full p-2 border border-red-200 rounded focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-red-50"
            />
          </div>
        )}

        {/* Review / Internal Comments */}
        <div className="border-t border-gray-100 pt-4 mt-4">
          <label className="block text-sm font-bold text-gray-700 mb-1 flex items-center gap-2">
            <span>📝 Commentaire Interne (Review)</span>
            <span className="text-[10px] font-normal text-gray-500 bg-gray-100 px-2 py-0.5 rounded">Ne s'affiche pas sur la carte</span>
          </label>
          <textarea
            value={cardData.internalComment || ''}
            onChange={(e) => handleChange('internalComment', e.target.value)}
            rows={3}
            placeholder="Notes de review, suggestions de modifications..."
            className="w-full p-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-gray-400 focus:border-gray-400 bg-gray-50/50 italic"
          />
        </div>

      </div>

    </div >

  );
};

export default CardForm;