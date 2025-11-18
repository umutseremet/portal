// src/frontend/src/components/WeeklyCalendar/GroupedIssueCard.js
// MEVCUT DOSYANIZI TAMAMEN BU KODLA DEĞİŞTİRİN

import React from 'react';
import { getProjectColor, getLightColor } from '../../utils/colorUtils';

const GroupedIssueCard = ({ group, onClick, hasOverdue }) => {
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
      className={`grouped-issue-card ${hasOverdue ? 'has-overdue' : ''}`}
      style={{
        borderLeftColor: hasOverdue ? '#dc3545' : projectColor,
        backgroundColor: hasOverdue ? getLightColor('#dc3545', 0.1) : lightBgColor
      }}
      onClick={handleClick}
      onKeyPress={handleKeyPress}
      role="button"
      tabIndex={0}
    >
      {/* Üst Satır: İş Tipi Badge ve Ünlem İkonu */}
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
        
        {/* ✅ YANIP SÖNEN ÜNLEM İKONU - Sadece gecikme varsa göster */}
        {hasOverdue && (
          <div className="overdue-warning-icon blinking">
            <i className="bi bi-exclamation-triangle-fill"></i>
          </div>
        )}
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
    </div>
  );
};

export default GroupedIssueCard;