import React, { useState } from 'react';
import { Wine, Utensils, IceCream, GlassWater, Layers } from 'lucide-react';
import { Language } from '../types/domain';
import { useApp } from '../context/AppContext';

export const LOGO_ASSET_PATH = '/assets/aistudio/Logo_monochrome___Le_Boi_Vement___049401ad.png';

const THEME_IMAGES: Record<string, string> = {
  grill:
    'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=900&q=80',
  culinary_art:
    'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=900&q=80',
  lounge_platter:
    'https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?auto=format&fit=crop&w=900&q=80',
  cocktail:
    'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=900&q=80',
  bottle_case:
    'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=900&q=80',
  cellar_gold:
    'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&w=900&q=80',
  glacier:
    'https://images.unsplash.com/photo-1563805042-7684c019e1cb?auto=format&fit=crop&w=900&q=80',
  lounge_arch:
    'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=900&q=80',
  gold_acoustic:
    'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=900&q=80',
};

export const BrandLogo: React.FC<{
  variant?: 'light-on-dark' | 'dark-on-light';
  className?: string;
  showTextFallback?: boolean;
}> = ({ variant = 'dark-on-light', className = 'h-12' }) => {
  const [imgError, setImgError] = useState(false);

  if (imgError) {
    return (
      <span
        className={`font-serif-display text-2xl font-bold tracking-wider uppercase whitespace-nowrap ${
          variant === 'light-on-dark' ? 'text-[#FAF7F2] keep-light-text' : 'text-[#1E1915]'
        }`}
      >
        LE BOIVEMENT
      </span>
    );
  }

  return (
    <div className="inline-flex items-center shrink-0">
      <img
        src={LOGO_ASSET_PATH}
        alt="Le Boivement — Snack - Bar - Lounge"
        referrerPolicy="no-referrer"
        onError={() => setImgError(true)}
        className={`${className} w-auto object-contain transition-all duration-300 ${
          variant === 'light-on-dark'
            ? 'invert brightness-200 contrast-200 mix-blend-screen'
            : 'mix-blend-multiply'
        }`}
      />
    </div>
  );
};

export const GraphicVisualSlot: React.FC<{
  theme: string;
  title: string;
  subtitle?: string;
  imageUrl?: string;
  isDemo?: boolean;
  lang?: Language;
  className?: string;
}> = ({ theme, title, subtitle, imageUrl, lang = 'fr', className = 'aspect-[4/3]' }) => {
  const { theme: colorMode } = useApp();
  const isLight = colorMode === 'light';
  const [imgFailed, setImgFailed] = useState(false);

  const resolvedImageUrl = imageUrl || THEME_IMAGES[theme];

  const renderIcon = () => {
    const iconColor = isLight ? 'text-[#91652E]' : 'text-[#D8B77B]';
    switch (theme) {
      case 'grill':
      case 'culinary_art':
        return <Utensils className={`w-6 h-6 ${iconColor} stroke-[1.5]`} />;
      case 'cocktail':
        return <GlassWater className={`w-6 h-6 ${iconColor} stroke-[1.5]`} />;
      case 'glacier':
        return <IceCream className={`w-6 h-6 ${iconColor} stroke-[1.5]`} />;
      case 'bottle_case':
      case 'cellar_gold':
        return <Wine className={`w-6 h-6 ${iconColor} stroke-[1.5]`} />;
      case 'lounge_platter':
        return <Layers className={`w-6 h-6 ${iconColor} stroke-[1.5]`} />;
      default:
        return <Wine className={`w-6 h-6 ${iconColor} stroke-[1.5]`} />;
    }
  };

  if (resolvedImageUrl && !imgFailed) {
    const isLogoShowcase = resolvedImageUrl.includes('Logo_monochrome');
    return (
      <div
        className={`relative overflow-hidden ${
          isLight ? 'bg-[#F4ECE0]' : 'bg-[#221E26]'
        } ${className}`}
      >
        <img
          src={resolvedImageUrl}
          alt={title}
          referrerPolicy="no-referrer"
          onError={() => setImgFailed(true)}
          className={`w-full h-full transition-transform duration-500 hover:scale-105 ${
            isLogoShowcase
              ? `object-contain p-8 ${
                  isLight ? 'mix-blend-multiply' : 'invert brightness-200 mix-blend-screen'
                }`
              : 'object-cover'
          }`}
        />
        {!isLogoShowcase && (
          <div className="keep-light-text absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#1E1915]/80 via-[#1E1915]/30 to-transparent p-4 flex items-end justify-between">
            <div>
              {subtitle && (
                <span className="keep-light-text inline-block px-2 py-0.5 rounded bg-[#91652E]/90 text-[10px] font-mono-tabular uppercase tracking-wider text-white mb-1">
                  {subtitle}
                </span>
              )}
              <p className="keep-light-text font-serif-display text-lg font-semibold text-white line-clamp-1">
                {title}
              </p>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className={`relative overflow-hidden flex flex-col justify-between p-6 border-b ${
        isLight
          ? 'bg-gradient-to-br from-[#FBF7F0] via-[#F3E6D3] to-[#E8D4B7] border-[#91652E]/15 text-[#1E1915]'
          : 'bg-gradient-to-br from-[#26212C] via-[#1D1922] to-[#16131A] border-[#D8B77B]/15 text-[#FAF7F2]'
      } ${className}`}
    >
      <div className="relative z-10 flex items-center justify-between">
        <span
          className={`text-[11px] tracking-widest uppercase font-semibold ${
            isLight ? 'text-[#91652E]' : 'text-[#D8B77B]'
          }`}
        >
          LE BOIVEMENT · YAOUNDÉ
        </span>
        {renderIcon()}
      </div>

      <div className="relative z-10 my-auto py-3">
        <p className="font-serif-display text-xl md:text-2xl font-semibold leading-snug line-clamp-2">
          {title}
        </p>
        {subtitle && (
          <p className={`text-xs mt-1 line-clamp-1 ${isLight ? 'text-[#655B50]' : 'text-[#B5AEA6]'}`}>
            {subtitle}
          </p>
        )}
      </div>

      <div
        className={`relative z-10 pt-2 border-t flex items-center justify-between text-[11px] ${
          isLight ? 'border-[#91652E]/15 text-[#655B50]' : 'border-white/10 text-[#B5AEA6]'
        }`}
      >
        <span>{lang === 'fr' ? 'Collection Signature' : 'Signature Collection'}</span>
        <span className={isLight ? 'text-[#91652E] font-medium' : 'text-[#D8B77B]'}>
          Chapelle Obili
        </span>
      </div>
    </div>
  );
};
