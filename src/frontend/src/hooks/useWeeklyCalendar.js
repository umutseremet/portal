// src/frontend/src/hooks/useWeeklyCalendar.js
import { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom'; // ✅ EKLE
import apiService from '../services/api';
import { getProjectColor } from '../utils/colorUtils';

export const useWeeklyCalendar = () => {
  const location = useLocation(); // ✅ EKLE
  
  // State
  const [calendarData, setCalendarData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // ✅ GÜNCELLE - Location state'den gelen hafta bilgisini kullan
  const [currentWeek, setCurrentWeek] = useState(() => {
    if (location.state?.currentWeek) {
      return new Date(location.state.currentWeek);
    }
    return new Date();
  });
  
  const [filters, setFilters] = useState({
    parentIssueId: '',
    projectId: '',
    productionType: 'all'
  });
  const [projectList, setProjectList] = useState([]);

  // Helper functions
  const getWeekStart = useCallback((date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
  }, []);

  // Tarih formatlama fonksiyonu
  const formatDate = useCallback((dateInput) => {
    try {
      // Eğer zaten string ise Date objesine çevir
      const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;

      // Geçerli bir tarih mi kontrol et
      if (!(date instanceof Date) || isNaN(date.getTime())) {
        console.warn('Invalid date input:', dateInput);
        return '-';
      }

      return date.toLocaleDateString('tr-TR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch (error) {
      console.error('Error formatting date:', error, dateInput);
      return '-';
    }
  }, []);

  // Fetch calendar data
  const fetchCalendarData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const weekStart = getWeekStart(currentWeek);

      const requestBody = {
        startDate: weekStart.toISOString().split('T')[0],
        parentIssueId: filters.parentIssueId ? parseInt(filters.parentIssueId) : null,
        projectId: filters.projectId ? parseInt(filters.projectId) : null,
        productionType: filters.productionType && filters.productionType !== 'all' ? 
          filters.productionType : null
      };

      console.log('📅 Fetching calendar data:', requestBody);

      const response = await apiService.getWeeklyProductionCalendar(requestBody);

      console.log('✅ Calendar data received:', response);
      setCalendarData(response);

      // Extract unique projects from groupedProductions
      const projects = new Set();
      response.days?.forEach(day => {
        day.groupedProductions?.forEach(group => {
          if (group.projectId && group.projectCode) {
            projects.add(JSON.stringify({
              id: group.projectId,
              code: group.projectCode
            }));
          }
        });
      });
      setProjectList(Array.from(projects).map(p => JSON.parse(p)));

    } catch (err) {
      console.error('❌ Error fetching calendar:', err);
      setError(err.message || 'Takvim verileri yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  }, [currentWeek, filters, getWeekStart]);

  // Load data when filters or week changes
  useEffect(() => {
    fetchCalendarData();
  }, [fetchCalendarData]);

  // Navigation functions
  const goToPreviousWeek = useCallback(() => {
    const prevWeek = new Date(currentWeek);
    prevWeek.setDate(prevWeek.getDate() - 7);
    setCurrentWeek(prevWeek);
  }, [currentWeek]);

  const goToNextWeek = useCallback(() => {
    const nextWeek = new Date(currentWeek);
    nextWeek.setDate(nextWeek.getDate() + 7);
    setCurrentWeek(nextWeek);
  }, [currentWeek]);

  const goToToday = useCallback(() => {
    setCurrentWeek(new Date());
  }, []);

  // Filter functions
  const updateFilters = useCallback((newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters({
      parentIssueId: '',
      projectId: '',
      productionType: 'all'
    });
  }, []);

  // Filter issues by production type
  const filterIssuesByType = useCallback((groups) => {
    if (filters.productionType === 'all') return groups;
    return groups.filter(group => group.productionType === filters.productionType);
  }, [filters.productionType]);

  // Get all unique production types
  const getAllProductionTypes = useCallback(() => {
    if (!calendarData) return [];
    const types = new Set();
    calendarData.days?.forEach(day => {
      day.groupedProductions?.forEach(group => {
        if (group.productionType) types.add(group.productionType);
      });
    });
    return Array.from(types).sort();
  }, [calendarData]);

  // Proje legend verilerini hesapla
  const getProjectLegend = useCallback(() => {
    if (!calendarData) return [];

    const projectMap = new Map();

    calendarData.days?.forEach(day => {
      day.groupedProductions?.forEach(group => {
        const key = group.projectId;

        if (projectMap.has(key)) {
          const existing = projectMap.get(key);
          existing.count += group.issueCount || 1;
        } else {
          projectMap.set(key, {
            projectId: group.projectId,
            code: group.projectCode || 'Kod Yok',
            name: group.projectName || 'İsimsiz Proje',
            color: getProjectColor(group.projectId),
            count: group.issueCount || 1
          });
        }
      });
    });

    // Map'i array'e çevir ve kod'a göre sırala
    return Array.from(projectMap.values())
      .sort((a, b) => a.code.localeCompare(b.code));
  }, [calendarData]);

  return {
    // Data
    calendarData,
    projectList,
    filters,
    currentWeek, // ✅ currentWeek'i export et

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
    formatDate,
    getWeekStart
  };
};