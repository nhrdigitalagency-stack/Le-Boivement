import React, { useState, useEffect } from 'react';
import {
  Trash2,
  ArrowRight,
  AlertTriangle,
  ShieldCheck,
  CheckCircle2,
  Lock,
  ShoppingBag,
  MessageCircle,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { translations, formatXaf, formatDateTime } from '../i18n/translations';
import { FulfillmentMode, Order, PaymentMethod } from '../types/domain';

interface ValidatedCartLine {
  productId: string;
  variantId: string;
  productNameFr: string;
  productNameEn: string;
  variantNameFr: string;
  variantNameEn: string;
  unitPriceXaf: number;
  unitMultiplier: number;
  quantity: number;
  baseUnitsNeeded: number;
  availableBaseUnits: number;
  stockSufficient: boolean;
  lineTotalXaf: number;
  selectedOptions: string[];
}

export const CartPage: React.FC = () => {
  const {
    lang,
    cart,
    updateCartQty,
    removeFromCart,
    navigate,
    settings,
    products,
    backendOnline,
  } = useApp();

  const t = translations[lang];
  const [validatedLines, setValidatedLines] = useState<ValidatedCartLine[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [subtotalXaf, setSubtotalXaf] = useState<number>(0);
  const [validating, setValidating] = useState<boolean>(false);

  useEffect(() => {
    let active = true;
    const validateCart = async () => {
      if (cart.length === 0) {
        setValidatedLines([]);
        setWarnings([]);
        setSubtotalXaf(0);
        return;
      }
      setValidating(true);
      try {
        const res = await fetch('/api/cart/validate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ items: cart }),
        });
        if (!res.ok) throw new Error('Validation failed');
        const data = await res.json();
        if (active) {
          setValidatedLines(data.lines);
          setWarnings(data.warnings || []);
          setSubtotalXaf(data.subtotalXaf || 0);
        }
      } catch {
        // Fallback local calculation if offline
        if (active) {
          let sum = 0;
          const lines: ValidatedCartLine[] = [];
          for (const item of cart) {
            const p = products.find((prod) => prod.id === item.productId);
            const v = p?.variants.find((vr) => vr.id === item.variantId);
            if (p && v) {
              const lineTotal = v.priceXaf * item.quantity;
              sum += lineTotal;
              lines.push({
                productId: p.id,
                variantId: v.id,
                productNameFr: p.nameFr,
                productNameEn: p.nameEn,
                variantNameFr: v.nameFr,
                variantNameEn: v.nameEn,
                unitPriceXaf: v.priceXaf,
                unitMultiplier: v.unitMultiplier,
                quantity: item.quantity,
                baseUnitsNeeded: item.quantity * v.unitMultiplier,
                availableBaseUnits: p.availableBaseUnits || 0,
                stockSufficient: (p.availableBaseUnits || 0) >= item.quantity * v.unitMultiplier,
                lineTotalXaf: lineTotal,
                selectedOptions: item.selectedOptions,
              });
            }
          }
          setValidatedLines(lines);
          setSubtotalXaf(sum);
        }
      } finally {
        if (active) setValidating(false);
      }
    };
    validateCart();
    return () => {
      active = false;
    };
  }, [cart, products]);

  return (
    <div className="min-h-screen pt-28 pb-20 bg-[#101014] text-[#FAF7F2]">
      <div className="max-w-[1140px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="pb-8 border-b border-white/10">
          <p className="text-xs uppercase tracking-widest text-[#D8B77B] mb-2">
            {settings.brandName} · RÉCAPITULATIF
          </p>
          <h1 className="font-serif-display text-4xl font-semibold text-[#FAF7F2]">
            {t.cart.title}
          </h1>
          <p className="text-xs text-[#AAA6A1] mt-2">{t.cart.localNotice}</p>
        </div>

        {warnings.length > 0 && (
          <div className="mt-6 bg-amber-950/60 border border-amber-500/40 rounded-xl p-4 space-y-1.5">
            {warnings.map((w, idx) => (
              <div key={idx} className="flex items-start gap-2.5 text-xs text-amber-200">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span>{w}</span>
              </div>
            ))}
          </div>
        )}

        {cart.length === 0 ? (
          <div className="mt-12 bg-[#1C1C23] border border-white/10 rounded-xl p-12 text-center space-y-5">
            <ShoppingBag className="w-10 h-10 text-[#D8B77B] mx-auto stroke-[1.5]" />
            <p className="text-base text-[#FAF7F2]">{t.cart.empty}</p>
            <button
              type="button"
              onClick={() => navigate('/boutique')}
              className="px-6 py-3 bg-[#D8B77B] text-[#101014] font-semibold text-xs rounded-md"
            >
              {t.cart.exploreShop}
            </button>
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-8 space-y-4">
              {validatedLines.map((line) => (
                <div
                  key={`${line.productId}-${line.variantId}`}
                  className={`bg-[#1C1C23] border rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                    line.stockSufficient ? 'border-white/10' : 'border-red-500/50'
                  }`}
                >
                  <div className="space-y-1">
                    <h3 className="text-base font-semibold text-[#FAF7F2]">
                      {lang === 'fr' ? line.productNameFr : line.productNameEn}
                    </h3>
                    <p className="text-xs text-[#D8B77B]">
                      {lang === 'fr' ? line.variantNameFr : line.variantNameEn} ·{' '}
                      <span className="font-mono-tabular">
                        {formatXaf(line.unitPriceXaf, lang)}
                      </span>
                    </p>
                    {line.selectedOptions.length > 0 && (
                      <p className="text-xs text-[#AAA6A1]">
                        Options : {line.selectedOptions.join(', ')}
                      </p>
                    )}
                    {!line.stockSufficient && (
                      <p className="text-xs text-red-400 font-medium">
                        {lang === 'fr'
                          ? `Stock disponible insuffisant (${line.availableBaseUnits} unité(s) restante(s)).`
                          : `Insufficient available stock (${line.availableBaseUnits} unit(s) left).`}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4">
                    <div className="inline-flex items-center bg-[#101014] border border-white/15 rounded-lg px-2 py-1">
                      <button
                        type="button"
                        onClick={() =>
                          updateCartQty(line.productId, line.variantId, line.quantity - 1)
                        }
                        className="px-2 text-sm text-[#AAA6A1] hover:text-white"
                      >
                        −
                      </button>
                      <span className="px-3 font-mono-tabular text-xs font-semibold">
                        {line.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          updateCartQty(line.productId, line.variantId, line.quantity + 1)
                        }
                        className="px-2 text-sm text-[#AAA6A1] hover:text-white"
                      >
                        +
                      </button>
                    </div>

                    <span className="font-mono-tabular text-sm font-semibold text-[#FAF7F2] min-w-[100px] text-right">
                      {formatXaf(line.lineTotalXaf, lang)}
                    </span>

                    <button
                      type="button"
                      onClick={() => removeFromCart(line.productId, line.variantId)}
                      className="p-2 text-[#AAA6A1] hover:text-red-400 transition-colors"
                      title={t.cart.remove}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="lg:col-span-4 bg-[#1C1C23] border border-white/10 rounded-xl p-6 space-y-5">
              <h2 className="font-serif-display text-2xl font-semibold text-[#FAF7F2]">
                {lang === 'fr' ? 'Synthèse' : 'Summary'}
              </h2>

              <div className="space-y-2.5 text-sm border-t border-white/10 pt-4">
                <div className="flex justify-between text-[#AAA6A1]">
                  <span>{t.cart.subtotal}</span>
                  <span className="font-mono-tabular text-[#FAF7F2]">
                    {formatXaf(subtotalXaf, lang)}
                  </span>
                </div>
                <div className="flex justify-between text-xs text-[#AAA6A1]">
                  <span>{t.cart.fees}</span>
                  <span>
                    {lang === 'fr' ? 'Calculés à l’étape suivante' : 'Calculated at checkout'}
                  </span>
                </div>
                <div className="pt-3 border-t border-white/10 flex justify-between text-base font-semibold text-[#FAF7F2]">
                  <span>{t.cart.total}</span>
                  <span className="font-mono-tabular text-[#D8B77B]">
                    {formatXaf(subtotalXaf, lang)}
                  </span>
                </div>
              </div>

              <button
                type="button"
                disabled={validating || warnings.length > 0 || !backendOnline}
                onClick={() => navigate('/commande')}
                className={`w-full py-3.5 px-5 rounded-lg font-semibold text-xs inline-flex items-center justify-center gap-2 transition-colors ${
                  validating || warnings.length > 0 || !backendOnline
                    ? 'bg-white/10 text-white/30 cursor-not-allowed'
                    : 'bg-[#D8B77B] text-[#101014] hover:bg-[#e3c68f]'
                }`}
              >
                <span>{t.cart.proceedCheckout}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export const CheckoutPage: React.FC = () => {
  const {
    lang,
    cart,
    clearCart,
    navigate,
    settings,
    authUser,
    refreshBootstrap,
    backendOnline,
  } = useApp();

  const t = translations[lang];

  // Form states preserved across language changes
  const [customerName, setCustomerName] = useState(authUser?.fullName || '');
  const [customerPhone, setCustomerPhone] = useState(authUser?.phone || '');
  const [customerEmail, setCustomerEmail] = useState(authUser?.email || '');
  const [fulfillmentMode, setFulfillmentMode] = useState<FulfillmentMode>('pickup');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryLandmark, setDeliveryLandmark] = useState('');
  const [tableNumber, setTableNumber] = useState('');
  const [requestedSlot, setRequestedSlot] = useState('Dès que prêt (environ 25–35 min)');
  const [instructions, setInstructions] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('pay_on_site');

  // Unique idempotency key generated once per checkout session to prevent duplicate orders on double-click
  const [idempotencyKey] = useState<string>(
    () => `idem-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
  );

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [serverSubtotal, setServerSubtotal] = useState<number>(0);

  useEffect(() => {
    const computeTotal = async () => {
      try {
        const res = await fetch('/api/cart/validate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ items: cart }),
        });
        if (res.ok) {
          const data = await res.json();
          setServerSubtotal(data.subtotalXaf || 0);
        }
      } catch {
        // ignore
      }
    };
    computeTotal();
  }, [cart]);

  if (cart.length === 0) {
    return (
      <div className="min-h-screen pt-32 pb-20 bg-[#101014] text-[#FAF7F2] px-4">
        <div className="max-w-lg mx-auto bg-[#1C1C23] border border-white/10 rounded-xl p-8 text-center space-y-4">
          <p className="text-base">{t.cart.empty}</p>
          <button
            type="button"
            onClick={() => navigate('/boutique')}
            className="px-5 py-2.5 bg-[#D8B77B] text-[#101014] font-semibold text-xs rounded-md"
          >
            {t.cart.exploreShop}
          </button>
        </div>
      </div>
    );
  }

  const feesXaf = fulfillmentMode === 'delivery' ? settings.deliveryFeeXaf : 0;
  const totalXaf = serverSubtotal + feesXaf;

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    if (!backendOnline) {
      setErrorMsg(t.badges.backendOffline);
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idempotencyKey,
          customerName,
          customerPhone,
          customerEmail,
          fulfillmentMode,
          deliveryAddress: fulfillmentMode === 'delivery' ? deliveryAddress : '',
          deliveryLandmark: fulfillmentMode === 'delivery' ? deliveryLandmark : '',
          tableNumber: fulfillmentMode === 'table' ? tableNumber : '',
          requestedSlot,
          instructions,
          paymentMethod,
          items: cart,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.order?.reference) {
        throw new Error(data.error || 'La sauvegarde de la commande a échoué.');
      }

      await refreshBootstrap();
      clearCart();
      navigate(
        `/commandes/${encodeURIComponent(data.order.reference)}?token=${encodeURIComponent(
          data.order.trackingToken
        )}`
      );
    } catch (err: any) {
      setErrorMsg(err.message || 'Erreur lors de la validation de la commande.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen pt-28 pb-20 bg-[#101014] text-[#FAF7F2]">
      <div className="max-w-[1140px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="pb-8 border-b border-white/10">
          <p className="text-xs uppercase tracking-widest text-[#D8B77B] mb-2">
            VALIDATION SERVEUR & RÉSERVATION DE STOCK
          </p>
          <h1 className="font-serif-display text-4xl font-semibold text-[#FAF7F2]">
            {t.checkout.title}
          </h1>
        </div>

        {errorMsg && (
          <div className="mt-6 bg-red-950/70 border border-red-500/50 rounded-xl p-4 flex items-start gap-3 text-xs text-red-200">
            <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handlePlaceOrder} className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-7 space-y-6">
            {/* 1. Customer Coordinates */}
            <div className="bg-[#1C1C23] border border-white/10 rounded-xl p-6 space-y-4">
              <h2 className="font-serif-display text-2xl font-semibold text-[#FAF7F2]">
                {t.checkout.customerSection}
              </h2>

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
                    placeholder="Ex: Franck Ndongo"
                    className="w-full px-3.5 py-2.5 bg-[#101014] border border-white/15 rounded-lg text-sm text-[#FAF7F2] focus:outline-none focus:border-[#D8B77B]"
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
                    className="w-full px-3.5 py-2.5 bg-[#101014] border border-white/15 rounded-lg text-sm text-[#FAF7F2] font-mono-tabular focus:outline-none focus:border-[#D8B77B]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-[#AAA6A1] mb-1.5">
                  {t.checkout.email}
                </label>
                <input
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="client@exemple.cm"
                  className="w-full px-3.5 py-2.5 bg-[#101014] border border-white/15 rounded-lg text-sm text-[#FAF7F2] focus:outline-none focus:border-[#D8B77B]"
                />
              </div>
            </div>

            {/* 2. Fulfillment Mode (Only enabled modes selectable) */}
            <div className="bg-[#1C1C23] border border-white/10 rounded-xl p-6 space-y-4">
              <h2 className="font-serif-display text-2xl font-semibold text-[#FAF7F2]">
                {t.checkout.fulfillmentSection}
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  type="button"
                  disabled={!settings.pickupEnabled}
                  onClick={() => setFulfillmentMode('pickup')}
                  className={`p-3.5 rounded-lg border text-left text-xs transition-all ${
                    fulfillmentMode === 'pickup'
                      ? 'bg-[#101014] border-[#D8B77B] text-[#FAF7F2] font-semibold'
                      : 'bg-[#101014]/50 border-white/10 text-[#AAA6A1]'
                  }`}
                >
                  <p>{t.checkout.pickup}</p>
                  <p className="text-[11px] text-[#D8B77B] mt-1">Actif · Sans frais</p>
                </button>

                <button
                  type="button"
                  disabled={!settings.deliveryEnabled}
                  onClick={() => setFulfillmentMode('delivery')}
                  className={`p-3.5 rounded-lg border text-left text-xs transition-all ${
                    !settings.deliveryEnabled
                      ? 'opacity-40 cursor-not-allowed bg-[#101014]/30 border-white/5 text-[#AAA6A1]'
                      : fulfillmentMode === 'delivery'
                      ? 'bg-[#101014] border-[#D8B77B] text-[#FAF7F2] font-semibold'
                      : 'bg-[#101014]/50 border-white/10 text-[#AAA6A1]'
                  }`}
                >
                  <p>{t.checkout.delivery}</p>
                  <p className="text-[11px] text-[#AAA6A1] mt-1">
                    {settings.deliveryEnabled
                      ? formatXaf(settings.deliveryFeeXaf, lang)
                      : lang === 'fr'
                      ? 'Non activé (zones à définir)'
                      : 'Disabled (zones unconfigured)'}
                  </p>
                </button>

                <button
                  type="button"
                  disabled={!settings.tableOrderingEnabled}
                  onClick={() => setFulfillmentMode('table')}
                  className={`p-3.5 rounded-lg border text-left text-xs transition-all ${
                    !settings.tableOrderingEnabled
                      ? 'opacity-40 cursor-not-allowed bg-[#101014]/30 border-white/5 text-[#AAA6A1]'
                      : fulfillmentMode === 'table'
                      ? 'bg-[#101014] border-[#D8B77B] text-[#FAF7F2] font-semibold'
                      : 'bg-[#101014]/50 border-white/10 text-[#AAA6A1]'
                  }`}
                >
                  <p>{t.checkout.tableOrder}</p>
                  <p className="text-[11px] text-[#AAA6A1] mt-1">
                    {settings.tableOrderingEnabled ? 'Actif' : 'Module désactivé'}
                  </p>
                </button>
              </div>

              {fulfillmentMode === 'delivery' && settings.deliveryEnabled && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="block text-xs text-[#AAA6A1] mb-1.5">
                      {t.checkout.deliveryAddress}
                    </label>
                    <input
                      type="text"
                      required
                      value={deliveryAddress}
                      onChange={(e) => setDeliveryAddress(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-[#101014] border border-white/15 rounded-lg text-sm text-[#FAF7F2]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-[#AAA6A1] mb-1.5">
                      {t.checkout.landmark}
                    </label>
                    <input
                      type="text"
                      value={deliveryLandmark}
                      onChange={(e) => setDeliveryLandmark(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-[#101014] border border-white/15 rounded-lg text-sm text-[#FAF7F2]"
                    />
                  </div>
                </div>
              )}

              {fulfillmentMode === 'table' && settings.tableOrderingEnabled && (
                <div>
                  <label className="block text-xs text-[#AAA6A1] mb-1.5">
                    {t.checkout.tableNumber}
                  </label>
                  <input
                    type="text"
                    required
                    value={tableNumber}
                    onChange={(e) => setTableNumber(e.target.value)}
                    placeholder="Ex: Table L-04"
                    className="w-full px-3.5 py-2.5 bg-[#101014] border border-white/15 rounded-lg text-sm text-[#FAF7F2]"
                  />
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs text-[#AAA6A1] mb-1.5">{t.checkout.slot}</label>
                  <input
                    type="text"
                    value={requestedSlot}
                    onChange={(e) => setRequestedSlot(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#101014] border border-white/15 rounded-lg text-sm text-[#FAF7F2]"
                  />
                </div>
                <div>
                  <label className="block text-xs text-[#AAA6A1] mb-1.5">
                    {t.checkout.instructions}
                  </label>
                  <input
                    type="text"
                    value={instructions}
                    onChange={(e) => setInstructions(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#101014] border border-white/15 rounded-lg text-sm text-[#FAF7F2]"
                  />
                </div>
              </div>
            </div>

            {/* 3. Payment Method (No fake Mobile Money simulation, no PIN collection) */}
            <div className="bg-[#1C1C23] border border-white/10 rounded-xl p-6 space-y-4">
              <h2 className="font-serif-display text-2xl font-semibold text-[#FAF7F2]">
                {t.checkout.paymentSection}
              </h2>

              <div className="space-y-3">
                <label className="flex items-start gap-3 p-3.5 rounded-lg border border-[#D8B77B] bg-[#101014] cursor-pointer">
                  <input
                    type="radio"
                    name="paymentMethod"
                    checked={paymentMethod === 'pay_on_site'}
                    onChange={() => setPaymentMethod('pay_on_site')}
                    className="mt-1 accent-[#D8B77B]"
                  />
                  <div className="text-xs">
                    <p className="font-semibold text-[#FAF7F2]">{t.checkout.payOnSite}</p>
                    <p className="text-[#AAA6A1] mt-0.5">
                      {lang === 'fr'
                        ? 'Votre stock est réservé pendant 30 minutes. Le règlement est validé à la caisse lors du retrait.'
                        : 'Your stock is reserved for 30 minutes. Payment is completed at the cashier upon pickup.'}
                    </p>
                  </div>
                </label>

                {settings.cashOnDeliveryEnabled && fulfillmentMode === 'delivery' && (
                  <label className="flex items-start gap-3 p-3.5 rounded-lg border border-white/15 bg-[#101014] cursor-pointer">
                    <input
                      type="radio"
                      name="paymentMethod"
                      checked={paymentMethod === 'cash_on_delivery'}
                      onChange={() => setPaymentMethod('cash_on_delivery')}
                      className="mt-1 accent-[#D8B77B]"
                    />
                    <div className="text-xs">
                      <p className="font-semibold text-[#FAF7F2]">{t.checkout.cashOnDelivery}</p>
                    </div>
                  </label>
                )}

                <div className="p-3.5 rounded-lg border border-white/10 bg-[#101014]/50 opacity-60 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-[#AAA6A1]">{t.checkout.onlinePayment}</span>
                    <span className="text-[11px] text-[#D8B77B]">
                      {settings.onlinePaymentEnabled ? 'Configuré' : 'Désactivé (Aucun prestataire lié)'}
                    </span>
                  </div>
                  <p className="text-[#AAA6A1] mt-1">{t.checkout.onlinePaymentDisabled}</p>
                </div>
              </div>

              <div className="pt-2 flex items-center gap-2 text-[11px] text-[#D8B77B]">
                <ShieldCheck className="w-4 h-4 shrink-0" />
                <span>{t.checkout.securityPinNotice}</span>
              </div>
            </div>
          </div>

          {/* Right Summary & Submit */}
          <div className="lg:col-span-5">
            <div className="bg-[#1C1C23] border border-white/10 rounded-xl p-6 space-y-5 sticky top-28">
              <h2 className="font-serif-display text-2xl font-semibold text-[#FAF7F2]">
                {lang === 'fr' ? 'Total calculé côté serveur' : 'Server-calculated total'}
              </h2>

              <div className="space-y-2.5 text-sm border-t border-white/10 pt-4">
                <div className="flex justify-between text-[#AAA6A1]">
                  <span>{t.cart.subtotal}</span>
                  <span className="font-mono-tabular text-[#FAF7F2]">
                    {formatXaf(serverSubtotal, lang)}
                  </span>
                </div>
                <div className="flex justify-between text-[#AAA6A1]">
                  <span>{t.cart.fees}</span>
                  <span className="font-mono-tabular text-[#FAF7F2]">
                    {formatXaf(feesXaf, lang)}
                  </span>
                </div>
                <div className="pt-3 border-t border-white/10 flex justify-between text-lg font-semibold text-[#FAF7F2]">
                  <span>Total final</span>
                  <span className="font-mono-tabular text-[#D8B77B]">
                    {formatXaf(totalXaf, lang)}
                  </span>
                </div>
              </div>

              <div className="text-[11px] text-[#AAA6A1] bg-[#101014] p-3 rounded-lg border border-white/5 font-mono-tabular">
                Idempotency-Key : {idempotencyKey}
              </div>

              <button
                type="submit"
                disabled={submitting || !backendOnline}
                className={`w-full py-4 px-6 rounded-lg font-semibold text-sm transition-colors ${
                  submitting || !backendOnline
                    ? 'bg-white/10 text-white/40 cursor-not-allowed'
                    : 'bg-[#D8B77B] text-[#101014] hover:bg-[#e3c68f]'
                }`}
              >
                {submitting ? t.checkout.submitting : t.checkout.submitOrder}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export const OrderTrackingPage: React.FC<{ reference: string }> = ({ reference }) => {
  const { lang, searchParams, authToken, settings, navigate } = useApp();
  const tokenFromUrl = searchParams.get('token') || '';

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [requiresVerification, setRequiresVerification] = useState(false);
  const [phoneVerifyInput, setPhoneVerifyInput] = useState('');
  const [tokenVerifyInput, setTokenVerifyInput] = useState(tokenFromUrl);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchOrder = async (tokenVal: string, phoneVal: string) => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const qs = new URLSearchParams();
      if (tokenVal) qs.set('token', tokenVal);
      if (phoneVal) qs.set('phone', phoneVal);

      const headers: Record<string, string> = {};
      if (authToken) headers.Authorization = `Bearer ${authToken}`;

      const res = await fetch(
        `/api/orders/${encodeURIComponent(reference)}?${qs.toString()}`,
        { headers }
      );
      const data = await res.json();
      if (res.status === 403 && data.requiresVerification) {
        setRequiresVerification(true);
        setOrder(null);
        return;
      }
      if (!res.ok) {
        throw new Error(data.error || 'Commande introuvable.');
      }
      setOrder(data.order);
      setRequiresVerification(false);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder(tokenFromUrl, '');
  }, [reference, tokenFromUrl]);

  return (
    <div className="min-h-screen pt-28 pb-20 bg-[#101014] text-[#FAF7F2]">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {loading ? (
          <div className="bg-[#1C1C23] border border-white/10 rounded-xl p-10 text-center text-sm text-[#AAA6A1]">
            Vérification sécurisée de la commande {reference}...
          </div>
        ) : requiresVerification ? (
          <div className="bg-[#1C1C23] border border-white/10 rounded-xl p-8 space-y-5">
            <div className="flex items-center gap-3 text-[#D8B77B]">
              <Lock className="w-6 h-6" />
              <h1 className="font-serif-display text-3xl font-semibold text-[#FAF7F2]">
                Suivi de commande protégé ({reference})
              </h1>
            </div>
            <p className="text-xs text-[#AAA6A1] leading-relaxed">
              Conformément à notre politique de confidentialité, le suivi d’une commande n’est pas
              accessible par simple devinette d’identifiant. Saisissez les 4 derniers chiffres du
              téléphone de la commande ou votre jeton secret.
            </p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                fetchOrder(tokenVerifyInput, phoneVerifyInput);
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs text-[#AAA6A1] mb-1">
                  Téléphone utilisé lors de la commande (ou 4 derniers chiffres)
                </label>
                <input
                  type="text"
                  value={phoneVerifyInput}
                  onChange={(e) => setPhoneVerifyInput(e.target.value)}
                  placeholder="Ex: 0001"
                  className="w-full px-3.5 py-2.5 bg-[#101014] border border-white/15 rounded-lg text-sm font-mono-tabular text-[#FAF7F2]"
                />
              </div>
              <div>
                <label className="block text-xs text-[#AAA6A1] mb-1">
                  Ou jeton de suivi secret
                </label>
                <input
                  type="text"
                  value={tokenVerifyInput}
                  onChange={(e) => setTokenVerifyInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#101014] border border-white/15 rounded-lg text-sm font-mono-tabular text-[#FAF7F2]"
                />
              </div>
              <button
                type="submit"
                className="px-6 py-2.5 bg-[#D8B77B] text-[#101014] font-semibold text-xs rounded-md"
              >
                Déverrouiller le suivi
              </button>
            </form>
          </div>
        ) : errorMsg || !order ? (
          <div className="bg-[#1C1C23] border border-white/10 rounded-xl p-8 text-center space-y-4">
            <p className="text-sm text-red-300">{errorMsg || 'Commande introuvable.'}</p>
            <button
              type="button"
              onClick={() => navigate('/boutique')}
              className="px-5 py-2.5 bg-[#D8B77B] text-[#101014] font-semibold text-xs rounded-md"
            >
              Retour à la boutique
            </button>
          </div>
        ) : (
          <div className="bg-[#1C1C23] border border-white/10 rounded-xl p-6 sm:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
              <div>
                <div className="flex items-center gap-2 text-xs text-[#D8B77B] mb-1">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>COMMANDE ENREGISTRÉE</span>
                </div>
                <h1 className="font-mono-tabular text-2xl sm:text-3xl font-semibold text-[#FAF7F2]">
                  {order.reference}
                </h1>
                <p className="text-xs text-[#AAA6A1] mt-1">
                  Créée le {formatDateTime(order.createdAt, lang)} · Client : {order.customerName}
                </p>
              </div>

              <div className="text-left sm:text-right text-xs font-mono-tabular space-y-1">
                <p className="text-[#AAA6A1]">Jeton de suivi privé :</p>
                <p className="text-[#D8B77B] select-all">{order.trackingToken}</p>
              </div>
            </div>

            {/* Distinct Order, Payment, and Stock Handover Statuses */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-[#101014] border border-white/10 rounded-lg p-4">
                <p className="text-[11px] uppercase text-[#AAA6A1]">1. Statut de commande</p>
                <p className="text-sm font-semibold text-[#D8B77B] mt-1 uppercase font-mono-tabular">
                  {order.orderStatus}
                </p>
              </div>
              <div className="bg-[#101014] border border-white/10 rounded-lg p-4">
                <p className="text-[11px] uppercase text-[#AAA6A1]">2. Statut de paiement</p>
                <p className="text-sm font-semibold text-[#FAF7F2] mt-1 uppercase font-mono-tabular">
                  {order.paymentStatus}
                </p>
              </div>
              <div className="bg-[#101014] border border-white/10 rounded-lg p-4">
                <p className="text-[11px] uppercase text-[#AAA6A1]">3. Stock & Remise</p>
                <p className="text-sm font-semibold text-[#FAF7F2] mt-1">
                  {order.stockDeducted
                    ? 'Remis (Stock physique déduit)'
                    : order.orderStatus === 'cancelled'
                    ? 'Réservation libérée'
                    : 'Stock réservé'}
                </p>
              </div>
            </div>

            {/* Snapshot Line Items */}
            <div className="space-y-3 pt-2">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-[#AAA6A1]">
                Articles commandés (Instantané de prix garanti)
              </h2>
              <div className="divide-y divide-white/10 bg-[#101014] rounded-lg border border-white/10 px-4">
                {order.items.map((item) => (
                  <div
                    key={item.id}
                    className="py-3.5 flex items-center justify-between gap-4 text-xs"
                  >
                    <div>
                      <p className="font-semibold text-[#FAF7F2]">
                        {lang === 'fr' ? item.snapshotProductNameFr : item.snapshotProductNameEn}
                      </p>
                      <p className="text-[#AAA6A1] font-mono-tabular">
                        {lang === 'fr' ? item.snapshotVariantNameFr : item.snapshotVariantNameEn} ·{' '}
                        {item.quantity} × {formatXaf(item.snapshotUnitPriceXaf, lang)} (
                        {item.baseUnitsReserved} u. stock)
                      </p>
                    </div>
                    <span className="font-mono-tabular font-semibold text-[#D8B77B]">
                      {formatXaf(item.lineTotalXaf, lang)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-white/10 flex items-center justify-between text-base font-semibold">
              <span>Total commande</span>
              <span className="font-mono-tabular text-xl text-[#D8B77B]">
                {formatXaf(order.totalXaf, lang)}
              </span>
            </div>

            {settings.whatsapp && (
              <div className="pt-4 border-t border-white/10 space-y-2">
                <a
                  href={`https://wa.me/${settings.whatsapp.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                    `Bonjour Le Boivement, voici ma référence de commande enregistrée : ${order.reference}`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#101014] border border-white/15 rounded-md text-xs text-[#FAF7F2] hover:border-[#D8B77B]"
                >
                  <MessageCircle className="w-4 h-4 text-[#D8B77B]" />
                  <span>Partager ma référence {order.reference} sur WhatsApp</span>
                </a>
                <p className="text-[11px] text-[#AAA6A1]">
                  Note : L’ouverture de WhatsApp sert uniquement d’échange d’information et ne
                  constitue ni un paiement ni une acceptation de commande.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
