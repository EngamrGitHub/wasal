export type LocalizedString = {
  en: string;
  ar: string;
};

// واجهة المنتج معدلة لدعم اللغتين (تعتمد على التصميم الجديد)
export interface Product {
  id: string;
  store_id: string;
  title: LocalizedString; // يدعم الإنجليزية والعربية
  description: LocalizedString;
  price: number;
  stock: number;
  images: string[];
  approval_status: 'PENDING' | 'APPROVED' | 'REJECTED';
  rejection_reason?: string | null;
  created_at: string;
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
