export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      categories: {
        Row: {
          id: string
          name_ar: string
          name_en: string
          image_url: string | null
          parent_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name_ar: string
          name_en: string
          image_url?: string | null
          parent_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name_ar?: string
          name_en?: string
          image_url?: string | null
          parent_id?: string | null
          created_at?: string
        }
      }
      colors: {
        Row: {
          id: string
          name: string
          hex_code: string | null
        }
        Insert: {
          id?: string
          name: string
          hex_code?: string | null
        }
        Update: {
          id?: string
          name?: string
          hex_code?: string | null
        }
      }
      size_types: {
        Row: { id: string; name: string }
        Insert: { id?: string; name: string }
        Update: { id?: string; name?: string }
      }
      sizes: {
        Row: { id: string; name: string; size_type_id: string | null }
        Insert: { id?: string; name: string; size_type_id?: string | null }
        Update: { id?: string; name?: string; size_type_id?: string | null }
      }
      governorates: {
        Row: { id: string; name_ar: string; name_en: string; shipping_price: number; is_active: boolean }
        Insert: { id?: string; name_ar: string; name_en: string; shipping_price?: number; is_active?: boolean }
        Update: { id?: string; name_ar?: string; name_en?: string; shipping_price?: number; is_active?: boolean }
      }
      profiles: {
        Row: { id: string; full_name: string | null; phone: string | null; created_at: string }
        Insert: { id: string; full_name?: string | null; phone?: string | null; created_at?: string }
        Update: { id?: string; full_name?: string | null; phone?: string | null; created_at?: string }
      }
      products: {
        Row: {
          id: string
          name_ar: string
          name_en: string
          description_ar: string | null
          description_en: string | null
          category_id: string | null
          store_id: string | null
          is_active: boolean
          approval_status: string
          rejection_reason: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name_ar: string
          name_en: string
          description_ar?: string | null
          description_en?: string | null
          category_id?: string | null
          store_id?: string | null
          is_active?: boolean
          approval_status?: string
          rejection_reason?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name_ar?: string
          name_en?: string
          description_ar?: string | null
          description_en?: string | null
          category_id?: string | null
          store_id?: string | null
          is_active?: boolean
          approval_status?: string
          rejection_reason?: string | null
          created_at?: string
        }
      }
      product_variants: {
        Row: {
          id: string
          product_id: string
          sku: string | null
          price: number
          stock_quantity: number
          weight_kg: number
          image_url: string | null
          color_id: string | null
          size_id: string | null
          is_active: boolean
        }
        Insert: {
          id?: string
          product_id: string
          sku?: string | null
          price: number
          stock_quantity?: number
          weight_kg?: number
          image_url?: string | null
          color_id?: string | null
          size_id?: string | null
          is_active?: boolean
        }
        Update: {
          id?: string
          product_id?: string
          sku?: string | null
          price?: number
          stock_quantity?: number
          weight_kg?: number
          image_url?: string | null
          color_id?: string | null
          size_id?: string | null
          is_active?: boolean
        }
      }
      product_images: {
        Row: {
          id: string
          product_id: string
          variant_id: string | null
          image_url: string
          is_main: boolean
          display_order: number
        }
        Insert: {
          id?: string
          product_id: string
          variant_id?: string | null
          image_url: string
          is_main?: boolean
          display_order?: number
        }
        Update: {
          id?: string
          product_id?: string
          variant_id?: string | null
          image_url?: string
          is_main?: boolean
          display_order?: number
        }
      }
      stores: {
        Row: {
          id: string
          name: string
          owner_id: string | null
          has_own_shipping: boolean
          commission_rate: number
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          owner_id?: string | null
          has_own_shipping?: boolean
          commission_rate?: number
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          owner_id?: string | null
          has_own_shipping?: boolean
          commission_rate?: number
          created_at?: string
        }
      }
      store_shipping_rates: {
        Row: {
          id: string
          store_id: string | null
          governorate_id: string | null
          price: number
        }
        Insert: {
          id?: string
          store_id?: string | null
          governorate_id?: string | null
          price: number
        }
        Update: {
          id?: string
          store_id?: string | null
          governorate_id?: string | null
          price?: number
        }
      }
      orders: {
        Row: {
          id: string
          user_id: string | null
          total_amount: number
          status: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          total_amount: number
          status?: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          total_amount?: number
          status?: string
          created_at?: string
        }
      }
    }
  }
}
