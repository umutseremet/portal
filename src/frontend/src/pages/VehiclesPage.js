// src/frontend/src/pages/VehiclesPage.js

import React, { useState } from 'react';
import VehiclesList from '../components/Vehicles/VehiclesList';
import VehicleModal from '../components/Vehicles/VehicleModal';
import VehicleDetailModal from '../components/Vehicles/VehicleDetailModal';
import DeleteConfirmModal from '../components/common/DeleteConfirmModal';
import { useVehicles } from '../hooks/useVehicles';

const VehiclesPage = () => {
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
  const [viewingVehicle, setViewingVehicle] = useState(null);

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
  const handleSelectAll = (isSelected) => {
    try {
      if (isSelected) {
        selectAllVehicles();
      } else {
        clearSelection();
      }
    } catch (error) {
      console.error('Error selecting all vehicles:', error);
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

  // Handle view vehicle
  const handleViewVehicle = (vehicle) => {
    try {
      setViewingVehicle(vehicle);
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
    if (window.confirm(`${vehicle.brand} ${vehicle.model} (${vehicle.licensePlate}) aracını silmek istediğinizden emin misiniz?`)) {
      try {
        await deleteVehicle(vehicle.id);
        console.log('Vehicle deleted successfully');
      } catch (error) {
        console.error('Failed to delete vehicle:', error);
      }
    }
  };

  // Handle bulk delete
  const handleBulkDelete = async () => {
    if (selectedVehicles.length === 0) return;
    
    if (window.confirm(`${selectedCount} aracı silmek istediğinizden emin misiniz?`)) {
      try {
        await deleteSelectedVehicles();
        console.log('Bulk delete completed');
      } catch (error) {
        console.error('Bulk delete failed:', error);
      }
    }
  };

  // Handle save vehicle (create/edit)
  const handleSaveVehicle = async (vehicleData) => {
    try {
      console.log('Saving vehicle:', { editingVehicle, vehicleData });

      if (editingVehicle) {
        // Update
        const result = await updateVehicle(editingVehicle.id, vehicleData);
        console.log('Update result:', result);

        if (result.success) {
          console.log('✅ Vehicle updated successfully');
          handleCloseModal();
        }
      } else {
        // Create
        const result = await createVehicle(vehicleData);
        console.log('Create result:', result);

        if (result.success) {
          console.log('✅ Vehicle created successfully');
          handleCloseModal();
        }
      }
    } catch (error) {
      console.error('❌ Save vehicle failed:', error);
      throw error; // Re-throw to let modal handle the error
    }
  };

  // Handle export
  const handleExport = () => {
    exportVehicles();
  };

  // Handle close modal
  const handleCloseModal = () => {
    console.log('Closing modal');
    setShowNewVehicleModal(false);
    setEditingVehicle(null);
  };

  const handleCloseDetailModal = () => {
    setViewingVehicle(null);
  };

  // Handle delete from detail modal
  const handleDeleteFromDetail = async (vehicle) => {
    try {
      await deleteVehicle(vehicle.id);
      console.log('Vehicle deleted successfully from detail modal');
      handleCloseDetailModal(); // Close detail modal after delete
    } catch (error) {
      console.error('Failed to delete vehicle from detail modal:', error);
    }
  };

  // Handle edit from detail modal
  const handleEditFromDetail = (vehicle) => {
    setViewingVehicle(null); // Close detail modal
    setEditingVehicle(vehicle);
    setShowNewVehicleModal(true); // Open edit modal
  };

  return (
    <div className="vehicles-page">
      <div className="container-fluid">
        {/* Page Header */}
        <div className="row mb-4">
          <div className="col-12">
            <div className="page-header">
              <h2 className="page-title mb-2">Araçlar</h2>
              <p className="page-subtitle text-muted">
                Tüm araç kayıtlarını görüntüleyin ve yönetin
              </p>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="row mb-4">
            <div className="col-12">
              <div className="alert alert-danger alert-dismissible fade show" role="alert">
                <i className="bi bi-exclamation-triangle-fill me-2"></i>
                <strong>Hata!</strong> {error}
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={clearError}
                ></button>
              </div>
            </div>
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
                  onNewVehicle={() => setShowNewVehicleModal(true)}
                  onExport={handleExport}
                  onResetFilters={resetFilters}
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

        {/* Modals */}
        
        {/* New/Edit Vehicle Modal */}
        <VehicleModal
          show={showNewVehicleModal}
          onHide={handleCloseModal}
          onSave={handleSaveVehicle}
          vehicle={editingVehicle}
          loading={loading}
        />

        {/* Vehicle Detail Modal */}
        <VehicleDetailModal
          show={!!viewingVehicle}
          onHide={handleCloseDetailModal}
          vehicle={viewingVehicle}
          onEdit={handleEditFromDetail}
          onDelete={handleDeleteFromDetail}
          loading={loading}
        />
      </div>
    </div>
  );
};

export default VehiclesPage;