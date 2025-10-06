// src/frontend/src/components/WeeklyCalendar/CalendarNavigation.js
import React from 'react';

const CalendarNavigation = ({ 
  weekStart, 
  weekEnd, 
  loading,
  onPrevious, 
  onNext, 
  onToday 
}) => {
  const formatDisplayDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' });
  };

  return (
    <div className="card mb-4">
      <div className="card-body">
        <div className="d-flex justify-content-between align-items-center">
          <button
            className="btn btn-outline-primary"
            onClick={onPrevious}
            disabled={loading}
          >
            <i className="bi bi-chevron-left"></i>
            Önceki Hafta
          </button>
          
          <div className="text-center">
            <h4 className="mb-1">
              {weekStart && formatDisplayDate(weekStart)} - {weekEnd && formatDisplayDate(weekEnd)}
            </h4>
            <button
              className="btn btn-link btn-sm"
              onClick={onToday}
            >
              Bugüne Git
            </button>
          </div>

          <button
            className="btn btn-outline-primary"
            onClick={onNext}
            disabled={loading}
          >
            Sonraki Hafta
            <i className="bi bi-chevron-right ms-1"></i>
          </button>
        </div>
      </div>
    </div>
  );
};

export default CalendarNavigation;