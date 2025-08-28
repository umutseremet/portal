
// ===== 2. src/frontend/src/hooks/useVisitors.js =====

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

  // Ref to track if component is mounted
  const mountedRef = useRef(true);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Load visitors with current filters
  const loadVisitors = useCallback(async (page = 1, resetData = false, filtersToUse = null) => {
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
          page === 1 ? 
            response.visitors || [] : [...prev, ...(response.visitors || [])]
        );
      }

      setPagination({
        page: response.page || 1,
        pageSize: response.pageSize || 10,
        totalCount: response.totalCount || 0,
        totalPages: response.totalPages || 0,
        hasNextPage: response.hasNextPage || false,
        hasPreviousPage: response.hasPreviousPage || false
      });

    } catch (err) {
      if (!mountedRef.current) return;
      
      console.error('Error loading visitors:', err);
      setError(err.message || 'Ziyaretçiler yüklenirken hata oluştu');
      
      // Fallback data for development
      if (err.message?.includes('Failed to fetch') || err.message?.includes('ERR_CONNECTION_REFUSED')) {
        setError('API bağlantısı kurulamadı. Backend sunucusunun çalıştığından emin olun.');
        // Mock data for development
        setVisitors([]);
        setPagination({
          page: 1,
          pageSize: 10,
          totalCount: 0,
          totalPages: 0,
          hasNextPage: false,
          hasPreviousPage: false
        });
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [pagination.pageSize, clearError, filters]); // ✅ DÜZELTME: filters dependency eklendi

  // ✅ DÜZELTME: İlk yükleme için ayrı bir useEffect - sadece bir kez çalışır
  useEffect(() => {
    console.log('useVisitors: Initial load triggered');
    loadVisitors(1, true, filters);
  }, []); // Empty dependency - sadece ilk yükleme

  // ✅ DÜZELTME: Filtre değişikliklerinde debounced yeniden yükleme
  const debouncedLoadVisitors = useMemo(
    () => debounce((newFilters) => {
      console.log('Debounced load with filters:', newFilters);
      loadVisitors(1, true, newFilters);
    }, 500),
    [loadVisitors]
  );

  // ✅ DÜZELTME: Filtre değiştiğinde debounced yeniden yükleme
  useEffect(() => {
    // İlk yüklemede değil, sadece filtre değiştiğinde çalışır
    if (filters.fromDate !== '' || filters.toDate !== '' || filters.company !== '' || filters.visitor !== '') {
      debouncedLoadVisitors(filters);
    }
  }, [filters, debouncedLoadVisitors]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Load visitor statistics
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

  // Update filters - Prevent infinite loops
  const updateFilters = useCallback((newFilters) => {
    console.log('Updating filters from:', filters, 'to:', newFilters);
    setFilters(prev => {
      const updated = { ...prev, ...newFilters };
      return updated;
    });
  }, [filters]);

  // Reset filters - Fix the infinite loop
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

      const response = await visitorService.updateVisitor(id, visitorData);
      
      if (mountedRef.current) {
        // Update the visitor in the current list
        setVisitors(prev => 
          prev.map(visitor => 
            visitor.id === id 
              ? { ...visitor, ...response.visitor }
              : visitor
          )
        );
      }
      
      return response;
    } catch (err) {
      if (mountedRef.current) {
        setError(err.message || 'Ziyaretçi güncellenirken hata oluştu');
      }
      throw err;
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [clearError]);

  // Delete visitor
  const deleteVisitor = useCallback(async (id) => {
    if (!mountedRef.current) return;
    
    try {
      setLoading(true);
      clearError();

      await visitorService.deleteVisitor(id);
      
      if (mountedRef.current) {
        // Remove the visitor from the current list
        setVisitors(prev => prev.filter(visitor => visitor.id !== id));
        
        // Update pagination
        setPagination(prev => ({
          ...prev,
          totalCount: prev.totalCount - 1
        }));

        // Remove from selected if it was selected
        setSelectedVisitors(prev => prev.filter(visitorId => visitorId !== id));
      }
      
      return true;
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

  // Get single visitor
  const getVisitor = useCallback(async (id) => {
    if (!mountedRef.current) return;
    
    try {
      setLoading(true);
      clearError();

      const response = await visitorService.getVisitor(id);
      return response;
    } catch (err) {
      if (mountedRef.current) {
        setError(err.message || 'Ziyaretçi alınırken hata oluştu');
      }
      throw err;
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [clearError]);

  // Export visitors
  const exportVisitors = useCallback(async (exportFilters = null) => {
    if (!mountedRef.current) return;
    
    try {
      setLoading(true);
      clearError();

      const params = exportFilters || filters;
      const response = await visitorService.exportVisitors(params);
      
      // Download as CSV
      visitorService.downloadCSV(response, `ziyaretciler_${new Date().toISOString().split('T')[0]}.csv`);
      
      return true;
    } catch (err) {
      if (mountedRef.current) {
        setError(err.message || 'Veriler dışa aktarılırken hata oluştu');
      }
      throw err;
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [filters, clearError]);

  // Set quick date filter
  const setQuickDateFilter = useCallback((filterType) => {
    const quickFilters = visitorService.getQuickDateFilters();
    const selectedFilter = quickFilters.find(f => f.label === filterType);
    
    if (selectedFilter) {
      updateFilters({
        fromDate: selectedFilter.fromDate,
        toDate: selectedFilter.toDate
      });
    }
  }, [updateFilters]);

  // Pagination handlers
  const goToPage = useCallback((page) => {
    if (page >= 1 && page <= pagination.totalPages && mountedRef.current) {
      loadVisitors(page, true, filters);
    }
  }, [loadVisitors, pagination.totalPages, filters]);

  const nextPage = useCallback(() => {
    if (pagination.hasNextPage) {
      goToPage(pagination.page + 1);
    }
  }, [goToPage, pagination.hasNextPage, pagination.page]);

  const prevPage = useCallback(() => {
    if (pagination.hasPreviousPage) {
      goToPage(pagination.page - 1);
    }
  }, [goToPage, pagination.hasPreviousPage, pagination.page]);

  // Change page size
  const changePageSize = useCallback((newPageSize) => {
    setPagination(prev => ({ ...prev, pageSize: newPageSize }));
    loadVisitors(1, true, filters);
  }, [loadVisitors, filters]);

  // Selection handlers
  const selectVisitor = useCallback((id) => {
    setSelectedVisitors(prev => 
      prev.includes(id) 
        ? prev.filter(visitorId => visitorId !== id)
        : [...prev, id]
    );
  }, []);

  const selectAllVisitors = useCallback(() => {
    const allIds = visitors.map(visitor => visitor.id);
    setSelectedVisitors(allIds);
  }, [visitors]);

  const clearSelection = useCallback(() => {
    setSelectedVisitors([]);
  }, []);

  // Bulk delete selected visitors
  const deleteSelectedVisitors = useCallback(async () => {
    if (!mountedRef.current) return;
    
    try {
      setLoading(true);
      clearError();

      // Delete all selected visitors
      await Promise.all(selectedVisitors.map(id => visitorService.deleteVisitor(id)));
      
      if (mountedRef.current) {
        // Reload visitors
        await loadVisitors(1, true, filters);
        
        // Clear selection
        clearSelection();
      }
      
      return true;
    } catch (err) {
      if (mountedRef.current) {
        setError(err.message || 'Seçili ziyaretçiler silinirken hata oluştu');
      }
      throw err;
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [selectedVisitors, loadVisitors, filters, clearSelection, clearError]);

  // Computed values
  const isEmpty = useMemo(() => visitors.length === 0, [visitors]);
  const hasFilters = useMemo(() => 
    Object.values(filters).some(value => value && value.toString().trim() !== ''),
    [filters]
  );
  const selectedCount = useMemo(() => selectedVisitors.length, [selectedVisitors]);
  const isAllSelected = useMemo(() => 
    visitors.length > 0 && selectedCount === visitors.length,
    [visitors.length, selectedCount]
  );

  // Get filter summary text
  const filterSummary = useMemo(() => 
    visitorService.getFilterSummary(filters),
    [filters]
  );

  return {
    // Data
    visitors,
    stats,
    filters,
    pagination,
    selectedVisitors,

    // Loading states
    loading,
    statsLoading,
    error,

    // Computed values
    isEmpty,
    hasFilters,
    selectedCount,
    isAllSelected,
    filterSummary,

    // Actions - ✅ DÜZELTME: loadVisitors artık doğru şekilde return ediliyor
    loadVisitors: useCallback(() => loadVisitors(1, true, filters), [loadVisitors, filters]),
    loadStats,
    createVisitor,
    updateVisitor,
    deleteVisitor,
    getVisitor,
    exportVisitors,

    // Filter actions
    updateFilters,
    resetFilters,
    setQuickDateFilter,

    // Pagination actions
    goToPage,
    nextPage,
    prevPage,
    changePageSize,

    // Selection actions
    selectVisitor,
    selectAllVisitors,
    clearSelection,
    deleteSelectedVisitors,

    // Utility actions
    clearError
  };
};