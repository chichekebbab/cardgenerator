import React from 'react';
import { useTranslation } from '../i18n/LanguageContext';

interface FooterProps {
  onOpenLegal: (tab: 'mentions' | 'privacy' | 'cgu') => void;
}

const Footer: React.FC<FooterProps> = ({ onOpenLegal }) => {
  const { t, language, setLanguage } = useTranslation();

  return (
    <footer className="bg-stone-200 text-stone-600 text-xs py-4 text-center border-t border-stone-300 mt-auto">
      <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-center md:justify-between items-center gap-2">
        <div>
          <p>
            © {new Date().getFullYear()} MunchkinCardGen - {t('footer.projectFan')}
          </p>
        </div>
        <div className="flex gap-4 items-center">
          <button
            onClick={() => onOpenLegal('mentions')}
            className="hover:text-amber-800 hover:underline transition-colors"
          >
            {t('footer.mentions')}
          </button>
          <button
            onClick={() => onOpenLegal('privacy')}
            className="hover:text-amber-800 hover:underline transition-colors"
          >
            {t('footer.privacy')}
          </button>
          <button
            onClick={() => onOpenLegal('cgu')}
            className="hover:text-amber-800 hover:underline transition-colors"
          >
            {t('footer.cgu')}
          </button>
          <div className="flex items-center gap-2 ml-4 border-l border-stone-400 pl-4">
            <button
              onClick={() => setLanguage('fr')}
              className={`transition-colors font-bold ${language === 'fr' ? 'text-amber-800' : 'text-stone-400 hover:text-stone-600'}`}
            >
              FR
            </button>
            <span>|</span>
            <button
              onClick={() => setLanguage('en')}
              className={`transition-colors font-bold ${language === 'en' ? 'text-amber-800' : 'text-stone-400 hover:text-stone-600'}`}
            >
              EN
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
