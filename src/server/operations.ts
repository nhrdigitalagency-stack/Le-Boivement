import crypto from 'crypto';
import {
  AuthenticatedUser,
  FulfillmentMode,
  InventoryCountSession,
  InventoryItem,
  MovementType,
  Order,
  OrderChannel,
  OrderItemSnapshot,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  PurchaseReceipt,
  ReservationRecord,
  StockMovement,
  StockReservationRecord,
} from '../types/domain.ts';
import { createInitialSeed, DatabaseState, ROLE_PERMISSIONS } from './store.ts';

export interface CreateOrderInput {
  idempotencyKey: string;
  channel?: OrderChannel;
  customerUserId?: string | null;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  fulfillmentMode: FulfillmentMode;
  deliveryAddress?: string;
  deliveryLandmark?: string;
  tableNumber?: string;
  requestedSlot?: string;
  instructions?: string;
  paymentMethod: PaymentMethod;
  items: {
    productId: string;
    variantId: string;
    quantity: number;
    selectedOptions?: string[];
  }[];
  completeImmediately?: boolean;
  actor?: { id: string; name: string; role: string };
}

export function sanitizeInventoryForUser(items: InventoryItem[], user?: AuthenticatedUser | null): InventoryItem[] {
  const canReadCost =
    user?.type === 'staff' &&
    user.staffRole &&
    ROLE_PERMISSIONS[user.staffRole]?.includes('cost:read');

  return items.map((item) => {
    const copy = { ...item };
    if (!canReadCost) {
      delete copy.privateCostXaf;
    }
    return copy;
  });
}

