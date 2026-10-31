import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  AuthenticatedUser,
  BusinessHour,
  BusinessSettings,
  CartItem,
  Category,
  EventRecord,
  Language,
  MediaItem,
  Product,
  ReviewRecord,
  StaffRole,
} from '../types/domain';
import { createInitialSeed } from '../data/seedData';

export type ThemeMode = 'light' | 'dark';

interface AppContextValue {
  lang: Language;
  setLang: (lang: Language) => void;
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
  pathname: string;
  searchParams: URLSearchParams;
  navigate: (to: string, replace?: boolean) => void;
  backendOnline: boolean;
  loadingBootstrap: boolean;
  settings: BusinessSettings;
  hours: BusinessHour[];
  categories: Category[];
  products: Product[];
  events: EventRecord[];
  media: MediaItem[];
  reviews: ReviewRecord[];
  refreshBootstrap: () => Promise<void>;
  cart: CartItem[];
  addToCart: (item: CartItem) => void;
  updateCartQty: (productId: string, variantId: string, quantity: number) => void;
  removeFromCart: (productId: string, variantId: string) => void;
  clearCart: () => void;
  cartCount: number;
  cartToast: string | null;
  authUser: AuthenticatedUser | null;
  authToken: string | null;
  loginAsStaff: (role: StaffRole) => Promise<void>;
  loginAsCustomer: (name: string, phone: string, email?: string) => Promise<void>;
  logout: () => void;
}

const fallbackSeed = createInitialSeed();

const AppContext = createContext<AppContextValue | undefined>(undefined);

const CART_STORAGE_KEY = 'le_boivement_cart_v1';
const THEME_STORAGE_KEY = 'le_boivement_theme_v2';

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLang] = useState<Language>('fr');
  // Light mode is strictly the default ('light')
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    try {
      const saved = localStorage.getItem(THEME_STORAGE_KEY);
      if (saved === 'dark' || saved === 'light') return saved;
    } catch {
      // ignore storage errors
    }
    return 'light';
  });

  const [pathname, setPathname] = useState<string>(() => window.location.pathname || '/');
  const [search, setSearch] = useState<string>(() => window.location.search || '');
  const [backendOnline, setBackendOnline] = useState<boolean>(true);
  const [loadingBootstrap, setLoadingBootstrap] = useState<boolean>(true);

  const [settings, setSettings] = useState<BusinessSettings>(fallbackSeed.settings);
  const [hours, setHours] = useState<BusinessHour[]>(fallbackSeed.hours);
  const [categories, setCategories] = useState<Category[]>(fallbackSeed.categories);
  const [products, setProducts] = useState<Product[]>(fallbackSeed.products);
  const [events, setEvents] = useState<EventRecord[]>(fallbackSeed.events);
  const [media, setMedia] = useState<MediaItem[]>(fallbackSeed.media);
  const [reviews, setReviews] = useState<ReviewRecord[]>(
    (fallbackSeed.reviews || []).filter((r) => r.status === 'approved')
  );

  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [cartToast, setCartToast] = useState<string | null>(null);

  const [authUser, setAuthUser] = useState<AuthenticatedUser | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);

  // Sync HTML root class and theme-color meta tag
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    const metaTheme = document.querySelector('meta[name="theme-color"]');
    if (metaTheme) {
      metaTheme.setAttribute('content', theme === 'dark' ? '#101014' : '#FAF7F2');
    }
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // ignore
    }
  }, [theme]);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const setTheme = useCallback((next: ThemeMode) => {
    setThemeState(next);
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => (prev === 'light' ? 'dark' : 'light'));
  }, []);

  useEffect(() => {
    const handlePopState = () => {
      setPathname(window.location.pathname || '/');
      setSearch(window.location.search || '');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = useCallback((to: string, replace = false) => {
    const url = new URL(to, window.location.origin);
    if (replace) {
      window.history.replaceState({}, '', url.pathname + url.search);
    } else {
      window.history.pushState({}, '', url.pathname + url.search);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    setPathname(url.pathname);
    setSearch(url.search);
  }, []);

  const refreshBootstrap = useCallback(async () => {
    try {
      const res = await fetch('/api/bootstrap');
      if (!res.ok) throw new Error('Bootstrap error');
      const data = await res.json();
      setSettings(data.settings);
      setHours(data.hours);
      setCategories(data.categories);
      setProducts(data.products);
      setEvents(data.events);
      setMedia(data.media);
      if (Array.isArray(data.reviews)) {
        setReviews(data.reviews);
      }
      setBackendOnline(true);
    } catch {
      setBackendOnline(false);
    } finally {
      setLoadingBootstrap(false);
    }
  }, []);

  useEffect(() => {
    refreshBootstrap();
  }, [refreshBootstrap]);

  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    } catch {
      // ignore storage errors
    }
  }, [cart]);

  const addToCart = useCallback(
    (newItem: CartItem) => {
      setCart((prev) => {
        const idx = prev.findIndex(
          (i) => i.productId === newItem.productId && i.variantId === newItem.variantId
        );
        if (idx >= 0) {
          const updated = [...prev];
          updated[idx] = {
            ...updated[idx],
            quantity: updated[idx].quantity + newItem.quantity,
            selectedOptions:
              newItem.selectedOptions.length > 0
                ? newItem.selectedOptions
                : updated[idx].selectedOptions,
          };
          return updated;
        }
        return [...prev, newItem];
      });
      const prod = products.find((p) => p.id === newItem.productId);
      const label = prod ? (lang === 'fr' ? prod.nameFr : prod.nameEn) : '';
      setCartToast(
        lang === 'fr'
          ? `Ajouté au panier : ${label}`
          : `Added to bag: ${label}`
      );
      setTimeout(() => setCartToast(null), 2600);
    },
    [products, lang]
  );

  const updateCartQty = useCallback((productId: string, variantId: string, quantity: number) => {
    if (quantity <= 0) {
      setCart((prev) => prev.filter((i) => !(i.productId === productId && i.variantId === variantId)));
      return;
    }
    setCart((prev) =>
      prev.map((i) =>
        i.productId === productId && i.variantId === variantId ? { ...i, quantity } : i
      )
    );
  }, []);

  const removeFromCart = useCallback((productId: string, variantId: string) => {
    setCart((prev) => prev.filter((i) => !(i.productId === productId && i.variantId === variantId)));
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
  }, []);

  const loginAsStaff = useCallback(async (role: StaffRole) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode: 'staff', staffRole: role }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Connexion refusée');
    setAuthUser(data.user);
    setAuthToken(data.token);
  }, []);

  const loginAsCustomer = useCallback(async (name: string, phone: string, email?: string) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mode: 'customer',
        customerName: name,
        customerPhone: phone,
        customerEmail: email,
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Connexion refusée');
    setAuthUser(data.user);
    setAuthToken(data.token);
  }, []);

  const logout = useCallback(() => {
    setAuthUser(null);
    setAuthToken(null);
  }, []);

  const cartCount = cart.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <AppContext.Provider
      value={{
        lang,
        setLang,
        theme,
        setTheme,
        toggleTheme,
        pathname,
        searchParams: new URLSearchParams(search),
        navigate,
        backendOnline,
        loadingBootstrap,
        settings,
        hours,
        categories,
        products,
        events,
        media,
        reviews,
        refreshBootstrap,
        cart,
        addToCart,
        updateCartQty,
        removeFromCart,
        clearCart,
        cartCount,
        cartToast,
        authUser,
        authToken,
        loginAsStaff,
        loginAsCustomer,
        logout,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}
