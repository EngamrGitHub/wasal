-- ==========================================
-- TUJARIA SUPABASE MIGRATION
-- ==========================================

-- مسح الجداول القديمة (احذر إذا كان لديك بيانات حقيقية لا تريد فقدانها)
DROP TABLE IF EXISTS public.payments CASCADE;
DROP TABLE IF EXISTS public.order_items CASCADE;
DROP TABLE IF EXISTS public.orders CASCADE;
DROP TABLE IF EXISTS public.products CASCADE;
DROP TABLE IF EXISTS public.stores CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;
DROP TABLE IF EXISTS public.categories CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS public.vendors CASCADE;

-- مسح الأنواع القديمة إن وجدت لتفادي خطأ "already exists"
DROP TYPE IF EXISTS public.user_role CASCADE;
DROP TYPE IF EXISTS public.store_status CASCADE;
DROP TYPE IF EXISTS public.product_status CASCADE;
DROP TYPE IF EXISTS public.order_status CASCADE;
DROP TYPE IF EXISTS public.payment_status CASCADE;

-- 1. إنشاء الأنواع المخصصة (Enums)
CREATE TYPE public.user_role AS ENUM ('ADMIN', 'MERCHANT', 'CUSTOMER');
CREATE TYPE public.store_status AS ENUM ('ACTIVE', 'SUSPENDED');
CREATE TYPE public.product_status AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
CREATE TYPE public.order_status AS ENUM ('PENDING', 'PAID', 'SHIPPED', 'DELIVERED', 'CANCELLED');
CREATE TYPE public.payment_status AS ENUM ('PENDING', 'SUCCESS', 'FAILED');

-- 2. جدول المستخدمين (يرتبط بشكل آمن بـ auth.users الخاص بسوبابيز)
CREATE TABLE public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    role public.user_role DEFAULT 'CUSTOMER' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. جدول المتاجر (يسمح بدعم الترجمة للاسم والوصف عبر JSONB)
CREATE TABLE public.stores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    name JSONB NOT NULL DEFAULT '{"en": "", "ar": ""}'::jsonb,
    description JSONB DEFAULT '{"en": "", "ar": ""}'::jsonb,
    logo_url TEXT,
    status public.store_status DEFAULT 'ACTIVE' NOT NULL,
    commission_rate DECIMAL(5,2) DEFAULT 10.00 NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id) -- مستخدم واحد = متجر واحد
);

-- 4. جدول المنتجات (يدعم الترجمة عبر JSONB، وحالة المراجعة من الأدمن)
CREATE TABLE public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE NOT NULL,
    title JSONB NOT NULL DEFAULT '{"en": "", "ar": ""}'::jsonb,
    description JSONB DEFAULT '{"en": "", "ar": ""}'::jsonb,
    price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
    stock INT NOT NULL DEFAULT 0 CHECK (stock >= 0),
    images TEXT[] DEFAULT '{}',
    approval_status public.product_status DEFAULT 'PENDING' NOT NULL,
    rejection_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. جدول الطلبات
CREATE TABLE public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE RESTRICT NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL CHECK (total_amount >= 0),
    status public.order_status DEFAULT 'PENDING' NOT NULL,
    shipping_address JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. جدول عناصر الطلب (مرتبط بالمتجر لتسهيل حساب أرباح كل تاجر)
CREATE TABLE public.order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
    product_id UUID REFERENCES public.products(id) ON DELETE RESTRICT NOT NULL,
    store_id UUID REFERENCES public.stores(id) ON DELETE RESTRICT NOT NULL,
    quantity INT NOT NULL CHECK (quantity > 0),
    price_at_time DECIMAL(10,2) NOT NULL CHECK (price_at_time >= 0)
);

-- 7. جدول المدفوعات
CREATE TABLE public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    provider VARCHAR(50) NOT NULL,
    transaction_id VARCHAR(255) UNIQUE,
    status public.payment_status DEFAULT 'PENDING' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==========================================

-- تفعيل الأمان لكل الجداول
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- أمثلة على بعض سياسات الأمان (Policies)

-- 1. المنتجات المعتمدة فقط تظهر للجميع
CREATE POLICY "Approved products are viewable by everyone" 
ON public.products FOR SELECT 
USING (approval_status = 'APPROVED');

-- 2. يمكن للتاجر رؤية كل منتجاته (حتى المرفوضة)
CREATE POLICY "Merchants can view all their own products" 
ON public.products FOR SELECT 
USING (
    store_id IN (SELECT id FROM public.stores WHERE user_id = auth.uid())
);

-- 3. الأدمن يستطيع فعل أي شيء (تأكد من تطبيق المنطق البرمجي للأدمن في الباك إند أو استخدام JWT Custom Claims)
-- هذا مثال مبسط
-- CREATE POLICY "Admin God Mode" ON public.products FOR ALL USING (
--     (SELECT role FROM public.users WHERE id = auth.uid()) = 'ADMIN'
-- );
