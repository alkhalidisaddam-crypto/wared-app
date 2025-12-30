import React from 'react';

export interface Order {
  id: string;
  created_at: string;
  user_id: string;
  customer_name: string;
  phone: string;
  governorate: string;
  address?: string; // Specific address details
  delivery_duration?: string; // Renamed from delivery_time to match DB column
  due_date?: string | null; // Calculated deadline for delivery
  product: string;
  price: number; // Product Price (Selling Price)
  cost_price?: number; // Cost of Goods Sold (Buying Price)
  delivery_cost: number; // Delivery Fee
  discount: number; // Discount Amount
  status: 'new' | 'processing' | 'out_for_delivery' | 'delivered' | 'returned';
  is_collected?: boolean; // True if cash received from courier
  campaign_id?: string; // Marketing Campaign Attribution
}

export interface Expense {
  id: string;
  created_at: string;
  title: string;
  amount: number;
  category: string;
  user_id: string;
}

export interface Supplier {
  id: string;
  created_at: string;
  name: string;
  phone: string;
  user_id: string;
}

export interface SupplierLedgerEntry {
  id: string;
  created_at: string;
  supplier_id: string;
  transaction_type: 'PURCHASE' | 'PAYMENT';
  amount: number;
  notes?: string;
  transaction_date: string;
  user_id: string;
}

export interface DeliveryRate {
  id?: string;
  user_id: string;
  governorate: string;
  price: number;
}

export interface Campaign {
  id: string;
  created_at: string;
  name: string;
  platform: 'facebook' | 'instagram' | 'tiktok' | 'snapchat' | 'google' | 'other';
  is_active: boolean;
  user_id: string;
}

export type OrderStatus = 'new' | 'processing' | 'out_for_delivery' | 'delivered' | 'returned';

export type DateFilter = 'all' | 'today' | 'week' | 'month';

export interface StatCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  colorClass: string;
  subValue?: string;
}

export interface StoreProfile {
  id?: string;
  store_name: string;
  phone: string;
}