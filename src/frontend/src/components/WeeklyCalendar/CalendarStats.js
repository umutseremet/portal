// src/frontend/src/components/WeeklyCalendar/CalendarStats.js
import React from 'react';

const StatCard = ({ icon, value, label, bgColor }) => (
  <div className="col-lg-3 col-md-6">
    <div className={`stat-card ${bgColor} text-white`}>
      <div className="stat-icon">
        <i className={`bi ${icon}`}></i>
      </div>
      <div className="stat-content">
        <div className="stat-value">{value}</div>
        <div className="stat-label">{label}</div>
      </div>
    </div>
  </div>
);

const CalendarStats = ({ statistics }) => {
  return (
    <div className="row g-3 mb-4">
      <StatCard
        icon="bi-list-task"
        value={statistics.total}
        label="Toplam İş"
        bgColor="bg-primary"
      />
      <StatCard
        icon="bi-check-circle"
        value={statistics.completed}
        label="Tamamlanan"
        bgColor="bg-success"
      />
      <StatCard
        icon="bi-hourglass-split"
        value={statistics.inProgress}
        label="Devam Eden"
        bgColor="bg-warning"
      />
      <StatCard
        icon="bi-speedometer2"
        value={`%${statistics.avgCompletion}`}
        label="Ortalama Tamamlanma"
        bgColor="bg-info"
      />
    </div>
  );
};

export default CalendarStats;