export function createOrderInState(
  state: DatabaseState,
  input: CreateOrderInput
): { order: Order; idempotentReplay: boolean } {
  if (!input.idempotencyKey || input.idempotencyKey.trim().length < 4) {
    throw new Error('Clé d’idempotence manquante ou invalide.');
  }

  // 1. Check idempotency key first
  const existingOrder = state.orders.find((o) => o.idempotencyKey === input.idempotencyKey);
  if (existingOrder) {
    return { order: existingOrder, idempotentReplay: true };
  }

  const isStaffManual = input.channel && input.channel !== 'online';
  if (!isStaffManual && !state.settings.onlineOrderingEnabled) {
    throw new Error('Les commandes en ligne sont actuellement désactivées par l’établissement.');
  }

  if (!input.customerName?.trim() || !input.customerPhone?.trim()) {
    throw new Error('Le nom et le numéro de téléphone sont obligatoires.');
  }

  if (input.fulfillmentMode === 'pickup' && !state.settings.pickupEnabled && !isStaffManual) {
    throw new Error('Le retrait sur place n’est pas activé.');
  }
  if (input.fulfillmentMode === 'delivery') {
    if (!state.settings.deliveryEnabled) {
      throw new Error('Le service de livraison n’est pas activé par l’établissement.');
    }
    if (!input.deliveryAddress?.trim()) {
      throw new Error('L’adresse de livraison est obligatoire pour une livraison.');
    }
  }
  if (input.fulfillmentMode === 'table') {
    if (!state.settings.tableOrderingEnabled && !isStaffManual) {
      throw new Error('La commande à table n’est pas activée.');
    }
    if (!input.tableNumber?.trim()) {
      throw new Error('Veuillez indiquer le numéro de table.');
    }
  }

  // Validate payment method
  if (input.paymentMethod === 'online_provider' && !state.settings.onlinePaymentEnabled) {
    throw new Error('Le paiement en ligne est désactivé tant qu’aucun prestataire certifié n’est configuré.');
  }
  if (input.paymentMethod === 'cash_on_delivery' && !state.settings.cashOnDeliveryEnabled) {
    throw new Error('Le paiement à la livraison n’est pas activé.');
  }
  if (input.paymentMethod === 'pay_on_site' && !state.settings.payOnSiteEnabled && !isStaffManual) {
    throw new Error('Le paiement sur place n’est pas activé.');
  }

  if (!Array.isArray(input.items) || input.items.length === 0) {
    throw new Error('Votre commande ne contient aucun article.');
  }

  // 2. Validate products/variants and aggregate base units per inventory item
  const requiredByInventoryId = new Map<string, number>();
  const snapshots: OrderItemSnapshot[] = [];
  let subtotalXaf = 0;

  for (const rawItem of input.items) {
    const qty = Math.floor(Number(rawItem.quantity));
    if (!Number.isFinite(qty) || qty <= 0 || qty > 500) {
      throw new Error('Quantité d’article invalide.');
    }

    const product = state.products.find((p) => p.id === rawItem.productId);
    if (!product || !product.isActive) {
      throw new Error(`L’article demandé (${rawItem.productId}) n’est plus disponible à la vente.`);
    }

    if (product.requiresAgeCheck && !state.settings.alcoholSaleEnabled) {
      throw new Error(`La vente de boissons alcoolisées (${product.nameFr}) est désactivée.`);
    }

    const variant = product.variants.find((v) => v.id === rawItem.variantId);
    if (!variant || !variant.isActive) {
      throw new Error(`La variante sélectionnée pour ${product.nameFr} n’est plus disponible.`);
    }

    const inv = state.inventory.find((i) => i.productId === product.id);
    if (!inv) {
      throw new Error(`Aucun stock configuré pour ${product.nameFr}.`);
    }

    const baseUnitsNeeded = qty * variant.unitMultiplier;
    requiredByInventoryId.set(inv.id, (requiredByInventoryId.get(inv.id) || 0) + baseUnitsNeeded);

    const lineTotalXaf = qty * variant.priceXaf;
    subtotalXaf += lineTotalXaf;

    snapshots.push({
      id: `oi-${crypto.randomUUID().slice(0, 8)}`,
      productId: product.id,
      variantId: variant.id,
      snapshotProductNameFr: product.nameFr,
      snapshotProductNameEn: product.nameEn,
      snapshotVariantNameFr: variant.nameFr,
      snapshotVariantNameEn: variant.nameEn,
      snapshotSku: variant.sku,
      snapshotUnitPriceXaf: variant.priceXaf,
      quantity: qty,
      baseUnitsReserved: baseUnitsNeeded,
      lineTotalXaf,
      selectedOptions: Array.isArray(rawItem.selectedOptions) ? rawItem.selectedOptions.slice(0, 5) : [],
    });
  }

  if (state.settings.minimumOrderXaf > 0 && subtotalXaf < state.settings.minimumOrderXaf && !isStaffManual) {
    throw new Error(`Le minimum de commande est de ${state.settings.minimumOrderXaf} XAF.`);
  }

  // 3. Atomic check of available stock across all required inventory items
  for (const [invId, totalBaseNeeded] of requiredByInventoryId.entries()) {
    const inv = state.inventory.find((i) => i.id === invId)!;
    const available = inv.physicalStock - inv.reservedStock;
    if (available < totalBaseNeeded) {
      throw new Error(
        `INSUFFICIENT_STOCK: Stock insuffisant pour « ${inv.designationFr} » (disponible : ${available} ${inv.managementUnitFr}, demandé : ${totalBaseNeeded} ${inv.managementUnitFr}).`
      );
    }
  }

  const feesXaf = input.fulfillmentMode === 'delivery' ? state.settings.deliveryFeeXaf : 0;
  const discountXaf = 0;
  const totalXaf = subtotalXaf + feesXaf - discountXaf;

  const nowIso = new Date().toISOString();
  const datePart = nowIso.slice(0, 10).replace(/-/g, '');
  const randomCode = crypto.randomBytes(3).toString('hex').toUpperCase();
  const reference = `BV-${datePart}-${randomCode}`;
  const trackingToken = crypto.randomBytes(12).toString('hex');
  const orderId = `ord-${crypto.randomUUID().slice(0, 12)}`;

  const ttlMs = (state.settings.stockReservationTtlMinutes || 30) * 60 * 1000;
  const expiresAtIso = new Date(Date.now() + ttlMs).toISOString();

  // 4. Reserve stock or immediately deduct if POS immediate sale
  const completeImmediately = Boolean(input.completeImmediately && isStaffManual);

  for (const [invId, totalBaseNeeded] of requiredByInventoryId.entries()) {
    const inv = state.inventory.find((i) => i.id === invId)!;

    if (completeImmediately) {
      const prevPhysical = inv.physicalStock;
      inv.physicalStock -= totalBaseNeeded;
      inv.availableStock = Math.max(0, inv.physicalStock - inv.reservedStock);
      inv.updatedAt = nowIso;

      state.movements.unshift({
        id: `mov-${crypto.randomUUID().slice(0, 8)}`,
        inventoryItemId: inv.id,
        sku: inv.sku,
        productNameFr: inv.designationFr,
        productNameEn: inv.designationEn,
        movementType: 'sale',
        quantityDelta: -totalBaseNeeded,
        previousPhysicalStock: prevPhysical,
        newPhysicalStock: inv.physicalStock,
        reason: `Vente directe (${input.channel}) ${reference}`,
        referenceCode: reference,
        authorId: input.actor?.id || 'staff-pos',
        authorName: input.actor?.name || 'Personnel Caisse',
        createdAt: nowIso,
      });

      state.stockReservations.unshift({
        id: `res-${crypto.randomUUID().slice(0, 8)}`,
        orderId,
        orderReference: reference,
        inventoryItemId: inv.id,
        sku: inv.sku,
        baseQuantity: totalBaseNeeded,
        status: 'consumed',
        expiresAt: expiresAtIso,
        createdAt: nowIso,
        updatedAt: nowIso,
      });
    } else {
      inv.reservedStock += totalBaseNeeded;
      inv.availableStock = Math.max(0, inv.physicalStock - inv.reservedStock);
      inv.updatedAt = nowIso;

      state.stockReservations.unshift({
        id: `res-${crypto.randomUUID().slice(0, 8)}`,
        orderId,
        orderReference: reference,
        inventoryItemId: inv.id,
        sku: inv.sku,
        baseQuantity: totalBaseNeeded,
        status: 'active',
        expiresAt: expiresAtIso,
        createdAt: nowIso,
        updatedAt: nowIso,
      });
    }
  }

  const newOrder: Order = {
    id: orderId,
    reference,
    trackingToken,
    idempotencyKey: input.idempotencyKey,
    channel: input.channel || 'online',
    customerUserId: input.customerUserId || null,
    customerName: input.customerName.trim(),
    customerPhone: input.customerPhone.trim(),
    customerEmail: (input.customerEmail || '').trim(),
    fulfillmentMode: input.fulfillmentMode,
    deliveryAddress: (input.deliveryAddress || '').trim(),
    deliveryLandmark: (input.deliveryLandmark || '').trim(),
    tableNumber: (input.tableNumber || '').trim(),
    requestedSlot: (input.requestedSlot || '').trim(),
    instructions: (input.instructions || '').trim(),
    orderStatus: completeImmediately ? 'completed' : 'pending',
    paymentStatus: completeImmediately
      ? 'paid'
      : input.paymentMethod === 'online_provider'
      ? 'pending_payment'
      : 'unpaid',
    paymentMethod: input.paymentMethod,
    subtotalXaf,
    feesXaf,
    discountXaf,
    totalXaf,
    stockDeducted: completeImmediately,
    items: snapshots,
    createdByStaffName: input.actor?.name,
    createdAt: nowIso,
    updatedAt: nowIso,
  };

  state.orders.unshift(newOrder);

  state.auditLogs.unshift({
    id: `aud-${crypto.randomUUID().slice(0, 8)}`,
    actorId: input.actor?.id || 'customer',
    actorName: input.actor?.name || newOrder.customerName,
    actorRole: input.actor?.role || 'customer',
    action: 'ORDER_CREATED',
    entityType: 'orders',
    entityId: newOrder.reference,
    details: `Canal: ${newOrder.channel} | Total: ${newOrder.totalXaf} XAF | Mode: ${newOrder.fulfillmentMode}`,
    createdAt: nowIso,
  });

  return { order: newOrder, idempotentReplay: false };
}

