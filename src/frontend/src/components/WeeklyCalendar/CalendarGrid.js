// src/frontend/src/components/WeeklyCalendar/CalendarGrid.js
import React from 'react';
import GroupedIssueCard from './GroupedIssueCard';

const CalendarGrid = ({ days, formatDate, onCardClick }) => {
  const isToday = (dateInput) => {
    try {
      const today = new Date();
      const checkDate = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;

      // Sadece tarih kısmını karşılaştır
      return today.getFullYear() === checkDate.getFullYear() &&
        today.getMonth() === checkDate.getMonth() &&
        today.getDate() === checkDate.getDate();
    } catch (error) {
      console.error('Error checking isToday:', error);
      return false;
    }
  };

  return (
    <div className="calendar-grid">
      {days?.map((day, index) => (
        <div
          key={index}
          className={`calendar-day-card ${isToday(day.date) ? 'today' : ''}`}
        >
          {/* Day Header */}
          <div className="day-header">
            <div className="day-name">{day.dayName}</div>
            <div className="day-date">{formatDate(day.date)}</div>
            {day.groupedProductions && day.groupedProductions.length > 0 && (
              <span className="badge bg-light text-dark position-absolute top-0 end-0 m-2">
                {day.groupedProductions.length}
              </span>
            )}
          </div>

          {/* Day Issues */}
          <div className="day-issues">
            {day.groupedProductions && day.groupedProductions.length > 0 ? (
              day.groupedProductions.map((group, idx) => (
                <GroupedIssueCard
                  key={idx}
                  group={group}
                  onClick={() => onCardClick && onCardClick(group, day.date)}  // YENİ satır
                />
              ))
            ) : (
              <div className="no-issues">
                <i className="bi bi-inbox text-muted"></i>
                <p className="text-muted mb-0">İş bulunmamaktadır</p>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default CalendarGrid;