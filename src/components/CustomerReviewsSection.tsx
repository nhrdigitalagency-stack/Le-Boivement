import React, { useState } from 'react';
import { Star, MessageSquarePlus, CheckCircle2, ShieldCheck } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const CustomerReviewsSection: React.FC<{
  targetType: 'experience' | 'product';
  productId?: string;
  productName?: string;
}> = ({ targetType, productId, productName }) => {
  const { lang, reviews, authUser } = useApp();

  const [showForm, setShowForm] = useState(false);
  const [authorName, setAuthorName] = useState(authUser?.fullName || '');
  const [rating, setRating] = useState<number>(5);
  const [visitContext, setVisitContext] = useState('');
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submittedMsg, setSubmittedMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const filteredReviews = reviews.filter((r) => {
    if (r.status !== 'approved') return false;
    if (targetType === 'product') {
      return r.targetType === 'product' && r.productId === productId;
    }
    return r.targetType === 'experience';
  });

  const avgRating =
    filteredReviews.length > 0
      ? (filteredReviews.reduce((acc, r) => acc + r.rating, 0) / filteredReviews.length).toFixed(1)
      : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg(null);
    setSubmittedMsg(null);

    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetType,
          productId,
          authorName,
          rating,
          visitContext,
          comment,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Erreur lors de la soumission.');
      }
      setSubmittedMsg(
        lang === 'fr'
          ? 'Votre avis a bien été enregistré et transmis à notre équipe. Il sera affiché dès sa validation par un modérateur autorisé.'
          : 'Your review has been recorded and sent to our team. It will be published once approved by an authorized moderator.'
      );
      setComment('');
      setVisitContext('');
      setShowForm(false);
    } catch (err: any) {
      setErrorMsg(err.message || 'Impossible d’envoyer votre avis.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="mt-14 pt-12 border-t border-white/10">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <div>
          <div className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-[#D8B77B] font-semibold mb-2">
            <ShieldCheck className="w-4 h-4" />
            <span>
              {lang === 'fr'
                ? 'Avis Clients Approuvés & Modérés'
                : 'Approved & Moderated Customer Reviews'}
            </span>
          </div>
          <h2 className="font-serif-display text-2xl sm:text-3xl font-semibold text-[#FAF7F2]">
            {targetType === 'product'
              ? lang === 'fr'
                ? `Avis sur ${productName || 'cet article'}`
                : `Reviews for ${productName || 'this item'}`
              : lang === 'fr'
              ? 'Retours d’Expérience au Boivement'
              : 'Guest Experience Feedback'}
          </h2>
          <p className="text-xs sm:text-sm text-[#AAA6A1] mt-1">
            {lang === 'fr'
              ? 'Seuls les avis vérifiés et approuvés par le personnel autorisé sont publiés.'
              : 'Only verified reviews approved by authorized staff are published.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {avgRating && (
            <div className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#1C1C23] border border-white/10">
              <div className="flex items-center text-[#D8B77B]">
                <Star className="w-4 h-4 fill-current" />
              </div>
              <span className="font-mono-tabular text-sm font-semibold text-[#FAF7F2]">
                {avgRating} / 5
              </span>
              <span className="text-xs text-[#AAA6A1]">
                ({filteredReviews.length} {lang === 'fr' ? 'avis' : 'reviews'})
              </span>
            </div>
          )}

          <button
            type="button"
            onClick={() => {
              setShowForm((v) => !v);
              setSubmittedMsg(null);
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#D8B77B] text-[#101014] text-xs font-semibold hover:bg-[#e3c68f] transition-colors"
          >
            <MessageSquarePlus className="w-4 h-4" />
            <span>{lang === 'fr' ? 'Déposer un avis' : 'Write a review'}</span>
          </button>
        </div>
      </div>

      {submittedMsg && (
        <div className="mb-6 p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/40 text-sm text-[#FAF7F2] flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">{submittedMsg}</p>
          </div>
        </div>
      )}

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="mb-8 p-5 sm:p-6 rounded-xl bg-[#1C1C23] border border-[#D8B77B]/30 space-y-4"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[#FAF7F2]">
              {lang === 'fr'
                ? 'Partager votre avis (soumis à modération)'
                : 'Share your review (subject to moderation)'}
            </h3>
            <span className="text-[11px] text-[#AAA6A1]">
              {lang === 'fr' ? 'Publication après validation' : 'Published after approval'}
            </span>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-lg bg-red-950/50 border border-red-500/40 text-xs text-red-200">
              {errorMsg}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-[#AAA6A1] mb-1.5">
                {lang === 'fr' ? 'Votre nom ou initiales *' : 'Your name or initials *'}
              </label>
              <input
                type="text"
                required
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                placeholder={lang === 'fr' ? 'Ex. : Marc E.' : 'e.g., Marc E.'}
                className="w-full px-3.5 py-2.5 rounded-lg bg-[#101014] border border-white/15 text-sm text-[#FAF7F2] focus:outline-none focus:border-[#D8B77B]"
              />
            </div>

            <div>
              <label className="block text-xs text-[#AAA6A1] mb-1.5">
                {lang === 'fr' ? 'Note globale *' : 'Overall rating *'}
              </label>
              <div className="flex items-center gap-1.5 h-[42px] px-3 rounded-lg bg-[#101014] border border-white/15">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="p-1 focus:outline-none"
                    aria-label={`${star} étoiles`}
                  >
                    <Star
                      className={`w-5 h-5 transition-colors ${
                        star <= rating
                          ? 'text-[#D8B77B] fill-current'
                          : 'text-[#AAA6A1]/40'
                      }`}
                    />
                  </button>
                ))}
                <span className="ml-2 font-mono-tabular text-xs text-[#FAF7F2]">
                  {rating}/5
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs text-[#AAA6A1] mb-1.5">
                {lang === 'fr' ? 'Contexte (optionnel)' : 'Context (optional)'}
              </label>
              <input
                type="text"
                value={visitContext}
                onChange={(e) => setVisitContext(e.target.value)}
                placeholder={
                  lang === 'fr'
                    ? 'Ex. : Dîner Lounge, Retrait sur place'
                    : 'e.g., Lounge Dinner, Takeaway'
                }
                className="w-full px-3.5 py-2.5 rounded-lg bg-[#101014] border border-white/15 text-sm text-[#FAF7F2] focus:outline-none focus:border-[#D8B77B]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-[#AAA6A1] mb-1.5">
              {lang === 'fr' ? 'Votre commentaire détaillé *' : 'Your detailed review *'}
            </label>
            <textarea
              required
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={
                lang === 'fr'
                  ? 'Décrivez votre expérience culinaire, la qualité du service ou de l’ambiance...'
                  : 'Describe your dining experience, service quality, or atmosphere...'
              }
              className="w-full px-3.5 py-2.5 rounded-lg bg-[#101014] border border-white/15 text-sm text-[#FAF7F2] focus:outline-none focus:border-[#D8B77B]"
            />
          </div>

          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2 text-xs font-medium text-[#AAA6A1] hover:text-[#FAF7F2]"
            >
              {lang === 'fr' ? 'Annuler' : 'Cancel'}
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 rounded-lg bg-[#D8B77B] text-[#101014] text-xs font-semibold hover:bg-[#e3c68f] disabled:opacity-50"
            >
              {submitting
                ? lang === 'fr'
                  ? 'Envoi en cours...'
                  : 'Submitting...'
                : lang === 'fr'
                ? 'Envoyer pour modération'
                : 'Submit for moderation'}
            </button>
          </div>
        </form>
      )}

      {filteredReviews.length === 0 ? (
        <div className="p-8 rounded-xl bg-[#1C1C23] border border-white/10 text-center">
          <p className="text-sm text-[#AAA6A1]">
            {lang === 'fr'
              ? 'Aucun avis approuvé pour le moment sur cette fiche. Soyez le premier à partager votre retour.'
              : 'No approved reviews yet for this item. Be the first to share your feedback.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredReviews.map((rev) => (
            <article
              key={rev.id}
              className="p-5 sm:p-6 rounded-xl bg-[#1C1C23] border border-white/10 flex flex-col justify-between gap-4"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-1 text-[#D8B77B]">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`w-3.5 h-3.5 ${
                          i < rev.rating ? 'fill-current' : 'opacity-25'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-[11px] px-2 py-0.5 rounded bg-white/5 border border-white/10 text-[#AAA6A1]">
                    {rev.isDemo
                      ? lang === 'fr'
                        ? 'Exemple démo modéré'
                        : 'Moderated demo sample'
                      : lang === 'fr'
                      ? 'Avis vérifié & approuvé'
                      : 'Verified & approved'}
                  </span>
                </div>

                <p className="text-sm text-[#FAF7F2] leading-relaxed">
                  {lang === 'fr' ? rev.commentFr : rev.commentEn}
                </p>
              </div>

              <div className="pt-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-2 text-xs text-[#AAA6A1]">
                <div>
                  <span className="font-semibold text-[#FAF7F2]">{rev.authorName}</span>
                  {(rev.visitContextFr || rev.visitContextEn) && (
                    <span>
                      {' '}
                      · {lang === 'fr' ? rev.visitContextFr : rev.visitContextEn}
                    </span>
                  )}
                </div>
                <span className="font-mono-tabular text-[11px]">
                  {new Date(rev.createdAt).toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-US')}
                </span>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
};