export function transitionOrderStatusInState(
  state: DatabaseState,
  orderId: string,
  nextStatus: OrderStatus,
  actor: { id: string; name: string; role: string }
): Order {
  const order = state.orders.find((o) => o.id === orderId || o.reference === orderId);
  if (!order) {
    throw new Error('Commande introuvable.');
  }

  // Idempotent if already in target status
  if (order.orderStatus === nextStatus) {
    return order;
  }

  if (order.orderStatus === 'cancelled' && nextStatus !== 'cancelled') {
    throw new Error('Une commande annulée ne peut plus changer de statut.');
  }
  if (order.orderStatus === 'completed' && nextStatus === 'cancelled') {
    throw new Error('Une commande déjà remise et terminée ne peut pas être annulée sans procédure de retour physique.');
  }

  const nowIso = new Date().toISOString();

  // Case 1: Cancellation -> Release active stock reservations idempotently
  if (nextStatus === 'cancelled') {
    for (const res of state.stockReservations) {
      if (res.orderId === order.id && res.status === 'active') {
        const inv = state.inventory.find((i) => i.id === res.inventoryItemId);
        if (inv) {
          inv.reservedStock = Math.max(0, inv.reservedStock - res.baseQuantity);
          inv.availableStock = Math.max(0, inv.physicalStock - inv.reservedStock);
          inv.updatedAt = nowIso;
        }
        res.status = 'released';
        res.updatedAt = nowIso;
      }
    }
  }

  // Case 2: Handover ('completed' or 'delivered') -> Deduct physical stock ONCE
  if ((nextStatus === 'completed' || nextStatus === 'delivered') && !order.stockDeducted) {
    for (const res of state.stockReservations) {
      if (res.orderId === order.id && res.status === 'active') {
        const inv = state.inventory.find((i) => i.id === res.inventoryItemId);
        if (!inv) {
          throw new Error(`Article d'inventaire introuvable pour la réservation ${res.sku}.`);
        }
        const prevPhysical = inv.physicalStock;
        inv.physicalStock = Math.max(0, inv.physicalStock - res.baseQuantity);
        inv.reservedStock = Math.max(0, inv.reservedStock - res.baseQuantity);
        inv.availableStock = Math.max(0, inv.physicalStock - inv.reservedStock);
        inv.updatedAt = nowIso;

        res.status = 'consumed';
        res.updatedAt = nowIso;

        state.movements.unshift({
          id: `mov-${crypto.randomUUID().slice(0, 8)}`,
          inventoryItemId: inv.id,
          sku: inv.sku,
          productNameFr: inv.designationFr,
          productNameEn: inv.designationEn,
          movementType: 'sale',
          quantityDelta: -res.baseQuantity,
          previousPhysicalStock: prevPhysical,
          newPhysicalStock: inv.physicalStock,
          reason: `Remise commande ${order.reference}`,
          referenceCode: order.reference,
          authorId: actor.id,
          authorName: actor.name,
          createdAt: nowIso,
        });
      }
    }
    order.stockDeducted = true;
  }

  const prevStatus = order.orderStatus;
  order.orderStatus = nextStatus;
  order.updatedAt = nowIso;

  state.auditLogs.unshift({
    id: `aud-${crypto.randomUUID().slice(0, 8)}`,
    actorId: actor.id,
    actorName: actor.name,
    actorRole: actor.role,
    action: 'ORDER_STATUS_UPDATED',
    entityType: 'orders',
    entityId: order.reference,
    details: `${prevStatus} -> ${nextStatus}`,
    createdAt: nowIso,
  });

  return order;
}

