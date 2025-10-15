// src/frontend/src/pages/VehiclesPage.js
// Excel Import için refresh özelliği eklenmiş

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

  // YENİ - Refresh function for Excel import
  const handleRefresh = () => {
    loadVehicles();
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

  // Handle close detail modal
  const handleCloseDetailModal = () => {
    setViewingVehicle(null);
  };

  // Handle edit from detail
  const handleEditFromDetail = () => {
    setEditingVehicle(viewingVehicle);
    setViewingVehicle(null);
    setShowNewVehicleModal(true);
  };

  // Handle delete from detail
  const handleDeleteFromDetail = async () => {
    try {
      await handleDeleteVehicle(viewingVehicle);
      setViewingVehicle(null);
    } catch (error) {
      console.error('Error deleting from detail:', error);
    }
  };

  // Handle export
  const handleExport = async () => {
    try {
      await exportVehicles();
    } catch (error) {
      console.error('Error exporting:', error);
    }
  };

  return (
    <div className="container-fluid py-4">
      <div className="row">
        <div className="col-12">
          {/* Page Header */}
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h2 className="mb-1">Araç Yönetimi</h2>
              <p className="text-muted mb-0">
                Araç filosunu yönetin ve takip edin
              </p>
            </div>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="row mb-4">
              <div className="col-12">
                <div className="alert alert-danger alert-dismissible fade show">
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
    </div>
  );
};

export default VehiclesPage;