-- 1. Create stores table
CREATE TABLE IF NOT EXISTS public.stores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    owner_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    has_own_shipping BOOLEAN DEFAULT false,
    commission_rate DECIMAL(5,2) DEFAULT 10.00,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Link products to stores strictly if store_id was present in products
-- Assuming store_id exists in products as UUID
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'products_store_id_fkey') THEN
        ALTER TABLE public.products
        ADD CONSTRAINT products_store_id_fkey FOREIGN KEY (store_id) REFERENCES public.stores(id) ON DELETE SET NULL;
    END IF;
END $$;

-- 3. Create store_shipping_rates table
CREATE TABLE IF NOT EXISTS public.store_shipping_rates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE,
    governorate_id UUID REFERENCES public.governorates(id) ON DELETE CASCADE,
    price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
    UNIQUE(store_id, governorate_id)
);

-- 4. Create resolve_store_shipping_price RPC
CREATE OR REPLACE FUNCTION public.resolve_store_shipping_price(p_store_id UUID, p_governorate_id UUID)
RETURNS DECIMAL(10,2)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_has_own_shipping BOOLEAN;
    v_price DECIMAL(10,2);
BEGIN
    -- Check if store has its own shipping
    SELECT has_own_shipping INTO v_has_own_shipping
    FROM public.stores
    WHERE id = p_store_id;

    IF v_has_own_shipping THEN
        -- Try to get store specific rate
        SELECT price INTO v_price
        FROM public.store_shipping_rates
        WHERE store_id = p_store_id AND governorate_id = p_governorate_id;

        -- If rate not found for that governorate, fallback to platform rate
        IF v_price IS NULL THEN
            SELECT shipping_price INTO v_price
            FROM public.governorates
            WHERE id = p_governorate_id;
        END IF;
    ELSE
        -- Platform shipping rate
        SELECT shipping_price INTO v_price
        FROM public.governorates
        WHERE id = p_governorate_id;
    END IF;

    RETURN COALESCE(v_price, 0.00);
END;
$$;

-- RLS
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_shipping_rates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Stores are viewable by everyone" ON public.stores FOR SELECT USING (true);
CREATE POLICY "Store owners can manage their stores" ON public.stores FOR ALL USING (auth.uid() = owner_id);

CREATE POLICY "Store rates are viewable by everyone" ON public.store_shipping_rates FOR SELECT USING (true);
CREATE POLICY "Store owners can manage their rates" ON public.store_shipping_rates FOR ALL USING (
    store_id IN (SELECT id FROM public.stores WHERE owner_id = auth.uid())
);
