// src/frontend/src/components/WeeklyCalendar/WeeklyCalendar.js
// ✅ COMPLETE VERSION - Revize İşler Butonu Dahil

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useWeeklyCalendar } from '../../hooks/useWeeklyCalendar';
import CalendarHeader from './CalendarHeader';
import CalendarNavigation from './CalendarNavigation';
import CalendarGrid from './CalendarGrid';
import { LoadingState, EmptyState } from './LoadingState';
import './WeeklyCalendar.css';

const WeeklyCalendar = () => {
  const navigate = useNavigate();

  const {
    // Data
    calendarData,
    projectList,
    filters,
    currentWeek,

    // State
    loading,
    error,

    // Navigation
    goToPreviousWeek,
    goToNextWeek,
    goToToday,

    // Filters
    updateFilters,
    resetFilters,
    getAllProductionTypes,

    // Statistics & Legend
    getProjectLegend,

    // Actions
    fetchCalendarData,

    // Helpers
    formatDate
  } = useWeeklyCalendar();

  // ✅ Revize İşler Sayfasına Git
  const handleShowRevisedIssues = () => {
    navigate('/production/revised-issues', {
      state: {
        weekStart: calendarData.weekStart,  // ✅ Backend'den doğru Pazartesi
        weekEnd: calendarData.weekEnd       // ✅ Backend'den doğru Pazar
      }
    });
};

  // Kart tıklama handler
  const handleCardClick = (group, date) => {
    if (!group || !group.projectId || !group.productionType || !date) {
      console.error('❌ Invalid card click data:', { group, date });
      return;
    }

    navigate('/production/issue-details', {
      state: {
        selectedGroup: group,
        selectedDate: date,
        viewType: 'filtered',
        currentWeek: currentWeek.toISOString()
      }
    });
  };

  // Tarih başlığı tıklama handler
  const handleDateClick = (date) => {
    navigate('/production/issue-details', {
      state: {
        selectedDate: date,
        selectedGroup: null,
        viewType: 'all',
        currentWeek: currentWeek.toISOString()
      }
    });
  };

  const productionTypes = getAllProductionTypes();
  const projectLegend = getProjectLegend();

  return (
    <div className="weekly-production-calendar">
      <div className="container-fluid">
        {/* Header with Revised Issues Button */}
        <CalendarHeader
          onRefresh={fetchCalendarData}
          loading={loading}
          onShowRevisedIssues={handleShowRevisedIssues}
          weekStart={currentWeek}
        />

        {/* Navigation with Filters and Legend */}
        <CalendarNavigation
          weekStart={calendarData?.weekStart}
          weekEnd={calendarData?.weekEnd}
          loading={loading}
          onPrevious={goToPreviousWeek}
          onNext={goToNextWeek}
          onToday={goToToday}
          filters={filters}
          projectList={projectList}
          productionTypes={productionTypes}
          onFilterChange={updateFilters}
          onResetFilters={resetFilters}
          projectLegend={projectLegend}
        />

        {/* Loading State */}
        {loading && <LoadingState />}

        {/* Error State */}
        {error && (
          <div className="alert alert-danger d-flex align-items-center" role="alert">
            <i className="bi bi-exclamation-triangle-fill me-2"></i>
            <div>{error}</div>
          </div>
        )}

        {/* Calendar Grid */}
        {!loading && !error && calendarData && (
          <>
            <CalendarGrid
              days={calendarData.days}
              formatDate={formatDate}
              onCardClick={handleCardClick}
              onDateClick={handleDateClick}
            />

            {/* Empty State */}
            {calendarData.days?.every(d =>
              (d.groupedProductions || []).length === 0
            ) && <EmptyState />}
          </>
        )}
      </div>
    </div>
  );
};

export default WeeklyCalendar;