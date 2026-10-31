import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import crypto from 'crypto';
import { store, ROLE_PERMISSIONS } from './src/server/store.ts';
import {
  createOrderInState,
  createReservationInState,
  recordStockMovementInState,
  recordSupplierReceiptInState,
  runAutomatedCriticalTests,
  sanitizeInventoryForUser,
  transitionOrderStatusInState,
  transitionPaymentStatusInState,
  validateInventoryCountInState,
} from './src/server/operations.ts';
import { AuthenticatedUser, StaffRole } from './src/types/domain.ts';

const PORT = 3000;
const SESSION_SECRET = process.env.SESSION_SECRET || 'boivement-local-hmac-secret-2026';

function signToken(payload: AuthenticatedUser): string {
  const data = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = crypto.createHmac('sha256', SESSION_SECRET).update(data).digest('base64url');
  return `${data}.${sig}`;
}

function verifyToken(token?: string): AuthenticatedUser | null {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [data, sig] = parts;
  const expectedSig = crypto.createHmac('sha256', SESSION_SECRET).update(data).digest('base64url');
  if (sig !== expectedSig) return null;
  try {
    return JSON.parse(Buffer.from(data, 'base64url').toString('utf-8')) as AuthenticatedUser;
  } catch {
    return null;
  }
}

interface ApiRequest extends Request {
  authUser?: AuthenticatedUser | null;
}

// Simple in-memory rate limiter per IP for write endpoints
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
function rateLimitMiddleware(maxRequests = 90, windowMs = 60_000) {
  return (req: Request, res: Response, next: NextFunction) => {
    const key = req.ip || 'local';
    const now = Date.now();
    const record = rateLimitMap.get(key);
    if (!record || record.resetAt < now) {
      rateLimitMap.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }
    record.count += 1;
    if (record.count > maxRequests) {
      return res.status(429).json({ error: 'Trop de requêtes. Veuillez patienter quelques instants.' });
    }
    return next();
  };
}

function attachAuthUser(req: ApiRequest, _res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    req.authUser = verifyToken(authHeader.slice(7));
  } else {
    req.authUser = null;
  }
  next();
}

