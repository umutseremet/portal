// src/frontend/src/components/WeeklyCalendar/DayCard.js
import React from 'react';
import IssueCard from './IssueCard';

const DayCard = ({ day, filteredIssues, isToday }) => {
  const formatDisplayDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' });
  };

  return (
    <div className={`calendar-day-card ${isToday ? 'today' : ''}`}>
      {/* Day Header */}
      <div className="day-header">
        <div className="day-name">{day.dayName}</div>
        <div className="day-date">{formatDisplayDate(day.date)}</div>
        {filteredIssues.length > 0 && (
          <span className="badge bg-danger ms-auto">{filteredIssues.length}</span>
        )}
      </div>

      {/* Issues List */}
      <div className="day-issues">
        {filteredIssues.length === 0 ? (
          <div className="no-issues">
            <i className="bi bi-inbox text-muted"></i>
            <p className="text-muted mb-0">İş bulunmamaktadır</p>
          </div>
        ) : (
          filteredIssues.map((issue) => (
            <IssueCard key={issue.issueId} issue={issue} />
          ))
        )}
      </div>
    </div>
  );
};

export default DayCard;