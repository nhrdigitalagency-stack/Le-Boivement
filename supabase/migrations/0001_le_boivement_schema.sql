-- ============================================================================
-- LE BOIVEMENT — MIGRATION SQL POSTGRESQL / SUPABASE COMPLÈTE
-- Inclut : 20 tables, contraintes d'intégrité, index, politiques RLS et
-- fonctions transactionnelles atomiques pour le stock et les commandes.
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. RÔLES DU PERSONNEL (RBAC)
CREATE TABLE IF NOT EXISTS public.staff_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('owner', 'manager', 'stock_manager', 'order_staff', 'content_manager')),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. PARAMÈTRES DE L'ÉTABLISSEMENT
CREATE TABLE IF NOT EXISTS public.business_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_name TEXT NOT NULL DEFAULT 'Le Boivement',
  brand_name_validated BOOLEAN NOT NULL DEFAULT FALSE,
  city TEXT NOT NULL DEFAULT 'Yaoundé, Cameroun',
  neighborhood TEXT DEFAULT 'Chapelle Obili',
  neighborhood_validated BOOLEAN NOT NULL DEFAULT FALSE,
  exact_address TEXT,
  address_validated BOOLEAN NOT NULL DEFAULT FALSE,
  gps_coordinates TEXT,
  phone TEXT,
  whatsapp TEXT,
  email TEXT,
  editorial_tagline_fr TEXT NOT NULL DEFAULT 'Restauration, Lounge & Expériences à Yaoundé',
  editorial_tagline_en TEXT NOT NULL DEFAULT 'Dining, Lounge & Lifestyle Experiences in Yaoundé',
  online_ordering_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  pickup_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  delivery_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  table_ordering_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  reservations_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  online_payment_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  cash_on_delivery_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  pay_on_site_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  ticketing_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  alcohol_sale_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  alcohol_legal_rules_validated BOOLEAN NOT NULL DEFAULT FALSE,
  max_reservation_capacity_per_slot INTEGER NOT NULL DEFAULT 40 CHECK (max_reservation_capacity_per_slot > 0),
  stock_reservation_ttl_minutes INTEGER NOT NULL DEFAULT 30 CHECK (stock_reservation_ttl_minutes >= 5),
  demo_mode BOOLEAN NOT NULL DEFAULT TRUE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. HORAIRES D'OUVERTURE
