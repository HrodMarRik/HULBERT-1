// Modèles pour les commandes
// Ces interfaces correspondent aux schémas Pydantic du backend

export interface OrderItem {
  id: number;
  product_id: number;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export interface OrderItemCreate {
  product_id: number;
  quantity: number;
  unit_price: number;
}

export interface OrderItemWithProduct extends OrderItem {
  product_name: string;
  product_description?: string;
}

export interface Order {
  id: number;
  user_id: number;
  total_amount: number;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  shipping_address?: string;
  notes?: string;
  created_at: string;
  updated_at?: string;
}

export interface OrderCreate {
  shipping_address?: string;
  notes?: string;
  items: OrderItemCreate[];
}

export interface OrderUpdate {
  status?: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  shipping_address?: string;
  notes?: string;
}

export interface OrderWithItems extends Order {
  items: OrderItemWithProduct[];
}

export interface OrderWithUser extends Order {
  user_username: string;
  user_email: string;
}

export interface OrderSummary {
  id: number;
  total_amount: number;
  status: string;
  item_count: number;
  created_at: string;
}

export interface OrderStats {
  total_orders: number;
  total_sales: number;
  pending_orders: number;
  confirmed_orders: number;
  shipped_orders: number;
  delivered_orders: number;
  cancelled_orders: number;
}
