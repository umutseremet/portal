// src/frontend/src/hooks/useVehicles.js
// DÜZELTILMIŞ VERSİYON - API verilerinin ekrana yansıması için

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

  // Load vehicles function - DÜZELTİLMİŞ VERSİYON
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
        response,
        vehiclesData: response?.data,
        vehiclesArray: Array.isArray(response?.data) ? response.data : [],
        vehiclesCount: Array.isArray(response?.data) ? response.data.length : 0,
        totalCount: response?.totalCount
      });

      if (!mountedRef.current) return;

      // API yanıtını kontrol et ve doğru formatta state'e yaz
      let vehiclesArray = [];

      if (response) {
        // API service'ten mappedResponse geldiği için direkt data property'sini kullan
        if (response.data && Array.isArray(response.data)) {
          vehiclesArray = response.data;
          console.log('✅ Using response.data array with', response.data.length, 'vehicles');
        } else if (Array.isArray(response)) {
          // Fallback: Direkt array gelirse
          vehiclesArray = response;
          console.log('✅ Using direct response array with', response.length, 'vehicles');
        } else {
          console.warn('⚠️ Unexpected API response format:', response);
          vehiclesArray = [];
        }
      }

      console.log('✅ Processed vehicles array:', {
        vehiclesArray,
        length: vehiclesArray.length,
        resetData
      });

      // State'i güncelle
      if (resetData) {
        setVehicles(vehiclesArray);
        console.log('🔄 Vehicles state RESET with:', vehiclesArray.length, 'items');
      } else {
        // For infinite scroll or load more functionality
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
        // Hata durumunda da boş array set et
        setVehicles([]);
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [filters, pagination.pageSize, clearError]);


  // Create vehicle - DÜZELTİLMİŞ VERSİYON
  const createVehicle = useCallback(async (vehicleData) => {
    if (!mountedRef.current) return;

    try {
      setLoading(true);
      clearError();

      console.log('📤 Creating vehicle with data:', vehicleData);

      // ✅ Data validation ve cleaning
      const cleanedData = {
        // Zorunlu alanlar
        licensePlate: vehicleData.licensePlate?.trim().toUpperCase() || '',
        brand: vehicleData.brand?.trim() || '',
        model: vehicleData.model?.trim() || '',

        // Opsiyonel alanlar - null yerine undefined gönder
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

      // Remove undefined values
      Object.keys(cleanedData).forEach(key => {
        if (cleanedData[key] === undefined) {
          delete cleanedData[key];
        }
      });

      console.log('✨ Cleaned data to send:', cleanedData);

      // API call
      const response = await vehicleService.createVehicle(cleanedData);
      console.log('✅ Create API response:', response);

      if (!mountedRef.current) return;

      // ✅ Response handling
      const newVehicle = response?.data || response?.vehicle || response;

      if (newVehicle) {
        // Add to vehicles list
        setVehicles(prevVehicles => [newVehicle, ...prevVehicles]);

        // Update pagination
        setPagination(prev => ({
          ...prev,
          totalCount: prev.totalCount + 1
        }));

        console.log('✅ Vehicle added to state successfully');
        showAlert('Araç başarıyla eklendi.', 'success');

        return { success: true, vehicle: newVehicle };
      } else {
        throw new Error('API yanıtında araç bilgisi bulunamadı');
      }

    } catch (err) {
      console.error('❌ Create vehicle error:', err);
      console.error('❌ Error details:', {
        message: err.message,
        response: err.response,
        data: err.response?.data
      });

      if (mountedRef.current) {
        const errorMessage = err.response?.data?.message
          || err.message
          || 'Araç oluşturulurken hata oluştu';

        setError(errorMessage);
        showAlert(errorMessage, 'error');
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

      console.log('Updating vehicle:', { id, vehicleData });

      const response = await vehicleService.updateVehicle(id, vehicleData);
      console.log('Update API response:', response);

      if (!mountedRef.current) return;

      // Update state with the new vehicle data
      if (response?.data || response?.vehicle || response) {
        setVehicles(prevVehicles => {
          return prevVehicles.map(vehicle => {
            if (vehicle.id === id) {
              return {
                ...vehicle,
                ...(response.data || response.vehicle || response),
                updatedAt: new Date().toISOString()
              };
            }
            return vehicle;
          });
        });

        console.log('✅ Vehicle updated successfully in state');
        showAlert('Araç başarıyla güncellendi.', 'success');

        return { success: true, vehicle: response.data || response.vehicle || response };
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
    console.log('🔍 Updating filters:', newFilters);
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
    console.log('🔄 Resetting filters to:', resetFilters);
    setFilters(resetFilters);
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  }, []);

  // Page navigation
  const goToPage = useCallback((page) => {
    console.log('📄 Going to page:', page);
    setPagination(prev => ({ ...prev, currentPage: page }));
  }, []);

  // Initial load - DÜZELTİLDİ
  useEffect(() => {
    console.log('🚀 useVehicles: Initial effect running', {
      initialLoadDone: initialLoadDoneRef.current,
      mounted: mountedRef.current
    });

    if (!initialLoadDoneRef.current && mountedRef.current) {
      console.log('🔄 Calling loadVehicles for initial load');
      loadVehicles();
    }
  }, [loadVehicles]);

  // Load vehicles when filters or pagination change - DÜZELTİLDİ
  useEffect(() => {
    console.log('🔍 Filter/Pagination effect running', {
      initialLoadDone: initialLoadDoneRef.current,
      currentPage: pagination.currentPage,
      filters
    });

    if (initialLoadDoneRef.current && mountedRef.current) {
      console.log('🔄 Calling loadVehicles due to filter/pagination change');
      loadVehicles(pagination.currentPage, true);
    }
  }, [filters, pagination.currentPage, pagination.pageSize]);

  // Cleanup
  useEffect(() => {
    return () => {
      console.log('🧹 useVehicles: Cleanup running');
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

  // Debug: Vehicles state değişikliklerini logla
  useEffect(() => {
    console.log('🔄 Vehicles state changed:', {
      vehiclesCount: vehicles.length,
      vehicles: vehicles.slice(0, 3), // İlk 3 aracı göster
      loading,
      error
    });
  }, [vehicles, loading, error]);

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