import { createClient } from '@/src/lib/supabase/client';

/**
 * Generic Base Service for Supabase to apply DRY (Don't Repeat Yourself) principle.
 * You can use this for Users, Stores, Orders, etc.
 */
export class BaseService<T> {
  private tableName: string;

  constructor(tableName: string) {
    this.tableName = tableName;
  }

  protected get supabase() {
    const client = createClient();
    if (!client) {
      throw new Error('Supabase client not initialized. Check your environment variables.');
    }
    return client;
  }

  async getAll(selectQuery: string = '*'): Promise<T[]> {
    const { data, error } = await (this.supabase as any)
      .from(this.tableName)
      .select(selectQuery);
      
    if (error) throw new Error(error.message);
    return data as unknown as T[];
  }

  async count(column?: string, value?: any): Promise<number> {
    let query = (this.supabase as any)
      .from(this.tableName)
      .select('*', { count: 'exact', head: true });

    if (column && value !== undefined) {
      query = query.eq(column, value);
    }

    const { count, error } = await query;
      
    if (error) throw new Error(error.message);
    return count || 0;
  }

  async getById(id: string): Promise<T> {
    const { data, error } = await (this.supabase as any)
      .from(this.tableName)
      .select('*')
      .eq('id', id)
      .single();
      
    if (error) throw new Error(error.message);
    return data as unknown as T;
  }

  async getByFilter(column: string, value: any, selectQuery: string = '*'): Promise<T[]> {
    const { data, error } = await (this.supabase as any)
      .from(this.tableName)
      .select(selectQuery)
      .eq(column, value);
      
    if (error) throw new Error(error.message);
    return data as unknown as T[];
  }

  async create(payload: Partial<T>): Promise<T> {
    const { data, error } = await (this.supabase as any)
      .from(this.tableName)
      .insert(payload)
      .select()
      .single();
      
    if (error) throw new Error(error.message);
    return data as unknown as T;
  }

  async update(id: string, payload: Partial<T>): Promise<T> {
    const { data, error } = await (this.supabase as any)
      .from(this.tableName)
      .update(payload)
      .eq('id', id)
      .select()
      .single();
      
    if (error) throw new Error(error.message);
    return data as unknown as T;
  }

  async delete(id: string): Promise<void> {
    const { error } = await (this.supabase as any)
      .from(this.tableName)
      .delete()
      .eq('id', id);
      
    if (error) throw new Error(error.message);
  }
}

// إنشاء نُسخ جاهزة للاستخدام لكل جدول في النظام
import { User, Store, Order } from '@/src/types';

export const UserService = new BaseService<User>('profiles');
export const StoreService = new BaseService<Store>('stores');
export const OrderService = new BaseService<Order>('orders');