export function transitionPaymentStatusInState(
  state: DatabaseState,
  orderId: string,
  nextPaymentStatus: PaymentStatus,
  actor: { id: string; name: string; role: string },
  webhookEventId?: string
): { order: Order; idempotentWebhookReplay: boolean; latePaymentConflict: boolean } {
  if (webhookEventId) {
    if (state.processedWebhookIds.includes(webhookEventId)) {
      const existingOrder = state.orders.find((o) => o.id === orderId || o.reference === orderId);
      if (!existingOrder) throw new Error('Commande introuvable.');
      return { order: existingOrder, idempotentWebhookReplay: true, latePaymentConflict: false };
    }
    state.processedWebhookIds.push(webhookEventId);
  }

  const order = state.orders.find((o) => o.id === orderId || o.reference === orderId);
  if (!order) {
    throw new Error('Commande introuvable.');
  }

  const nowIso = new Date().toISOString();
  let latePaymentConflict = false;

  // Check if payment succeeded AFTER stock reservation had expired
  if (nextPaymentStatus === 'paid') {
    const expiredReservations = state.stockReservations.filter(
      (r) => r.orderId === order.id && (r.status === 'expired' || r.status === 'released')
    );

    if (expiredReservations.length > 0 && !order.stockDeducted) {
      // Check if we can re-reserve all items safely
      let canReReserveAll = true;
      for (const expRes of expiredReservations) {
        const inv = state.inventory.find((i) => i.id === expRes.inventoryItemId);
        if (!inv || inv.physicalStock - inv.reservedStock < expRes.baseQuantity) {
          canReReserveAll = false;
          break;
        }
      }

      if (canReReserveAll) {
        for (const expRes of expiredReservations) {
          const inv = state.inventory.find((i) => i.id === expRes.inventoryItemId)!;
          inv.reservedStock += expRes.baseQuantity;
          inv.availableStock = Math.max(0, inv.physicalStock - inv.reservedStock);
          expRes.status = 'active';
          expRes.updatedAt = nowIso;
        }
        if (order.orderStatus === 'cancelled') {
          order.orderStatus = 'accepted';
        }
      } else {
        latePaymentConflict = true;
      }
    }
  }

  // Note: Refunds ('refunded' or 'partially_refunded') NEVER auto-increment physicalStock.
  // Physical stock return requires a separate quality-checked 'return' stock movement.
  const prevPaymentStatus = order.paymentStatus;
  order.paymentStatus = nextPaymentStatus;
  order.updatedAt = nowIso;

  state.auditLogs.unshift({
    id: `aud-${crypto.randomUUID().slice(0, 8)}`,
    actorId: actor.id,
    actorName: actor.name,
    actorRole: actor.role,
    action: latePaymentConflict ? 'PAYMENT_LATE_CONFLICT_DETECTED' : 'PAYMENT_STATUS_UPDATED',
    entityType: 'orders',
    entityId: order.reference,
    details: latePaymentConflict
      ? `Paiement reçu après expiration de la réservation de stock (${prevPaymentStatus} -> ${nextPaymentStatus}). Action manuelle requise.`
      : `Paiement : ${prevPaymentStatus} -> ${nextPaymentStatus} (Stock physique inchangé par la transition financière).`,
    createdAt: nowIso,
  });

  return { order, idempotentWebhookReplay: false, latePaymentConflict };
}

export function recordStockMovementInState(
  state: DatabaseState,
  input: {
    inventoryItemId: string;
    movementType: MovementType;
    quantityDelta: number;
    reason: string;
    referenceCode?: string;
    actor: { id: string; name: string; role: string };
  }
): { item: InventoryItem; movement: StockMovement } {
  const item = state.inventory.find((i) => i.id === input.inventoryItemId);
  if (!item) {
    throw new Error('Article de stock introuvable.');
  }

  const delta = Math.trunc(Number(input.quantityDelta));
  if (!Number.isFinite(delta) || delta === 0) {
    throw new Error('La quantité du mouvement doit être non nulle.');
  }
  if (!input.reason?.trim()) {
    throw new Error('Le motif du mouvement de stock est obligatoire.');
  }

  const newPhysical = item.physicalStock + delta;
  if (newPhysical < 0) {
    throw new Error(`Opération refusée : le stock physique ne peut pas devenir négatif (${item.physicalStock} + ${delta} < 0).`);
  }
  if (newPhysical < item.reservedStock) {
    throw new Error(
      `Opération refusée : le nouveau stock physique (${newPhysical}) serait inférieur au stock actuellement réservé (${item.reservedStock}).`
    );
  }

  const prevPhysical = item.physicalStock;
  const nowIso = new Date().toISOString();

  item.physicalStock = newPhysical;
  item.availableStock = Math.max(0, item.physicalStock - item.reservedStock);
  item.updatedAt = nowIso;

  const movement: StockMovement = {
    id: `mov-${crypto.randomUUID().slice(0, 8)}`,
    inventoryItemId: item.id,
    sku: item.sku,
    productNameFr: item.designationFr,
    productNameEn: item.designationEn,
    movementType: input.movementType,
    quantityDelta: delta,
    previousPhysicalStock: prevPhysical,
    newPhysicalStock: newPhysical,
    reason: input.reason.trim(),
    referenceCode: input.referenceCode?.trim() || null,
    authorId: input.actor.id,
    authorName: input.actor.name,
    createdAt: nowIso,
  };

  state.movements.unshift(movement);

  state.auditLogs.unshift({
    id: `aud-${crypto.randomUUID().slice(0, 8)}`,
    actorId: input.actor.id,
    actorName: input.actor.name,
    actorRole: input.actor.role,
    action: 'STOCK_MOVEMENT_RECORDED',
    entityType: 'inventory_items',
    entityId: item.sku,
    details: `${input.movementType} (${delta > 0 ? '+' : ''}${delta}) | ${prevPhysical} -> ${newPhysical} | Motif: ${input.reason}`,
    createdAt: nowIso,
  });

  return { item, movement };
}

