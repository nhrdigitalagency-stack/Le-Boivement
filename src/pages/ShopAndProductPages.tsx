import React, { useState, useEffect } from 'react';
import {
  Search,
  RotateCcw,
  ShoppingBag,
  ArrowLeft,
  AlertTriangle,
  Check,
  ShieldAlert,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { translations, formatXaf } from '../i18n/translations';
import { Product } from '../types/domain';
import { GraphicVisualSlot } from '../components/VisualComposition';
import { CustomerReviewsSection } from '../components/CustomerReviewsSection';

export const ShopPage: React.FC = () => {
  const {
    lang,
    searchParams,
    navigate,
    categories,
    products: fallbackProducts,
    addToCart,
    settings,
    backendOnline,
  } = useApp();

  const t = translations[lang];

  const initialQ = searchParams.get('q') || '';
  const initialCat = searchParams.get('category') || 'all';
  const initialSort = searchParams.get('sort') || 'relevance';
  const initialInStock = searchParams.get('inStock') === 'true';
  const initialMaxPrice = Number(searchParams.get('maxPrice') || 0);
  const initialPage = Math.max(1, Number(searchParams.get('page') || 1));

  const [searchInput, setSearchInput] = useState(initialQ);
  const [debouncedQ, setDebouncedQ] = useState(initialQ);
  const [selectedCategory, setSelectedCategory] = useState(initialCat);
  const [sortBy, setSortBy] = useState(initialSort);
  const [inStockOnly, setInStockOnly] = useState(initialInStock);
  const [maxPrice, setMaxPrice] = useState<number>(initialMaxPrice);
  const [page, setPage] = useState<number>(initialPage);

  const [catalogItems, setCatalogItems] = useState<Product[]>(fallbackProducts);
  const [totalCount, setTotalCount] = useState<number>(fallbackProducts.length);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(false);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQ(searchInput);
      setPage(1);
    }, 220);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Sync filters to URL query parameters
  useEffect(() => {
    const params = new URLSearchParams();
    if (debouncedQ.trim()) params.set('q', debouncedQ.trim());
    if (selectedCategory && selectedCategory !== 'all') params.set('category', selectedCategory);
    if (sortBy !== 'relevance') params.set('sort', sortBy);
    if (inStockOnly) params.set('inStock', 'true');
    if (maxPrice > 0) params.set('maxPrice', String(maxPrice));
    if (page > 1) params.set('page', String(page));

    const qs = params.toString();
    const target = qs ? `/boutique?${qs}` : '/boutique';
    if (window.location.pathname + window.location.search !== target) {
      navigate(target, true);
    }
  }, [debouncedQ, selectedCategory, sortBy, inStockOnly, maxPrice, page, navigate]);

  // Query server-side catalog endpoint
  useEffect(() => {
    let active = true;
    const fetchCatalog = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          q: debouncedQ.trim(),
          category: selectedCategory,
          sort: sortBy,
          inStock: String(inStockOnly),
          maxPrice: String(maxPrice || 0),
          page: String(page),
          pageSize: '6',
        });
        const res = await fetch(`/api/catalog?${params.toString()}`);
        if (!res.ok) throw new Error('Catalog error');
        const data = await res.json();
        if (active) {
          setCatalogItems(data.items);
          setTotalCount(data.totalCount);
          setTotalPages(data.totalPages);
        }
      } catch {
        // Fallback client-side filter if offline
        if (active) {
          let filtered = [...fallbackProducts];
          if (selectedCategory !== 'all') {
            filtered = filtered.filter((p) => {
              const cat = categories.find((c) => c.id === p.categoryId);
              return p.categoryId === selectedCategory || cat?.slug === selectedCategory;
            });
          }
          if (debouncedQ.trim()) {
            const q = debouncedQ.toLowerCase();
            filtered = filtered.filter(
              (p) =>
                p.nameFr.toLowerCase().includes(q) ||
                p.nameEn.toLowerCase().includes(q) ||
                p.publicRef.toLowerCase().includes(q)
            );
          }
          if (inStockOnly) {
            filtered = filtered.filter((p) => (p.availableBaseUnits || 0) > 0);
          }
          if (maxPrice > 0) {
            filtered = filtered.filter((p) => p.basePriceXaf <= maxPrice);
          }
          setCatalogItems(filtered);
          setTotalCount(filtered.length);
          setTotalPages(1);
        }
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchCatalog();
    return () => {
      active = false;
    };
  }, [debouncedQ, selectedCategory, sortBy, inStockOnly, maxPrice, page, fallbackProducts, categories]);

  const handleResetFilters = () => {
    setSearchInput('');
    setDebouncedQ('');
    setSelectedCategory('all');
    setSortBy('relevance');
    setInStockOnly(false);
    setMaxPrice(0);
    setPage(1);
  };

  return (
    <div className="min-h-screen pt-28 pb-20 bg-[#101014] text-[#FAF7F2]">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="pb-8 border-b border-white/10 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-widest text-[#D8B77B] mb-2">
              {settings.brandName} · CATALOGUE COMMANDABLE
            </p>
            <h1 className="font-serif-display text-4xl sm:text-5xl font-semibold text-[#FAF7F2]">
              {t.shop.title}
            </h1>
          </div>
          <p className="text-xs font-mono-tabular text-[#AAA6A1]">
            {totalCount} {lang === 'fr' ? 'article(s) trouvé(s)' : 'item(s) found'}
          </p>
        </div>

        {/* FILTER & SEARCH BAR */}
        <div className="mt-8 bg-[#1C1C23] border border-white/10 rounded-xl p-5 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
            <div className="md:col-span-5 relative">
              <Search className="w-4 h-4 text-[#D8B77B] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder={t.nav.searchPlaceholder}
                className="w-full pl-10 pr-4 py-2.5 bg-[#101014] border border-white/15 rounded-lg text-sm text-[#FAF7F2] placeholder-[#AAA6A1] focus:outline-none focus:border-[#D8B77B]"
              />
            </div>

            <div className="md:col-span-3">
              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value);
                  setPage(1);
                }}
                aria-label="Trier par"
                className="w-full px-3.5 py-2.5 bg-[#101014] border border-white/15 rounded-lg text-sm text-[#FAF7F2] focus:outline-none focus:border-[#D8B77B]"
              >
                <option value="relevance">{t.shop.sortRelevance}</option>
                <option value="price_asc">{t.shop.sortPriceAsc}</option>
                <option value="price_desc">{t.shop.sortPriceDesc}</option>
                <option value="newest">{t.shop.sortNewest}</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <select
                value={maxPrice}
                onChange={(e) => {
                  setMaxPrice(Number(e.target.value));
                  setPage(1);
                }}
                aria-label={t.shop.maxPriceFilter}
                className="w-full px-3 py-2.5 bg-[#101014] border border-white/15 rounded-lg text-sm text-[#FAF7F2] font-mono-tabular focus:outline-none focus:border-[#D8B77B]"
              >
                <option value={0}>{t.shop.maxPriceFilter}</option>
                <option value={5000}>≤ 5 000 XAF</option>
                <option value={10000}>≤ 10 000 XAF</option>
                <option value={20000}>≤ 20 000 XAF</option>
                <option value={35000}>≤ 35 000 XAF</option>
              </select>
            </div>

            <div className="md:col-span-2 flex items-center justify-between gap-2">
              <label className="inline-flex items-center gap-2 text-xs text-[#FAF7F2] cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={inStockOnly}
                  onChange={(e) => {
                    setInStockOnly(e.target.checked);
                    setPage(1);
                  }}
                  className="accent-[#D8B77B] w-4 h-4 rounded"
                />
                <span>{t.shop.availabilityFilter}</span>
              </label>

              <button
                type="button"
                onClick={handleResetFilters}
                title={t.shop.clearFilters}
                className="p-2 text-[#AAA6A1] hover:text-[#D8B77B] transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Interactive Category Filter Buttons */}
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-white/10">
            <button
              type="button"
              onClick={() => {
                setSelectedCategory('all');
                setPage(1);
              }}
              className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                selectedCategory === 'all'
                  ? 'bg-[#D8B77B] text-[#101014] font-semibold'
                  : 'bg-[#101014] text-[#AAA6A1] hover:text-[#FAF7F2]'
              }`}
            >
              {t.shop.allCategories}
            </button>
            {categories.map((cat) => {
              const isSelected = selectedCategory === cat.slug || selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => {
                    setSelectedCategory(cat.slug);
                    setPage(1);
                  }}
                  className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                    isSelected
                      ? 'bg-[#D8B77B] text-[#101014] font-semibold'
                      : 'bg-[#101014] text-[#AAA6A1] hover:text-[#FAF7F2]'
                  }`}
                >
                  {lang === 'fr' ? cat.nameFr : cat.nameEn}
                </button>
              );
            })}
          </div>
        </div>

        {/* PRODUCT GRID */}
        {loading ? (
          <div className="mt-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="h-96 bg-[#1C1C23] border border-white/5 rounded-xl animate-pulse p-6"
              />
            ))}
          </div>
        ) : catalogItems.length === 0 ? (
          <div className="mt-12 bg-[#1C1C23] border border-white/10 rounded-xl p-12 text-center space-y-4">
            <p className="text-base text-[#FAF7F2]">{t.shop.noResults}</p>
            <button
              type="button"
              onClick={handleResetFilters}
              className="px-5 py-2.5 bg-[#D8B77B] text-[#101014] font-semibold text-xs rounded-md"
            >
              {t.shop.clearFilters}
            </button>
          </div>
        ) : (
          <div className="mt-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {catalogItems.map((product) => {
              const defaultVariant = product.variants[0];
              const availBase = product.availableBaseUnits || 0;
              const isOut = availBase < (defaultVariant?.unitMultiplier || 1);

              return (
                <div
                  key={product.id}
                  className="bg-[#1C1C23] border border-white/10 rounded-xl overflow-hidden flex flex-col justify-between transition-transform duration-200 hover:-translate-y-0.5 hover:border-[#D8B77B]/40"
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

                    <div className="p-6 space-y-2.5">
                      <div className="flex items-center gap-2 text-xs text-[#AAA6A1]">
                        <span className="font-mono-tabular">{product.publicRef}</span>
                        <span aria-hidden="true">·</span>
                        <span className={isOut ? 'text-red-400' : 'text-[#D8B77B]'}>
                          {isOut ? t.shop.outOfStock : `${t.shop.inStock} (${availBase})`}
                        </span>
                        {product.requiresAgeCheck && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="text-amber-300 font-semibold">18+</span>
                          </>
                        )}
                      </div>

                      <h2
                        onClick={() => navigate(`/produits/${product.slug}`)}
                        className="text-lg font-semibold text-[#FAF7F2] hover:text-[#D8B77B] cursor-pointer line-clamp-1"
                      >
                        {lang === 'fr' ? product.nameFr : product.nameEn}
                      </h2>

                      <p className="text-xs text-[#AAA6A1] line-clamp-2 leading-relaxed">
                        {lang === 'fr' ? product.descriptionFr : product.descriptionEn}
                      </p>

                      {product.variants.length > 1 && (
                        <p className="text-[11px] text-[#D8B77B] pt-1">
                          {product.variants.length}{' '}
                          {lang === 'fr' ? 'formats / unités disponibles' : 'formats available'}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="px-6 pb-6 pt-4 border-t border-white/10 flex items-center justify-between gap-3">
                    <div>
                      <span className="font-mono-tabular text-base font-semibold text-[#FAF7F2]">
                        {formatXaf(defaultVariant?.priceXaf || product.basePriceXaf, lang)}
                      </span>
                      <p className="text-[11px] text-[#AAA6A1]">
                        {product.validationStatus === 'validated'
                          ? t.badges.validated
                          : t.badges.toConfirm}
                      </p>
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
                          disabled={isOut || !backendOnline}
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
                            isOut || !backendOnline
                              ? 'bg-white/10 text-white/30 cursor-not-allowed'
                              : 'bg-[#D8B77B] text-[#101014] hover:bg-[#e3c68f]'
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
        )}

        {/* PAGINATION */}
        {totalPages > 1 && (
          <div className="mt-12 flex items-center justify-center gap-3">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="px-3.5 py-2 bg-[#1C1C23] border border-white/10 rounded-md text-xs font-medium disabled:opacity-40 inline-flex items-center gap-1"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>{lang === 'fr' ? 'Précédent' : 'Previous'}</span>
            </button>
            <span className="text-xs font-mono-tabular text-[#AAA6A1]">
              Page {page} / {totalPages}
            </span>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="px-3.5 py-2 bg-[#1C1C23] border border-white/10 rounded-md text-xs font-medium disabled:opacity-40 inline-flex items-center gap-1"
            >
              <span>{lang === 'fr' ? 'Suivant' : 'Next'}</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export const ProductDetailPage: React.FC<{ slug: string }> = ({ slug }) => {
  const { lang, products, categories, navigate, addToCart, settings, backendOnline } = useApp();
  const t = translations[lang];

  const product = products.find((p) => p.slug === slug);
  const [selectedVariantId, setSelectedVariantId] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);

  useEffect(() => {
    if (product && product.variants.length > 0) {
      setSelectedVariantId(product.variants[0].id);
      setQuantity(1);
      setSelectedOptions([]);
    }
  }, [product]);

  if (!product) {
    return (
      <div className="min-h-screen pt-32 pb-20 bg-[#101014] text-[#FAF7F2] px-4">
        <div className="max-w-xl mx-auto bg-[#1C1C23] border border-white/10 rounded-xl p-8 text-center space-y-4">
          <h1 className="font-serif-display text-3xl">
            {lang === 'fr' ? 'Article introuvable' : 'Product not found'}
          </h1>
          <button
            type="button"
            onClick={() => navigate('/boutique')}
            className="px-5 py-2.5 bg-[#D8B77B] text-[#101014] font-semibold text-xs rounded-md"
          >
            {lang === 'fr' ? 'Retour à la boutique' : 'Back to store'}
          </button>
        </div>
      </div>
    );
  }

  const category = categories.find((c) => c.id === product.categoryId);
  const activeVariant =
    product.variants.find((v) => v.id === selectedVariantId) || product.variants[0];
  const availBase = product.availableBaseUnits || 0;
  const maxOrderableForVariant = activeVariant
    ? Math.floor(availBase / activeVariant.unitMultiplier)
    : 0;
  const isOut = maxOrderableForVariant < 1;

  const optionsList = lang === 'fr' ? product.allowedOptionsFr : product.allowedOptionsEn;
  const allergensList = lang === 'fr' ? product.allergensFr : product.allergensEn;

  const toggleOption = (opt: string) => {
    setSelectedOptions((prev) =>
      prev.includes(opt) ? prev.filter((o) => o !== opt) : [...prev, opt]
    );
  };

  const relatedProducts = products
    .filter((p) => p.id !== product.id && p.categoryId === product.categoryId)
    .slice(0, 3);

  return (
    <div className="min-h-screen pt-28 pb-20 bg-[#101014] text-[#FAF7F2]">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={() => navigate('/boutique')}
          className="inline-flex items-center gap-2 text-xs text-[#AAA6A1] hover:text-[#D8B77B] mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{lang === 'fr' ? 'Retour au catalogue' : 'Back to catalog'}</span>
        </button>

        {/* Contiguous Purchase Module (Sticky Visual Left, Sticky Purchase Module Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          <div className="lg:col-span-6 lg:sticky lg:top-28">
            <div className="rounded-xl overflow-hidden border border-white/10 bg-[#1C1C23]">
              <GraphicVisualSlot
                theme={product.visualTheme}
                title={lang === 'fr' ? product.nameFr : product.nameEn}
                subtitle={product.publicRef}
                isDemo={product.isDemo}
                lang={lang}
                className="aspect-[4/3]"
              />
              {product.isDemo && (
                <div className="p-4 bg-[#16161C] border-t border-white/10 text-xs text-[#AAA6A1]">
                  {t.badges.demoProduct}
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-6 bg-[#1C1C23] border border-white/10 rounded-xl p-6 sm:p-8 space-y-6">
            <div className="space-y-2 border-b border-white/10 pb-6">
              <div className="flex flex-wrap items-center gap-2 text-xs text-[#AAA6A1]">
                <span>{category ? (lang === 'fr' ? category.nameFr : category.nameEn) : ''}</span>
                <span aria-hidden="true">·</span>
                <span className="font-mono-tabular">{product.publicRef}</span>
                <span aria-hidden="true">·</span>
                <span className="text-[#D8B77B]">
                  {product.validationStatus === 'validated' ? t.badges.validated : t.badges.toConfirm}
                </span>
              </div>

              <h1 className="font-serif-display text-3xl sm:text-4xl font-semibold text-[#FAF7F2]">
                {lang === 'fr' ? product.nameFr : product.nameEn}
              </h1>

              <div className="pt-2 flex items-baseline gap-4">
                <span className="font-mono-tabular text-2xl sm:text-3xl font-semibold text-[#D8B77B]">
                  {formatXaf(activeVariant?.priceXaf || product.basePriceXaf, lang)}
                </span>
                <span className="text-xs font-mono-tabular text-[#AAA6A1]">
                  {isOut
                    ? t.shop.outOfStock
                    : `${t.shop.inStock} : ${maxOrderableForVariant} (${availBase} unités base)`}
                </span>
              </div>
            </div>

            <p className="text-sm text-[#FAF7F2]/90 leading-relaxed">
              {lang === 'fr' ? product.descriptionFr : product.descriptionEn}
            </p>

            {/* Age restriction notice for alcoholic beverages */}
            {product.requiresAgeCheck && (
              <div className="bg-amber-950/40 border border-amber-600/40 rounded-lg p-4 flex items-start gap-3 text-xs text-amber-200">
                <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">{t.shop.ageWarning}</p>
                  <p className="text-amber-200/80 mt-1">
                    {lang === 'fr'
                      ? "Une simple déclaration en ligne ne remplace pas le contrôle physique d'identité lors de la remise ou du service."
                      : 'An online checkbox does not replace physical ID verification upon handover or table service.'}
                  </p>
                </div>
              </div>
            )}

            {/* Variant Selection (including Casier / Bouteille unit multiplier info) */}
            <div className="space-y-3">
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#AAA6A1]">
                {lang === 'fr' ? 'Format / Variante' : 'Format / Variant'}
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {product.variants.map((v) => {
                  const selected = activeVariant?.id === v.id;
                  const maxForThis = Math.floor(availBase / v.unitMultiplier);
                  return (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => {
                        setSelectedVariantId(v.id);
                        setQuantity(1);
                      }}
                      className={`p-3.5 rounded-lg border text-left transition-all ${
                        selected
                          ? 'bg-[#101014] border-[#D8B77B] text-[#FAF7F2]'
                          : 'bg-[#101014]/50 border-white/10 text-[#AAA6A1] hover:border-white/30'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold">
                          {lang === 'fr' ? v.nameFr : v.nameEn}
                        </span>
                        {selected && <Check className="w-4 h-4 text-[#D8B77B]" />}
                      </div>
                      <div className="mt-1.5 flex items-center justify-between text-xs font-mono-tabular">
                        <span className="text-[#D8B77B]">{formatXaf(v.priceXaf, lang)}</span>
                        <span className="text-[11px] text-[#AAA6A1]">
                          {maxForThis > 0 ? `Dispo: ${maxForThis}` : t.shop.outOfStock}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
              {product.variants.some((v) => v.unitMultiplier > 1) && (
                <p className="text-[11px] text-[#AAA6A1]">{t.shop.unitConversionNote}</p>
              )}
            </div>

            {/* Allowed Options */}
            {optionsList.length > 0 && (
              <div className="space-y-2.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#AAA6A1]">
                  {lang === 'fr' ? 'Options autorisées' : 'Allowed Options'}
                </label>
                <div className="flex flex-wrap gap-2">
                  {optionsList.map((opt) => {
                    const checked = selectedOptions.includes(opt);
                    return (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => toggleOption(opt)}
                        className={`px-3 py-1.5 rounded-md text-xs border transition-colors ${
                          checked
                            ? 'bg-[#D8B77B]/20 border-[#D8B77B] text-[#FAF7F2]'
                            : 'bg-[#101014] border-white/15 text-[#AAA6A1]'
                        }`}
                      >
                        {checked ? '✓ ' : '+ '}
                        {opt}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Allergens (Never claim allergen-free if empty) */}
            <div className="pt-4 border-t border-white/10 text-xs text-[#AAA6A1] space-y-1">
              <p>
                <strong className="text-[#FAF7F2]">
                  {lang === 'fr' ? 'Allergènes renseignés :' : 'Declared allergens:'}
                </strong>{' '}
                {allergensList.length > 0
                  ? allergensList.join(', ')
                  : lang === 'fr'
                  ? 'Liste complète à confirmer auprès du personnel avant commande en cas d’allergie.'
                  : 'Full allergen list to be confirmed with staff prior to ordering.'}
              </p>
            </div>

            {/* Quantity & Add to Cart */}
            {settings.onlineOrderingEnabled && activeVariant && (
              <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                <div className="inline-flex items-center justify-between bg-[#101014] border border-white/15 rounded-lg px-3 py-2">
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="px-2 text-lg text-[#AAA6A1] hover:text-white"
                    aria-label="Diminuer la quantité"
                  >
                    −
                  </button>
                  <span className="px-4 font-mono-tabular text-sm font-semibold text-[#FAF7F2]">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setQuantity((q) => Math.min(Math.max(1, maxOrderableForVariant), q + 1))
                    }
                    className="px-2 text-lg text-[#AAA6A1] hover:text-white"
                    aria-label="Augmenter la quantité"
                  >
                    +
                  </button>
                </div>

                <button
                  type="button"
                  disabled={isOut || !backendOnline}
                  onClick={() =>
                    addToCart({
                      productId: product.id,
                      variantId: activeVariant.id,
                      quantity,
                      selectedOptions,
                      addedPriceXaf: activeVariant.priceXaf,
                    })
                  }
                  className={`flex-1 py-3.5 px-6 rounded-lg font-semibold text-sm inline-flex items-center justify-center gap-2 transition-colors ${
                    isOut || !backendOnline
                      ? 'bg-white/10 text-white/30 cursor-not-allowed'
                      : 'bg-[#D8B77B] text-[#101014] hover:bg-[#e3c68f]'
                  }`}
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>
                    {t.shop.addToCart} · {formatXaf(activeVariant.priceXaf * quantity, lang)}
                  </span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Customer Reviews for this Product (Moderated) */}
        <CustomerReviewsSection
          targetType="product"
          productId={product.id}
          productName={lang === 'fr' ? product.nameFr : product.nameEn}
        />

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <section className="mt-20 pt-12 border-t border-white/10">
            <h2 className="font-serif-display text-2xl sm:text-3xl font-semibold text-[#FAF7F2] mb-6">
              {lang === 'fr' ? 'Suggestions dans la même catégorie' : 'Related items'}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {relatedProducts.map((rel) => (
                <div
                  key={rel.id}
                  onClick={() => navigate(`/produits/${rel.slug}`)}
                  className="bg-[#1C1C23] border border-white/10 hover:border-[#D8B77B]/40 rounded-xl p-5 cursor-pointer flex items-center justify-between"
                >
                  <div>
                    <p className="text-sm font-semibold text-[#FAF7F2]">
                      {lang === 'fr' ? rel.nameFr : rel.nameEn}
                    </p>
                    <p className="text-xs text-[#AAA6A1] font-mono-tabular mt-1">{rel.publicRef}</p>
                  </div>
                  <span className="font-mono-tabular text-sm text-[#D8B77B] whitespace-nowrap">
                    {formatXaf(rel.basePriceXaf, lang)}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};
