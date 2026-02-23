import React, { useState } from 'react';
import { CardData, CardType } from '../types';
import { useTranslation } from '../i18n/LanguageContext';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (cards: CardData[]) => Promise<void>;
}

interface ImportResult {
  success: CardData[];
  errors: string[];
}

type ImportState = 'input' | 'importing' | 'success' | 'error';

/**
 * Parse a semicolon-separated line while respecting JSON content that may contain semicolons.
 * This handles the json_data column which contains embedded JSON.
 */
const parseCSVLine = (line: string, delimiter: string = ';'): string[] => {
  const result: string[] = [];
  let current = '';
  let braceDepth = 0;
  let bracketDepth = 0;
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const prevChar = i > 0 ? line[i - 1] : '';

    // Handle escaped quotes in JSON
    if (char === '"' && prevChar !== '\\') {
      inQuotes = !inQuotes;
      current += char;
    } else if (!inQuotes) {
      if (char === '{') {
        braceDepth++;
        current += char;
      } else if (char === '}') {
        braceDepth--;
        current += char;
      } else if (char === '[') {
        bracketDepth++;
        current += char;
      } else if (char === ']') {
        bracketDepth--;
        current += char;
      } else if (char === delimiter && braceDepth === 0 && bracketDepth === 0) {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    } else {
      current += char;
    }
  }
  result.push(current);

  return result;
};

/**
 * Check if a line is a header row
 */
const isHeaderLine = (line: string): boolean => {
  const firstField = line.split(';')[0].toLowerCase().trim();
  return firstField === 'id' || firstField === 'title' || firstField === 'type';
};

/**
 * Validate that a parsed object is a valid CardData
 */
const validateCard = (card: Partial<CardData>): boolean => {
  if (!card.title || typeof card.title !== 'string') return false;
  if (!card.type || !Object.values(CardType).includes(card.type as CardType)) return false;
  return true;
};

/**
 * Parse input text and extract CardData objects
 */
const parseImportData = (
  input: string,
  t: (key: string, params?: Record<string, string | number>) => string,
): ImportResult => {
  const lines = input
    .trim()
    .split('\n')
    .filter((line) => line.trim());
  const success: CardData[] = [];
  const errors: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Skip header line
    if (i === 0 && isHeaderLine(line)) {
      continue;
    }

    // Skip empty lines
    if (!line) continue;

    try {
      const parts = parseCSVLine(line, ';');

      // We expect at least 4 columns: id, title, type, json_data
      if (parts.length < 4) {
        errors.push(t('importModal.errorInvalidFormat', { line: i + 1 }));
        continue;
      }

      const jsonData = parts[3]; // json_data column
      const imageUrl = parts.length > 4 ? parts[4] : ''; // image_url column (optional)

      if (!jsonData || jsonData.trim() === '') {
        errors.push(t('importModal.errorEmptyJson', { line: i + 1 }));
        continue;
      }

      // Parse the JSON
      let cardJson: Partial<CardData>;
      try {
        cardJson = JSON.parse(jsonData);
      } catch {
        errors.push(t('importModal.errorInvalidJson', { line: i + 1 }));
        continue;
      }

      // Validate the card
      if (!validateCard(cardJson)) {
        errors.push(t('importModal.errorInvalidCard', { line: i + 1 }));
        continue;
      }

      // Generate new UUID
      cardJson.id = crypto.randomUUID
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      // Use image_url from column 5 if present and not already in JSON
      if (imageUrl && imageUrl.trim() !== '' && !cardJson.storedImageUrl) {
        cardJson.storedImageUrl = imageUrl.trim();
      }

      // Clear imageData as we don't want to import base64 data
      cardJson.imageData = null;

      // Ensure all required fields have defaults
      const finalCard: CardData = {
        id: cardJson.id,
        title: cardJson.title || '',
        type: cardJson.type as CardType,
        layout: cardJson.layout || 'standard',
        level: cardJson.level ?? '',
        bonus: cardJson.bonus ?? '',
        description: cardJson.description || '',
        badStuff: cardJson.badStuff || '',
        gold: cardJson.gold || '',
        imagePrePrompt: cardJson.imagePrePrompt || '',
        imagePrompt: cardJson.imagePrompt || '',
        imageData: null,
        storedImageUrl: cardJson.storedImageUrl,
        itemSlot: cardJson.itemSlot || '',
        isBig: cardJson.isBig || false,
        restrictions: cardJson.restrictions || '',
        levelsGained: cardJson.levelsGained ?? '',
        imageScale: cardJson.imageScale ?? 100,
        imageOffsetX: cardJson.imageOffsetX ?? 0,
        imageOffsetY: cardJson.imageOffsetY ?? 0,
        descriptionBoxScale: cardJson.descriptionBoxScale ?? 100,
        isBaseCard: cardJson.isBaseCard || false,
        isValidated: cardJson.isValidated || false,
        internalComment: cardJson.internalComment || '',
      };

      success.push(finalCard);
    } catch {
      errors.push(t('importModal.errorUnexpected', { line: i + 1 }));
    }
  }

  return { success, errors };
};

