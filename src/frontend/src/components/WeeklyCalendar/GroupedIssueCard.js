// src/frontend/src/components/WeeklyCalendar/GroupedIssueCard.js
// ✅ UPDATED - Grup Parça Adeti sadece Freze tipinde gösteriliyor

import React from 'react';
import { getProjectColor, getLightColor } from '../../utils/colorUtils';

const GroupedIssueCard = ({ group, onClick, hasOverdue, hasRevised }) => {
  const projectColor = getProjectColor(group.projectId);
  const lightBgColor = getLightColor(projectColor, 0.15);

  const handleClick = () => {
    if (onClick) {
      onClick(group);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  };

  // ✅ YENİ: Sadece Freze tipinde grup parça adeti göster
  const shouldShowGroupQuantity = group.productionType === 'Freze' && 
                                   group.totalGroupPartQuantity !== null && 
                                   group.totalGroupPartQuantity > 0;

  return (
    <div
      className={`grouped-issue-card ${hasOverdue ? 'has-overdue' : ''} ${hasRevised ? 'has-revised' : ''}`}
      style={{
        borderLeftColor: hasOverdue ? '#dc3545' : projectColor,
        backgroundColor: hasOverdue ? getLightColor('#dc3545', 0.1) : lightBgColor
      }}
      onClick={handleClick}
      onKeyPress={handleKeyPress}
      role="button"
      tabIndex={0}
    >
      {/* Üst Satır: İş Tipi Badge ve İkonlar */}
      <div className="grouped-card-header">
        <span
          className="production-type-badge"
          style={{
            backgroundColor: hasOverdue ? '#dc3545' : projectColor,
            color: 'white'
          }}
        >
          {group.productionType}
        </span>
        
        {/* İkon Grubu */}
        <div className="card-indicators">
          {/* Gecikme İkonu */}
          {hasOverdue && (
            <div className="overdue-warning-icon blinking" title="Gecikmiş işler var">
              <i className="bi bi-exclamation-triangle-fill"></i>
            </div>
          )}
          
          {/* Revize İkonu */}
          {hasRevised && (
            <div className="revised-indicator blinking" title="Revize edilmiş işler var">
              <span className="revised-letter">R</span>
            </div>
          )}
        </div>
      </div>

      {/* Proje Kodu */}
      <div 
        className="project-code-text"
        style={{ 
          color: hasOverdue ? '#dc3545' : '#2c3e50',
          fontWeight: hasOverdue ? '700' : '600'
        }}
      >
        {group.projectCode || 'Kod Yok'}
      </div>

      {/* ✅ GÜNCELLENMIŞ: Grup Parça Adeti - Sadece Freze tipinde göster */}
      {shouldShowGroupQuantity && (
        <div className="group-part-quantity">
          <i className="bi bi-box-seam me-1"></i>
          <span className="quantity-label">Adet:</span>
          <span className="quantity-value">{group.totalGroupPartQuantity}</span>
        </div>
      )}
    </div>
  );
};

export default GroupedIssueCard;