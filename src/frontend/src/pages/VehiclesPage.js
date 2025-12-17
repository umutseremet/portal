// src/frontend/src/pages/VehiclesPage.js
// ✅ ROUTE DÜZELTİLDİ - detail ve edit URL'leri düzeltildi

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
        ...filters,
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

  // Handle filter change
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
    navigate('/vehicles/new');
  };

  // ✅ DÜZELTİLDİ - /vehicles/detail/:id formatına uygun
  const handleViewVehicle = (vehicle) => {
    navigate(`/vehicles/detail/${vehicle.id}`);
  };

  // ✅ DÜZELTİLDİ - /vehicles/edit/:id formatına uygun
  const handleEditVehicle = (vehicle) => {
    navigate(`/vehicles/edit/${vehicle.id}`);
  };

  // Handle delete vehicle
  const handleDeleteVehicle = async (vehicle) => {
    if (window.confirm(`${vehicle.licensePlate} plakalı aracı silmek istediğinizden emin misiniz?`)) {
      try {
        await deleteVehicle(vehicle.id);
        toast.success('Araç başarıyla silindi');
      } catch (error) {
        toast.error('Araç silinirken hata oluştu');
      }
    }
  };

  // Handle bulk delete
  const handleBulkDelete = async () => {
    if (selectedVehicles.length === 0) {
      toast.warning('Lütfen silmek için araç seçin');
      return;
    }

    if (window.confirm(`${selectedVehicles.length} adet aracı silmek istediğinizden emin misiniz?`)) {
      try {
        await deleteSelectedVehicles();
        toast.success(`${selectedVehicles.length} araç başarıyla silindi`);
      } catch (error) {
        toast.error('Araçlar silinirken hata oluştu');
      }
    }
  };

  return (
    <div className="container-fluid py-4">
      <div className="vehicles-page">
        <div className="container-fluid">
          {/* Error Alert */}
          {error && (
            <div className="alert alert-danger alert-dismissible fade show" role="alert">
              <i className="bi bi-exclamation-triangle me-2"></i>
              {error}
              <button
                type="button"
                className="btn-close"
                onClick={clearError}
                aria-label="Close"
              ></button>
            </div>
          )}

          {/* Page Header */}
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h2 className="h3 mb-1">
                <i className="bi bi-truck me-2 text-danger"></i>
                Araç Yönetimi
              </h2>
              <p className="text-muted mb-0">
                Şirket araçlarını görüntüleyin, düzenleyin ve yönetin
              </p>
            </div>
            <div className="d-flex gap-2">
              <button
                className="btn btn-outline-secondary"
                onClick={handleRefresh}
                disabled={loading}
              >
                <i className="bi bi-arrow-clockwise me-2"></i>
                Yenile
              </button>
              <button
                className="btn btn-outline-success"
                onClick={handleExport}
                disabled={loading || vehicles.length === 0}
              >
                <i className="bi bi-file-earmark-excel me-2"></i>
                Excel'e Aktar
              </button>
              <button
                className="btn btn-danger"
                onClick={handleNewVehicle}
              >
                <i className="bi bi-plus-circle me-2"></i>
                Yeni Araç Ekle
              </button>
            </div>
          </div>

          {/* Filter Summary */}
          {hasFilters && (
            <div className="alert alert-info d-flex justify-content-between align-items-center">
              <div>
                <i className="bi bi-funnel me-2"></i>
                <strong>Aktif Filtreler:</strong>
                {Object.entries(filterSummary).map(([key, value]) => (
                  value && <span key={key} className="ms-2 badge bg-primary">{value}</span>
                ))}
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
                    filterSummary={filterSummary}
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