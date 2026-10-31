import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  ShoppingBag,
  User,
  Menu,
  X,
  ShieldCheck,
  AlertTriangle,
  Globe,
  Calendar,
  ArrowRight,
  Sun,
  Moon,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { translations, formatXaf } from '../i18n/translations';
import { BrandLogo } from './VisualComposition';

export const Header: React.FC = () => {
  const {
    lang,
    setLang,
    theme,
    toggleTheme,
    pathname,
    navigate,
    settings,
    cartCount,
    cartToast,
    authUser,
    products,
    backendOnline,
  } = useApp();

  const t = translations[lang];
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [quickQuery, setQuickQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 36);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMobileMenuOpen(false);
        setSearchModalOpen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  useEffect(() => {
    if (searchModalOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 60);
    }
  }, [searchModalOpen]);

  const isHeroTransparent = pathname === '/' && !scrolled && !mobileMenuOpen;
  const logoVariant = theme === 'light' && !isHeroTransparent ? 'dark-on-light' : 'light-on-dark';

  const navItems = [
    { href: '/', label: t.nav.home },
    { href: '/carte', label: t.nav.menu },
    { href: '/boutique', label: t.nav.shop },
    { href: '/experience', label: t.nav.experience },
    { href: '/evenements', label: t.nav.events },
    { href: '/galerie', label: t.nav.gallery },
    { href: '/contact', label: t.nav.contact },
  ];

  const handleQuickSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchModalOpen(false);
    navigate(`/boutique?q=${encodeURIComponent(quickQuery.trim())}`);
  };

  const quickResults = quickQuery.trim()
    ? products
        .filter((p) => {
          const q = quickQuery.toLowerCase();
          return (
            p.nameFr.toLowerCase().includes(q) ||
            p.nameEn.toLowerCase().includes(q) ||
            p.publicRef.toLowerCase().includes(q)
          );
        })
        .slice(0, 4)
    : [];

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-40 transition-colors duration-200 ${
          isHeroTransparent
            ? 'keep-dark bg-gradient-to-b from-[#101014]/90 via-[#101014]/60 to-transparent border-b border-white/10'
            : theme === 'light'
            ? 'bg-[#FAF7F2]/95 backdrop-blur-md border-b border-[#101014]/10 shadow-sm'
            : 'bg-[#101014]/95 backdrop-blur-md border-b border-white/10 shadow-lg'
        }`}
      >
        <div className="max-w-[1380px] mx-auto px-3 sm:px-6 lg:px-8 h-18 sm:h-20 flex items-center justify-between gap-2 sm:gap-5">
          {/* Zone 1: Brand Wordmark / Logo */}
          <button
            type="button"
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-left focus-visible:outline-2 focus-visible:outline-[#D8B77B] shrink-0"
            aria-label="Le Boivement — Accueil"
          >
            <BrandLogo variant={logoVariant} className="h-9 sm:h-11 md:h-12" />
          </button>

          {/* Zone 2: Primary Navigation Links */}
          <nav
            aria-label="Navigation principale"
            className="hidden lg:flex items-center gap-5 xl:gap-6 text-sm font-medium text-[#FAF7F2]/85"
          >
            {navItems.map((item) => {
              const active =
                item.href === '/'
                  ? pathname === '/'
                  : pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <button
                  key={item.href}
                  type="button"
                  onClick={() => navigate(item.href)}
                  className={`py-1 whitespace-nowrap shrink-0 transition-colors border-b-2 ${
                    active
                      ? 'text-[#D8B77B] border-[#D8B77B] font-semibold'
                      : 'border-transparent hover:text-[#FAF7F2] hover:border-current/30'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: Interactive Actions (Search, Theme Toggle, Lang, Account, Cart, Reserve) */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => setSearchModalOpen(true)}
              className="p-2 sm:p-2.5 text-[#FAF7F2]/85 hover:text-[#D8B77B] transition-colors rounded-lg focus-visible:outline-2 focus-visible:outline-[#D8B77B]"
              aria-label={t.nav.searchPlaceholder}
            >
              <Search className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

            {/* Light / Dark Mode Switcher (Default: Light Mode) */}
            <button
              type="button"
              onClick={toggleTheme}
              title={
                theme === 'light'
                  ? lang === 'fr'
                    ? 'Passer en mode sombre'
                    : 'Switch to dark mode'
                  : lang === 'fr'
                  ? 'Passer en mode clair'
                  : 'Switch to light mode'
              }
              aria-label={
                theme === 'light'
                  ? lang === 'fr'
                    ? 'Activer le mode sombre'
                    : 'Enable dark mode'
                  : lang === 'fr'
                  ? 'Activer le mode clair'
                  : 'Enable light mode'
              }
              className="px-2 sm:px-2.5 py-1.5 text-xs font-medium text-[#FAF7F2]/90 hover:text-[#D8B77B] border border-white/15 rounded-md transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5"
            >
              {theme === 'light' ? (
                <>
                  <Moon className="w-3.5 h-3.5 text-[#91652E]" />
                  <span className="hidden md:inline">
                    {lang === 'fr' ? 'Sombre' : 'Dark'}
                  </span>
                </>
              ) : (
                <>
                  <Sun className="w-3.5 h-3.5 text-[#D8B77B]" />
                  <span className="hidden md:inline">
                    {lang === 'fr' ? 'Clair' : 'Light'}
                  </span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => setLang(lang === 'fr' ? 'en' : 'fr')}
              className="px-2 sm:px-2.5 py-1.5 text-xs font-medium text-[#FAF7F2]/90 hover:text-[#D8B77B] border border-white/15 rounded-md transition-colors whitespace-nowrap shrink-0 flex items-center gap-1"
              aria-label="Changer de langue / Switch language"
            >
              <Globe className="w-3.5 h-3.5 text-[#D8B77B]" />
              <span>{lang.toUpperCase()}</span>
            </button>

            <button
              type="button"
              onClick={() =>
                navigate(authUser?.type === 'staff' ? '/admin' : authUser ? '/mon-compte' : '/connexion')
              }
              className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-2 text-xs font-medium text-[#FAF7F2]/85 hover:text-[#D8B77B] transition-colors whitespace-nowrap shrink-0"
              aria-label={t.nav.account}
            >
              <User className="w-4 h-4" />
              <span className="max-w-[100px] truncate">
                {authUser ? authUser.fullName.split(' ')[0] : t.nav.login}
              </span>
            </button>

            <button
              type="button"
              onClick={() => navigate('/panier')}
              className="relative p-2 sm:p-2.5 text-[#FAF7F2] hover:text-[#D8B77B] transition-colors rounded-lg focus-visible:outline-2 focus-visible:outline-[#D8B77B]"
              aria-label={`${t.nav.cart} (${cartCount})`}
            >
              <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5" />
              {cartCount > 0 && (
                <span className="keep-light-text absolute -top-0.5 -right-0.5 min-w-[19px] h-5 px-1 bg-[#D8B77B] text-[#101014] font-mono-tabular text-[11px] font-semibold rounded-full flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </button>

            {settings.reservationsEnabled && (
              <button
                type="button"
                onClick={() => navigate('/reservation')}
                className="hidden md:inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold bg-[#D8B77B] text-[#101014] hover:bg-[#e3c68f] transition-colors rounded-md whitespace-nowrap shrink-0"
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>{t.nav.reserve}</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => navigate('/admin')}
              className="hidden xl:inline-flex items-center gap-1 px-3 py-2 text-xs font-medium text-[#AAA6A1] hover:text-[#FAF7F2] border border-white/10 rounded-md transition-colors whitespace-nowrap shrink-0"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-[#D8B77B]" />
              <span>{t.nav.admin}</span>
            </button>

            {/* Mobile Hamburger Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen((v) => !v)}
              className="lg:hidden p-2 text-[#FAF7F2] hover:text-[#D8B77B] rounded-lg focus-visible:outline-2 focus-visible:outline-[#D8B77B]"
              aria-expanded={mobileMenuOpen}
              aria-label="Menu principal"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Backend Offline Warning */}
        {!backendOnline && (
          <div className="bg-red-950/95 border-t border-red-700/50 px-4 py-2 text-center text-xs text-red-100 flex items-center justify-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{t.badges.backendOffline}</span>
          </div>
        )}
      </header>

      {/* Visual Cart Feedback Toast */}
      {cartToast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-4 right-4 left-4 sm:left-auto sm:bottom-6 sm:right-6 z-50 bg-[#1C1C23] border border-[#D8B77B] text-[#FAF7F2] px-4 py-3 rounded-lg shadow-2xl flex items-center justify-between sm:justify-start gap-3 text-sm"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <ShoppingBag className="w-4 h-4 text-[#D8B77B] shrink-0" />
            <span className="truncate">{cartToast}</span>
          </div>
          <button
            type="button"
            onClick={() => navigate('/panier')}
            className="text-xs font-semibold text-[#D8B77B] underline ml-2 whitespace-nowrap shrink-0"
          >
            {t.nav.cart}
          </button>
        </div>
      )}

      {/* Accessible Mobile Navigation Panel */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-50 lg:hidden bg-black/70 backdrop-blur-sm"
          onClick={() => setMobileMenuOpen(false)}
        >
          <div
            className="ml-auto w-full max-w-xs h-full bg-[#101014] border-l border-white/10 p-5 sm:p-6 flex flex-col justify-between overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              <div className="flex items-center justify-between pb-5 border-b border-white/10">
                <BrandLogo
                  variant={theme === 'light' ? 'dark-on-light' : 'light-on-dark'}
                  className="h-9"
                />
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 text-[#AAA6A1] hover:text-white"
                  aria-label="Fermer le menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Theme Toggle inside Mobile Drawer */}
              <div className="mt-4 flex items-center justify-between px-3 py-2.5 rounded-lg bg-[#1C1C23] border border-white/10">
                <span className="text-xs font-medium text-[#FAF7F2]">
                  {lang === 'fr' ? 'Apparence du site' : 'Site appearance'}
                </span>
                <button
                  type="button"
                  onClick={toggleTheme}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold bg-[#D8B77B] text-[#101014]"
                >
                  {theme === 'light' ? (
                    <>
                      <Sun className="w-3.5 h-3.5" />
                      <span>{lang === 'fr' ? 'Mode Clair' : 'Light Mode'}</span>
                    </>
                  ) : (
                    <>
                      <Moon className="w-3.5 h-3.5" />
                      <span>{lang === 'fr' ? 'Mode Sombre' : 'Dark Mode'}</span>
                    </>
                  )}
                </button>
              </div>

              <nav className="mt-5 flex flex-col space-y-1.5">
                {navItems.map((item) => (
                  <button
                    key={item.href}
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      navigate(item.href);
                    }}
                    className={`w-full text-left px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                      pathname === item.href
                        ? 'bg-[#1C1C23] text-[#D8B77B] font-semibold'
                        : 'text-[#FAF7F2] hover:bg-white/5'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </nav>
            </div>

            <div className="pt-6 border-t border-white/10 space-y-3">
              {settings.reservationsEnabled && (
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    navigate('/reservation');
                  }}
                  className="w-full py-2.5 px-4 bg-[#D8B77B] text-[#101014] font-semibold text-sm rounded-md"
                >
                  {t.nav.reserve}
                </button>
              )}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    navigate(authUser ? '/mon-compte' : '/connexion');
                  }}
                  className="py-2 px-3 bg-[#1C1C23] text-[#FAF7F2] text-xs font-medium rounded-md border border-white/10"
                >
                  {authUser ? t.nav.account : t.nav.login}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    navigate('/admin');
                  }}
                  className="py-2 px-3 bg-[#1C1C23] text-[#D8B77B] text-xs font-medium rounded-md border border-[#D8B77B]/30"
                >
                  {t.nav.admin}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search Modal (Closes on Escape) */}
      {searchModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-start justify-center pt-20 sm:pt-24 px-4"
          onClick={() => setSearchModalOpen(false)}
        >
          <div
            className="w-full max-w-xl bg-[#1C1C23] border border-white/15 rounded-xl p-4 sm:p-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <form onSubmit={handleQuickSearchSubmit} className="flex items-center gap-3">
              <Search className="w-5 h-5 text-[#D8B77B] shrink-0" />
              <input
                ref={searchInputRef}
                type="text"
                value={quickQuery}
                onChange={(e) => setQuickQuery(e.target.value)}
                placeholder={t.nav.searchPlaceholder}
                className="w-full bg-transparent text-sm text-[#FAF7F2] placeholder-[#AAA6A1] focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setSearchModalOpen(false)}
                className="text-xs text-[#AAA6A1] hover:text-[#FAF7F2] px-2 py-1"
              >
                ESC
              </button>
            </form>

            {quickResults.length > 0 && (
              <div className="mt-4 pt-4 border-t border-white/10 space-y-2">
                {quickResults.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setSearchModalOpen(false);
                      navigate(`/produits/${item.slug}`);
                    }}
                    className="w-full flex items-center justify-between p-2.5 rounded-lg hover:bg-white/5 text-left transition-colors gap-3"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-[#FAF7F2] truncate">
                        {lang === 'fr' ? item.nameFr : item.nameEn}
                      </p>
                      <p className="text-xs text-[#AAA6A1] font-mono-tabular">
                        {item.publicRef} ·{' '}
                        {(item.availableBaseUnits || 0) > 0 ? t.shop.inStock : t.shop.outOfStock}
                      </p>
                    </div>
                    <span className="font-mono-tabular text-sm text-[#D8B77B] shrink-0">
                      {formatXaf(item.basePriceXaf, lang)}
                    </span>
                  </button>
                ))}
              </div>
            )}

            <div className="mt-4 pt-3 border-t border-white/10 flex justify-end">
              <button
                type="button"
                onClick={handleQuickSearchSubmit}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-[#D8B77B] hover:underline"
              >
                <span>
                  {lang === 'fr'
                    ? 'Voir tous les résultats dans la boutique'
                    : 'View all results in store'}
                </span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export const Footer: React.FC = () => {
  const { lang, theme, toggleTheme, navigate, settings } = useApp();
  const t = translations[lang];

  return (
    <footer className="bg-[#101014] border-t border-white/10 text-[#AAA6A1]">
      {settings.demoMode && (
        <div className="bg-[#1C1C23] border-b border-white/10 px-4 py-3">
          <div className="max-w-[1280px] mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
            <p className="text-[#FAF7F2]/90">
              <strong className="text-[#D8B77B] font-semibold">{t.badges.demoBannerTitle} :</strong>{' '}
              {t.badges.demoBannerText}
            </p>
            <button
              type="button"
              onClick={() => navigate('/admin')}
              className="text-[#D8B77B] hover:underline whitespace-nowrap shrink-0 font-medium"
            >
              {lang === 'fr' ? 'Configurer dans l’Administration →' : 'Configure in Admin →'}
            </button>
          </div>
        </div>
      )}

      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-14">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-10">
          <div className="space-y-4">
            <BrandLogo
              variant={theme === 'light' ? 'dark-on-light' : 'light-on-dark'}
              className="h-11 sm:h-12"
            />
            <p className="text-xs leading-relaxed text-[#AAA6A1]">
              {lang === 'fr' ? settings.editorialTaglineFr : settings.editorialTaglineEn}
            </p>
            <p className="text-xs text-[#AAA6A1]">
              {settings.city}
              {settings.neighborhood ? ` · ${settings.neighborhood}` : ''}{' '}
              <span className="text-[#D8B77B]">
                ({settings.neighborhoodValidated ? t.badges.validated : t.badges.toConfirm})
              </span>
            </p>
            <div className="pt-1">
              <button
                type="button"
                onClick={toggleTheme}
                className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md border border-white/15 text-[#FAF7F2] hover:border-[#D8B77B] transition-colors"
              >
                {theme === 'light' ? (
                  <>
                    <Moon className="w-3.5 h-3.5 text-[#91652E]" />
                    <span>{lang === 'fr' ? 'Activer le mode sombre' : 'Switch to Dark Mode'}</span>
                  </>
                ) : (
                  <>
                    <Sun className="w-3.5 h-3.5 text-[#D8B77B]" />
                    <span>{lang === 'fr' ? 'Activer le mode clair' : 'Switch to Light Mode'}</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#FAF7F2] mb-4">
              {lang === 'fr' ? 'Navigation' : 'Navigation'}
            </h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <button type="button" onClick={() => navigate('/carte')} className="hover:text-[#FAF7F2]">
                  {t.nav.menu}
                </button>
              </li>
              <li>
                <button type="button" onClick={() => navigate('/boutique')} className="hover:text-[#FAF7F2]">
                  {t.nav.shop}
                </button>
              </li>
              <li>
                <button type="button" onClick={() => navigate('/experience')} className="hover:text-[#FAF7F2]">
                  {t.nav.experience}
                </button>
              </li>
              <li>
                <button type="button" onClick={() => navigate('/evenements')} className="hover:text-[#FAF7F2]">
                  {t.nav.events}
                </button>
              </li>
              <li>
                <button type="button" onClick={() => navigate('/galerie')} className="hover:text-[#FAF7F2]">
                  {t.nav.gallery}
                </button>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#FAF7F2] mb-4">
              {lang === 'fr' ? 'Services & Suivi' : 'Services & Tracking'}
            </h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <button type="button" onClick={() => navigate('/panier')} className="hover:text-[#FAF7F2]">
                  {t.nav.cart}
                </button>
              </li>
              {settings.reservationsEnabled && (
                <li>
                  <button type="button" onClick={() => navigate('/reservation')} className="hover:text-[#FAF7F2]">
                    {t.nav.reserve}
                  </button>
                </li>
              )}
              <li>
                <button type="button" onClick={() => navigate('/mon-compte')} className="hover:text-[#FAF7F2]">
                  {t.nav.account}
                </button>
              </li>
              <li>
                <button type="button" onClick={() => navigate('/connexion')} className="hover:text-[#FAF7F2]">
                  {t.nav.login}
                </button>
              </li>
              <li>
                <button type="button" onClick={() => navigate('/admin')} className="text-[#D8B77B] hover:underline">
                  {t.nav.admin}
                </button>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#FAF7F2] mb-4">
              {lang === 'fr' ? 'Informations & Cadre Légal' : 'Legal & Information'}
            </h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <button type="button" onClick={() => navigate('/contact')} className="hover:text-[#FAF7F2]">
                  {t.nav.contact}
                </button>
              </li>
              <li>
                <button type="button" onClick={() => navigate('/conditions')} className="hover:text-[#FAF7F2]">
                  {lang === 'fr' ? 'Conditions de vente et d’utilisation' : 'Terms of Sale & Use'}
                </button>
              </li>
              <li>
                <button type="button" onClick={() => navigate('/confidentialite')} className="hover:text-[#FAF7F2]">
                  {lang === 'fr' ? 'Politique de confidentialité' : 'Privacy Policy'}
                </button>
              </li>
            </ul>
            {settings.alcoholSaleEnabled && (
              <p className="mt-4 text-[11px] text-[#AAA6A1] leading-relaxed border-t border-white/10 pt-3">
                {lang === 'fr'
                  ? "L'abus d'alcool est dangereux pour la santé. Vente strictement interdite aux mineurs."
                  : 'Alcohol abuse is harmful to health. Sale strictly prohibited to minors.'}
              </p>
            )}
          </div>
        </div>

        <div className="mt-10 sm:mt-12 pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#AAA6A1] text-center sm:text-left">
          <p>
            © {new Date().getFullYear()} {settings.brandName} · {settings.city}.{' '}
            {!settings.brandNameValidated && `(${t.badges.toConfirm})`}
          </p>
          <p>
            {lang === 'fr'
              ? 'Validation des contenus, tarifs et visuels requise par le propriétaire avant mise en production.'
              : 'Owner validation of content, pricing, and visuals required prior to public launch.'}
          </p>
        </div>
      </div>
    </footer>
  );
};
