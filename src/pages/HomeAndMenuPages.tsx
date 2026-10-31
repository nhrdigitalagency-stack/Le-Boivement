import React from 'react';
import {
  ArrowRight,
  Calendar,
  ShoppingBag,
  MapPin,
  Clock,
  CheckCircle2,
  AlertCircle,
  Utensils,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { translations, formatXaf } from '../i18n/translations';
import { BrandLogo, GraphicVisualSlot } from '../components/VisualComposition';

export const HomePage: React.FC = () => {
  const {
    lang,
    navigate,
    settings,
    hours,
    categories,
    products,
    events,
    media,
    addToCart,
  } = useApp();

  const t = translations[lang];
  const featuredProducts = products.slice(0, 6);

  // Only show spaces that are explicitly validated as active services on the homepage
  const activeSpaces = [
    {
      key: 'lounge',
      status: settings.spacesValidation.lounge,
      titleFr: 'Espace Lounge & Dégustation',
      titleEn: 'Lounge & Tasting Space',
      descFr: 'Cadre feutré pour vos rencontres, échanges et dégustations en journée comme en soirée.',
      descEn: 'Refined setting for conversations, gatherings, and tastings from afternoon to late evening.',
    },
    {
      key: 'snackBar',
      status: settings.spacesValidation.snackBar,
      titleFr: 'Restauration sur place & À emporter',
      titleEn: 'Dine-In & Takeaway Kitchen',
      descFr: 'Grillades au feu de bois, ardoises à partager et plats cuisinés minute.',
      descEn: 'Charcoal-grilled specialties, sharing slates, and freshly prepared dishes.',
    },
    {
      key: 'glacier',
      status: settings.spacesValidation.glacier,
      titleFr: 'Espace Glacier & Douceurs',
      titleEn: 'Ice Cream & Sweet Creations',
      descFr: 'Coupes glacées et créations sucrées.',
      descEn: 'Artisanal ice cream cups and sweet creations.',
    },
    {
      key: 'nightclub',
      status: settings.spacesValidation.nightclub,
      titleFr: 'Ambiance Nocturne & Club',
      titleEn: 'Nightlife & Club Experience',
      descFr: 'Programmation musicale nocturne selon calendrier confirmé.',
      descEn: 'Night music programming according to confirmed schedule.',
    },
    {
      key: 'pool',
      status: settings.spacesValidation.pool,
      titleFr: 'Accès Piscine & Détente',
      titleEn: 'Poolside Access & Leisure',
      descFr: 'Modalités d’accès et horaires soumis à validation par la direction.',
      descEn: 'Access rules and schedule subject to management validation.',
    },
  ];

  const validatedSpaces = activeSpaces.filter((s) => s.status === 'validated');
  const pendingSpaces = activeSpaces.filter((s) => s.status === 'to_confirm');

  return (
    <div className="bg-[#101014] text-[#FAF7F2]">
      {/* 1. HERO SECTION */}
      <section className="keep-dark relative min-h-[88vh] pt-28 pb-20 flex items-center overflow-hidden border-b border-white/10">
        {/* Bespoke Graphic Backdrop (No fake third-party venue photo) */}
        <div className="keep-dark absolute inset-0 bg-gradient-to-br from-[#101014] via-[#17171F] to-[#1C1C23] pointer-events-none" />
        <div
          className="absolute inset-0 opacity-20 pointer-events-none"
          style={{
            backgroundImage:
              'radial-gradient(circle at 75% 30%, rgba(216, 183, 123, 0.28) 0%, transparent 55%), radial-gradient(circle at 20% 80%, rgba(145, 101, 46, 0.22) 0%, transparent 50%)',
          }}
        />

        <div className="relative z-10 max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-7 space-y-6">
              <div className="flex flex-wrap items-center gap-2 text-xs tracking-widest uppercase text-[#D8B77B]">
                <span>{t.hero.kicker}</span>
                <span aria-hidden="true">·</span>
                <span className="text-[#AAA6A1]">
                  {settings.neighborhood || 'Yaoundé'} (
                  {settings.neighborhoodValidated ? t.badges.validated : t.badges.toConfirm})
                </span>
              </div>

              <h1
                className="font-serif-display text-4xl sm:text-5xl lg:text-6xl font-semibold text-[#FAF7F2] leading-[1.1] tracking-tight"
                style={{ textWrap: 'balance' }}
              >
                {settings.brandName} — {lang === 'fr' ? settings.editorialTaglineFr : settings.editorialTaglineEn}
              </h1>

              <p className="text-base sm:text-lg text-[#AAA6A1] max-w-2xl leading-relaxed">
                {t.home.presentationBody}
              </p>

              <div className="pt-2 flex flex-wrap items-center gap-4">
                <button
                  type="button"
                  onClick={() => navigate('/carte')}
                  className="px-6 py-3.5 bg-[#D8B77B] text-[#101014] font-semibold text-sm rounded-md hover:bg-[#e3c68f] transition-colors inline-flex items-center gap-2 whitespace-nowrap shrink-0"
                >
                  <Utensils className="w-4 h-4" />
                  <span>{t.hero.discoverMenu}</span>
                </button>

                {settings.onlineOrderingEnabled && (
                  <button
                    type="button"
                    onClick={() => navigate('/boutique')}
                    className="px-6 py-3.5 bg-[#1C1C23] text-[#FAF7F2] border border-[#D8B77B]/40 font-medium text-sm rounded-md hover:border-[#D8B77B] transition-colors inline-flex items-center gap-2 whitespace-nowrap shrink-0"
                  >
                    <ShoppingBag className="w-4 h-4 text-[#D8B77B]" />
                    <span>{t.hero.orderOnline}</span>
                  </button>
                )}

                {settings.reservationsEnabled && (
                  <button
                    type="button"
                    onClick={() => navigate('/reservation')}
                    className="px-6 py-3.5 bg-transparent text-[#FAF7F2] border border-white/20 font-medium text-sm rounded-md hover:bg-white/5 transition-colors inline-flex items-center gap-2 whitespace-nowrap shrink-0"
                  >
                    <Calendar className="w-4 h-4 text-[#D8B77B]" />
                    <span>{t.hero.bookTable}</span>
                  </button>
                )}
              </div>

              <p className="text-xs text-[#AAA6A1] pt-2 border-t border-white/10 max-w-xl">
                {t.hero.framingNote}
              </p>
            </div>

            {/* Right Visual Showcase: Official Monochrome Emblem in Architectural Frame */}
            <div className="lg:col-span-5">
              <div className="bg-[#1C1C23]/90 border border-[#D8B77B]/25 rounded-xl p-8 sm:p-10 shadow-2xl relative overflow-hidden">
                <div className="flex items-center justify-between text-xs text-[#AAA6A1] mb-6 pb-4 border-b border-white/10">
                  <span>IDENTITÉ VISUELLE</span>
                  <span>
                    {settings.brandNameValidated ? t.badges.validated : t.badges.toConfirm}
                  </span>
                </div>

                <div className="py-10 flex items-center justify-center bg-[#101014] rounded-lg border border-white/5 px-6">
                  <BrandLogo variant="light-on-dark" className="h-28 sm:h-36" />
                </div>

                <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between text-xs text-[#AAA6A1]">
                  <span>Snack · Bar · Lounge</span>
                  <button
                    type="button"
                    onClick={() => navigate('/experience')}
                    className="text-[#D8B77B] hover:underline inline-flex items-center gap-1"
                  >
                    <span>{t.nav.experience}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. CATÉGORIES DE PRODUITS */}
      <section className="py-20 bg-[#101014] border-b border-white/10">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-12">
            <div>
              <p className="text-xs uppercase tracking-widest text-[#D8B77B] mb-2">
                01. {t.home.categoriesTitle}
              </p>
              <h2 className="font-serif-display text-3xl sm:text-4xl font-semibold text-[#FAF7F2]">
                {t.home.categoriesSubtitle}
              </h2>
            </div>
            <button
              type="button"
              onClick={() => navigate('/boutique')}
              className="text-sm font-medium text-[#D8B77B] hover:underline inline-flex items-center gap-1.5 whitespace-nowrap shrink-0"
            >
              <span>{lang === 'fr' ? 'Parcourir tout le catalogue' : 'Browse full catalog'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map((cat, index) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => navigate(`/boutique?category=${encodeURIComponent(cat.slug)}`)}
                className="group text-left bg-[#1C1C23] border border-white/10 hover:border-[#D8B77B]/50 rounded-xl p-6 transition-all duration-200 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between text-xs text-[#AAA6A1] mb-3">
                    <span className="font-mono-tabular">0{index + 1}</span>
                    <span>
                      {cat.validationStatus === 'validated' ? t.badges.validated : t.badges.toConfirm}
                    </span>
                  </div>
                  <h3 className="font-serif-display text-2xl font-semibold text-[#FAF7F2] group-hover:text-[#D8B77B] transition-colors">
                    {lang === 'fr' ? cat.nameFr : cat.nameEn}
                  </h3>
                  <p className="text-xs text-[#AAA6A1] mt-2 leading-relaxed">
                    {lang === 'fr' ? cat.descriptionFr : cat.descriptionEn}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between text-xs font-medium text-[#D8B77B]">
                  <span>
                    {lang === 'fr' ? 'Explorer la sélection' : 'Explore selection'}
                  </span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* 3. SÉLECTION DE LA CARTE (Contrast Ivory Section to demonstrate legible header & editorial rhythm) */}
      <section className="py-20 bg-[#FAF7F2] text-[#101014] border-b border-black/10">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-12">
            <div>
              <p className="text-xs uppercase tracking-widest text-[#91652E] font-semibold mb-2">
                02. {t.home.featuredMenuTitle}
              </p>
              <h2 className="font-serif-display text-3xl sm:text-4xl font-semibold text-[#101014]">
                {t.home.featuredMenuSubtitle}
              </h2>
            </div>
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => navigate('/carte')}
                className="px-4 py-2 text-xs font-semibold border border-[#101014]/20 rounded-md hover:bg-[#101014] hover:text-[#FAF7F2] transition-colors whitespace-nowrap"
              >
                {t.nav.menu}
              </button>
              <button
                type="button"
                onClick={() => navigate('/boutique')}
                className="px-4 py-2 text-xs font-semibold bg-[#101014] text-[#FAF7F2] rounded-md hover:bg-[#1C1C23] transition-colors whitespace-nowrap"
              >
                {t.nav.shop}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuredProducts.map((product) => {
              const defaultVariant = product.variants[0];
              const avail = product.availableBaseUnits || 0;
              const isOut = avail < (defaultVariant?.unitMultiplier || 1);

              return (
                <div
                  key={product.id}
                  className="bg-white border border-black/10 rounded-xl overflow-hidden flex flex-col justify-between transition-transform duration-200 hover:-translate-y-0.5"
                >
                  <div>
                    <div
                      onClick={() => navigate(`/produits/${product.slug}`)}
                      className="cursor-pointer"
                    >
                      <GraphicVisualSlot
                        theme={product.visualTheme}
                        title={lang === 'fr' ? product.nameFr : product.nameEn}
                        subtitle={product.publicRef}
                        isDemo={product.isDemo}
                        lang={lang}
                      />
                    </div>

                    <div className="p-6">
                      {/* Unboxed clean metadata with middot separator */}
                      <div className="flex items-center gap-2 text-xs text-[#6E6A64] mb-2">
                        <span className="font-mono-tabular">{product.publicRef}</span>
                        <span aria-hidden="true">·</span>
                        <span>
                          {isOut ? t.shop.outOfStock : `${t.shop.inStock} (${avail})`}
                        </span>
                        {product.requiresAgeCheck && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="text-[#91652E] font-semibold">18+</span>
                          </>
                        )}
                      </div>

                      <h3
                        onClick={() => navigate(`/produits/${product.slug}`)}
                        className="font-semibold text-base text-[#101014] hover:text-[#91652E] cursor-pointer line-clamp-1"
                      >
                        {lang === 'fr' ? product.nameFr : product.nameEn}
                      </h3>

                      <p className="text-xs text-[#5A5751] mt-2 line-clamp-2 leading-relaxed">
                        {lang === 'fr' ? product.descriptionFr : product.descriptionEn}
                      </p>
                    </div>
                  </div>

                  <div className="px-6 pb-6 pt-3 border-t border-black/5 flex items-center justify-between gap-3">
                    <div>
                      <span className="font-mono-tabular text-base font-semibold text-[#101014]">
                        {formatXaf(defaultVariant?.priceXaf || product.basePriceXaf, lang)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => navigate(`/produits/${product.slug}`)}
                        className="px-3 py-2 text-xs font-medium text-[#101014] border border-black/15 rounded-md hover:bg-black/5 whitespace-nowrap"
                      >
                        {t.shop.viewDetails}
                      </button>
                      {settings.onlineOrderingEnabled && defaultVariant && (
                        <button
                          type="button"
                          disabled={isOut}
                          onClick={() =>
                            addToCart({
                              productId: product.id,
                              variantId: defaultVariant.id,
                              quantity: 1,
                              selectedOptions: [],
                              addedPriceXaf: defaultVariant.priceXaf,
                            })
                          }
                          className={`px-3.5 py-2 text-xs font-semibold rounded-md whitespace-nowrap transition-colors ${
                            isOut
                              ? 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
                              : 'bg-[#101014] text-[#FAF7F2] hover:bg-[#91652E]'
                          }`}
                        >
                          {t.shop.addToCart}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 4. EXPÉRIENCES DISPONIBLES ET VALIDÉES (Strictly separates validated vs unvalidated services) */}
      <section className="py-20 bg-[#101014] border-b border-white/10">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mb-12">
            <p className="text-xs uppercase tracking-widest text-[#D8B77B] mb-2">
              03. {t.home.experiencesTitle}
            </p>
            <h2 className="font-serif-display text-3xl sm:text-4xl font-semibold text-[#FAF7F2]">
              {t.home.experiencesSubtitle}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {validatedSpaces.map((sp) => (
              <div
                key={sp.key}
                className="bg-[#1C1C23] border border-[#D8B77B]/30 rounded-xl p-6 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center gap-2 text-xs text-[#D8B77B] mb-3">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{t.badges.validated}</span>
                  </div>
                  <h3 className="font-serif-display text-2xl font-semibold text-[#FAF7F2]">
                    {lang === 'fr' ? sp.titleFr : sp.titleEn}
                  </h3>
                  <p className="text-sm text-[#AAA6A1] mt-2 leading-relaxed">
                    {lang === 'fr' ? sp.descFr : sp.descEn}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {pendingSpaces.length > 0 && (
            <div className="mt-8 bg-[#1C1C23]/50 border border-white/10 rounded-xl p-6">
              <div className="flex items-center gap-2 text-xs text-[#AAA6A1] mb-2">
                <AlertCircle className="w-4 h-4 text-[#D8B77B]" />
                <span>
                  {lang === 'fr'
                    ? 'Éléments mentionnés sur des fiches publiques en attente de confirmation par la direction (non activés comme services certifiés) :'
                    : 'Elements mentioned on public listings awaiting management confirmation (not presented as active certified services):'}
                </span>
              </div>
              <p className="text-xs text-[#AAA6A1]">
                {pendingSpaces.map((s) => (lang === 'fr' ? s.titleFr : s.titleEn)).join(' · ')}
              </p>
            </div>
          )}
        </div>
      </section>

      {/* 5. ÉVÉNEMENTS PUBLIÉS & 6. GALERIE */}
      <section className="py-20 bg-[#16161C] border-b border-white/10">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-12">
          <div className="lg:col-span-6 space-y-6">
            <div>
              <p className="text-xs uppercase tracking-widest text-[#D8B77B] mb-2">
                04. {t.home.eventsTitle}
              </p>
              <h2 className="font-serif-display text-3xl font-semibold text-[#FAF7F2]">
                {t.home.eventsSubtitle}
              </h2>
            </div>

            {events.length === 0 ? (
              <div className="bg-[#1C1C23] border border-white/10 rounded-xl p-6 text-sm text-[#AAA6A1]">
                {lang === 'fr'
                  ? 'Aucun événement programmé pour le moment.'
                  : 'No scheduled events at this time.'}
              </div>
            ) : (
              <div className="space-y-4">
                {events.slice(0, 2).map((evt) => (
                  <div
                    key={evt.id}
                    className="bg-[#1C1C23] border border-white/10 rounded-xl p-6 space-y-3"
                  >
                    <div className="flex items-center gap-2 text-xs text-[#D8B77B] font-mono-tabular">
                      <span>{evt.eventDate}</span>
                      <span aria-hidden="true">·</span>
                      <span>{evt.timeLabel}</span>
                      <span aria-hidden="true">·</span>
                      <span className="text-[#AAA6A1]">
                        {evt.validationStatus === 'validated' ? t.badges.validated : t.badges.toConfirm}
                      </span>
                    </div>
                    <h3 className="font-serif-display text-2xl font-semibold text-[#FAF7F2]">
                      {lang === 'fr' ? evt.titleFr : evt.titleEn}
                    </h3>
                    <p className="text-xs text-[#AAA6A1] leading-relaxed">
                      {lang === 'fr' ? evt.descriptionFr : evt.descriptionEn}
                    </p>
                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={() => navigate(`/evenements/${evt.slug}`)}
                        className="text-xs font-semibold text-[#D8B77B] hover:underline inline-flex items-center gap-1"
                      >
                        <span>{lang === 'fr' ? 'Détails & conditions d’accès' : 'Details & access rules'}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="lg:col-span-6 space-y-6">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-xs uppercase tracking-widest text-[#D8B77B] mb-2">
                  05. {t.home.galleryTitle}
                </p>
                <h2 className="font-serif-display text-3xl font-semibold text-[#FAF7F2]">
                  {lang === 'fr' ? 'Médias & Identité' : 'Approved Media & Identity'}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => navigate('/galerie')}
                className="text-xs font-semibold text-[#D8B77B] hover:underline"
              >
                {lang === 'fr' ? 'Ouvrir la galerie →' : 'Open gallery →'}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {media.slice(0, 2).map((item) => (
                <div
                  key={item.id}
                  onClick={() => navigate('/galerie')}
                  className="cursor-pointer rounded-xl overflow-hidden border border-white/10 hover:border-[#D8B77B]/50 transition-colors"
                >
                  <GraphicVisualSlot
                    theme={item.visualTheme}
                    title={lang === 'fr' ? item.titleFr : item.titleEn}
                    subtitle={lang === 'fr' ? item.captionFr : item.captionEn}
                    imageUrl={item.imageUrl}
                    isDemo={item.isDemoGraphic}
                    lang={lang}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 7. RÉSERVATION & 8. LOCALISATION ET HORAIRES */}
      <section className="py-20 bg-[#101014]">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-10">
          {settings.reservationsEnabled && (
            <div className="lg:col-span-6 bg-[#1C1C23] border border-[#D8B77B]/30 rounded-xl p-8 flex flex-col justify-between">
              <div className="space-y-4">
                <p className="text-xs uppercase tracking-widest text-[#D8B77B]">
                  06. {t.nav.reserve}
                </p>
                <h2 className="font-serif-display text-3xl font-semibold text-[#FAF7F2]">
                  {t.home.reservationCtaTitle}
                </h2>
                <p className="text-sm text-[#AAA6A1] leading-relaxed">
                  {t.home.reservationCtaBody}
                </p>
              </div>
              <div className="pt-6 mt-6 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => navigate('/reservation')}
                  className="px-6 py-3 bg-[#D8B77B] text-[#101014] font-semibold text-sm rounded-md hover:bg-[#e3c68f] transition-colors inline-flex items-center gap-2"
                >
                  <Calendar className="w-4 h-4" />
                  <span>{t.hero.bookTable}</span>
                </button>
              </div>
            </div>
          )}

          <div
            className={`${
              settings.reservationsEnabled ? 'lg:col-span-6' : 'lg:col-span-12'
            } bg-[#1C1C23] border border-white/10 rounded-xl p-8 space-y-6`}
          >
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-widest text-[#D8B77B]">
                07. {t.home.locationHoursTitle}
              </p>
              <span className="text-xs text-[#AAA6A1]">
                {settings.addressValidated ? t.badges.validated : t.badges.toConfirm}
              </span>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-[#D8B77B] mt-1 shrink-0" />
                <div>
                  <p className="font-medium text-[#FAF7F2]">{settings.city}</p>
                  <p className="text-xs text-[#AAA6A1]">
                    {settings.exactAddress
                      ? settings.exactAddress
                      : lang === 'fr'
                      ? `Quartier de cadrage indiqué : ${settings.neighborhood || 'Chapelle Obili'} (adresse exacte à confirmer par l'établissement)`
                      : `Indicated neighborhood: ${settings.neighborhood || 'Chapelle Obili'} (exact street address awaiting confirmation)`}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 pt-2">
                <Clock className="w-4 h-4 text-[#D8B77B] mt-1 shrink-0" />
                <div className="w-full">
                  <p className="font-medium text-[#FAF7F2] mb-2">
                    {lang === 'fr' ? 'Horaires d’ouverture' : 'Opening Hours'}
                  </p>
                  {hours.some((h) => h.isValidated && (h.openTime || h.isClosed)) ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs text-[#AAA6A1]">
                      {hours.map((h) => (
                        <div key={h.dayOfWeek} className="flex justify-between pr-4">
                          <span>{lang === 'fr' ? h.labelFr : h.labelEn}</span>
                          <span className="font-mono-tabular text-[#FAF7F2]">
                            {h.isClosed
                              ? lang === 'fr'
                                ? 'Fermé'
                                : 'Closed'
                              : h.openTime && h.closeTime
                              ? `${h.openTime} – ${h.closeTime}`
                              : t.badges.toConfirm}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-[#AAA6A1]">
                      {lang === 'fr'
                        ? 'Horaires officiels en attente de validation dans le panneau d’administration (aucun horaire fictif n’est affiché).'
                        : 'Official opening hours awaiting validation in the administration panel (no fabricated hours are displayed).'}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export const MenuPage: React.FC = () => {
  const { lang, categories, products, navigate, addToCart, settings } = useApp();
  const t = translations[lang];

  return (
    <div className="min-h-screen pt-28 pb-20 bg-[#101014] text-[#FAF7F2]">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-10 border-b border-white/10">
          <div>
            <p className="text-xs uppercase tracking-widest text-[#D8B77B] mb-2">
              {settings.brandName} · {settings.city}
            </p>
            <h1 className="font-serif-display text-4xl sm:text-5xl font-semibold text-[#FAF7F2]">
              {t.shop.menuTitle}
            </h1>
            <p className="text-sm text-[#AAA6A1] mt-2 max-w-2xl">
              {lang === 'fr'
                ? 'La carte et la boutique partagent le même catalogue unifié et les mêmes disponibilités en temps réel.'
                : 'The dining menu and online store share the exact same unified catalog and live stock availability.'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/boutique')}
            className="px-5 py-2.5 bg-[#D8B77B] text-[#101014] font-semibold text-xs rounded-md hover:bg-[#e3c68f] transition-colors whitespace-nowrap shrink-0"
          >
            {lang === 'fr' ? 'Filtrer & rechercher dans la Boutique →' : 'Filter & search in Store →'}
          </button>
        </div>

        <div className="mt-12 space-y-16">
          {categories.map((cat) => {
            const catProducts = products.filter((p) => p.categoryId === cat.id);
            if (catProducts.length === 0) return null;

            return (
              <section key={cat.id} className="space-y-6">
                <div className="border-b border-white/10 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h2 className="font-serif-display text-3xl font-semibold text-[#D8B77B]">
                      {lang === 'fr' ? cat.nameFr : cat.nameEn}
                    </h2>
                    <p className="text-xs text-[#AAA6A1] mt-1">
                      {lang === 'fr' ? cat.descriptionFr : cat.descriptionEn}
                    </p>
                  </div>
                  <span className="text-xs text-[#AAA6A1]">
                    {cat.validationStatus === 'validated' ? t.badges.validated : t.badges.toConfirm}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {catProducts.map((product) => {
                    const avail = product.availableBaseUnits || 0;
                    const allergens = lang === 'fr' ? product.allergensFr : product.allergensEn;

                    return (
                      <div
                        key={product.id}
                        className="bg-[#1C1C23] border border-white/10 rounded-xl p-6 flex flex-col justify-between gap-4"
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between gap-2 text-xs text-[#AAA6A1]">
                            <span className="font-mono-tabular">{product.publicRef}</span>
                            <span>
                              {avail > 0 ? `${t.shop.inStock} (${avail})` : t.shop.outOfStock}
                            </span>
                          </div>

                          <div className="flex items-baseline justify-between gap-4">
                            <h3
                              onClick={() => navigate(`/produits/${product.slug}`)}
                              className="text-lg font-semibold text-[#FAF7F2] hover:text-[#D8B77B] cursor-pointer"
                            >
                              {lang === 'fr' ? product.nameFr : product.nameEn}
                            </h3>
                            <span className="font-mono-tabular text-base font-semibold text-[#D8B77B] whitespace-nowrap">
                              {formatXaf(product.basePriceXaf, lang)}
                            </span>
                          </div>

                          <p className="text-xs text-[#AAA6A1] leading-relaxed">
                            {lang === 'fr' ? product.descriptionFr : product.descriptionEn}
                          </p>

                          {allergens.length > 0 && (
                            <p className="text-[11px] text-[#AAA6A1] pt-1">
                              <strong className="text-[#FAF7F2]">Allergènes renseignés :</strong>{' '}
                              {allergens.join(', ')}
                            </p>
                          )}
                        </div>

                        <div className="pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-3">
                          <div className="flex flex-wrap gap-2">
                            {product.variants.map((v) => {
                              const variantOut = avail < v.unitMultiplier;
                              return (
                                <button
                                  key={v.id}
                                  type="button"
                                  disabled={variantOut || !settings.onlineOrderingEnabled}
                                  onClick={() =>
                                    addToCart({
                                      productId: product.id,
                                      variantId: v.id,
                                      quantity: 1,
                                      selectedOptions: [],
                                      addedPriceXaf: v.priceXaf,
                                    })
                                  }
                                  className={`px-3 py-1.5 text-xs rounded-md border font-mono-tabular transition-colors ${
                                    variantOut
                                      ? 'border-white/10 text-white/30 cursor-not-allowed'
                                      : 'border-[#D8B77B]/40 text-[#FAF7F2] hover:bg-[#D8B77B] hover:text-[#101014]'
                                  }`}
                                >
                                  + {lang === 'fr' ? v.nameFr : v.nameEn} ({formatXaf(v.priceXaf, lang)})
                                </button>
                              );
                            })}
                          </div>

                          <button
                            type="button"
                            onClick={() => navigate(`/produits/${product.slug}`)}
                            className="text-xs text-[#D8B77B] hover:underline whitespace-nowrap"
                          >
                            {t.shop.viewDetails} →
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
};
