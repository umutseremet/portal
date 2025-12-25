// src/utils/constants.js
// Tüm sabit değerler environment variables'dan okunur

// ==============================================
// APP INFORMATION
// ==============================================
export const APP_NAME = process.env.REACT_APP_NAME || 'Aslan Group Portal';
export const APP_VERSION = process.env.REACT_APP_VERSION || '1.0.0';
export const APP_DESCRIPTION = process.env.REACT_APP_DESCRIPTION || 'Modern Üretim Yönetim Portalı';

// ==============================================
// COMPANY INFORMATION
// ==============================================
export const COMPANY_NAME = process.env.REACT_APP_COMPANY_NAME || 'Aslan';
export const COMPANY_EMAIL = process.env.REACT_APP_COMPANY_EMAIL || 'admin@aslangrouptr.com';
export const SUPPORT_EMAIL = process.env.REACT_APP_SUPPORT_EMAIL || 'support@aslangrouptr.com';

// ==============================================
// API CONFIGURATION
// ==============================================
export const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5154/api';
export const API_TIMEOUT = parseInt(process.env.REACT_APP_API_TIMEOUT) || 10000; // 10 seconds

// ==============================================
// REDMINE CONFIGURATION
// ==============================================
export const REDMINE_BASE_URL = process.env.REACT_APP_REDMINE_BASE_URL || 'http://192.168.1.17:9292';

// ==============================================
// AUTH CONSTANTS
// ==============================================
export const AUTH_TOKEN_KEY = 'authToken';
export const USER_DATA_KEY = 'user';
export const REFRESH_TOKEN_KEY = 'refreshToken';

// Session & Token timeouts
export const SESSION_TIMEOUT = parseInt(process.env.REACT_APP_SESSION_TIMEOUT) || 60; // minutes
export const TOKEN_REFRESH_TIME = parseInt(process.env.REACT_APP_TOKEN_REFRESH_TIME) || 50; // minutes

// ==============================================
// ROUTES
// ==============================================
export const ROUTES = {
  LOGIN: '/login',
  DASHBOARD: '/dashboard',
  PRODUCTION: '/production',
  WEEKLY_CALENDAR: '/production/weekly-calendar',
  BOM_TRANSFER: '/production/bom-transfer',
  DATA_CAM: '/production/data-cam',
  DEFINITIONS: '/definitions',
  ITEMS: '/definitions/items',
  ITEM_GROUPS: '/definitions/item-groups',
  VEHICLES: '/vehicles',
  VISITORS: '/visitors',
  PROFILE: '/profile',
  SETTINGS: '/settings'
};

// ==============================================
// LOCAL STORAGE KEYS
// ==============================================
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'authToken',
  USER_DATA: 'user',
  THEME: process.env.REACT_APP_DEFAULT_THEME || 'light',
  SIDEBAR_STATE: process.env.REACT_APP_DEFAULT_SIDEBAR_STATE || 'open',
  LANGUAGE: process.env.REACT_APP_DEFAULT_LANGUAGE || 'tr'
};

