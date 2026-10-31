import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  Users,
  CheckCircle2,
  AlertCircle,
  MapPin,
  Phone,
  Mail,
  MessageCircle,
  ChevronLeft,
  ChevronRight,
  X,
  ShieldCheck,
  UserCheck,
  ArrowLeft,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { translations, formatXaf, formatDateTime } from '../i18n/translations';
import { GraphicVisualSlot } from '../components/VisualComposition';
import { CustomerReviewsSection } from '../components/CustomerReviewsSection';
import { Order, ReservationRecord, StaffRole } from '../types/domain';

export const ReservationPage: React.FC = () => {
  const { lang, settings, authUser, backendOnline, navigate } = useApp();
  const t = translations[lang];

  const [customerName, setCustomerName] = useState(authUser?.fullName || '');
  const [customerPhone, setCustomerPhone] = useState(authUser?.phone || '');
  const [reservationDate, setReservationDate] = useState(() => {
    const tomorrow = new Date(Date.now() + 86400000);
    return tomorrow.toISOString().slice(0, 10);
  });
  const [reservationTime, setReservationTime] = useState('20:00');
  const [partySize, setPartySize] = useState(4);
  const [spaceType, setSpaceType] = useState('Lounge & Restauration');
  const [customerMessage, setCustomerMessage] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [recordedReservation, setRecordedReservation] = useState<ReservationRecord | null>(null);

  if (!settings.reservationsEnabled) {
    return (
      <div className="min-h-screen pt-32 pb-20 bg-[#101014] text-[#FAF7F2] px-4">
        <div className="max-w-xl mx-auto bg-[#1C1C23] border border-white/10 rounded-xl p-8 text-center space-y-4">
          <h1 className="font-serif-display text-3xl">Réservations désactivées</h1>
          <p className="text-xs text-[#AAA6A1]">
            Le module de demande de réservation est actuellement désactivé par l’établissement.
          </p>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!backendOnline) {
      setErrorMsg(t.badges.backendOffline);
      return;
    }
    setSubmitting(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName,
          customerPhone,
          reservationDate,
          reservationTime,
          partySize,
          spaceType,
          customerMessage,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Impossible d’enregistrer la demande.');
      setRecordedReservation(data.reservation);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen pt-28 pb-20 bg-[#101014] text-[#FAF7F2]">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="pb-8 border-b border-white/10">
          <p className="text-xs uppercase tracking-widest text-[#D8B77B] mb-2">
            {settings.brandName} · ACCUEIL & TABLES
          </p>
          <h1 className="font-serif-display text-4xl font-semibold text-[#FAF7F2]">
            {t.reservation.title}
          </h1>
          <p className="text-xs text-[#AAA6A1] mt-2 leading-relaxed">{t.reservation.subtitle}</p>
        </div>

        {recordedReservation ? (
          <div className="mt-8 bg-[#1C1C23] border border-[#D8B77B] rounded-xl p-8 space-y-5">
            <div className="flex items-center gap-3 text-[#D8B77B]">
              <CheckCircle2 className="w-6 h-6 shrink-0" />
              <h2 className="font-serif-display text-2xl font-semibold text-[#FAF7F2]">
                Votre demande a été enregistrée. Elle sera confirmée par l’établissement.
              </h2>
            </div>

            <div className="bg-[#101014] border border-white/10 rounded-lg p-5 space-y-2 text-xs font-mono-tabular">
              <div className="flex justify-between">
                <span className="text-[#AAA6A1]">Référence de demande :</span>
                <span className="text-[#D8B77B] font-semibold">{recordedReservation.reference}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#AAA6A1]">Statut initial :</span>
                <span className="uppercase text-amber-300">{recordedReservation.status} (En attente)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#AAA6A1]">Date & Créneau :</span>
                <span>
                  {recordedReservation.reservationDate} · {recordedReservation.reservationTime}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#AAA6A1]">Convives :</span>
                <span>{recordedReservation.partySize} personne(s)</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 pt-2">
              <button
                type="button"
                onClick={() => setRecordedReservation(null)}
                className="px-4 py-2 text-xs border border-white/15 rounded-md hover:bg-white/5"
              >
                Nouvelle demande
              </button>
              <button
                type="button"
                onClick={() => navigate('/carte')}
                className="px-4 py-2 text-xs bg-[#D8B77B] text-[#101014] font-semibold rounded-md"
              >
                Consulter la carte
              </button>
            </div>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="mt-8 bg-[#1C1C23] border border-white/10 rounded-xl p-6 sm:p-8 space-y-5"
          >
            {errorMsg && (
              <div className="p-3.5 bg-red-950/70 border border-red-500/50 rounded-lg text-xs text-red-200">
                {errorMsg}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-[#AAA6A1] mb-1.5">
                  {t.checkout.fullName}
                </label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#101014] border border-white/15 rounded-lg text-sm text-[#FAF7F2]"
                />
              </div>
              <div>
                <label className="block text-xs text-[#AAA6A1] mb-1.5">
                  {t.checkout.phone}
                </label>
                <input
                  type="tel"
                  required
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="+237 6..."
                  className="w-full px-3.5 py-2.5 bg-[#101014] border border-white/15 rounded-lg text-sm font-mono-tabular text-[#FAF7F2]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs text-[#AAA6A1] mb-1.5">{t.reservation.date}</label>
                <input
                  type="date"
                  required
                  value={reservationDate}
                  onChange={(e) => setReservationDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#101014] border border-white/15 rounded-lg text-sm font-mono-tabular text-[#FAF7F2]"
                />
              </div>
              <div>
                <label className="block text-xs text-[#AAA6A1] mb-1.5">{t.reservation.time}</label>
                <select
                  value={reservationTime}
                  onChange={(e) => setReservationTime(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#101014] border border-white/15 rounded-lg text-sm font-mono-tabular text-[#FAF7F2]"
                >
                  <option value="12:30">12:30</option>
                  <option value="14:00">14:00</option>
                  <option value="18:30">18:30</option>
                  <option value="20:00">20:00</option>
                  <option value="21:30">21:30</option>
                  <option value="23:00">23:00</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-[#AAA6A1] mb-1.5">
                  {t.reservation.guests}
                </label>
                <input
                  type="number"
                  min={1}
                  max={40}
                  required
                  value={partySize}
                  onChange={(e) => setPartySize(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 bg-[#101014] border border-white/15 rounded-lg text-sm font-mono-tabular text-[#FAF7F2]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-[#AAA6A1] mb-1.5">{t.reservation.space}</label>
              <select
                value={spaceType}
                onChange={(e) => setSpaceType(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#101014] border border-white/15 rounded-lg text-sm text-[#FAF7F2]"
              >
                <option value="Lounge & Restauration">Lounge & Restauration</option>
                <option value="Espace Snack-Bar">Espace Snack-Bar</option>
                {settings.spacesValidation.glacier === 'validated' && (
                  <option value="Espace Glacier">Espace Glacier</option>
                )}
              </select>
              <p className="text-[11px] text-[#AAA6A1] mt-1">
                Capacité maximale configurée par créneau : {settings.maxReservationCapacityPerSlot}{' '}
                convives. Aucun tarif de privatisation n’est inventé.
              </p>
            </div>

            <div>
              <label className="block text-xs text-[#AAA6A1] mb-1.5">
                {t.reservation.message}
              </label>
              <textarea
                rows={3}
                value={customerMessage}
                onChange={(e) => setCustomerMessage(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#101014] border border-white/15 rounded-lg text-sm text-[#FAF7F2]"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 px-6 bg-[#D8B77B] text-[#101014] font-semibold text-sm rounded-lg hover:bg-[#e3c68f] transition-colors"
            >
              {submitting ? 'Enregistrement...' : t.reservation.submit}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export const ExperiencePage: React.FC = () => {
  const { lang, settings, navigate } = useApp();
  const t = translations[lang];

  const items = [
    {
      titleFr: 'Espace Lounge & Rencontres',
      titleEn: 'Lounge & Gathering Space',
      status: settings.spacesValidation.lounge,
      descFr:
        'Atmosphère soignée propice aux échanges en journée comme en soirée, avec service attentif et sélection de boissons.',
      descEn:
        'Thoughtfully designed atmosphere for afternoon and evening gatherings with attentive table service.',
    },
    {
      titleFr: 'Snack-Bar & Restauration',
      titleEn: 'Snack-Bar & Dining',
      status: settings.spacesValidation.snackBar,
      descFr:
        'Grillades, spécialités locales et ardoises à partager, disponibles sur place ou en retrait à emporter.',
      descEn:
        'Charcoal grills, local specialties, and sharing platters available for dine-in or takeaway pickup.',
    },
    {
      titleFr: 'Glacier',
      titleEn: 'Ice Cream Parlor',
      status: settings.spacesValidation.glacier,
      descFr:
        'Indication issue d’une fiche publique. Activation et carte dédiée soumises à confirmation officielle.',
      descEn:
        'Indication from public listing. Activation and dedicated menu subject to official confirmation.',
    },
    {
      titleFr: 'Nightclub & Programmation Nocturne',
      titleEn: 'Nightclub & Late-Night Programming',
      status: settings.spacesValidation.nightclub,
      descFr:
        'Indication issue d’une fiche publique. Horaires nocturnes et conditions d’accès en attente de validation par la direction.',
      descEn:
        'Indication from public listing. Late-night hours and access conditions awaiting management validation.',
    },
    {
      titleFr: 'Piscine',
      titleEn: 'Pool Area',
      status: settings.spacesValidation.pool,
      descFr:
        'Indication issue d’une fiche publique. Aucune modalité d’accès ni tarif piscine n’est publié sans validation formelle.',
      descEn:
        'Indication from public listing. No pool access rule or fee is published without formal validation.',
    },
  ];

  return (
    <div className="min-h-screen pt-28 pb-20 bg-[#101014] text-[#FAF7F2]">
      <div className="max-w-[1140px] mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="border-b border-white/10 pb-8">
          <p className="text-xs uppercase tracking-widest text-[#D8B77B] mb-2">
            IDENTITÉ & CADRAGE OPÉRATIONNEL
          </p>
          <h1 className="font-serif-display text-4xl sm:text-5xl font-semibold">
            {t.nav.experience} — {settings.brandName}
          </h1>
          <p className="text-sm text-[#AAA6A1] mt-3 max-w-2xl leading-relaxed">
            {t.home.presentationBody}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {items.map((item, idx) => (
            <div
              key={idx}
              className={`rounded-xl p-6 border ${
                item.status === 'validated'
                  ? 'bg-[#1C1C23] border-[#D8B77B]/35'
                  : 'bg-[#1C1C23]/40 border-white/10'
              }`}
            >
              <div className="flex items-center justify-between text-xs mb-3">
                <span className="font-mono-tabular text-[#AAA6A1]">0{idx + 1}</span>
                <span
                  className={
                    item.status === 'validated' ? 'text-[#D8B77B] font-semibold' : 'text-[#AAA6A1]'
                  }
                >
                  {item.status === 'validated' ? t.badges.validated : t.badges.toConfirm}
                </span>
              </div>
              <h2 className="font-serif-display text-2xl font-semibold text-[#FAF7F2]">
                {lang === 'fr' ? item.titleFr : item.titleEn}
              </h2>
              <p className="text-xs text-[#AAA6A1] mt-2 leading-relaxed">
                {lang === 'fr' ? item.descFr : item.descEn}
              </p>
            </div>
          ))}
        </div>

        {/* Approved & Moderated Customer Reviews for the Venue Experience */}
        <CustomerReviewsSection targetType="experience" />

        <div className="bg-[#1C1C23] border border-white/10 rounded-xl p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="font-serif-display text-2xl font-semibold">
              {lang === 'fr'
                ? 'Vous êtes le propriétaire ou le gérant autorisé ?'
                : 'Are you the owner or authorized manager?'}
            </h3>
            <p className="text-xs text-[#AAA6A1]">
              {lang === 'fr'
                ? 'Validez ou désactivez chaque espace et modérez les avis directement depuis l’administration.'
                : 'Validate or toggle each space and moderate customer reviews directly from the Admin portal.'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/admin')}
            className="px-5 py-2.5 bg-[#D8B77B] text-[#101014] font-semibold text-xs rounded-md whitespace-nowrap"
          >
            Accéder à l’Administration →
          </button>
        </div>
      </div>
    </div>
  );
};

export const EventsPage: React.FC = () => {
  const { lang, events, navigate, settings } = useApp();
  const t = translations[lang];

  return (
    <div className="min-h-screen pt-28 pb-20 bg-[#101014] text-[#FAF7F2]">
      <div className="max-w-[1140px] mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        <div className="border-b border-white/10 pb-8">
          <p className="text-xs uppercase tracking-widest text-[#D8B77B] mb-2">
            PROGRAMMATION & SOIRÉES
          </p>
          <h1 className="font-serif-display text-4xl sm:text-5xl font-semibold">
            {t.nav.events}
          </h1>
          <p className="text-xs text-[#AAA6A1] mt-2">
            Aucun artiste ni invité n’est annoncé sans confirmation officielle. Billetterie en ligne :{' '}
            {settings.ticketingEnabled ? 'Activée' : 'Désactivée par défaut (réservation de table distincte d’un billet d’entrée).'}
          </p>
        </div>

        {events.length === 0 ? (
          <div className="bg-[#1C1C23] border border-white/10 rounded-xl p-12 text-center text-sm text-[#AAA6A1]">
            Aucun événement publié pour le moment.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {events.map((evt) => (
              <div
                key={evt.id}
                className="bg-[#1C1C23] border border-white/10 rounded-xl overflow-hidden flex flex-col justify-between"
              >
                <div>
                  <GraphicVisualSlot
                    theme={evt.visualTheme}
                    title={lang === 'fr' ? evt.titleFr : evt.titleEn}
                    subtitle={`${evt.eventDate} · ${evt.timeLabel}`}
                    isDemo={evt.validationStatus !== 'validated'}
                    lang={lang}
                  />
                  <div className="p-6 space-y-3">
                    <div className="flex items-center gap-2 text-xs font-mono-tabular text-[#D8B77B]">
                      <span>{evt.eventDate}</span>
                      <span aria-hidden="true">·</span>
                      <span>{evt.timeLabel}</span>
                      <span aria-hidden="true">·</span>
                      <span className="text-[#AAA6A1]">
                        {evt.validationStatus === 'validated' ? t.badges.validated : t.badges.toConfirm}
                      </span>
                    </div>
                    <h2 className="font-serif-display text-2xl font-semibold text-[#FAF7F2]">
                      {lang === 'fr' ? evt.titleFr : evt.titleEn}
                    </h2>
                    <p className="text-xs text-[#AAA6A1] leading-relaxed">
                      {lang === 'fr' ? evt.descriptionFr : evt.descriptionEn}
                    </p>
                  </div>
                </div>
                <div className="px-6 pb-6 pt-4 border-t border-white/10 flex items-center justify-between">
                  <span className="text-xs text-[#AAA6A1]">
                    {evt.validatedPriceXaf !== null
                      ? formatXaf(evt.validatedPriceXaf, lang)
                      : 'Tarif / accès à confirmer'}
                  </span>
                  <button
                    type="button"
                    onClick={() => navigate(`/evenements/${evt.slug}`)}
                    className="px-4 py-2 bg-[#D8B77B] text-[#101014] font-semibold text-xs rounded-md"
                  >
                    Voir la fiche →
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export const EventDetailPage: React.FC<{ slug: string }> = ({ slug }) => {
  const { lang, events, navigate, settings } = useApp();
  const t = translations[lang];
  const evt = events.find((e) => e.slug === slug);

  if (!evt) {
    return (
      <div className="min-h-screen pt-32 pb-20 bg-[#101014] text-[#FAF7F2] px-4 text-center">
        <p className="text-base mb-4">Événement introuvable.</p>
        <button
          type="button"
          onClick={() => navigate('/evenements')}
          className="px-5 py-2.5 bg-[#D8B77B] text-[#101014] text-xs font-semibold rounded-md"
        >
          Retour aux événements
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-28 pb-20 bg-[#101014] text-[#FAF7F2]">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <button
          type="button"
          onClick={() => navigate('/evenements')}
          className="inline-flex items-center gap-2 text-xs text-[#AAA6A1] hover:text-[#D8B77B]"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Retour aux événements</span>
        </button>

        <div className="bg-[#1C1C23] border border-white/10 rounded-xl overflow-hidden">
          <GraphicVisualSlot
            theme={evt.visualTheme}
            title={lang === 'fr' ? evt.titleFr : evt.titleEn}
            subtitle={`${evt.eventDate} · ${evt.timeLabel}`}
            isDemo={evt.validationStatus !== 'validated'}
            lang={lang}
            className="aspect-[16/9]"
          />
          <div className="p-6 sm:p-8 space-y-5">
            <div className="flex flex-wrap items-center gap-2 text-xs font-mono-tabular text-[#D8B77B]">
              <span>{evt.eventDate}</span>
              <span aria-hidden="true">·</span>
              <span>{evt.timeLabel}</span>
              <span aria-hidden="true">·</span>
              <span className="text-[#AAA6A1]">
                {evt.validationStatus === 'validated' ? t.badges.validated : t.badges.toConfirm}
              </span>
            </div>

            <h1 className="font-serif-display text-3xl sm:text-4xl font-semibold">
              {lang === 'fr' ? evt.titleFr : evt.titleEn}
            </h1>

            <p className="text-sm text-[#FAF7F2]/90 leading-relaxed">
              {lang === 'fr' ? evt.descriptionFr : evt.descriptionEn}
            </p>

            <div className="bg-[#101014] border border-white/10 rounded-lg p-4 space-y-2 text-xs">
              <p>
                <strong className="text-[#D8B77B]">Artistes confirmés :</strong>{' '}
                {evt.confirmedArtists.length > 0
                  ? evt.confirmedArtists.join(', ')
                  : 'Aucun artiste annoncé sans confirmation officielle.'}
              </p>
              <p>
                <strong className="text-[#D8B77B]">Conditions d’accès :</strong>{' '}
                {lang === 'fr' ? evt.accessConditionsFr : evt.accessConditionsEn}
              </p>
              <p className="text-[#AAA6A1]">
                Note importante : La billetterie est désactivée par défaut. Une demande de
                réservation de table ne constitue pas un billet d’entrée payé.
              </p>
            </div>

            {settings.reservationsEnabled && (
              <button
                type="button"
                onClick={() => navigate('/reservation')}
                className="px-6 py-3 bg-[#D8B77B] text-[#101014] font-semibold text-xs rounded-md"
              >
                Demander une réservation de table
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export const GalleryPage: React.FC = () => {
  const { lang, media } = useApp();
  const t = translations[lang];
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [catFilter, setCatFilter] = useState<string>('all');

  const filteredMedia =
    catFilter === 'all' ? media : media.filter((m) => m.category === catFilter);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (selectedIndex === null) return;
      if (e.key === 'Escape') setSelectedIndex(null);
      if (e.key === 'ArrowRight') {
        setSelectedIndex((prev) =>
          prev === null ? null : (prev + 1) % filteredMedia.length
        );
      }
      if (e.key === 'ArrowLeft') {
        setSelectedIndex((prev) =>
          prev === null
            ? null
            : (prev - 1 + filteredMedia.length) % filteredMedia.length
        );
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [selectedIndex, filteredMedia.length]);

  const activeItem = selectedIndex !== null ? filteredMedia[selectedIndex] : null;

  return (
    <div className="min-h-screen pt-28 pb-20 bg-[#101014] text-[#FAF7F2]">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="border-b border-white/10 pb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-widest text-[#D8B77B] mb-2">
              MÉDIAS APPROUVÉS PAR LE PERSONNEL
            </p>
            <h1 className="font-serif-display text-4xl sm:text-5xl font-semibold">
              {t.nav.gallery}
            </h1>
            <p className="text-xs text-[#AAA6A1] mt-2">
              Les contributions anonymes sont désactivées. Cliquez sur un visuel pour ouvrir la
              visionneuse (navigation au clavier ← → et Échap).
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {['all', 'identite', 'lounge', 'gastronomie', 'ambiance'].map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => {
                  setCatFilter(c);
                  setSelectedIndex(null);
                }}
                className={`px-3 py-1.5 text-xs rounded-md capitalize ${
                  catFilter === c
                    ? 'bg-[#D8B77B] text-[#101014] font-semibold'
                    : 'bg-[#1C1C23] text-[#AAA6A1] hover:text-white'
                }`}
              >
                {c === 'all' ? 'Tous' : c}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMedia.map((item, idx) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setSelectedIndex(idx)}
              className="text-left bg-[#1C1C23] border border-white/10 hover:border-[#D8B77B]/50 rounded-xl overflow-hidden transition-all focus-visible:outline-2 focus-visible:outline-[#D8B77B]"
            >
              <GraphicVisualSlot
                theme={item.visualTheme}
                title={lang === 'fr' ? item.titleFr : item.titleEn}
                subtitle={lang === 'fr' ? item.captionFr : item.captionEn}
                imageUrl={item.imageUrl}
                isDemo={item.isDemoGraphic}
                lang={lang}
              />
              <div className="p-4">
                <p className="text-sm font-semibold text-[#FAF7F2]">
                  {lang === 'fr' ? item.titleFr : item.titleEn}
                </p>
                <p className="text-xs text-[#AAA6A1] mt-1 line-clamp-2">
                  {lang === 'fr' ? item.captionFr : item.captionEn}
                </p>
              </div>
            </button>
          ))}
        </div>

        {/* Lightbox Modal with Keyboard Navigation & Thumbnails */}
        {activeItem && selectedIndex !== null && (
          <div
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-4"
            onClick={() => setSelectedIndex(null)}
          >
            <div
              className="w-full max-w-4xl bg-[#1C1C23] border border-white/15 rounded-xl overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-5 py-3 border-b border-white/10">
                <span className="text-xs font-mono-tabular text-[#AAA6A1]">
                  {selectedIndex + 1} / {filteredMedia.length}
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedIndex(null)}
                  className="p-1.5 text-[#AAA6A1] hover:text-white"
                  aria-label="Fermer la visionneuse"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="relative">
                <GraphicVisualSlot
                  theme={activeItem.visualTheme}
                  title={lang === 'fr' ? activeItem.titleFr : activeItem.titleEn}
                  subtitle={lang === 'fr' ? activeItem.captionFr : activeItem.captionEn}
                  imageUrl={activeItem.imageUrl}
                  isDemo={activeItem.isDemoGraphic}
                  lang={lang}
                  className="aspect-[16/9]"
                />
                <button
                  type="button"
                  onClick={() =>
                    setSelectedIndex(
                      (selectedIndex - 1 + filteredMedia.length) % filteredMedia.length
                    )
                  }
                  className="absolute left-3 top-1/2 -translate-y-1/2 p-2.5 bg-black/70 text-white rounded-full hover:bg-[#D8B77B] hover:text-black"
                  aria-label="Image précédente"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setSelectedIndex((selectedIndex + 1) % filteredMedia.length)
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 bg-black/70 text-white rounded-full hover:bg-[#D8B77B] hover:text-black"
                  aria-label="Image suivante"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>

              <div className="p-5 space-y-4">
                <div>
                  <h2 className="font-serif-display text-2xl font-semibold text-[#FAF7F2]">
                    {lang === 'fr' ? activeItem.titleFr : activeItem.titleEn}
                  </h2>
                  <p className="text-xs text-[#AAA6A1] mt-1">
                    {lang === 'fr' ? activeItem.captionFr : activeItem.captionEn}
                  </p>
                </div>

                {/* Thumbnails */}
                <div className="flex items-center gap-2 overflow-x-auto pt-2 border-t border-white/10">
                  {filteredMedia.map((thumb, i) => (
                    <button
                      key={thumb.id}
                      type="button"
                      onClick={() => setSelectedIndex(i)}
                      className={`px-3 py-1.5 rounded text-xs whitespace-nowrap border ${
                        i === selectedIndex
                          ? 'border-[#D8B77B] bg-[#101014] text-[#D8B77B]'
                          : 'border-white/10 text-[#AAA6A1]'
                      }`}
                    >
                      {i + 1}. {lang === 'fr' ? thumb.titleFr.slice(0, 22) : thumb.titleEn.slice(0, 22)}...
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export const ContactPage: React.FC = () => {
  const { lang, settings, hours, navigate } = useApp();
  const t = translations[lang];

  return (
    <div className="min-h-screen pt-28 pb-20 bg-[#101014] text-[#FAF7F2]">
      <div className="max-w-[1140px] mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        <div className="border-b border-white/10 pb-8">
          <p className="text-xs uppercase tracking-widest text-[#D8B77B] mb-2">
            COORDONNÉES & ACCÈS
          </p>
          <h1 className="font-serif-display text-4xl sm:text-5xl font-semibold">
            {t.nav.contact}
          </h1>
          <p className="text-xs text-[#AAA6A1] mt-2">
            Conformément aux règles d’intégrité du projet, aucun numéro de téléphone, compte
            WhatsApp ou adresse précise n’est inventé. Seuls les canaux renseignés par
            l’établissement sont activés.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-[#1C1C23] border border-white/10 rounded-xl p-6 sm:p-8 space-y-6">
            <h2 className="font-serif-display text-2xl font-semibold text-[#FAF7F2]">
              Localisation & Canaux configurés
            </h2>

            <div className="space-y-4 text-sm">
              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-[#D8B77B] mt-1 shrink-0" />
                <div>
                  <p className="font-medium text-[#FAF7F2]">{settings.city}</p>
                  <p className="text-xs text-[#AAA6A1]">
                    Quartier indiqué (fiche publique) : {settings.neighborhood || 'Chapelle Obili'} (
                    {settings.neighborhoodValidated ? t.badges.validated : t.badges.toConfirm})
                  </p>
                  {settings.exactAddress ? (
                    <p className="text-xs text-[#FAF7F2] mt-1">{settings.exactAddress}</p>
                  ) : (
                    <p className="text-xs text-[#AAA6A1] mt-1">
                      Adresse précise et coordonnées GPS en attente de configuration.
                    </p>
                  )}
                </div>
              </div>

              {settings.phone && (
                <div className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-[#D8B77B] shrink-0" />
                  <a
                    href={`tel:${settings.phone}`}
                    className="font-mono-tabular text-sm text-[#FAF7F2] hover:text-[#D8B77B]"
                  >
                    {settings.phone}
                  </a>
                </div>
              )}

              {settings.whatsapp && (
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <MessageCircle className="w-4 h-4 text-[#D8B77B] shrink-0" />
                    <a
                      href={`https://wa.me/${settings.whatsapp.replace(/[^0-9]/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono-tabular text-sm text-[#D8B77B] hover:underline"
                    >
                      WhatsApp : {settings.whatsapp}
                    </a>
                  </div>
                  <p className="text-[11px] text-[#AAA6A1] pl-7">
                    WhatsApp permet de poser une question ou de communiquer une référence de commande,
                    mais ne constitue ni un paiement ni une réservation confirmée.
                  </p>
                </div>
              )}

              {settings.email && (
                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-[#D8B77B] shrink-0" />
                  <a
                    href={`mailto:${settings.email}`}
                    className="text-sm text-[#FAF7F2] hover:text-[#D8B77B]"
                  >
                    {settings.email}
                  </a>
                </div>
              )}

              {!settings.phone && !settings.whatsapp && !settings.email && (
                <div className="p-4 bg-[#101014] border border-white/10 rounded-lg text-xs text-[#AAA6A1]">
                  Aucun numéro de téléphone ou compte WhatsApp officiel n’a encore été saisi dans les
                  paramètres. Le propriétaire peut les ajouter à tout moment dans{' '}
                  <button
                    type="button"
                    onClick={() => navigate('/admin')}
                    className="text-[#D8B77B] underline"
                  >
                    Administration → Paramètres
                  </button>
                  .
                </div>
              )}
            </div>
          </div>

          <div className="bg-[#1C1C23] border border-white/10 rounded-xl p-6 sm:p-8 space-y-6">
            <h2 className="font-serif-display text-2xl font-semibold text-[#FAF7F2]">
              Horaires d’ouverture
            </h2>
            <div className="space-y-2.5 text-xs">
              {hours.map((h) => (
                <div
                  key={h.dayOfWeek}
                  className="flex items-center justify-between py-2 border-b border-white/5"
                >
                  <span className="text-[#FAF7F2]">{lang === 'fr' ? h.labelFr : h.labelEn}</span>
                  <span className="font-mono-tabular text-[#AAA6A1]">
                    {h.isClosed
                      ? 'Fermé'
                      : h.openTime && h.closeTime
                      ? `${h.openTime} – ${h.closeTime}`
                      : t.badges.toConfirm}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const LoginPage: React.FC = () => {
  const { loginAsStaff, loginAsCustomer, navigate, authUser, logout } = useApp();
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const staffRoles: { role: StaffRole; title: string; desc: string }[] = [
    {
      role: 'owner',
      title: 'Propriétaire (Accès complet)',
      desc: 'Accès total : coûts d’achat privés, marges, paramètres, rôles, stocks, commandes et audit.',
    },
    {
      role: 'manager',
      title: 'Gestionnaire Opérationnel',
      desc: 'Gestion complète des stocks, inventaires, coûts, commandes, paiements et réservations.',
    },
    {
      role: 'stock_manager',
      title: 'Responsable Stock & Cave',
      desc: 'Accès aux stocks, mouvements, réceptions fournisseurs, inventaires et coûts d’achat.',
    },
    {
      role: 'order_staff',
      title: 'Personnel Commandes & Caisse POS',
      desc: 'Traitement des commandes, ventes au comptoir et réservations (coûts d’achat privés masqués côté serveur).',
    },
    {
      role: 'content_manager',
      title: 'Gestionnaire de Contenu',
      desc: 'Édition du catalogue, des événements et de la galerie (aucun accès aux données financières ni aux stocks).',
    },
  ];

  const handleStaffLogin = async (role: StaffRole) => {
    setErrorMsg(null);
    try {
      await loginAsStaff(role);
      navigate('/admin');
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  const handleCustomerLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    try {
      await loginAsCustomer(customerName, customerPhone, customerEmail);
      navigate('/mon-compte');
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  return (
    <div className="min-h-screen pt-28 pb-20 bg-[#101014] text-[#FAF7F2]">
      <div className="max-w-[1140px] mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        <div className="border-b border-white/10 pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-widest text-[#D8B77B] mb-2">
              AUTHENTIFICATION & CONTRÔLE D’ACCÈS RBAC
            </p>
            <h1 className="font-serif-display text-4xl font-semibold">
              Connexion Client & Portail Personnel
            </h1>
          </div>
          {authUser && (
            <div className="flex items-center gap-3 bg-[#1C1C23] border border-[#D8B77B]/40 px-4 py-2 rounded-lg text-xs">
              <span>
                Connecté : <strong className="text-[#D8B77B]">{authUser.fullName}</strong>
              </span>
              <button
                type="button"
                onClick={logout}
                className="text-red-400 hover:underline font-medium"
              >
                Déconnexion
              </button>
            </div>
          )}
        </div>

        {errorMsg && (
          <div className="p-4 bg-red-950/70 border border-red-500/50 rounded-xl text-xs text-red-200">
            {errorMsg}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Customer Session */}
          <div className="lg:col-span-5 bg-[#1C1C23] border border-white/10 rounded-xl p-6 sm:p-8 space-y-5">
            <div className="flex items-center gap-2.5 text-[#D8B77B]">
              <UserCheck className="w-5 h-5" />
              <h2 className="font-serif-display text-2xl font-semibold text-[#FAF7F2]">
                Espace Client (Suivi & Historique)
              </h2>
            </div>
            <p className="text-xs text-[#AAA6A1]">
              Retrouvez vos commandes enregistrées et vos demandes de réservation.
            </p>
            <form onSubmit={handleCustomerLogin} className="space-y-4">
              <div>
                <label className="block text-xs text-[#AAA6A1] mb-1">Nom complet *</label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Ex: Franck Ndongo"
                  className="w-full px-3.5 py-2.5 bg-[#101014] border border-white/15 rounded-lg text-sm text-[#FAF7F2]"
                />
              </div>
              <div>
                <label className="block text-xs text-[#AAA6A1] mb-1">Téléphone *</label>
                <input
                  type="tel"
                  required
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="+237 6..."
                  className="w-full px-3.5 py-2.5 bg-[#101014] border border-white/15 rounded-lg text-sm font-mono-tabular text-[#FAF7F2]"
                />
              </div>
              <div>
                <label className="block text-xs text-[#AAA6A1] mb-1">E-mail (facultatif)</label>
                <input
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#101014] border border-white/15 rounded-lg text-sm text-[#FAF7F2]"
                />
              </div>
              <button
                type="submit"
                className="w-full py-3 bg-[#D8B77B] text-[#101014] font-semibold text-xs rounded-lg"
              >
                Accéder à mon historique client
              </button>
            </form>
          </div>

          {/* 5 Staff Roles RBAC Switcher for Verification */}
          <div className="lg:col-span-7 bg-[#1C1C23] border border-white/10 rounded-xl p-6 sm:p-8 space-y-5">
            <div className="flex items-center gap-2.5 text-[#D8B77B]">
              <ShieldCheck className="w-5 h-5" />
              <h2 className="font-serif-display text-2xl font-semibold text-[#FAF7F2]">
                Portail Personnel — Sélection de Rôle (RBAC Serveur)
              </h2>
            </div>
            <p className="text-xs text-[#AAA6A1]">
              Sélectionnez l’un des 5 rôles opérationnels pour ouvrir une session authentifiée et
              vérifier les permissions appliquées côté serveur et côté interface.
            </p>

            <div className="space-y-3">
              {staffRoles.map((sr) => (
                <div
                  key={sr.role}
                  className="bg-[#101014] border border-white/10 hover:border-[#D8B77B]/50 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div>
                    <p className="text-sm font-semibold text-[#FAF7F2]">{sr.title}</p>
                    <p className="text-xs text-[#AAA6A1] mt-0.5">{sr.desc}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleStaffLogin(sr.role)}
                    className="px-4 py-2 bg-[#D8B77B] text-[#101014] font-semibold text-xs rounded-md whitespace-nowrap shrink-0"
                  >
                    Ouvrir avec ce rôle →
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const MyAccountPage: React.FC = () => {
  const { lang, authUser, authToken, navigate, logout } = useApp();
  const [orders, setOrders] = useState<Order[]>([]);
  const [reservations, setReservations] = useState<ReservationRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [lookupRef, setLookupRef] = useState('');
  const [lookupToken, setLookupToken] = useState('');

  useEffect(() => {
    if (!authToken) return;
    setLoading(true);
    fetch('/api/my-account', {
      headers: { Authorization: `Bearer ${authToken}` },
    })
      .then((r) => r.json())
      .then((data) => {
        setOrders(data.orders || []);
        setReservations(data.reservations || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [authToken]);

  return (
    <div className="min-h-screen pt-28 pb-20 bg-[#101014] text-[#FAF7F2]">
      <div className="max-w-[1140px] mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        <div className="border-b border-white/10 pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-widest text-[#D8B77B] mb-2">
              ESPACE PERSONNEL
            </p>
            <h1 className="font-serif-display text-4xl font-semibold">Mon Compte & Suivi</h1>
          </div>
          {authUser ? (
            <div className="flex items-center gap-3 text-xs">
              <span className="text-[#AAA6A1]">
                {authUser.fullName} ({authUser.phone || authUser.email})
              </span>
              <button
                type="button"
                onClick={logout}
                className="px-3 py-1.5 border border-white/15 rounded-md hover:bg-white/5"
              >
                Déconnexion
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => navigate('/connexion')}
              className="px-4 py-2 bg-[#D8B77B] text-[#101014] font-semibold text-xs rounded-md"
            >
              Se connecter
            </button>
          )}
        </div>

        {/* Direct Order Tracking Lookup */}
        <div className="bg-[#1C1C23] border border-white/10 rounded-xl p-6 space-y-4">
          <h2 className="font-serif-display text-2xl font-semibold">
            Rechercher une commande par référence
          </h2>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!lookupRef.trim()) return;
              navigate(
                `/commandes/${encodeURIComponent(lookupRef.trim())}?token=${encodeURIComponent(
                  lookupToken.trim()
                )}`
              );
            }}
            className="grid grid-cols-1 sm:grid-cols-3 gap-4"
          >
            <input
              type="text"
              required
              value={lookupRef}
              onChange={(e) => setLookupRef(e.target.value)}
              placeholder="Référence (ex: BV-20261031-...)"
              className="px-3.5 py-2.5 bg-[#101014] border border-white/15 rounded-lg text-sm font-mono-tabular text-[#FAF7F2]"
            />
            <input
              type="text"
              value={lookupToken}
              onChange={(e) => setLookupToken(e.target.value)}
              placeholder="Jeton secret ou 4 derniers chiffres tél."
              className="px-3.5 py-2.5 bg-[#101014] border border-white/15 rounded-lg text-sm font-mono-tabular text-[#FAF7F2]"
            />
            <button
              type="submit"
              className="px-5 py-2.5 bg-[#D8B77B] text-[#101014] font-semibold text-xs rounded-lg"
            >
              Suivre ma commande →
            </button>
          </form>
        </div>

        {authUser && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-[#1C1C23] border border-white/10 rounded-xl p-6 space-y-4">
              <h2 className="font-serif-display text-2xl font-semibold">
                Mes Commandes ({orders.length})
              </h2>
              {loading ? (
                <p className="text-xs text-[#AAA6A1]">Chargement...</p>
              ) : orders.length === 0 ? (
                <p className="text-xs text-[#AAA6A1]">Aucune commande associée à ce numéro.</p>
              ) : (
                <div className="space-y-3">
                  {orders.map((o) => (
                    <div
                      key={o.id}
                      onClick={() =>
                        navigate(`/commandes/${o.reference}?token=${o.trackingToken}`)
                      }
                      className="p-4 bg-[#101014] border border-white/10 hover:border-[#D8B77B] rounded-lg cursor-pointer flex items-center justify-between text-xs"
                    >
                      <div>
                        <p className="font-mono-tabular font-semibold text-[#D8B77B]">
                          {o.reference}
                        </p>
                        <p className="text-[#AAA6A1] mt-0.5">
                          {formatDateTime(o.createdAt, lang)} · {o.orderStatus}
                        </p>
                      </div>
                      <span className="font-mono-tabular font-semibold">
                        {formatXaf(o.totalXaf, lang)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-[#1C1C23] border border-white/10 rounded-xl p-6 space-y-4">
              <h2 className="font-serif-display text-2xl font-semibold">
                Mes Demandes de Réservation ({reservations.length})
              </h2>
              {reservations.length === 0 ? (
                <p className="text-xs text-[#AAA6A1]">Aucune demande de réservation.</p>
              ) : (
                <div className="space-y-3">
                  {reservations.map((r) => (
                    <div
                      key={r.id}
                      className="p-4 bg-[#101014] border border-white/10 rounded-lg flex items-center justify-between text-xs"
                    >
                      <div>
                        <p className="font-mono-tabular font-semibold text-[#FAF7F2]">
                          {r.reference} · {r.reservationDate} à {r.reservationTime}
                        </p>
                        <p className="text-[#AAA6A1] mt-0.5">
                          {r.partySize} convives · {r.spaceType}
                        </p>
                      </div>
                      <span className="uppercase font-mono-tabular text-[#D8B77B]">{r.status}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export const PrivacyPage: React.FC = () => (
  <div className="min-h-screen pt-28 pb-20 bg-[#101014] text-[#FAF7F2]">
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
      <h1 className="font-serif-display text-4xl font-semibold">Politique de Confidentialité</h1>
      <div className="bg-[#1C1C23] border border-white/10 rounded-xl p-6 sm:p-8 space-y-4 text-xs text-[#AAA6A1] leading-relaxed">
        <p className="text-[#D8B77B] font-semibold">
          Document cadre à faire valider par le conseil juridique de l’établissement avant mise en
          production officielle.
        </p>
        <p>
          <strong className="text-[#FAF7F2]">1. Données collectées :</strong> Dans le cadre des
          commandes et demandes de réservation, seuls le nom, le numéro de téléphone, l’adresse
          e-mail facultative et les informations nécessaires à la remise de la commande sont
          collectés.
        </p>
        <p>
          <strong className="text-[#FAF7F2]">2. Sécurité des paiements :</strong> Le Boivement ne
          collecte jamais de code PIN Mobile Money, de mot de passe de portefeuille ni de code
          secret bancaire.
        </p>
        <p>
          <strong className="text-[#FAF7F2]">3. Protection du suivi de commande :</strong> L’accès
          aux détails d’une commande est protégé par un jeton cryptographique unique ou par
          vérification du numéro de téléphone afin d’empêcher toute consultation non autorisée.
        </p>
      </div>
    </div>
  </div>
);

export const TermsPage: React.FC = () => (
  <div className="min-h-screen pt-28 pb-20 bg-[#101014] text-[#FAF7F2]">
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
      <h1 className="font-serif-display text-4xl font-semibold">
        Conditions Générales de Vente et d’Utilisation
      </h1>
      <div className="bg-[#1C1C23] border border-white/10 rounded-xl p-6 sm:p-8 space-y-4 text-xs text-[#AAA6A1] leading-relaxed">
        <p className="text-[#D8B77B] font-semibold">
          Document cadre à faire valider par la direction du Boivement avant publication commerciale.
        </p>
        <p>
          <strong className="text-[#FAF7F2]">1. Validation des prix et des stocks :</strong> Tous
          les prix en Francs CFA (XAF) et les disponibilités sont vérifiés côté serveur lors de la
          validation de la commande. La conservation locale du panier ne constitue pas une
          réservation de stock.
        </p>
        <p>
          <strong className="text-[#FAF7F2]">2. Réservations de table :</strong> Toute demande de
          réservation soumise en ligne est enregistrée avec le statut « En attente » (pending) et ne
          devient ferme qu’après confirmation explicite par l’établissement.
        </p>
        <p>
          <strong className="text-[#FAF7F2]">3. Boissons alcoolisées :</strong> La vente de boissons
          alcoolisées est strictement interdite aux mineurs. Un contrôle physique d’identité et de
          majorité est effectué lors du retrait ou du service sur place.
        </p>
        <p>
          <strong className="text-[#FAF7F2]">4. Annulation et remboursement :</strong> Un
          remboursement financier éventuel est traité séparément du retour physique en stock, lequel
          nécessite une inspection de conformité par le responsable stock.
        </p>
      </div>
    </div>
  </div>
);

export const NotFoundPage: React.FC = () => {
  const { navigate } = useApp();
  return (
    <div className="min-h-screen pt-32 pb-20 bg-[#101014] text-[#FAF7F2] px-4">
      <div className="max-w-lg mx-auto bg-[#1C1C23] border border-white/10 rounded-xl p-10 text-center space-y-4">
        <p className="font-mono-tabular text-xs text-[#D8B77B]">ERREUR 404</p>
        <h1 className="font-serif-display text-3xl font-semibold">Page introuvable</h1>
        <p className="text-xs text-[#AAA6A1]">
          La page demandée n’existe pas ou a été déplacée.
        </p>
        <button
          type="button"
          onClick={() => navigate('/')}
          className="px-6 py-2.5 bg-[#D8B77B] text-[#101014] font-semibold text-xs rounded-md"
        >
          Retour à l’accueil
        </button>
      </div>
    </div>
  );
};
