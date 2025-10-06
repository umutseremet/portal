// src/frontend/src/hooks/useWeeklyCalendar.js
import { useState, useEffect, useCallback } from 'react';
import apiService from '../services/api';

export const useWeeklyCalendar = () => {
  // State
  const [calendarData, setCalendarData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentWeek, setCurrentWeek] = useState(new Date());
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

  const formatDate = useCallback((date) => {
    return date.toISOString().split('T')[0];
  }, []);

  // Fetch calendar data
  const fetchCalendarData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const requestBody = {
        startDate: formatDate(getWeekStart(currentWeek)),
        parentIssueId: filters.parentIssueId ? parseInt(filters.parentIssueId) : null,
        projectId: filters.projectId ? parseInt(filters.projectId) : null
      };

      console.log('📅 Fetching calendar data:', requestBody);

      const response = await apiService.getWeeklyProductionCalendar(requestBody);
      
      console.log('✅ Calendar data received:', response);
      setCalendarData(response);

      // Extract unique projects
      const projects = new Set();
      response.days?.forEach(day => {
        day.productionIssues?.forEach(issue => {
          if (issue.projectId && issue.projectName) {
            projects.add(JSON.stringify({ id: issue.projectId, name: issue.projectName }));
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
  }, [currentWeek, filters, formatDate, getWeekStart]);

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
  const filterIssuesByType = useCallback((issues) => {
    if (filters.productionType === 'all') return issues;
    return issues.filter(issue => issue.productionType === filters.productionType);
  }, [filters.productionType]);

  // Get all unique production types
  const getAllProductionTypes = useCallback(() => {
    if (!calendarData) return [];
    const types = new Set();
    calendarData.days?.forEach(day => {
      day.productionIssues?.forEach(issue => {
        if (issue.productionType) types.add(issue.productionType);
      });
    });
    return Array.from(types).sort();
  }, [calendarData]);

  // Calculate statistics
  const getStatistics = useCallback(() => {
    if (!calendarData) return { total: 0, completed: 0, inProgress: 0, avgCompletion: 0 };
    
    let total = 0;
    let completed = 0;
    let totalCompletion = 0;

    calendarData.days?.forEach(day => {
      const filteredIssues = filterIssuesByType(day.productionIssues || []);
      filteredIssues.forEach(issue => {
        total++;
        totalCompletion += issue.completionPercentage || 0;
        if (issue.isCompleted) completed++;
      });
    });

    return {
      total,
      completed,
      inProgress: total - completed,
      avgCompletion: total > 0 ? Math.round(totalCompletion / total) : 0
    };
  }, [calendarData, filterIssuesByType]);

  return {
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
    filterIssuesByType,
    getAllProductionTypes,

    // Statistics
    getStatistics,

    // Actions
    fetchCalendarData,

    // Helpers
    formatDate,
    getWeekStart
  };
};