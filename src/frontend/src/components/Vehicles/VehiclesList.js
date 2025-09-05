// src/frontend/src/components/Vehicles/VehiclesList.js
import React, { useState } from 'react';
import VehicleFilters from './VehicleFilters';

const VehiclesList = ({
  vehicles = [],
  loading = false,
  pagination = {},
  filters = {},
  sorting = {},
  selectedVehicles = [],
  onPageChange,
  onFilterChange,
  onSortChange,
  onVehicleSelect,
  onSelectAll,
  onClearSelection,
  onViewVehicle,
  onEditVehicle,
  onDeleteVehicle,
  onBulkDelete
}) => {
  const [showFilters, setShowFilters] = useState(false);

  // Calculate selection states
  const isAllSelected = vehicles.length > 0 && selectedVehicles.length === vehicles.length;
  const isPartiallySelected = selectedVehicles.length > 0 && selectedVehicles.length < vehicles.length;

  /**
   * Handle sorting
   */
  const handleSort = (field) => {
    const newDirection = 
      sorting.field === field && sorting.direction === 'asc' ? 'desc' : 'asc';
    onSortChange(field, newDirection);
  };

  /**
   * Get sort button class
   */
  const getSortButtonClass = (field) => {
    const baseClasses = 'btn btn-sm btn-link text-decoration-none p-0 d-flex align-items-center';
    
    if (sorting.field === field) {
      return `${baseClasses} text-primary`;
    }
    
    return `${baseClasses} text-muted`;
  };

  /**
   * Get sort icon
   */
  const getSortIcon = (field) => {
    if (sorting.field !== field) {
      return 'bi-arrow-down-up';
    }
    
    return sorting.direction === 'asc' ? 'bi-sort-up' : 'bi-sort-down';
  };

  /**
   * Handle delete click
   */
  const handleDeleteClick = (vehicle) => {
    onDeleteVehicle(vehicle);
  };

  /**
   * Format date
   */
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('tr-TR');
  };

  /**
   * Get ownership type badge class
   */
  const getOwnershipTypeBadge = (ownershipType) => {
    switch (ownershipType?.toLowerCase()) {
      case 'company':
        return 'badge bg-primary';
      case 'rental':
        return 'badge bg-warning';
      default:
        return 'badge bg-secondary';
    }
  };

  /**
   * Get vehicle image or placeholder
   */
  const getVehicleImage = (vehicle) => {
    if (vehicle.vehicleImageUrl) {
      return (
        <img 
          src={vehicle.vehicleImageUrl} 
          alt={`${vehicle.brand} ${vehicle.model}`}
          className="rounded"
          style={{ width: '60px', height: '40px', objectFit: 'cover' }}
          onError={(e) => {
            e.target.style.display = 'none';
            e.target.nextSibling.style.display = 'flex';
          }}
        />
      );
    }
    
    return (
      <div 
        className="bg-light rounded d-flex align-items-center justify-content-center"
        style={{ width: '60px', height: '40px' }}
      >
        <i className="bi bi-car-front text-muted"></i>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Yükleniyor...</span>
        </div>
        <span className="ms-3 text-muted">Araçlar yükleniyor...</span>
      </div>
    );
  }

  return (
    <div className="vehicles-list">
      {/* Filters and Actions */}
      <div className="row mb-3">
        <div className="col-md-8">
          <div className="d-flex flex-wrap gap-2">
            <button
              className={`btn btn-outline-secondary btn-sm ${showFilters ? 'active' : ''}`}
              onClick={() => setShowFilters(!showFilters)}
            >
              <i className={`bi ${showFilters ? 'bi-funnel-fill' : 'bi-funnel'} me-1`}></i>
              Filtreler
              {Object.values(filters).some(v => v && v.toString().trim()) && (
                <span className="badge bg-primary ms-1">
                  {Object.values(filters).filter(v => v && v.toString().trim()).length}
                </span>
              )}
            </button>
            
            <button
              className="btn btn-outline-secondary btn-sm"
              onClick={() => window.location.reload()}
            >
              <i className="bi bi-arrow-clockwise me-1"></i>
              Yenile
            </button>
          </div>
        </div>
        
        <div className="col-md-4 text-end">
          <div className="btn-group btn-group-sm">
            <button className="btn btn-outline-secondary active">
              <i className="bi bi-list me-1"></i>Liste
            </button>
            <button className="btn btn-outline-secondary" disabled>
              <i className="bi bi-grid me-1"></i>Kart
            </button>
          </div>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="card mb-3">
          <div className="card-body">
            <VehicleFilters
              filters={filters}
              onFiltersChange={onFilterChange}
              onClearFilters={() => onFilterChange({})}
            />
            <div className="text-end">
              <button
                className="btn btn-outline-secondary btn-sm"
                onClick={() => setShowFilters(false)}
              >
                <i className="bi bi-x me-1"></i>
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Table Header Info */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div className="text-muted small">
          Toplam {pagination.totalCount || 0} araç
          {selectedVehicles.length > 0 && (
            <span className="ms-2 text-primary">
              ({selectedVehicles.length} seçili)
            </span>
          )}
        </div>
        {selectedVehicles.length > 0 && (
          <div className="d-flex gap-2">
            <button 
              className="btn btn-sm btn-outline-secondary"
              onClick={onClearSelection}
            >
              <i className="bi bi-x-circle me-1"></i>
              Seçimi Temizle
            </button>
            <button 
              className="btn btn-sm btn-outline-danger"
              onClick={onBulkDelete}
            >
              <i className="bi bi-trash me-1"></i>
              Seçilenleri Sil ({selectedVehicles.length})
            </button>
          </div>
        )}
      </div>

      {/* Vehicles Table */}
      <div className="table-responsive">
        <table className="table table-hover">
          <thead>
            <tr>
              <th style={{ width: '40px' }}>
                <div className="form-check">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    checked={isAllSelected}
                    ref={input => {
                      if (input) input.indeterminate = isPartiallySelected;
                    }}
                    onChange={(e) => onSelectAll(e.target.checked)}
                  />
                </div>
              </th>
              <th style={{ width: '80px' }}>
                <span>Resim</span>
              </th>
              <th style={{ width: '120px' }}>
                <button 
                  className={getSortButtonClass('licensePlate')}
                  onClick={() => handleSort('licensePlate')}
                  title="Plakaya göre sırala"
                >
                  Plaka
                  <i className={`bi ${getSortIcon('licensePlate')} ms-1`}></i>
                </button>
              </th>
              <th style={{ width: '150px' }}>
                <button 
                  className={getSortButtonClass('brand')}
                  onClick={() => handleSort('brand')}
                  title="Markaya göre sırala"
                >
                  Marka/Model
                  <i className={`bi ${getSortIcon('brand')} ms-1`}></i>
                </button>
              </th>
              <th style={{ width: '80px' }}>
                <button 
                  className={getSortButtonClass('year')}
                  onClick={() => handleSort('year')}
                  title="Yıla göre sırala"
                >
                  Yıl
                  <i className={`bi ${getSortIcon('year')} ms-1`}></i>
                </button>
              </th>
              <th style={{ width: '140px' }}>
                <button 
                  className={getSortButtonClass('companyName')}
                  onClick={() => handleSort('companyName')}
                  title="Şirkete göre sırala"
                >
                  Şirket
                  <i className={`bi ${getSortIcon('companyName')} ms-1`}></i>
                </button>
              </th>
              <th style={{ width: '100px' }}>
                <button 
                  className={getSortButtonClass('ownershipType')}
                  onClick={() => handleSort('ownershipType')}
                  title="Sahiplik türüne göre sırala"
                >
                  Sahiplik
                  <i className={`bi ${getSortIcon('ownershipType')} ms-1`}></i>
                </button>
              </th>
              <th style={{ width: '120px' }}>
                <span>Atanan Kullanıcı</span>
              </th>
              <th style={{ width: '90px' }}>
                <span>Kilometre</span>
              </th>
              <th style={{ width: '100px' }}>İşlemler</th>
            </tr>
          </thead>
          <tbody>
            {vehicles.map((vehicle) => (
              <tr key={vehicle.id} className="align-middle">
                <td>
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      checked={selectedVehicles.includes(vehicle.id)}
                      onChange={(e) => onVehicleSelect(vehicle.id, e.target.checked)}
                    />
                  </div>
                </td>
                
                <td>
                  {getVehicleImage(vehicle)}
                  <div 
                    className="bg-light rounded align-items-center justify-content-center"
                    style={{ width: '60px', height: '40px', display: 'none' }}
                  >
                    <i className="bi bi-car-front text-muted"></i>
                  </div>
                </td>
                
                <td>
                  <strong className="text-primary">{vehicle.licensePlate}</strong>
                </td>
                
                <td>
                  <div>
                    <strong>{vehicle.brand}</strong>
                    <br />
                    <small className="text-muted">{vehicle.model}</small>
                  </div>
                </td>
                
                <td>
                  <span className="badge bg-light text-dark">{vehicle.year}</span>
                </td>
                
                <td>
                  <span title={vehicle.companyName}>
                    {vehicle.companyName && vehicle.companyName.length > 15 
                      ? vehicle.companyName.substring(0, 15) + '...'
                      : vehicle.companyName || '-'}
                  </span>
                </td>
                
                <td>
                  <span className={getOwnershipTypeBadge(vehicle.ownershipType)}>
                    {vehicle.ownershipType === 'company' ? 'Şirket' : 
                     vehicle.ownershipType === 'rental' ? 'Kiralama' : 
                     vehicle.ownershipType || '-'}
                  </span>
                </td>
                
                <td>
                  <div>
                    <div className="fw-medium">{vehicle.assignedUserName || '-'}</div>
                    {vehicle.assignedUserPhone && (
                      <small className="text-muted">{vehicle.assignedUserPhone}</small>
                    )}
                  </div>
                </td>
                
                <td>
                  <span className="badge bg-info">
                    {vehicle.currentMileage?.toLocaleString('tr-TR') || '0'} km
                  </span>
                </td>
                
                <td>
                  <div className="dropdown">
                    <button 
                      className="btn btn-sm btn-outline-secondary dropdown-toggle"
                      type="button"
                      data-bs-toggle="dropdown"
                      aria-expanded="false"
                    >
                      <i className="bi bi-three-dots-vertical"></i>
                    </button>
                    <ul className="dropdown-menu">
                      <li>
                        <button className="dropdown-item" onClick={() => onViewVehicle(vehicle)}>
                          <i className="bi bi-eye me-2"></i>Detayları Gör
                        </button>
                      </li>
                      <li>
                        <button className="dropdown-item" onClick={() => onEditVehicle(vehicle)}>
                          <i className="bi bi-pencil me-2"></i>Düzenle
                        </button>
                      </li>
                      <li><hr className="dropdown-divider" /></li>
                      <li>
                        <button 
                          className="dropdown-item text-danger" 
                          onClick={() => handleDeleteClick(vehicle)}
                        >
                          <i className="bi bi-trash me-2"></i>Sil
                        </button>
                      </li>
                    </ul>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Empty State */}
      {!loading && vehicles.length === 0 && (
        <div className="text-center py-5">
          <i className="bi bi-car-front display-4 text-muted mb-3"></i>
          <h5 className="text-muted mb-2">Araç bulunamadı</h5>
          <p className="text-muted mb-3">
            {Object.values(filters).some(v => v && v.toString().trim()) 
              ? 'Filtrelere uygun araç bulunamadı. Filtreleri temizleyerek tekrar deneyin.'
              : 'Henüz hiç araç eklenmemiş. İlk aracınızı eklemek için yukarıdaki butonu kullanın.'}
          </p>
          {Object.values(filters).some(v => v && v.toString().trim()) && (
            <button
              className="btn btn-outline-secondary"
              onClick={() => onFilterChange({})}
            >
              <i className="bi bi-funnel me-1"></i>
              Filtreleri Temizle
            </button>
          )}
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="d-flex justify-content-between align-items-center mt-4">
          <div className="text-muted small">
            Sayfa {pagination.currentPage} / {pagination.totalPages}
            ({pagination.totalCount} toplam kayıt)
          </div>
          <nav>
            <ul className="pagination pagination-sm mb-0">
              <li className={`page-item ${pagination.currentPage <= 1 ? 'disabled' : ''}`}>
                <button 
                  className="page-link"
                  onClick={() => onPageChange(1)}
                  disabled={pagination.currentPage <= 1}
                >
                  <i className="bi bi-chevron-double-left"></i>
                </button>
              </li>
              <li className={`page-item ${pagination.currentPage <= 1 ? 'disabled' : ''}`}>
                <button 
                  className="page-link"
                  onClick={() => onPageChange(pagination.currentPage - 1)}
                  disabled={pagination.currentPage <= 1}
                >
                  <i className="bi bi-chevron-left"></i>
                </button>
              </li>
              
              {/* Page numbers */}
              {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                let pageNum;
                if (pagination.totalPages <= 5) {
                  pageNum = i + 1;
                } else if (pagination.currentPage <= 3) {
                  pageNum = i + 1;
                } else if (pagination.currentPage >= pagination.totalPages - 2) {
                  pageNum = pagination.totalPages - 4 + i;
                } else {
                  pageNum = pagination.currentPage - 2 + i;
                }
                
                return (
                  <li 
                    key={pageNum}
                    className={`page-item ${pagination.currentPage === pageNum ? 'active' : ''}`}
                  >
                    <button 
                      className="page-link"
                      onClick={() => onPageChange(pageNum)}
                    >
                      {pageNum}
                    </button>
                  </li>
                );
              })}
              
              <li className={`page-item ${pagination.currentPage >= pagination.totalPages ? 'disabled' : ''}`}>
                <button 
                  className="page-link"
                  onClick={() => onPageChange(pagination.currentPage + 1)}
                  disabled={pagination.currentPage >= pagination.totalPages}
                >
                  <i className="bi bi-chevron-right"></i>
                </button>
              </li>
              <li className={`page-item ${pagination.currentPage >= pagination.totalPages ? 'disabled' : ''}`}>
                <button 
                  className="page-link"
                  onClick={() => onPageChange(pagination.totalPages)}
                  disabled={pagination.currentPage >= pagination.totalPages}
                >
                  <i className="bi bi-chevron-double-right"></i>
                </button>
              </li>
            </ul>
          </nav>
        </div>
      )}
    </div>
  );
};

export default VehiclesList;