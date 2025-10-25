// Modèles pour les produits
// Ces interfaces correspondent aux schémas Pydantic du backend

export interface Product {
  id: number;
  name: string;
  description?: string;
  price: number;
  category: string;
  stock_quantity: number;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
}

export interface ProductCreate {
  name: string;
  description?: string;
  price: number;
  category: string;
  stock_quantity: number;
}

export interface ProductUpdate {
  name?: string;
  description?: string;
  price?: number;
  category?: string;
  stock_quantity?: number;
  is_active?: boolean;
}

export interface ProductSearch {
  query?: string;
  category?: string;
  min_price?: number;
  max_price?: number;
  skip?: number;
  limit?: number;
}

export interface ProductStockUpdate {
  quantity_change: number;
}
