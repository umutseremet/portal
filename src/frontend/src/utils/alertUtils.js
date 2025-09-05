// src/frontend/src/utils/alertUtils.js
// React bileşenleri için alert/notification yardımcı fonksiyonları

import { NOTIFICATION_TYPES } from './constants';

/**
 * Alert container'ı kontrol et ve oluştur
 */
const ensureAlertContainer = () => {
  let container = document.getElementById('alertContainer');
  if (!container) {
    container = document.createElement('div');
    container.id = 'alertContainer';
    container.style.cssText = `
      position: fixed;
      top: 80px;
      left: 50%;
      transform: translateX(-50%);
      z-index: 1050;
      width: 90%;
      max-width: 500px;
      pointer-events: none;
    `;
    document.body.appendChild(container);
  }
  return container;
};

/**
 * Alert tipi için icon belirleme
 */
const getAlertIcon = (type) => {
  const icons = {
    success: 'bi-check-circle',
    error: 'bi-exclamation-triangle',
    danger: 'bi-exclamation-triangle',
    warning: 'bi-exclamation-circle',
    info: 'bi-info-circle',
    primary: 'bi-info-circle',
    secondary: 'bi-info-circle'
  };
  return icons[type] || 'bi-info-circle';
};

/**
 * Alert gösterme ana fonksiyonu
 */
const showAlert = (message, type = 'info', duration = 5000) => {
  const container = ensureAlertContainer();
  
  // Alert ID oluştur
  const alertId = 'alert-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);

  // Bootstrap alert class'ını belirle
  const alertClass = type === 'error' ? 'danger' : type;

  // Alert HTML'i oluştur
  const alertHTML = `
    <div 
      class="alert alert-${alertClass} alert-dismissible fade show mb-2" 
      role="alert" 
      id="${alertId}" 
      style="pointer-events: auto; box-shadow: 0 4px 12px rgba(0,0,0,0.15); opacity: 0; transform: translateY(-10px); transition: all 0.3s ease;"
    >
      <i class="${getAlertIcon(type)} me-2"></i>
      ${message}
      <button 
        type="button" 
        class="btn-close" 
        aria-label="Close"
        onclick="document.getElementById('${alertId}').remove()"
      ></button>
    </div>
  `;

  // Alert'i container'a ekle
  container.insertAdjacentHTML('beforeend', alertHTML);

  // Animation için timeout
  const alertElement = document.getElementById(alertId);
  if (alertElement) {
    // Fade in effect
    setTimeout(() => {
      alertElement.style.opacity = '1';
      alertElement.style.transform = 'translateY(0)';
    }, 10);

    // Otomatik kaldırma
    if (duration > 0) {
      setTimeout(() => {
        closeAlert(alertId);
      }, duration);
    }
  }

  return alertId;
};

/**
 * Alert kapatma fonksiyonu
 */
const closeAlert = (alertId) => {
  const alertElement = document.getElementById(alertId);
  if (alertElement) {
    // Fade out effect
    alertElement.style.opacity = '0';
    alertElement.style.transform = 'translateY(-10px)';
    
    setTimeout(() => {
      if (alertElement && alertElement.parentNode) {
        alertElement.parentNode.removeChild(alertElement);
      }
    }, 300);
  }
};

/**
 * Tüm alert'leri temizle
 */
const clearAllAlerts = () => {
  const container = document.getElementById('alertContainer');
  if (container) {
    const alerts = container.querySelectorAll('.alert');
    alerts.forEach(alert => {
      alert.style.opacity = '0';
      alert.style.transform = 'translateY(-10px)';
    });
    
    setTimeout(() => {
      container.innerHTML = '';
    }, 300);
  }
};

/**
 * Başarı mesajı göster
 */
export const showSuccess = (message, duration = 5000) => {
  return showAlert(message, NOTIFICATION_TYPES.SUCCESS, duration);
};

/**
 * Hata mesajı göster
 */
export const showError = (message, duration = 8000) => {
  return showAlert(message, NOTIFICATION_TYPES.ERROR, duration);
};

/**
 * Uyarı mesajı göster
 */
export const showWarning = (message, duration = 6000) => {
  return showAlert(message, NOTIFICATION_TYPES.WARNING, duration);
};

/**
 * Bilgi mesajı göster
 */
export const showInfo = (message, duration = 5000) => {
  return showAlert(message, NOTIFICATION_TYPES.INFO, duration);
};

/**
 * Custom toast notification (modern görünüm)
 */
