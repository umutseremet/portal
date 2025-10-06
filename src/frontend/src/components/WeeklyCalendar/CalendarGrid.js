// src/frontend/src/components/WeeklyCalendar/CalendarGrid.js
import React from 'react';
import DayCard from './DayCard';

const CalendarGrid = ({ days, filterIssuesByType, formatDate }) => {
  return (
    <div className="calendar-grid">
      {days?.map((day, index) => {
        const filteredIssues = filterIssuesByType(day.productionIssues || []);
        const isToday = formatDate(new Date()) === formatDate(new Date(day.date));
        
        return (
          <DayCard
            key={index}
            day={day}
            filteredIssues={filteredIssues}
            isToday={isToday}
          />
        );
      })}
    </div>
  );
};

export default CalendarGrid;