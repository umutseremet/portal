// src/frontend/src/components/common/ErrorMessage.js

import React from 'react';

const ErrorMessage = ({ 
  message, 
  title = 'Hata',
  type = 'danger',
  dismissible = true,
  onClose,
  showIcon = true,
  className = ''
}) => {
  if (!message) return null;

  const getIcon = () => {
    switch (type) {
      case 'warning':
        return 'bi-exclamation-triangle-fill';
      case 'info':
        return 'bi-info-circle-fill';
      case 'success':
        return 'bi-check-circle-fill';
      default:
        return 'bi-exclamation-circle-fill';
    }
  };

  const handleClose = () => {
    if (onClose) {
      onClose();
    }
  };

  return (
    <div className={`alert alert-${type} ${dismissible ? 'alert-dismissible' : ''} ${className}`} role="alert">
      <div className="d-flex align-items-center">
        {showIcon && (
          <i className={`bi ${getIcon()} me-2`}></i>
        )}
        <div className="flex-grow-1">
          {title && title !== message && (
            <h6 className="alert-heading mb-1">{title}</h6>
          )}
          <div className="mb-0">
            {typeof message === 'string' ? message : JSON.stringify(message)}
          </div>
        </div>
        {dismissible && (
          <button 
            type="button" 
            className="btn-close" 
            aria-label="Close"
            onClick={handleClose}
          ></button>
        )}
      </div>
    </div>
  );
};

export default ErrorMessage;