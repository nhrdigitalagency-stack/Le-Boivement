import React, { useEffect } from 'react';
import { Sun, Moon } from 'lucide-react';
import { useApp } from '../context/AppContext';

const THEME_STORAGE_KEY = 'le_boivement_theme';

export const ThemeToggle: React.FC<{ className?: string; showLabel?: boolean }> = ({
  className = '',
  showLabel = true,
}) => {
  const { theme, setTheme, lang } = useApp();
  const isLight = theme === 'light';

  useEffect(() => {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // ignore storage errors
    }
  }, [theme]);

  const handleToggle = () => {
    const nextTheme = isLight ? 'dark' : 'light';
    try {
      localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
    } catch {
      // ignore storage errors
    }
    setTheme(nextTheme);
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      role="switch"
      aria-checked={!isLight}
      title={
        isLight
          ? lang === 'fr'
            ? 'Passer en mode sombre'
            : 'Switch to dark mode'
          : lang === 'fr'
          ? 'Passer en mode clair'
          : 'Switch to light mode'
      }
      aria-label={
        isLight
          ? lang === 'fr'
            ? 'Activer le mode sombre'
            : 'Enable dark mode'
          : lang === 'fr'
          ? 'Activer le mode clair'
          : 'Enable light mode'
      }
      className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-md border transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-[#D8B77B] ${
        isLight
          ? 'bg-[#F4ECE0] text-[#1E1915] border-[#91652E]/35 hover:bg-[#EADBC6] hover:border-[#91652E]'
          : 'bg-[#242029] text-[#FAF7F2] border-[#D8B77B]/40 hover:bg-[#2F2A36] hover:border-[#D8B77B]'
      } ${className}`}
    >
      {isLight ? (
        <>
          <Sun className="w-3.5 h-3.5 text-[#91652E] shrink-0" />
          {showLabel && (
            <span className="hidden sm:inline text-[#1E1915]">
              {lang === 'fr' ? 'Clair' : 'Light'}
            </span>
          )}
        </>
      ) : (
        <>
          <Moon className="w-3.5 h-3.5 text-[#D8B77B] shrink-0" />
          {showLabel && (
            <span className="hidden sm:inline text-[#FAF7F2]">
              {lang === 'fr' ? 'Sombre' : 'Dark'}
            </span>
          )}
        </>
      )}
    </button>
  );
};
