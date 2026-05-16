import { createClient } from '@/src/lib/supabase/client';
import { Product } from '@/src/types';

export const ProductService = {
  /**
   * Get all approved products (For Customer Storefront)
   */
  async getApprovedProducts(): Promise<Product[]> {
    const supabase = createClient() as any;
    if (!supabase) throw new Error('Supabase URL/Key missing');

    const { data, error } = await supabase
      .from('products')
      .select('*, product_variants(*), product_images(*)')
      .eq('approval_status', 'APPROVED');
    
    if (error) {
      console.error('Error fetching products:', error.message);
      throw new Error(error.message);
    }
    
    return data as unknown as Product[];
  },

  /**
   * Get pending products (For Admin Dashboard)
   */
  async getPendingProducts(): Promise<Product[]> {
    const supabase = createClient() as any;
    if (!supabase) throw new Error('Supabase URL/Key missing');

    const { data, error } = await supabase
      .from('products')
      .select('*, product_variants(*), product_images(*)')
      .eq('approval_status', 'PENDING');
      
    if (error) throw new Error(error.message);
    return data as unknown as Product[];
  },

  /**
   * Approve a product (Admin Action)
   */
  async approveProduct(productId: string): Promise<void> {
    const supabase = createClient() as any;
    if (!supabase) throw new Error('Supabase URL/Key missing');

    const { error } = await supabase
      .from('products')
      .update({ approval_status: 'APPROVED', rejection_reason: null })
      .eq('id', productId);
      
    if (error) throw new Error(error.message);
  },

  /**
   * Reject a product with reason (Admin Action)
   */
  async rejectProduct(productId: string, reason: string): Promise<void> {
    const supabase = createClient() as any;
    if (!supabase) throw new Error('Supabase URL/Key missing');

    const { error } = await supabase
      .from('products')
      .update({ approval_status: 'REJECTED', rejection_reason: reason })
      .eq('id', productId);
      
    if (error) throw new Error(error.message);
  },

  /**
   * Create a new product (Merchant Action)
   */
  async createProduct(payload: any): Promise<any> {
    const supabase = createClient() as any;
    if (!supabase) throw new Error('Supabase URL/Key missing');

    // 1. Insert base product
    const { data: productData, error: productError } = await supabase
      .from('products')
      .insert({
        name_ar: payload.name_ar,
        name_en: payload.name_en,
        description_ar: payload.description_ar,
        description_en: payload.description_en,
        category_id: payload.category_id || null,
        approval_status: 'PENDING',
        is_active: true
      })
      .select()
      .single();
      
    if (productError) throw new Error(productError.message);

    const productId = productData.id;

    // 2. Insert default variant
    const { data: variantData, error: variantError } = await supabase
      .from('product_variants')
      .insert({
        product_id: productId,
        price: payload.price,
        stock_quantity: payload.stock,
        weight_kg: payload.weight_kg || 0,
        sku: payload.sku || `SKU-${Date.now()}`,
        is_active: true
      })
      .select()
      .single();

    if (variantError) {
      // In a real app we might want to rollback the product insert here
      throw new Error(variantError.message);
    }

    // 3. Insert default image if provided
    if (payload.image_url) {
      const { error: imageError } = await supabase
        .from('product_images')
        .insert({
          product_id: productId,
          variant_id: variantData.id,
          image_url: payload.image_url,
          is_main: true,
          display_order: 1
        });
        
      if (imageError) throw new Error(imageError.message);
    }

    return productData;
  }
};
