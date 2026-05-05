import { createClient } from '@/src/lib/supabase/client';
import { Product } from '@/src/types';

/**
 * ProductService encapsulates all Supabase interactions related to Products.
 * This applies the Single Responsibility and Repository patterns.
 */
export const ProductService = {
  /**
   * Get all approved products (For Customer Storefront)
   */
  async getApprovedProducts(): Promise<Product[]> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('products')
      .select('*')
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
    const supabase = createClient();
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('approval_status', 'PENDING');
      
    if (error) throw new Error(error.message);
    return data as unknown as Product[];
  },

  /**
   * Approve a product (Admin Action)
   */
  async approveProduct(productId: string): Promise<void> {
    const supabase = createClient();
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
    const supabase = createClient();
    const { error } = await supabase
      .from('products')
      .update({ approval_status: 'REJECTED', rejection_reason: reason })
      .eq('id', productId);
      
    if (error) throw new Error(error.message);
  }
};
