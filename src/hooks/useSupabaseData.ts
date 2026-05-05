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
        if (isMounted) setError(err.message);
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
