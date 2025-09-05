// src/frontend/src/utils/alertUtils.js

/**
 * Assign object to a variable before exporting as module default - Bu sorunun çözümü
 * Her export default için önce bir değişkene atama yapıyoruz
 */

/**
 * Alert utilities for showing notifications and confirmations
 */

/**
 * Show success alert
 * @param {string} message - Alert message
 * @param {object} options - Additional options
 */
const showSuccess = (message, options = {}) => {
  showAlert(message, 'success', options);
};

/**
 * Show error alert
 * @param {string} message - Alert message
 * @param {object} options - Additional options
 */
const showError = (message, options = {}) => {
  showAlert(message, 'error', options);
};

/**
 * Show warning alert
 * @param {string} message - Alert message
 * @param {object} options - Additional options
 */
const showWarning = (message, options = {}) => {
  showAlert(message, 'warning', options);
};

/**
 * Show info alert
 * @param {string} message - Alert message
 * @param {object} options - Additional options
 */
const showInfo = (message, options = {}) => {
  showAlert(message, 'info', options);
};

/**
 * Main alert function
 * @param {string} message - Alert message
 * @param {string} type - Alert type (success, error, warning, info)
 * @param {object} options - Additional options
 */
const showAlert = (message, type = 'info', options = {}) => {
  const {
    duration = 4000,
    position = 'top-right',
    showCloseButton = true,
    autoClose = true
  } = options;

  // Check if we're in a browser environment
  if (typeof window === 'undefined') {
    console.log(`[${type.toUpperCase()}] ${message}`);
    return;
  }

  // Try to use an existing notification library if available
  if (window.Swal && typeof window.Swal.fire === 'function') {
    // SweetAlert2
    const iconMap = {
      success: 'success',
      error: 'error',
      warning: 'warning',
      info: 'info'
    };

    window.Swal.fire({
      icon: iconMap[type] || 'info',
      title: message,
      toast: true,
      position: position,
      showConfirmButton: !autoClose,
      timer: autoClose ? duration : undefined,
      timerProgressBar: autoClose
    });
    return;
  }

  // Try to use Bootstrap toast if available
  if (typeof window.bootstrap !== 'undefined' && window.bootstrap.Toast) {
    showBootstrapToast(message, type, options);
    return;
  }

  // Fallback to creating our own toast
  showCustomToast(message, type, options);
};

/**
 * Show Bootstrap toast
 */
const showBootstrapToast = (message, type, options) => {
  const { duration = 4000 } = options;
  
  // Create toast container if it doesn't exist
  let toastContainer = document.getElementById('toast-container');
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'toast-container';
    toastContainer.className = 'toast-container position-fixed top-0 end-0 p-3';
    toastContainer.style.zIndex = '9999';
    document.body.appendChild(toastContainer);
  }

  const toastId = 'toast-' + Date.now();
  const iconMap = {
    success: 'bi-check-circle-fill text-success',
    error: 'bi-x-circle-fill text-danger',
    warning: 'bi-exclamation-triangle-fill text-warning',
    info: 'bi-info-circle-fill text-primary'
  };

  const toastHTML = `
    <div id="${toastId}" class="toast" role="alert" aria-live="assertive" aria-atomic="true">
      <div class="toast-header">
        <i class="bi ${iconMap[type] || iconMap.info} me-2"></i>
        <strong class="me-auto">Bildirim</strong>
        <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
      </div>
      <div class="toast-body">
        ${message}
      </div>
    </div>
  `;

  toastContainer.insertAdjacentHTML('afterbegin', toastHTML);
  
  const toastElement = document.getElementById(toastId);
  const toast = new window.bootstrap.Toast(toastElement, {
    delay: duration
  });
  
  toast.show();

  // Remove toast element after it's hidden
  toastElement.addEventListener('hidden.bs.toast', () => {
    toastElement.remove();
  });
};

/**
 * Show custom toast (fallback)
 */
