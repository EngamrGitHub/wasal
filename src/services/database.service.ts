import { createClient } from '@/src/lib/supabase/client'
import { Database } from '@/src/types/database'

type Category = Database['public']['Tables']['categories']['Row']
type Product = Database['public']['Tables']['products']['Row']
type ProductVariant = Database['public']['Tables']['product_variants']['Row']

export const databaseService = {
  // Categories
  async getCategories() {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name_ar', { ascending: true })
    
    if (error) throw error
    return data
  },

  async getCategoryById(id: string) {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data
  },

  // Products
  async getProducts() {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        product_variants (*)
      `)
      .eq('is_active', true)
    
    if (error) throw error
    return data
  },

  async getProductById(id: string) {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        product_variants (*),
        product_images (*)
      `)
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data
  }
}