/**
 * Group cards by type for display
 */
const groupByType = (cards: CardData[]): Map<CardType, number> => {
  const grouped = new Map<CardType, number>();
  cards.forEach((card) => {
    const count = grouped.get(card.type as CardType) || 0;
    grouped.set(card.type as CardType, count + 1);
  });
  return grouped;
};

const ImportModal: React.FC<ImportModalProps> = ({ isOpen, onClose, onImport }) => {
  const { t } = useTranslation();
  const [inputText, setInputText] = useState('');
  const [importState, setImportState] = useState<ImportState>('input');
  const [importProgress, setImportProgress] = useState({ current: 0, total: 0 });
  const [importedCards, setImportedCards] = useState<CardData[]>([]);
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const [parseErrors, setParseErrors] = useState<string[]>([]);

  if (!isOpen) return null;

  const handleClose = () => {
    // Reset state
    setInputText('');
    setImportState('input');
    setImportProgress({ current: 0, total: 0 });
    setImportedCards([]);
    setImportErrors([]);
    setParseErrors([]);
    onClose();
  };

  const handleImport = async () => {
    if (!inputText.trim()) {
      setParseErrors([t('importModal.errorNoData')]);
      return;
    }

    // Parse the input
    const { success, errors } = parseImportData(inputText, t);
    setParseErrors(errors);

    if (success.length === 0) {
      setParseErrors((prev) => [...prev, t('importModal.errorNoValidCards')]);
      return;
    }

    // Start importing
    setImportState('importing');
    setImportProgress({ current: 0, total: success.length });
    setImportedCards([]);
    setImportErrors([]);

    try {
      // Import all cards at once
      await onImport(success);

      setImportedCards(success);
      setImportProgress({ current: success.length, total: success.length });
      setImportState('success');
    } catch (e: unknown) {
      setImportErrors([(e instanceof Error ? e.message : String(e)) || t('importModal.errorSave')]);
      setImportState('error');
    }
  };

  const typeGroups = groupByType(importedCards);

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white w-full max-w-2xl rounded-lg shadow-2xl border border-gray-200 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-200 bg-gray-50 rounded-t-lg">
          <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <span className="text-xl">📥</span>
            {importState === 'input' && t('importModal.title')}
            {importState === 'importing' && t('importModal.importing')}
            {importState === 'success' && t('importModal.success')}
            {importState === 'error' && t('importModal.error')}
          </h3>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none p-1"
            disabled={importState === 'importing'}
          >
            &times;
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-grow">
          {importState === 'input' && (
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-2">{t('importModal.formatHint')}</p>
                <code className="block bg-gray-100 p-2 rounded text-xs text-gray-700 font-mono">
                  id;title;type;json_data;image_url;date
                </code>
              </div>

              <div>
                <textarea
                  value={inputText}
                  onChange={(e) => {
                    setInputText(e.target.value);
                    setParseErrors([]);
                  }}
                  placeholder={t('importModal.placeholder')}
                  className="w-full h-64 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 font-mono text-sm resize-none"
                />
              </div>

              {parseErrors.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-sm font-bold text-red-700 mb-1">
                    {t('importModal.errorsDetected')}
                  </p>
                  <ul className="text-xs text-red-600 space-y-1 max-h-32 overflow-y-auto">
                    {parseErrors.map((error, i) => (
                      <li key={i}>• {error}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-xs text-blue-700">{t('importModal.idHint')}</p>
              </div>
            </div>
          )}

          {importState === 'importing' && (
            <div className="space-y-4 py-8">
              <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                <div
                  className="bg-amber-500 h-4 rounded-full transition-all duration-300"
                  style={{ width: `${(importProgress.current / importProgress.total) * 100}%` }}
                />
              </div>
              <p className="text-center text-gray-600">
                {t('importModal.cardsCount', {
                  current: importProgress.current,
                  total: importProgress.total,
                })}
              </p>
              <div className="flex justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-4 border-amber-500 border-t-transparent"></div>
              </div>
            </div>
          )}

          {importState === 'success' && (
            <div className="space-y-4">
              <div className="text-center py-4">
                <div className="text-5xl mb-3">✅</div>
                <p className="text-xl font-bold text-green-700">
                  {t('importModal.importSuccess', {
                    count: importedCards.length,
                    plural: importedCards.length !== 1 ? 's' : '',
                  })}
                </p>
              </div>

              {typeGroups.size > 0 && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm font-bold text-gray-700 mb-2">
                    {t('importModal.repartition')}
                  </p>
                  <ul className="space-y-1">
                    {Array.from(typeGroups.entries()).map(([type, count]) => (
                      <li key={type} className="text-sm text-gray-600 flex items-center gap-2">
                        <span className="w-4">•</span>
                        <span>
                          {count} {type}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {parseErrors.length > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <p className="text-sm font-bold text-yellow-700 mb-1">
                    {t('importModal.ignoredLines', {
                      count: parseErrors.length,
                      plural: parseErrors.length !== 1 ? 's' : '',
                    })}
                  </p>
                  <ul className="text-xs text-yellow-600 space-y-1 max-h-24 overflow-y-auto">
                    {parseErrors.slice(0, 5).map((error, i) => (
                      <li key={i}>• {error}</li>
                    ))}
                    {parseErrors.length > 5 && (
                      <li>{t('importModal.andOthers', { count: parseErrors.length - 5 })}</li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          )}

          {importState === 'error' && (
            <div className="space-y-4">
              <div className="text-center py-4">
                <div className="text-5xl mb-3">❌</div>
                <p className="text-xl font-bold text-red-700">{t('importModal.error')}</p>
              </div>

              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <ul className="text-sm text-red-600 space-y-1">
                  {importErrors.map((error, i) => (
                    <li key={i}>• {error}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-4 border-t border-gray-200 bg-gray-50 rounded-b-lg">
          {importState === 'input' && (
            <>
              <button
                onClick={handleClose}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium transition-colors"
              >
                {t('importModal.cancel')}
              </button>
              <button
                onClick={handleImport}
                disabled={!inputText.trim()}
                className="flex items-center gap-2 px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg shadow transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span>📥</span>
                {t('importModal.importBtn')}
              </button>
            </>
          )}

          {importState === 'importing' && (
            <button disabled className="px-4 py-2 text-gray-400 font-medium cursor-not-allowed">
              {t('importModal.importing')}
            </button>
          )}

          {(importState === 'success' || importState === 'error') && (
            <button
              onClick={handleClose}
              className="px-5 py-2 bg-gray-600 hover:bg-gray-700 text-white font-bold rounded-lg shadow transition-colors"
            >
              {t('importModal.close')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImportModal;
