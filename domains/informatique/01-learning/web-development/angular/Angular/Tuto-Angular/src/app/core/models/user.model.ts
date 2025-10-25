// Modèles de base pour l'application Angular
// Ces interfaces correspondent aux schémas Pydantic du backend

export interface User {
  id: number;
  username: string;
  email: string;
  first_name?: string;
  last_name?: string;
  is_active: boolean;
  is_admin: boolean;
  created_at: string;
  updated_at?: string;
}

export interface UserCreate {
  username: string;
  email: string;
  password: string;
  first_name?: string;
  last_name?: string;
}

export interface UserUpdate {
  username?: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  is_active?: boolean;
}

export interface UserLogin {
  username: string;
  password: string;
}

export interface UserPasswordChange {
  current_password: string;
  new_password: string;
}

export interface Token {
  access_token: string;
  token_type: string;
  expires_in: number;
}

export interface TokenData {
  username?: string;
  exp?: number;
}
