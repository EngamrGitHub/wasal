import { createClient } from '@/src/lib/supabase/client';
import { Product } from '@/src/types';

export const ProductService = {
  async getApprovedProducts(search?: string): Promise<Product[]> {
    const supabase = createClient() as any;
    if (!supabase) throw new Error('Supabase URL/Key missing');

    let query = supabase
      .from('products')
      .select('*, product_variants(*), product_images(*)')
      .eq('approval_status', 'APPROVED')
      .eq('is_active', true);

    if (search) {
      query = query.or(`name_en.ilike.%${search}%,name_ar.ilike.%${search}%`);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching products:', error.message);
      throw new Error(error.message);
    }

    // Apply smart pricing logic for the public storefront: 
    // Final Price = ceil((Original Price * 1.25) + 50)
    if (data) {
      data.forEach((product: any) => {
        if (product.product_variants) {
          product.product_variants.forEach((variant: any) => {
            variant.original_price = variant.price;
            variant.price = Math.ceil(variant.price * 1.25 + 50);
          });
        }
      });
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
   * Approve a product with custom markup and shipping values (Admin Action)
   */
  async approveProductWithMarkup(productId: string, variants: { id: string, price: number }[]): Promise<void> {
    const supabase = createClient() as any;
    if (!supabase) throw new Error('Supabase URL/Key missing');

    // 1. Update product status
    const { data: prodData, error: prodError } = await supabase
      .from('products')
      .update({ approval_status: 'APPROVED', rejection_reason: null, is_active: true })
      .eq('id', productId)
      .select();

    if (prodError) throw new Error(prodError.message);
    if (!prodData || prodData.length === 0) throw new Error('Failed to update product due to RLS policies.');

    // 2. Update variant prices in batch
    const updatePromises = variants.map(v => 
      supabase
        .from('product_variants')
        .update({ price: v.price })
        .eq('id', v.id)
    );

    await Promise.all(updatePromises);
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

    // Fetch the current user (merchant) to set the store_id/seller context if needed
    const { data: { user } } = await supabase.auth.getUser();
    const storeId = user?.user_metadata?.store_id || null;
    
    // 1. Insert base product
    const { data: productData, error: productError } = await supabase
      .from('products')
      .insert({
        name_ar: payload.name_ar,
        name_en: payload.name_en,
        description_ar: payload.description_ar,
        description_en: payload.description_en,
        category_id: payload.category_id || null,
        store_id: storeId, // Dynamically set to merchant's store_id
        approval_status: 'PENDING',
        is_active: true
      })
      .select()
      .single();
      
    if (productError) throw new Error(productError.message);

    const productId = productData.id;

    // 2. Insert variants
    if (payload.variants && payload.variants.length > 0) {
      const variantsToInsert = payload.variants.map((v: any) => ({
        product_id: productId,
        price: v.price,
        stock_quantity: v.stock_quantity || 0,
        weight_kg: v.weight_kg || 0,
        sku: v.sku || null,
        color_id: v.color_id || null,
        size_id: v.size_id || null,
        is_active: true
      }));

      const { data: variantData, error: variantError } = await supabase
        .from('product_variants')
        .insert(variantsToInsert)
        .select();

      if (variantError) throw new Error(variantError.message);

      // 3. Insert images
      // We will attach images to the FIRST variant by default if specific variant binding isn't provided from UI
      if (payload.images && payload.images.length > 0) {
        const firstVariantId = variantData[0].id;
        
        const imagesToInsert = payload.images.map((img: any, index: number) => ({
          product_id: productId,
          variant_id: firstVariantId,
          image_url: img.url,
          is_main: img.is_main || index === 0,
          display_order: index + 1
        }));

        const { error: imageError } = await supabase
          .from('product_images')
          .insert(imagesToInsert);
          
        if (imageError) throw new Error(imageError.message);
      }
    }

    return productData;
  }
};
