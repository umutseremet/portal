// src/frontend/src/components/WeeklyCalendar/OverdueIssueCard.js
// YENİ DOSYA - Bu dosyayı oluşturun

import React from 'react';
import { getProjectColor, getLightColor } from '../../utils/colorUtils';

const OverdueIssueCard = ({ group, onClick, overdueCount }) => {
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

  return (
    <div
      className="grouped-issue-card overdue-card"
      style={{
        borderLeftColor: '#dc3545',
        backgroundColor: getLightColor('#dc3545', 0.1)
      }}
      onClick={handleClick}
      onKeyPress={handleKeyPress}
      role="button"
      tabIndex={0}
    >
      {/* Üst Satır: İş Tipi Badge ve Uyarı İkonu */}
      <div className="grouped-card-header">
        <span
          className="production-type-badge"
          style={{
            backgroundColor: '#dc3545',
            color: 'white'
          }}
        >
          {group.productionType}
        </span>
        
        {/* ✅ YANIP SÖNEN UYARI İKONU */}
        <div className="overdue-warning-icon blinking">
          <i className="bi bi-exclamation-triangle-fill"></i>
        </div>
      </div>

      {/* Proje Kodu */}
      <div className="project-code-text" style={{ color: '#dc3545', fontWeight: '700' }}>
        {group.projectCode || 'Kod Yok'}
      </div>

      {/* Gecikme Bilgisi */}
      {overdueCount && (
        <div className="overdue-info">
          <small style={{ color: '#dc3545', fontSize: '0.65rem', fontWeight: '600' }}>
            <i className="bi bi-clock-history me-1"></i>
            {overdueCount} geciken iş
          </small>
        </div>
      )}
    </div>
  );
};

export default OverdueIssueCard;