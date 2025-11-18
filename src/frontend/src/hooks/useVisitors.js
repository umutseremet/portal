// src/frontend/src/hooks/useVisitors.js

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import visitorService from '../services/visitorService';
import { debounce } from '../utils/helpers';

export const useVisitors = (initialFilters = {}) => {
  // State
  const [visitors, setVisitors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 10,
    totalCount: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPreviousPage: false
  });

  // Filters state
  const [filters, setFilters] = useState({
    fromDate: '',
    toDate: '',
    company: '',
    visitor: '',
    sortBy: 'date',
    sortOrder: 'desc',
    ...initialFilters
  });

  // Statistics state
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(false);

  // Selected visitors for bulk operations
  const [selectedVisitors, setSelectedVisitors] = useState([]);

  // Ref to track if component is mounted and initial load
  const mountedRef = useRef(true);
  const initialLoadDoneRef = useRef(false);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // ✅ Clear stats fonksiyonu
  const clearStats = useCallback(() => {
    if (mountedRef.current) {
      setStats(null);
      setStatsLoading(false);
    }
  }, []);

  // Load visitors fonksiyonu
  const loadVisitors = useCallback(async (page = 1, resetData = true, filtersToUse = null) => {
    if (!mountedRef.current) return;

    try {
      setLoading(true);
      clearError();

      const currentFilters = filtersToUse || filters;
      const params = {
        ...currentFilters,
        page,
        pageSize: pagination.pageSize
      };

      // Remove empty values to avoid unnecessary API parameters
      Object.keys(params).forEach(key => {
        if (params[key] === '' || params[key] === null || params[key] === undefined) {
          delete params[key];
        }
      });

      console.log('Loading visitors with params:', params);

      const response = await visitorService.getVisitors(params);

      console.log('API Response received:', {
        response,
        visitorsArray: response?.visitors,
        visitorsCount: response?.visitors?.length,
        totalCount: response?.totalCount
      });

      if (!mountedRef.current) return;

      if (resetData) {
        setVisitors(response.visitors || []);
      } else {
        // For infinite scroll or load more functionality
        setVisitors(prev =>
          page === 1 ? response.visitors || [] : [...prev, ...(response.visitors || [])]
        );
      }

      // Update pagination
      setPagination({
        page: response.page || page,
        pageSize: response.pageSize || pagination.pageSize,
        totalCount: response.totalCount || 0,
        totalPages: response.totalPages || 0,
        hasNextPage: response.hasNextPage || false,
        hasPreviousPage: response.hasPreviousPage || false
      });

      console.log('✅ Visitors loaded successfully');
    } catch (err) {
      console.error('❌ Load visitors error:', err);
      if (mountedRef.current) {
        setError(err.message || 'Ziyaretçiler yüklenirken hata oluştu');
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [filters, pagination.pageSize, clearError]);

  // Load statistics
  const loadStats = useCallback(async () => {
    if (!mountedRef.current) return;

    try {
      setStatsLoading(true);
      const response = await visitorService.getVisitorStats();

      if (mountedRef.current) {
        console.log('Stats loaded:', response);
        setStats(response);
      }
    } catch (err) {
      console.error('Error loading visitor stats:', err);
      // Don't set main error for stats, just log it
      if (mountedRef.current) {
        // Set mock stats for development
        setStats({
          totalVisitors: 0,
          todayVisitors: 0,
          thisWeekVisitors: 0,
          thisMonthVisitors: 0,
          visitorsByDate: [],
          topCompanies: []
        });
      }
    } finally {
      if (mountedRef.current) {
        setStatsLoading(false);
      }
    }
  }, []);

  // Update filters
  const updateFilters = useCallback((newFilters) => {
    console.log('Updating filters from:', filters, 'to:', newFilters);
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  // Reset filters
  const resetFilters = useCallback(() => {
    console.log('Resetting filters');
    const defaultFilters = {
      fromDate: '',
      toDate: '',
      company: '',
      visitor: '',
      sortBy: 'date',
      sortOrder: 'desc'
    };
    setFilters(defaultFilters);
  }, []);

  // Quick date filters
  const setQuickDateFilter = useCallback((filterType) => {
    const today = new Date();
    let fromDate = '';
    let toDate = today.toISOString().split('T')[0];

    switch (filterType) {
      case 'today':
        fromDate = today.toISOString().split('T')[0];
        break;
      case 'week':
        const oneWeekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        fromDate = oneWeekAgo.toISOString().split('T')[0];
        break;
      case 'month':
        const oneMonthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
        fromDate = oneMonthAgo.toISOString().split('T')[0];
        break;
      default:
        fromDate = '';
        toDate = '';
    }

    updateFilters({ fromDate, toDate });
  }, [updateFilters]);

  // Page navigation
  const goToPage = useCallback((page) => {
    loadVisitors(page, true, filters);
  }, [loadVisitors, filters]);

  // Create visitor
  const createVisitor = useCallback(async (visitorData) => {
    if (!mountedRef.current) return;

    try {
      setLoading(true);
      clearError();

      const response = await visitorService.createVisitor(visitorData);

      if (mountedRef.current) {
        // Reload visitors to get updated list
        await loadVisitors(1, true, filters);
      }

      return response;
    } catch (err) {
      if (mountedRef.current) {
        setError(err.message || 'Ziyaretçi oluşturulurken hata oluştu');
      }
      throw err;
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [loadVisitors, filters, clearError]);

  // Update visitor
  const updateVisitor = useCallback(async (id, visitorData) => {
    if (!mountedRef.current) return;

    try {
      setLoading(true);
      clearError();

      console.log('Updating visitor:', { id, visitorData });

      // API çağrısı yap
      const response = await visitorService.updateVisitor(id, visitorData);
      console.log('Update API response:', response);

      if (!mountedRef.current) return;

      // STATE GÜNCELLEMESİ: Sadece response'daki visitor objesini kullan
      if (response?.visitor) {
        setVisitors(prevVisitors => {
          return prevVisitors.map(visitor => {
            if (visitor.id === id) {
              // GÜVENLI MERGE: Obje render hatası yapmamak için
              return {
                ...visitor,
                ...response.visitor,
                // Tarih formatlarını kontrol et
                date: response.visitor.date || response.visitor.Date,
                company: response.visitor.company || response.visitor.Company,
                visitor: response.visitor.visitor || response.visitor.Visitor || response.visitor.visitorName,
                visitorName: response.visitor.visitorName || response.visitor.visitor,
                description: response.visitor.description || response.visitor.Description,
                updatedAt: response.visitor.updatedAt || response.visitor.UpdatedAt || new Date().toISOString()
              };
            }
            return visitor;
          });
        });

        console.log('✅ Visitor updated successfully in state');

        // Statistics'i yenile
        loadStats();

        return { success: true, visitor: response.visitor };
      } else {
        throw new Error('Güncelleme yanıtında visitor bilgisi bulunamadı');
      }
    } catch (error) {
      console.error('❌ Update visitor error:', error);

      if (mountedRef.current) {
        setError(error.message || 'Ziyaretçi güncellenirken hata oluştu');
      }

      throw error;
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [clearError, loadStats]);

  // Delete visitor
  const deleteVisitor = useCallback(async (id) => {
    if (!mountedRef.current) return;

    try {
      setLoading(true);
      clearError();

      await visitorService.deleteVisitor(id);

      if (mountedRef.current) {
        // Remove visitor from the current list
        setVisitors(prev => prev.filter(visitor => visitor.id !== id));

        // Update pagination
        setPagination(prev => ({
          ...prev,
          totalCount: prev.totalCount - 1
        }));
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(err.message || 'Ziyaretçi silinirken hata oluştu');
      }
      throw err;
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [clearError]);

  // Visitor selection for bulk operations
  const selectVisitor = useCallback((id) => {
    setSelectedVisitors(prev =>
      prev.includes(id)
        ? prev.filter(visitorId => visitorId !== id)
        : [...prev, id]
    );
  }, []);

  const selectAllVisitors = useCallback(() => {
    setSelectedVisitors(prev =>
      prev.length === visitors.length
        ? []
        : visitors.map(visitor => visitor.id)
    );
  }, [visitors]);

  const clearSelection = useCallback(() => {
    setSelectedVisitors([]);
  }, []);

  // Bulk delete
  const deleteSelectedVisitors = useCallback(async () => {
    if (!mountedRef.current || selectedVisitors.length === 0) return;

    try {
      setLoading(true);
      clearError();

      // Delete all selected visitors
      await Promise.all(
        selectedVisitors.map(id => visitorService.deleteVisitor(id))
      );

      if (mountedRef.current) {
        // Remove deleted visitors from the current list
        setVisitors(prev =>
          prev.filter(visitor => !selectedVisitors.includes(visitor.id))
        );

        // Update pagination
        setPagination(prev => ({
          ...prev,
          totalCount: prev.totalCount - selectedVisitors.length
        }));

        // Clear selection
        setSelectedVisitors([]);
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(err.message || 'Ziyaretçiler silinirken hata oluştu');
      }
      throw err;
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [selectedVisitors, clearError]);

  // Export visitors
  const exportVisitors = useCallback(async () => {
    try {
      await visitorService.exportVisitors(filters);
    } catch (err) {
      console.error('Export error:', err);
    }
  }, [filters]);

  // Computed values
  const isEmpty = !loading && visitors.length === 0;
  const hasFilters = filters.fromDate || filters.toDate || filters.company || filters.visitor;
  const selectedCount = selectedVisitors.length;
  const isAllSelected = visitors.length > 0 && selectedVisitors.length === visitors.length;

  const filterSummary = useMemo(() => {
    const parts = [];
    if (filters.fromDate && filters.toDate) {
      parts.push(`${filters.fromDate} - ${filters.toDate}`);
    } else if (filters.fromDate) {
      parts.push(`${filters.fromDate} tarihinden sonra`);
    } else if (filters.toDate) {
      parts.push(`${filters.toDate} tarihinden önce`);
    }

    if (filters.company) parts.push(`Şirket: ${filters.company}`);
    if (filters.visitor) parts.push(`Ziyaretçi: ${filters.visitor}`);

    return parts.join(', ');
  }, [filters]);

  // Effect to load initial data
  useEffect(() => {
    if (!initialLoadDoneRef.current) {
      loadVisitors();
      loadStats();
      initialLoadDoneRef.current = true;
    }
  }, [loadVisitors, loadStats]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  return {
    // Data
    visitors,
    stats,
    filters,
    pagination,
    selectedVisitors,

    // State
    loading,
    statsLoading,
    error,
    isEmpty,
    hasFilters,
    selectedCount,
    isAllSelected,
    filterSummary,

    // Actions
    loadVisitors,
    loadStats,
    clearStats, // ✅ YENİ EKLENEN
    createVisitor,
    updateVisitor,
    deleteVisitor,
    exportVisitors,
    updateFilters,
    resetFilters,
    setQuickDateFilter,
    goToPage,
    selectVisitor,
    selectAllVisitors,
    clearSelection,
    deleteSelectedVisitors,
    clearError
  };
};