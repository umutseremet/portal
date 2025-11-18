// src/components/common/ToastNotification.js
import React, { useEffect } from 'react';
import './ToastNotification.css';

const ToastNotification = ({ 
  show, 
  message, 
  type = 'info', // success, error, warning, info
  duration = 3000,
  onClose 
}) => {
  useEffect(() => {
    if (show && duration > 0) {
      const timer = setTimeout(() => {
        onClose?.();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [show, duration, onClose]);

  if (!show) return null;

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <i className="bi bi-check-circle-fill"></i>;
      case 'error':
        return <i className="bi bi-x-circle-fill"></i>;
      case 'warning':
        return <i className="bi bi-exclamation-triangle-fill"></i>;
      case 'info':
      default:
        return <i className="bi bi-info-circle-fill"></i>;
    }
  };

  const getTypeClass = () => {
    switch (type) {
      case 'success':
        return 'toast-success';
      case 'error':
        return 'toast-error';
      case 'warning':
        return 'toast-warning';
      case 'info':
      default:
        return 'toast-info';
    }
  };

  return (
    <div className={`toast-notification ${getTypeClass()} ${show ? 'show' : ''}`}>
      <div className="toast-content">
        <div className="toast-icon">
          {getIcon()}
        </div>
        <div className="toast-message">
          {message}
        </div>
        <button 
          className="toast-close" 
          onClick={onClose}
          aria-label="Kapat"
        >
          <i className="bi bi-x"></i>
        </button>
      </div>
      <div className="toast-progress">
        <div 
          className="toast-progress-bar" 
          style={{ animationDuration: `${duration}ms` }}
        ></div>
      </div>
    </div>
  );
};

export default ToastNotification;