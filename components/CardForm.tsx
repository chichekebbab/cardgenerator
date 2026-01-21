import React, { useState } from 'react';
import { CardData, CardType, CardLayout } from '../types';
import { generateCardArt } from '../services/geminiService';

interface CardFormProps {
  cardData: CardData;
  onChange: (data: CardData) => void;
  onSave: () => void;
  onNew: () => void;
  isSaving: boolean;
  hasScriptUrl: boolean;
}

// Pré-prompt technique imposé (ne change jamais)
const FIXED_PRE_PROMPT = "Génère une illustration au format carré (1x1). Le style artistique doit imiter parfaitement celui du jeu de cartes 'Munchkin' et du dessinateur John Kovalic : un style cartoon satirique, dessiné à la main, avec des contours noirs épais et une ambiance humoristique de fantasy. L'image doit présenter un seul élément isolé, centré. Il ne doit y avoir absolument aucun texte sur l'image. Le fond doit être une couleur unie, neutre et simple, sans aucun décor ni détail. Voici l'élément à générer :";

const CardForm: React.FC<CardFormProps> = ({ cardData, onChange, onSave, onNew, isSaving, hasScriptUrl }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      const base64Image = await generateCardArt(fullPrompt);
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

  return (
    <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200 h-full overflow-y-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Éditeur</h2>
        <div className="flex gap-2">
          <button
            onClick={onNew}
            className="px-3 py-1 text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 rounded border border-gray-300 transition-colors"
          >
            Nouvelle Carte
          </button>
          {hasScriptUrl && (
            <button
              onClick={onSave}
              disabled={isSaving}
              className="flex items-center gap-2 px-4 py-1 text-sm font-bold text-white bg-green-600 hover:bg-green-700 rounded shadow transition-colors disabled:opacity-50"
            >
              {isSaving ? 'Sauvegarde...' : '💾 Sauvegarder'}
            </button>
          )}
        </div>
      </div>

      {!hasScriptUrl && (
        <div className="mb-4 p-3 bg-blue-50 text-blue-800 text-xs rounded border border-blue-200">
          ℹ️ Connectez une base de données Google Sheet (via l'icône ⚙️ en haut) pour sauvegarder vos cartes dans le cloud.
        </div>
      )}

      <div className="space-y-4">

        {/* Layout Selector */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Mise en page (Layout)</label>
          <div className="flex bg-gray-100 p-1 rounded-lg border border-gray-300">
            <button
              onClick={() => handleChange('layout', 'standard')}
              className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${cardData.layout === 'standard' || !cardData.layout ? 'bg-white text-amber-700 shadow' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Type 1 (Standard)
            </button>
            <button
              onClick={() => handleChange('layout', 'classic')}
              className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${cardData.layout === 'classic' ? 'bg-white text-amber-700 shadow' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Type 2 (Classique)
            </button>
            <button
              onClick={() => handleChange('layout', 'modern')}
              className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${cardData.layout === 'modern' ? 'bg-white text-amber-700 shadow' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Type 3 (Moderne)
            </button>
          </div>
        </div>

        {/* Basic Info */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type de Carte</label>
            <select
              value={cardData.type}
              onChange={(e) => handleChange('type', e.target.value as CardType)}
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
              value={cardData.title}
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
                value={cardData.level}
                onChange={(e) => handleChange('level', parseInt(e.target.value) || '')}
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              />
            </div>
          )}
          {cardData.type === CardType.ITEM && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Bonus</label>
              <input
                type="number"
                value={cardData.bonus}
                onChange={(e) => handleChange('bonus', parseInt(e.target.value) || '')}
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Val/Trésors</label>
            <input
              type="text"
              value={cardData.gold}
              onChange={(e) => handleChange('gold', e.target.value)}
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              placeholder={cardData.type === CardType.MONSTER ? "ex: 2 Trésors" : "ex: 500 Pièces d'Or"}
            />
          </div>
        </div>

        {/* Monster Specifics */}
        {cardData.type === CardType.MONSTER && (
          <div className="bg-green-50 p-3 rounded border border-green-100 space-y-3">
            <h3 className="text-sm font-bold text-green-800 uppercase tracking-wide">Propriétés du Monstre</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Niveaux Gagnés</label>
                <input
                  type="number"
                  min="1"
                  value={cardData.levelsGained}
                  onChange={(e) => handleChange('levelsGained', parseInt(e.target.value) || '')}
                  className="w-full p-2 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-green-500"
                  placeholder="1"
                />
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
                  value={cardData.itemSlot}
                  onChange={(e) => handleChange('itemSlot', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-amber-500"
                >
                  <option value="">(Aucun)</option>
                  <option value="1 Main">1 Main</option>
                  <option value="2 Mains">2 Mains</option>
                  <option value="Couvre-chef">Couvre-chef</option>
                  <option value="Chaussures">Chaussures</option>
                  <option value="Armure">Armure</option>
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
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Restrictions / Utilisable par</label>
          <input
            type="text"
            value={cardData.restrictions}
            onChange={(e) => handleChange('restrictions', e.target.value)}
            placeholder="ex: Utilisable par l'Elfe uniquement"
            className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
          />
        </div>

        {/* Image Generation Section */}
        <div className="border-t border-b border-gray-200 py-4 my-4 bg-gray-50 -mx-6 px-6">
          <label className="block text-sm font-bold text-gray-800 mb-2">
            Générateur d'Art Visuel (Nano Banana)
          </label>

          <div className="flex gap-2">
            <input
              type="text"
              value={cardData.imagePrompt}
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

        {/* Descriptions */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            value={cardData.description}
            onChange={(e) => handleChange('description', e.target.value)}
            rows={4}
            className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
          />
        </div>

        {cardData.type === CardType.MONSTER && (
          <div>
            <label className="block text-sm font-medium text-red-700 mb-1">Incident Fâcheux</label>
            <textarea
              value={cardData.badStuff}
              onChange={(e) => handleChange('badStuff', e.target.value)}
              rows={2}
              className="w-full p-2 border border-red-200 rounded focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-red-50"
            />
          </div>
        )}

      </div>
    </div>
  );
};

export default CardForm;