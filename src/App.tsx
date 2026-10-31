import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header, Footer } from './components/HeaderAndFooter';
import { SeoHead } from './components/SeoHead';
import { HomePage, MenuPage } from './pages/HomeAndMenuPages';
import { ShopPage, ProductDetailPage } from './pages/ShopAndProductPages';
import { CartPage, CheckoutPage, OrderTrackingPage } from './pages/CartAndCheckoutPages';
import {
  ReservationPage,
  ExperiencePage,
  EventsPage,
  EventDetailPage,
  GalleryPage,
  ContactPage,
  LoginPage,
  MyAccountPage,
  PrivacyPage,
  TermsPage,
  NotFoundPage,
} from './pages/HospitalityPages';
import { AdminPortalPage } from './pages/AdminPortalPage';

const RouteDispatcher: React.FC = () => {
  const { pathname } = useApp();

  if (pathname === '/') return <HomePage />;
  if (pathname === '/carte') return <MenuPage />;
  if (pathname === '/boutique') return <ShopPage />;
  if (pathname.startsWith('/produits/')) {
    const slug = decodeURIComponent(pathname.slice('/produits/'.length));
    return <ProductDetailPage slug={slug} />;
  }
  if (pathname === '/panier') return <CartPage />;
  if (pathname === '/commande') return <CheckoutPage />;
  if (pathname.startsWith('/commandes/')) {
    const reference = decodeURIComponent(pathname.slice('/commandes/'.length));
    return <OrderTrackingPage reference={reference} />;
  }
  if (pathname === '/reservation') return <ReservationPage />;
  if (pathname === '/experience') return <ExperiencePage />;
  if (pathname === '/evenements') return <EventsPage />;
  if (pathname.startsWith('/evenements/')) {
    const slug = decodeURIComponent(pathname.slice('/evenements/'.length));
    return <EventDetailPage slug={slug} />;
  }
  if (pathname === '/galerie') return <GalleryPage />;
  if (pathname === '/contact') return <ContactPage />;
  if (pathname === '/connexion') return <LoginPage />;
  if (pathname === '/mon-compte') return <MyAccountPage />;
  if (pathname === '/confidentialite') return <PrivacyPage />;
  if (pathname === '/conditions') return <TermsPage />;
  if (pathname === '/admin') return <AdminPortalPage />;

  return <NotFoundPage />;
};

export default function App() {
  return (
    <AppProvider>
      <SeoHead />
      <div className="min-h-screen w-full max-w-[100vw] overflow-x-hidden flex flex-col bg-[#FBF8F3] dark:bg-[#101014] text-[#1E1915] dark:text-[#FAF7F2] transition-colors duration-200">
        <Header />
        <main className="flex-1 w-full min-w-0">
          <RouteDispatcher />
        </main>
        <Footer />
      </div>
    </AppProvider>
  );
}
