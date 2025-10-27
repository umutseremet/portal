// src/frontend/src/pages/VehiclesPage.js
// Modal yerine sayfa yönlendirmesi yapan versiyon

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import VehiclesList from '../components/Vehicles/VehiclesList';
import VehicleModal from '../components/Vehicles/VehicleModal';
import { useVehicles } from '../hooks/useVehicles';
// 1. Import ekle (dosyanın başına)
import { exportVehiclesToExcel } from '../utils/excelExport';

const VehiclesPage = () => {
  const navigate = useNavigate();

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
  } = useVehicles();

  // Modal states
  const [showNewVehicleModal, setShowNewVehicleModal] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);

  // Refresh function for Excel import
  const handleRefresh = () => {
    loadVehicles();
  };

  // 2. Export handler ekle (diğer handler'larla birlikte)
  const handleExport = () => {
    try {
      if (!vehicles || vehicles.length === 0) {
        alert('Dışa aktarılacak araç bulunamadı!');
        return;
      }
      exportVehiclesToExcel(vehicles, 'Araclar');
    } catch (error) {
      console.error('Export error:', error);
      alert('Excel dışa aktarma sırasında hata oluştu');
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

  // YENİ - Handle view vehicle - Sayfaya yönlendir
  const handleViewVehicle = (vehicle) => {
    try {
      navigate('/vehicles/detail', { state: { vehicle } });
    } catch (error) {
      console.error('Error viewing vehicle:', error);
    }
  };

  // Handle edit vehicle
  const handleEditVehicle = (vehicle) => {
    try {
      setEditingVehicle(vehicle);
      setShowNewVehicleModal(true);
    } catch (error) {
      console.error('Error editing vehicle:', error);
    }
  };

  // Handle delete vehicle
  const handleDeleteVehicle = async (vehicle) => {
    try {
      if (window.confirm(`${vehicle.licensePlate} plakalı aracı silmek istediğinize emin misiniz?`)) {
        await deleteVehicle(vehicle.id);
      }
    } catch (error) {
      console.error('Error deleting vehicle:', error);
    }
  };

  // Handle bulk delete
  const handleBulkDelete = async () => {
    try {
      if (window.confirm(`${selectedCount} aracı silmek istediğinize emin misiniz?`)) {
        await deleteSelectedVehicles();
      }
    } catch (error) {
      console.error('Error bulk deleting:', error);
    }
  };

  // Handle close modal
  const handleCloseModal = () => {
    setShowNewVehicleModal(false);
    setEditingVehicle(null);
  };

  // Handle save vehicle
  const handleSaveVehicle = async (vehicleData) => {
    try {
      if (editingVehicle) {
        await updateVehicle(editingVehicle.id, vehicleData);
      } else {
        await createVehicle(vehicleData);
      }
      handleCloseModal();
    } catch (error) {
      console.error('Error saving vehicle:', error);
    }
  };


  return (
    <div className="container-fluid py-4">
      <div className="row">
        <div className="col-12">
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
                    onSelectVisitor={handleVehicleSelect}
                    onSelectAll={handleSelectAll}
                    onClearSelection={handleClearSelection}
                    onViewVisitor={handleViewVehicle}
                    onEditVisitor={handleEditVehicle}
                    onDeleteVisitor={handleDeleteVehicle}
                    onBulkDelete={handleBulkDelete}
                    onNewVisitor={() => setShowNewVehicleModal(true)}
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

          {/* New/Edit Vehicle Modal */}
          <VehicleModal
            show={showNewVehicleModal}
            onHide={handleCloseModal}
            onSave={handleSaveVehicle}
            vehicle={editingVehicle}
            loading={loading}
          />
        </div>
      </div>
    </div>
  );
};

export default VehiclesPage;