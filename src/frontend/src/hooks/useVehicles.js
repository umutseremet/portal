// src/frontend/src/hooks/useVehicles.js

import { useState, useEffect, useCallback, useRef } from 'react';
import { vehicleService } from '../services/vehicleService';
import { showAlert } from '../utils/alertUtils';

export const useVehicles = (initialFilters = {}) => {
  // State
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    pageSize: 10,
    totalCount: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPreviousPage: false
  });

  // Filters state
  const [filters, setFilters] = useState({
    search: '',
    brand: '',
    model: '',
    licensePlate: '',
    companyName: '',
    ownershipType: '',
    sortBy: 'createdAt',
    sortOrder: 'desc',
    ...initialFilters
  });

  // Selected vehicles for bulk operations
  const [selectedVehicles, setSelectedVehicles] = useState([]);

  // Ref to track if component is mounted
  const mountedRef = useRef(true);
  const initialLoadDoneRef = useRef(false);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Load vehicles function
  const loadVehicles = useCallback(async (page = 1, resetData = true, filtersToUse = null) => {
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

      console.log('Loading vehicles with params:', params);

      const response = await vehicleService.getVehicles(params);

      console.log('API Response received:', {
        response,
        vehiclesArray: response?.data,
        vehiclesCount: response?.data?.length,
        totalCount: response?.totalCount
      });

      if (!mountedRef.current) return;

      if (resetData) {
        setVehicles(response.data || []);
      } else {
        // For infinite scroll or load more functionality
        setVehicles(prev =>
          page === 1 ? 
            response.data || [] : 
            [...prev, ...(response.data || [])]
        );
      }

      setPagination(prev => ({
        ...prev,
        currentPage: page,
        totalCount: response.totalCount || 0,
        totalPages: response.totalPages || 0,
        hasNextPage: response.hasNextPage || false,
        hasPreviousPage: response.hasPreviousPage || false
      }));

      initialLoadDoneRef.current = true;

    } catch (err) {
      console.error('Load vehicles error:', err);
      if (mountedRef.current) {
        setError(err.message || 'Araç verileri yüklenirken hata oluştu');
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [filters, pagination.pageSize, clearError]);

  // Create vehicle
  const createVehicle = useCallback(async (vehicleData) => {
    if (!mountedRef.current) return;

    try {
      setLoading(true);
      clearError();

      console.log('Creating vehicle:', vehicleData);

      const response = await vehicleService.createVehicle(vehicleData);
      console.log('Create API response:', response);

      if (!mountedRef.current) return;

      showAlert('Araç başarıyla eklendi.', 'success');

      // Reload vehicles to get updated list
      await loadVehicles(1, true, filters);

      return { success: true, vehicle: response };
    } catch (err) {
      if (mountedRef.current) {
        setError(err.message || 'Araç oluşturulurken hata oluştu');
      }
      throw err;
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [loadVehicles, filters, clearError]);

  // Update vehicle
  const updateVehicle = useCallback(async (id, vehicleData) => {
    if (!mountedRef.current) return;

    try {
      setLoading(true);
      clearError();

      console.log('Updating vehicle:', { id, vehicleData });

      const response = await vehicleService.updateVehicle(id, vehicleData);
      console.log('Update API response:', response);

      if (!mountedRef.current) return;

      // Update state with the new vehicle data
      if (response?.data || response?.vehicle) {
        setVehicles(prevVehicles => {
          return prevVehicles.map(vehicle => {
            if (vehicle.id === id) {
              return {
                ...vehicle,
                ...(response.data || response.vehicle),
                updatedAt: new Date().toISOString()
              };
            }
            return vehicle;
          });
        });

        console.log('✅ Vehicle updated successfully in state');
        showAlert('Araç başarıyla güncellendi.', 'success');

        return { success: true, vehicle: response.data || response.vehicle };
      } else {
        throw new Error('Güncelleme yanıtında araç bilgisi bulunamadı');
      }
    } catch (error) {
      console.error('❌ Update vehicle error:', error);

      if (mountedRef.current) {
        setError(error.message || 'Araç güncellenirken hata oluştu');
      }

      throw error;
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [clearError]);

  // Delete vehicle
  const deleteVehicle = useCallback(async (id) => {
    if (!mountedRef.current) return;

    try {
      setLoading(true);
      clearError();

      await vehicleService.deleteVehicle(id);

      if (mountedRef.current) {
        // Remove vehicle from the current list
        setVehicles(prev => prev.filter(vehicle => vehicle.id !== id));

        // Update pagination
        setPagination(prev => ({
          ...prev,
          totalCount: prev.totalCount - 1
        }));

        showAlert('Araç başarıyla silindi.', 'success');
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(err.message || 'Araç silinirken hata oluştu');
      }
      throw err;
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [clearError]);

  // Vehicle selection for bulk operations
  const selectVehicle = useCallback((id) => {
    setSelectedVehicles(prev =>
      prev.includes(id)
        ? prev.filter(vehicleId => vehicleId !== id)
        : [...prev, id]
    );
  }, []);

  const selectAllVehicles = useCallback(() => {
    setSelectedVehicles(prev =>
      prev.length === vehicles.length
        ? []
        : vehicles.map(vehicle => vehicle.id)
    );
  }, [vehicles]);

  const clearSelection = useCallback(() => {
    setSelectedVehicles([]);
  }, []);

  // Bulk delete
  const deleteSelectedVehicles = useCallback(async () => {
    if (!mountedRef.current || selectedVehicles.length === 0) return;

    try {
      setLoading(true);
      clearError();

      // Delete all selected vehicles
      await Promise.all(
        selectedVehicles.map(id => vehicleService.deleteVehicle(id))
      );

      if (mountedRef.current) {
        // Remove deleted vehicles from the current list
        setVehicles(prev =>
          prev.filter(vehicle => !selectedVehicles.includes(vehicle.id))
        );

        // Update pagination
        setPagination(prev => ({
          ...prev,
          totalCount: prev.totalCount - selectedVehicles.length
        }));

        // Clear selection
        setSelectedVehicles([]);

        showAlert(`${selectedVehicles.length} araç başarıyla silindi.`, 'success');
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(err.message || 'Araçlar silinirken hata oluştu');
      }
      throw err;
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [selectedVehicles, clearError]);

  // Export vehicles
  const exportVehicles = useCallback(async (exportFilters = null) => {
    if (!mountedRef.current) return;

    try {
      setLoading(true);
      clearError();

      const filtersToUse = exportFilters || filters;
      await vehicleService.exportVehicles(filtersToUse);

      if (mountedRef.current) {
        showAlert('Araç listesi başarıyla dışa aktarıldı.', 'success');
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(err.message || 'Dışa aktarma sırasında hata oluştu');
      }
      throw err;
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [filters, clearError]);

  // Filter functions
  const updateFilters = useCallback((newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setPagination(prev => ({ ...prev, currentPage: 1 })); // Reset to first page
  }, []);

  const resetFilters = useCallback(() => {
    const resetFilters = {
      search: '',
      brand: '',
      model: '',
      licensePlate: '',
      companyName: '',
      ownershipType: '',
      sortBy: 'createdAt',
      sortOrder: 'desc'
    };
    setFilters(resetFilters);
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  }, []);

  // Page navigation
  const goToPage = useCallback((page) => {
    setPagination(prev => ({ ...prev, currentPage: page }));
  }, []);

  // Initial load
  useEffect(() => {
    if (!initialLoadDoneRef.current) {
      loadVehicles();
    }
  }, [loadVehicles]);

  // Load vehicles when filters or pagination change
  useEffect(() => {
    if (initialLoadDoneRef.current) {
      loadVehicles(pagination.currentPage, true);
    }
  }, [filters, pagination.currentPage, pagination.pageSize]);

  // Cleanup
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Computed values
  const isEmpty = vehicles.length === 0 && !loading;
  const hasFilters = Object.values(filters).some(value => value && value !== '' && value !== 'createdAt' && value !== 'desc');
  const selectedCount = selectedVehicles.length;
  const isAllSelected = vehicles.length > 0 && selectedVehicles.length === vehicles.length;
  
  const filterSummary = {
    search: filters.search,
    brand: filters.brand,
    model: filters.model,
    licensePlate: filters.licensePlate,
    companyName: filters.companyName,
    ownershipType: filters.ownershipType,
    activeCount: Object.values({
      search: filters.search,
      brand: filters.brand,
      model: filters.model,
      licensePlate: filters.licensePlate,
      companyName: filters.companyName,
      ownershipType: filters.ownershipType
    }).filter(v => v && v !== '').length
  };

  return {
    // Data
    vehicles,
    filters,
    pagination,
    selectedVehicles,

    // State
    loading,
    error,
    isEmpty,
    hasFilters,
    selectedCount,
    isAllSelected,
    filterSummary,

    // Actions
    loadVehicles,
    createVehicle,
    updateVehicle,
    deleteVehicle,
    exportVehicles,
    updateFilters,
    resetFilters,
    goToPage,
    selectVehicle,
    selectAllVehicles,
    clearSelection,
    deleteSelectedVehicles,
    clearError
  };
};