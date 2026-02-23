import React, { useState, useEffect } from 'react';
import CardForm from './components/CardForm';
import CardPreview from './components/CardPreview';
import DeckStats from './components/DeckStats';
import CardGallery from './components/CardGallery';
import CardList from './components/CardList';
import GlobalSettingsComponent from './components/GlobalSettings';
import ImportModal from './components/ImportModal';
import LegalModal from './components/LegalModal';
import Footer from './components/Footer';
import CardNavigation from './components/CardNavigation';
import { CardData, INITIAL_CARD_DATA, GlobalSettings, DEFAULT_GLOBAL_SETTINGS } from './types';
import { saveCardToSheet, fetchCardsFromSheet, deleteCardFromSheet } from './services/sheetService';
import { useNotification } from './components/NotificationContext';

const GOOGLE_SCRIPT_TEMPLATE = `// CODE À COPIER DANS VOTRE GOOGLE APPS SCRIPT (fichier Code.gs)

function doGet(e) {
  return handleRequest(e);
}

function doPost(e) {
  return handleRequest(e);
}

function handleRequest(e) {
  const lock = LockService.getScriptLock();
  lock.tryLock(10000);

  try {
    const doc = SpreadsheetApp.getActiveSpreadsheet();
    
    // On prend le premier onglet disponible
    const sheet = doc.getSheets()[0]; 
    
    // Initialisation des en-têtes si la feuille est vide
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(["id", "title", "type", "json_data", "image_url", "date"]);
    }

    // Gestion du GET (Lecture)
    if (!e.postData) {
      const rows = sheet.getDataRange().getValues();
      // On ignore la ligne d'en-tête (index 0)
      
      const data = rows.slice(1).map(row => {
        try {
          // On essaie de parser le JSON stocké dans la colonne D (index 3)
          const jsonData = row[3];
          if (!jsonData) return null;
          
          const card = JSON.parse(jsonData);
          
          // On force l'URL de l'image stockée dans la colonne E (index 4)
          // pour s'assurer qu'elle est à jour si modifiée manuellement
          if (row[4] && row[4].toString().trim() !== "") {
             card.storedImageUrl = row[4].toString();
          }
          return card;
        } catch (err) { return null; }
      }).filter(c => c !== null);
      
      return responseJSON(data);
    }

    // Gestion du POST (Sauvegarde)
    const rawData = e.postData.contents;
    const data = JSON.parse(rawData);

    if (data.action === 'save') {
      const card = data.card;
      let imageUrl = card.storedImageUrl || "";

      // Si une nouvelle image est fournie en Base64, on la sauvegarde dans Drive
      if (card.imageData) {
        const folderName = "MunchkinImages";
        const folders = DriveApp.getFoldersByName(folderName);
        let folder;
        if (folders.hasNext()) {
          folder = folders.next();
        } else {
          folder = DriveApp.createFolder(folderName);
          folder.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
        }

        const cleanTitle = (card.title || "untitled").replace(/[^a-z0-9]/gi, '_');
        const fileName = "card_" + cleanTitle + "_" + card.id + ".png";
        
        const decoded = Utilities.base64Decode(card.imageData);
        const blob = Utilities.newBlob(decoded, "image/png", fileName);
        
        const file = folder.createFile(blob);
        file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
        
        imageUrl = "https://drive.google.com/uc?export=view&id=" + file.getId();
      }

      // Préparation de la ligne de données
      const rowData = [
        card.id,
        card.title,
        card.type,
        JSON.stringify({ ...card, imageData: null, storedImageUrl: imageUrl }), // JSON sans le base64
        imageUrl,
        new Date()
      ];

      // LOGIQUE DE MISE À JOUR : On cherche si l'ID existe déjà
      const allData = sheet.getDataRange().getValues();
      let rowIndex = -1;

      // On boucle à partir de la ligne 1 (après headers)
      for (let i = 1; i < allData.length; i++) {
        // La colonne A (index 0) contient l'ID
        if (allData[i][0] == card.id) {
          rowIndex = i + 1; // +1 car les rangs Sheet commencent à 1
          break;
        }
      }

      if (rowIndex > 0) {
        // Mise à jour de la ligne existante
        // getRange(row, column, numRows, numColumns)
        sheet.getRange(rowIndex, 1, 1, rowData.length).setValues([rowData]);
      } else {
        // Création d'une nouvelle ligne
        sheet.appendRow(rowData);
      }

      return responseJSON({ status: 'success', imageUrl: imageUrl });
    }

    if (data.action === 'delete') {
      const cardId = data.cardId;
      const allData = sheet.getDataRange().getValues();
      let rowIndex = -1;

      for (let i = 1; i < allData.length; i++) {
        if (allData[i][0] == cardId) {
          rowIndex = i + 1;
          break;
        }
      }

      if (rowIndex > 0) {
        sheet.deleteRow(rowIndex);
        return responseJSON({ status: 'success' });
      }
      return responseJSON({ status: 'error', message: 'Carte non trouvée' });
    }
    
    return responseJSON({ status: 'error', message: 'Action inconnue' });

  } catch (e) {
    return responseJSON({ status: 'error', message: e.toString() });
  } finally {
    lock.releaseLock();
  }
}

function responseJSON(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}`;

