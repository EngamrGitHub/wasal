-- ==========================================
-- TUJARIA SUPABASE RLS POLICIES MIGRATION
-- ==========================================

-- 1. Helper Functions to identify User Roles and Store ID from JWT Metadata
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean SECURITY DEFINER AS $$
BEGIN
  RETURN coalesce((auth.jwt() -> 'user_metadata'::text) ->> 'role'::text, 'CUSTOMER') = 'ADMIN';
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.is_merchant()
RETURNS boolean SECURITY DEFINER AS $$
BEGIN
  RETURN coalesce((auth.jwt() -> 'user_metadata'::text) ->> 'role'::text, 'CUSTOMER') = 'MERCHANT';
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.get_user_store_id()
RETURNS uuid SECURITY DEFINER AS $$
BEGIN
  RETURN ((auth.jwt() -> 'user_metadata'::text) ->> 'store_id'::text)::uuid;
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 2. Enable Row Level Security (RLS) on all tables
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.colors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.size_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sizes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.governorates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipping_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipping_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seller_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- 3. Drop existing policies to prevent conflicts
DROP POLICY IF EXISTS "Public categories are viewable by everyone" ON public.categories;
DROP POLICY IF EXISTS "Admin categories management" ON public.categories;
DROP POLICY IF EXISTS "Public colors are viewable by everyone" ON public.colors;
DROP POLICY IF EXISTS "Admin colors management" ON public.colors;
DROP POLICY IF EXISTS "Public size_types are viewable by everyone" ON public.size_types;
DROP POLICY IF EXISTS "Admin size_types management" ON public.size_types;
DROP POLICY IF EXISTS "Public sizes are viewable by everyone" ON public.sizes;
DROP POLICY IF EXISTS "Admin sizes management" ON public.sizes;
DROP POLICY IF EXISTS "Public governorates are viewable by everyone" ON public.governorates;
DROP POLICY IF EXISTS "Admin governorates management" ON public.governorates;
DROP POLICY IF EXISTS "Public shipping_providers are viewable by everyone" ON public.shipping_providers;
DROP POLICY IF EXISTS "Admin shipping_providers management" ON public.shipping_providers;
DROP POLICY IF EXISTS "Public shipping_rates are viewable by everyone" ON public.shipping_rates;
DROP POLICY IF EXISTS "Admin shipping_rates management" ON public.shipping_rates;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can edit their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admin profiles management" ON public.profiles;
DROP POLICY IF EXISTS "Users can manage their own addresses" ON public.addresses;
DROP POLICY IF EXISTS "Admin addresses management" ON public.addresses;
DROP POLICY IF EXISTS "Products are viewable by everyone" ON public.products;
DROP POLICY IF EXISTS "Merchants can manage their own products" ON public.products;
DROP POLICY IF EXISTS "Admin products management" ON public.products;
DROP POLICY IF EXISTS "Variants are viewable by everyone" ON public.product_variants;
DROP POLICY IF EXISTS "Merchants can manage their own variants" ON public.product_variants;
DROP POLICY IF EXISTS "Admin variants management" ON public.product_variants;
DROP POLICY IF EXISTS "Images are viewable by everyone" ON public.product_images;
DROP POLICY IF EXISTS "Merchants can manage their own product images" ON public.product_images;
DROP POLICY IF EXISTS "Admin images management" ON public.product_images;
DROP POLICY IF EXISTS "Public discounts are viewable by everyone" ON public.discounts;
DROP POLICY IF EXISTS "Admin discounts management" ON public.discounts;
DROP POLICY IF EXISTS "Users can manage their own cart" ON public.carts;
DROP POLICY IF EXISTS "Admin carts management" ON public.carts;
DROP POLICY IF EXISTS "Users can manage their own cart items" ON public.cart_items;
DROP POLICY IF EXISTS "Admin cart items management" ON public.cart_items;
DROP POLICY IF EXISTS "Users can manage their own wishlist" ON public.wishlists;
DROP POLICY IF EXISTS "Admin wishlists management" ON public.wishlists;
DROP POLICY IF EXISTS "Users can manage their own wishlist items" ON public.wishlist_items;
DROP POLICY IF EXISTS "Admin wishlist items management" ON public.wishlist_items;
DROP POLICY IF EXISTS "Users/Merchants can view their own orders" ON public.orders;
DROP POLICY IF EXISTS "Users can create orders" ON public.orders;
DROP POLICY IF EXISTS "Admin orders management" ON public.orders;
DROP POLICY IF EXISTS "Users/Merchants can view their own order items" ON public.order_items;
DROP POLICY IF EXISTS "Users can insert order items" ON public.order_items;
DROP POLICY IF EXISTS "Admin order items management" ON public.order_items;
DROP POLICY IF EXISTS "Users can view their own payments" ON public.payments;
DROP POLICY IF EXISTS "Admin payments management" ON public.payments;
DROP POLICY IF EXISTS "Merchants can view transactions" ON public.seller_transactions;
DROP POLICY IF EXISTS "Admin transactions management" ON public.seller_transactions;
DROP POLICY IF EXISTS "Reviews are viewable by everyone" ON public.reviews;
DROP POLICY IF EXISTS "Users can manage their own reviews" ON public.reviews;
DROP POLICY IF EXISTS "Allow guest profile upsert" ON public.profiles;
DROP POLICY IF EXISTS "Allow guest order insertion" ON public.orders;
DROP POLICY IF EXISTS "Allow guest order items insertion" ON public.order_items;

