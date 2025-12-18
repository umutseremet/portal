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
    currentWeek, // ✅ Hook'tan currentWeek'i al

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

  // ✅ Kart tıklama handler - Hafta bilgisini de gönder
  // WeeklyCalendar.js - handleCardClick fonksiyonu
// ✅ Detaylı log'larla debug versiyonu

const handleCardClick = (group, date) => {
  console.log('🖱️ ===== CARD CLICKED =====');
  
  // Gelen parametreleri kontrol et
  console.log('📥 Received parameters:', { group, date });
  
  // Group objesi yapısını kontrol et
  console.log('📦 Group object details:', {
    isNull: group === null,
    isUndefined: group === undefined,
    type: typeof group,
    keys: group ? Object.keys(group) : 'N/A',
    projectId: group?.projectId,
    projectCode: group?.projectCode,
    projectName: group?.projectName,
    productionType: group?.productionType,
    issueCount: group?.issueCount
  });
  
  // Date kontrol et
  console.log('📅 Date details:', {
    isNull: date === null,
    isUndefined: date === undefined,
    type: typeof date,
    value: date,
    isDate: date instanceof Date,
    isString: typeof date === 'string'
  });
  
  // Navigation state'i hazırla
  const navigationState = {
    selectedGroup: group,
    selectedDate: date,
    viewType: 'filtered',
    currentWeek: currentWeek.toISOString()
  };
  
  console.log('🚀 Navigation state:', navigationState);
  
  // Kritik validasyon
  if (!group) {
    console.error('❌ HATA: group objesi yok!');
    alert('Grup bilgisi bulunamadı. Lütfen tekrar deneyin.');
    return;
  }
  
  if (!group.projectId) {
    console.error('❌ HATA: group.projectId yok!', group);
    alert('Proje ID bulunamadı. Lütfen tekrar deneyin.');
    return;
  }
  
  if (!group.productionType) {
    console.error('❌ HATA: group.productionType yok!', group);
    alert('Üretim tipi bulunamadı. Lütfen tekrar deneyin.');
    return;
  }
  
  if (!date) {
    console.error('❌ HATA: date yok!');
    alert('Tarih bilgisi bulunamadı. Lütfen tekrar deneyin.');
    return;
  }
  
  console.log('✅ Validation passed, navigating...');
  
  try {
    navigate('/production/issue-details', {
      state: navigationState
    });
    console.log('✅ Navigation completed');
  } catch (error) {
    console.error('❌ Navigation error:', error);
    alert('Sayfa geçişi sırasında hata oluştu: ' + error.message);
  }
};

  // ✅ Tarih başlığı tıklama handler - Hafta bilgisini de gönder
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
          viewType: 'all',
          currentWeek: currentWeek.toISOString() // ✅ Hafta bilgisini gönder
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