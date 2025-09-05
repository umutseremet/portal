// src/frontend/src/pages/VehiclesPage.js
import React, { useState, useEffect } from 'react';
import VehiclesList from '../components/Vehicles/VehiclesList';
import VehicleDetail from '../components/Vehicles/VehicleDetail';
import VehicleForm from '../components/Vehicles/VehicleForm';
import DeleteConfirmModal from '../components/common/DeleteConfirmModal';
import { vehicleService } from '../services/vehicleService';
import { showAlert } from '../utils/alertUtils';

const VehiclesPage = () => {
  // State management
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedVehicles, setSelectedVehicles] = useState([]);
  const [currentView, setCurrentView] = useState('list'); // 'list', 'detail', 'create', 'edit'
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  
  // Pagination and filtering
  const [pagination, setPagination] = useState({
    currentPage: 1,
    pageSize: 10,
    totalCount: 0,
    totalPages: 0
  });
  
  const [filters, setFilters] = useState({
    search: '',
    brand: '',
    companyName: '',
    ownershipType: '',
    licensePlate: ''
  });
  
  const [sorting, setSorting] = useState({
    field: 'createdAt',
    direction: 'desc'
  });

  // Modal states
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [vehicleToDelete, setVehicleToDelete] = useState(null);

  // Load vehicles on component mount and when dependencies change
  useEffect(() => {
    loadVehicles();
  }, [pagination.currentPage, pagination.pageSize, filters, sorting]);

  /**
   * Load vehicles from API
   */
  const loadVehicles = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const params = {
        page: pagination.currentPage,
        pageSize: pagination.pageSize,
        ...filters,
        sortBy: sorting.field,
        sortDirection: sorting.direction
      };
      
      const response = await vehicleService.getVehicles(params);
      
      setVehicles(response.data);
      setPagination(prev => ({
        ...prev,
        totalCount: response.totalCount,
        totalPages: response.totalPages
      }));
      
    } catch (error) {
      console.error('Error loading vehicles:', error);
      setError('Araç verileri yüklenirken hata oluştu.');
      showAlert('Araç verileri yüklenirken hata oluştu.', 'error');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle page changes
   */
  const handlePageChange = (newPage) => {
    setPagination(prev => ({
      ...prev,
      currentPage: newPage
    }));
  };

  /**
   * Handle filter changes
   */
  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    setPagination(prev => ({
      ...prev,
      currentPage: 1 // Reset to first page when filtering
    }));
  };

  /**
   * Handle sorting changes
   */
  const handleSortChange = (field, direction) => {
    setSorting({ field, direction });
  };

  /**
   * Handle vehicle selection
   */
  const handleVehicleSelect = (vehicleId, isSelected) => {
    setSelectedVehicles(prev => 
      isSelected 
        ? [...prev, vehicleId]
        : prev.filter(id => id !== vehicleId)
    );
  };

  /**
   * Handle select all vehicles
   */
  const handleSelectAll = (isSelected) => {
    setSelectedVehicles(isSelected ? vehicles.map(v => v.id) : []);
  };

  /**
   * Clear selection
   */
  const handleClearSelection = () => {
    setSelectedVehicles([]);
  };

  /**
   * View vehicle details
   */
  const handleViewVehicle = (vehicle) => {
    setSelectedVehicle(vehicle);
    setCurrentView('detail');
  };

  /**
   * Edit vehicle
   */
  const handleEditVehicle = (vehicle) => {
    setSelectedVehicle(vehicle);
    setCurrentView('edit');
  };

  /**
   * Create new vehicle
   */
  const handleCreateVehicle = () => {
    setSelectedVehicle(null);
    setCurrentView('create');
  };

  /**
   * Delete single vehicle
   */
  const handleDeleteVehicle = (vehicle) => {
    setVehicleToDelete(vehicle);
    setShowDeleteModal(true);
  };

  /**
   * Bulk delete vehicles
   */
  const handleBulkDelete = async () => {
    if (selectedVehicles.length === 0) return;
    
    try {
      await vehicleService.deleteMultipleVehicles(selectedVehicles);
      showAlert(`${selectedVehicles.length} araç başarıyla silindi.`, 'success');
      setSelectedVehicles([]);
      loadVehicles(); // Reload the list
    } catch (error) {
      console.error('Error bulk deleting vehicles:', error);
      showAlert('Araçlar silinirken hata oluştu.', 'error');
    }
  };

  /**
   * Confirm delete vehicle
   */
  const confirmDeleteVehicle = async () => {
    if (!vehicleToDelete) return;
    
    try {
      await vehicleService.deleteVehicle(vehicleToDelete.id);
      showAlert('Araç başarıyla silindi.', 'success');
      setShowDeleteModal(false);
      setVehicleToDelete(null);
      loadVehicles(); // Reload the list
    } catch (error) {
      console.error('Error deleting vehicle:', error);
      showAlert('Araç silinirken hata oluştu.', 'error');
    }
  };

  /**
   * Handle vehicle form submission (create/edit)
   */
  const handleVehicleFormSubmit = async (vehicleData) => {
    try {
      if (currentView === 'create') {
        await vehicleService.createVehicle(vehicleData);
        showAlert('Araç başarıyla eklendi.', 'success');
      } else if (currentView === 'edit') {
        await vehicleService.updateVehicle(selectedVehicle.id, vehicleData);
        showAlert('Araç başarıyla güncellendi.', 'success');
      }
      
      setCurrentView('list');
      setSelectedVehicle(null);
      loadVehicles(); // Reload the list
    } catch (error) {
      console.error('Error saving vehicle:', error);
      showAlert('Araç kaydedilirken hata oluştu.', 'error');
    }
  };

  /**
   * Go back to list view
   */
  const handleBackToList = () => {
    setCurrentView('list');
    setSelectedVehicle(null);
  };

  // Render different views based on current view state
  if (currentView === 'detail' && selectedVehicle) {
    return (
      <VehicleDetail
        vehicle={selectedVehicle}
        onBack={handleBackToList}
        onEdit={() => handleEditVehicle(selectedVehicle)}
        onDelete={() => handleDeleteVehicle(selectedVehicle)}
      />
    );
  }

  if (currentView === 'create' || currentView === 'edit') {
    return (
      <VehicleForm
        vehicle={currentView === 'edit' ? selectedVehicle : null}
        onSubmit={handleVehicleFormSubmit}
        onCancel={handleBackToList}
        isEditing={currentView === 'edit'}
      />
    );
  }

  // Default list view
  return (
    <div className="vehicles-page">
      {/* Page Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h3 text-gray-800">Araç Takip</h1>
          <p className="text-muted mb-0">
            Araç filosunu yönetin, detayları görüntüleyin ve takip edin
          </p>
        </div>
        <button
          className="btn btn-primary"
          onClick={handleCreateVehicle}
          disabled={loading}
        >
          <i className="bi bi-plus-circle me-2"></i>
          Yeni Araç Ekle
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="alert alert-danger alert-dismissible fade show" role="alert">
          <i className="bi bi-exclamation-triangle me-2"></i>
          {error}
          <button
            type="button"
            className="btn-close"
            onClick={() => setError(null)}
          ></button>
        </div>
      )}

      {/* Vehicles List */}
      <VehiclesList
        vehicles={vehicles}
        loading={loading}
        pagination={pagination}
        filters={filters}
        sorting={sorting}
        selectedVehicles={selectedVehicles}
        onPageChange={handlePageChange}
        onFilterChange={handleFilterChange}
        onSortChange={handleSortChange}
        onVehicleSelect={handleVehicleSelect}
        onSelectAll={handleSelectAll}
        onClearSelection={handleClearSelection}
        onViewVehicle={handleViewVehicle}
        onEditVehicle={handleEditVehicle}
        onDeleteVehicle={handleDeleteVehicle}
        onBulkDelete={handleBulkDelete}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        show={showDeleteModal}
        title="Araç Sil"
        message={
          vehicleToDelete
            ? `"${vehicleToDelete.brand} ${vehicleToDelete.model} (${vehicleToDelete.licensePlate})" aracını silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.`
            : ''
        }
        onConfirm={confirmDeleteVehicle}
        onCancel={() => {
          setShowDeleteModal(false);
          setVehicleToDelete(null);
        }}
        loading={loading}
      />
    </div>
  );
};

export default VehiclesPage;