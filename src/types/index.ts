// UI-facing types that map to the Supabase database schema

export interface LocalizedString {
  en: string;
  ar: string;
}

export interface Category {
  id: string;
  name_ar: string;
  name_en: string;
  image_url: string | null;
}

export interface ProductVariant {
  id: string;
  product_id: string;
  sku: string | null;
  price: number;
  stock_quantity: number;
  weight_kg: number;
  image_url: string | null;
  color_id: string | null;
  size_id: string | null;
  is_active: boolean;
  colors?: {
    id?: string;
    name: string;
    hex_code: string;
  } | null;
  sizes?: {
    id?: string;
    name: string;
  } | null;
}

export interface ProductImage {
  id: string;
  product_id: string;
  variant_id: string | null;
  image_url: string;
  is_main: boolean;
}

export interface Product {
  id: string;
  store_id: string | null;
  name_ar: string;
  name_en: string;
  description_ar: string | null;
  description_en: string | null;
  category_id: string | null;
  category?: Category;
  is_active: boolean;
  approval_status: 'PENDING' | 'APPROVED' | 'REJECTED';
  rejection_reason?: string | null;
  created_at: string;
  product_variants: ProductVariant[];
  product_images: ProductImage[];
}

export interface Store {
  id: string;
  user_id: string;
  name: LocalizedString; // اسم المتجر يمكن أن يكون بلغتين
  description: LocalizedString;
  logo_url?: string;
  status: 'ACTIVE' | 'SUSPENDED';
  commission_rate: number;
  created_at: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'MERCHANT' | 'CUSTOMER';
  created_at: string;
}

export interface Order {
  id: string;
  user_id: string;
  total_amount: number;
  status: 'PENDING' | 'PAID' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
  shipping_address: any;
  created_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  store_id: string;
  quantity: number;
  price_at_time: number;
}