CREATE TABLE IF NOT EXISTS public.business_hours (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  day_of_week SMALLINT NOT NULL UNIQUE CHECK (day_of_week BETWEEN 0 AND 6),
  label_fr TEXT NOT NULL,
  label_en TEXT NOT NULL,
  open_time TEXT,
  close_time TEXT,
  is_closed BOOLEAN NOT NULL DEFAULT FALSE,
  is_validated BOOLEAN NOT NULL DEFAULT FALSE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. CATÉGORIES DE PRODUITS
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name_fr TEXT NOT NULL,
  name_en TEXT NOT NULL,
  description_fr TEXT,
  description_en TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  is_alcoholic_category BOOLEAN NOT NULL DEFAULT FALSE,
  validation_status TEXT NOT NULL DEFAULT 'to_confirm' CHECK (validation_status IN ('to_confirm', 'validated')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. PRODUITS
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE RESTRICT,
  slug TEXT NOT NULL UNIQUE,
  public_ref TEXT NOT NULL UNIQUE,
  name_fr TEXT NOT NULL,
  name_en TEXT NOT NULL,
  description_fr TEXT NOT NULL,
  description_en TEXT NOT NULL,
  base_price_xaf INTEGER NOT NULL CHECK (base_price_xaf >= 0),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  is_demo BOOLEAN NOT NULL DEFAULT TRUE,
  validation_status TEXT NOT NULL DEFAULT 'to_confirm' CHECK (validation_status IN ('to_confirm', 'validated')),
  requires_age_check BOOLEAN NOT NULL DEFAULT FALSE,
  allergens_fr TEXT[] NOT NULL DEFAULT '{}',
  allergens_en TEXT[] NOT NULL DEFAULT '{}',
  dietary_tags TEXT[] NOT NULL DEFAULT '{}',
  dietary_tags_validated BOOLEAN NOT NULL DEFAULT FALSE,
  prepared_strategy TEXT NOT NULL DEFAULT 'direct_unit' CHECK (prepared_strategy IN ('direct_unit', 'portions_available', 'recipe_ingredients')),
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_active ON public.products(is_active);

-- 6. VARIANTES DE PRODUITS (ex: Bouteille 75cl vs Casier 12 bouteilles)
CREATE TABLE IF NOT EXISTS public.product_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  sku TEXT NOT NULL UNIQUE,
  name_fr TEXT NOT NULL,
  name_en TEXT NOT NULL,
  price_xaf INTEGER NOT NULL CHECK (price_xaf >= 0),
  unit_multiplier INTEGER NOT NULL DEFAULT 1 CHECK (unit_multiplier >= 1),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_variants_product ON public.product_variants(product_id);

-- 7. EMPLACEMENTS DE STOCKAGE
CREATE TABLE IF NOT EXISTS public.stock_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name_fr TEXT NOT NULL,
  name_en TEXT NOT NULL,
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. FOURNISSEURS
CREATE TABLE IF NOT EXISTS public.suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  contact_name TEXT,
  phone TEXT,
  email TEXT,
  notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. ARTICLES DE STOCK (SOURCE DE VÉRITÉ ATOMIQUE)
CREATE TABLE IF NOT EXISTS public.inventory_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL UNIQUE REFERENCES public.products(id) ON DELETE RESTRICT,
  sku TEXT NOT NULL UNIQUE,
  designation_fr TEXT NOT NULL,
  designation_en TEXT NOT NULL,
  management_unit TEXT NOT NULL DEFAULT 'unité',
  physical_stock INTEGER NOT NULL DEFAULT 0 CHECK (physical_stock >= 0),
  reserved_stock INTEGER NOT NULL DEFAULT 0 CHECK (reserved_stock >= 0),
  available_stock INTEGER GENERATED ALWAYS AS (physical_stock - reserved_stock) STORED,
  alert_threshold INTEGER NOT NULL DEFAULT 5 CHECK (alert_threshold >= 0),
  private_cost_xaf INTEGER CHECK (private_cost_xaf IS NULL OR private_cost_xaf >= 0),
  selling_price_xaf INTEGER NOT NULL CHECK (selling_price_xaf >= 0),
  supplier_id UUID REFERENCES public.suppliers(id) ON DELETE SET NULL,
  location_id UUID REFERENCES public.stock_locations(id) ON DELETE SET NULL,
  batch_number TEXT,
  expiry_date DATE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_available_non_negative CHECK (physical_stock >= reserved_stock)
);

-- 10. COMMANDES
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reference TEXT NOT NULL UNIQUE,
  tracking_token_hash TEXT NOT NULL,
  idempotency_key TEXT NOT NULL UNIQUE,
  channel TEXT NOT NULL DEFAULT 'online' CHECK (channel IN ('online', 'counter', 'dine_in', 'phone')),
  customer_user_id UUID,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_email TEXT,
  fulfillment_mode TEXT NOT NULL CHECK (fulfillment_mode IN ('pickup', 'delivery', 'table')),
  delivery_address TEXT,
  delivery_landmark TEXT,
  table_number TEXT,
  requested_slot TEXT,
  instructions TEXT,
  order_status TEXT NOT NULL DEFAULT 'pending' CHECK (order_status IN ('pending', 'accepted', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'completed', 'cancelled')),
  payment_status TEXT NOT NULL DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'pending_payment', 'paid', 'failed', 'partially_refunded', 'refunded')),
  payment_method TEXT NOT NULL CHECK (payment_method IN ('pay_on_site', 'cash_on_delivery', 'online_provider')),
  subtotal_xaf INTEGER NOT NULL CHECK (subtotal_xaf >= 0),
  fees_xaf INTEGER NOT NULL DEFAULT 0 CHECK (fees_xaf >= 0),
  discount_xaf INTEGER NOT NULL DEFAULT 0 CHECK (discount_xaf >= 0),
  total_xaf INTEGER NOT NULL CHECK (total_xaf >= 0),
  stock_deducted BOOLEAN NOT NULL DEFAULT FALSE,
  created_by_staff_id UUID REFERENCES public.staff_roles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orders_reference ON public.orders(reference);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(order_status, payment_status);

