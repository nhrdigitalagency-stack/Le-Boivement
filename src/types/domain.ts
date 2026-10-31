export type Language = 'fr' | 'en';

export type ValidationStatus = 'to_confirm' | 'validated';

export type StaffRole =
  | 'owner'
  | 'manager'
  | 'stock_manager'
  | 'order_staff'
  | 'content_manager';

export type OrderStatus =
  | 'pending'
  | 'accepted'
  | 'preparing'
  | 'ready'
  | 'out_for_delivery'
  | 'delivered'
  | 'completed'
  | 'cancelled';

export type PaymentStatus =
  | 'unpaid'
  | 'pending_payment'
  | 'paid'
  | 'failed'
  | 'partially_refunded'
  | 'refunded';

export type FulfillmentMode = 'pickup' | 'delivery' | 'table';

export type OrderChannel = 'online' | 'counter' | 'dine_in' | 'phone';

export type PaymentMethod = 'pay_on_site' | 'cash_on_delivery' | 'online_provider';

export type ReservationStatus =
  | 'pending'
  | 'confirmed'
  | 'declined'
  | 'cancelled'
  | 'completed';

export type MovementType =
  | 'supplier_receipt'
  | 'sale'
  | 'return'
  | 'breakage'
  | 'loss'
  | 'internal_consumption'
  | 'inventory_adjustment'
  | 'location_transfer';

export type PreparedStrategy =
  | 'direct_unit'
  | 'portions_available'
  | 'recipe_ingredients';

export interface BusinessSettings {
  brandName: string;
  brandNameValidated: boolean;
  city: string;
  neighborhood: string;
  neighborhoodValidated: boolean;
  exactAddress: string;
  addressValidated: boolean;
  gpsCoordinates: string;
  phone: string;
  whatsapp: string;
  email: string;
  instagramUrl: string;
  facebookUrl: string;
  editorialTaglineFr: string;
  editorialTaglineEn: string;
  onlineOrderingEnabled: boolean;
  pickupEnabled: boolean;
  deliveryEnabled: boolean;
  deliveryZonesFr: string;
  deliveryZonesEn: string;
  deliveryFeeXaf: number;
  minimumOrderXaf: number;
  tableOrderingEnabled: boolean;
  reservationsEnabled: boolean;
  onlinePaymentEnabled: boolean;
  onlinePaymentProviderName: string;
  cashOnDeliveryEnabled: boolean;
  payOnSiteEnabled: boolean;
  ticketingEnabled: boolean;
  alcoholSaleEnabled: boolean;
  alcoholLegalRulesValidated: boolean;
  maxReservationCapacityPerSlot: number;
  stockReservationTtlMinutes: number;
  demoMode: boolean;
  spacesValidation: {
    lounge: ValidationStatus;
    snackBar: ValidationStatus;
    glacier: ValidationStatus;
    nightclub: ValidationStatus;
    pool: ValidationStatus;
  };
  palette: {
    deepBlack: string;
    anthracite: string;
    ivory: string;
    champagne: string;
    copper: string;
  };
}

export interface BusinessHour {
  dayOfWeek: number;
  labelFr: string;
  labelEn: string;
  openTime: string;
  closeTime: string;
  isClosed: boolean;
  isValidated: boolean;
}

export interface Category {
  id: string;
  slug: string;
  nameFr: string;
  nameEn: string;
  descriptionFr: string;
  descriptionEn: string;
  sortOrder: number;
  isActive: boolean;
  isAlcoholicCategory: boolean;
  validationStatus: ValidationStatus;
}

export interface ProductVariant {
  id: string;
  productId: string;
  sku: string;
  nameFr: string;
  nameEn: string;
  priceXaf: number;
  /** Number of base inventory units consumed by 1 of this variant (e.g. 1 bottle = 1, 1 crate of 12 bottles = 12) */
  unitMultiplier: number;
  isActive: boolean;
}

export interface Product {
  id: string;
  categoryId: string;
  slug: string;
  publicRef: string;
  nameFr: string;
  nameEn: string;
  descriptionFr: string;
  descriptionEn: string;
  basePriceXaf: number;
  isActive: boolean;
  isDemo: boolean;
  validationStatus: ValidationStatus;
  requiresAgeCheck: boolean;
  allergensFr: string[];
  allergensEn: string[];
  dietaryTags: string[];
  dietaryTagsValidated: boolean;
  allowedOptionsFr: string[];
  allowedOptionsEn: string[];
  preparedStrategy: PreparedStrategy;
  visualTheme: 'grill' | 'cocktail' | 'lounge_platter' | 'glacier' | 'elixir' | 'bottle_case' | 'dessert';
  createdAt: string;
  variants: ProductVariant[];
  /** Computed live from server inventory */
  availableBaseUnits?: number;
}

export interface StockLocation {
  id: string;
  code: string;
  nameFr: string;
  nameEn: string;
  isDefault: boolean;
}

export interface Supplier {
  id: string;
  name: string;
  contactName: string;
  phone: string;
  email: string;
  notes: string;
  isActive: boolean;
}

export interface InventoryItem {
  id: string;
  productId: string;
  sku: string;
  designationFr: string;
  designationEn: string;
  managementUnitFr: string;
  managementUnitEn: string;
  physicalStock: number;
  reservedStock: number;
  availableStock: number;
  alertThreshold: number;
  /** Private cost in XAF — stripped by server for unauthorized staff roles */
  privateCostXaf?: number | null;
  sellingPriceXaf: number;
  supplierId: string | null;
  locationId: string;
  batchNumber: string | null;
  expiryDate: string | null;
  preparedStrategy: PreparedStrategy;
  updatedAt: string;
}