const App: React.FC = () => {
  // Initialisation avec ID unique si manquant
  const initCard = {
    ...INITIAL_CARD_DATA,
    id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(),
  };

  const [cardData, setCardData] = useState<CardData>(initCard);
  const [savedCards, setSavedCards] = useState<CardData[]>([]);
  const [scriptUrl, setScriptUrl] = useState<string>('');

  const [removeBgApiKey, setRemoveBgApiKey] = useState<string>(''); // remove.bg API key
  const [geminiApiKey, setGeminiApiKey] = useState<string>(''); // New: Gemini API key
  const [showSettings, setShowSettings] = useState(false);
  const [activeTab, setActiveTab] = useState<'config' | 'code'>('config'); // Nouvel état pour les onglets modal settings
  const [activeView, setActiveView] = useState<'editor' | 'gallery' | 'list' | 'settings'>(
    'editor',
  ); // Ajout de 'settings'
  const [globalSettings, setGlobalSettings] = useState<GlobalSettings>(DEFAULT_GLOBAL_SETTINGS);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingList, setIsLoadingList] = useState(false);
  const [configError, setConfigError] = useState<string | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showLegalModal, setShowLegalModal] = useState(false);
  const [legalActiveTab, setLegalActiveTab] = useState<'mentions' | 'privacy' | 'cgu'>('mentions');
  const [listSaveStatus, setListSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>(
    'idle',
  );
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false); // Track if current card has changes
  const { showNotification } = useNotification();

  // State for deck target total (lifted from DeckStats)
  const [targetTotal, setTargetTotal] = useState<number>(350);

  // Charger les préférences depuis localStorage
  useEffect(() => {
    const savedUrl = localStorage.getItem('google_script_url');
    if (savedUrl) {
      setScriptUrl(savedUrl);
      loadSavedCards(savedUrl);
    }

    const savedApiKey = localStorage.getItem('removebg_api_key');
    if (savedApiKey) {
      setRemoveBgApiKey(savedApiKey);
    }

    const savedGeminiKey = localStorage.getItem('gemini_api_key');
    if (savedGeminiKey) {
      setGeminiApiKey(savedGeminiKey);
    }

    const savedTarget = localStorage.getItem('deckstats_target_total');
    if (savedTarget) {
      const parsed = parseInt(savedTarget, 10);
      if (!isNaN(parsed) && parsed > 0) {
        setTargetTotal(parsed);
      }
    }

    const savedGlobalSettings = localStorage.getItem('global_settings');
    if (savedGlobalSettings) {
      try {
        setGlobalSettings(JSON.parse(savedGlobalSettings));
      } catch (e) {
        console.error('Erreur chargement global settings', e);
      }
    }
  }, []);

  const handleGlobalSettingsChange = (newSettings: GlobalSettings) => {
    setGlobalSettings(newSettings);
    localStorage.setItem('global_settings', JSON.stringify(newSettings));
  };

  // Inject Google Fonts whenever font settings change
  useEffect(() => {
    const fonts = [
      globalSettings.fontTitle,
      globalSettings.fontDescription,
      globalSettings.fontMeta,
    ];
    // Deduplicate
    const uniqueFonts = [...new Set(fonts)];
    const families = uniqueFonts
      .filter((f) => !['Windlass', 'Caslon Antique'].includes(f))
      .map((f) => `family=${encodeURIComponent(f)}:wght@400;700`)
      .join('&');
    const href = families ? `https://fonts.googleapis.com/css2?${families}&display=swap` : '';

    // Replace or create the link tag
    let link = document.getElementById('dynamic-google-fonts') as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement('link');
      link.id = 'dynamic-google-fonts';
      link.rel = 'stylesheet';
      document.head.appendChild(link);
    }
    if (href) {
      link.href = href;
    } else {
      link.href = '';
    }
  }, [globalSettings.fontTitle, globalSettings.fontDescription, globalSettings.fontMeta]);

  const handleResetGlobalSettings = () => {
    setGlobalSettings(DEFAULT_GLOBAL_SETTINGS);
    localStorage.removeItem('global_settings');
  };

  const handleTargetTotalChange = (newTarget: number) => {
    setTargetTotal(newTarget);
    localStorage.setItem('deckstats_target_total', String(newTarget));
  };

  const loadSavedCards = async (url: string) => {
    if (!url) return;
    setIsLoadingList(true);
    setConfigError(null);
    try {
      const cards = await fetchCardsFromSheet(url);
      setSavedCards(cards.reverse()); // Les plus récents en premier
    } catch (e: any) {
      console.error('Erreur chargement cartes', e);
      // Détection sommaire des erreurs de configuration/CORS
      if (e.message.includes('Failed to fetch') || e.message.includes('Erreur HTTP')) {
        setConfigError('Impossible de communiquer avec Google Script.');
      }
    } finally {
      setIsLoadingList(false);
    }
  };

  const handleScriptUrlSave = () => {
    localStorage.setItem('google_script_url', scriptUrl);

    localStorage.setItem('removebg_api_key', removeBgApiKey);
    localStorage.setItem('gemini_api_key', geminiApiKey);
    setShowSettings(false);
    loadSavedCards(scriptUrl);
    showNotification('Paramètres enregistrés !', 'success');
  };

  const handleSaveCard = async (cardToSave?: CardData | any) => {
    // Detect if we received a valid CardData object or an event/undefined
    // Events have properties like 'target', 'preventDefault', 'nativeEvent', etc.
    // CardData has 'id', 'title', 'type', etc.
    // IMPORTANT: Check that it's NOT a React event (which would have 'target' or 'nativeEvent')
    const isReactEvent =
      cardToSave &&
      typeof cardToSave === 'object' &&
      ('target' in cardToSave || 'nativeEvent' in cardToSave || 'currentTarget' in cardToSave);
    const isValidCardData =
      cardToSave &&
      typeof cardToSave === 'object' &&
      'id' in cardToSave &&
      'title' in cardToSave &&
      !isReactEvent;
    const dataToSave = isValidCardData ? cardToSave : cardData;
    const calledFromBackgroundRemoval = isValidCardData;

    console.log('[SAVE] Starting save process...');
    console.log('[SAVE] Card to save:', {
      id: dataToSave.id,
      title: dataToSave.title,
      hasImageData: !!dataToSave.imageData,
      hasStoredUrl: !!dataToSave.storedImageUrl,
    });
    console.log('[SAVE] Called from background removal:', calledFromBackgroundRemoval);

    setIsSaving(true);
    try {
      const result = await saveCardToSheet(scriptUrl, dataToSave);
      console.log('[SAVE] Save result:', result);

      // Si le serveur a renvoyé une URL d'image valide (qui ressemble à une URL)
      // On met à jour l'état local pour utiliser l'URL stockée
      if (
        result.imageUrl &&
        (result.imageUrl.startsWith('http') || result.imageUrl.startsWith('data:'))
      ) {
        console.log('[SAVE] Valid image URL received:', result.imageUrl.substring(0, 100) + '...');

        // Keep imageData if it exists (important for freshly modified images)
        // Only clear it if we're confident the URL points to the correct image
        if (dataToSave.imageData) {
          console.log('[SAVE] Keeping imageData, setting storedImageUrl');
          // For freshly generated/modified images, keep imageData and set storedImageUrl
          // The image will display from imageData until the user reloads the card
          setCardData((prev) => ({ ...prev, ...dataToSave, storedImageUrl: result.imageUrl }));
        } else {
          console.log('[SAVE] No imageData, using storedImageUrl only');
          // For cards without local imageData, use the stored URL
          setCardData((prev) => ({ ...prev, storedImageUrl: result.imageUrl, imageData: null }));
        }
      } else {
        // Si l'URL renvoyée est vide ou invalide (ex: juste un nom de fichier),
        // on GARDE l'image locale (imageData) pour ne pas casser l'affichage.
        if (result.imageUrl) {
          console.warn(
            "[SAVE] URL invalide reçue du script (nom de fichier ?). Conservation de l'image locale.",
            result.imageUrl,
          );
        }
      }

      // Mark card as saved (no unsaved changes)
      setHasUnsavedChanges(false);

      // Immediately update savedCards with the saved card data
      // This ensures navigation shows the latest data without waiting for the 2s sheet refresh
      const updatedDataToSave = {
        ...dataToSave,
        ...(result.imageUrl &&
        (result.imageUrl.startsWith('http') || result.imageUrl.startsWith('data:'))
          ? { storedImageUrl: result.imageUrl }
          : {}),
        imageData: null, // savedCards should not hold base64 image data
      };
      setSavedCards((prev) => {
        const existingIndex = prev.findIndex((c) => c.id === dataToSave.id);
        if (existingIndex !== -1) {
          // Update existing card in-place
          const updated = [...prev];
          updated[existingIndex] = updatedDataToSave;
          return updated;
        } else {
          // New card: add at beginning (newest first)
          return [updatedDataToSave, ...prev];
        }
      });

      // Only show alert if NOT called from background removal (to avoid double alerts)
      if (!calledFromBackgroundRemoval) {
        showNotification('Carte sauvegardée avec succès !', 'success');
      }

      console.log('[SAVE] Scheduling cards list refresh in 2 seconds...');
      // Delay the list refresh by 2 seconds to give Google Sheets time to fully update
      // Store the current card ID to check later if we should update cardData
      const savedCardId = dataToSave.id;

      setTimeout(async () => {
        console.log('[SAVE] Refreshing cards list...');
        await loadSavedCards(scriptUrl);

        // After reloading, update cardData only if the user is still editing the same card
        // This prevents unwanted navigation when user has moved to a different card/view
        console.log(
          '[SAVE] Checking if we should sync card data. Current card ID:',
          cardData.id,
          'Saved card ID:',
          savedCardId,
        );

        // Use a callback to access the most recent cardData value
        setCardData((currentCardData) => {
          if (currentCardData.id === savedCardId) {
            console.log('[SAVE] User still on same card, updating silently from savedCards');
            // Find the updated card in savedCards using a ref callback won't work here
            // We need to use setSavedCards callback or find another way
            // For now, we don't update cardData here - it was already updated above after save
            console.log('[SAVE] Card data already up-to-date from save response');
          } else {
            console.log('[SAVE] User has navigated away, not updating cardData');
          }
          return currentCardData; // No change needed, already updated above
        });
      }, 2000);
    } catch (e: any) {
      console.error('[SAVE] Save error:', e);
      showNotification('Erreur lors de la sauvegarde : ' + e.message, 'error');
    } finally {
      console.log('[SAVE] Save process completed');
      setIsSaving(false);
    }
  };

  const handleDeleteCard = async () => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette carte ?')) return;

    if (!scriptUrl) {
      // Si pas de script URL, on supprime juste de l'état local (si c'est dans la liste)
      setSavedCards((prev) => prev.filter((c) => c.id !== cardData.id));
      handleNewCard();
      return;
    }

    setIsSaving(true);
    try {
      await deleteCardFromSheet(scriptUrl, cardData.id);
      await loadSavedCards(scriptUrl);
      handleNewCard();
      showNotification('Carte supprimée !', 'success');
    } catch (e: any) {
      showNotification('Erreur lors de la suppression : ' + e.message, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDuplicateCard = () => {
    const newId = crypto.randomUUID ? crypto.randomUUID() : Date.now().toString();
    const duplicatedCard = {
      ...cardData,
      id: newId,
      title: cardData.title ? `${cardData.title} (Copie)` : 'Copie',
      imageData: null, // On ne duplique pas l'image
      storedImageUrl: undefined, // On ne duplique pas l'image stockée
    };
    setCardData(duplicatedCard);
    // On reste sur l'éditeur pour modifier la copie
    setActiveView('editor');
    showNotification('Carte dupliquée ! Vous éditez maintenant la copie.', 'success');
  };

  const handleNewCard = (initialData?: Partial<CardData>) => {
    const baseCard = {
      ...INITIAL_CARD_DATA,
      id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(),
      imagePrePrompt: globalSettings.defaultImagePrePrompt, // Use custom pre-prompt
    };
    setCardData(initialData ? { ...baseCard, ...initialData } : baseCard);
    setActiveView('editor'); // Switch to editor when creating new card
    setHasUnsavedChanges(false); // New card has no changes yet
  };

  const handleImportCards = async (cards: CardData[]) => {
    let successCount = 0;

    if (!scriptUrl) {
      // If no script URL, just add to local state
      setSavedCards((prev) => [...cards, ...prev]);
      successCount = cards.length;
      if (cards.length > 0) {
        handleSelectCard(cards[0]);
        setShowImportModal(false);
        showNotification(`${successCount} carte(s) importée(s) localement.`, 'success');
      }
      return;
    }

    // Save each card to the sheet
    for (const card of cards) {
      try {
        const result = await saveCardToSheet(scriptUrl, card);
        // Update the card with the image URL if returned
        if (
          result.imageUrl &&
          (result.imageUrl.startsWith('http') || result.imageUrl.startsWith('data:'))
        ) {
          card.storedImageUrl = result.imageUrl;
        }
        successCount++;
      } catch (e) {
        console.error('Erreur lors de la sauvegarde de la carte:', e);
        // Continue with other cards even if one fails
      }
    }

    // Refresh the saved cards list
    await loadSavedCards(scriptUrl);

    // Redirect to the first imported card and close modal
    if (cards.length > 0) {
      handleSelectCard(cards[0]);
      setShowImportModal(false);

      if (successCount === cards.length) {
        showNotification(`${successCount} carte(s) importée(s) avec succès !`, 'success');
      } else {
        showNotification(
          `${successCount}/${cards.length} carte(s) importée(s).`,
          successCount > 0 ? 'info' : 'error',
        );
      }
    }
  };

  const handleSelectCard = (card: CardData, skipViewChange?: boolean) => {
    setCardData(card);
    if (!skipViewChange) {
      setActiveView('editor'); // Switch to editor when selecting a card
    }
    setHasUnsavedChanges(false); // Loading a saved card, no changes yet
    // Scroll to top on mobile (only if we're switching views)
    if (!skipViewChange) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Get cards of the same type as the current card, sorted by creation date
  const getSameTypeCards = (currentCard: CardData): CardData[] => {
    return savedCards.filter((card) => card.type === currentCard.type).reverse(); // Oldest first (since savedCards is newest first)
  };

  // Navigate to next/previous card of the same type
  const navigateToSiblingCard = (direction: 'prev' | 'next') => {
    const sameTypeCards = getSameTypeCards(cardData);
    if (sameTypeCards.length <= 1) return; // No siblings to navigate to

    const currentIndex = sameTypeCards.findIndex((c) => c.id === cardData.id);
    if (currentIndex === -1) return; // Current card not found

    let newIndex: number;
    if (direction === 'next') {
      newIndex = (currentIndex + 1) % sameTypeCards.length;
    } else {
      newIndex = (currentIndex - 1 + sameTypeCards.length) % sameTypeCards.length;
    }

    setCardData(sameTypeCards[newIndex]);
    setHasUnsavedChanges(false); // Loading a saved card, no changes yet
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Detect changes to cardData to mark as having unsaved changes
  useEffect(() => {
    // Find the saved version of this card
    const savedVersion = savedCards.find((c) => c.id === cardData.id);

    // If card doesn't exist in saved cards yet (new card), check if it has any content
    if (!savedVersion) {
      // For new cards, mark as having changes if any field differs from initial state
      const hasContent =
        cardData.title !== INITIAL_CARD_DATA.title ||
        cardData.description !== INITIAL_CARD_DATA.description ||
        cardData.imageData !== null ||
        cardData.storedImageUrl !== undefined ||
        cardData.imagePrompt !== INITIAL_CARD_DATA.imagePrompt ||
        cardData.internalComment !== INITIAL_CARD_DATA.internalComment;

      setHasUnsavedChanges(hasContent);
      return;
    }

    // Compare the current card with the saved version
    // We need to compare all important fields
    const hasChanges =
      savedVersion.title !== cardData.title ||
      savedVersion.type !== cardData.type ||
      savedVersion.level !== cardData.level ||
      savedVersion.bonus !== cardData.bonus ||
      savedVersion.gold !== cardData.gold ||
      savedVersion.description !== cardData.description ||
      savedVersion.badStuff !== cardData.badStuff ||
      savedVersion.restrictions !== cardData.restrictions ||
      savedVersion.itemSlot !== cardData.itemSlot ||
      savedVersion.isBig !== cardData.isBig ||
      savedVersion.levelsGained !== cardData.levelsGained ||
      savedVersion.isBaseCard !== cardData.isBaseCard ||
      savedVersion.isValidated !== cardData.isValidated ||
      savedVersion.imagePrompt !== cardData.imagePrompt ||
      savedVersion.imageScale !== cardData.imageScale ||
      savedVersion.imageOffsetX !== cardData.imageOffsetX ||
      savedVersion.imageOffsetY !== cardData.imageOffsetY ||
      savedVersion.descriptionBoxScale !== cardData.descriptionBoxScale ||
      savedVersion.internalComment !== cardData.internalComment ||
      // Check if image has changed (new imageData without matching storedImageUrl)
      (cardData.imageData && !cardData.storedImageUrl);

    setHasUnsavedChanges(hasChanges);
  }, [cardData, savedCards]);

  // Keyboard navigation support (arrow keys)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only navigate if we're in the editor view and there are saved cards
      if (activeView !== 'editor' || savedCards.length === 0) return;

      // Prevent navigation if user is typing in an input or textarea
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        navigateToSiblingCard('prev');
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        navigateToSiblingCard('next');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeView, savedCards, cardData]); // Dependencies to keep the handler updated

  // Quick update for inline editing in list view (silent save)
  const handleQuickUpdateCard = async (updatedCard: CardData) => {
    if (!scriptUrl) return;

    setListSaveStatus('saving');

    try {
      // Update local state immediately for responsiveness
      setSavedCards((prev) => prev.map((c) => (c.id === updatedCard.id ? updatedCard : c)));

      // Also update cardData if it's the same card being edited
      if (cardData.id === updatedCard.id) {
        setCardData(updatedCard);
      }

      // Save to backend
      await saveCardToSheet(scriptUrl, updatedCard);

      setListSaveStatus('saved');

      // Reset to idle after 2 seconds
      setTimeout(() => {
        setListSaveStatus('idle');
      }, 2000);
    } catch (e: any) {
      console.error('Erreur lors de la sauvegarde rapide:', e);
      setListSaveStatus('error');

      // Reset to idle after 3 seconds
      setTimeout(() => {
        setListSaveStatus('idle');
      }, 3000);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    showNotification('Code copié !', 'info');
  };

  return (
    <div className="min-h-screen bg-stone-100 font-sans text-gray-900 flex flex-col">
      {/* Header */}
      <header className="bg-amber-900 text-amber-50 shadow-lg sticky top-0 z-30">
        <div className="max-w-7xl mx-auto">
          {/* Top row: Logo and actions */}
          <div className="flex items-center justify-between p-4 pb-2">
            <div className="flex items-center gap-3">
              <div className="text-3xl">🗡️</div>
              <div>
                <h1 className="text-xl font-bold tracking-wider">MunchkinGen</h1>
                <p className="text-xs text-amber-200 opacity-80">
                  Complétez votre jeu avec vos propres cartes, ou construisez votre deck entièrement
                  !
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowSettings(!showSettings)}
                className={`transition-colors ${configError ? 'text-red-400 animate-pulse' : 'text-amber-200 hover:text-white'}`}
                title="Configuration Base de Données"
              >
                ⚙️
              </button>
              <a
                href="https://github.com/chichekebbab/cardgenerator"
                target="_blank"
                className="text-sm text-amber-300 hover:text-white underline hidden sm:inline"
              >
                GitHub
              </a>
            </div>
          </div>

          {/* Tab Navigation */}
          <nav className="flex px-4 gap-1">
            <button
              onClick={() => setActiveView('editor')}
              className={`px-6 py-2 font-bold text-sm rounded-t-lg transition-all ${
                activeView === 'editor'
                  ? 'bg-stone-100 text-amber-900 shadow-sm'
                  : 'bg-amber-800/50 text-amber-200 hover:bg-amber-800 hover:text-white'
              }`}
            >
              <span className="mr-2">✏️</span>
              Éditeur
            </button>
            <button
              onClick={() => setActiveView('gallery')}
              className={`px-6 py-2 font-bold text-sm rounded-t-lg transition-all flex items-center gap-2 ${
                activeView === 'gallery'
                  ? 'bg-stone-100 text-amber-900 shadow-sm'
                  : 'bg-amber-800/50 text-amber-200 hover:bg-amber-800 hover:text-white'
              }`}
            >
              <span>🎴</span>
              Galerie
              {savedCards.length > 0 && (
                <span
                  className={`text-xs px-1.5 py-0.5 rounded-full ${
                    activeView === 'gallery'
                      ? 'bg-amber-600 text-white'
                      : 'bg-amber-700 text-amber-100'
                  }`}
                >
                  {savedCards.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveView('list')}
              className={`px-6 py-2 font-bold text-sm rounded-t-lg transition-all flex items-center gap-2 ${
                activeView === 'list'
                  ? 'bg-stone-100 text-amber-900 shadow-sm'
                  : 'bg-amber-800/50 text-amber-200 hover:bg-amber-800 hover:text-white'
              }`}
            >
              <span>📋</span>
              Liste
            </button>
            <button
              onClick={() => setActiveView('settings')}
              className={`px-6 py-2 font-bold text-sm rounded-t-lg transition-all flex items-center gap-2 ${
                activeView === 'settings'
                  ? 'bg-stone-100 text-amber-900 shadow-sm'
                  : 'bg-amber-800/50 text-amber-200 hover:bg-amber-800 hover:text-white'
              }`}
            >
              <span>⚙️</span>
              Paramètres
            </button>
          </nav>
        </div>
      </header>

      {/* Settings Modal */}
      {(showSettings || configError) && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-stone-800 text-white w-full max-w-4xl rounded-lg shadow-2xl border border-amber-600 flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-4 border-b border-stone-700">
              <h3 className="text-lg font-bold text-amber-500">Configuration Backend</h3>
              <button
                onClick={() => {
                  setShowSettings(false);
                  setConfigError(null);
                }}
                className="text-gray-400 hover:text-white text-2xl leading-none"
              >
                &times;
              </button>
            </div>

            <div className="flex border-b border-stone-700">
              <button
                onClick={() => setActiveTab('config')}
                className={`flex-1 p-3 text-sm font-bold ${activeTab === 'config' ? 'bg-stone-700 text-amber-400 border-b-2 border-amber-500' : 'text-gray-400 hover:bg-stone-700'}`}
              >
                Connexion
              </button>
              <button
                onClick={() => setActiveTab('code')}
                className={`flex-1 p-3 text-sm font-bold ${activeTab === 'code' ? 'bg-stone-700 text-amber-400 border-b-2 border-amber-500' : 'text-gray-400 hover:bg-stone-700'}`}
              >
                Code Script Google (Copier/Coller)
              </button>
            </div>

            <div className="p-6 overflow-y-auto h-[75vh]">
              {activeTab === 'config' ? (
                <div className="space-y-6">
                  <div className="bg-stone-900/50 p-4 rounded-lg border border-stone-700 space-y-4">
                    <p className="text-sm text-amber-100">
                      Cet outil a besoin d'une base de données pour sauvegarder vos cartes. Vous
                      pouvez en créer une <strong>gratuitement</strong> et{' '}
                      <strong>facilement</strong> avec Google Sheets.
                    </p>

                    <div className="bg-amber-900/20 border border-amber-500/30 rounded p-4 text-sm text-amber-100/90">
                      <p className="font-bold mb-3 text-amber-400">Guide d'installation :</p>
                      <ol className="list-decimal ml-5 space-y-2 text-xs">
                        <li>
                          Créez un nouveau <strong>Google Sheet</strong> sur votre Drive (doit être
                          public ou accessible).
                        </li>
                        <li>
                          Dans le fichier, allez au menu <strong>Extensions</strong> &gt;{' '}
                          <strong>Apps Script</strong>.
                        </li>
                        <li>
                          Copiez le code complet depuis l'onglet{' '}
                          <strong className="text-amber-300">Code Script Google</strong> de cette
                          fenêtre.
                        </li>
                        <li>
                          Collez-le dans l'éditeur Apps Script (fichier <code>Code.gs</code>) en
                          remplaçant le contenu existant.
                        </li>
                        <li>
                          Cliquez sur <strong>Déployer</strong> &gt;{' '}
                          <strong>Nouveau déploiement</strong>.
                        </li>
                        <li>
                          Cliquez sur la roue dentée "Sélectionnez le type" &gt;{' '}
                          <strong>Application Web</strong>.
                        </li>
                        <li>
                          Configurez ainsi :
                          <ul className="list-disc ml-4 mt-1 space-y-1 text-amber-200/80">
                            <li>
                              Exécuter en tant que : <strong>Moi</strong>
                            </li>
                            <li>
                              Qui a accès : <strong>Tout le monde</strong> (Important pour que l'app
                              fonctionne)
                            </li>
                          </ul>
                        </li>
                        <li>
                          Cliquez sur <strong>Déployer</strong>, copiez l'URL de l'application Web
                          et collez-la ci-dessous.
                        </li>
                      </ol>
                    </div>

                    <div>
                      <label className="block text-sm mb-2 text-amber-100 font-bold">
                        URL de l'application Web (Google Apps Script)
                      </label>
                      <input
                        type="text"
                        value={scriptUrl}
                        onChange={(e) => setScriptUrl(e.target.value)}
                        placeholder="https://script.google.com/macros/s/..."
                        className="w-full p-3 rounded bg-stone-950 border border-stone-600 text-amber-100 text-sm font-mono focus:border-amber-500 outline-none placeholder-stone-600"
                      />
                    </div>
                  </div>

                  <div className="bg-stone-900/30 p-4 rounded-lg border border-stone-800 space-y-4">
                    <div className="border-b border-stone-700 pb-2">
                      <h4 className="text-amber-400 font-bold text-sm">Capacités IA (Optionnel)</h4>
                      <p className="text-xs text-stone-400 mt-1">
                        Si vous souhaitez rajouter des capacités IA, comme générer le texte ou
                        l'image des cartes, ou supprimer le fond des cartes, il vous faut renseigner
                        des clés API.
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm mb-2 text-amber-100 font-bold">
                        Clé API remove.bg (suppression d'arrière-plan)
                      </label>
                      <input
                        type="text"
                        value={removeBgApiKey}
                        onChange={(e) => {
                          const newVal = e.target.value;
                          setRemoveBgApiKey(newVal);
                          localStorage.setItem('removebg_api_key', newVal);
                        }}
                        placeholder="Votre clé API remove.bg"
                        className="w-full p-3 rounded bg-stone-950 border border-stone-600 text-amber-100 text-sm font-mono focus:border-amber-500 outline-none placeholder-stone-600"
                      />
                      <p className="text-xs text-stone-500 mt-1">
                        Si vide, la clé par défaut du serveur sera utilisée (si disponible). Obtenez
                        votre clé API sur{' '}
                        <a
                          href="https://www.remove.bg/api"
                          target="_blank"
                          className="underline hover:text-amber-200"
                        >
                          remove.bg/api
                        </a>
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm mb-2 text-amber-100 font-bold">
                        Clé API Gemini (Génération d'images)
                      </label>
                      <input
                        type="text"
                        value={geminiApiKey}
                        onChange={(e) => {
                          const newVal = e.target.value;
                          setGeminiApiKey(newVal);
                          localStorage.setItem('gemini_api_key', newVal);
                        }}
                        placeholder="Votre clé API Google AI Studio"
                        className="w-full p-3 rounded bg-stone-950 border border-stone-600 text-amber-100 text-sm font-mono focus:border-amber-500 outline-none placeholder-stone-600"
                      />
                      <p className="text-xs text-stone-500 mt-1">
                        Si vide, la clé par défaut du serveur sera utilisée (si disponible). Obtenez
                        une clé sur{' '}
                        <a
                          href="https://aistudio.google.com/app/apikey"
                          target="_blank"
                          className="underline hover:text-amber-200"
                        >
                          aistudio.google.com
                        </a>
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      onClick={handleScriptUrlSave}
                      className="bg-amber-600 px-8 py-2.5 rounded font-bold hover:bg-amber-500 text-white shadow-lg transition-all active:scale-95"
                    >
                      Sauvegarder les paramètres
                    </button>
                  </div>

                  {configError && (
                    <div className="bg-red-900/40 border border-red-500/50 rounded p-4 text-sm text-red-100 space-y-2">
                      <p className="font-bold flex items-center gap-2">⚠️ {configError}</p>
                      <p>Vérifiez que votre déploiement est configuré ainsi :</p>
                      <ul className="list-disc ml-5 space-y-1 text-amber-100/80 text-xs">
                        <li>
                          Exécuter en tant que : <strong>Moi</strong>
                        </li>
                        <li>
                          Qui a accès : <strong>Tout le monde</strong>
                        </li>
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4 h-full flex flex-col">
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-amber-100/80">
                      Ce code utilise maintenant votre <strong>premier onglet</strong> (quel que
                      soit son nom) :
                    </p>
                    <button
                      onClick={() => copyToClipboard(GOOGLE_SCRIPT_TEMPLATE)}
                      className="text-xs bg-stone-600 hover:bg-stone-500 text-white px-3 py-1 rounded border border-stone-500"
                    >
                      Copier le code
                    </button>
                  </div>
                  <div className="flex-grow relative border border-stone-600 rounded bg-stone-950">
                    <textarea
                      readOnly
                      value={GOOGLE_SCRIPT_TEMPLATE}
                      className="w-full h-full absolute inset-0 p-4 bg-transparent text-green-400 font-mono text-xs resize-none outline-none"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {showImportModal && (
        <ImportModal
          isOpen={showImportModal}
          onClose={() => setShowImportModal(false)}
          onImport={handleImportCards}
        />
      )}

      {/* Legal Modal */}
      {showLegalModal && (
        <LegalModal
          isOpen={showLegalModal}
          onClose={() => setShowLegalModal(false)}
          initialTab={legalActiveTab}
        />
      )}

      {/* Main Content */}
      <main className="flex-grow">
        {activeView === 'editor' ? (
          /* Editor View */
          <div className="max-w-[1600px] mx-auto p-4 md:p-8 w-full">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Left: Stats & Saved Cards (3 cols) */}
              <div className="lg:col-span-3 order-3 lg:order-1">
                <div className="bg-amber-100 rounded-lg shadow border border-amber-200 overflow-hidden sticky top-32 h-[calc(100vh-160px)]">
                  <DeckStats
                    cards={savedCards}
                    targetTotal={targetTotal}
                    onTargetTotalChange={handleTargetTotalChange}
                  />
                </div>
              </div>

              {/* Center: Preview (4 cols) */}
              <div className="lg:col-span-4 order-1 lg:order-2 lg:sticky lg:top-32">
                <div className="bg-white rounded-lg shadow-xl overflow-hidden border-2 border-amber-900/10">
                  <div className="bg-gray-50 border-b p-2 text-center text-xs text-gray-500 font-mono uppercase">
                    Aperçu de la Carte
                  </div>
                  {(() => {
                    const idx = savedCards.findIndex((c) => c.id === cardData.id);
                    return (
                      <CardPreview
                        data={cardData}
                        index={idx !== -1 ? idx : undefined}
                        globalSettings={globalSettings}
                      />
                    );
                  })()}
                </div>
              </div>

              {/* Right: Editor (5 cols) */}
              <div className="lg:col-span-5 order-2 lg:order-3">
                {/* Card Navigation - only show if there are saved cards */}
                {savedCards.length > 0 && (
                  <div className="mb-4">
                    <CardNavigation
                      currentCard={cardData}
                      sameTypeCards={getSameTypeCards(cardData)}
                      onNavigate={navigateToSiblingCard}
                    />
                  </div>
                )}
                <CardForm
                  key={cardData.id}
                  cardData={cardData}
                  onChange={setCardData}
                  onSave={handleSaveCard}
                  onNew={handleNewCard}
                  onDuplicate={handleDuplicateCard}
                  onDelete={handleDeleteCard}
                  onImport={() => setShowImportModal(true)}
                  isSaving={isSaving}
                  hasScriptUrl={!!scriptUrl}
                  hasUnsavedChanges={hasUnsavedChanges}
                  removeBgApiKey={removeBgApiKey}
                  geminiApiKey={geminiApiKey}
                  globalSettings={globalSettings}
                />
              </div>
            </div>
          </div>
        ) : activeView === 'gallery' ? (
          /* Gallery View */
          <CardGallery
            cards={savedCards}
            onSelectCard={handleSelectCard}
            onNewCard={handleNewCard}
            isLoading={isLoadingList}
            targetTotal={targetTotal}
            selectedCardId={cardData.id}
            globalSettings={globalSettings}
          />
        ) : activeView === 'list' ? (
          /* List View */
          <CardList
            cards={savedCards}
            onSelectCard={handleSelectCard}
            onUpdateCard={handleQuickUpdateCard}
            saveStatus={listSaveStatus}
            isLoading={isLoadingList}
          />
        ) : (
          /* Settings View */
          <GlobalSettingsComponent
            settings={globalSettings}
            onChange={handleGlobalSettingsChange}
            onResetToDefaults={handleResetGlobalSettings}
          />
        )}
      </main>

      <Footer
        onOpenLegal={(tab) => {
          setLegalActiveTab(tab);
          setShowLegalModal(true);
        }}
      />
    </div>
  );
};

export default App;
