// src/frontend/src/components/WeeklyCalendar/GroupedIssueCard.js
import React from 'react';
import { getProjectColor, getLightColor } from '../../utils/colorUtils';

const GroupedIssueCard = ({ group, onClick }) => { // ✅ onClick prop eklendi
  // Proje bazlı renk al
  const projectColor = getProjectColor(group.projectId);
  const lightBgColor = getLightColor(projectColor, 0.15);

  // ✅ Click handler
  const handleClick = () => {
    console.log('🖱️ Card clicked:', group); // Debug için
    if (onClick) {
      onClick(group);
    }
  };

  // ✅ Keyboard handler
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  };

  return (
    <div
      className="grouped-issue-card"
      style={{
        borderLeftColor: projectColor,
        backgroundColor: lightBgColor
      }}
      onClick={handleClick}           // ✅ onClick eklendi
      onKeyPress={handleKeyPress}     // ✅ Keyboard support
      role="button"                    // ✅ Accessibility
      tabIndex={0}                     // ✅ Keyboard focusable
    >
      {/* Üst Satır: İş Tipi Badge */}
      <div className="grouped-card-header">
        <span
          className="production-type-badge"
          style={{
            backgroundColor: projectColor,
            color: 'white'
          }}
        >
          {group.productionType}
        </span>
        <div className="project-code-text">
          {group.projectCode || 'Kod Yok'}
        </div>
      </div>

    </div>
  );
};

export default GroupedIssueCard;