function requirePermission(permission: string) {
  return (req: ApiRequest, res: Response, next: NextFunction) => {
    const user = req.authUser;
    if (!user || user.type !== 'staff' || !user.staffRole) {
      return res.status(401).json({ error: 'Authentification du personnel requise.' });
    }
    const perms = ROLE_PERMISSIONS[user.staffRole] || [];
    if (!perms.includes(permission)) {
      return res.status(403).json({
        error: `Accès refusé : votre rôle (${user.staffRole}) ne dispose pas de la permission « ${permission} ».`,
      });
    }
    return next();
  };
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '1mb' }));
  app.use(attachAuthUser);

  // 1. Public bootstrap endpoint
  app.get('/api/bootstrap', (_req: ApiRequest, res: Response) => {
    try {
      const state = store.getStateReadOnly();
      const enrichedProducts = state.products
        .filter((p) => p.isActive)
        .map((p) => {
          const inv = state.inventory.find((i) => i.productId === p.id);
          return {
            ...p,
            availableBaseUnits: inv ? inv.availableStock : 0,
          };
        });

      res.json({
        settings: state.settings,
        hours: state.hours,
        categories: state.categories.filter((c) => c.isActive).sort((a, b) => a.sortOrder - b.sortOrder),
        products: enrichedProducts,
        events: state.events.filter((e) => e.isPublished),
        media: state.media.filter((m) => m.isApproved),
        reviews: (state.reviews || []).filter((r) => r.status === 'approved'),
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Erreur lors du chargement initial.' });
    }
  });

  // 1b. Submit a customer review (requires staff moderation before appearing publicly)
  app.post('/api/reviews', rateLimitMiddleware(15, 60_000), async (req: Request, res: Response) => {
    try {
      const { targetType, productId, authorName, rating, comment, visitContext } = req.body;
      if (!authorName || String(authorName).trim().length < 2) {
        return res.status(400).json({ error: 'Veuillez indiquer votre nom ou vos initiales.' });
      }
      if (!comment || String(comment).trim().length < 8) {
        return res.status(400).json({ error: 'Votre commentaire doit contenir au moins 8 caractères.' });
      }
      const numRating = Math.min(5, Math.max(1, Math.round(Number(rating) || 5)));
      const cleanComment = String(comment).trim().slice(0, 600);
      const cleanAuthor = String(authorName).trim().slice(0, 80);
      const cleanContext = visitContext ? String(visitContext).trim().slice(0, 80) : undefined;

      const created = await store.runAtomic((state) => {
        const prod = productId ? state.products.find((p) => p.id === productId || p.slug === productId) : undefined;
        const record = {
          id: `rev-${crypto.randomUUID().slice(0, 8)}`,
          targetType: targetType === 'product' && prod ? ('product' as const) : ('experience' as const),
          productId: prod?.id,
          productSlug: prod?.slug,
          productNameFr: prod?.nameFr,
          productNameEn: prod?.nameEn,
          authorName: cleanAuthor,
          rating: numRating,
          commentFr: cleanComment,
          commentEn: cleanComment,
          visitContextFr: cleanContext,
          visitContextEn: cleanContext,
          status: 'pending' as const,
          isDemo: false,
          createdAt: new Date().toISOString(),
        };
        if (!Array.isArray(state.reviews)) state.reviews = [];
        state.reviews.unshift(record);
        return record;
      });

      return res.status(201).json({
        review: created,
        message: 'Merci ! Votre avis a été transmis et sera publié après modération par notre équipe.',
      });
    } catch (error: any) {
      return res.status(400).json({ error: error.message || 'Impossible d’enregistrer votre avis.' });
    }
  });

  // 2. Server-side catalog search, filtering, sorting & pagination
  app.get('/api/catalog', (req: Request, res: Response) => {
    try {
      const state = store.getStateReadOnly();
      const q = String(req.query.q || '').trim().toLowerCase();
      const category = String(req.query.category || '').trim();
      const inStockOnly = req.query.inStock === 'true';
      const maxPrice = Number(req.query.maxPrice || 0);
      const dietary = String(req.query.dietary || '').trim().toLowerCase();
      const sort = String(req.query.sort || 'relevance');
      const page = Math.max(1, Number(req.query.page || 1));
      const pageSize = Math.min(24, Math.max(1, Number(req.query.pageSize || 9)));

      const activeCategories = new Map(
        state.categories.filter((c) => c.isActive).map((c) => [c.id, c])
      );

      let items = state.products
        .filter((p) => p.isActive && activeCategories.has(p.categoryId))
        .map((p) => {
          const inv = state.inventory.find((i) => i.productId === p.id);
          return {
            ...p,
            availableBaseUnits: inv ? inv.availableStock : 0,
          };
        });

      if (category && category !== 'all') {
        items = items.filter((p) => {
          const cat = activeCategories.get(p.categoryId);
          return p.categoryId === category || cat?.slug === category;
        });
      }

      if (q) {
        items = items.filter((p) => {
          const cat = activeCategories.get(p.categoryId);
          return (
            p.nameFr.toLowerCase().includes(q) ||
            p.nameEn.toLowerCase().includes(q) ||
            p.descriptionFr.toLowerCase().includes(q) ||
            p.descriptionEn.toLowerCase().includes(q) ||
            p.publicRef.toLowerCase().includes(q) ||
            (cat && (cat.nameFr.toLowerCase().includes(q) || cat.nameEn.toLowerCase().includes(q)))
          );
        });
      }

      if (inStockOnly) {
        items = items.filter((p) => (p.availableBaseUnits || 0) > 0);
      }

      if (maxPrice > 0) {
        items = items.filter((p) => p.basePriceXaf <= maxPrice);
      }

      if (dietary) {
        items = items.filter((p) => p.dietaryTags.some((t) => t.toLowerCase().includes(dietary)));
      }

      if (sort === 'price_asc') {
        items.sort((a, b) => a.basePriceXaf - b.basePriceXaf);
      } else if (sort === 'price_desc') {
        items.sort((a, b) => b.basePriceXaf - a.basePriceXaf);
      } else if (sort === 'newest') {
        items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      }

      const totalCount = items.length;
      const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
      const pagedItems = items.slice((page - 1) * pageSize, page * pageSize);

      res.json({
        items: pagedItems,
        totalCount,
        page,
        pageSize,
        totalPages,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Erreur lors de la recherche catalogue.' });
    }
  });

  // 3. Cart live validation against server prices & stock
  app.post('/api/cart/validate', (req: Request, res: Response) => {
    try {
      const state = store.getStateReadOnly();
      const rawItems = Array.isArray(req.body.items) ? req.body.items : [];
      const warnings: string[] = [];
      const validatedLines = [];
      let subtotalXaf = 0;

      // Aggregate base units per product to detect multi-variant stock exhaustion
      const requestedBaseByProduct = new Map<string, number>();

      for (const line of rawItems) {
        const product = state.products.find((p) => p.id === line.productId);
        if (!product || !product.isActive) {
          warnings.push(`Un article de votre panier n'est plus disponible à la vente.`);
          continue;
        }
        const variant = product.variants.find((v) => v.id === line.variantId);
        if (!variant || !variant.isActive) {
          warnings.push(`Une variante de « ${product.nameFr} » n'est plus disponible.`);
          continue;
        }
        const inv = state.inventory.find((i) => i.productId === product.id);
        const availBase = inv ? inv.availableStock : 0;

        if (line.addedPriceXaf && line.addedPriceXaf !== variant.priceXaf) {
          warnings.push(
            `Le tarif de « ${product.nameFr} (${variant.nameFr}) » a été actualisé à ${variant.priceXaf} XAF.`
          );
        }

        const qty = Math.max(1, Math.trunc(Number(line.quantity) || 1));
        const baseNeeded = qty * variant.unitMultiplier;
        const cumulativeBase = (requestedBaseByProduct.get(product.id) || 0) + baseNeeded;
        requestedBaseByProduct.set(product.id, cumulativeBase);

        const stockSufficient = availBase >= cumulativeBase;
        if (!stockSufficient) {
          warnings.push(
            `Stock disponible insuffisant pour « ${product.nameFr} (${variant.nameFr}) » : ${availBase} ${inv?.managementUnitFr || 'unité(s)'} disponible(s).`
          );
        }

        const lineTotalXaf = qty * variant.priceXaf;
        subtotalXaf += lineTotalXaf;

        validatedLines.push({
          productId: product.id,
          variantId: variant.id,
          productNameFr: product.nameFr,
          productNameEn: product.nameEn,
          variantNameFr: variant.nameFr,
          variantNameEn: variant.nameEn,
          unitPriceXaf: variant.priceXaf,
          unitMultiplier: variant.unitMultiplier,
          quantity: qty,
          baseUnitsNeeded: baseNeeded,
          availableBaseUnits: availBase,
          stockSufficient,
          lineTotalXaf,
          selectedOptions: line.selectedOptions || [],
        });
      }

      res.json({
        lines: validatedLines,
        subtotalXaf,
        warnings,
        allAvailable: warnings.length === 0,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Erreur de validation du panier.' });
    }
  });

  // 4. Create Order (Atomic stock reservation + idempotency key)
  app.post('/api/orders', rateLimitMiddleware(30, 60_000), async (req: ApiRequest, res: Response) => {
    try {
      const result = await store.runAtomic((state) =>
        createOrderInState(state, {
          ...req.body,
          channel: 'online',
          customerUserId: req.authUser?.id || null,
        })
      );
      res.status(result.idempotentReplay ? 200 : 201).json(result);
    } catch (error: any) {
      const status = error.message?.includes('INSUFFICIENT_STOCK') ? 409 : 400;
      res.status(status).json({ error: error.message || 'Impossible de créer la commande.' });
    }
  });

  // 5. Protected Order Tracking (requires token, matching phone, or staff auth)
  app.get('/api/orders/:reference', (req: ApiRequest, res: Response) => {
    try {
      const state = store.getStateReadOnly();
      const ref = String(req.params.reference || '').trim().toUpperCase();
      const token = String(req.query.token || '').trim();
      const phone = String(req.query.phone || '').trim().replace(/\s+/g, '');

      const order = state.orders.find((o) => o.reference.toUpperCase() === ref);
      if (!order) {
        return res.status(404).json({ error: 'Aucune commande trouvée pour cette référence.' });
      }

      const isStaff = req.authUser?.type === 'staff';
      const isOwnerCustomer = req.authUser && order.customerUserId && req.authUser.id === order.customerUserId;
      const tokenMatches = Boolean(token && order.trackingToken === token);
      const normalizedOrderPhone = order.customerPhone.replace(/\s+/g, '');
      const phoneMatches = Boolean(phone && phone.length >= 4 && normalizedOrderPhone.endsWith(phone));

      if (!isStaff && !isOwnerCustomer && !tokenMatches && !phoneMatches) {
        return res.status(403).json({
          error:
            'Accès protégé : veuillez fournir le jeton de suivi sécurisé ou les 4 derniers chiffres du téléphone utilisé lors de la commande.',
          requiresVerification: true,
        });
      }

      res.json({ order });
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Erreur lors de la récupération de la commande.' });
    }
  });

  // 6. Customer Orders & Reservations History (by session or phone + token)
  app.get('/api/my-account', (req: ApiRequest, res: Response) => {
    try {
      const state = store.getStateReadOnly();
      if (!req.authUser) {
        return res.status(401).json({ error: 'Non connecté.' });
      }
      const myOrders = state.orders.filter(
        (o) =>
          o.customerUserId === req.authUser!.id ||
          (req.authUser!.phone && o.customerPhone === req.authUser!.phone)
      );
      const myReservations = state.reservations.filter(
        (r) => req.authUser!.phone && r.customerPhone === req.authUser!.phone
      );
      res.json({ user: req.authUser, orders: myOrders, reservations: myReservations });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // 7. Create Reservation Request
  app.post('/api/reservations', rateLimitMiddleware(20, 60_000), async (req: Request, res: Response) => {
    try {
      const reservation = await store.runAtomic((state) => createReservationInState(state, req.body));
      res.status(201).json({
        reservation,
        message: 'Votre demande a été enregistrée. Elle sera confirmée par l’établissement.',
      });
    } catch (error: any) {
      const status = error.message?.includes('CAPACITY_EXCEEDED') ? 409 : 400;
      res.status(status).json({ error: error.message || 'Impossible d’enregistrer la demande de réservation.' });
    }
  });

  // 8. Authentication / Role Session Switcher (Demo & Staff Portal)
  app.post('/api/auth/login', (req: Request, res: Response) => {
    try {
      const state = store.getStateReadOnly();
      const { mode, staffRole, customerName, customerEmail, customerPhone } = req.body;

      if (mode === 'staff') {
        const member = state.staff.find((s) => s.role === staffRole && s.isActive);
        if (!member) {
          return res.status(404).json({ error: 'Compte personnel introuvable ou inactif.' });
        }
        const user: AuthenticatedUser = {
          id: member.id,
          email: member.email,
          fullName: member.fullName,
          type: 'staff',
          staffRole: member.role,
          permissions: ROLE_PERMISSIONS[member.role] || [],
        };
        const token = signToken(user);
        return res.json({ user, token });
      }

      // Customer session
      if (!customerName?.trim() || !customerPhone?.trim()) {
        return res.status(400).json({ error: 'Veuillez renseigner votre nom et votre numéro de téléphone.' });
      }
      const user: AuthenticatedUser = {
        id: `cust-${crypto.createHash('sha1').update(customerPhone.trim()).digest('hex').slice(0, 10)}`,
        email: (customerEmail || '').trim(),
        fullName: customerName.trim(),
        phone: customerPhone.trim(),
        type: 'customer',
        permissions: [],
      };
      const token = signToken(user);
      return res.json({ user, token });
    } catch (error: any) {
      return res.status(500).json({ error: error.message || 'Erreur d’authentification.' });
    }
  });

  // 9. Payment Webhook Endpoint (Idempotent & Authenticated)
  app.post('/api/webhooks/payment', async (req: Request, res: Response) => {
    try {
      const { orderId, status, webhookEventId, signature } = req.body;
      const expectedSecret = process.env.PAYMENT_WEBHOOK_SECRET || 'demo-webhook-secret';
      if (signature !== expectedSecret) {
        return res.status(401).json({ error: 'Signature webhook invalide.' });
      }
      if (!webhookEventId || !orderId) {
        return res.status(400).json({ error: 'Paramètres webhook incomplets.' });
      }

      const result = await store.runAtomic((state) =>
        transitionPaymentStatusInState(
          state,
          orderId,
          status === 'succeeded' ? 'paid' : status === 'refunded' ? 'refunded' : 'failed',
          { id: 'webhook', name: 'Webhook Prestataire Paiement', role: 'system' },
          webhookEventId
        )
      );
      return res.json(result);
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  });

  // ============================================================================
  // ADMIN API ROUTES (Protected by Server-Side RBAC)
  // ============================================================================

  app.get('/api/admin/state', requirePermission('dashboard:read'), (req: ApiRequest, res: Response) => {
    try {
      const state = store.getStateReadOnly();
      const user = req.authUser!;
      const perms = user.permissions || [];
      const sanitizedInventory = sanitizeInventoryForUser(state.inventory, user);

      const canReadCost = perms.includes('cost:read');
      const sanitizedReceipts = state.receipts.map((r) => {
        const copy = { ...r };
        if (!canReadCost) delete copy.unitCostXaf;
        return copy;
      });

      res.json({
        user,
        settings: state.settings,
        hours: state.hours,
        categories: state.categories,
        products: state.products,
        locations: state.locations,
        suppliers: state.suppliers,
        inventory: sanitizedInventory,
        movements: state.movements,
        stockReservations: state.stockReservations,
        receipts: sanitizedReceipts,
        inventoryCounts: state.inventoryCounts,
        orders: perms.includes('orders:read') ? state.orders : [],
        payments: perms.includes('orders:read') ? state.payments : [],
        reservations: state.reservations,
        events: state.events,
        media: state.media,
        reviews: state.reviews || [],
        sanityStatus: store.getSanityStatus(),
        staff: perms.includes('staff:write') || user.staffRole === 'manager' ? state.staff : [],
        auditLogs: perms.includes('audit:read') ? state.auditLogs : [],
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Admin: Moderate Customer Review (approve / reject / delete)
  app.post('/api/admin/reviews/:id/moderate', requirePermission('reviews:write'), async (req: ApiRequest, res: Response) => {
    try {
      const user = req.authUser!;
      const { status, action } = req.body;
      const result = await store.runAtomic((state) => {
        if (!Array.isArray(state.reviews)) state.reviews = [];
        const idx = state.reviews.findIndex((r) => r.id === req.params.id);
        if (idx < 0) throw new Error('Avis client introuvable.');

        if (action === 'delete') {
          const [deleted] = state.reviews.splice(idx, 1);
          store.addAuditLog(
            { id: user.id, name: user.fullName, role: user.staffRole || 'staff' },
            'REVIEW_DELETED',
            'reviews',
            deleted.id,
            `Suppression de l'avis de ${deleted.authorName}`
          );
          return { deleted: true, id: deleted.id };
        }

        const nextStatus = status === 'approved' ? 'approved' : status === 'rejected' ? 'rejected' : 'pending';
        const review = state.reviews[idx];
        review.status = nextStatus;
        review.moderatedBy = user.fullName;
        review.moderatedAt = new Date().toISOString();

        store.addAuditLog(
          { id: user.id, name: user.fullName, role: user.staffRole || 'staff' },
          'REVIEW_MODERATED',
          'reviews',
          review.id,
          `Auteur: ${review.authorName} -> Statut: ${review.status}`
        );
        return { review };
      });
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Admin: Trigger Sanity Cloud Sync & Check Connection
  app.post('/api/admin/sanity/sync', requirePermission('dashboard:read'), async (req: ApiRequest, res: Response) => {
    try {
      const status = await store.syncWithSanityNow();
      if (req.authUser) {
        store.addAuditLog(
          { id: req.authUser.id, name: req.authUser.fullName, role: req.authUser.staffRole || 'staff' },
          'SANITY_CLOUD_SYNC',
          'sanity_db',
          status.projectId,
          status.connected ? `Synchronisé (${status.dataset})` : `Erreur: ${status.lastError || 'Inconnue'}`
        );
      }
      res.json({ sanityStatus: status });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Admin: Order Status Transition
  app.post('/api/admin/orders/:id/status', requirePermission('orders:write'), async (req: ApiRequest, res: Response) => {
    try {
      const user = req.authUser!;
      const order = await store.runAtomic((state) =>
        transitionOrderStatusInState(state, req.params.id, req.body.status, {
          id: user.id,
          name: user.fullName,
          role: user.staffRole || 'staff',
        })
      );
      res.json({ order });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Admin: Payment Status Transition
  app.post('/api/admin/orders/:id/payment', requirePermission('orders:write'), async (req: ApiRequest, res: Response) => {
    try {
      const user = req.authUser!;
      const nextStatus = req.body.paymentStatus;
      if ((nextStatus === 'refunded' || nextStatus === 'partially_refunded') && !user.permissions.includes('payments:write')) {
        return res.status(403).json({
          error: 'Seuls le Propriétaire et le Gestionnaire peuvent enregistrer un remboursement.',
        });
      }

      const result = await store.runAtomic((state) =>
        transitionPaymentStatusInState(
          state,
          req.params.id,
          nextStatus,
          {
            id: user.id,
            name: user.fullName,
            role: user.staffRole || 'staff',
          },
          req.body.webhookEventId
        )
      );
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Admin: POS Manual / Off-site Sale (Counter, Dine-In, Phone)
  app.post('/api/admin/pos/sale', requirePermission('pos:create'), async (req: ApiRequest, res: Response) => {
    try {
      const user = req.authUser!;
      const result = await store.runAtomic((state) =>
        createOrderInState(state, {
          ...req.body,
          channel: req.body.channel || 'counter',
          actor: {
            id: user.id,
            name: user.fullName,
            role: user.staffRole || 'staff',
          },
        })
      );
      res.status(201).json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Admin: Record Stock Movement (Return, Breakage, Loss, Internal Consumption, Transfer)
  app.post('/api/admin/stock/movement', requirePermission('stock:write'), async (req: ApiRequest, res: Response) => {
    try {
      const user = req.authUser!;
      const result = await store.runAtomic((state) =>
        recordStockMovementInState(state, {
          ...req.body,
          actor: {
            id: user.id,
            name: user.fullName,
            role: user.staffRole || 'staff',
          },
        })
      );
      res.status(201).json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Admin: Record Supplier Receipt
  app.post('/api/admin/stock/receipt', requirePermission('receipts:write'), async (req: ApiRequest, res: Response) => {
    try {
      const user = req.authUser!;
      const receipt = await store.runAtomic((state) =>
        recordSupplierReceiptInState(state, {
          ...req.body,
          actor: {
            id: user.id,
            name: user.fullName,
            role: user.staffRole || 'staff',
          },
        })
      );
      res.status(201).json({ receipt });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Admin: Validate Physical Inventory Count
  app.post(
    '/api/admin/stock/inventory-count',
    requirePermission('inventory:validate'),
    async (req: ApiRequest, res: Response) => {
      try {
        const user = req.authUser!;
        const session = await store.runAtomic((state) =>
          validateInventoryCountInState(state, {
            counts: req.body.counts || [],
            actor: {
              id: user.id,
              name: user.fullName,
              role: user.staffRole || 'staff',
            },
          })
        );
        res.status(201).json({ session });
      } catch (error: any) {
        res.status(400).json({ error: error.message });
      }
    }
  );

  // Admin: Update Alert Threshold or Item Metadata
  app.put('/api/admin/stock/:id', requirePermission('stock:write'), async (req: ApiRequest, res: Response) => {
    try {
      const user = req.authUser!;
      const updated = await store.runAtomic((state) => {
        const item = state.inventory.find((i) => i.id === req.params.id);
        if (!item) throw new Error('Article de stock introuvable.');
        if (req.body.alertThreshold !== undefined) {
          item.alertThreshold = Math.max(0, Math.trunc(Number(req.body.alertThreshold)));
        }
        if (req.body.privateCostXaf !== undefined && user.permissions.includes('cost:read')) {
          item.privateCostXaf = Math.max(0, Math.trunc(Number(req.body.privateCostXaf)));
        }
        if (req.body.batchNumber !== undefined) item.batchNumber = String(req.body.batchNumber).trim();
        if (req.body.expiryDate !== undefined) item.expiryDate = String(req.body.expiryDate).trim();
        item.updatedAt = new Date().toISOString();
        return item;
      });
      res.json({ item: updated });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Admin: Create or Update Product & Variants
  app.post('/api/admin/products', requirePermission('products:write'), async (req: ApiRequest, res: Response) => {
    try {
      const user = req.authUser!;
      const product = await store.runAtomic((state) => {
        const b = req.body;
        if (!b.nameFr?.trim() || !b.categoryId) {
          throw new Error('Le nom du produit et la catégorie sont obligatoires.');
        }
        const nowIso = new Date().toISOString();
        const prodId = b.id || `prod-${crypto.randomUUID().slice(0, 8)}`;
        const slug =
          b.slug?.trim() ||
          b.nameFr
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '');

        const existingIndex = state.products.findIndex((p) => p.id === prodId);
        const basePriceXaf = Math.max(0, Math.trunc(Number(b.basePriceXaf) || 0));

        const variants =
          Array.isArray(b.variants) && b.variants.length > 0
            ? b.variants.map((v: any, idx: number) => ({
                id: v.id || `var-${prodId}-${idx + 1}`,
                productId: prodId,
                sku: v.sku || `SKU-${prodId.toUpperCase()}-${idx + 1}`,
                nameFr: v.nameFr || 'Format Standard',
                nameEn: v.nameEn || v.nameFr || 'Standard Size',
                priceXaf: Math.max(0, Math.trunc(Number(v.priceXaf) ?? basePriceXaf)),
                unitMultiplier: Math.max(1, Math.trunc(Number(v.unitMultiplier) || 1)),
                isActive: v.isActive !== false,
              }))
            : [
                {
                  id: `var-${prodId}-1`,
                  productId: prodId,
                  sku: `SKU-${prodId.toUpperCase()}-STD`,
                  nameFr: 'Format Standard',
                  nameEn: 'Standard Format',
                  priceXaf: basePriceXaf,
                  unitMultiplier: 1,
                  isActive: true,
                },
              ];

        const prodRecord = {
          id: prodId,
          categoryId: b.categoryId,
          slug,
          publicRef: b.publicRef || `BV-${prodId.slice(-4).toUpperCase()}`,
          nameFr: b.nameFr.trim(),
          nameEn: (b.nameEn || b.nameFr).trim(),
          descriptionFr: (b.descriptionFr || '').trim(),
          descriptionEn: (b.descriptionEn || b.descriptionFr || '').trim(),
          basePriceXaf,
          isActive: b.isActive !== false,
          isDemo: Boolean(b.isDemo),
          validationStatus: b.validationStatus === 'validated' ? ('validated' as const) : ('to_confirm' as const),
          requiresAgeCheck: Boolean(b.requiresAgeCheck),
          allergensFr: Array.isArray(b.allergensFr) ? b.allergensFr : [],
          allergensEn: Array.isArray(b.allergensEn) ? b.allergensEn : [],
          dietaryTags: Array.isArray(b.dietaryTags) ? b.dietaryTags : [],
          dietaryTagsValidated: Boolean(b.dietaryTagsValidated),
          allowedOptionsFr: Array.isArray(b.allowedOptionsFr) ? b.allowedOptionsFr : [],
          allowedOptionsEn: Array.isArray(b.allowedOptionsEn) ? b.allowedOptionsEn : [],
          preparedStrategy: b.preparedStrategy || 'direct_unit',
          visualTheme: b.visualTheme || 'grill',
          createdAt: nowIso,
          variants,
        };

        if (existingIndex >= 0) {
          state.products[existingIndex] = prodRecord;
        } else {
          state.products.unshift(prodRecord);
          // Create corresponding InventoryItem automatically if new product
          const initialStock = Math.max(0, Math.trunc(Number(b.initialPhysicalStock) || 0));
          const invItem = {
            id: `inv-${prodId}`,
            productId: prodId,
            sku: `SKU-${prodId.toUpperCase()}-BASE`,
            designationFr: prodRecord.nameFr,
            designationEn: prodRecord.nameEn,
            managementUnitFr: b.managementUnitFr || 'unité',
            managementUnitEn: b.managementUnitEn || 'unit',
            physicalStock: initialStock,
            reservedStock: 0,
            availableStock: initialStock,
            alertThreshold: Math.max(0, Math.trunc(Number(b.alertThreshold) || 5)),
            privateCostXaf: b.privateCostXaf !== undefined ? Number(b.privateCostXaf) : null,
            sellingPriceXaf: basePriceXaf,
            supplierId: state.suppliers[0]?.id || null,
            locationId: state.locations[0]?.id || 'loc-main',
            batchNumber: null,
            expiryDate: null,
            preparedStrategy: prodRecord.preparedStrategy,
            updatedAt: nowIso,
          };
          state.inventory.unshift(invItem);

          if (initialStock > 0) {
            state.movements.unshift({
              id: `mov-${crypto.randomUUID().slice(0, 8)}`,
              inventoryItemId: invItem.id,
              sku: invItem.sku,
              productNameFr: invItem.designationFr,
              productNameEn: invItem.designationEn,
              movementType: 'supplier_receipt',
              quantityDelta: initialStock,
              previousPhysicalStock: 0,
              newPhysicalStock: initialStock,
              reason: 'Stock initial à la création du produit',
              referenceCode: prodRecord.publicRef,
              authorId: user.id,
              authorName: user.fullName,
              createdAt: nowIso,
            });
          }
        }

        store.addAuditLog(
          { id: user.id, name: user.fullName, role: user.staffRole || 'staff' },
          existingIndex >= 0 ? 'PRODUCT_UPDATED' : 'PRODUCT_CREATED',
          'products',
          prodRecord.slug,
          `${prodRecord.nameFr} (${prodRecord.basePriceXaf} XAF)`
        );

        return prodRecord;
      });
      res.status(201).json({ product });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Admin: Toggle Product Active or Validation Status
  app.patch('/api/admin/products/:id/toggle', requirePermission('products:write'), async (req: ApiRequest, res: Response) => {
    try {
      const user = req.authUser!;
      const product = await store.runAtomic((state) => {
        const p = state.products.find((item) => item.id === req.params.id);
        if (!p) throw new Error('Produit introuvable.');
        if (req.body.isActive !== undefined) p.isActive = Boolean(req.body.isActive);
        if (req.body.validationStatus !== undefined) p.validationStatus = req.body.validationStatus;
        if (req.body.isDemo !== undefined) p.isDemo = Boolean(req.body.isDemo);
        store.addAuditLog(
          { id: user.id, name: user.fullName, role: user.staffRole || 'staff' },
          'PRODUCT_STATUS_TOGGLED',
          'products',
          p.slug,
          `Actif: ${p.isActive} | Statut: ${p.validationStatus}`
        );
        return p;
      });
      res.json({ product });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Admin: Categories create/update
  app.post('/api/admin/categories', requirePermission('categories:write'), async (req: ApiRequest, res: Response) => {
    try {
      const category = await store.runAtomic((state) => {
        const b = req.body;
        if (!b.nameFr?.trim()) throw new Error('Nom de catégorie requis.');
        const id = b.id || `cat-${crypto.randomUUID().slice(0, 6)}`;
        const slug =
          b.slug ||
          b.nameFr
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]+/g, '-');
        const record = {
          id,
          slug,
          nameFr: b.nameFr.trim(),
          nameEn: (b.nameEn || b.nameFr).trim(),
          descriptionFr: (b.descriptionFr || '').trim(),
          descriptionEn: (b.descriptionEn || b.descriptionFr || '').trim(),
          sortOrder: Number(b.sortOrder || state.categories.length + 1),
          isActive: b.isActive !== false,
          isAlcoholicCategory: Boolean(b.isAlcoholicCategory),
          validationStatus: b.validationStatus === 'validated' ? ('validated' as const) : ('to_confirm' as const),
        };
        const idx = state.categories.findIndex((c) => c.id === id);
        if (idx >= 0) state.categories[idx] = record;
        else state.categories.push(record);
        return record;
      });
      res.status(201).json({ category });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Admin: Reservations status & internal notes
  app.post(
    '/api/admin/reservations/:id/status',
    requirePermission('reservations:write'),
    async (req: ApiRequest, res: Response) => {
      try {
        const user = req.authUser!;
        const reservation = await store.runAtomic((state) => {
          const r = state.reservations.find((item) => item.id === req.params.id);
          if (!r) throw new Error('Demande de réservation introuvable.');
          if (req.body.status) r.status = req.body.status;
          if (req.body.internalNotes !== undefined) r.internalNotes = String(req.body.internalNotes);
          r.updatedAt = new Date().toISOString();
          store.addAuditLog(
            { id: user.id, name: user.fullName, role: user.staffRole || 'staff' },
            'RESERVATION_UPDATED',
            'reservations',
            r.reference,
            `Statut: ${r.status}`
          );
          return r;
        });
        res.json({ reservation });
      } catch (error: any) {
        res.status(400).json({ error: error.message });
      }
    }
  );

  // Admin: Events create/update
  app.post('/api/admin/events', requirePermission('content:write'), async (req: ApiRequest, res: Response) => {
    try {
      const event = await store.runAtomic((state) => {
        const b = req.body;
        if (!b.titleFr?.trim() || !b.eventDate) {
          throw new Error('Le titre et la date de l’événement sont obligatoires.');
        }
        const id = b.id || `evt-${crypto.randomUUID().slice(0, 6)}`;
        const slug =
          b.slug ||
          b.titleFr
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]+/g, '-');
        const record = {
          id,
          slug,
          titleFr: b.titleFr.trim(),
          titleEn: (b.titleEn || b.titleFr).trim(),
          eventDate: b.eventDate,
          timeLabel: b.timeLabel || '20:00',
          descriptionFr: (b.descriptionFr || '').trim(),
          descriptionEn: (b.descriptionEn || b.descriptionFr || '').trim(),
          confirmedArtists: Array.isArray(b.confirmedArtists) ? b.confirmedArtists : [],
          accessConditionsFr: (b.accessConditionsFr || 'Sur réservation').trim(),
          accessConditionsEn: (b.accessConditionsEn || 'Upon reservation').trim(),
          validatedPriceXaf: b.validatedPriceXaf ? Number(b.validatedPriceXaf) : null,
          isPublished: Boolean(b.isPublished),
          validationStatus: b.validationStatus === 'validated' ? ('validated' as const) : ('to_confirm' as const),
          visualTheme: b.visualTheme || 'gold_acoustic',
        };
        const idx = state.events.findIndex((e) => e.id === id);
        if (idx >= 0) state.events[idx] = record;
        else state.events.unshift(record);
        return record;
      });
      res.status(201).json({ event });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Admin: Media Gallery create/toggle approval
  app.post('/api/admin/media', requirePermission('content:write'), async (req: ApiRequest, res: Response) => {
    try {
      const item = await store.runAtomic((state) => {
        const b = req.body;
        if (!b.titleFr?.trim()) throw new Error('Titre du média requis.');
        const record = {
          id: b.id || `med-${crypto.randomUUID().slice(0, 6)}`,
          titleFr: b.titleFr.trim(),
          titleEn: (b.titleEn || b.titleFr).trim(),
          captionFr: (b.captionFr || '').trim(),
          captionEn: (b.captionEn || b.captionFr || '').trim(),
          category: b.category || 'ambiance',
          visualTheme: b.visualTheme || 'lounge_arch',
          imageUrl: b.imageUrl?.trim() || undefined,
          isApproved: b.isApproved !== false,
          isDemoGraphic: Boolean(b.isDemoGraphic),
          createdAt: new Date().toISOString(),
        };
        const idx = state.media.findIndex((m) => m.id === record.id);
        if (idx >= 0) state.media[idx] = record;
        else state.media.unshift(record);
        return record;
      });
      res.status(201).json({ media: item });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Admin: Update Business Settings & Hours
  app.put('/api/admin/settings', requirePermission('settings:write'), async (req: ApiRequest, res: Response) => {
    try {
      const user = req.authUser!;
      const result = await store.runAtomic((state) => {
        if (req.body.settings) {
          state.settings = {
            ...state.settings,
            ...req.body.settings,
          };
        }
        if (Array.isArray(req.body.hours)) {
          state.hours = req.body.hours;
        }
        store.addAuditLog(
          { id: user.id, name: user.fullName, role: user.staffRole || 'owner' },
          'SETTINGS_UPDATED',
          'business_settings',
          'global',
          'Mise à jour des paramètres opérationnels et des statuts de validation.'
        );
        return { settings: state.settings, hours: state.hours };
      });
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Admin: Update Staff Role
  app.post('/api/admin/staff', requirePermission('staff:write'), async (req: ApiRequest, res: Response) => {
    try {
      const user = req.authUser!;
      const member = await store.runAtomic((state) => {
        const { id, email, fullName, role, isActive } = req.body;
        const allowedRoles: StaffRole[] = ['owner', 'manager', 'stock_manager', 'order_staff', 'content_manager'];
        if (!allowedRoles.includes(role)) {
          throw new Error('Rôle invalide.');
        }
        const existing = state.staff.find((s) => s.id === id || s.email === email);
        if (existing) {
          existing.role = role;
          if (fullName) existing.fullName = fullName.trim();
          if (isActive !== undefined) existing.isActive = Boolean(isActive);
          store.addAuditLog(
            { id: user.id, name: user.fullName, role: user.staffRole || 'owner' },
            'STAFF_ROLE_UPDATED',
            'staff_roles',
            existing.email,
            `Rôle: ${existing.role} | Actif: ${existing.isActive}`
          );
          return existing;
        }
        const newStaff = {
          id: `staff-${crypto.randomUUID().slice(0, 6)}`,
          email: String(email).trim(),
          fullName: String(fullName).trim(),
          role,
          isActive: true,
          createdAt: new Date().toISOString(),
        };
        state.staff.push(newStaff);
        return newStaff;
      });
      res.json({ member });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Admin: Sweep expired stock reservations manually
  app.post('/api/admin/sweep-expired', requirePermission('stock:read'), async (_req: ApiRequest, res: Response) => {
    try {
      const expiredCount = await store.runAtomic((state) => {
        let count = 0;
        const now = Date.now();
        for (const r of state.stockReservations) {
          if (r.status === 'active' && new Date(r.expiresAt).getTime() <= now) {
            const inv = state.inventory.find((i) => i.id === r.inventoryItemId);
            if (inv) {
              inv.reservedStock = Math.max(0, inv.reservedStock - r.baseQuantity);
              inv.availableStock = Math.max(0, inv.physicalStock - inv.reservedStock);
            }
            r.status = 'expired';
            count++;
          }
        }
        return count;
      });
      res.json({ expiredCount });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Admin: Run Automated Critical Test Suite (Section 22)
  app.post('/api/admin/run-critical-tests', requirePermission('dashboard:read'), (req: ApiRequest, res: Response) => {
    try {
      const report = runAutomatedCriticalTests();
      if (req.authUser) {
        store.addAuditLog(
          { id: req.authUser.id, name: req.authUser.fullName, role: req.authUser.staffRole || 'staff' },
          'CRITICAL_TESTS_EXECUTED',
          'system_tests',
          'suite-12',
          `Résultat: ${report.results.filter((r) => r.passed).length}/${report.results.length} tests réussis.`
        );
      }
      res.json(report);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Vite middleware in development, static files in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Le Boivement Full-Stack Server listening on http://localhost:${PORT}`);
  });
}

startServer();
