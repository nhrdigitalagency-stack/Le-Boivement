import React, { useState } from 'react';
import { Wine, Utensils, IceCream, GlassWater, Layers } from 'lucide-react';
import { Language } from '../types/domain';

export const LOGO_ASSET_PATH = '/assets/aistudio/Logo_monochrome___Le_Boi_Vement___049401ad.png';

export const BrandLogo: React.FC<{
  variant?: 'light-on-dark' | 'dark-on-light';
  className?: string;
  showTextFallback?: boolean;
}> = ({ variant = 'light-on-dark', className = 'h-12' }) => {
  const [imgError, setImgError] = useState(false);

  if (imgError) {
    return (
      <span
        className={`font-serif-display text-2xl font-bold tracking-wider uppercase whitespace-nowrap ${
          variant === 'light-on-dark' ? 'text-[#FAF7F2] keep-light-text' : 'text-[#101014]'
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
  const [imgFailed, setImgFailed] = useState(false);

  const renderIcon = () => {
    switch (theme) {
      case 'grill':
      case 'culinary_art':
        return <Utensils className="w-7 h-7 text-[#D8B77B]/85 stroke-[1.25]" />;
      case 'cocktail':
        return <GlassWater className="w-7 h-7 text-[#D8B77B]/85 stroke-[1.25]" />;
      case 'glacier':
        return <IceCream className="w-7 h-7 text-[#D8B77B]/85 stroke-[1.25]" />;
      case 'bottle_case':
      case 'cellar_gold':
        return <Wine className="w-7 h-7 text-[#D8B77B]/85 stroke-[1.25]" />;
      case 'lounge_platter':
        return <Layers className="w-7 h-7 text-[#D8B77B]/85 stroke-[1.25]" />;
      default:
        return <Wine className="w-7 h-7 text-[#D8B77B]/85 stroke-[1.25]" />;
    }
  };

  if (imageUrl && !imgFailed) {
    return (
      <div className={`keep-dark relative overflow-hidden bg-[#16161C] ${className}`}>
        <img
          src={imageUrl}
          alt={title}
          referrerPolicy="no-referrer"
          onError={() => setImgFailed(true)}
          className={`w-full h-full object-contain p-6 ${
            imageUrl.includes('Logo_monochrome') ? 'invert brightness-200 mix-blend-screen' : 'object-cover p-0'
          }`}
        />
      </div>
    );
  }

  return (
    <div
      className={`keep-dark relative overflow-hidden bg-gradient-to-br from-[#1C1C23] via-[#131318] to-[#101014] flex flex-col justify-between p-6 border-b border-white/5 ${className}`}
    >
      {/* Subtle geometric architectural lines */}
      <svg
        className="absolute inset-0 w-full h-full opacity-20 pointer-events-none"
        viewBox="0 0 400 300"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle cx="320" cy="60" r="110" stroke="#D8B77B" strokeWidth="0.75" />
        <circle cx="320" cy="60" r="70" stroke="#91652E" strokeWidth="0.5" strokeDasharray="3 3" />
        <line x1="0" y1="240" x2="400" y2="120" stroke="#D8B77B" strokeWidth="0.5" />
        <line x1="40" y1="0" x2="40" y2="300" stroke="#FAF7F2" strokeOpacity="0.15" strokeWidth="0.5" />
      </svg>

      <div className="relative z-10 flex items-center justify-between">
        <span className="text-[11px] tracking-widest uppercase text-[#D8B77B] font-medium">
          LE BOIVEMENT · YAOUNDÉ
        </span>
        {renderIcon()}
      </div>

      <div className="relative z-10 my-auto py-3">
        <p className="font-serif-display text-xl md:text-2xl text-[#FAF7F2] leading-snug line-clamp-2">
          {title}
        </p>
        {subtitle && (
          <p className="text-xs text-[#AAA6A1] mt-1 line-clamp-1">{subtitle}</p>
        )}
      </div>

      <div className="relative z-10 pt-2 border-t border-white/10 flex items-center justify-between text-[11px] text-[#AAA6A1]">
        <span>{lang === 'fr' ? 'Collection Signature' : 'Signature Collection'}</span>
        <span className="text-[#D8B77B]/80">Chapelle Obili</span>
      </div>
    </div>
  );
};