-- 4. Create RLS Policies

-- --- Categories ---
CREATE POLICY "Public categories are viewable by everyone" ON public.categories
  FOR SELECT USING (true);
CREATE POLICY "Admin categories management" ON public.categories
  FOR ALL USING (public.is_admin());

-- --- Colors ---
CREATE POLICY "Public colors are viewable by everyone" ON public.colors
  FOR SELECT USING (true);
CREATE POLICY "Admin colors management" ON public.colors
  FOR ALL USING (public.is_admin());

-- --- Size Types ---
CREATE POLICY "Public size_types are viewable by everyone" ON public.size_types
  FOR SELECT USING (true);
CREATE POLICY "Admin size_types management" ON public.size_types
  FOR ALL USING (public.is_admin());

-- --- Sizes ---
CREATE POLICY "Public sizes are viewable by everyone" ON public.sizes
  FOR SELECT USING (true);
CREATE POLICY "Admin sizes management" ON public.sizes
  FOR ALL USING (public.is_admin());

-- --- Governorates ---
CREATE POLICY "Public governorates are viewable by everyone" ON public.governorates
  FOR SELECT USING (true);
CREATE POLICY "Admin governorates management" ON public.governorates
  FOR ALL USING (public.is_admin());

-- --- Shipping Providers ---
CREATE POLICY "Public shipping_providers are viewable by everyone" ON public.shipping_providers
  FOR SELECT USING (true);
CREATE POLICY "Admin shipping_providers management" ON public.shipping_providers
  FOR ALL USING (public.is_admin());

-- --- Shipping Rates ---
CREATE POLICY "Public shipping_rates are viewable by everyone" ON public.shipping_rates
  FOR SELECT USING (true);
CREATE POLICY "Admin shipping_rates management" ON public.shipping_rates
  FOR ALL USING (public.is_admin());

-- --- Profiles ---
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles
  FOR SELECT USING (true);
CREATE POLICY "Users can edit their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Allow guest profile upsert" ON public.profiles
  FOR ALL USING (id = 'de000000-0000-0000-0000-000000000000')
  WITH CHECK (id = 'de000000-0000-0000-0000-000000000000');
CREATE POLICY "Admin profiles management" ON public.profiles
  FOR ALL USING (public.is_admin());

-- --- Addresses ---
CREATE POLICY "Users can manage their own addresses" ON public.addresses
  FOR ALL USING (auth.uid() = user_id OR public.is_admin());

-- --- Products ---
CREATE POLICY "Products are viewable by everyone" ON public.products
  FOR SELECT USING (
    is_active = true AND approval_status = 'APPROVED' OR
    (auth.role() = 'authenticated' AND (
      public.is_admin() OR
      (public.is_merchant() AND store_id = public.get_user_store_id())
    ))
  );
CREATE POLICY "Merchants can manage their own products" ON public.products
  FOR ALL USING (
    public.is_admin() OR
    (public.is_merchant() AND store_id = public.get_user_store_id())
  );

-- --- Product Variants ---
CREATE POLICY "Variants are viewable by everyone" ON public.product_variants
  FOR SELECT USING (true);
