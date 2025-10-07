// src/frontend/src/components/WeeklyCalendar/WeeklyCalendar.js
import React from 'react';
import { useWeeklyCalendar } from '../../hooks/useWeeklyCalendar';
import CalendarHeader from './CalendarHeader';
import ProjectLegend from './ProjectLegend';
import CalendarNavigation from './CalendarNavigation';
import CalendarGrid from './CalendarGrid';
import { LoadingState, EmptyState } from './LoadingState';
import './WeeklyCalendar.css';

const WeeklyCalendar = () => {
  const {
    // Data
    calendarData,
    projectList,
    filters,

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
    filterIssuesByType,
    getAllProductionTypes,

    // Statistics & Legend
    getProjectLegend,

    // Actions
    fetchCalendarData,

    // Helpers
    formatDate
  } = useWeeklyCalendar();

  const productionTypes = getAllProductionTypes();
  const projectLegend = getProjectLegend();

  return (
    <div className="weekly-production-calendar">
      <div className="container-fluid">
        {/* Header */}
        <CalendarHeader 
          onRefresh={fetchCalendarData} 
          loading={loading} 
        />

        {/* Project Legend */}
        <ProjectLegend projects={projectLegend} />

        {/* Navigation with Filters - CalendarFilters KALDIRILDI */}
        <CalendarNavigation
          weekStart={calendarData?.weekStart}
          weekEnd={calendarData?.weekEnd}
          loading={loading}
          onPrevious={goToPreviousWeek}
          onNext={goToNextWeek}
          onToday={goToToday}
          // Filtre props'ları eklendi
          filters={filters}
          projectList={projectList}
          productionTypes={productionTypes}
          onFilterChange={updateFilters}
          onResetFilters={resetFilters}
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
            />

            {/* Empty State - if all days have no issues */}
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