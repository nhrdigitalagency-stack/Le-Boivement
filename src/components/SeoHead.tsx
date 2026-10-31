import React, { useEffect } from 'react';
import { useApp } from '../context/AppContext';

export const SeoHead: React.FC = () => {
  const { pathname, lang, settings, products, events, reviews } = useApp();

  useEffect(() => {
    const brand = settings.brandName || 'Le Boivement';
    const city = settings.city || 'Yaoundé, Cameroun';

    let pageTitle = `${brand} — Lounge, Restauration & Boutique | ${city}`;
    let pageDescription =
      lang === 'fr'
        ? `${brand} à ${city} (${settings.neighborhood || 'Chapelle Obili'}) : carte gastronomique, grillades, lounge, boutique en ligne et réservation.`
        : `${brand} in ${city} (${settings.neighborhood || 'Chapelle Obili'}): dining menu, grill, lounge, online store, and table reservations.`;

    if (pathname === '/carte') {
      pageTitle =
        lang === 'fr'
          ? `La Carte & Grillades — ${brand} | ${city}`
          : `Dining & Drink Menu — ${brand} | ${city}`;
      pageDescription =
        lang === 'fr'
          ? `Consultez la carte de restauration, grillades, ardoises lounge, boissons et créations glacées chez ${brand} à ${city}.`
          : `Explore main courses, lounge platters, drinks, and ice cream creations at ${brand} in ${city}.`;
    } else if (pathname === '/boutique') {
      pageTitle =
        lang === 'fr'
          ? `Boutique en Ligne & Commande — ${brand} | ${city}`
          : `Online Store & Ordering — ${brand} | ${city}`;
      pageDescription =
        lang === 'fr'
          ? `Commandez en ligne vos plats braisés, ardoises soya, boissons et casiers chez ${brand} (${city}) avec retrait sur place.`
          : `Order charcoal-grilled dishes, soya platters, drinks, and bottle crates online from ${brand} (${city}).`;
    } else if (pathname.startsWith('/produits/')) {
      const slug = pathname.replace('/produits/', '').trim();
      const prod = products.find((p) => p.slug === slug || p.id === slug);
      if (prod) {
        const name = lang === 'fr' ? prod.nameFr : prod.nameEn;
        const desc = lang === 'fr' ? prod.descriptionFr : prod.descriptionEn;
        pageTitle = `${name} — ${brand} | ${city}`;
        pageDescription = `${desc.slice(0, 155)} (${prod.basePriceXaf} XAF)`;
      }
    } else if (pathname === '/experience') {
      pageTitle =
        lang === 'fr'
          ? `L’Expérience Lounge, Snack-Bar & Avis Clients — ${brand}`
          : `The Lounge Experience & Customer Reviews — ${brand}`;
      pageDescription =
        lang === 'fr'
          ? `Découvrez l’univers ${brand} à ${city} : ambiance de jour comme de nuit, espaces lounge et avis clients vérifiés.`
          : `Discover ${brand} in ${city}: day-to-night atmosphere, lounge spaces, and moderated customer reviews.`;
    } else if (pathname === '/evenements') {
      pageTitle =
        lang === 'fr'
          ? `Événements & Programmation — ${brand} | ${city}`
          : `Events & Lineup — ${brand} | ${city}`;
    } else if (pathname === '/reservation') {
      pageTitle =
        lang === 'fr'
          ? `Réserver une Table ou un Espace Lounge — ${brand}`
          : `Reserve a Table or Lounge Space — ${brand}`;
    } else if (pathname === '/contact') {
      pageTitle =
        lang === 'fr'
          ? `Contact, Horaires & Localisation — ${brand} | ${city}`
          : `Contact, Hours & Location — ${brand} | ${city}`;
    } else if (pathname === '/admin') {
      pageTitle = `Administration & Rapports — ${brand}`;
    }

    document.title = pageTitle;

    const setMeta = (selector: string, attr: string, content: string) => {
      let el = document.querySelector(selector);
      if (!el) {
        el = document.createElement('meta');
        if (selector.includes('property=')) {
          const propMatch = selector.match(/property="([^"]+)"/);
          if (propMatch) el.setAttribute('property', propMatch[1]);
        } else if (selector.includes('name=')) {
          const nameMatch = selector.match(/name="([^"]+)"/);
          if (nameMatch) el.setAttribute('name', nameMatch[1]);
        }
        document.head.appendChild(el);
      }
      el.setAttribute(attr, content);
    };

    setMeta('meta[name="description"]', 'content', pageDescription);
    setMeta('meta[property="og:title"]', 'content', pageTitle);
    setMeta('meta[property="og:description"]', 'content', pageDescription);
    setMeta('meta[name="twitter:title"]', 'content', pageTitle);
    setMeta('meta[name="twitter:description"]', 'content', pageDescription);

    // Canonical URL
    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    canonical.href = `${window.location.origin}${pathname}`;

    // Dynamic Schema.org JSON-LD
    const approvedReviews = reviews.filter((r) => r.status === 'approved');
    const avgRating =
      approvedReviews.length > 0
        ? Number(
            (
              approvedReviews.reduce((acc, r) => acc + r.rating, 0) / approvedReviews.length
            ).toFixed(1)
          )
        : 4.8;

    let structuredData: Record<string, any> = {
      '@context': 'https://schema.org',
      '@type': ['Restaurant', 'BarOrPub'],
      name: brand,
      description: pageDescription,
      url: `${window.location.origin}${pathname}`,
      address: {
        '@type': 'PostalAddress',
        streetAddress: settings.exactAddress || settings.neighborhood || 'Chapelle Obili',
        addressLocality: 'Yaoundé',
        addressCountry: 'CM',
      },
      servesCuisine: ['Camerounaise', 'Grillades', 'Lounge'],
      priceRange: 'XAF',
      aggregateRating:
        approvedReviews.length > 0
          ? {
              '@type': 'AggregateRating',
              ratingValue: avgRating,
              reviewCount: approvedReviews.length,
              bestRating: 5,
              worstRating: 1,
            }
          : undefined,
    };

    if (pathname.startsWith('/produits/')) {
      const slug = pathname.replace('/produits/', '').trim();
      const prod = products.find((p) => p.slug === slug || p.id === slug);
      if (prod) {
        const prodReviews = approvedReviews.filter((r) => r.productId === prod.id);
        structuredData = {
          '@context': 'https://schema.org',
          '@type': 'Product',
          name: lang === 'fr' ? prod.nameFr : prod.nameEn,
          description: lang === 'fr' ? prod.descriptionFr : prod.descriptionEn,
          sku: prod.publicRef,
          brand: {
            '@type': 'Brand',
            name: brand,
          },
          offers: {
            '@type': 'Offer',
            priceCurrency: 'XAF',
            price: prod.basePriceXaf,
            availability:
              (prod.availableBaseUnits || 0) > 0
                ? 'https://schema.org/InStock'
                : 'https://schema.org/OutOfStock',
            url: `${window.location.origin}${pathname}`,
          },
          aggregateRating:
            prodReviews.length > 0
              ? {
                  '@type': 'AggregateRating',
                  ratingValue: Number(
                    (
                      prodReviews.reduce((a, b) => a + b.rating, 0) / prodReviews.length
                    ).toFixed(1)
                  ),
                  reviewCount: prodReviews.length,
                }
              : undefined,
        };
      }
    } else if (pathname === '/evenements' && events.length > 0) {
      const evt = events[0];
      structuredData = {
        '@context': 'https://schema.org',
        '@type': 'Event',
        name: lang === 'fr' ? evt.titleFr : evt.titleEn,
        startDate: evt.eventDate,
        description: lang === 'fr' ? evt.descriptionFr : evt.descriptionEn,
        location: {
          '@type': 'Place',
          name: brand,
          address: {
            '@type': 'PostalAddress',
            addressLocality: 'Yaoundé',
            addressCountry: 'CM',
          },
        },
      };
    }

    const scriptEl = document.getElementById('boivement-jsonld');
    if (scriptEl) {
      scriptEl.textContent = JSON.stringify(structuredData);
    }
  }, [pathname, lang, settings, products, events, reviews]);

  return null;
};
