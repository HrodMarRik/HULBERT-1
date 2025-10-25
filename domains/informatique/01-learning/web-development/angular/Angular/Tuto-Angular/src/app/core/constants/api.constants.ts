// Constantes de l'application
// Configuration centralisée pour l'API et l'application

export const API_CONFIG = {
  BASE_URL: 'http://localhost:8000/api',
  ENDPOINTS: {
    AUTH: {
      LOGIN: '/auth/login',
      REGISTER: '/auth/register',
      ME: '/auth/me',
      REFRESH: '/auth/refresh',
      LOGOUT: '/auth/logout'
    },
    USERS: {
      BASE: '/users',
      SEARCH: '/users/search',
      STATS: '/users/stats'
    },
    PRODUCTS: {
      BASE: '/products',
      CATEGORIES: '/products/categories',
      SEARCH: '/products/search',
      LOW_STOCK: '/products/low-stock/list'
    },
    ORDERS: {
      BASE: '/orders',
      STATS: '/orders/stats',
      USER: '/orders/user'
    }
  },
  TIMEOUT: 30000, // 30 secondes
  RETRY_ATTEMPTS: 3
} as const;

export const APP_CONFIG = {
  NAME: 'Angular Tutorial App',
  VERSION: '1.0.0',
  ENVIRONMENT: 'development' as const,
  FEATURES: {
    REGISTRATION: true,
    PRODUCT_SEARCH: true,
    ORDER_TRACKING: true,
    ADMIN_PANEL: true
  }
} as const;

export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  USER_DATA: 'user_data',
  THEME: 'theme',
  LANGUAGE: 'language'
} as const;

export const ROUTES = {
  HOME: '/',
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
  DASHBOARD: '/dashboard',
  PRODUCTS: '/products',
  ORDERS: '/orders',
  USERS: '/users',
  PROFILE: '/profile',
  ADMIN: '/admin'
} as const;

export const VALIDATION_RULES = {
  USERNAME: {
    MIN_LENGTH: 3,
    MAX_LENGTH: 50,
    PATTERN: /^[a-zA-Z0-9_]+$/
  },
  PASSWORD: {
    MIN_LENGTH: 6,
    MAX_LENGTH: 128,
    REQUIRE_UPPERCASE: false,
    REQUIRE_LOWERCASE: false,
    REQUIRE_NUMBERS: false,
    REQUIRE_SPECIAL_CHARS: false
  },
  EMAIL: {
    PATTERN: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  },
  PRODUCT: {
    NAME_MAX_LENGTH: 100,
    DESCRIPTION_MAX_LENGTH: 1000,
    PRICE_MIN: 0,
    PRICE_MAX: 999999.99,
    STOCK_MIN: 0,
    STOCK_MAX: 999999
  }
} as const;

export const STATUS_CODES = {
  SUCCESS: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500
} as const;

export const ORDER_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  SHIPPED: 'shipped',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled'
} as const;

export const ORDER_STATUS_LABELS = {
  [ORDER_STATUS.PENDING]: 'En attente',
  [ORDER_STATUS.CONFIRMED]: 'Confirmée',
  [ORDER_STATUS.SHIPPED]: 'Expédiée',
  [ORDER_STATUS.DELIVERED]: 'Livrée',
  [ORDER_STATUS.CANCELLED]: 'Annulée'
} as const;

export const PRODUCT_CATEGORIES = [
  'Electronics',
  'Clothing',
  'Books',
  'Home & Garden',
  'Sports',
  'Beauty',
  'Toys',
  'Automotive',
  'Food & Beverages',
  'Health & Wellness'
] as const;

export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 10,
  PAGE_SIZE_OPTIONS: [5, 10, 25, 50, 100],
  MAX_PAGE_SIZE: 1000
} as const;

export const NOTIFICATION_DURATION = {
  SUCCESS: 3000,
  ERROR: 5000,
  WARNING: 4000,
  INFO: 3000
} as const;
