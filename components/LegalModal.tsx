import React, { useState } from 'react';

interface LegalModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialTab?: 'mentions' | 'privacy' | 'cgu';
}

const LegalModal: React.FC<LegalModalProps> = ({ isOpen, onClose, initialTab = 'mentions' }) => {
    const [activeTab, setActiveTab] = useState<'mentions' | 'privacy' | 'cgu'>(initialTab);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={onClose}>
            <div
                className="bg-stone-100 w-full max-w-3xl rounded-lg shadow-2xl border-2 border-amber-900/20 flex flex-col max-h-[90vh] overflow-hidden"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="bg-amber-900 text-amber-50 p-4 flex justify-between items-center shadow-md">
                    <h2 className="text-xl font-bold tracking-wider flex items-center gap-2">
                        <span>⚖️</span> Informations Légales
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-amber-200 hover:text-white text-2xl leading-none transition-colors w-8 h-8 flex items-center justify-center rounded hover:bg-amber-800"
                    >
                        &times;
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-stone-300 bg-stone-200">
                    <button
                        onClick={() => setActiveTab('mentions')}
                        className={`flex-1 py-3 px-4 font-bold text-sm transition-colors ${activeTab === 'mentions'
                            ? 'bg-stone-100 text-amber-900 border-t-2 border-t-amber-600'
                            : 'text-stone-600 hover:bg-stone-100/50 hover:text-amber-800'
                            }`}
                    >
                        Mentions Légales
                    </button>
                    <button
                        onClick={() => setActiveTab('privacy')}
                        className={`flex-1 py-3 px-4 font-bold text-sm transition-colors ${activeTab === 'privacy'
                            ? 'bg-stone-100 text-amber-900 border-t-2 border-t-amber-600'
                            : 'text-stone-600 hover:bg-stone-100/50 hover:text-amber-800'
                            }`}
                    >
                        Confidentialité
                    </button>
                    <button
                        onClick={() => setActiveTab('cgu')}
                        className={`flex-1 py-3 px-4 font-bold text-sm transition-colors ${activeTab === 'cgu'
                            ? 'bg-stone-100 text-amber-900 border-t-2 border-t-amber-600'
                            : 'text-stone-600 hover:bg-stone-100/50 hover:text-amber-800'
                            }`}
                    >
                        CGU
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto text-stone-800 flex-grow">
                    {activeTab === 'mentions' && (
                        <div className="space-y-4">
                            <h3 className="text-xl font-bold text-amber-800 border-b border-amber-200 pb-2">Mentions Légales</h3>

                            <div className="space-y-4 text-sm leading-relaxed">
                                <section>
                                    <h4 className="font-bold text-stone-900 mb-1">Édition du site</h4>
                                    <p>
                                        Ce site est un projet personnel réalisé à but non lucratif.
                                        <br />
                                        Développeur : <span className="italic">Elie Benaroch</span>
                                        <br />
                                        Code source : <a href="https://github.com/chichekebbab/cardgenerator" target="_blank" rel="noopener noreferrer" className="text-amber-700 hover:underline">Disponible sur GitHub</a>
                                    </p>
                                </section>

                                <section>
                                    <h4 className="font-bold text-stone-900 mb-1">Hébergement</h4>
                                    <p>
                                        Ce site est hébergé par Netlify.
                                        <br />
                                        Adresse : 610 22nd Street, Suite 315, San Francisco, CA 94107, USA.
                                        <br />
                                        Site web : <a href="https://www.netlify.com" target="_blank" rel="noopener noreferrer" className="text-amber-700 hover:underline">www.netlify.com</a>
                                    </p>
                                </section>

                                <section>
                                    <h4 className="font-bold text-stone-900 mb-1">Propriété intellectuelle</h4>
                                    <p>
                                        <strong>Munchkin</strong> est une marque déposée de Steve Jackson Games (SJG).
                                        Ce générateur de cartes est un outil de fan ("Fan Art") non officiel et n'est pas affilié, soutenu ou approuvé par Steve Jackson Games.
                                    </p>
                                    <p className="mt-2">
                                        Les droits des images et textes originaux du jeu Munchkin appartiennent à SJG.
                                        Les cartes créées avec cet outil sont sous la responsabilité de leurs créateurs.
                                        Pour plus d'informations, veuillez consulter la <a href="http://www.sjgames.com/general/online_policy.html" target="_blank" rel="noopener noreferrer" className="text-amber-700 hover:underline">politique en ligne de Steve Jackson Games</a>.
                                    </p>
                                </section>
                            </div>
                        </div>
                    )}

                    {activeTab === 'privacy' && (
                        <div className="space-y-4">
                            <h3 className="text-xl font-bold text-amber-800 border-b border-amber-200 pb-2">Politique de Confidentialité</h3>

                            <div className="space-y-4 text-sm leading-relaxed">
                                <section>
                                    <h4 className="font-bold text-stone-900 mb-1">Collecte des données</h4>
                                    <p>
                                        Ce site fonctionne majoritairement en <strong>local</strong> dans votre navigateur.
                                        Nous ne collectons aucune donnée personnelle sur nos serveurs.
                                    </p>
                                </section>

                                <section>
                                    <h4 className="font-bold text-stone-900 mb-1">Stockage des cartes</h4>
                                    <p>
                                        Les cartes que vous créez sont stockées :
                                        <ul className="list-disc ml-5 mt-1 space-y-1">
                                            <li>Soit <strong>temporairement</strong> dans la mémoire de votre navigateur.</li>
                                            <li>Soit sur <strong>votre propre compte Google Drive/Sheets</strong> si vous configurez le script de sauvegarde.</li>
                                        </ul>
                                        L'éditeur du site n'a aucun accès à vos données Google Sheets. L'échange se fait directement entre votre navigateur et votre compte Google.
                                    </p>
                                </section>

                                <section>
                                    <h4 className="font-bold text-stone-900 mb-1">Cookies et Stockage Local</h4>
                                    <p>
                                        Ce site utilise le "Local Storage" de votre navigateur pour sauvegarder vos préférences (comme l'URL de votre script Google ou votre thème).
                                        Aucun cookie tiers de traçage publicitaire n'est utilisé.
                                    </p>
                                </section>

                                <section>
                                    <h4 className="font-bold text-stone-900 mb-1">Services Tiers (API)</h4>
                                    <p>
                                        Si vous utilisez les fonctionnalités d'IA (génération d'images, suppression de fond), vos requêtes (prompts, images) sont envoyées respectivement à :
                                        <ul className="list-disc ml-5 mt-1 space-y-1">
                                            <li><strong>Google Gemini API</strong> pour la génération de texte/image.</li>
                                            <li><strong>remove.bg</strong> pour le détourage d'images.</li>
                                        </ul>
                                        Ces services sont soumis à leurs propres politiques de confidentialité.
                                    </p>
                                </section>
                            </div>
                        </div>
                    )}

                    {activeTab === 'cgu' && (
                        <div className="space-y-4">
                            <h3 className="text-xl font-bold text-amber-800 border-b border-amber-200 pb-2">Conditions Générales d'Utilisation (CGU)</h3>

                            <div className="space-y-4 text-sm leading-relaxed">
                                <section>
                                    <h4 className="font-bold text-stone-900 mb-1">Usage Personnel</h4>
                                    <p>
                                        Ce générateur est fourni gratuitement pour un usage <strong>strictement personnel et non commercial</strong>.
                                        Vous ne devez pas vendre les cartes générées avec cet outil si elles utilisent des éléments protégés par le droit d'auteur.
                                    </p>
                                </section>

                                <section>
                                    <h4 className="font-bold text-stone-900 mb-1">Responsabilité</h4>
                                    <p>
                                        Le site est fourni "tel quel", sans garantie d'aucune sorte.
                                        L'éditeur ne saurait être tenu responsable des pertes de données (cartes non sauvegardées) ou des dysfonctionnements liés aux services tiers (Google, remove.bg).
                                    </p>
                                </section>

                                <section>
                                    <h4 className="font-bold text-stone-900 mb-1">Comportement</h4>
                                    <p>
                                        En utilisant les fonctionnalités d'IA générative, vous vous engagez à ne pas générer de contenu illégal, haineux, ou violant les droits d'autrui.
                                    </p>
                                </section>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="bg-stone-200 p-4 border-t border-stone-300 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-amber-800 hover:bg-amber-700 text-amber-50 font-bold rounded shadow-sm transition-colors"
                    >
                        Fermer
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LegalModal;
