// src/frontend/src/components/WeeklyCalendar/CalendarGrid.js
import React from 'react';
import GroupedIssueCard from './GroupedIssueCard';

const CalendarGrid = ({ days, formatDate, onCardClick, onDateClick }) => {
  console.log('🎨 CalendarGrid rendered with props:', { 
    hasDays: !!days, 
    hasOnCardClick: !!onCardClick, 
    hasOnDateClick: !!onDateClick 
  });

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

  // Tarih başlığına tıklama handler
  const handleDateHeaderClick = (date, event) => {
    event.stopPropagation(); // Event bubbling'i durdur
    console.log('🖱️ Date header clicked in CalendarGrid:', date);
    
    if (onDateClick) {
      console.log('✅ Calling onDateClick handler');
      onDateClick(date);
    } else {
      console.warn('⚠️ onDateClick handler not provided!');
    }
  };

  return (
    <div className="calendar-grid">
      {days?.map((day, index) => (
        <div
          key={index}
          className={`calendar-day-card ${isToday(day.date) ? 'today' : ''}`}
        >
          {/* Day Header - Tıklanabilir */}
          <div 
            className="day-header clickable-date-header"
            onClick={(e) => handleDateHeaderClick(day.date, e)}
            role="button"
            tabIndex={0}
            onKeyPress={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleDateHeaderClick(day.date, e);
              }
            }}
          >
            <div className="day-name">{day.dayName}</div>
            <div className="day-date">{formatDate(day.date)}</div>
            {day.groupedProductions && day.groupedProductions.length > 0 && (
              <span className="badge bg-light text-dark position-absolute top-0 end-0 m-2">
                {day.groupedProductions.length}
              </span>
            )}
            {/* Tıklama İpucu İkonu */}
            <div className="date-click-hint">
              <i className="bi bi-box-arrow-up-right"></i>
            </div>
          </div>

          {/* Day Issues */}
          <div className="day-issues">
            {day.groupedProductions && day.groupedProductions.length > 0 ? (
              day.groupedProductions.map((group, idx) => (
                <GroupedIssueCard
                  key={idx}
                  group={group}
                  onClick={() => onCardClick && onCardClick(group, day.date)}
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