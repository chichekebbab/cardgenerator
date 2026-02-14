import React, { forwardRef } from 'react';
import { CardData, CardType } from '../types';
import { formatBonus } from '../utils/layoutUtils';
import { formatGoldDisplay } from '../utils/goldFormatter';

interface ExportCardRendererProps {
    data: CardData;
    layoutSrc: string;
    descriptionFontSize?: number;
}

// Dimensions natives des layouts
const REF_WIDTH = 661;
const REF_HEIGHT = 1028;

const ExportCardRenderer = forwardRef<HTMLDivElement, ExportCardRendererProps>(({ data, layoutSrc, descriptionFontSize = 26 }, ref) => {

    // --- HELPERS ---
    const getDiamondInfo = () => {
        switch (data.type) {
            case CardType.MONSTER:
                return { value: data.level };
            case CardType.ITEM:
            case CardType.LEVEL_UP:
            case CardType.FAITHFUL_SERVANT:
            case CardType.DUNGEON_TRAP:
            case CardType.DUNGEON_BONUS:
            case CardType.TREASURE_TRAP:
                return { value: formatBonus(data.bonus) };
            default:
                return { value: '' };
        }
    };

    const diamond = getDiamondInfo();

    // --- GESTION IMAGE ---
    let imageSrc = undefined;
    if (data.imageData) {
        imageSrc = `data:image/png;base64,${data.imageData}`;
    } else if (data.storedImageUrl) {
        const url = data.storedImageUrl.trim();
        const idMatch = url.match(/\/d\/([a-zA-Z0-9_-]+)|[?&]id=([a-zA-Z0-9_-]+)/);
        if (idMatch) {
            const id = idMatch[1] || idMatch[2];
            imageSrc = `https://lh3.googleusercontent.com/d/${id}`;
        } else if (url.startsWith('http') || url.startsWith('data:')) {
            imageSrc = url;
        }
    }

    return (
        <div
            ref={ref}
            className="relative overflow-hidden bg-[#100c08]"
            style={{
                width: `${REF_WIDTH}px`,
                height: `${REF_HEIGHT}px`,
                borderRadius: '20px'
            }}
        >
            {/* FOND PARCHEMIN */}
            <div className="absolute inset-0 z-0 bg-parchment-body" />

            {/* IMAGE DE FOND (LAYOUT) */}
            {layoutSrc && (
                <div className="absolute inset-0 z-[1]">
                    <img
                        src={layoutSrc}
                        alt="Background"
                        className="w-full h-full object-cover"
                        crossOrigin="anonymous"
                    />
                </div>
            )}

            {/* CONTENU */}
            <div className="absolute inset-0 z-[10]">
                {/* 1. DIAMANTS (Niveau / Bonus) - Positionnés sur 108;119 et 550;119 */}
                {diamond.value && (
                    <>
                        <div className="absolute pointer-events-none z-30"
                            style={{ left: '108px', top: '119px' }}>
                            <span className="font-munchkin-title font-bold text-white text-shadow-strong leading-none block transform -translate-x-1/2 -translate-y-1/2"
                                style={{ fontSize: '2.8rem' }}>
                                {diamond.value}
                            </span>
                        </div>
                        <div className="absolute pointer-events-none z-30"
                            style={{ left: '550px', top: '119px' }}>
                            <span className="font-munchkin-title font-bold text-white text-shadow-strong leading-none block transform -translate-x-1/2 -translate-y-1/2"
                                style={{ fontSize: '2.8rem' }}>
                                {diamond.value}
                            </span>
                        </div>
                    </>
                )}

                {/* 2. TITRE - Centré sur Y=133, entre X=169 et X=488 */}
                <div className="absolute z-30 text-center transform -translate-y-1/2"
                    style={{
                        left: '169px',
                        top: `${data.type === CardType.CLASS || data.type === CardType.RACE ? 133 + 25 : 133}px`,
                        width: '319px'
                    }}>
                    <h2 className="font-munchkin-title font-bold uppercase tracking-wide text-[#5C1B15] leading-[1.15] break-words"
                        style={{ fontSize: '2.2rem' }}>
                        {data.title}
                    </h2>
                </div>

                {/* 3. DESCRIPTION */}
                {((data.description && data.description.trim() !== '') ||
                    (data.restrictions && data.restrictions.trim() !== '') ||
                    (data.type === CardType.MONSTER && data.badStuff && data.badStuff.trim() !== '')) && (
                        <div className="absolute z-30"
                            style={{
                                left: '60px',
                                top: '229px',
                                width: '541px',
                                maxHeight: `${325 * ((data.descriptionBoxScale || 100) / 100) * 2}px`,
                                overflow: 'hidden',
                                backgroundImage: 'url(/texture/texture_description.png)',
                                backgroundSize: 'cover',
                                backgroundPosition: 'center',
                                borderRadius: '8px',
                                border: '4px solid #5a4a3a',
                                boxShadow: '0 4px 8px rgba(0, 0, 0, 0.5), inset 0 2px 0 rgba(255, 255, 255, 0.15), inset 0 -2px 0 rgba(0, 0, 0, 0.2)'
                            }}>
                            {/* Overlay vignette */}
                            <div className="absolute inset-0 pointer-events-none rounded-[4px]"
                                style={{
                                    background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0, 0, 0, 0.35) 100%)'
                                }}
                            />
                            <div className="relative w-full text-center font-munchkin-body font-medium text-black p-4"
                                style={{ fontSize: `${descriptionFontSize}px`, lineHeight: '1.2' }}>
                                {data.restrictions && (
                                    <div className="font-bold uppercase mb-2">{data.restrictions}</div>
                                )}
                                {data.description && data.description.trim() !== '' && <p style={{ margin: 0 }}>{data.description}</p>}

                                {(data.type === CardType.MONSTER && data.badStuff) && (
                                    <div className="mt-3 text-left border-t-2 border-black/20 pt-2" style={{ width: '100%' }}>
                                        <span className="font-bold">Incident Fâcheux : </span>
                                        <span className="italic">{data.badStuff}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                {/* 4. IMAGE ART - Zone: 60;510 -> 541px large, 400px haut */}
                <div className="absolute z-20 flex items-center justify-center overflow-visible"
                    style={{
                        left: '60px',
                        top: '510px',
                        width: '541px',
                        height: '400px'
                    }}>
                    {imageSrc && (
                        <img
                            src={imageSrc}
                            alt="Art"
                            crossOrigin="anonymous"
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-contain mix-blend-multiply transition-transform duration-200"
                            style={{
                                transform: `scale(${((data.imageScale || 100) / 100) * 1.3}) translate(${data.imageOffsetX || 0}%, ${data.imageOffsetY || 0}%)`
                            }}
                        />
                    )}
                </div>

                {/* 5. FOOTER GAUCHE - 90;914 */}
                <div className="absolute z-30 flex flex-col items-start"
                    style={{ left: '90px', top: '902px' }}>
                    {data.type === CardType.MONSTER && data.levelsGained && data.levelsGained !== 1 && (
                        <span className="font-medieval font-bold text-[#682A22] whitespace-nowrap"
                            style={{ fontSize: '1.8rem' }}>
                            {data.levelsGained} niveaux
                        </span>
                    )}
                    {data.type === CardType.ITEM && (
                        <div className="relative">
                            {data.isBig && (
                                <span className="font-medieval font-bold text-[#682A22] whitespace-nowrap absolute bottom-full left-0 mb-[-0.2rem]"
                                    style={{ fontSize: '1.8rem' }}>
                                    Gros
                                </span>
                            )}
                            {data.itemSlot === 'Amélioration de Monture' ? (
                                <>
                                    <span className="font-medieval font-bold text-[#682A22] whitespace-nowrap absolute bottom-full left-0 mb-[-0.2rem]"
                                        style={{ fontSize: '1.8rem' }}>
                                        Amélioration
                                    </span>
                                    <span className="font-medieval font-bold text-[#682A22] whitespace-nowrap block"
                                        style={{ fontSize: '1.8rem' }}>
                                        de Monture
                                    </span>
                                </>
                            ) : (
                                data.itemSlot && data.itemSlot !== 'NoSlot' && data.itemSlot !== 'Amélioration' ? (
                                    <span className="font-medieval font-bold text-[#682A22] whitespace-nowrap block"
                                        style={{ fontSize: data.itemSlot.length > 15 ? '1.4rem' : '1.8rem' }}>
                                        {data.itemSlot}
                                    </span>
                                ) : <div style={{ height: '1.8rem' }} />
                            )}
                        </div>
                    )}
                </div>

                {/* FOOTER DROIT : Trésor / Or - Type-specific display */}
                {(() => {
                    const formattedGold = formatGoldDisplay(data.type, data.gold);

                    // Don't display if formatGoldDisplay returns null (Curse, Race, Class, Level_Up, Faithful_Servant)
                    // Also don't display for Item with Amélioration slot
                    if (!formattedGold || (data.type === CardType.ITEM && data.itemSlot === 'Amélioration')) {
                        return null;
                    }

                    // Adjust position based on card type
                    // Monsters: more to the right (420px instead of 390px)
                    // Items: keep at 390px to avoid overflow with "pièces d'or"
                    const leftPosition = data.type === CardType.MONSTER ? '420px' : '390px';

                    return (
                        <div className="absolute z-30"
                            style={{ left: leftPosition, top: '902px' }}>
                            <span className="font-medieval font-bold text-[#682A22] whitespace-nowrap block"
                                style={{ fontSize: '1.8rem' }}>
                                {formattedGold}
                            </span>
                        </div>
                    );
                })()}
            </div>
        </div>
    );
});

ExportCardRenderer.displayName = 'ExportCardRenderer';

export default ExportCardRenderer;
