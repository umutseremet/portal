// src/frontend/src/components/WeeklyCalendar/IssueCard.js
import React from 'react';

const IssueCard = ({ issue }) => {
  const getProductionTypeColor = (type) => {
    const colors = {
      'Lazer': '#e74c3c',
      'Abkant': '#3498db',
      'Kaynak': '#f39c12',
      'Boya': '#9b59b6',
      'Freze': '#1abc9c',
      'Kaplama': '#34495e',
      'Delik': '#95a5a6',
      'Torna': '#e67e22',
      'Data Hazırlama': '#16a085'
    };
    return colors[type] || '#7f8c8d';
  };

  const getCompletionBadgeClass = (percentage) => {
    if (percentage >= 100) return 'bg-success';
    if (percentage >= 75) return 'bg-info';
    if (percentage >= 50) return 'bg-warning';
    return 'bg-danger';
  };

  return (
    <div 
      className="issue-card"
      style={{ borderLeftColor: getProductionTypeColor(issue.productionType) }}
    >
      {/* Issue Header */}
      <div className="issue-header">
        <span 
          className="production-type-badge"
          style={{ backgroundColor: getProductionTypeColor(issue.productionType) }}
        >
          {issue.productionType}
        </span>
        <span className={`badge ${getCompletionBadgeClass(issue.completionPercentage)}`}>
          %{issue.completionPercentage}
        </span>
      </div>

      {/* Issue Title */}
      <h6 className="issue-title" title={issue.subject}>
        {issue.subject}
      </h6>

      {/* Project Name */}
      <div className="issue-project">
        <i className="bi bi-folder me-1"></i>
        {issue.projectName}
      </div>

      {/* Issue Meta */}
      <div className="issue-meta">
        <div className="meta-item">
          <i className="bi bi-person"></i>
          <span>{issue.assignedTo}</span>
        </div>
        {issue.estimatedHours && (
          <div className="meta-item">
            <i className="bi bi-clock"></i>
            <span>{issue.estimatedHours}h</span>
          </div>
        )}
      </div>

      {/* Date Range */}
      <div className="issue-dates">
        <small className="text-muted">
          <i className="bi bi-calendar-range me-1"></i>
          {new Date(issue.plannedStartDate).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}
          {' - '}
          {new Date(issue.plannedEndDate).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}
        </small>
      </div>

      {/* Status */}
      <div className="issue-status">
        <span className={`status-badge ${issue.isCompleted ? 'completed' : 'in-progress'}`}>
          {issue.statusText}
        </span>
      </div>
    </div>
  );
};

export default IssueCard;