-- 11. LIGNES DE COMMANDE (AVEC INSTANTANÉ IMMUABLE DU CATALOGUE)
CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  variant_id UUID NOT NULL REFERENCES public.product_variants(id) ON DELETE RESTRICT,
  snapshot_product_name_fr TEXT NOT NULL,
  snapshot_product_name_en TEXT NOT NULL,
  snapshot_variant_name_fr TEXT NOT NULL,
  snapshot_variant_name_en TEXT NOT NULL,
  snapshot_sku TEXT NOT NULL,
  snapshot_unit_price_xaf INTEGER NOT NULL CHECK (snapshot_unit_price_xaf >= 0),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  base_units_reserved INTEGER NOT NULL CHECK (base_units_reserved > 0),
  line_total_xaf INTEGER NOT NULL CHECK (line_total_xaf >= 0),
  selected_options TEXT[] NOT NULL DEFAULT '{}'
);

-- 12. RÉSERVATIONS DE STOCK ATOMIQUES
CREATE TABLE IF NOT EXISTS public.stock_reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  inventory_item_id UUID NOT NULL REFERENCES public.inventory_items(id) ON DELETE RESTRICT,
  base_quantity INTEGER NOT NULL CHECK (base_quantity > 0),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'released', 'consumed', 'expired')),
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (order_id, inventory_item_id)
);

-- 13. JOURNAL DES MOUVEMENTS DE STOCK (IMMUABLE)
CREATE TABLE IF NOT EXISTS public.stock_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inventory_item_id UUID NOT NULL REFERENCES public.inventory_items(id) ON DELETE RESTRICT,
  movement_type TEXT NOT NULL CHECK (movement_type IN ('supplier_receipt', 'sale', 'return', 'breakage', 'loss', 'internal_consumption', 'inventory_adjustment', 'location_transfer')),
  quantity_delta INTEGER NOT NULL CHECK (quantity_delta <> 0),
  previous_physical_stock INTEGER NOT NULL,
  new_physical_stock INTEGER NOT NULL,
  reason TEXT NOT NULL,
  reference_code TEXT,
  author_staff_id UUID REFERENCES public.staff_roles(id),
  author_name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 14. RÉCEPTIONS FOURNISSEURS
CREATE TABLE IF NOT EXISTS public.purchase_receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  receipt_number TEXT NOT NULL UNIQUE,
  supplier_id UUID REFERENCES public.suppliers(id) ON DELETE SET NULL,
  inventory_item_id UUID NOT NULL REFERENCES public.inventory_items(id) ON DELETE RESTRICT,
  quantity_received INTEGER NOT NULL CHECK (quantity_received > 0),
  unit_cost_xaf INTEGER CHECK (unit_cost_xaf IS NULL OR unit_cost_xaf >= 0),
  batch_number TEXT,
  expiry_date DATE,
  notes TEXT,
  received_by_staff_id UUID REFERENCES public.staff_roles(id),
  received_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 15. PAIEMENTS
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE RESTRICT,
  provider TEXT NOT NULL,
  provider_reference TEXT UNIQUE,
  amount_xaf INTEGER NOT NULL CHECK (amount_xaf >= 0),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'succeeded', 'failed', 'expired', 'refunded')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 16. ÉVÉNEMENTS DE PAIEMENT / WEBHOOKS IDEMPOTENTS