// ==============================================
// API ENDPOINTS
// ==============================================
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/Auth/login',
    REGISTER: '/Auth/register',
    LOGOUT: '/Auth/logout',
    REFRESH_TOKEN: '/Auth/refresh-token',
    VERIFY_TOKEN: '/Auth/verify',
    FORGOT_PASSWORD: '/Auth/forgot-password',
    RESET_PASSWORD: '/Auth/reset-password',
    CHANGE_PASSWORD: '/Auth/change-password'
  },
  USER: {
    PROFILE: '/user/profile',
    UPDATE_PROFILE: '/user/profile'
  },
  DASHBOARD: {
    STATS: '/dashboard/stats',
    EVENTS: '/dashboard/events'
  },
  PRODUCTION: {
    ORDERS: '/production/orders',
    ORDER_BY_ID: '/production/orders'
  },
  WEEKLY_CALENDAR: {
    GET_CALENDAR: '/RedmineWeeklyCalendar/GetWeeklyProductionCalendar',
    GET_ISSUES: '/RedmineWeeklyCalendar/GetIssuesByDateAndType',
    UPDATE_DATES: '/RedmineWeeklyCalendar/UpdateIssueDates'
  },
  REDMINE: {
    PROJECTS: '/Redmine/projects',
    TIME_ENTRIES: '/TimeEntries/list'
  },
  ITEMS: {
    LIST: '/Items',
    GET: '/Items',
    CREATE: '/Items',
    UPDATE: '/Items',
    DELETE: '/Items'
  },
  ITEM_GROUPS: {
    LIST: '/ItemGroups',
    GET: '/ItemGroups',
    CREATE: '/ItemGroups',
    UPDATE: '/ItemGroups',
    DELETE: '/ItemGroups'
  },
  VEHICLES: {
    LIST: '/Vehicles',
    GET: '/Vehicles',
    CREATE: '/Vehicles',
    UPDATE: '/Vehicles',
    DELETE: '/Vehicles'
  },
  VISITORS: {
    LIST: '/Visitors',
    GET: '/Visitors',
    CREATE: '/Visitors',
    UPDATE: '/Visitors',
    DELETE: '/Visitors'
  },
  PERMISSIONS: {
    MANAGEMENT: '/Permissions/management',
    USERS: '/Permissions/users',
    GROUPS: '/Permissions/groups',
    CUSTOM_FIELDS: '/Permissions/custom-fields',
    UPDATE_USER: '/Permissions/users', // /{userId}/permissions ile kullanılacak
    UPDATE_GROUP: '/Permissions/groups', // /{groupId}/permissions ile kullanılacak
    USER_LOGIN_PERMISSIONS: '/Permissions/user-login-permissions'
  },
  // ========================================
  // PURCHASE MANAGEMENT - YENİ
  // ========================================
  PURCHASE_REQUESTS: {
    LIST: '/PurchaseRequests',
    GET: '/PurchaseRequests', // /{id}
    CREATE: '/PurchaseRequests',
    UPDATE: '/PurchaseRequests', // /{id}
    DELETE: '/PurchaseRequests', // /{id}
    SUBMIT: '/PurchaseRequests', // /{id}/submit
    APPROVE: '/PurchaseRequests', // /{id}/approve
    REJECT: '/PurchaseRequests', // /{id}/reject
    CANCEL: '/PurchaseRequests', // /{id}/cancel
    STATS: '/PurchaseRequests/stats',
    MY_REQUESTS: '/PurchaseRequests/my-requests',
    PENDING_MY_APPROVAL: '/PurchaseRequests/pending-my-approval'
  },
  PURCHASE_ORDERS: {
    LIST: '/PurchaseOrders',
    GET: '/PurchaseOrders', // /{id}
    CREATE: '/PurchaseOrders',
    CREATE_FROM_REQUEST: '/PurchaseOrders/create-from-requests',
    UPDATE: '/PurchaseOrders', // /{id}
    DELETE: '/PurchaseOrders', // /{id}
    SUBMIT: '/PurchaseOrders', // /{id}/submit
    APPROVE: '/PurchaseOrders', // /{id}/approve
    CONFIRM: '/PurchaseOrders', // /{id}/confirm
    CANCEL: '/PurchaseOrders', // /{id}/cancel
    UPDATE_DELIVERY: '/PurchaseOrders', // /{id}/update-delivery
    STATS: '/PurchaseOrders/stats'
  }
};

// ==============================================
// THEME COLORS (Acara Theme)
// ==============================================
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

// ==============================================
// STATUS TYPES
// ==============================================
export const ORDER_STATUS = {
  PENDING: 'pending',
  ACTIVE: 'active',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  PREPARING: 'preparing'
};

export const ISSUE_STATUS = {
  OPEN: 'open',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CLOSED: 'closed',
  CANCELLED: 'cancelled'
};

// ==============================================
// PRIORITY LEVELS
// ==============================================
export const PRIORITY_LEVELS = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  URGENT: 'urgent'
};

// ==============================================
// USER ROLES
// ==============================================
export const USER_ROLES = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  OPERATOR: 'operator',
  VIEWER: 'viewer'
};

// ==============================================
// PAGINATION
// ==============================================
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: parseInt(process.env.REACT_APP_DEFAULT_PAGE_SIZE) || 10,
  MAX_PAGE_SIZE: parseInt(process.env.REACT_APP_MAX_PAGE_SIZE) || 100,
  PAGE_SIZE_OPTIONS: [5, 10, 20, 50, 100]
};

// ==============================================
// DATE FORMATS
// ==============================================
export const DATE_FORMATS = {
  DISPLAY: 'DD/MM/YYYY',
  DISPLAY_WITH_TIME: 'DD/MM/YYYY HH:mm',
  API: 'YYYY-MM-DD',
  API_WITH_TIME: 'YYYY-MM-DD HH:mm:ss'
};

// ==============================================
// CHART COLORS
// ==============================================
export const CHART_COLORS = [
  '#FF6B6B', '#FF8E53', '#4ECDC4', '#45B7D1', 
  '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8'
];

// ==============================================
// AVATAR COLORS
// ==============================================
export const AVATAR_COLORS = [
  'bg-primary', 'bg-success', 'bg-info', 
  'bg-warning', 'bg-danger', 'bg-secondary'
];

