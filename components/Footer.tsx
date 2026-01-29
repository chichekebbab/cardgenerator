import React from 'react';

interface FooterProps {
    onOpenLegal: (tab: 'mentions' | 'privacy' | 'cgu') => void;
}

const Footer: React.FC<FooterProps> = ({ onOpenLegal }) => {
    return (
        <footer className="bg-stone-200 text-stone-600 text-xs py-4 text-center border-t border-stone-300 mt-auto">
            <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-center md:justify-between items-center gap-2">
                <div>
                    <p>© {new Date().getFullYear()} MunchkinCardGen - Projet Fan Non Officiel</p>
                </div>
                <div className="flex gap-4">
                    <button onClick={() => onOpenLegal('mentions')} className="hover:text-amber-800 hover:underline transition-colors">
                        Mentions Légales
                    </button>
                    <button onClick={() => onOpenLegal('privacy')} className="hover:text-amber-800 hover:underline transition-colors">
                        Confidentialité
                    </button>
                    <button onClick={() => onOpenLegal('cgu')} className="hover:text-amber-800 hover:underline transition-colors">
                        CGU
                    </button>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
