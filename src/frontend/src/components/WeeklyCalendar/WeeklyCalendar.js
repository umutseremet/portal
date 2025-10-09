// src/frontend/src/components/WeeklyCalendar/WeeklyCalendar.js
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

  console.log('🔄 WeeklyCalendar component rendered');

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

  // Kart tıklama handler - İş tipine göre filtrelenmiş
  const handleCardClick = (group, date) => {
    console.log('🖱️ Card clicked - handleCardClick called:', { group, date });
    navigate('/production/issue-details', {
      state: {
        selectedGroup: group,
        selectedDate: date,
        viewType: 'filtered'
      }
    });
  };

  // Tarih başlığı tıklama handler - O güne ait TÜM işler
  const handleDateClick = (date) => {
    console.log('📅 ===== DATE HEADER CLICKED =====');
    console.log('📅 Date received:', date);
    console.log('📅 Type of date:', typeof date);
    console.log('📅 Current location:', window.location.pathname);
    
    try {
      navigate('/production/issue-details', {
        state: {
          selectedDate: date,
          selectedGroup: null,
          viewType: 'all'
        }
      });
      console.log('✅ Navigation triggered successfully');
    } catch (error) {
      console.error('❌ Navigation error:', error);
    }
  };

  const productionTypes = getAllProductionTypes();
  const projectLegend = getProjectLegend();

  console.log('🎨 WeeklyCalendar render props:', {
    hasCalendarData: !!calendarData,
    loading,
    error
  });

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