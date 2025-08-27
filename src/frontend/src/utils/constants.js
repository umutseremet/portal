// App Constants
export const APP_NAME = 'Acara Admin Panel';
export const APP_VERSION = '1.0.0';
export const APP_DESCRIPTION = 'Modern Admin Panel with React & Bootstrap';

// API Constants
export const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001/api';
export const API_TIMEOUT = 10000; // 10 seconds

// Auth Constants
export const AUTH_TOKEN_KEY = 'authToken';
export const USER_DATA_KEY = 'user';
export const REFRESH_TOKEN_KEY = 'refreshToken';

// Routes
export const ROUTES = {
  LOGIN: '/login',
  DASHBOARD: '/dashboard',
  PRODUCTION: '/production',
  PROFILE: '/profile',
  SETTINGS: '/settings'
};

// Local Storage Keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'authToken',
  USER_DATA: 'user',
  THEME: 'theme',
  SIDEBAR_STATE: 'sidebarState',
  LANGUAGE: 'language'
};

// Theme Colors (Acara Theme)
export const THEME_COLORS = {
  primary: '#FF6B6B',
  secondary: '#FF8E53',
  success: '#28a745',
  danger: '#dc3545',
  warning: '#ffc107',
  info: '#17a2b8',
  light: '#f8f9fa',
  dark: '#2C3E50',
  white: '#ffffff',
  muted: '#6c757d'
};

// Status Types
export const ORDER_STATUS = {
  PENDING: 'pending',
  ACTIVE: 'active',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  PREPARING: 'preparing'
};

// Priority Levels
export const PRIORITY_LEVELS = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  URGENT: 'urgent'
};

// User Roles
export const USER_ROLES = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  OPERATOR: 'operator',
  VIEWER: 'viewer'
};

// Pagination
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 10,
  PAGE_SIZE_OPTIONS: [5, 10, 20, 50, 100]
};

// Date Formats
export const DATE_FORMATS = {
  DISPLAY: 'DD/MM/YYYY',
  DISPLAY_WITH_TIME: 'DD/MM/YYYY HH:mm',
  API: 'YYYY-MM-DD',
  API_WITH_TIME: 'YYYY-MM-DD HH:mm:ss'
};

// Chart Colors
export const CHART_COLORS = [
  '#FF6B6B', '#FF8E53', '#4ECDC4', '#45B7D1', 
  '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8'
];

// Default Avatar Colors
export const AVATAR_COLORS = [
  'bg-primary', 'bg-success', 'bg-info', 
  'bg-warning', 'bg-danger', 'bg-secondary'
];

// Notification Types
export const NOTIFICATION_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info'
};

// File Upload
export const FILE_UPLOAD = {
  MAX_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'],
  ALLOWED_EXTENSIONS: ['.jpg', '.jpeg', '.png', '.gif', '.pdf']
};

// Breakpoints (Bootstrap compatible)
export const BREAKPOINTS = {
  XS: 0,
  SM: 576,
  MD: 768,
  LG: 992,
  XL: 1200,
  XXL: 1400
};

// Animation Durations (in milliseconds)
export const ANIMATION_DURATION = {
  FAST: 200,
  NORMAL: 300,
  SLOW: 500
};

// Default Messages
export const MESSAGES = {
  LOADING: 'Yükleniyor...',
  NO_DATA: 'Veri bulunamadı',
  ERROR_GENERIC: 'Bir hata oluştu',
  SUCCESS_SAVE: 'Başarıyla kaydedildi',
  SUCCESS_DELETE: 'Başarıyla silindi',
  SUCCESS_UPDATE: 'Başarıyla güncellendi',
  CONFIRM_DELETE: 'Bu işlemi silmek istediğinizden emin misiniz?',
  NETWORK_ERROR: 'Ağ bağlantısı hatası'
};