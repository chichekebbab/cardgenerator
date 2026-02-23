import React, { useState } from 'react';
import { useTranslation } from '../i18n/LanguageContext';

interface LegalModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'mentions' | 'privacy' | 'cgu';
}

const LegalModal: React.FC<LegalModalProps> = ({ isOpen, onClose, initialTab = 'mentions' }) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'mentions' | 'privacy' | 'cgu'>(initialTab);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-stone-100 w-full max-w-3xl rounded-lg shadow-2xl border-2 border-amber-900/20 flex flex-col max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-amber-900 text-amber-50 p-4 flex justify-between items-center shadow-md">
          <h2 className="text-xl font-bold tracking-wider flex items-center gap-2">
            <span>⚖️</span> {t('legalModal.title')}
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
            className={`flex-1 py-3 px-4 font-bold text-sm transition-colors ${
              activeTab === 'mentions'
                ? 'bg-stone-100 text-amber-900 border-t-2 border-t-amber-600'
                : 'text-stone-600 hover:bg-stone-100/50 hover:text-amber-800'
            }`}
          >
            {t('legalModal.tabMentions')}
          </button>
          <button
            onClick={() => setActiveTab('privacy')}
            className={`flex-1 py-3 px-4 font-bold text-sm transition-colors ${
              activeTab === 'privacy'
                ? 'bg-stone-100 text-amber-900 border-t-2 border-t-amber-600'
                : 'text-stone-600 hover:bg-stone-100/50 hover:text-amber-800'
            }`}
          >
            {t('legalModal.tabPrivacy')}
          </button>
          <button
            onClick={() => setActiveTab('cgu')}
            className={`flex-1 py-3 px-4 font-bold text-sm transition-colors ${
              activeTab === 'cgu'
                ? 'bg-stone-100 text-amber-900 border-t-2 border-t-amber-600'
                : 'text-stone-600 hover:bg-stone-100/50 hover:text-amber-800'
            }`}
          >
            {t('legalModal.tabCGU')}
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto text-stone-800 flex-grow">
          {activeTab === 'mentions' && (
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-amber-800 border-b border-amber-200 pb-2">
                {t('legalModal.mentions.title')}
              </h3>

              <div className="space-y-4 text-sm leading-relaxed">
                <section>
                  <h4 className="font-bold text-stone-900 mb-1">
                    {t('legalModal.mentions.siteEdition')}
                  </h4>
                  <p>
                    {t('legalModal.mentions.personalProject')}
                    <br />
                    {t('legalModal.mentions.developer')} :{' '}
                    <span className="italic">Elie Benaroch</span>
                    <br />
                    {t('legalModal.mentions.sourceCode')} :{' '}
                    <a
                      href="https://github.com/chichekebbab/cardgenerator"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-amber-700 hover:underline"
                    >
                      {t('legalModal.mentions.availableOnGithub')}
                    </a>
                  </p>
                </section>

                <section>
                  <h4 className="font-bold text-stone-900 mb-1">
                    {t('legalModal.mentions.hosting')}
                  </h4>
                  <p>
                    {t('legalModal.mentions.hostedBy')}
                    <br />
                    {t('legalModal.mentions.address')} : 610 22nd Street, Suite 315, San Francisco,
                    CA 94107, USA.
                    <br />
                    {t('legalModal.mentions.website')} :{' '}
                    <a
                      href="https://www.netlify.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-amber-700 hover:underline"
                    >
                      www.netlify.com
                    </a>
                  </p>
                </section>

                <section>
                  <h4 className="font-bold text-stone-900 mb-1">
                    {t('legalModal.mentions.intellectualProperty')}
                  </h4>
                  <p>{t('legalModal.mentions.munchkinTrademark')}</p>
                  <p className="mt-2">{t('legalModal.mentions.rightsInfo')}</p>
                </section>
              </div>
            </div>
          )}

          {activeTab === 'privacy' && (
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-amber-800 border-b border-amber-200 pb-2">
                {t('legalModal.privacy.title')}
              </h3>

              <div className="space-y-4 text-sm leading-relaxed">
                <section>
                  <h4 className="font-bold text-stone-900 mb-1">
                    {t('legalModal.privacy.dataCollection')}
                  </h4>
                  <p>{t('legalModal.privacy.dataCollectionContent')}</p>
                </section>

                <section>
                  <h4 className="font-bold text-stone-900 mb-1">
                    {t('legalModal.privacy.cardStorage')}
                  </h4>
                  <p>
                    {t('legalModal.privacy.cardStorageContent')}
                    <ul className="list-disc ml-5 mt-1 space-y-1">
                      <li>{t('legalModal.privacy.pointBrowser')}</li>
                      <li>{t('legalModal.privacy.pointGoogle')}</li>
                    </ul>
                    {t('legalModal.privacy.googleSheetsHint')}
                  </p>
                </section>

                <section>
                  <h4 className="font-bold text-stone-900 mb-1">
                    {t('legalModal.privacy.cookies')}
                  </h4>
                  <p>{t('legalModal.privacy.cookiesContent')}</p>
                </section>

                <section>
                  <h4 className="font-bold text-stone-900 mb-1">
                    {t('legalModal.privacy.thirdParty')}
                  </h4>
                  <p>
                    {t('legalModal.privacy.thirdPartyContent')}
                    <ul className="list-disc ml-5 mt-1 space-y-1">
                      <li>{t('legalModal.privacy.pointGemini')}</li>
                      <li>{t('legalModal.privacy.pointRemoveBg')}</li>
                    </ul>
                    {t('legalModal.privacy.apiHint')}
                  </p>
                </section>
              </div>
            </div>
          )}

          {activeTab === 'cgu' && (
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-amber-800 border-b border-amber-200 pb-2">
                {t('legalModal.cgu.title')}
              </h3>

              <div className="space-y-4 text-sm leading-relaxed">
                <section>
                  <h4 className="font-bold text-stone-900 mb-1">
                    {t('legalModal.cgu.personalUsage')}
                  </h4>
                  <p>{t('legalModal.cgu.personalUsageContent')}</p>
                </section>

                <section>
                  <h4 className="font-bold text-stone-900 mb-1">
                    {t('legalModal.cgu.responsibility')}
                  </h4>
                  <p>{t('legalModal.cgu.responsibilityContent')}</p>
                </section>

                <section>
                  <h4 className="font-bold text-stone-900 mb-1">{t('legalModal.cgu.behavior')}</h4>
                  <p>{t('legalModal.cgu.behaviorContent')}</p>
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
            {t('legalModal.close')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LegalModal;