export interface StockMovement {
  id: string;
  inventoryItemId: string;
  sku: string;
  productNameFr: string;
  productNameEn: string;
  movementType: MovementType;
  quantityDelta: number;
  previousPhysicalStock: number;
  newPhysicalStock: number;
  reason: string;
  referenceCode: string | null;
  authorId: string;
  authorName: string;
  locationCode?: string;
  createdAt: string;
}

export interface StockReservationRecord {
  id: string;
  orderId: string;
  orderReference: string;
  inventoryItemId: string;
  sku: string;
  baseQuantity: number;
  status: 'active' | 'released' | 'consumed' | 'expired';
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface PurchaseReceipt {
  id: string;
  receiptNumber: string;
  supplierId: string | null;
  supplierName: string;
  inventoryItemId: string;
  sku: string;
  designationFr: string;
  quantityReceived: number;
  unitCostXaf?: number | null;
  batchNumber: string | null;
  expiryDate: string | null;
  notes: string;
  receivedByName: string;
  receivedAt: string;
}

export interface InventoryCountSession {
  id: string;
  code: string;
  status: 'draft' | 'validated';
  createdAt: string;
  validatedAt: string | null;
  authorName: string;
  lines: {
    inventoryItemId: string;
    sku: string;
    designationFr: string;
    theoreticalStock: number;
    countedPhysicalStock: number;
    discrepancy: number;
    notes: string;
  }[];
}

export interface OrderItemSnapshot {
  id: string;
  productId: string;
  variantId: string;
  snapshotProductNameFr: string;
  snapshotProductNameEn: string;
  snapshotVariantNameFr: string;
  snapshotVariantNameEn: string;
  snapshotSku: string;
  snapshotUnitPriceXaf: number;
  quantity: number;
  baseUnitsReserved: number;
  lineTotalXaf: number;
  selectedOptions: string[];
}

export interface Order {
  id: string;
  reference: string;
  trackingToken: string;
  idempotencyKey: string;
  channel: OrderChannel;
  customerUserId: string | null;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  fulfillmentMode: FulfillmentMode;
  deliveryAddress: string;
  deliveryLandmark: string;
  tableNumber: string;
  requestedSlot: string;
  instructions: string;
  orderStatus: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  subtotalXaf: number;
  feesXaf: number;
  discountXaf: number;
  totalXaf: number;
  stockDeducted: boolean;
  items: OrderItemSnapshot[];
  createdByStaffName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentRecord {
  id: string;
  orderId: string;
  orderReference: string;
  provider: string;
  providerReference: string;
  amountXaf: number;
  status: 'pending' | 'succeeded' | 'failed' | 'expired' | 'refunded';
  createdAt: string;
  updatedAt: string;
}

export interface ReservationRecord {
  id: string;
  reference: string;
  customerName: string;
  customerPhone: string;
  reservationDate: string;
  reservationTime: string;
  partySize: number;
  spaceType: string;
  customerMessage: string;
  internalNotes: string;
  status: ReservationStatus;
  createdAt: string;
  updatedAt: string;
}

export interface EventRecord {
  id: string;
  slug: string;
  titleFr: string;
  titleEn: string;
  eventDate: string;
  timeLabel: string;
  descriptionFr: string;
  descriptionEn: string;
  confirmedArtists: string[];
  accessConditionsFr: string;
  accessConditionsEn: string;
  validatedPriceXaf: number | null;
  isPublished: boolean;
  validationStatus: ValidationStatus;
  visualTheme: 'gold_acoustic' | 'afro_lounge' | 'culinary_night';
}

export interface MediaItem {
  id: string;
  titleFr: string;
  titleEn: string;
  captionFr: string;
  captionEn: string;
  category: 'lounge' | 'gastronomie' | 'ambiance' | 'identite';
  visualTheme: string;
  imageUrl?: string;
  isApproved: boolean;
  isDemoGraphic: boolean;
  createdAt: string;
}

export interface StaffMember {
  id: string;
  email: string;
  fullName: string;
  role: StaffRole;
  isActive: boolean;
  createdAt: string;
}

export interface AuditLogEntry {
  id: string;
  actorId: string;
  actorName: string;
  actorRole: string;
  action: string;
  entityType: string;
  entityId: string;
  details: string;
  createdAt: string;
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  fullName: string;
  phone?: string;
  type: 'customer' | 'staff';
  staffRole?: StaffRole;
  permissions: string[];
}

export interface CartItem {
  productId: string;
  variantId: string;
  quantity: number;
  selectedOptions: string[];
  addedPriceXaf: number;
}

export type ReviewStatus = 'pending' | 'approved' | 'rejected';

export interface ReviewRecord {
  id: string;
  targetType: 'experience' | 'product';
  productId?: string;
  productSlug?: string;
  productNameFr?: string;
  productNameEn?: string;
  authorName: string;
  rating: number;
  commentFr: string;
  commentEn: string;
  visitContextFr?: string;
  visitContextEn?: string;
  status: ReviewStatus;
  isDemo: boolean;
  moderatedBy?: string;
  moderatedAt?: string;
  createdAt: string;
}

