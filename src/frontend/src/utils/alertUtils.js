// src/utils/alertUtils.js
export const showAlert = (message, type = 'info') => {
  console.log(`[${type.toUpperCase()}] ${message}`);
  if (typeof window !== 'undefined') {
    alert(message);
  }
};

export const showSuccess = (message) => showAlert(message, 'success');
export const showError = (message) => showAlert(message, 'error');
export const showWarning = (message) => showAlert(message, 'warning');
export const showInfo = (message) => showAlert(message, 'info');

export default { showAlert, showSuccess, showError, showWarning, showInfo };