// src/frontend/src/components/WeeklyCalendar/GroupedIssueCard.js
import React from 'react';
import { getProjectColor, getLightColor } from '../../utils/colorUtils';

const GroupedIssueCard = ({ group }) => {
  // Proje bazlı renk al
  const projectColor = getProjectColor(group.projectId);
  const lightBgColor = getLightColor(projectColor, 0.15);

  return (
    <div
      className="grouped-issue-card"
      style={{
        borderLeftColor: projectColor,
        backgroundColor: lightBgColor
      }}
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