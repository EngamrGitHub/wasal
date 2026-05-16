import { useState, useEffect } from 'react';
import { BaseService } from '@/src/services/baseService';

/**
 * Generic Hook to fetch data from any service, keeping UI components clean.
 */
export function useSupabaseData<T>(
  service: BaseService<T>, 
  filterColumn?: string, 
  filterValue?: any,
  selectQuery: string = '*'
) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      try {
        setLoading(true);
        let result: T[];
        
        if (filterColumn && filterValue !== undefined) {
          result = await service.getByFilter(filterColumn, filterValue, selectQuery);
        } else {
          result = await service.getAll(selectQuery);
        }

        if (isMounted) setData(result);
      } catch (err: any) {
        if (isMounted) {
          // Fallback to dummy data for demo purposes if it's a configuration error
          if (err.message.includes('Supabase URL/Key missing') || err.message.includes('not initialized')) {
            console.warn("Using demo data for", (service as any).tableName);
            // Simple mock data based on service (table) name
            const tableName = (service as any).tableName;
            if (tableName === 'profiles') {
              setData([{ id: '1', name: 'Demo Admin', email: 'admin@demo.com', role: 'ADMIN', created_at: new Date().toISOString() }] as any);
            } else if (tableName === 'orders') {
              setData([{ 
                id: 'ord_12345678', 
                user_id: 'usr_87654321',
                total_amount: 500, 
                status: 'PAID', 
                created_at: new Date().toISOString() 
              }] as any);
            } else if (tableName === 'products') {
              // Mock products for the new schema
              setData([
                {
                  id: 'prod_1',
                  name_ar: 'حذاء رياضي ممتاز',
                  name_en: 'Premium Sneakers',
                  description_ar: 'حذاء رياضي مريح جداً.',
                  description_en: 'Very comfortable running shoes.',
                  approval_status: 'APPROVED',
                  product_variants: [{ id: 'var_1', price: 120.00, stock_quantity: 50, weight_kg: 1.0, image_url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff' }],
                  product_images: []
                },
                {
                  id: 'prod_2',
                  name_ar: 'ساعة ذكية',
                  name_en: 'Smart Watch',
                  description_ar: 'ساعة ذكية لمتابعة اللياقة.',
                  description_en: 'Fitness tracking smart watch.',
                  approval_status: 'PENDING',
                  product_variants: [{ id: 'var_2', price: 199.99, stock_quantity: 30, weight_kg: 0.3, image_url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30' }],
                  product_images: []
                }
              ] as any);
            }
          } else {
            setError(err.message);
          }
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [service, filterColumn, filterValue]);

  // Expose a mutate function to manually update local state after creation/deletion
  const mutate = (newData: T[]) => setData(newData);

  return { data, loading, error, mutate };
}
