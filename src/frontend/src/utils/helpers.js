// src/frontend/src/utils/helpers.js

/**
 * Date formatting utilities
 */
export const formatDate = (dateString, format = 'tr-TR') => {
  if (!dateString) return '';
  
  try {
    const date = new Date(dateString);
    
    if (format === 'input') {
      // YYYY-MM-DD format for input fields
      return date.toISOString().split('T')[0];
    }
    
    // Default Turkish format
    return date.toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  } catch (error) {
    console.error('Date formatting error:', error);
    return dateString;
  }
};

/**
 * Format date with time
 */
export const formatDateTime = (dateString) => {
  if (!dateString) return '';
  
  try {
    const date = new Date(dateString);
    return date.toLocaleString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    console.error('DateTime formatting error:', error);
    return dateString;
  }
};

/**
 * Get relative date string
 */
export const getRelativeDate = (dateString) => {
  if (!dateString) return '';
  
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Bugün';
    if (diffDays === 1) return date < now ? 'Dün' : 'Yarın';
    if (diffDays < 7) return date < now ? `${diffDays} gün önce` : `${diffDays} gün sonra`;
    if (diffDays < 30) {
      const weeks = Math.ceil(diffDays / 7);
      return date < now ? `${weeks} hafta önce` : `${weeks} hafta sonra`;
    }
    
    const months = Math.ceil(diffDays / 30);
    return date < now ? `${months} ay önce` : `${months} ay sonra`;
  } catch (error) {
    console.error('Relative date calculation error:', error);
    return '';
  }
};

/**
 * Status badge helper
 */
export const getStatusBadge = (status) => {
  const statusMap = {
    'active': { class: 'bg-success', text: 'Aktif' },
    'inactive': { class: 'bg-secondary', text: 'Pasif' },
    'pending': { class: 'bg-warning', text: 'Bekliyor' },
    'completed': { class: 'bg-info', text: 'Tamamlandı' },
    'cancelled': { class: 'bg-danger', text: 'İptal' }
  };
  
  const statusInfo = statusMap[status] || { class: 'bg-secondary', text: status };
  
  return (
    <span className={`badge ${statusInfo.class}`}>
      {statusInfo.text}
    </span>
  );
};

/**
 * Visit status based on date
 */
export const getVisitStatus = (dateString) => {
  if (!dateString) return { text: 'Bilinmiyor', class: 'bg-secondary' };
  
  try {
    const visitDate = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    visitDate.setHours(0, 0, 0, 0);

    if (visitDate.getTime() === today.getTime()) {
      return { text: 'Bugün', class: 'bg-success' };
    } else if (visitDate > today) {
      return { text: 'Gelecek', class: 'bg-info' };
    } else {
      const diffTime = Math.abs(today - visitDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 1) {
        return { text: 'Dün', class: 'bg-warning' };
      } else if (diffDays <= 7) {
        return { text: `${diffDays} gün önce`, class: 'bg-secondary' };
      } else if (diffDays <= 30) {
        const weeks = Math.ceil(diffDays / 7);
        return { text: `${weeks} hafta önce`, class: 'bg-light text-dark' };
      } else {
        return { text: 'Geçmiş', class: 'bg-light text-dark' };
      }
    }
  } catch (error) {
    return { text: 'Bilinmiyor', class: 'bg-secondary' };
  }
};

/**
 * Debounce utility
 */
export const debounce = (func, wait, immediate = false) => {
  let timeout;
  
  return function executedFunction(...args) {
    const later = () => {
      timeout = null;
      if (!immediate) func(...args);
    };
    
    const callNow = immediate && !timeout;
    
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    
    if (callNow) func(...args);
  };
};

/**
 * Throttle utility
 */
export const throttle = (func, wait) => {
  let inThrottle;
  
  return function executedFunction(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, wait);
    }
  };
};

/**
 * Format number with thousands separator
 */
export const formatNumber = (number, locale = 'tr-TR') => {
  if (typeof number !== 'number') return number;
  
  try {
    return new Intl.NumberFormat(locale).format(number);
  } catch (error) {
    console.error('Number formatting error:', error);
    return number.toString();
  }
};

/**
 * Format currency
 */
export const formatCurrency = (amount, currency = 'TRY', locale = 'tr-TR') => {
  if (typeof amount !== 'number') return amount;
  
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2
    }).format(amount);
  } catch (error) {
    console.error('Currency formatting error:', error);
    return `${amount} ${currency}`;
  }
};

/**
 * Truncate text
 */
export const truncateText = (text, maxLength = 50) => {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

/**
 * Validate email
 */
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate phone number (Turkish)
 */
export const isValidPhone = (phone) => {
  const phoneRegex = /^(\+90|0)?[5]\d{9}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
};

/**
 * Format phone number
 */
export const formatPhone = (phone) => {
  if (!phone) return '';
  
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '');
  
  // Turkish mobile format
  if (digits.length === 11 && digits.startsWith('0')) {
    return `${digits.substring(0, 4)} ${digits.substring(4, 7)} ${digits.substring(7, 9)} ${digits.substring(9, 11)}`;
  }
  
  return phone;
};

/**
 * Generate initials from name
 */
export const getInitials = (name) => {
  if (!name) return '?';
  
  return name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .substring(0, 2);
};

/**
 * Generate random color for avatars
 */
export const getRandomColor = (seed) => {
  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57',
    '#FF9FF3', '#54A0FF', '#5F27CD', '#00D2D3', '#FF9F43',
    '#FC427B', '#BDC3C7', '#6C5CE7', '#74B9FF', '#00CEC9'
  ];
  
  if (seed) {
    // Generate consistent color based on seed
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      hash = seed.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  }
  
  return colors[Math.floor(Math.random() * colors.length)];
};

/**
 * Deep clone object
 */
export const deepClone = (obj) => {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj);
  if (obj instanceof Array) return obj.map(item => deepClone(item));
  if (typeof obj === 'object') {
    const cloned = {};
    Object.keys(obj).forEach(key => {
      cloned[key] = deepClone(obj[key]);
    });
    return cloned;
  }
};

/**
 * Check if object is empty
 */
export const isEmpty = (obj) => {
  if (obj === null || obj === undefined) return true;
  if (Array.isArray(obj)) return obj.length === 0;
  if (typeof obj === 'object') return Object.keys(obj).length === 0;
  if (typeof obj === 'string') return obj.trim().length === 0;
  return false;
};

/**
 * Calculate duration between two times
 */
export const calculateDuration = (startTime, endTime) => {
  if (!startTime || !endTime) return '';
  
  try {
    const start = new Date(`2000-01-01T${startTime}`);
    const end = new Date(`2000-01-01T${endTime}`);
    
    if (end <= start) return '';
    
    const diffMs = end - start;
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0 && minutes > 0) {
      return `${hours}s ${minutes}dk`;
    } else if (hours > 0) {
      return `${hours} saat`;
    } else {
      return `${minutes} dakika`;
    }
  } catch (error) {
    console.error('Duration calculation error:', error);
    return '';
  }
};

/**
 * Format time for display
 */
export const formatTime = (timeStr) => {
  if (!timeStr) return '';
  try {
    return timeStr.substring(0, 5); // HH:MM format
  } catch (error) {
    return timeStr;
  }
};

/**
 * Local storage utilities
 */
export const storage = {
  get: (key, defaultValue = null) => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error('Storage get error:', error);
      return defaultValue;
    }
  },
  
  set: (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error('Storage set error:', error);
      return false;
    }
  },
  
  remove: (key) => {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error('Storage remove error:', error);
      return false;
    }
  }
};