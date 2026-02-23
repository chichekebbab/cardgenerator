import React, { useRef, useMemo } from 'react';
import { GlobalSettings, AVAILABLE_FONTS, INITIAL_CARD_DATA, CardData, CardType } from '../types';
import { useNotification } from './NotificationContext';
import CardPreview from './CardPreview';
import { useTranslation } from '../i18n/LanguageContext';

interface GlobalSettingsProps {
  settings: GlobalSettings;
  onChange: (settings: GlobalSettings) => void;
  onResetToDefaults: () => void;
}

const GlobalSettingsComponent: React.FC<GlobalSettingsProps> = ({
  settings,
  onChange,
  onResetToDefaults,
}) => {
  const { showNotification } = useNotification();
  const { t } = useTranslation();
  const donjonInputRef = useRef<HTMLInputElement>(null);
  const tresorInputRef = useRef<HTMLInputElement>(null);

  const DEMO_CARD: CardData = useMemo(
    () => ({
      id: 'demo-card',
      title: t('globalSettings.demoTitle'),
      type: CardType.MONSTER,
      layout: 'standard',
      level: 15,
      bonus: '+10',
      description: t('globalSettings.demoDesc'),
      badStuff: t('globalSettings.demoBadStuff'),
      gold: '3',
      imagePrePrompt: INITIAL_CARD_DATA.imagePrePrompt,
      imagePrompt: t('globalSettings.demoArtPrompt'),
      imageData: null,
      itemSlot: '',
      isBig: false,
      restrictions: '',
      levelsGained: 2,
      imageScale: 100,
      imageOffsetX: 0,
      imageOffsetY: 0,
      isBaseCard: false,
      isValidated: false,
      internalComment: '',
    }),
    [t],
  );

  const handleImageUpload = (type: 'Donjon' | 'Tresor', file: File) => {
    // Basic validation
    if (!file.type.startsWith('image/')) {
      showNotification(t('globalSettings.invalidFormat'), 'error');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showNotification(t('globalSettings.imageTooHeavy'), 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const ratio = img.width / img.height;
        const targetRatio = 56 / 88;
        const tolerance = 0.05; // 5% tolerance

        if (Math.abs(ratio - targetRatio) > tolerance) {
          showNotification(t('globalSettings.invalidRatio'), 'warning');
        }

        if (img.width < 560 || img.height < 880) {
          showNotification(t('globalSettings.lowResolution'), 'info');
        }

        const dataUrl = e.target?.result as string;
        if (type === 'Donjon') {
          onChange({ ...settings, customBackDonjon: dataUrl });
        } else {
          onChange({ ...settings, customBackTresor: dataUrl });
        }
        const translatedType =
          type === 'Donjon' ? t('globalSettings.dungeon') : t('globalSettings.treasures');
        showNotification(t('globalSettings.backUpdated', { type: translatedType }), 'success');
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleLayoutUpload = (key: keyof GlobalSettings, file: File, label: string) => {
    if (!file.type.startsWith('image/')) {
      showNotification(t('globalSettings.invalidFormat'), 'error');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showNotification(t('globalSettings.imageTooHeavy'), 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const ratio = img.width / img.height;
        const targetRatio = 56 / 88;
        const tolerance = 0.05;

        if (Math.abs(ratio - targetRatio) > tolerance) {
          showNotification(t('globalSettings.invalidRatio'), 'warning');
        }

        if (img.width < 560 || img.height < 880) {
          showNotification(t('globalSettings.lowResolution'), 'info');
        }

        const dataUrl = e.target?.result as string;
        onChange({ ...settings, [key]: dataUrl });
        showNotification(t('globalSettings.layoutUpdated', { label }), 'success');
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const resetBack = (type: 'Donjon' | 'Tresor') => {
    if (type === 'Donjon') {
      onChange({ ...settings, customBackDonjon: null });
    } else {
      onChange({ ...settings, customBackTresor: null });
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between border-b-2 border-amber-900/20 pb-4 gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-bold text-amber-900 flex items-center gap-2">
            <span>⚙️</span> {t('globalSettings.title')}
          </h2>
          <p className="text-amber-800/60 mt-1">{t('globalSettings.subtitle')}</p>
        </div>
        <button
          onClick={() => {
            if (confirm(t('globalSettings.confirmReset'))) {
              onResetToDefaults();
              showNotification(t('globalSettings.resetSuccess'), 'info');
            }
          }}
          className="text-sm font-bold text-red-700 bg-red-50 hover:bg-red-100 px-4 py-2 rounded-lg border border-red-200 transition-colors"
        >
          {t('globalSettings.resetAll')}
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* SETTINGS COLUMN */}
        <div className="flex-1 space-y-8">
          {/* 1. Card Backs */}
          <section className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden">
            <div className="bg-stone-50 px-6 py-4 border-b border-stone-200 flex items-center gap-3">
              <span className="text-2xl">🎴</span>
              <div>
                <h3 className="font-bold text-stone-800">{t('globalSettings.customBacks')}</h3>
                <p className="text-xs text-stone-500">{t('globalSettings.pdfExportHint')}</p>
              </div>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Donjon */}
              <div className="space-y-4 text-center">
                <h4 className="font-bold text-sm text-amber-900 uppercase tracking-wider">
                  {t('globalSettings.dungeon')}
                </h4>
                <div className="aspect-[56/88] w-40 mx-auto bg-stone-100 rounded-lg overflow-hidden shadow-inner border border-stone-200 relative group">
                  <img
                    src={settings.customBackDonjon || '/layouts/layout_back_donjon.png'}
                    alt="Donjon Back"
                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button
                      onClick={() => donjonInputRef.current?.click()}
                      className="bg-white p-2 rounded-full"
                    >
                      ✏️
                    </button>
                    {settings.customBackDonjon && (
                      <button
                        onClick={() => resetBack('Donjon')}
                        className="bg-red-500 text-white p-2 rounded-full"
                      >
                        🗑️
                      </button>
                    )}
                  </div>
                </div>
                <input
                  type="file"
                  ref={donjonInputRef}
                  className="hidden"
                  accept="image/*"
                  onChange={(e) =>
                    e.target.files?.[0] && handleImageUpload('Donjon', e.target.files[0])
                  }
                />
              </div>

              {/* Tresor */}
              <div className="space-y-4 text-center">
                <h4 className="font-bold text-sm text-yellow-700 uppercase tracking-wider">
                  {t('globalSettings.treasures')}
                </h4>
                <div className="aspect-[56/88] w-40 mx-auto bg-stone-100 rounded-lg overflow-hidden shadow-inner border border-stone-200 relative group">
                  <img
                    src={settings.customBackTresor || '/layouts/layout_back_tresors.png'}
                    alt="Tresor Back"
                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button
                      onClick={() => tresorInputRef.current?.click()}
                      className="bg-white p-2 rounded-full"
                    >
                      ✏️
                    </button>
                    {settings.customBackTresor && (
                      <button
                        onClick={() => resetBack('Tresor')}
                        className="bg-red-500 text-white p-2 rounded-full"
                      >
                        🗑️
                      </button>
                    )}
                  </div>
                </div>
                <input
                  type="file"
                  ref={tresorInputRef}
                  className="hidden"
                  accept="image/*"
                  onChange={(e) =>
                    e.target.files?.[0] && handleImageUpload('Tresor', e.target.files[0])
                  }
                />
              </div>
            </div>
          </section>

          {/* 1.5 Custom Layouts (Faces avant) */}
          <section className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden">
            <div className="bg-stone-50 px-6 py-4 border-b border-stone-200 flex items-center gap-3">
              <span className="text-2xl">🃏</span>
              <div>
                <h3 className="font-bold text-stone-800">{t('globalSettings.customLayouts')}</h3>
                <p className="text-xs text-stone-500">{t('globalSettings.customLayoutsDesc')}</p>
              </div>
            </div>
            <div className="p-6 grid grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                {
                  key: 'customLayoutMonstre',
                  filename: 'layout_monstre.png',
                  label: t('globalSettings.monster'),
                  color: 'text-red-800',
                },
                {
                  key: 'customLayoutClass',
                  filename: 'layout_class.png',
                  label: t('globalSettings.class'),
                  color: 'text-blue-800',
                },
                {
                  key: 'customLayoutRace',
                  filename: 'layout_race.png',
                  label: t('globalSettings.race'),
                  color: 'text-emerald-800',
                },
                {
                  key: 'customLayoutMalediction',
                  filename: 'layout_malediction.png',
                  label: t('globalSettings.curse'),
                  color: 'text-purple-800',
                },
                {
                  key: 'customLayoutEquipement',
                  filename: 'layout_equipement.png',
                  label: t('globalSettings.equipment'),
                  color: 'text-stone-800',
                },
                {
                  key: 'customLayoutItem',
                  filename: 'layout_item.png',
                  label: t('globalSettings.item'),
                  color: 'text-amber-800',
                },
                {
                  key: 'customLayoutLvlup',
                  filename: 'layout_lvlup.png',
                  label: t('globalSettings.levelUp'),
                  color: 'text-yellow-800',
                },
              ].map((layout) => (
                <div key={layout.key} className="space-y-4 text-center">
                  <h4
                    className={`font-bold text-xs uppercase tracking-wider ${layout.color} h-8 flex items-center justify-center text-center`}
                  >
                    {layout.label}
                  </h4>
                  <div className="aspect-[56/88] w-28 mx-auto bg-stone-100 rounded-lg overflow-hidden shadow-inner border border-stone-200 relative group">
                    <img
                      src={
                        (settings[layout.key as keyof GlobalSettings] as string) ||
                        `/layouts/${layout.filename}`
                      }
                      alt={layout.label}
                      className="w-full h-full object-cover transition-transform group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <label className="bg-white px-2 py-1 rounded-full cursor-pointer hover:bg-stone-200 transition-colors flex items-center justify-center">
                        <span className="text-sm">✏️</span>
                        <input
                          type="file"
                          className="hidden"
                          accept="image/*"
                          onChange={(e) =>
                            e.target.files?.[0] &&
                            handleLayoutUpload(
                              layout.key as keyof GlobalSettings,
                              e.target.files[0],
                              layout.label,
                            )
                          }
                        />
                      </label>
                      {settings[layout.key as keyof GlobalSettings] && (
                        <button
                          onClick={() => {
                            onChange({ ...settings, [layout.key]: null });
                            showNotification(
                              t('globalSettings.layoutReset', { label: layout.label }),
                              'info',
                            );
                          }}
                          className="bg-red-500 text-white px-2 py-1 flex items-center justify-center rounded-full hover:bg-red-600 transition-colors text-sm"
                        >
                          🗑️
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* 2. Fonts */}
          <section className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden">
            <div className="bg-stone-50 px-6 py-4 border-b border-stone-200 flex items-center gap-3">
              <span className="text-2xl">🔤</span>
              <div>
                <h3 className="font-bold text-stone-800">{t('globalSettings.fonts')}</h3>
                <p className="text-xs text-stone-500">{t('globalSettings.fontsDesc')}</p>
              </div>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-stone-600 uppercase">
                    {t('globalSettings.titles')}
                  </label>
                  <select
                    value={settings.fontTitle}
                    onChange={(e) => onChange({ ...settings, fontTitle: e.target.value })}
                    className="w-full p-2 rounded-lg border border-stone-200 text-sm"
                  >
                    {AVAILABLE_FONTS.map((f) => (
                      <option key={f} value={f}>
                        {f}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-stone-600 uppercase">
                    {t('globalSettings.description')}
                  </label>
                  <select
                    value={settings.fontDescription}
                    onChange={(e) => onChange({ ...settings, fontDescription: e.target.value })}
                    className="w-full p-2 rounded-lg border border-stone-200 text-sm"
                  >
                    {AVAILABLE_FONTS.map((f) => (
                      <option key={f} value={f}>
                        {f}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-stone-600 uppercase">
                  {t('globalSettings.meta')}
                </label>
                <select
                  value={settings.fontMeta}
                  onChange={(e) => onChange({ ...settings, fontMeta: e.target.value })}
                  className="w-full p-2 rounded-lg border border-stone-200 text-sm"
                >
                  {AVAILABLE_FONTS.map((f) => (
                    <option key={f} value={f}>
                      {f}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </section>

          {/* 3. Language */}
          <section className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden">
            <div className="bg-stone-50 px-6 py-4 border-b border-stone-200 flex items-center gap-3">
              <span className="text-2xl">🌍</span>
              <div>
                <h3 className="font-bold text-stone-800">{t('globalSettings.language')}</h3>
                <p className="text-xs text-stone-500">{t('globalSettings.languageDesc')}</p>
              </div>
            </div>
            <div className="p-6">
              <div className="flex gap-4">
                <button
                  onClick={() => onChange({ ...settings, language: 'fr' })}
                  className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-lg border-2 transition-all ${settings.language === 'fr' ? 'border-amber-600 bg-amber-50 text-amber-900' : 'border-stone-100 text-stone-400'}`}
                >
                  <span className="text-lg">🇫🇷</span>{' '}
                  <span className="font-bold">{t('globalSettings.french')}</span>
                </button>
                <button
                  onClick={() => onChange({ ...settings, language: 'en' })}
                  className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-lg border-2 transition-all ${settings.language === 'en' ? 'border-amber-600 bg-amber-50 text-amber-900' : 'border-stone-100 text-stone-400'}`}
                >
                  <span className="text-lg">🇬🇧</span>{' '}
                  <span className="font-bold">{t('globalSettings.english')}</span>
                </button>
              </div>
            </div>
          </section>

          {/* 4. Global Prompt */}
          <section className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden">
            <div className="bg-stone-50 px-6 py-4 border-b border-stone-200 flex items-center gap-3">
              <span className="text-2xl">✏️</span>
              <div>
                <h3 className="font-bold text-stone-800">{t('globalSettings.defaultPrompt')}</h3>
                <p className="text-xs text-stone-500">{t('globalSettings.defaultPromptDesc')}</p>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <textarea
                value={settings.defaultImagePrePrompt}
                onChange={(e) => onChange({ ...settings, defaultImagePrePrompt: e.target.value })}
                className="w-full h-24 p-3 text-sm rounded-lg border border-stone-200 outline-none resize-none"
                placeholder={t('globalSettings.promptPlaceholder')}
              />
              <button
                onClick={() => {
                  onChange({
                    ...settings,
                    defaultImagePrePrompt: INITIAL_CARD_DATA.imagePrePrompt,
                  });
                  showNotification(t('globalSettings.promptReset'), 'info');
                }}
                className="text-xs text-stone-500 underline flex ml-auto"
              >
                {t('globalSettings.reset')}
              </button>
            </div>
          </section>
        </div>

        {/* PREVIEW COLUMN (STICKY) */}
        <div className="w-full lg:w-[450px]">
          <div className="lg:sticky lg:top-8 space-y-4">
            <div className="bg-amber-900/5 rounded-2xl p-6 border-2 border-dashed border-amber-900/20">
              <h3 className="text-center font-bold text-amber-900 mb-4 uppercase text-sm tracking-widest">
                {t('globalSettings.livePreview')}
              </h3>
              <div className="scale-75 md:scale-90 origin-top flex justify-center">
                <CardPreview data={DEMO_CARD} globalSettings={settings} index={0} />
              </div>
              <p className="text-center text-[10px] text-amber-800/40 mt-4 italic font-medium px-4">
                {t('globalSettings.previewHint')}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="py-12 italic text-xs text-stone-400 text-center">
        {t('globalSettings.autoSave')}
      </div>
    </div>
  );
};

export default GlobalSettingsComponent;