CREATE POLICY "Merchants can manage their own variants" ON public.product_variants
  FOR ALL USING (
    public.is_admin() OR
    (public.is_merchant() AND product_id IN (
      SELECT id FROM public.products WHERE store_id = public.get_user_store_id()
    ))
  );

-- --- Product Images ---
CREATE POLICY "Images are viewable by everyone" ON public.product_images
  FOR SELECT USING (true);
CREATE POLICY "Merchants can manage their own product images" ON public.product_images
  FOR ALL USING (
    public.is_admin() OR
    (public.is_merchant() AND product_id IN (
      SELECT id FROM public.products WHERE store_id = public.get_user_store_id()
    ))
  );

-- --- Discounts ---
CREATE POLICY "Public discounts are viewable by everyone" ON public.discounts
  FOR SELECT USING (true);
CREATE POLICY "Admin discounts management" ON public.discounts
  FOR ALL USING (public.is_admin());

-- --- Carts ---
CREATE POLICY "Users can manage their own cart" ON public.carts
  FOR ALL USING (auth.uid() = user_id OR public.is_admin());

-- --- Cart Items ---
CREATE POLICY "Users can manage their own cart items" ON public.cart_items
  FOR ALL USING (
    cart_id IN (SELECT id FROM public.carts WHERE user_id = auth.uid()) OR
    public.is_admin()
  );

-- --- Wishlists ---
CREATE POLICY "Users can manage their own wishlist" ON public.wishlists
  FOR ALL USING (auth.uid() = user_id OR public.is_admin());

-- --- Wishlist Items ---
CREATE POLICY "Users can manage their own wishlist items" ON public.wishlist_items
  FOR ALL USING (
    wishlist_id IN (SELECT id FROM public.wishlists WHERE user_id = auth.uid()) OR
    public.is_admin()
  );

-- --- Orders ---
CREATE POLICY "Users/Merchants can view their own orders" ON public.orders
  FOR SELECT USING (
    auth.uid() = user_id OR
    public.is_admin() OR
    (public.is_merchant() AND EXISTS (
      SELECT 1 FROM public.order_items oi
      JOIN public.product_variants pv ON oi.variant_id = pv.id
      JOIN public.products p ON pv.product_id = p.id
      WHERE oi.order_id = public.orders.id AND p.store_id = public.get_user_store_id()
    ))
  );
CREATE POLICY "Users can create orders" ON public.orders
  FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id = 'de000000-0000-0000-0000-000000000000' OR public.is_admin());
CREATE POLICY "Admin orders management" ON public.orders
  FOR ALL USING (public.is_admin());

-- --- Order Items ---
CREATE POLICY "Users/Merchants can view their own order items" ON public.order_items
  FOR SELECT USING (
    public.is_admin() OR
    order_id IN (SELECT id FROM public.orders WHERE user_id = auth.uid()) OR
    (public.is_merchant() AND variant_id IN (
      SELECT pv.id FROM public.product_variants pv
      JOIN public.products p ON pv.product_id = p.id
      WHERE p.store_id = public.get_user_store_id()
    ))
  );
CREATE POLICY "Users can insert order items" ON public.order_items
  FOR INSERT WITH CHECK (
    public.is_admin() OR
    order_id IN (SELECT id FROM public.orders WHERE user_id = auth.uid() OR user_id = 'de000000-0000-0000-0000-000000000000')
  );
CREATE POLICY "Admin order items management" ON public.order_items
  FOR ALL USING (public.is_admin());

-- --- Payments ---
CREATE POLICY "Users can view their own payments" ON public.payments
  FOR SELECT USING (
    public.is_admin() OR
    order_id IN (SELECT id FROM public.orders WHERE user_id = auth.uid())
  );
CREATE POLICY "Admin payments management" ON public.payments
  FOR ALL USING (public.is_admin());

-- --- Seller Transactions ---
CREATE POLICY "Merchants can view transactions" ON public.seller_transactions
  FOR SELECT USING (seller_id = auth.uid() OR public.is_admin());
CREATE POLICY "Admin transactions management" ON public.seller_transactions
  FOR ALL USING (public.is_admin());

-- --- Reviews ---
CREATE POLICY "Reviews are viewable by everyone" ON public.reviews
  FOR SELECT USING (true);
CREATE POLICY "Users can manage their own reviews" ON public.reviews
  FOR ALL USING (auth.uid() = user_id OR public.is_admin());
