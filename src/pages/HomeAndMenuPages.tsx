import React from 'react';
import {
  ArrowRight,
  Calendar,
  ShoppingBag,
  MapPin,
  Clock,
  CheckCircle2,
  Utensils,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { translations, formatXaf } from '../i18n/translations';
import { BrandLogo, GraphicVisualSlot } from '../components/VisualComposition';

export const HomePage: React.FC = () => {
  const {
    lang,
    theme,
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
  const isLight = theme === 'light';
  const featuredProducts = products.slice(0, 6);

  const hospitalitySpaces = [
    {
      key: 'lounge',
      titleFr: 'Espace Lounge & Dégustation',
      titleEn: 'Lounge & Tasting Space',
      descFr:
        'Cadre chaleureux et feutré pour vos rencontres, échanges et dégustations en journée comme en soirée.',
      descEn:
        'Warm and refined setting for conversations, gatherings, and tastings from afternoon to late evening.',
    },
    {
      key: 'snackBar',
      titleFr: 'Restauration sur place & À emporter',
      titleEn: 'Dine-In & Takeaway Kitchen',
      descFr:
        'Grillades au feu de bois, volailles braisées aux épices de Penja, poissons frais et ardoises soya à partager.',
      descEn:
        'Charcoal-grilled specialties, Penja pepper poultry, fresh fish, and sharing soya platters.',
    },
    {
      key: 'glacier',
      titleFr: 'Espace Glacier & Douceurs',
      titleEn: 'Ice Cream & Sweet Creations',
      descFr:
        'Coupes glacées artisanales au cacao du Cameroun, vanille et douceurs rafraîchissantes.',
      descEn:
        'Artisanal Cameroon cocoa and vanilla ice cream cups and refreshing sweet creations.',
    },
    {
      key: 'nightlife',
      titleFr: 'Ambiance Musicale & Soirées',
      titleEn: 'Musical Atmosphere & Evenings',
      descFr:
        'Sélections musicales, service bouteilles à table et soirées conviviales au cœur de Yaoundé.',
      descEn:
        'Curated music sessions, table bottle service, and vibrant evenings in the heart of Yaoundé.',
    },
  ];

  return (
    <div className="bg-[#101014] text-[#FAF7F2]">
      {/* 1. HERO SECTION — Video Background + Reduced-Opacity Black Overlay */}
      <section className="keep-dark relative min-h-[86vh] pt-28 pb-20 flex items-center overflow-hidden border-b border-[#D8B77B]/20 text-[#FAF7F2]">
        {/* Background Video */}
        <video
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover z-0"
        >
          <source
            src="/assets/aistudio/People_socializing_in_outdoor_lo__fbe67d64_18c44ee2.mp4"
            type="video/mp4"
          />
        </video>

        {/* Superposition d'arrière-plan couleur noire avec opacité réduite */}
        <div
          aria-hidden="true"
          className="keep-dark absolute inset-0 bg-black/55 bg-gradient-to-b from-black/65 via-black/50 to-black/70 z-[1]"
        />

        <div className="relative z-10 max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            <div className="lg:col-span-7 space-y-6">
              <div className="keep-light-text inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-black/45 backdrop-blur-md border border-[#D8B77B]/40 text-xs tracking-widest uppercase font-semibold text-[#D8B77B]">
                <MapPin className="w-3.5 h-3.5 shrink-0" />
                <span>{t.hero.kicker}</span>
              </div>

              <h1
                className="keep-light-text font-serif-display text-3xl sm:text-5xl lg:text-6xl font-semibold text-white leading-[1.1] tracking-tight drop-shadow-sm"
                style={{ textWrap: 'balance' }}
              >
                {settings.brandName} —{' '}
                {lang === 'fr' ? settings.editorialTaglineFr : settings.editorialTaglineEn}
              </h1>

              <p className="keep-light-text text-sm sm:text-lg text-[#FAF7F2]/90 max-w-2xl leading-relaxed drop-shadow-sm">
                {t.home.presentationBody}
              </p>

              <div className="pt-2 flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-3.5">
                <button
                  type="button"
                  onClick={() => navigate('/carte')}
                  className="keep-light-text justify-center px-6 py-3.5 bg-[#91652E] text-white font-semibold text-sm rounded-lg hover:bg-[#7A5324] shadow-lg transition-all inline-flex items-center gap-2 whitespace-nowrap shrink-0"
                >
                  <Utensils className="w-4 h-4 shrink-0" />
                  <span>{t.hero.discoverMenu}</span>
                </button>

                {settings.onlineOrderingEnabled && (
                  <button
                    type="button"
                    onClick={() => navigate('/boutique')}
                    className="keep-light-text justify-center px-6 py-3.5 font-semibold text-sm rounded-lg border bg-black/50 backdrop-blur-md text-white border-[#D8B77B]/50 hover:bg-black/70 hover:border-[#D8B77B] transition-colors inline-flex items-center gap-2 whitespace-nowrap shrink-0"
                  >
                    <ShoppingBag className="w-4 h-4 text-[#D8B77B] shrink-0" />
                    <span>{t.hero.orderOnline}</span>
                  </button>
                )}

                {settings.reservationsEnabled && (
                  <button
                    type="button"
                    onClick={() => navigate('/reservation')}
                    className="keep-light-text justify-center px-6 py-3.5 font-medium text-sm rounded-lg border bg-white/10 backdrop-blur-md text-white border-white/30 hover:bg-white/20 transition-colors inline-flex items-center gap-2 whitespace-nowrap shrink-0"
                  >
                    <Calendar className="w-4 h-4 text-[#D8B77B] shrink-0" />
                    <span>{t.hero.bookTable}</span>
                  </button>
                )}
              </div>

              <p className="keep-light-text text-xs text-[#FAF7F2]/80 pt-3 border-t border-white/20 max-w-xl">
                {t.hero.framingNote}
              </p>
            </div>

            {/* Right Visual Showcase: Warm Hospitality Frame with Official Emblem & Culinary Preview */}
            <div className="lg:col-span-5">
              <div
                className={`rounded-2xl p-5 sm:p-7 border shadow-2xl relative overflow-hidden space-y-5 backdrop-blur-md ${
                  isLight
                    ? 'bg-[#FBF8F3]/95 border-[#91652E]/30 text-[#1E1915]'
                    : 'bg-[#18151E]/90 border-[#D8B77B]/30 text-[#FAF7F2]'
                }`}
              >
                <div
                  className={`flex items-center justify-between text-xs pb-3 border-b ${
                    isLight
                      ? 'border-[#91652E]/15 text-[#655B50]'
                      : 'border-white/10 text-[#AAA6A1]'
                  }`}
                >
                  <span
                    className={`font-semibold tracking-wider uppercase ${
                      isLight ? 'text-[#91652E]' : 'text-[#D8B77B]'
                    }`}
                  >
                    SNACK · BAR · LOUNGE
                  </span>
                  <span>{settings.city}</span>
                </div>

                <div
                  className={`py-6 sm:py-8 px-4 sm:px-6 rounded-xl border flex items-center justify-center ${
                    isLight
                      ? 'bg-gradient-to-br from-[#FFFFFF] to-[#F2E6D4] border-[#91652E]/20'
                      : 'bg-[#121016] border-white/10'
                  }`}
                >
                  <BrandLogo
                    variant={isLight ? 'dark-on-light' : 'light-on-dark'}
                    className="h-20 sm:h-28"
                  />
                </div>

                {/* Appetizing Culinary & Lounge Preview */}
                <div className="grid grid-cols-2 gap-3">
                  <div
                    onClick={() => navigate('/carte')}
                    className="cursor-pointer rounded-xl overflow-hidden border border-white/15 relative group h-24 sm:h-28"
                  >
                    <img
                      src="https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=600&q=80"
                      alt="Grillades & Cuisine"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="keep-light-text absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent p-2.5 flex items-end">
                      <span className="keep-light-text text-xs font-semibold text-white">
                        {lang === 'fr' ? 'Grillades & Plats' : 'Charcoal Grill'}
                      </span>
                    </div>
                  </div>

                  <div
                    onClick={() => navigate('/experience')}
                    className="cursor-pointer rounded-xl overflow-hidden border border-white/15 relative group h-24 sm:h-28"
                  >
                    <img
                      src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=600&q=80"
                      alt="Ambiance Lounge"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="keep-light-text absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent p-2.5 flex items-end">
                      <span className="keep-light-text text-xs font-semibold text-white">
                        {lang === 'fr' ? 'Espace Lounge' : 'Lounge Space'}
                      </span>
                    </div>
                  </div>
                </div>

                <div
                  className={`pt-2 border-t flex items-center justify-between text-xs ${
                    isLight
                      ? 'border-[#91652E]/15 text-[#655B50]'
                      : 'border-white/10 text-[#AAA6A1]'
                  }`}
                >
                  <span>{settings.neighborhood || 'Chapelle Obili'}</span>
                  <button
                    type="button"
                    onClick={() => navigate('/experience')}
                    className={`font-semibold hover:underline inline-flex items-center gap-1 ${
                      isLight ? 'text-[#91652E]' : 'text-[#D8B77B]'
                    }`}
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
              <p className="text-xs uppercase tracking-widest font-semibold text-[#D8B77B] mb-2">
                01. {t.home.categoriesTitle}
              </p>
              <h2 className="font-serif-display text-3xl sm:text-4xl font-semibold text-[#FAF7F2]">
                {t.home.categoriesSubtitle}
              </h2>
            </div>
            <button
              type="button"
              onClick={() => navigate('/boutique')}
              className="text-sm font-semibold text-[#D8B77B] hover:underline inline-flex items-center gap-1.5 whitespace-nowrap shrink-0"
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
                className="group text-left bg-[#1C1C23] border border-white/10 hover:border-[#91652E]/50 rounded-xl p-6 transition-all duration-200 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between text-xs text-[#D8B77B] font-semibold mb-3">
                    <span className="font-mono-tabular">0{index + 1}</span>
                    <span>{cat.isAlcoholicCategory ? '18+' : 'Le Boivement'}</span>
                  </div>
                  <h3 className="font-serif-display text-2xl font-semibold text-[#FAF7F2] group-hover:text-[#D8B77B] transition-colors">
                    {lang === 'fr' ? cat.nameFr : cat.nameEn}
                  </h3>
                  <p className="text-xs text-[#AAA6A1] mt-2 leading-relaxed">
                    {lang === 'fr' ? cat.descriptionFr : cat.descriptionEn}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between text-xs font-semibold text-[#D8B77B]">
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

      {/* 3. SÉLECTION DE LA CARTE */}
      <section className="py-20 bg-[#16161C] border-b border-white/10">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-12">
            <div>
              <p className="text-xs uppercase tracking-widest text-[#D8B77B] font-semibold mb-2">
                02. {t.home.featuredMenuTitle}
              </p>
              <h2 className="font-serif-display text-3xl sm:text-4xl font-semibold text-[#FAF7F2]">
                {t.home.featuredMenuSubtitle}
              </h2>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => navigate('/carte')}
                className="px-4 py-2 text-xs font-semibold border border-[#91652E]/35 rounded-md text-[#FAF7F2] hover:bg-[#91652E]/10 transition-colors whitespace-nowrap"
              >
                {t.nav.menu}
              </button>
              <button
                type="button"
                onClick={() => navigate('/boutique')}
                className="keep-light-text px-4 py-2 text-xs font-semibold bg-[#91652E] text-white rounded-md hover:bg-[#7A5324] transition-colors whitespace-nowrap"
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
                  className="bg-[#1C1C23] border border-white/10 rounded-xl overflow-hidden flex flex-col justify-between transition-transform duration-200 hover:-translate-y-0.5"
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
                        lang={lang}
                      />
                    </div>

                    <div className="p-6">
                      <div className="flex items-center gap-2 text-xs text-[#AAA6A1] mb-2">
                        <span className="font-mono-tabular">{product.publicRef}</span>
                        <span aria-hidden="true">·</span>
                        <span className={isOut ? 'text-red-500' : 'text-[#D8B77B] font-medium'}>
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
                        className="font-semibold text-base text-[#FAF7F2] hover:text-[#D8B77B] cursor-pointer line-clamp-1"
                      >
                        {lang === 'fr' ? product.nameFr : product.nameEn}
                      </h3>

                      <p className="text-xs text-[#AAA6A1] mt-2 line-clamp-2 leading-relaxed">
                        {lang === 'fr' ? product.descriptionFr : product.descriptionEn}
                      </p>
                    </div>
                  </div>

                  <div className="px-6 pb-6 pt-3 border-t border-white/10 flex items-center justify-between gap-3">
                    <div>
                      <span className="font-mono-tabular text-base font-semibold text-[#FAF7F2]">
                        {formatXaf(defaultVariant?.priceXaf || product.basePriceXaf, lang)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => navigate(`/produits/${product.slug}`)}
                        className="px-3 py-2 text-xs font-medium text-[#FAF7F2] border border-white/15 rounded-md hover:bg-white/5 whitespace-nowrap"
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
                              : 'keep-light-text bg-[#91652E] text-white hover:bg-[#7A5324]'
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

      {/* 4. ESPACES & ART DE VIVRE */}
      <section className="py-20 bg-[#101014] border-b border-white/10">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mb-12">
            <p className="text-xs uppercase tracking-widest font-semibold text-[#D8B77B] mb-2">
              03. {t.home.experiencesTitle}
            </p>
            <h2 className="font-serif-display text-3xl sm:text-4xl font-semibold text-[#FAF7F2]">
              {t.home.experiencesSubtitle}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {hospitalitySpaces.map((sp) => (
              <div
                key={sp.key}
                className="bg-[#1C1C23] border border-[#91652E]/25 rounded-xl p-6 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center gap-2 text-xs font-semibold text-[#D8B77B] mb-3">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{settings.brandName} · Yaoundé</span>
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
        </div>
      </section>

      {/* 5. ÉVÉNEMENTS PUBLIÉS & 6. GALERIE */}
      <section className="py-20 bg-[#16161C] border-b border-white/10">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-12">
          <div className="lg:col-span-6 space-y-6">
            <div>
              <p className="text-xs uppercase tracking-widest font-semibold text-[#D8B77B] mb-2">
                04. {t.home.eventsTitle}
              </p>
              <h2 className="font-serif-display text-3xl font-semibold text-[#FAF7F2]">
                {t.home.eventsSubtitle}
              </h2>
            </div>

            {events.length === 0 ? (
              <div className="bg-[#1C1C23] border border-white/10 rounded-xl p-6 text-sm text-[#AAA6A1]">
                {lang === 'fr'
                  ? 'Consultez prochainement nos prochains rendez-vous.'
                  : 'Check back soon for upcoming events.'}
              </div>
            ) : (
              <div className="space-y-4">
                {events.slice(0, 2).map((evt) => (
                  <div
                    key={evt.id}
                    className="bg-[#1C1C23] border border-white/10 rounded-xl p-6 space-y-3"
                  >
                    <div className="flex items-center gap-2 text-xs text-[#D8B77B] font-mono-tabular font-semibold">
                      <span>{evt.eventDate}</span>
                      <span aria-hidden="true">·</span>
                      <span>{evt.timeLabel}</span>
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
                        <span>{lang === 'fr' ? 'Voir les détails' : 'View details'}</span>
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
                <p className="text-xs uppercase tracking-widest font-semibold text-[#D8B77B] mb-2">
                  05. {t.home.galleryTitle}
                </p>
                <h2 className="font-serif-display text-3xl font-semibold text-[#FAF7F2]">
                  {lang === 'fr' ? 'Univers Visuel & Ambiance' : 'Visual Universe & Atmosphere'}
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
                  className="cursor-pointer rounded-xl overflow-hidden border border-white/10 hover:border-[#91652E]/50 transition-colors"
                >
                  <GraphicVisualSlot
                    theme={item.visualTheme}
                    title={lang === 'fr' ? item.titleFr : item.titleEn}
                    subtitle={lang === 'fr' ? item.captionFr : item.captionEn}
                    imageUrl={item.imageUrl}
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
            <div className="lg:col-span-6 bg-[#1C1C23] border border-[#91652E]/25 rounded-xl p-8 flex flex-col justify-between">
              <div className="space-y-4">
                <p className="text-xs uppercase tracking-widest font-semibold text-[#D8B77B]">
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
                  className="keep-light-text px-6 py-3 bg-[#91652E] text-white font-semibold text-sm rounded-lg hover:bg-[#7A5324] transition-colors inline-flex items-center gap-2"
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
            <div>
              <p className="text-xs uppercase tracking-widest font-semibold text-[#D8B77B]">
                07. {t.home.locationHoursTitle}
              </p>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-[#D8B77B] mt-1 shrink-0" />
                <div>
                  <p className="font-semibold text-[#FAF7F2]">{settings.city}</p>
                  <p className="text-xs text-[#AAA6A1]">
                    {settings.exactAddress || `${settings.neighborhood || 'Chapelle Obili'}, Yaoundé`}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 pt-2">
                <Clock className="w-4 h-4 text-[#D8B77B] mt-1 shrink-0" />
                <div className="w-full">
                  <p className="font-semibold text-[#FAF7F2] mb-2">
                    {lang === 'fr' ? 'Horaires d’ouverture' : 'Opening Hours'}
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs text-[#AAA6A1]">
                    {hours.map((h) => (
                      <div key={h.dayOfWeek} className="flex justify-between pr-4">
                        <span>{lang === 'fr' ? h.labelFr : h.labelEn}</span>
                        <span className="font-mono-tabular font-medium text-[#FAF7F2]">
                          {h.isClosed
                            ? lang === 'fr'
                              ? 'Fermé'
                              : 'Closed'
                            : h.openTime && h.closeTime
                            ? `${h.openTime} – ${h.closeTime}`
                            : '11:30 – 02:00'}
                        </span>
                      </div>
                    ))}
                  </div>
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
            <p className="text-xs uppercase tracking-widest font-semibold text-[#D8B77B] mb-2">
              {settings.brandName} · {settings.city}
            </p>
            <h1 className="font-serif-display text-4xl sm:text-5xl font-semibold text-[#FAF7F2]">
              {t.shop.menuTitle}
            </h1>
            <p className="text-sm text-[#AAA6A1] mt-2 max-w-2xl">
              {lang === 'fr'
                ? 'Sélection de spécialités braisées, ardoises lounge, créations glacées et boissons disponibles sur place ou à emporter.'
                : 'Selection of charcoal-grilled dishes, lounge platters, artisanal ice cream, and beverages available dine-in or takeaway.'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/boutique')}
            className="keep-light-text px-5 py-2.5 bg-[#91652E] text-white font-semibold text-xs rounded-lg hover:bg-[#7A5324] transition-colors whitespace-nowrap shrink-0"
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
                            <span className="text-[#D8B77B] font-medium">
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
                              <strong className="text-[#FAF7F2]">Allergènes :</strong>{' '}
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
                                      ? 'border-white/10 text-neutral-400 cursor-not-allowed'
                                      : 'border-[#91652E]/40 text-[#FAF7F2] hover:bg-[#91652E] hover:text-white'
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
                            className="text-xs font-semibold text-[#D8B77B] hover:underline whitespace-nowrap"
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
