// src/frontend/src/components/Vehicles/VehiclesList.js

import React, { useState } from 'react';

const VehiclesList = ({
  vehicles = [],
  loading = false,
  pagination = {},
  filters = {},
  sorting = {},
  selectedVehicles = [],
  onPageChange,
  onFilterChange,
  onSort,
  onSelectVisitor,
  onSelectAll,
  onClearSelection,
  onViewVisitor,
  onEditVisitor,
  onDeleteVisitor,
  onBulkDelete,
  onNewVisitor,
  onExport,
  onResetFilters,
  hasFilters = false,
  isEmpty = false,
  selectedCount = 0,
  isAllSelected = false,
  filterSummary = ''
}) => {
  const [showFilters, setShowFilters] = useState(false);
  const [localFilters, setLocalFilters] = useState({
    fromDate: filters.fromDate || '',
    toDate: filters.toDate || '',
    brand: filters.brand || '',
    model: filters.model || '',
    licensePlate: filters.licensePlate || '',
    companyName: filters.companyName || '',
    ownershipType: filters.ownershipType || ''
  });

  // Handle local filter change
  const handleLocalFilterChange = (field, value) => {
    setLocalFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Apply filters
  const handleApplyFilters = () => {
    if (onFilterChange) {
      onFilterChange(localFilters);
    }
    setShowFilters(false);
  };

  // Reset filters
  const handleResetFilters = () => {
    const defaultFilters = {
      fromDate: '',
      toDate: '',
      brand: '',
      model: '',
      licensePlate: '',
      companyName: '',
      ownershipType: '',
      sortBy: 'createdAt',
      sortOrder: 'desc'
    };
    setLocalFilters(defaultFilters);
    if (onResetFilters) {
      onResetFilters();
    }
  };

  // Handle delete click
  const handleDeleteClick = (vehicle) => {
    if (onDeleteVisitor) {
      onDeleteVisitor(vehicle);
    }
  };

  // Handle sort - Visitors benzeri
  const handleSort = (column) => {
    console.log('Sorting by:', column, 'Current sort:', filters.sortBy, filters.sortOrder);
    
    // Aynı kolona tıklandığında sıralama yönünü değiştir
    const newOrder = filters.sortBy === column && filters.sortOrder === 'desc' ? 'asc' : 'desc';
    
    if (onSort) {
      onSort(column, newOrder);
    }
  };

  // Get sort icon helper function - Visitors benzeri
  const getSortIcon = (column) => {
    if (filters.sortBy !== column) {
      return 'bi-arrow-down-up'; // Default icon when column is not sorted
    }
    return filters.sortOrder === 'desc' ? 'bi-arrow-down' : 'bi-arrow-up';
  };

  // Get sort button class helper - Visitors benzeri
  const getSortButtonClass = (column) => {
    const baseClass = "btn btn-link text-decoration-none p-0 fw-medium d-flex align-items-center";
    const activeClass = filters.sortBy === column ? "text-primary" : "text-dark";
    return `${baseClass} ${activeClass}`;
  };

  // Format date display
  const formatDisplayDate = (dateString) => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('tr-TR');
    } catch {
      return dateString;
    }
  };

  // Get ownership type badge class
  const getOwnershipTypeBadge = (type) => {
    switch (type) {
      case 'company': return 'bg-success';
      case 'rental': return 'bg-warning';
      case 'personal': return 'bg-info';
      default: return 'bg-secondary';
    }
  };

  // Get ownership type text
  const getOwnershipTypeText = (type) => {
    switch (type) {
      case 'company': return 'Şirket';
      case 'rental': return 'Kiralık';
      case 'personal': return 'Kişisel';
      default: return type || 'Belirtilmemiş';
    }
  };

  // Loading state - Visitors benzeri
  if (loading && (!vehicles || vehicles.length === 0)) {
    return (
      <div className="d-flex justify-content-center align-items-center py-5">
        <div className="text-center">
          <div className="spinner-border text-danger mb-3">
            <span className="visually-hidden">Yükleniyor...</span>
          </div>
          <p className="text-muted">Araçlar yükleniyor...</p>
        </div>
      </div>
    );
  }

  // Empty state - Visitors benzeri
  if (!loading && (!vehicles || vehicles.length === 0)) {
    return (
      <div className="text-center py-5">
        <div className="mb-4">
          <i className="bi bi-car-front display-1 text-muted"></i>
        </div>
        <h5 className="text-muted mb-3">
          {hasFilters ? 'Filtrelere uygun araç bulunamadı' : 'Henüz araç kaydı bulunmuyor'}
        </h5>
        <p className="text-muted">
          {hasFilters 
            ? 'Filtre kriterlerinizi değiştirmeyi deneyin.' 
            : 'İlk araç kaydınızı oluşturmak için "Yeni Araç" butonunu kullanın.'
          }
        </p>
        {hasFilters && (
          <button className="btn btn-outline-secondary" onClick={handleResetFilters}>
            <i className="bi bi-arrow-clockwise me-1"></i>
            Filtreleri Temizle
          </button>
        )}
      </div>
    );
  }

  return (
    <>
      {/* Header with Actions - Visitors benzeri */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <p className="text-muted mb-0 small">
            {filterSummary && (
              <span className="ms-2 text-info">
                ({filterSummary})
              </span>
            )}
          </p>
        </div>
        <div className="d-flex gap-2">
          <button 
            className="btn btn-outline-secondary btn-sm"
            onClick={() => setShowFilters(!showFilters)}
          >
            <i className="bi bi-funnel me-1"></i>
            Filtrele
            {hasFilters && <span className="badge bg-danger ms-1 rounded-pill">!</span>}
          </button>
          <button 
            className="btn btn-outline-secondary btn-sm"
            onClick={onExport}
          >
            <i className="bi bi-download me-1"></i>
            Excel
          </button>
          <button 
            className="btn btn-danger btn-sm"
            onClick={onNewVisitor}
          >
            <i className="bi bi-plus-lg me-1"></i>
            Yeni Araç
          </button>
        </div>
      </div>

      {/* Filter Panel - Visitors benzeri */}
      {showFilters && (
        <div className="card mb-4">
          <div className="card-body">
            <div className="row">
              <div className="col-md-3">
                <label className="form-label small">Marka</label>
                <input
                  type="text"
                  className="form-control form-control-sm"
                  value={localFilters.brand}
                  onChange={(e) => handleLocalFilterChange('brand', e.target.value)}
                  placeholder="Marka girin"
                />
              </div>
              <div className="col-md-3">
                <label className="form-label small">Model</label>
                <input
                  type="text"
                  className="form-control form-control-sm"
                  value={localFilters.model}
                  onChange={(e) => handleLocalFilterChange('model', e.target.value)}
                  placeholder="Model girin"
                />
              </div>
              <div className="col-md-3">
                <label className="form-label small">Plaka</label>
                <input
                  type="text"
                  className="form-control form-control-sm"
                  value={localFilters.licensePlate}
                  onChange={(e) => handleLocalFilterChange('licensePlate', e.target.value)}
                  placeholder="34 ABC 123"
                />
              </div>
              <div className="col-md-3">
                <label className="form-label small">Şirket</label>
                <input
                  type="text"
                  className="form-control form-control-sm"
                  value={localFilters.companyName}
                  onChange={(e) => handleLocalFilterChange('companyName', e.target.value)}
                  placeholder="Şirket adı"
                />
              </div>
            </div>
            <div className="row mt-3">
              <div className="col-md-3">
                <label className="form-label small">Sahiplik Türü</label>
                <select
                  className="form-select form-select-sm"
                  value={localFilters.ownershipType}
                  onChange={(e) => handleLocalFilterChange('ownershipType', e.target.value)}
                >
                  <option value="">Tümü</option>
                  <option value="company">Şirket</option>
                  <option value="rental">Kiralık</option>
                  <option value="personal">Kişisel</option>
                </select>
              </div>
              <div className="col-md-9 d-flex align-items-end">
                <div className="d-flex gap-2">
                  <button 
                    className="btn btn-primary btn-sm"
                    onClick={handleApplyFilters}
                  >
                    <i className="bi bi-search me-1"></i>
                    Filtrele
                  </button>
                  <button 
                    className="btn btn-outline-secondary btn-sm"
                    onClick={handleResetFilters}
                  >
                    <i className="bi bi-arrow-clockwise me-1"></i>
                    Temizle
                  </button>
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
          </div>
        </div>
      )}

      {/* Table Header Info - Visitors benzeri */}
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

      {/* Vehicles Table - Visitors benzeri */}
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
                    onChange={onSelectAll}
                  />
                </div>
              </th>
              <th>
                <button 
                  className={getSortButtonClass('licensePlate')}
                  onClick={() => handleSort('licensePlate')}
                  title="Plakaya göre sırala"
                >
                  Plaka
                  <i className={`bi ms-1 ${getSortIcon('licensePlate')}`}></i>
                </button>
              </th>
              <th>
                <button 
                  className={getSortButtonClass('brand')}
                  onClick={() => handleSort('brand')}
                  title="Markaya göre sırala"
                >
                  Marka
                  <i className={`bi ms-1 ${getSortIcon('brand')}`}></i>
                </button>
              </th>
              <th>
                <button 
                  className={getSortButtonClass('model')}
                  onClick={() => handleSort('model')}
                  title="Modele göre sırala"
                >
                  Model
                  <i className={`bi ms-1 ${getSortIcon('model')}`}></i>
                </button>
              </th>
              <th>
                <button 
                  className={getSortButtonClass('year')}
                  onClick={() => handleSort('year')}
                  title="Yıla göre sırala"
                >
                  Yıl
                  <i className={`bi ms-1 ${getSortIcon('year')}`}></i>
                </button>
              </th>
              <th>
                <button 
                  className={getSortButtonClass('companyName')}
                  onClick={() => handleSort('companyName')}
                  title="Şirkete göre sırala"
                >
                  Şirket
                  <i className={`bi ms-1 ${getSortIcon('companyName')}`}></i>
                </button>
              </th>
              <th>Durum</th>
              <th style={{ width: '140px' }}>İşlemler</th>
            </tr>
          </thead>
          <tbody>
            {vehicles.map((vehicle) => (
              <tr key={vehicle.id}>
                <td>
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      checked={selectedVehicles.includes(vehicle.id)}
                      onChange={() => onSelectVisitor(vehicle.id)}
                    />
                  </div>
                </td>
                <td>
                  <span className="fw-bold text-primary">{vehicle.licensePlate}</span>
                </td>
                <td>
                  <span className="fw-medium">{vehicle.brand}</span>
                </td>
                <td>
                  <span>{vehicle.model}</span>
                </td>
                <td>
                  <span className="small text-muted">{vehicle.year}</span>
                </td>
                <td>
                  <span className="small">{vehicle.companyName}</span>
                </td>
                <td>
                  <span className={`badge ${getOwnershipTypeBadge(vehicle.ownershipType)}`}>
                    {getOwnershipTypeText(vehicle.ownershipType)}
                  </span>
                </td>
                <td>
                  {/* Actions Dropdown - Visitors benzeri */}
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
                        <button className="dropdown-item" onClick={() => onViewVisitor(vehicle)}>
                          <i className="bi bi-eye me-2"></i>Detayları Gör
                        </button>
                      </li>
                      <li>
                        <button className="dropdown-item" onClick={() => onEditVisitor(vehicle)}>
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

      {/* Pagination - Visitors benzeri */}
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
              {[...Array(Math.min(5, pagination.totalPages))].map((_, index) => {
                let pageNum;
                if (pagination.totalPages <= 5) {
                  pageNum = index + 1;
                } else if (pagination.currentPage <= 3) {
                  pageNum = index + 1;
                } else if (pagination.currentPage >= pagination.totalPages - 2) {
                  pageNum = pagination.totalPages - 4 + index;
                } else {
                  pageNum = pagination.currentPage - 2 + index;
                }

                return (
                  <li key={pageNum} className={`page-item ${pagination.currentPage === pageNum ? 'active' : ''}`}>
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
    </>
  );
};

export default VehiclesList; 