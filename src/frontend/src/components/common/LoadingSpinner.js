// src/frontend/src/components/common/LoadingSpinner.js

import React from 'react';

const LoadingSpinner = ({ 
  size = 'md', 
  color = 'primary', 
  text = '', 
  centered = true,
  fullScreen = false 
}) => {
  const getSizeClass = () => {
    switch (size) {
      case 'sm': return 'spinner-border-sm';
      case 'lg': return 'spinner-border-lg';
      default: return '';
    }
  };

  const getColorClass = () => {
    return `text-${color}`;
  };

  const spinner = (
    <div className={`spinner-border ${getSizeClass()} ${getColorClass()}`} role="status">
      <span className="visually-hidden">Loading...</span>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="loading-overlay">
        <div className="loading-content">
          {spinner}
          {text && <div className="loading-text mt-2">{text}</div>}
        </div>
      </div>
    );
  }

  if (centered) {
    return (
      <div className="text-center py-4">
        {spinner}
        {text && <div className="mt-2 text-muted">{text}</div>}
      </div>
    );
  }

  return (
    <div className="d-inline-flex align-items-center">
      {spinner}
      {text && <span className="ms-2">{text}</span>}
    </div>
  );
};

export default LoadingSpinner;