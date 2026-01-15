// src/frontend/src/pages/VehiclesPage.js
// ✅ INLINE FİLTRELER İLE GÜNCELLENMİŞ + filterSummary HATASI DÜZELTİLDİ

import React from 'react';
import { useNavigate } from 'react-router-dom';
import VehiclesList from '../components/Vehicles/VehiclesList';
import { useVehicles } from '../hooks/useVehicles';
import { exportVehiclesToExcel } from '../utils/excelExport';
import { useToast } from '../contexts/ToastContext';

const VehiclesPage = () => {
  const navigate = useNavigate();
  const toast = useToast();

  // Use the vehicles hook
  const {
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
    deleteVehicle,
    updateFilters,
    resetFilters,
    goToPage,
    selectVehicle,
    selectAllVehicles,
    clearSelection,
    deleteSelectedVehicles,
    clearError
  } = useVehicles();

  // Refresh function for Excel import
  const handleRefresh = () => {
    loadVehicles();
  };

  // Export handler
  const handleExport = () => {
    try {
      if (!vehicles || vehicles.length === 0) {
        toast.warning('Dışa aktarılacak araç bulunamadı!');
        return;
      }
      exportVehiclesToExcel(vehicles, 'Araclar');
      toast.success('Araç listesi Excel\'e aktarıldı');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Excel dışa aktarma sırasında hata oluştu');
    }
  };

  // Handle sort
  const handleSort = (column, order) => {
    try {
      console.log('Sorting by:', column, order);
      updateFilters({
        sortBy: column,
        sortOrder: order
      });
    } catch (error) {
      console.error('Error sorting:', error);
    }
  };

  // Handle page change
  const handlePageChange = (page) => {
    try {
      console.log('Changing page to:', page);
      goToPage(page);
    } catch (error) {
      console.error('Error changing page:', error);
    }
  };

  // ✅ Handle filter change - Her değişiklikte API'ye gider (debounced)
  const handleFilterChange = (newFilters) => {
    try {
      console.log('Updating filters:', newFilters);
      updateFilters(newFilters);
    } catch (error) {
      console.error('Error updating filters:', error);
    }
  };

  // Handle vehicle selection
  const handleVehicleSelect = (vehicleId) => {
    try {
      selectVehicle(vehicleId);
    } catch (error) {
      console.error('Error selecting vehicle:', error);
    }
  };

  // Handle select all
  const handleSelectAll = () => {
    try {
      selectAllVehicles();
    } catch (error) {
      console.error('Error selecting all:', error);
    }
  };

  // Handle clear selection
  const handleClearSelection = () => {
    try {
      clearSelection();
    } catch (error) {
      console.error('Error clearing selection:', error);
    }
  };

  // Handle new vehicle
  const handleNewVehicle = () => {
    try {
      console.log('🆕 New vehicle button clicked');
      navigate('/vehicles/new');
    } catch (error) {
      console.error('Error navigating to new vehicle:', error);
    }
  };

  // Handle view vehicle
  const handleViewVehicle = (vehicle) => {
    try {
      console.log('👁️ VIEW BUTTON CLICKED - Vehicle:', vehicle);
      console.log('👁️ Navigating to:', `/vehicles/detail/${vehicle.id}`);
      
      navigate(`/vehicles/detail/${vehicle.id}`, { state: { vehicle } });
      
      console.log('👁️ Navigate called successfully');
    } catch (error) {
      console.error('❌ Error viewing vehicle:', error);
      toast.error('Detay sayfasına yönlendirme hatası: ' + error.message);
    }
  };

  // Handle edit vehicle
  const handleEditVehicle = (vehicle) => {
    try {
      console.log('✏️ EDIT BUTTON CLICKED - Vehicle:', vehicle);
      console.log('✏️ Navigating to:', `/vehicles/edit/${vehicle.id}`);
      
      navigate(`/vehicles/edit/${vehicle.id}`, { state: { vehicle } });
      
      console.log('✏️ Navigate called successfully');
    } catch (error) {
      console.error('❌ Error editing vehicle:', error);
      toast.error('Düzenleme sayfasına yönlendirme hatası: ' + error.message);
    }
  };

  // Handle delete vehicle
  const handleDeleteVehicle = async (vehicle) => {
    try {
      if (window.confirm(`${vehicle.licensePlate} plakalı aracı silmek istediğinize emin misiniz?`)) {
        await deleteVehicle(vehicle.id);
        toast.success('Araç başarıyla silindi');
      }
    } catch (error) {
      console.error('Error deleting vehicle:', error);
      toast.error('Araç silinirken hata oluştu');
    }
  };

  // Handle bulk delete
  const handleBulkDelete = async () => {
    try {
      if (window.confirm(`${selectedCount} aracı silmek istediğinize emin misiniz?`)) {
        await deleteSelectedVehicles();
        toast.success(`${selectedCount} araç başarıyla silindi`);
      }
    } catch (error) {
      console.error('Error bulk deleting:', error);
      toast.error('Araçlar silinirken hata oluştu');
    }
  };

  return (
    <div className="container-fluid py-4 vehicles-page">
      <div className="row">
        <div className="col-12">
          {/* PAGE HEADER */}
          <div className="page-header mb-4">
            <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
              <div>
                <h1 className="h3 mb-1">
                  <i className="bi bi-truck me-2 text-danger"></i>
                  Araç Yönetimi
                </h1>
                <p className="text-muted mb-0">
                  Şirket araçlarını görüntüleyin ve yönetin
                </p>
              </div>

              {/* ARVENTO BUTONLARI */}
              <div className="d-flex gap-2 flex-wrap">
                <button
                  className="btn btn-success btn-sm"
                  onClick={() => navigate('/vehicles/arvento/working-report')}
                >
                  <i className="bi bi-file-earmark-bar-graph me-2"></i>
                  Araç Çalışma Raporu
                </button>
                <button
                  className="btn btn-info btn-sm"
                  onClick={() => navigate('/vehicles/arvento/location-map')}
                >
                  <i className="bi bi-geo-alt-fill me-2"></i>
                  Anlık Araç Konumları
                </button>
              </div>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="alert alert-danger alert-dismissible fade show" role="alert">
              <i className="bi bi-exclamation-triangle me-2"></i>
              {error}
              <button 
                type="button" 
                className="btn-close" 
                onClick={clearError}
              ></button>
            </div>
          )}

          {/* ✅ DÜZELTİLMİŞ Filter Summary - Obje render etme */}
          {hasFilters && (
            <div className="alert alert-info d-flex justify-content-between align-items-center flex-wrap">
              <div className="d-flex align-items-center flex-wrap gap-2">
                <div className="d-flex align-items-center">
                  <i className="bi bi-funnel me-2"></i>
                  <strong>Aktif Filtreler:</strong>
                </div>
                {filterSummary.search && (
                  <span className="badge bg-secondary">
                    Arama: {filterSummary.search}
                  </span>
                )}
                {filterSummary.licensePlate && (
                  <span className="badge bg-secondary">
                    Plaka: {filterSummary.licensePlate}
                  </span>
                )}
                {filterSummary.brand && (
                  <span className="badge bg-secondary">
                    Marka: {filterSummary.brand}
                  </span>
                )}
                {filterSummary.model && (
                  <span className="badge bg-secondary">
                    Model: {filterSummary.model}
                  </span>
                )}
                {filterSummary.companyName && (
                  <span className="badge bg-secondary">
                    Şirket: {filterSummary.companyName}
                  </span>
                )}
                {filterSummary.ownershipType && (
                  <span className="badge bg-secondary">
                    Sahiplik: {filterSummary.ownershipType}
                  </span>
                )}
              </div>
              <button 
                className="btn btn-sm btn-outline-secondary"
                onClick={resetFilters}
              >
                <i className="bi bi-x-circle me-1"></i>
                Filtreleri Temizle
              </button>
            </div>
          )}

          {/* Vehicles List */}
          <div className="row">
            <div className="col-12">
              <div className="card h-100">
                <div className="card-body">
                  <VehiclesList
                    vehicles={vehicles}
                    loading={loading}
                    pagination={pagination}
                    filters={filters}
                    sorting={{ field: filters.sortBy, direction: filters.sortOrder }}
                    selectedVehicles={selectedVehicles}
                    onPageChange={handlePageChange}
                    onFilterChange={handleFilterChange}
                    onSort={handleSort}
                    onSelectVehicle={handleVehicleSelect}
                    onSelectAll={handleSelectAll}
                    onClearSelection={handleClearSelection}
                    onViewVehicle={handleViewVehicle}
                    onEditVehicle={handleEditVehicle}
                    onDeleteVehicle={handleDeleteVehicle}
                    onBulkDelete={handleBulkDelete}
                    onNewVehicle={handleNewVehicle}
                    onExport={handleExport}
                    onResetFilters={resetFilters}
                    onRefresh={handleRefresh}
                    hasFilters={hasFilters}
                    isEmpty={isEmpty}
                    selectedCount={selectedCount}
                    isAllSelected={isAllSelected}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VehiclesPage;