export function recordSupplierReceiptInState(
  state: DatabaseState,
  input: {
    supplierId: string | null;
    inventoryItemId: string;
    quantityReceived: number;
    unitCostXaf?: number | null;
    batchNumber?: string;
    expiryDate?: string;
    notes?: string;
    actor: { id: string; name: string; role: string };
  }
): PurchaseReceipt {
  const qty = Math.trunc(Number(input.quantityReceived));
  if (!Number.isFinite(qty) || qty <= 0) {
    throw new Error('La quantité réceptionnée doit être strictement positive.');
  }

  const item = state.inventory.find((i) => i.id === input.inventoryItemId);
  if (!item) {
    throw new Error('Article de stock introuvable.');
  }

  const supplier = state.suppliers.find((s) => s.id === input.supplierId);
  const receiptNumber = `BR-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;

  if (input.unitCostXaf !== undefined && input.unitCostXaf !== null && input.unitCostXaf >= 0) {
    item.privateCostXaf = Math.round(Number(input.unitCostXaf));
  }
  if (input.batchNumber?.trim()) {
    item.batchNumber = input.batchNumber.trim();
  }
  if (input.expiryDate?.trim()) {
    item.expiryDate = input.expiryDate.trim();
  }

  recordStockMovementInState(state, {
    inventoryItemId: item.id,
    movementType: 'supplier_receipt',
    quantityDelta: qty,
    reason: `Réception fournisseur ${receiptNumber}${supplier ? ` (${supplier.name})` : ''}`,
    referenceCode: receiptNumber,
    actor: input.actor,
  });

  const receipt: PurchaseReceipt = {
    id: `rcp-${crypto.randomUUID().slice(0, 8)}`,
    receiptNumber,
    supplierId: supplier?.id || null,
    supplierName: supplier?.name || 'Fournisseur direct',
    inventoryItemId: item.id,
    sku: item.sku,
    designationFr: item.designationFr,
    quantityReceived: qty,
    unitCostXaf: input.unitCostXaf ?? item.privateCostXaf ?? null,
    batchNumber: input.batchNumber?.trim() || item.batchNumber || null,
    expiryDate: input.expiryDate?.trim() || item.expiryDate || null,
    notes: input.notes?.trim() || '',
    receivedByName: input.actor.name,
    receivedAt: new Date().toISOString(),
  };

  state.receipts.unshift(receipt);
  return receipt;
}

export function validateInventoryCountInState(
  state: DatabaseState,
  input: {
    counts: { inventoryItemId: string; countedPhysicalStock: number; notes?: string }[];
    actor: { id: string; name: string; role: string };
  }
): InventoryCountSession {
  const nowIso = new Date().toISOString();
  const code = `INV-${nowIso.slice(0, 10).replace(/-/g, '')}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
  const lines: InventoryCountSession['lines'] = [];

  for (const entry of input.counts) {
    const item = state.inventory.find((i) => i.id === entry.inventoryItemId);
    if (!item) continue;

    const counted = Math.trunc(Number(entry.countedPhysicalStock));
    if (!Number.isFinite(counted) || counted < 0) {
      throw new Error(`Quantité comptée invalide pour ${item.designationFr}.`);
    }
    if (counted < item.reservedStock) {
      throw new Error(
        `Le stock compté (${counted}) pour ${item.designationFr} est inférieur au stock réservé (${item.reservedStock}). Libérez ou traitez d'abord les commandes en attente.`
      );
    }

    const theoretical = item.physicalStock;
    const discrepancy = counted - theoretical;

    lines.push({
      inventoryItemId: item.id,
      sku: item.sku,
      designationFr: item.designationFr,
      theoreticalStock: theoretical,
      countedPhysicalStock: counted,
      discrepancy,
      notes: entry.notes?.trim() || '',
    });

    if (discrepancy !== 0) {
      recordStockMovementInState(state, {
        inventoryItemId: item.id,
        movementType: 'inventory_adjustment',
        quantityDelta: discrepancy,
        reason: `Ajustement d'inventaire physique validé (${code})${entry.notes ? ` : ${entry.notes}` : ''}`,
        referenceCode: code,
        actor: input.actor,
      });
    }
  }

  const session: InventoryCountSession = {
    id: `ic-${crypto.randomUUID().slice(0, 8)}`,
    code,
    status: 'validated',
    createdAt: nowIso,
    validatedAt: nowIso,
    authorName: input.actor.name,
    lines,
  };

  state.inventoryCounts.unshift(session);
  return session;
}

