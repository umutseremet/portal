// src/frontend/src/pages/VehiclesPage.js
// ✅ GÜNCELLENMIŞ VERSİYON - Normal sayfalara yönlendirme

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

  // Handle view vehicle
  const handleViewVehicle = (vehicle) => {
    navigate(`/vehicles/${vehicle.id}`);
  };

  // Handle edit vehicle
  const handleEditVehicle = (vehicle) => {
    navigate(`/vehicles/${vehicle.id}/edit`);
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
                <i className="bi bi-truck me-2"></i>
                Araç Takip Sistemi
              </h2>
              <p className="text-muted mb-0">
                Şirket araçlarını takip edin ve yönetin
              </p>
            </div>

            {/* ✅ ARVENTO BUTONLARI - SAYFALARA YÖNLENDİRME */}
            <div className="d-flex gap-2 flex-wrap">
              <button
                className="btn btn-danger"
                onClick={() => navigate('/vehicles/arvento/working-report')}
                title="Arvento Araç Çalışma Raporu"
              >
                <i className="bi bi-file-earmark-bar-graph me-2"></i>
                Araç Çalışma Raporu (Arvento)
              </button>

              <button
                className="btn btn-success"
                onClick={() => navigate('/vehicles/arvento/location-map')}
                title="Arvento Anlık Konum"
              >
                <i className="bi bi-geo-alt me-2"></i>
                Anlık Konum (Arvento)
              </button>
            </div>
          </div>

          {/* Filter Summary */}
          {hasFilters && (
            <div className="alert alert-info d-flex justify-content-between align-items-center">
              <div>
                <i className="bi bi-funnel me-2"></i>
                <strong>Aktif Filtreler:</strong>
                <span className="ms-2">{filterSummary?.text || 'Filtre uygulandı'}</span>
              </div>
              <button className="btn btn-sm btn-outline-secondary" onClick={resetFilters}>
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