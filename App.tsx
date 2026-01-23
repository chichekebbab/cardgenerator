import React, { useState, useEffect } from 'react';
import CardForm from './components/CardForm';
import CardPreview from './components/CardPreview';
import DeckStats from './components/DeckStats';
import CardGallery from './components/CardGallery';
import ImportModal from './components/ImportModal';
import { CardData, INITIAL_CARD_DATA } from './types';
import { saveCardToSheet, fetchCardsFromSheet } from './services/sheetService';

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
  const initCard = { ...INITIAL_CARD_DATA, id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString() };
  
  const [cardData, setCardData] = useState<CardData>(initCard);
  const [savedCards, setSavedCards] = useState<CardData[]>([]);
  const [scriptUrl, setScriptUrl] = useState<string>("");
  const [showSettings, setShowSettings] = useState(false);
  const [activeTab, setActiveTab] = useState<'config' | 'code'>('config'); // Nouvel état pour les onglets modal settings
  const [activeView, setActiveView] = useState<'editor' | 'gallery'>('editor'); // Nouvel état pour la navigation principale
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingList, setIsLoadingList] = useState(false);
  const [configError, setConfigError] = useState<string | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);

  // Charger l'URL du script depuis le localStorage
  useEffect(() => {
    const savedUrl = localStorage.getItem("google_script_url");
    if (savedUrl) {
      setScriptUrl(savedUrl);
      loadSavedCards(savedUrl);
    }
  }, []);

  const loadSavedCards = async (url: string) => {
    if (!url) return;
    setIsLoadingList(true);
    setConfigError(null);
    try {
      const cards = await fetchCardsFromSheet(url);
      setSavedCards(cards.reverse()); // Les plus récents en premier
    } catch (e: any) {
      console.error("Erreur chargement cartes", e);
      // Détection sommaire des erreurs de configuration/CORS
      if (e.message.includes("Failed to fetch") || e.message.includes("Erreur HTTP")) {
          setConfigError("Impossible de communiquer avec Google Script.");
      }
    } finally {
      setIsLoadingList(false);
    }
  };

  const handleScriptUrlSave = () => {
    localStorage.setItem("google_script_url", scriptUrl);
    setShowSettings(false);
    loadSavedCards(scriptUrl);
  };

  const handleSaveCard = async () => {
    setIsSaving(true);
    try {
      const result = await saveCardToSheet(scriptUrl, cardData);
      
      // Si le serveur a renvoyé une URL d'image valide (qui ressemble à une URL)
      // On met à jour l'état local pour utiliser l'URL stockée
      if (result.imageUrl && (result.imageUrl.startsWith('http') || result.imageUrl.startsWith('data:'))) {
          setCardData(prev => ({ ...prev, storedImageUrl: result.imageUrl, imageData: null }));
      } else {
         // Si l'URL renvoyée est vide ou invalide (ex: juste un nom de fichier), 
         // on GARDE l'image locale (imageData) pour ne pas casser l'affichage.
         if (result.imageUrl) {
             console.warn("URL invalide reçue du script (nom de fichier ?). Conservation de l'image locale.", result.imageUrl);
         }
      }
      
      // Rafraichir la liste
      await loadSavedCards(scriptUrl);
      alert("Carte sauvegardée avec succès !");
    } catch (e: any) {
      alert("Erreur lors de la sauvegarde : " + e.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleNewCard = () => {
    setCardData({ ...INITIAL_CARD_DATA, id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString() });
    setActiveView('editor'); // Switch to editor when creating new card
  };

  const handleImportCards = async (cards: CardData[]) => {
    if (!scriptUrl) {
      // If no script URL, just add to local state
      setSavedCards(prev => [...cards, ...prev]);
      return;
    }

    // Save each card to the sheet
    for (const card of cards) {
      try {
        const result = await saveCardToSheet(scriptUrl, card);
        // Update the card with the image URL if returned
        if (result.imageUrl && (result.imageUrl.startsWith('http') || result.imageUrl.startsWith('data:'))) {
          card.storedImageUrl = result.imageUrl;
        }
      } catch (e) {
        console.error('Erreur lors de la sauvegarde de la carte:', e);
        // Continue with other cards even if one fails
      }
    }

    // Refresh the saved cards list
    await loadSavedCards(scriptUrl);
  };

  const handleSelectCard = (card: CardData) => {
      setCardData(card);
      setActiveView('editor'); // Switch to editor when selecting a card
      // Scroll to top on mobile
      window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const copyToClipboard = (text: string) => {
      navigator.clipboard.writeText(text);
      alert("Code copié !");
  }

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
                  <p className="text-xs text-amber-200 opacity-80">Propulsé par Gemini Nano Banana</p>
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
              <a href="https://github.com/tidoe/MunchkinEditor" target="_blank" className="text-sm text-amber-300 hover:text-white underline hidden sm:inline">GitHub</a>
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
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                  activeView === 'gallery' ? 'bg-amber-600 text-white' : 'bg-amber-700 text-amber-100'
                }`}>
                  {savedCards.length}
                </span>
              )}
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
                    <button onClick={() => { setShowSettings(false); setConfigError(null); }} className="text-gray-400 hover:text-white text-2xl leading-none">&times;</button>
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
                  
                  <div className="p-6 overflow-y-auto">
                    {activeTab === 'config' ? (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm mb-2 text-amber-100 font-bold">URL de l'application Web (Google Apps Script)</label>
                                <div className="flex gap-2">
                                    <input 
                                        type="text" 
                                        value={scriptUrl}
                                        onChange={(e) => setScriptUrl(e.target.value)}
                                        placeholder="https://script.google.com/macros/s/..."
                                        className="flex-grow p-3 rounded bg-stone-900 border border-stone-600 text-amber-100 text-sm font-mono focus:border-amber-500 outline-none"
                                    />
                                    <button onClick={handleScriptUrlSave} className="bg-amber-600 px-6 py-2 rounded font-bold hover:bg-amber-500 text-white shadow-lg">
                                        Sauvegarder
                                    </button>
                                </div>
                            </div>

                            {configError && (
                                <div className="bg-red-900/40 border border-red-500/50 rounded p-4 text-sm text-red-100 space-y-2">
                                    <p className="font-bold flex items-center gap-2">⚠️ {configError}</p>
                                    <p>Vérifiez que votre déploiement est configuré ainsi :</p>
                                    <ul className="list-disc ml-5 space-y-1 text-amber-100/80 text-xs">
                                        <li>Exécuter en tant que : <strong>Moi</strong></li>
                                        <li>Qui a accès : <strong>Tout le monde</strong></li>
                                    </ul>
                                </div>
                            )}

                            <div className="bg-amber-900/20 border border-amber-500/30 rounded p-4 text-sm text-amber-100/80">
                                <p className="font-bold mb-2">Instructions rapides :</p>
                                <ol className="list-decimal ml-5 space-y-2 text-xs">
                                    <li>Copiez le code depuis l'onglet <strong>Code Script Google</strong>.</li>
                                    <li>Dans Google Apps Script, collez-le dans <code>Code.gs</code>.</li>
                                    <li>Cliquez sur <strong>Déployer &gt; Gérer les déploiements</strong>.</li>
                                    <li>Cliquez sur l'icône crayon (Modifier).</li>
                                    <li>Version : sélectionnez <strong>Nouvelle version</strong>.</li>
                                    <li>Cliquez sur <strong>Déployer</strong>.</li>
                                </ol>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4 h-full flex flex-col">
                            <div className="flex justify-between items-center">
                                <p className="text-sm text-amber-100/80">
                                    Ce code utilise maintenant votre <strong>premier onglet</strong> (quel que soit son nom) :
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
                                    className="w-full h-[400px] p-4 bg-transparent text-green-400 font-mono text-xs resize-none outline-none"
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

      {/* Main Content */}
      <main className="flex-grow">
        {activeView === 'editor' ? (
          /* Editor View */
          <div className="max-w-[1600px] mx-auto p-4 md:p-8 w-full">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* Left: Stats & Saved Cards (2 cols) */}
              <div className="lg:col-span-2 order-3 lg:order-1">
                 <div className="bg-amber-100 rounded-lg shadow border border-amber-200 overflow-hidden sticky top-32 max-h-[calc(100vh-160px)] flex flex-col">
                     
                     {/* Deck Statistics Panel */}
                     <div className="border-b border-amber-300 max-h-[40%] overflow-hidden flex flex-col shrink-0">
                        <DeckStats cards={savedCards} />
                     </div>

                     {/* Saved Cards List */}
                     <div className="flex flex-col flex-grow overflow-hidden">
                        <div className="bg-amber-800 text-amber-50 p-2 text-center text-sm font-bold uppercase tracking-wide shrink-0 flex items-center justify-between px-3">
                            <span>Cartes ({savedCards.length})</span>
                            <button 
                              onClick={() => setActiveView('gallery')}
                              className="text-xs bg-amber-700 hover:bg-amber-600 px-2 py-0.5 rounded transition-colors"
                              title="Voir toutes les cartes"
                            >
                              Voir tout →
                            </button>
                        </div>
                        <div className="overflow-y-auto p-2 space-y-2 flex-grow scrollbar-thin scrollbar-thumb-amber-600 bg-amber-50/50">
                            {isLoadingList ? (
                                <div className="text-center p-4 text-gray-500 text-xs">Chargement...</div>
                            ) : savedCards.length === 0 ? (
                                <div className="text-center p-4 text-gray-500 text-xs italic">
                                    {configError ? "Erreur de connexion." : "Aucune carte trouvée."}
                                </div>
                            ) : (
                                savedCards.map(c => (
                                    <button 
                                        key={c.id} 
                                        onClick={() => handleSelectCard(c)}
                                        className={`w-full text-left p-2 rounded text-xs border transition-all ${cardData.id === c.id ? 'bg-amber-200 border-amber-400 font-bold' : 'bg-white border-amber-100 hover:bg-amber-50'}`}
                                    >
                                        <div className="truncate">{c.title || "Sans Titre"}</div>
                                        <div className="text-[10px] text-gray-500 opacity-80">{c.type}</div>
                                    </button>
                                ))
                            )}
                        </div>
                     </div>
                 </div>
              </div>

              {/* Center: Preview (4 cols) */}
              <div className="lg:col-span-4 order-1 lg:order-2 lg:sticky lg:top-32">
                 <div className="bg-white rounded-lg shadow-xl overflow-hidden border-2 border-amber-900/10">
                    <div className="bg-gray-50 border-b p-2 text-center text-xs text-gray-500 font-mono uppercase">Aperçu de la Carte</div>
                    <CardPreview data={cardData} />
                 </div>
              </div>

              {/* Right: Editor (6 cols) */}
              <div className="lg:col-span-6 order-2 lg:order-3">
                <CardForm
                    cardData={cardData}
                    onChange={setCardData}
                    onSave={handleSaveCard}
                    onNew={handleNewCard}
                    onImport={() => setShowImportModal(true)}
                    isSaving={isSaving}
                    hasScriptUrl={!!scriptUrl}
                />
              </div>
            </div>
          </div>
        ) : (
          /* Gallery View */
          <CardGallery
            cards={savedCards}
            onSelectCard={handleSelectCard}
            onNewCard={handleNewCard}
            isLoading={isLoadingList}
            selectedCardId={cardData.id}
          />
        )}
      </main>
    </div>
  );
};

export default App;