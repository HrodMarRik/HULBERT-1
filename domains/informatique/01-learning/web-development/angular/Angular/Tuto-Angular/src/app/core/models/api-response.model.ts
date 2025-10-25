// Modèles pour les réponses API
// Interfaces génériques pour standardiser les réponses

export interface ApiResponse<T> {
  data: T;
  status: number;
  message: string;
}

export interface ApiError {
  error: string;
  status_code: number;
  detail?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

export interface SearchParams {
  query?: string;
  skip?: number;
  limit?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export interface FilterParams {
  [key: string]: any;
}

// Types pour les états de chargement
export interface LoadingState {
  isLoading: boolean;
  error?: string;
}

export interface AsyncState<T> extends LoadingState {
  data?: T;
}

// Types pour les formulaires
export interface FormState<T> {
  form: T;
  isSubmitting: boolean;
  isValid: boolean;
  errors: { [key: string]: string };
}

// Types pour la navigation
export interface NavigationItem {
  label: string;
  path: string;
  icon?: string;
  children?: NavigationItem[];
  permissions?: string[];
}

// Types pour les notifications
export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
  timestamp: Date;
}

// Types pour les configurations
export interface AppConfig {
  apiUrl: string;
  appName: string;
  version: string;
  environment: 'development' | 'staging' | 'production';
  features: {
    [key: string]: boolean;
  };
}