// ==============================================
// NOTIFICATION TYPES
// ==============================================
export const NOTIFICATION_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info'
};

// ==============================================
// FILE UPLOAD
// ==============================================
export const FILE_UPLOAD = {
  MAX_SIZE: parseInt(process.env.REACT_APP_MAX_FILE_SIZE) || 5 * 1024 * 1024, // 5MB default
  ALLOWED_TYPES: process.env.REACT_APP_ALLOWED_FILE_TYPES?.split(',') || [
    'image/jpeg', 
    'image/png', 
    'image/gif', 
    'application/pdf'
  ],
  ALLOWED_EXTENSIONS: ['.jpg', '.jpeg', '.png', '.gif', '.pdf', '.xlsx', '.xls', '.csv']
};

// ==============================================
// BREAKPOINTS (Bootstrap compatible)
// ==============================================
export const BREAKPOINTS = {
  XS: 0,
  SM: 576,
  MD: 768,
  LG: 992,
  XL: 1200,
  XXL: 1400
};

// ==============================================
// ANIMATION DURATIONS (in milliseconds)
// ==============================================
export const ANIMATION_DURATION = {
  FAST: 200,
  NORMAL: 300,
  SLOW: 500
};

// ==============================================
// HTTP STATUS CODES
// ==============================================
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503
};

// ==============================================
// DEFAULT MESSAGES
// ==============================================
export const MESSAGES = {
  LOADING: 'Yükleniyor...',
  NO_DATA: 'Veri bulunamadı',
  ERROR_GENERIC: 'Bir hata oluştu',
  SUCCESS_SAVE: 'Başarıyla kaydedildi',
  SUCCESS_DELETE: 'Başarıyla silindi',
  SUCCESS_UPDATE: 'Başarıyla güncellendi',
  CONFIRM_DELETE: 'Bu işlemi silmek istediğinizden emin misiniz?',
  NETWORK_ERROR: 'Ağ bağlantısı hatası',
  AUTH_ERROR: 'Kimlik doğrulama hatası',
  TOKEN_EXPIRED: 'Oturum süreniz dolmuş, lütfen tekrar giriş yapın',
  LOGIN_SUCCESS: 'Başarıyla giriş yapıldı',
  LOGOUT_SUCCESS: 'Başarıyla çıkış yapıldı'
};

// ==============================================
// ENVIRONMENT
// ==============================================
export const ENV = {
  DEVELOPMENT: 'development',
  PRODUCTION: 'production',
  TEST: 'test',
  CURRENT: process.env.NODE_ENV || 'development'
};

// ==============================================
// FEATURE FLAGS
// ==============================================
export const FEATURE_FLAGS = {
  DEBUG_MODE: process.env.REACT_APP_DEBUG_MODE === 'true',
  SHOW_DEV_TOOLS: process.env.REACT_APP_SHOW_DEV_TOOLS === 'true',
  ENABLE_PERFORMANCE_MONITORING: process.env.REACT_APP_ENABLE_PERFORMANCE_MONITORING === 'true'
};

// ==============================================
// API REQUEST TYPES
// ==============================================
export const REQUEST_TYPES = {
  GET: 'GET',
  POST: 'POST',
  PUT: 'PUT',
  DELETE: 'DELETE',
  PATCH: 'PATCH'
};

// ==============================================
// PRODUCTION TYPES (Weekly Calendar)
// ==============================================
export const PRODUCTION_TYPES = {
  LASER: 'Lazer',
  BENDING: 'Abkant',
  WELDING: 'Kaynak',
  PAINTING: 'Boya',
  MILLING: 'Freze',
  COATING: 'Kaplama',
  DRILLING: 'Delik',
  TURNING: 'Torna',
  DATA_PREP: 'Data Hazırlama',
  ASSEMBLY: 'Montaj'
};

// ========================================
// STATUS CONSTANTS - PURCHASE MANAGEMENT
// ========================================
export const PURCHASE_REQUEST_STATUS = {
  DRAFT: 'Draft',
  SUBMITTED: 'Submitted',
  MANAGER_APPROVAL: 'ManagerApproval',
  PURCHASING_REVIEW: 'PurchasingReview',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  CANCELLED: 'Cancelled',
  COMPLETED: 'Completed'
};

