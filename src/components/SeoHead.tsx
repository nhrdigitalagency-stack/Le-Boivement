import React, { useEffect } from 'react';
import { useApp } from '../context/AppContext';

const DAY_SCHEMA_MAP: Record<number, string> = {
  1: 'https://schema.org/Monday',
  2: 'https://schema.org/Tuesday',
  3: 'https://schema.org/Wednesday',
  4: 'https://schema.org/Thursday',
  5: 'https://schema.org/Friday',
  6: 'https://schema.org/Saturday',
  0: 'https://schema.org/Sunday',
};

export const SeoHead: React.FC = () => {
  const { pathname, lang, settings, hours, categories, products, events, media, reviews } =
    useApp();

  useEffect(() => {
    const brand = settings.brandName || 'Le Boivement';
    const city = settings.city || 'Yaoundé, Cameroun';
    const neighborhood = settings.neighborhood || 'Chapelle Obili';
    const origin = window.location.origin;
    const currentUrl = `${origin}${pathname}`;

    let pageTitle = `${brand} — Restauration, Lounge & Boutique | ${city}`;
    let pageDescription =
      lang === 'fr'
        ? `${brand} à ${city} (${neighborhood}) : grillades au feu de bois, snack-bar, espace lounge, boutique en ligne et réservation de table.`
        : `${brand} in ${city} (${neighborhood}): charcoal grill dining, snack-bar, lounge, online store, and table reservations.`;
    let ogType = 'website';

    if (pathname === '/carte') {
      pageTitle =
        lang === 'fr'
          ? `La Carte & Grillades — ${brand} | ${city}`
          : `Dining & Drink Menu — ${brand} | ${city}`;
      pageDescription =
        lang === 'fr'
          ? `Consultez la carte de restauration de ${brand} à ${city} : grillades braisées, ardoises soya, boissons, cave et créations glacées.`
          : `Explore main courses, soya platters, beverages, bottle service, and artisanal ice cream at ${brand} in ${city}.`;
    } else if (pathname === '/boutique') {
      pageTitle =
        lang === 'fr'
          ? `Boutique en Ligne & Commande — ${brand} | ${city}`
          : `Online Store & Ordering — ${brand} | ${city}`;
      pageDescription =
        lang === 'fr'
          ? `Commandez en ligne vos plats braisés, ardoises lounge, boissons et casiers chez ${brand} (${neighborhood}, ${city}) avec retrait ou service.`
          : `Order charcoal-grilled dishes, soya platters, drinks, and bottle crates online from ${brand} (${neighborhood}, ${city}).`;
    } else if (pathname.startsWith('/produits/')) {
      const slug = decodeURIComponent(pathname.replace('/produits/', '').trim()).replace(
        /-demo$/i,
        ''
      );
      const prod = products.find(
        (p) =>
          p.slug === slug ||
          p.id === slug ||
          p.slug.replace(/-demo$/i, '') === slug
      );
      if (prod) {
        const name = lang === 'fr' ? prod.nameFr : prod.nameEn;
        const desc = lang === 'fr' ? prod.descriptionFr : prod.descriptionEn;
        pageTitle = `${name} — ${brand} | ${city}`;
        pageDescription = `${desc.slice(0, 135)} — ${prod.basePriceXaf} XAF chez ${brand} (${city}).`;
        ogType = 'product';
      }
    } else if (pathname === '/experience') {
      pageTitle =
        lang === 'fr'
          ? `L’Expérience Lounge, Snack-Bar & Avis Clients — ${brand}`
          : `The Lounge Experience & Customer Reviews — ${brand}`;
      pageDescription =
        lang === 'fr'
          ? `Découvrez l’univers ${brand} à ${neighborhood} (${city}) : ambiance de jour comme de nuit, espaces lounge, grillades et avis clients vérifiés.`
          : `Discover ${brand} in ${neighborhood} (${city}): day-to-night atmosphere, lounge spaces, grill dining, and verified customer reviews.`;
    } else if (pathname === '/evenements') {
      pageTitle =
        lang === 'fr'
          ? `Événements & Soirées Lounge — ${brand} | ${city}`
          : `Events & Lounge Evenings — ${brand} | ${city}`;
      pageDescription =
        lang === 'fr'
          ? `Programmation musicale, soirées lounge et événements spéciaux chez ${brand} à ${neighborhood}, ${city}.`
          : `Musical sessions, lounge nights, and special events at ${brand} in ${neighborhood}, ${city}.`;
    } else if (pathname.startsWith('/evenements/')) {
      const slug = decodeURIComponent(pathname.replace('/evenements/', '').trim());
      const evt = events.find((e) => e.slug === slug || e.id === slug);
      if (evt) {
        const title = lang === 'fr' ? evt.titleFr : evt.titleEn;
        const desc = lang === 'fr' ? evt.descriptionFr : evt.descriptionEn;
        pageTitle = `${title} — ${brand} | ${city}`;
        pageDescription = `${desc.slice(0, 140)} (${evt.eventDate} · ${evt.timeLabel})`;
      }
    } else if (pathname === '/galerie') {
      pageTitle =
        lang === 'fr'
          ? `Galerie Photo & Atmosphère — ${brand} | ${city}`
          : `Photo Gallery & Atmosphere — ${brand} | ${city}`;
      pageDescription =
        lang === 'fr'
          ? `En images : l’architecture lounge, les grillades au feu de bois, les cocktails et l’ambiance de ${brand} à ${city}.`
          : `In pictures: lounge architecture, charcoal grills, signature cocktails, and atmosphere at ${brand} in ${city}.`;
    } else if (pathname === '/reservation') {
      pageTitle =
        lang === 'fr'
          ? `Réserver une Table ou un Espace Lounge — ${brand} | ${city}`
          : `Reserve a Table or Lounge Space — ${brand} | ${city}`;
      pageDescription =
        lang === 'fr'
          ? `Réservez votre table ou salon lounge chez ${brand} à ${neighborhood}, ${city} pour vos déjeuners, dîners et soirées.`
          : `Book your table or lounge seating at ${brand} in ${neighborhood}, ${city} for lunch, dinner, or evening gatherings.`;
    } else if (pathname === '/contact') {
      pageTitle =
        lang === 'fr'
          ? `Contact, Horaires & Localisation — ${brand} | ${city}`
          : `Contact, Hours & Location — ${brand} | ${city}`;
      pageDescription =
        lang === 'fr'
          ? `Informations pratiques, horaires d’ouverture et accès à ${brand}, situé au quartier ${neighborhood} à ${city}.`
          : `Practical information, opening hours, and directions to ${brand}, located in ${neighborhood}, ${city}.`;
    } else if (pathname === '/panier') {
      pageTitle =
        lang === 'fr'
          ? `Votre Panier — ${brand} | ${city}`
          : `Your Bag — ${brand} | ${city}`;
      pageDescription =
        lang === 'fr'
          ? `Vérifiez vos articles sélectionnés et validez votre commande en ligne auprès de ${brand} à ${city}.`
          : `Review your selected items and complete your online order from ${brand} in ${city}.`;
    } else if (pathname === '/commande') {
      pageTitle =
        lang === 'fr'
          ? `Finaliser la Commande — ${brand} | ${city}`
          : `Checkout — ${brand} | ${city}`;
      pageDescription =
        lang === 'fr'
          ? `Validation sécurisée de votre commande en ligne chez ${brand} (${city}) : retrait sur place, service à table ou livraison.`
          : `Secure online order checkout at ${brand} (${city}): takeaway pickup, table service, or delivery.`;
    } else if (pathname.startsWith('/commandes/')) {
      pageTitle =
        lang === 'fr'
          ? `Suivi de Commande en Temps Réel — ${brand}`
          : `Real-Time Order Tracking — ${brand}`;
    } else if (pathname === '/connexion' || pathname === '/mon-compte') {
      pageTitle =
        lang === 'fr'
          ? `Espace Client & Suivi — ${brand} | ${city}`
          : `Customer Account & Tracking — ${brand} | ${city}`;
    } else if (pathname === '/conditions') {
      pageTitle =
        lang === 'fr'
          ? `Conditions Générales de Vente et d’Utilisation — ${brand}`
          : `Terms of Sale & Use — ${brand}`;
    } else if (pathname === '/confidentialite') {
      pageTitle =
        lang === 'fr'
          ? `Politique de Confidentialité — ${brand}`
          : `Privacy Policy — ${brand}`;
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
    setMeta('meta[property="og:url"]', 'content', currentUrl);
    setMeta('meta[property="og:type"]', 'content', ogType);
    setMeta('meta[property="og:site_name"]', 'content', `${brand} — ${city}`);
    setMeta('meta[property="og:locale"]', 'content', lang === 'fr' ? 'fr_CM' : 'en_US');
    setMeta('meta[name="twitter:title"]', 'content', pageTitle);
    setMeta('meta[name="twitter:description"]', 'content', pageDescription);

    // Canonical URL
    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    canonical.href = currentUrl;

    // Build Rich Local Business Schema.org JSON-LD
    const approvedReviews = reviews.filter((r) => r.status === 'approved');
    const avgRating =
      approvedReviews.length > 0
        ? Number(
            (
              approvedReviews.reduce((acc, r) => acc + r.rating, 0) / approvedReviews.length
            ).toFixed(1)
          )
        : 4.9;

    const openingHoursSpecification = hours
      .filter((h) => !h.isClosed)
      .map((h) => ({
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: DAY_SCHEMA_MAP[h.dayOfWeek] || 'https://schema.org/Monday',
        opens: h.openTime || '11:30',
        closes: h.closeTime || '02:00',
      }));

    const localBusinessNode: Record<string, any> = {
      '@type': ['Restaurant', 'BarOrPub', 'NightClub', 'LocalBusiness'],
      '@id': `${origin}/#establishment`,
      name: brand,
      description: pageDescription,
      url: origin,
      image: media.map((m) => m.imageUrl).filter(Boolean),
      address: {
        '@type': 'PostalAddress',
        streetAddress: settings.exactAddress || `Quartier ${neighborhood}`,
        addressLocality: 'Yaoundé',
        addressRegion: 'Centre',
        addressCountry: 'CM',
      },
      geo: {
        '@type': 'GeoCoordinates',
        latitude: 3.8578,
        longitude: 11.4914,
      },
      areaServed: {
        '@type': 'City',
        name: 'Yaoundé',
      },
      servesCuisine: ['Camerounaise', 'Grillades au feu de bois', 'Lounge & Tapas', 'Glacier'],
      priceRange: 'XAF',
      currenciesAccepted: 'XAF',
      paymentAccepted: 'Cash, Mobile Money, Orange Money, MTN MoMo',
      acceptsReservations: settings.reservationsEnabled,
      hasMenu: `${origin}/carte`,
      openingHoursSpecification,
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
      review: approvedReviews.slice(0, 5).map((r) => ({
        '@type': 'Review',
        author: {
          '@type': 'Person',
          name: r.customerName,
        },
        datePublished: r.createdAt.slice(0, 10),
        reviewBody: r.comment,
        reviewRating: {
          '@type': 'Rating',
          ratingValue: r.rating,
          bestRating: 5,
          worstRating: 1,
        },
      })),
    };

    const breadcrumbItems = [
      {
        '@type': 'ListItem',
        position: 1,
        name: brand,
        item: origin,
      },
    ];
    if (pathname !== '/') {
      breadcrumbItems.push({
        '@type': 'ListItem',
        position: 2,
        name: pageTitle.split('—')[0].trim(),
        item: currentUrl,
      });
    }

    const breadcrumbNode = {
      '@type': 'BreadcrumbList',
      itemListElement: breadcrumbItems,
    };

    const graphNodes: Record<string, any>[] = [localBusinessNode, breadcrumbNode];

    if (pathname === '/carte' || pathname === '/boutique') {
      graphNodes.push({
        '@type': 'Menu',
        '@id': `${origin}/carte#menu`,
        name: lang === 'fr' ? `Carte & Catalogue ${brand}` : `${brand} Menu & Catalog`,
        url: `${origin}/carte`,
        hasMenuSection: categories.map((cat) => ({
          '@type': 'MenuSection',
          name: lang === 'fr' ? cat.nameFr : cat.nameEn,
          description: lang === 'fr' ? cat.descriptionFr : cat.descriptionEn,
          hasMenuItem: products
            .filter((p) => p.categoryId === cat.id)
            .map((p) => ({
              '@type': 'MenuItem',
              name: lang === 'fr' ? p.nameFr : p.nameEn,
              description: lang === 'fr' ? p.descriptionFr : p.descriptionEn,
              offers: {
                '@type': 'Offer',
                price: p.basePriceXaf,
                priceCurrency: 'XAF',
              },
            })),
        })),
      });
    } else if (pathname.startsWith('/produits/')) {
      const slug = decodeURIComponent(pathname.replace('/produits/', '').trim()).replace(
        /-demo$/i,
        ''
      );
      const prod = products.find(
        (p) =>
          p.slug === slug ||
          p.id === slug ||
          p.slug.replace(/-demo$/i, '') === slug
      );
      if (prod) {
        const prodReviews = approvedReviews.filter((r) => r.productId === prod.id);
        graphNodes.push({
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
            url: currentUrl,
            seller: {
              '@id': `${origin}/#establishment`,
            },
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
                  bestRating: 5,
                  worstRating: 1,
                }
              : undefined,
        });
      }
    } else if (pathname === '/evenements' || pathname.startsWith('/evenements/')) {
      events.forEach((evt) => {
        graphNodes.push({
          '@type': 'Event',
          name: lang === 'fr' ? evt.titleFr : evt.titleEn,
          startDate: evt.eventDate,
          eventStatus: 'https://schema.org/EventScheduled',
          eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
          description: lang === 'fr' ? evt.descriptionFr : evt.descriptionEn,
          location: {
            '@type': 'Place',
            name: brand,
            address: {
              '@type': 'PostalAddress',
              streetAddress: settings.exactAddress || `Quartier ${neighborhood}`,
              addressLocality: 'Yaoundé',
              addressCountry: 'CM',
            },
          },
          organizer: {
            '@id': `${origin}/#establishment`,
          },
        });
      });
    }

    const structuredData = {
      '@context': 'https://schema.org',
      '@graph': graphNodes,
    };

    const scriptEl = document.getElementById('boivement-jsonld');
    if (scriptEl) {
      scriptEl.textContent = JSON.stringify(structuredData);
    }
  }, [pathname, lang, settings, hours, categories, products, events, media, reviews]);

  return null;
};
