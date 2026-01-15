// src/frontend/src/hooks/useVehicles.js
// ✅ GERÇEK ZAMANLI FİLTRELEME İÇİN GÜNCELLENMIŞ VERSİYON

import { useState, useEffect, useCallback, useRef } from 'react';
import { vehicleService } from '../services/vehicleService';
import { showAlert } from '../utils/alertUtils';

// ✅ Debounce helper fonksiyonu
const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

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

  // Refs
  const mountedRef = useRef(true);
  const initialLoadDoneRef = useRef(false);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // ✅ Load vehicles function
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

      console.log('🔍 Loading vehicles with params:', params);

      const response = await vehicleService.getVehicles(params);

      console.log('📡 API Response received:', {
        vehiclesData: response?.data,
        vehiclesCount: Array.isArray(response?.data) ? response.data.length : 0,
        totalCount: response?.totalCount
      });

      if (!mountedRef.current) return;

      // API yanıtını kontrol et
      let vehiclesArray = [];

      if (response) {
        if (response.data && Array.isArray(response.data)) {
          vehiclesArray = response.data;
          console.log('✅ Using response.data array with', response.data.length, 'vehicles');
        } else if (Array.isArray(response)) {
          vehiclesArray = response;
          console.log('✅ Using direct response array with', response.length, 'vehicles');
        } else {
          console.warn('⚠️ Unexpected API response format:', response);
          vehiclesArray = [];
        }
      }

      // State'i güncelle
      if (resetData) {
        setVehicles(vehiclesArray);
        console.log('🔄 Vehicles state RESET with:', vehiclesArray.length, 'items');
      } else {
        setVehicles(prev => {
          const newVehicles = page === 1 ? vehiclesArray : [...prev, ...vehiclesArray];
          console.log('🔄 Vehicles state APPENDED, total:', newVehicles.length, 'items');
          return newVehicles;
        });
      }

      // Pagination'ı güncelle
      setPagination(prev => ({
        ...prev,
        currentPage: page,
        totalCount: response?.totalCount || response?.total || vehiclesArray.length,
        totalPages: response?.totalPages || Math.ceil((response?.totalCount || vehiclesArray.length) / pagination.pageSize),
        hasNextPage: response?.hasNextPage || false,
        hasPreviousPage: response?.hasPreviousPage || false
      }));

      initialLoadDoneRef.current = true;

      console.log('✅ Vehicles loaded successfully:', {
        vehiclesCount: vehiclesArray.length,
        totalCount: response?.totalCount || vehiclesArray.length,
        currentPage: page
      });

    } catch (err) {
      console.error('❌ Load vehicles error:', err);
      if (mountedRef.current) {
        setError(err.message || 'Araç verileri yüklenirken hata oluştu');
        setVehicles([]);
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [filters, pagination.pageSize, clearError]);

  // ✅ Debounced load vehicles - 500ms bekler
  const debouncedLoadVehicles = useRef(
    debounce((page, resetData, filtersToUse) => {
      loadVehicles(page, resetData, filtersToUse);
    }, 500)
  ).current;

  // Create vehicle
  const createVehicle = useCallback(async (vehicleData) => {
    if (!mountedRef.current) return;

    try {
      setLoading(true);
      clearError();

      console.log('📤 Creating vehicle with data:', vehicleData);

      const cleanedData = {
        licensePlate: vehicleData.licensePlate?.trim().toUpperCase() || '',
        brand: vehicleData.brand?.trim() || '',
        model: vehicleData.model?.trim() || '',
        year: vehicleData.year || null,
        vin: vehicleData.vin?.trim() || null,
        companyName: vehicleData.companyName?.trim() || null,
        location: vehicleData.location?.trim() || null,
        assignedUserName: vehicleData.assignedUserName?.trim() || null,
        assignedUserPhone: vehicleData.assignedUserPhone?.trim() || null,
        currentMileage: vehicleData.currentMileage || null,
        fuelConsumption: vehicleData.fuelConsumption || null,
        tireCondition: vehicleData.tireCondition?.trim() || null,
        lastServiceDate: vehicleData.lastServiceDate || null,
        insurance: vehicleData.insurance?.trim() || null,
        insuranceExpiryDate: vehicleData.insuranceExpiryDate || null,
        inspectionDate: vehicleData.inspectionDate || null,
        ownershipType: vehicleData.ownershipType?.trim() || 'company',
        vehicleImageUrl: vehicleData.vehicleImageUrl?.trim() || null,
        registrationInfo: vehicleData.registrationInfo?.trim() || null,
        notes: vehicleData.notes?.trim() || null
      };

      Object.keys(cleanedData).forEach(key => {
        if (cleanedData[key] === undefined) {
          delete cleanedData[key];
        }
      });

      const response = await vehicleService.createVehicle(cleanedData);
      console.log('✅ Create API response:', response);

      if (!mountedRef.current) return;

      const newVehicle = response?.data || response?.vehicle || response;

      if (newVehicle) {
        setVehicles(prevVehicles => [newVehicle, ...prevVehicles]);
        setPagination(prev => ({
          ...prev,
          totalCount: prev.totalCount + 1
        }));

        console.log('✅ Vehicle added to state successfully');
        showAlert('Araç başarıyla eklendi.', 'success');
      }

      return response;
    } catch (err) {
      console.error('❌ Create vehicle error:', err);
      if (mountedRef.current) {
        setError(err.message || 'Araç oluşturulurken hata oluştu');
      }
      throw err;
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [clearError]);

  // Update vehicle
  const updateVehicle = useCallback(async (id, vehicleData) => {
    if (!mountedRef.current) return;

    try {
      setLoading(true);
      clearError();

      const response = await vehicleService.updateVehicle(id, vehicleData);

      if (!mountedRef.current) return;

      const updatedVehicle = response?.data || response?.vehicle || response;

      if (updatedVehicle) {
        setVehicles(prevVehicles =>
          prevVehicles.map(vehicle =>
            vehicle.id === id ? { ...vehicle, ...updatedVehicle } : vehicle
          )
        );
        showAlert('Araç başarıyla güncellendi.', 'success');
      }

      return response;
    } catch (err) {
      if (mountedRef.current) {
        setError(err.message || 'Araç güncellenirken hata oluştu');
      }
      throw err;
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

      if (!mountedRef.current) return;

      setVehicles(prevVehicles => prevVehicles.filter(vehicle => vehicle.id !== id));
      setSelectedVehicles(prev => prev.filter(vehicleId => vehicleId !== id));
      setPagination(prev => ({
        ...prev,
        totalCount: Math.max(0, prev.totalCount - 1)
      }));

      showAlert('Araç başarıyla silindi.', 'success');
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

  // Delete multiple vehicles
  const deleteSelectedVehicles = useCallback(async () => {
    if (!mountedRef.current || selectedVehicles.length === 0) return;

    try {
      setLoading(true);
      clearError();

      await vehicleService.deleteMultipleVehicles(selectedVehicles);

      if (!mountedRef.current) return;

      setVehicles(prevVehicles =>
        prevVehicles.filter(vehicle => !selectedVehicles.includes(vehicle.id))
      );
      setPagination(prev => ({
        ...prev,
        totalCount: Math.max(0, prev.totalCount - selectedVehicles.length)
      }));
      setSelectedVehicles([]);

      showAlert(`${selectedVehicles.length} araç başarıyla silindi.`, 'success');
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
  const exportVehicles = useCallback(async (params = {}) => {
    try {
      setLoading(true);
      clearError();

      const response = await vehicleService.exportVehicles({
        ...filters,
        ...params
      });

      if (response) {
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

  // ✅ Update filters - DEBOUNCED VERSION
  const updateFilters = useCallback((newFilters) => {
    console.log('🔍 Updating filters:', newFilters);
    setFilters(prev => ({ ...prev, ...newFilters }));
    setPagination(prev => ({ ...prev, currentPage: 1 })); // Reset to first page
    
    // ✅ Debounced call - 500ms sonra API'ye gider
    debouncedLoadVehicles(1, true, { ...filters, ...newFilters });
  }, [filters, debouncedLoadVehicles]);

  // Reset filters
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
    console.log('🔄 Resetting filters to:', resetFilters);
    setFilters(resetFilters);
    setPagination(prev => ({ ...prev, currentPage: 1 }));
    loadVehicles(1, true, resetFilters);
  }, [loadVehicles]);

  // Page navigation
  const goToPage = useCallback((page) => {
    console.log('📄 Going to page:', page);
    setPagination(prev => ({ ...prev, currentPage: page }));
    loadVehicles(page, true);
  }, [loadVehicles]);

  // Selection functions
  const selectVehicle = useCallback((vehicleId) => {
    setSelectedVehicles(prev =>
      prev.includes(vehicleId)
        ? prev.filter(id => id !== vehicleId)
        : [...prev, vehicleId]
    );
  }, []);

  const selectAllVehicles = useCallback(() => {
    if (selectedVehicles.length === vehicles.length) {
      setSelectedVehicles([]);
    } else {
      setSelectedVehicles(vehicles.map(v => v.id));
    }
  }, [vehicles, selectedVehicles]);

  const clearSelection = useCallback(() => {
    setSelectedVehicles([]);
  }, []);

  // Initial load
  useEffect(() => {
    console.log('🚀 useVehicles: Initial effect running');

    if (!initialLoadDoneRef.current && mountedRef.current) {
      console.log('🔄 Calling loadVehicles for initial load');
      loadVehicles();
    }
  }, [loadVehicles]);

  // Cleanup
  useEffect(() => {
    return () => {
      console.log('🧹 useVehicles: Cleanup running');
      mountedRef.current = false;
    };
  }, []);

  // Computed values
  const isEmpty = vehicles.length === 0 && !loading;
  const hasFilters = Object.values(filters).some(value => 
    value && value !== '' && value !== 'createdAt' && value !== 'desc'
  );
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