const showCustomToast = (message, type, options) => {
  const { duration = 4000, position = 'top-right' } = options;
  
  // Create toast container if it doesn't exist
  let toastContainer = document.getElementById('custom-toast-container');
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'custom-toast-container';
    toastContainer.style.cssText = `
      position: fixed;
      ${position.includes('top') ? 'top: 20px;' : 'bottom: 20px;'}
      ${position.includes('right') ? 'right: 20px;' : 'left: 20px;'}
      z-index: 9999;
      max-width: 350px;
    `;
    document.body.appendChild(toastContainer);
  }

  const toastId = 'custom-toast-' + Date.now();
  const colorMap = {
    success: '#28a745',
    error: '#dc3545',
    warning: '#ffc107',
    info: '#17a2b8'
  };

  const iconMap = {
    success: '✓',
    error: '✕',
    warning: '⚠',
    info: 'i'
  };

  const toastHTML = `
    <div id="${toastId}" style="
      background: white;
      border-left: 4px solid ${colorMap[type] || colorMap.info};
      border-radius: 4px;
      padding: 12px 16px;
      margin-bottom: 10px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      display: flex;
      align-items: center;
      animation: slideInRight 0.3s ease-out;
    ">
      <span style="
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 24px;
        height: 24px;
        border-radius: 50%;
        background: ${colorMap[type] || colorMap.info};
        color: white;
        font-weight: bold;
        margin-right: 12px;
        font-size: 14px;
      ">${iconMap[type] || iconMap.info}</span>
      <span style="flex: 1; color: #333; font-size: 14px;">${message}</span>
      <button onclick="this.parentElement.remove()" style="
        background: none;
        border: none;
        font-size: 18px;
        color: #999;
        cursor: pointer;
        margin-left: 8px;
        padding: 0;
        width: 20px;
        height: 20px;
      ">×</button>
    </div>
  `;

  // Add animation styles if not already added
  if (!document.getElementById('toast-animations')) {
    const style = document.createElement('style');
    style.id = 'toast-animations';
    style.textContent = `
      @keyframes slideInRight {
        from {
          transform: translateX(100%);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
    `;
    document.head.appendChild(style);
  }

  toastContainer.insertAdjacentHTML('afterbegin', toastHTML);
  
  const toastElement = document.getElementById(toastId);
  
  // Auto remove after duration
  if (duration > 0) {
    setTimeout(() => {
      if (toastElement && toastElement.parentNode) {
        toastElement.style.animation = 'slideInRight 0.3s ease-out reverse';
        setTimeout(() => toastElement.remove(), 300);
      }
    }, duration);
  }
};

/**
 * Show confirmation dialog
 * @param {string} message - Confirmation message
 * @param {string} title - Dialog title
 * @param {object} options - Additional options
 */
const showConfirm = (message, title = 'Onay', options = {}) => {
  return new Promise((resolve) => {
    const {
      confirmText = 'Evet',
      cancelText = 'İptal',
      confirmButtonClass = 'btn-danger',
      cancelButtonClass = 'btn-secondary'
    } = options;

    // Check if SweetAlert2 is available
    if (window.Swal && typeof window.Swal.fire === 'function') {
      window.Swal.fire({
        title: title,
        text: message,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: confirmText,
        cancelButtonText: cancelText,
        confirmButtonColor: '#dc3545',
        cancelButtonColor: '#6c757d',
        focusCancel: true
      }).then((result) => {
        resolve(result.isConfirmed);
      });
      return;
    }

    // Fallback to native confirm
    resolve(window.confirm(`${title}\n\n${message}`));
  });
};

// Create the utilities object FIRST, then export
const alertUtilities = {
  showAlert,
  showSuccess,
  showError,
  showWarning,
  showInfo,
  showConfirm
};

// Named exports
export { 
  showAlert, 
  showSuccess, 
  showError, 
  showWarning, 
  showInfo, 
  showConfirm 
};

// Default export - ESLint hatası için objesi önce değişkene atayıp sonra export ediyoruz
export default alertUtilities;