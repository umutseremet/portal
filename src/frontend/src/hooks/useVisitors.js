// src/frontend/src/hooks/useVisitors.js
// ✅ SIRALAMA SORUNU DÜZELTİLDİ

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import visitorService from '../services/visitorService';

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

  // Clear stats
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

      // Remove empty values
      Object.keys(params).forEach(key => {
        if (params[key] === '' || params[key] === null || params[key] === undefined) {
          delete params[key];
        }
      });

      console.log('Loading visitors with params:', params);

      const response = await visitorService.getVisitors(params);

      console.log('API Response received:', {
        visitorsCount: response?.visitors?.length,
        totalCount: response?.totalCount
      });

      if (!mountedRef.current) return;

      if (resetData) {
        setVisitors(response.visitors || []);
      } else {
        setVisitors(prev =>
          page === 1 ? response.visitors || [] : [...prev, ...(response.visitors || [])]
        );
      }

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
        setStats(response);
      }
    } catch (err) {
      console.error('Error loading visitor stats:', err);
      if (mountedRef.current) {
        setStats({
          totalVisitors: 0,
          todayVisitors: 0,
          thisWeekVisitors: 0,
          thisMonthVisitors: 0
        });
      }
    } finally {
      if (mountedRef.current) {
        setStatsLoading(false);
      }
    }
  }, []);

  // ✅ DÜZELTİLMİŞ: Update filters - loadVisitors'ı çağırır
  const updateFilters = useCallback((newFilters) => {
    console.log('🔄 Updating filters from:', filters, 'to:', newFilters);
    const updatedFilters = { ...filters, ...newFilters };
    setFilters(updatedFilters);
    
    // ✅ Filtreler değiştiğinde hemen yükle
    console.log('📤 Calling loadVisitors with new filters');
    setTimeout(() => {
      loadVisitors(1, true, updatedFilters);
    }, 50);
  }, [filters, loadVisitors]);

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
    
    setTimeout(() => {
      loadVisitors(1, true, defaultFilters);
    }, 50);
  }, [loadVisitors]);

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

      const response = await visitorService.updateVisitor(id, visitorData);
      console.log('Update API response:', response);

      if (!mountedRef.current) return;

      if (response?.visitor) {
        setVisitors(prevVisitors => {
          return prevVisitors.map(visitor => {
            if (visitor.id === id) {
              return {
                ...visitor,
                ...response.visitor,
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
        setVisitors(prev => prev.filter(visitor => visitor.id !== id));

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

      await Promise.all(
        selectedVisitors.map(id => visitorService.deleteVisitor(id))
      );

      if (mountedRef.current) {
        setVisitors(prev =>
          prev.filter(visitor => !selectedVisitors.includes(visitor.id))
        );

        setPagination(prev => ({
          ...prev,
          totalCount: prev.totalCount - selectedVisitors.length
        }));

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
    clearStats,
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