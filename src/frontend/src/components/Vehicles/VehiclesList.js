// src/frontend/src/components/Vehicles/VehiclesList.js
// ✅ DÜZELT İLMİŞ VERSİYON - Tüm prop isimleri doğru

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
  onSelectVehicle,      // ✅ DÜZELTME
  onSelectAll,
  onClearSelection,
  onViewVehicle,        // ✅ DÜZELTME
  onEditVehicle,        // ✅ DÜZELTME
  onDeleteVehicle,      // ✅ DÜZELTME
  onBulkDelete,
  onNewVehicle,         // ✅ DÜZELTME
  onExport,
  onResetFilters,
  hasFilters = false,
  isEmpty = false,
  selectedCount = 0,
  isAllSelected = false,
  filterSummary = {}
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
    if (onDeleteVehicle) {  // ✅ DÜZELTME
      onDeleteVehicle(vehicle);
    }
  };

  // Handle sort
  const handleSort = (column) => {
    console.log('Sorting by:', column, 'Current sort:', filters.sortBy, filters.sortOrder);
    const newOrder = filters.sortBy === column && filters.sortOrder === 'desc' ? 'asc' : 'desc';
    if (onSort) {
      onSort(column, newOrder);
    }
  };

  // Get sort icon helper function
  const getSortIcon = (column) => {
    if (filters.sortBy !== column) {
      return 'bi-arrow-down-up';
    }
    return filters.sortOrder === 'desc' ? 'bi-arrow-down' : 'bi-arrow-up';
  };

  // Get sort button class helper
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

  // Loading state
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

  // Empty state
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
      {/* Header with Actions */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          {/* Sol taraf boş */}
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
            onClick={onNewVehicle}  // ✅ DÜZELTME
          >
            <i className="bi bi-plus-lg me-1"></i>
            Yeni Araç
          </button>
        </div>
      </div>

      {/* Filter Panel */}
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
                  placeholder="Toyota, BMW..."
                />
              </div>
              <div className="col-md-3">
                <label className="form-label small">Model</label>
                <input
                  type="text"
                  className="form-control form-control-sm"
                  value={localFilters.model}
                  onChange={(e) => handleLocalFilterChange('model', e.target.value)}
                  placeholder="Corolla, X5..."
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
                <label className="form-label small">Mülkiyet Tipi</label>
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
              <div className="col-md-9">
                <div className="d-flex gap-2 align-items-end h-100">
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

      <div className="d-flex justify-content-between align-items-center mb-3">
        <div className="text-muted small">
          Toplam {pagination.totalCount || vehicles.length} araç
          {selectedVehicles.length > 0 && (
            <span className="ms-2 text-primary">
              ({selectedVehicles.length} seçili)
            </span>
          )}
        </div>
      </div>

      {/* Vehicles Table */}
      <div className="table-responsive">
        <table className="table table-hover">
          <thead>
            <tr>
              <th width="50">
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
                >
                  Plaka
                  <i className={`bi ${getSortIcon('licensePlate')} ms-1`}></i>
                </button>
              </th>
              <th>
                <button
                  className={getSortButtonClass('brand')}
                  onClick={() => handleSort('brand')}
                >
                  Marka/Model
                  <i className={`bi ${getSortIcon('brand')} ms-1`}></i>
                </button>
              </th>
              <th>
                <button
                  className={getSortButtonClass('year')}
                  onClick={() => handleSort('year')}
                >
                  Yıl
                  <i className={`bi ${getSortIcon('year')} ms-1`}></i>
                </button>
              </th>
              <th>
                <button
                  className={getSortButtonClass('companyName')}
                  onClick={() => handleSort('companyName')}
                >
                  Şirket
                  <i className={`bi ${getSortIcon('companyName')} ms-1`}></i>
                </button>
              </th>
              <th>Atanan Kullanıcı</th>
              <th>
                <button
                  className={getSortButtonClass('currentMileage')}
                  onClick={() => handleSort('currentMileage')}
                >
                  Kilometre
                  <i className={`bi ${getSortIcon('currentMileage')} ms-1`}></i>
                </button>
              </th>
              <th>
                <button
                  className={getSortButtonClass('createdAt')}
                  onClick={() => handleSort('createdAt')}
                >
                  Kayıt Tarihi
                  <i className={`bi ${getSortIcon('createdAt')} ms-1`}></i>
                </button>
              </th>
              <th width="120">İşlemler</th>
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
                      onChange={() => onSelectVehicle?.(vehicle.id)}  // ✅ DÜZELTME
                    />
                  </div>
                </td>
                <td>
                  <span className="fw-bold text-primary">{vehicle.licensePlate}</span>
                </td>
                <td>
                  <div>
                    <div className="fw-medium">{vehicle.brand} {vehicle.model}</div>
                  </div>
                </td>
                <td>{vehicle.year || '-'}</td>
                <td>
                  <span className="badge bg-light text-dark">
                    {vehicle.companyName || 'Belirtilmemiş'}
                  </span>
                </td>
                <td>
                  {vehicle.assignedUserName ? (
                    <div>
                      <div className="small fw-medium">{vehicle.assignedUserName}</div>
                      {vehicle.assignedUserPhone && (
                        <div className="small text-muted">{vehicle.assignedUserPhone}</div>
                      )}
                    </div>
                  ) : (
                    <span className="text-muted small">Atanmamış</span>
                  )}
                </td>
                <td>
                  {vehicle.currentMileage ? (
                    <span className="badge bg-info text-dark">
                      {vehicle.currentMileage.toLocaleString()} km
                    </span>
                  ) : '-'}
                </td>
                <td>
                  <small className="text-muted">
                    {formatDisplayDate(vehicle.createdAt)}
                  </small>
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
                        <button
                          className="dropdown-item"
                          onClick={() => onViewVehicle?.(vehicle)}  // ✅ DÜZELTME
                        >
                          <i className="bi bi-eye me-2"></i>Detayları Gör
                        </button>
                      </li>
                      <li>
                        <button
                          className="dropdown-item"
                          onClick={() => onEditVehicle?.(vehicle)}  // ✅ DÜZELTME
                        >
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

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="d-flex justify-content-between align-items-center mt-4">
          <div className="small text-muted">
            Sayfa {pagination.currentPage} / {pagination.totalPages}
            (Toplam {pagination.totalCount} kayıt)
          </div>
          <nav>
            <ul className="pagination pagination-sm mb-0">
              <li className={`page-item ${!pagination.hasPreviousPage ? 'disabled' : ''}`}>
                <button
                  className="page-link"
                  onClick={() => onPageChange?.(pagination.currentPage - 1)}
                  disabled={!pagination.hasPreviousPage}
                >
                  Önceki
                </button>
              </li>

              {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                const pageNum = Math.max(1, pagination.currentPage - 2) + i;
                if (pageNum > pagination.totalPages) return null;

                return (
                  <li key={pageNum} className={`page-item ${pageNum === pagination.currentPage ? 'active' : ''}`}>
                    <button
                      className="page-link"
                      onClick={() => onPageChange?.(pageNum)}
                    >
                      {pageNum}
                    </button>
                  </li>
                );
              })}

              <li className={`page-item ${!pagination.hasNextPage ? 'disabled' : ''}`}>
                <button
                  className="page-link"
                  onClick={() => onPageChange?.(pagination.currentPage + 1)}
                  disabled={!pagination.hasNextPage}
                >
                  Sonraki
                </button>
              </li>
            </ul>
          </nav>
        </div>
      )}

      {loading && vehicles.length > 0 && (
        <div className="text-center py-3">
          <div className="spinner-border spinner-border-sm text-danger me-2"></div>
          <small className="text-muted">Yükleniyor...</small>
        </div>
      )}
    </>
  );
};

export default VehiclesList;