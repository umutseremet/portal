// src/frontend/src/components/WeeklyCalendar/WeeklyCalendar.js
import React from 'react';
import { useWeeklyCalendar } from '../../hooks/useWeeklyCalendar';
import CalendarHeader from './CalendarHeader';
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

  // 🐛 DEBUG: Console'da kontrol edelim
  console.log('🎨 WeeklyCalendar - projectLegend:', projectLegend);

  return (
    <div className="weekly-production-calendar">
      <div className="container-fluid">
        {/* Header */}
        <CalendarHeader 
          onRefresh={fetchCalendarData} 
          loading={loading} 
        />

        {/* Navigation with Filters and Legend */}
        <CalendarNavigation
          weekStart={calendarData?.weekStart}
          weekEnd={calendarData?.weekEnd}
          loading={loading}
          onPrevious={goToPreviousWeek}
          onNext={goToNextWeek}
          onToday={goToToday}
          // Filtre props'ları
          filters={filters}
          projectList={projectList}
          productionTypes={productionTypes}
          onFilterChange={updateFilters}
          onResetFilters={resetFilters}
          // ✅ BURADA EKSİKTİ - projectLegend prop'u eklendi
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