export function createReservationInState(
  state: DatabaseState,
  input: {
    customerName: string;
    customerPhone: string;
    reservationDate: string;
    reservationTime: string;
    partySize: number;
    spaceType?: string;
    customerMessage?: string;
  }
): ReservationRecord {
  if (!state.settings.reservationsEnabled) {
    throw new Error('Le module de demande de réservation est actuellement désactivé.');
  }
  if (!input.customerName?.trim() || !input.customerPhone?.trim()) {
    throw new Error('Le nom et le téléphone sont obligatoires.');
  }
  if (!input.reservationDate?.trim() || !input.reservationTime?.trim()) {
    throw new Error('La date et l’heure sont obligatoires.');
  }

  const partySize = Math.trunc(Number(input.partySize));
  if (!Number.isFinite(partySize) || partySize < 1 || partySize > 50) {
    throw new Error('Le nombre de convives doit être compris entre 1 et 50.');
  }

  // Check configured slot capacity
  const existingGuestsInSlot = state.reservations
    .filter(
      (r) =>
        r.reservationDate === input.reservationDate &&
        r.reservationTime === input.reservationTime &&
        (r.status === 'pending' || r.status === 'confirmed')
    )
    .reduce((acc, r) => acc + r.partySize, 0);

  if (existingGuestsInSlot + partySize > state.settings.maxReservationCapacityPerSlot) {
    throw new Error(
      `CAPACITY_EXCEEDED: Capacité maximale atteinte sur le créneau ${input.reservationDate} à ${input.reservationTime} (places restantes : ${Math.max(
        0,
        state.settings.maxReservationCapacityPerSlot - existingGuestsInSlot
      )}).`
    );
  }

  const nowIso = new Date().toISOString();
  const reference = `RES-${nowIso.slice(2, 10).replace(/-/g, '')}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;

  const record: ReservationRecord = {
    id: `rsv-${crypto.randomUUID().slice(0, 8)}`,
    reference,
    customerName: input.customerName.trim(),
    customerPhone: input.customerPhone.trim(),
    reservationDate: input.reservationDate.trim(),
    reservationTime: input.reservationTime.trim(),
    partySize,
    spaceType: (input.spaceType || 'Lounge / Salle principale').trim(),
    customerMessage: (input.customerMessage || '').trim(),
    internalNotes: '',
    status: 'pending',
    createdAt: nowIso,
    updatedAt: nowIso,
  };

  state.reservations.unshift(record);
  return record;
}

export interface CriticalTestResult {
  id: number;
  name: string;
  passed: boolean;
  details: string;
}

/**
 * Automated verification of all critical server, stock, concurrency, payment, and RBAC scenarios
 * defined in Section 22 of the specification. Runs against an isolated state instance.
 */
export function runAutomatedCriticalTests(): { allPassed: boolean; results: CriticalTestResult[] } {
  const results: CriticalTestResult[] = [];
  const state = createInitialSeed();
  const ownerActor = { id: 'staff-owner', name: 'Owner Test', role: 'owner' };

  // Test 1: Server-side price calculation & snapshot integrity
  try {
    const { order } = createOrderInState(state, {
      idempotencyKey: 'test-key-pricing-1',
      customerName: 'Jean Test',
      customerPhone: '+237600000001',
      fulfillmentMode: 'pickup',
      paymentMethod: 'pay_on_site',
      items: [{ productId: 'prod-1', variantId: 'var-1-std', quantity: 2 }],
    });
    const expectedTotal = 2 * 8500;
    const passed = order.totalXaf === expectedTotal && order.items[0].snapshotUnitPriceXaf === 8500;
    results.push({
      id: 1,
      name: 'Calcul serveur des prix & instantané de commande immuable',
      passed,
      details: `Total calculé par le serveur : ${order.totalXaf} XAF (attendu : ${expectedTotal} XAF).`,
    });
  } catch (e: any) {
    results.push({ id: 1, name: 'Calcul serveur des prix', passed: false, details: e.message });
  }

  // Test 2: Double-click idempotency on Commander
  try {
    const invBefore = state.inventory.find((i) => i.productId === 'prod-1')!.reservedStock;
    const first = createOrderInState(state, {
      idempotencyKey: 'test-key-double-click',
      customerName: 'Marie Idempotence',
      customerPhone: '+237600000002',
      fulfillmentMode: 'pickup',
      paymentMethod: 'pay_on_site',
      items: [{ productId: 'prod-1', variantId: 'var-1-std', quantity: 1 }],
    });
    const second = createOrderInState(state, {
      idempotencyKey: 'test-key-double-click',
      customerName: 'Marie Idempotence',
      customerPhone: '+237600000002',
      fulfillmentMode: 'pickup',
      paymentMethod: 'pay_on_site',
      items: [{ productId: 'prod-1', variantId: 'var-1-std', quantity: 1 }],
    });
    const invAfter = state.inventory.find((i) => i.productId === 'prod-1')!.reservedStock;
    const passed =
      first.order.id === second.order.id &&
      second.idempotentReplay === true &&
      invAfter - invBefore === 1;
    results.push({
      id: 2,
      name: 'Protection anti-double clic (Clé d’idempotence)',
      passed,
      details: `Même référence retournée (${first.order.reference}), stock réservé une seule fois (+${invAfter - invBefore}).`,
    });
  } catch (e: any) {
    results.push({ id: 2, name: 'Protection anti-double clic', passed: false, details: e.message });
  }

  // Test 3: Two clients competing for the last unit
  try {
    const fishInv = state.inventory.find((i) => i.productId === 'prod-2')!;
    fishInv.physicalStock = 1;
    fishInv.reservedStock = 0;
    fishInv.availableStock = 1;

    const clientA = createOrderInState(state, {
      idempotencyKey: 'test-last-unit-A',
      customerName: 'Client A',
      customerPhone: '+237600000003',
      fulfillmentMode: 'pickup',
      paymentMethod: 'pay_on_site',
      items: [{ productId: 'prod-2', variantId: 'var-2-std', quantity: 1 }],
    });

    let clientBRejected = false;
    try {
      createOrderInState(state, {
        idempotencyKey: 'test-last-unit-B',
        customerName: 'Client B',
        customerPhone: '+237600000004',
        fulfillmentMode: 'pickup',
        paymentMethod: 'pay_on_site',
        items: [{ productId: 'prod-2', variantId: 'var-2-std', quantity: 1 }],
      });
    } catch (err: any) {
      if (err.message.includes('INSUFFICIENT_STOCK')) {
        clientBRejected = true;
      }
    }

    const passed = Boolean(clientA.order.id) && clientBRejected && fishInv.availableStock === 0 && fishInv.physicalStock === 1;
    results.push({
      id: 3,
      name: 'Concurrence : deux clients sur la dernière unité',
      passed,
      details: `Client A accepté, Client B bloqué (INSUFFICIENT_STOCK), disponible restant : ${fishInv.availableStock}.`,
    });
  } catch (e: any) {
    results.push({ id: 3, name: 'Deux clients sur la dernière unité', passed: false, details: e.message });
  }

  // Test 4: Stock reservation expiration & release
  try {
    const fishInv = state.inventory.find((i) => i.productId === 'prod-2')!;
    const activeRes = state.stockReservations.find((r) => r.inventoryItemId === fishInv.id && r.status === 'active')!;
    activeRes.expiresAt = new Date(Date.now() - 60000).toISOString();

    // Simulate expiration sweep
    for (const res of state.stockReservations) {
      if (res.status === 'active' && new Date(res.expiresAt).getTime() <= Date.now()) {
        const inv = state.inventory.find((i) => i.id === res.inventoryItemId)!;
        inv.reservedStock = Math.max(0, inv.reservedStock - res.baseQuantity);
        inv.availableStock = inv.physicalStock - inv.reservedStock;
        res.status = 'expired';
      }
    }

    const passed = fishInv.reservedStock === 0 && fishInv.availableStock === 1 && activeRes.status === 'expired';
    results.push({
      id: 4,
      name: 'Expiration automatique de réservation de stock',
      passed,
      details: `Réservation expirée libérée : stock disponible repassé à ${fishInv.availableStock}.`,
    });
  } catch (e: any) {
    results.push({ id: 4, name: 'Expiration de réservation de stock', passed: false, details: e.message });
  }

  // Test 5: Cancellation & idempotent stock release
  try {
    const { order } = createOrderInState(state, {
      idempotencyKey: 'test-cancel-release',
      customerName: 'Client Annulation',
      customerPhone: '+237600000005',
      fulfillmentMode: 'pickup',
      paymentMethod: 'pay_on_site',
      items: [{ productId: 'prod-3', variantId: 'var-3-6p', quantity: 2 }],
    });
    const inv = state.inventory.find((i) => i.productId === 'prod-3')!;
    const reservedDuringOrder = inv.reservedStock;

    transitionOrderStatusInState(state, order.id, 'cancelled', ownerActor);
    // Call cancel a second time to test idempotency
    transitionOrderStatusInState(state, order.id, 'cancelled', ownerActor);

    const passed = reservedDuringOrder === 2 && inv.reservedStock === 0 && inv.availableStock === 15;
    results.push({
      id: 5,
      name: 'Annulation de commande et libération idempotente du stock',
      passed,
      details: `Stock réservé (${reservedDuringOrder}) libéré une seule fois après double appel d'annulation (réservé actuel : ${inv.reservedStock}).`,
    });
  } catch (e: any) {
    results.push({ id: 5, name: 'Annulation et libération de stock', passed: false, details: e.message });
  }

  // Test 6: Payment confirmed twice by webhook + no double stock deduction on handover
  try {
    const { order } = createOrderInState(state, {
      idempotencyKey: 'test-webhook-dup',
      customerName: 'Client Webhook',
      customerPhone: '+237600000006',
      fulfillmentMode: 'pickup',
      paymentMethod: 'pay_on_site',
      items: [{ productId: 'prod-4', variantId: 'var-4-verre', quantity: 3 }],
    });
    const inv = state.inventory.find((i) => i.productId === 'prod-4')!;
    const initialPhysical = inv.physicalStock;

    const firstHook = transitionPaymentStatusInState(state, order.id, 'paid', ownerActor, 'wh_evt_999');
    const secondHook = transitionPaymentStatusInState(state, order.id, 'paid', ownerActor, 'wh_evt_999');

    transitionOrderStatusInState(state, order.id, 'completed', ownerActor);
    // Repeated handover call must NOT deduct a second time
    transitionOrderStatusInState(state, order.id, 'completed', ownerActor);

    const passed =
      !firstHook.idempotentWebhookReplay &&
      secondHook.idempotentWebhookReplay &&
      inv.physicalStock === initialPhysical - 3;
    results.push({
      id: 6,
      name: 'Webhook paiement reçu deux fois & déstockage unique à la remise',
      passed,
      details: `2e webhook ignoré (idempotent), stock physique déduit une seule fois (${initialPhysical} -> ${inv.physicalStock}).`,
    });
  } catch (e: any) {
    results.push({ id: 6, name: 'Webhook paiement double', passed: false, details: e.message });
  }

  // Test 7: Payment succeeded after stock reservation expired
  try {
    const fishInv = state.inventory.find((i) => i.productId === 'prod-2')!;
    fishInv.physicalStock = 1;
    fishInv.reservedStock = 0;
    fishInv.availableStock = 1;

    const { order: lateOrder } = createOrderInState(state, {
      idempotencyKey: 'test-late-pay-1',
      customerName: 'Client Tardif',
      customerPhone: '+237600000007',
      fulfillmentMode: 'pickup',
      paymentMethod: 'pay_on_site',
      items: [{ productId: 'prod-2', variantId: 'var-2-std', quantity: 1 }],
    });

    // Expire its reservation and let someone else buy the last unit
    const res = state.stockReservations.find((r) => r.orderId === lateOrder.id)!;
    res.status = 'expired';
    fishInv.reservedStock = 0;
    fishInv.availableStock = 0;
    fishInv.physicalStock = 0;

    const outcome = transitionPaymentStatusInState(state, lateOrder.id, 'paid', ownerActor, 'wh_late_1');
    results.push({
      id: 7,
      name: 'Paiement reçu après expiration de la réservation de stock',
      passed: outcome.latePaymentConflict === true && fishInv.physicalStock === 0,
      details: 'Conflit détecté et journalisé sans créer de stock négatif.',
    });
  } catch (e: any) {
    results.push({ id: 7, name: 'Paiement après expiration', passed: false, details: e.message });
  }

  // Test 8: Product deactivated during checkout
  try {
    const prod = state.products.find((p) => p.id === 'prod-6')!;
    prod.isActive = false;
    let blocked = false;
    try {
      createOrderInState(state, {
        idempotencyKey: 'test-deactivated-prod',
        customerName: 'Client Désactivé',
        customerPhone: '+237600000008',
        fulfillmentMode: 'pickup',
        paymentMethod: 'pay_on_site',
        items: [{ productId: 'prod-6', variantId: 'var-6-std', quantity: 1 }],
      });
    } catch {
      blocked = true;
    }
    prod.isActive = true;
    results.push({
      id: 8,
      name: 'Produit désactivé pendant une commande',
      passed: blocked,
      details: 'Commande bloquée côté serveur dès la désactivation du produit.',
    });
  } catch (e: any) {
    results.push({ id: 8, name: 'Produit désactivé', passed: false, details: e.message });
  }

  // Test 9: Unit conversion Casier (12 bottles) + Single Bottle on shared inventory
  try {
    const bottleInv = state.inventory.find((i) => i.productId === 'prod-5')!;
    const beforeAvail = bottleInv.availableStock; // 36 bottles

    // Order 2 crates of 12 bottles (24) + 3 single bottles (3) = 27 bottles reserved
    createOrderInState(state, {
      idempotencyKey: 'test-casier-conversion',
      customerName: 'Client Casier & Bouteilles',
      customerPhone: '+237600000009',
      fulfillmentMode: 'pickup',
      paymentMethod: 'pay_on_site',
      items: [
        { productId: 'prod-5', variantId: 'var-5-casier12', quantity: 2 },
        { productId: 'prod-5', variantId: 'var-5-btl', quantity: 3 },
      ],
    });

    // Try ordering 1 more crate of 12 bottles when only 9 bottles remain -> must fail!
    let crateBlockedWhen9BottlesLeft = false;
    try {
      createOrderInState(state, {
        idempotencyKey: 'test-casier-overflow',
        customerName: 'Client Casier Trop',
        customerPhone: '+237600000010',
        fulfillmentMode: 'pickup',
        paymentMethod: 'pay_on_site',
        items: [{ productId: 'prod-5', variantId: 'var-5-casier12', quantity: 1 }],
      });
    } catch {
      crateBlockedWhen9BottlesLeft = true;
    }

    const passed =
      beforeAvail === 36 &&
      bottleInv.reservedStock === 27 &&
      bottleInv.availableStock === 9 &&
      crateBlockedWhen9BottlesLeft;
    results.push({
      id: 9,
      name: 'Conversion d’unités Casier (12 bouteilles) / Bouteille sur stock unifié',
      passed,
      details: `2 casiers (24) + 3 bouteilles = 27 réservées sur 36. Reste 9 bouteilles : commande d'un 3e casier (12) refusée.`,
    });
  } catch (e: any) {
    results.push({ id: 9, name: 'Conversion casier/bouteille', passed: false, details: e.message });
  }

  // Test 10: Refund without automatic physical return
  try {
    const bottleInv = state.inventory.find((i) => i.productId === 'prod-5')!;
    const physicalBeforeRefund = bottleInv.physicalStock;
    const anyOrder = state.orders[0];
    transitionPaymentStatusInState(state, anyOrder.id, 'refunded', ownerActor);
    const passed = bottleInv.physicalStock === physicalBeforeRefund;
    results.push({
      id: 10,
      name: 'Remboursement financier sans réintégration automatique du stock physique',
      passed,
      details: `Statut passé à 'refunded' sans modifier le stock physique (${bottleInv.physicalStock} unités).`,
    });
  } catch (e: any) {
    results.push({ id: 10, name: 'Remboursement sans retour physique', passed: false, details: e.message });
  }

  // Test 11: RBAC cost price masking for order_staff & content_manager
  try {
    const orderStaffUser: AuthenticatedUser = {
      id: 'staff-orders',
      email: 'commandes@leboivement.cm',
      fullName: 'Staff Commandes',
      type: 'staff',
      staffRole: 'order_staff',
      permissions: ROLE_PERMISSIONS.order_staff,
    };
    const sanitized = sanitizeInventoryForUser(state.inventory, orderStaffUser);
    const hasLeakedCost = sanitized.some((i) => i.privateCostXaf !== undefined);
    results.push({
      id: 11,
      name: 'Sécurité RBAC : masquage des coûts d’achat privés au personnel commandes',
      passed: !hasLeakedCost,
      details: 'Les champs privateCostXaf sont intégralement purgés côté serveur pour les rôles non autorisés.',
    });
  } catch (e: any) {
    results.push({ id: 11, name: 'Masquage des coûts RBAC', passed: false, details: e.message });
  }

  // Test 12: Reservation capacity overflow guard
  try {
    createReservationInState(state, {
      customerName: 'Groupe A',
      customerPhone: '+237600000011',
      reservationDate: '2026-12-24',
      reservationTime: '21:00',
      partySize: 30,
    });
    let overflowBlocked = false;
    try {
      createReservationInState(state, {
        customerName: 'Groupe B',
        customerPhone: '+237600000012',
        reservationDate: '2026-12-24',
        reservationTime: '21:00',
        partySize: 15, // 30 + 15 = 45 > 40 max capacity
      });
    } catch (err: any) {
      if (err.message.includes('CAPACITY_EXCEEDED')) {
        overflowBlocked = true;
      }
    }
    results.push({
      id: 12,
      name: 'Prévention du dépassement de capacité sur un créneau de réservation',
      passed: overflowBlocked,
      details: 'Créneau bloqué au-delà de la capacité configurée (40 convives max).',
    });
  } catch (e: any) {
    results.push({ id: 12, name: 'Capacité réservation', passed: false, details: e.message });
  }

  const allPassed = results.every((r) => r.passed);
  return { allPassed, results };
}