export const PURCHASE_REQUEST_STATUS_LABELS = {
  [PURCHASE_REQUEST_STATUS.DRAFT]: 'Taslak',
  [PURCHASE_REQUEST_STATUS.SUBMITTED]: 'Onaya Gönderildi',
  [PURCHASE_REQUEST_STATUS.MANAGER_APPROVAL]: 'Yönetici Onayladı',
  [PURCHASE_REQUEST_STATUS.PURCHASING_REVIEW]: 'Satınalma Sürecinde',
  [PURCHASE_REQUEST_STATUS.APPROVED]: 'Satınalma Onaylandı',
  [PURCHASE_REQUEST_STATUS.REJECTED]: 'Satınalma Reddedildi',
  [PURCHASE_REQUEST_STATUS.CANCELLED]: 'İptal Edildi',
  [PURCHASE_REQUEST_STATUS.COMPLETED]: 'Satınalma Tamamlandı'
};

export const PURCHASE_REQUEST_STATUS_COLORS = {
  [PURCHASE_REQUEST_STATUS.DRAFT]: 'secondary',
  [PURCHASE_REQUEST_STATUS.SUBMITTED]: 'info',
  [PURCHASE_REQUEST_STATUS.MANAGER_APPROVAL]: 'warning',
  [PURCHASE_REQUEST_STATUS.PURCHASING_REVIEW]: 'warning',
  [PURCHASE_REQUEST_STATUS.APPROVED]: 'success',
  [PURCHASE_REQUEST_STATUS.REJECTED]: 'danger',
  [PURCHASE_REQUEST_STATUS.CANCELLED]: 'dark',
  [PURCHASE_REQUEST_STATUS.COMPLETED]: 'primary'
};

export const PURCHASE_ORDER_STATUS = {
  DRAFT: 'Draft',
  SUBMITTED: 'Submitted',
  SUPPLIER_APPROVAL: 'SupplierApproval',
  CONFIRMED: 'Confirmed',
  PARTIAL_DELIVERED: 'PartialDelivered',
  DELIVERED: 'Delivered',
  INVOICED: 'Invoiced',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled'
};

export const PURCHASE_ORDER_STATUS_LABELS = {
  [PURCHASE_ORDER_STATUS.DRAFT]: 'Taslak',
  [PURCHASE_ORDER_STATUS.SUBMITTED]: 'Tedarikçiye Gönderildi',
  [PURCHASE_ORDER_STATUS.SUPPLIER_APPROVAL]: 'Tedarikçi Onayı Bekleniyor',
  [PURCHASE_ORDER_STATUS.CONFIRMED]: 'Onaylandı',
  [PURCHASE_ORDER_STATUS.PARTIAL_DELIVERED]: 'Kısmi Teslimat',
  [PURCHASE_ORDER_STATUS.DELIVERED]: 'Teslim Edildi',
  [PURCHASE_ORDER_STATUS.INVOICED]: 'Faturalandı',
  [PURCHASE_ORDER_STATUS.COMPLETED]: 'Tamamlandı',
  [PURCHASE_ORDER_STATUS.CANCELLED]: 'İptal Edildi'
};

export const PURCHASE_ORDER_STATUS_COLORS = {
  [PURCHASE_ORDER_STATUS.DRAFT]: 'secondary',
  [PURCHASE_ORDER_STATUS.SUBMITTED]: 'info',
  [PURCHASE_ORDER_STATUS.SUPPLIER_APPROVAL]: 'warning',
  [PURCHASE_ORDER_STATUS.CONFIRMED]: 'success',
  [PURCHASE_ORDER_STATUS.PARTIAL_DELIVERED]: 'primary',
  [PURCHASE_ORDER_STATUS.DELIVERED]: 'success',
  [PURCHASE_ORDER_STATUS.INVOICED]: 'primary',
  [PURCHASE_ORDER_STATUS.COMPLETED]: 'success',
  [PURCHASE_ORDER_STATUS.CANCELLED]: 'dark'
};

export const REQUEST_PRIORITY = {
  NORMAL: 'Normal',
  URGENT: 'Urgent',
  CRITICAL: 'Critical'
};

export const REQUEST_PRIORITY_LABELS = {
  [REQUEST_PRIORITY.NORMAL]: 'Normal',
  [REQUEST_PRIORITY.URGENT]: 'Acil',
  [REQUEST_PRIORITY.CRITICAL]: 'Kritik'
};

export const REQUEST_PRIORITY_COLORS = {
  [REQUEST_PRIORITY.NORMAL]: 'secondary',
  [REQUEST_PRIORITY.URGENT]: 'warning',
  [REQUEST_PRIORITY.CRITICAL]: 'danger'
};

export const REQUEST_TYPE = {
  STANDARD: 'Standard',
  EMERGENCY: 'Emergency',
  PROJECT: 'Project'
};

export const REQUEST_TYPE_LABELS = {
  [REQUEST_TYPE.STANDARD]: 'Standart',
  [REQUEST_TYPE.EMERGENCY]: 'Acil',
  [REQUEST_TYPE.PROJECT]: 'Proje Bazlı'
};