export const showToast = (message, type = 'info', duration = 4000) => {
  const container = ensureAlertContainer();
  
  const toastId = 'toast-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
  
  const toastHTML = `
    <div 
      id="${toastId}"
      class="toast align-items-center text-white bg-${type === 'error' ? 'danger' : type} border-0 mb-2"
      role="alert" 
      aria-live="assertive" 
      aria-atomic="true"
      style="opacity: 0; transform: translateX(100%); transition: all 0.3s ease; pointer-events: auto;"
    >
      <div class="d-flex">
        <div class="toast-body d-flex align-items-center">
          <i class="${getAlertIcon(type)} me-2"></i>
          ${message}
        </div>
        <button 
          type="button" 
          class="btn-close btn-close-white me-2 m-auto" 
          aria-label="Close"
          onclick="document.getElementById('${toastId}').remove()"
        ></button>
      </div>
    </div>
  `;

  container.insertAdjacentHTML('beforeend', toastHTML);

  const toastElement = document.getElementById(toastId);
  if (toastElement) {
    // Slide in from right
    setTimeout(() => {
      toastElement.style.opacity = '1';
      toastElement.style.transform = 'translateX(0)';
    }, 10);

    // Auto remove
    if (duration > 0) {
      setTimeout(() => {
        if (toastElement && toastElement.parentNode) {
          toastElement.style.opacity = '0';
          toastElement.style.transform = 'translateX(100%)';
          setTimeout(() => {
            if (toastElement && toastElement.parentNode) {
              toastElement.remove();
            }
          }, 300);
        }
      }, duration);
    }
  }

  return toastId;
};

/**
 * Onay dialog'u göster
 */
export const showConfirm = (message, title = 'Onay', confirmText = 'Evet', cancelText = 'Hayır') => {
  return new Promise((resolve) => {
    const modalId = 'confirm-modal-' + Date.now();
    
    const modalHTML = `
      <div class="modal fade" id="${modalId}" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">
                <i class="bi bi-question-circle me-2 text-warning"></i>
                ${title}
              </h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
              <p class="mb-0">${message}</p>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                ${cancelText}
              </button>
              <button type="button" class="btn btn-danger" id="${modalId}-confirm">
                ${confirmText}
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);

    const modal = document.getElementById(modalId);
    const confirmBtn = document.getElementById(`${modalId}-confirm`);

    // Bootstrap modal'ı başlat
    const bsModal = new window.bootstrap.Modal(modal);
    bsModal.show();

    // Event listeners
    confirmBtn.addEventListener('click', () => {
      bsModal.hide();
      resolve(true);
    });

    modal.addEventListener('hidden.bs.modal', () => {
      modal.remove();
      resolve(false);
    });
  });
};

/**
 * Loading spinner göster
 */
export const showLoading = (message = 'Yükleniyor...') => {
  const loadingId = 'loading-' + Date.now();
  
  const loadingHTML = `
    <div class="modal fade" id="${loadingId}" tabindex="-1" data-bs-backdrop="static" data-bs-keyboard="false">
      <div class="modal-dialog modal-dialog-centered modal-sm">
        <div class="modal-content">
          <div class="modal-body text-center py-4">
            <div class="spinner-border text-primary mb-3" role="status">
              <span class="visually-hidden">Loading...</span>
            </div>
            <div>${message}</div>
          </div>
        </div>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', loadingHTML);
  
  const modal = document.getElementById(loadingId);
  const bsModal = new window.bootstrap.Modal(modal);
  bsModal.show();

  return {
    close: () => {
      bsModal.hide();
      setTimeout(() => modal.remove(), 300);
    },
    updateMessage: (newMessage) => {
      const messageEl = modal.querySelector('.modal-body div:last-child');
      if (messageEl) messageEl.textContent = newMessage;
    }
  };
};

/**
 * Progress bar ile loading göster
 */
export const showProgress = (message = 'İşleniyor...', initialProgress = 0) => {
  const progressId = 'progress-' + Date.now();
  
  const progressHTML = `
    <div class="modal fade" id="${progressId}" tabindex="-1" data-bs-backdrop="static" data-bs-keyboard="false">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-body py-4">
            <div class="text-center mb-3">${message}</div>
            <div class="progress mb-2" style="height: 8px;">
              <div 
                class="progress-bar progress-bar-striped progress-bar-animated" 
                role="progressbar" 
                style="width: ${initialProgress}%" 
                aria-valuenow="${initialProgress}" 
                aria-valuemin="0" 
                aria-valuemax="100"
              ></div>
            </div>
            <div class="text-center small text-muted">
              <span class="progress-text">${initialProgress}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', progressHTML);
  
  const modal = document.getElementById(progressId);
  const bsModal = new window.bootstrap.Modal(modal);
  bsModal.show();

  const progressBar = modal.querySelector('.progress-bar');
  const progressText = modal.querySelector('.progress-text');

  return {
    close: () => {
      bsModal.hide();
      setTimeout(() => modal.remove(), 300);
    },
    updateProgress: (percent, message) => {
      if (progressBar) {
        progressBar.style.width = `${percent}%`;
        progressBar.setAttribute('aria-valuenow', percent);
      }
      if (progressText) {
        progressText.textContent = `${percent}%`;
      }
      if (message) {
        const messageEl = modal.querySelector('.modal-body > div:first-child');
        if (messageEl) messageEl.textContent = message;
      }
    }
  };
};

// Ana export fonksiyonu
export { showAlert, closeAlert, clearAllAlerts };

// Default export
export default {
  show: showAlert,
  success: showSuccess,
  error: showError,
  warning: showWarning,
  info: showInfo,
  toast: showToast,
  confirm: showConfirm,
  loading: showLoading,
  progress: showProgress,
  close: closeAlert,
  clearAll: clearAllAlerts
};