CREATE TABLE IF NOT EXISTS public.payment_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id UUID REFERENCES public.payments(id) ON DELETE CASCADE,
  webhook_event_id TEXT NOT NULL UNIQUE,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 17. DEMANDES DE RÉSERVATION DE TABLE / ESPACE
CREATE TABLE IF NOT EXISTS public.reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reference TEXT NOT NULL UNIQUE,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  reservation_date DATE NOT NULL,
  reservation_time TEXT NOT NULL,
  party_size INTEGER NOT NULL CHECK (party_size BETWEEN 1 AND 50),
  space_type TEXT,
  customer_message TEXT,
  internal_notes TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'declined', 'cancelled', 'completed')),
  handled_by_staff_id UUID REFERENCES public.staff_roles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 18. ÉVÉNEMENTS PROGRAMMÉS
CREATE TABLE IF NOT EXISTS public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  title_fr TEXT NOT NULL,
  title_en TEXT NOT NULL,
  event_date TIMESTAMPTZ NOT NULL,
  description_fr TEXT NOT NULL,
  description_en TEXT NOT NULL,
  confirmed_artists TEXT[] NOT NULL DEFAULT '{}',
  access_conditions_fr TEXT NOT NULL,
  access_conditions_en TEXT NOT NULL,
  validated_price_xaf INTEGER CHECK (validated_price_xaf IS NULL OR validated_price_xaf >= 0),
  is_published BOOLEAN NOT NULL DEFAULT FALSE,
  validation_status TEXT NOT NULL DEFAULT 'to_confirm' CHECK (validation_status IN ('to_confirm', 'validated')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 19. GALERIE MÉDIAS APPROUVÉS
CREATE TABLE IF NOT EXISTS public.media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title_fr TEXT NOT NULL,
  title_en TEXT NOT NULL,
  caption_fr TEXT,
  caption_en TEXT,
  category TEXT NOT NULL DEFAULT 'ambiance',
  url TEXT NOT NULL,
  is_approved BOOLEAN NOT NULL DEFAULT FALSE,
  is_demo_graphic BOOLEAN NOT NULL DEFAULT TRUE,
  uploaded_by_staff_id UUID REFERENCES public.staff_roles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 20. JOURNAUX D'AUDIT (SANS SECRETS)
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_staff_id UUID REFERENCES public.staff_roles(id),
  actor_name TEXT NOT NULL,
  actor_role TEXT NOT NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- POLITIQUES ROW LEVEL SECURITY (RLS)
-- ============================================================================
ALTER TABLE public.staff_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Lecture publique uniquement sur les données vitrines non sensibles
CREATE POLICY "Public read active categories" ON public.categories FOR SELECT USING (is_active = TRUE);
CREATE POLICY "Public read active products" ON public.products FOR SELECT USING (is_active = TRUE);
CREATE POLICY "Public read active variants" ON public.product_variants FOR SELECT USING (is_active = TRUE);
CREATE POLICY "Public read published events" ON public.events FOR SELECT USING (is_published = TRUE);
CREATE POLICY "Public read approved media" ON public.media FOR SELECT USING (is_approved = TRUE);
CREATE POLICY "Public read business settings" ON public.business_settings FOR SELECT USING (TRUE);

-- ============================================================================
-- FONCTIONS TRANSACTIONNELLES ATOMIQUES (STOCK & PAIEMENTS)
-- ============================================================================

-- 1. Réservation atomique de stock avec verrouillage pessimiste (FOR UPDATE)
CREATE OR REPLACE FUNCTION public.reserve_stock_atomic(
  p_order_id UUID,
  p_inventory_item_id UUID,
  p_base_quantity INTEGER,
  p_ttl_minutes INTEGER DEFAULT 30
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_item RECORD;
BEGIN
  IF p_base_quantity <= 0 THEN
    RAISE EXCEPTION 'Quantity must be strictly positive';
  END IF;

  -- Idempotence : si déjà réservé pour cette commande et cet article, retourner TRUE
  IF EXISTS (
    SELECT 1 FROM public.stock_reservations
    WHERE order_id = p_order_id AND inventory_item_id = p_inventory_item_id AND status = 'active'
  ) THEN
    RETURN TRUE;
  END IF;

  -- Verrouillage de la ligne d'inventaire pour bloquer deux clients simultanés sur la dernière unité
  SELECT * INTO v_item
  FROM public.inventory_items
  WHERE id = p_inventory_item_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Inventory item not found';
  END IF;

  IF (v_item.physical_stock - v_item.reserved_stock) < p_base_quantity THEN
    RAISE EXCEPTION 'INSUFFICIENT_STOCK: Available %, requested %', (v_item.physical_stock - v_item.reserved_stock), p_base_quantity;
  END IF;

  UPDATE public.inventory_items
  SET reserved_stock = reserved_stock + p_base_quantity,
      updated_at = NOW()
  WHERE id = p_inventory_item_id;

  INSERT INTO public.stock_reservations (order_id, inventory_item_id, base_quantity, status, expires_at)
  VALUES (p_order_id, p_inventory_item_id, p_base_quantity, 'active', NOW() + (p_ttl_minutes || ' minutes')::INTERVAL);

  RETURN TRUE;
END;
$$;

-- 2. Libération idempotente d'une réservation de stock (annulation ou expiration)
CREATE OR REPLACE FUNCTION public.release_stock_reservation_idempotent(
  p_order_id UUID,
  p_new_status TEXT DEFAULT 'released'
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_res RECORD;
BEGIN
  FOR v_res IN
    SELECT * FROM public.stock_reservations
    WHERE order_id = p_order_id AND status = 'active'
    FOR UPDATE
  LOOP
    UPDATE public.inventory_items
    SET reserved_stock = GREATEST(0, reserved_stock - v_res.base_quantity),
        updated_at = NOW()
    WHERE id = v_res.inventory_item_id;

    UPDATE public.stock_reservations
    SET status = p_new_status,
        updated_at = NOW()
    WHERE id = v_res.id;
  END LOOP;
END;
$$;

-- 3. Déstockage physique unique lors de la remise (handover) sans double déduction
CREATE OR REPLACE FUNCTION public.consume_stock_on_handover(
  p_order_id UUID,
  p_staff_id UUID,
  p_staff_name TEXT
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_order RECORD;
  v_res RECORD;
  v_item RECORD;
BEGIN
  SELECT * INTO v_order FROM public.orders WHERE id = p_order_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order not found';
  END IF;

  -- Idempotence : ne jamais déduire deux fois le stock physique
  IF v_order.stock_deducted = TRUE THEN
    RETURN;
  END IF;

  FOR v_res IN
    SELECT * FROM public.stock_reservations
    WHERE order_id = p_order_id AND status = 'active'
    FOR UPDATE
  LOOP
    SELECT * INTO v_item FROM public.inventory_items WHERE id = v_res.inventory_item_id FOR UPDATE;

    UPDATE public.inventory_items
    SET physical_stock = physical_stock - v_res.base_quantity,
        reserved_stock = reserved_stock - v_res.base_quantity,
        updated_at = NOW()
    WHERE id = v_res.inventory_item_id;

    UPDATE public.stock_reservations
    SET status = 'consumed',
        updated_at = NOW()
    WHERE id = v_res.id;

    INSERT INTO public.stock_movements (
      inventory_item_id, movement_type, quantity_delta,
      previous_physical_stock, new_physical_stock,
      reason, reference_code, author_staff_id, author_name
    ) VALUES (
      v_res.inventory_item_id, 'sale', -v_res.base_quantity,
      v_item.physical_stock, v_item.physical_stock - v_res.base_quantity,
      'Remise commande ' || v_order.reference, v_order.reference, p_staff_id, p_staff_name
    );
  END LOOP;

  UPDATE public.orders
  SET stock_deducted = TRUE,
      updated_at = NOW()
  WHERE id = p_order_id;
END;
$$;
