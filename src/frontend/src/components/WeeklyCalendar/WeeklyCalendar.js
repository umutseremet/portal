// src/frontend/src/components/WeeklyCalendar/WeeklyCalendar.js
import React from 'react';
import { useWeeklyCalendar } from '../../hooks/useWeeklyCalendar';
import CalendarHeader from './CalendarHeader';
import CalendarStats from './CalendarStats';
import CalendarFilters from './CalendarFilters';
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

    // Statistics
    getStatistics,

    // Actions
    fetchCalendarData,

    // Helpers
    formatDate
  } = useWeeklyCalendar();

  const stats = getStatistics();
  const productionTypes = getAllProductionTypes();

  return (
    <div className="weekly-production-calendar">
      <div className="container-fluid">
        {/* Header */}
        <CalendarHeader 
          onRefresh={fetchCalendarData} 
          loading={loading} 
        />

        {/* Statistics */}
        <CalendarStats statistics={stats} />

        {/* Filters */}
        <CalendarFilters
          filters={filters}
          projectList={projectList}
          productionTypes={productionTypes}
          onFilterChange={updateFilters}
          onResetFilters={resetFilters}
        />

        {/* Navigation */}
        <CalendarNavigation
          weekStart={calendarData?.weekStart}
          weekEnd={calendarData?.weekEnd}
          loading={loading}
          onPrevious={goToPreviousWeek}
          onNext={goToNextWeek}
          onToday={goToToday}
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
              filterIssuesByType={filterIssuesByType}
              formatDate={formatDate}
            />

            {/* Empty State - if all days have no issues */}
            {calendarData.days?.every(d => 
              filterIssuesByType(d.productionIssues || []).length === 0
            ) && <EmptyState />}
          </>
        )}
      </div>
    </div>
  );
};

export default WeeklyCalendar;