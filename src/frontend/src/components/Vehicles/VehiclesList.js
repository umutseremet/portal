// src/frontend/src/components/Vehicles/VehiclesList.js
// ✅ RAPOR SAYFASI STİLİNDE INLINE FİLTRELER İLE GÜNCELLENMİŞ

import React, { useState } from 'react';
import FuelPurchaseImportModal from './FuelPurchaseImportModal';

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
  onSelectVehicle,
  onSelectAll,
  onClearSelection,
  onViewVehicle,
  onEditVehicle,
  onDeleteVehicle,
  onBulkDelete,
  onNewVehicle,
  onExport,
  onResetFilters,
  onRefresh,
  hasFilters = false,
  isEmpty = false,
  selectedCount = 0,
  isAllSelected = false
}) => {
  const [showImportModal, setShowImportModal] = useState(false);

  // Handle delete click
  const handleDeleteClick = (vehicle) => {
    if (onDeleteVehicle) {
      onDeleteVehicle(vehicle);
    }
  };

  // Handle sort
  const handleSort = (column) => {
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
    const baseClass = "btn btn-link text-decoration-none p-0 fw-medium d-flex align-items-center text-dark";
    const activeClass = filters.sortBy === column ? 'text-danger' : '';
    return `${baseClass} ${activeClass}`;
  };

  // ✅ Handle filter input change - Gerçek zamanlı
  const handleFilterChange = (field, value) => {
    if (onFilterChange) {
      onFilterChange({ [field]: value });
    }
  };

  return (
    <div className="vehicles-list">
      {/* Action Buttons */}
      <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
        <div className="d-flex gap-2 flex-wrap">
          <button
            className="btn btn-danger btn-sm"
            onClick={onNewVehicle}
          >
            <i className="bi bi-plus-lg me-2"></i>
            Yeni Araç
          </button>
          
          <button
            className="btn btn-warning btn-sm"
            onClick={() => setShowImportModal(true)}
          >
            <i className="bi bi-file-earmark-excel me-2"></i>
            Yakıt Alımları İçe Aktar
          </button>

          {selectedCount > 0 && (
            <>
              <button
                className="btn btn-danger btn-sm"
                onClick={onBulkDelete}
              >
                <i className="bi bi-trash me-2"></i>
                Seçilenleri Sil ({selectedCount})
              </button>
              <button
                className="btn btn-outline-secondary btn-sm"
                onClick={onClearSelection}
              >
                <i className="bi bi-x-circle me-2"></i>
                Seçimi Temizle
              </button>
            </>
          )}
        </div>

        <div className="d-flex gap-2">
          {hasFilters && (
            <button
              className="btn btn-outline-secondary btn-sm"
              onClick={onResetFilters}
            >
              <i className="bi bi-x-circle me-1"></i>
              Filtreleri Temizle
            </button>
          )}
          
          <button
            className="btn btn-success btn-sm"
            onClick={onExport}
          >
            <i className="bi bi-file-earmark-excel me-2"></i>
            Excel'e Aktar
          </button>
        </div>
      </div>

      {/* Info Bar */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div className="text-muted small">
          Toplam {pagination.totalCount || vehicles.length} araç
          {selectedVehicles.length > 0 && (
            <span className="ms-2 text-primary">
              ({selectedVehicles.length} seçili)
            </span>
          )}
          {hasFilters && (
            <span className="ms-2 text-info">
              <i className="bi bi-funnel-fill"></i> Filtre aktif
            </span>
          )}
        </div>
        
        {loading && (
          <div className="text-muted small">
            <span className="spinner-border spinner-border-sm me-2" role="status"></span>
            Yükleniyor...
          </div>
        )}
      </div>

      {/* Vehicles Table with Inline Filters */}
      <div className="table-responsive">
        <table className="table table-hover table-sm align-middle">
          <thead className="table-light">
            <tr>
              {/* Checkbox Column */}
              <th width="50" className="text-center">
                <div className="form-check d-flex justify-content-center">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    checked={isAllSelected}
                    onChange={onSelectAll}
                  />
                </div>
              </th>

              {/* Plaka Column with Filter */}
              <th width="150">
                <div className="d-flex flex-column">
                  <button
                    className={getSortButtonClass('licensePlate')}
                    onClick={() => handleSort('licensePlate')}
                  >
                    Plaka
                    <i className={`bi ${getSortIcon('licensePlate')} ms-1`}></i>
                  </button>
                  <input
                    type="text"
                    className="form-control form-control-sm mt-1"
                    placeholder="Plaka ara..."
                    value={filters.licensePlate || ''}
                    onChange={(e) => handleFilterChange('licensePlate', e.target.value)}
                  />
                </div>
              </th>

              {/* Marka Column with Filter */}
              <th width="150">
                <div className="d-flex flex-column">
                  <button
                    className={getSortButtonClass('brand')}
                    onClick={() => handleSort('brand')}
                  >
                    Marka
                    <i className={`bi ${getSortIcon('brand')} ms-1`}></i>
                  </button>
                  <input
                    type="text"
                    className="form-control form-control-sm mt-1"
                    placeholder="Marka ara..."
                    value={filters.brand || ''}
                    onChange={(e) => handleFilterChange('brand', e.target.value)}
                  />
                </div>
              </th>

              {/* Model Column with Filter */}
              <th width="150">
                <div className="d-flex flex-column">
                  <button
                    className={getSortButtonClass('model')}
                    onClick={() => handleSort('model')}
                  >
                    Model
                    <i className={`bi ${getSortIcon('model')} ms-1`}></i>
                  </button>
                  <input
                    type="text"
                    className="form-control form-control-sm mt-1"
                    placeholder="Model ara..."
                    value={filters.model || ''}
                    onChange={(e) => handleFilterChange('model', e.target.value)}
                  />
                </div>
              </th>

              {/* Yıl Column */}
              <th width="80">
                <button
                  className={getSortButtonClass('year')}
                  onClick={() => handleSort('year')}
                >
                  Yıl
                  <i className={`bi ${getSortIcon('year')} ms-1`}></i>
                </button>
              </th>

              {/* Şirket Column with Filter */}
              <th width="150">
                <div className="d-flex flex-column">
                  <button
                    className={getSortButtonClass('companyName')}
                    onClick={() => handleSort('companyName')}
                  >
                    Şirket
                    <i className={`bi ${getSortIcon('companyName')} ms-1`}></i>
                  </button>
                  <input
                    type="text"
                    className="form-control form-control-sm mt-1"
                    placeholder="Şirket ara..."
                    value={filters.companyName || ''}
                    onChange={(e) => handleFilterChange('companyName', e.target.value)}
                  />
                </div>
              </th>

              {/* Atanan Kullanıcı */}
              <th width="150">Atanan Kullanıcı</th>

              {/* Kilometre */}
              <th width="120">
                <button
                  className={getSortButtonClass('currentMileage')}
                  onClick={() => handleSort('currentMileage')}
                >
                  Kilometre
                  <i className={`bi ${getSortIcon('currentMileage')} ms-1`}></i>
                </button>
              </th>

              {/* Kayıt Tarihi */}
              <th width="120">
                <button
                  className={getSortButtonClass('createdAt')}
                  onClick={() => handleSort('createdAt')}
                >
                  Kayıt Tarihi
                  <i className={`bi ${getSortIcon('createdAt')} ms-1`}></i>
                </button>
              </th>

              {/* İşlemler */}
              <th width="140" className="text-center">İşlemler</th>
            </tr>
          </thead>
          <tbody>
            {!loading && vehicles.length === 0 ? (
              <tr>
                <td colSpan="10" className="text-center py-5">
                  <i className="bi bi-truck display-4 text-muted mb-3 d-block"></i>
                  <p className="text-muted mb-0">
                    {hasFilters
                      ? 'Filtrelere uygun araç bulunamadı.'
                      : 'Henüz araç kaydı bulunmuyor.'}
                  </p>
                  {hasFilters && (
                    <button
                      className="btn btn-outline-secondary btn-sm mt-3"
                      onClick={onResetFilters}
                    >
                      Filtreleri Temizle
                    </button>
                  )}
                </td>
              </tr>
            ) : (
              vehicles.map((vehicle) => (
                <tr key={vehicle.id}>
                  {/* Checkbox */}
                  <td className="text-center">
                    <div className="form-check d-flex justify-content-center">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        checked={selectedVehicles.includes(vehicle.id)}
                        onChange={() => onSelectVehicle?.(vehicle.id)}
                      />
                    </div>
                  </td>

                  {/* Plaka */}
                  <td>
                    <span className="fw-bold text-primary">{vehicle.licensePlate}</span>
                  </td>

                  {/* Marka */}
                  <td>
                    <div className="fw-medium">{vehicle.brand}</div>
                  </td>

                  {/* Model */}
                  <td>
                    <div>{vehicle.model}</div>
                  </td>

                  {/* Yıl */}
                  <td>{vehicle.year || '-'}</td>

                  {/* Şirket */}
                  <td>
                    <span className="badge bg-light text-dark">
                      {vehicle.companyName || 'Belirtilmemiş'}
                    </span>
                  </td>

                  {/* Atanan Kullanıcı */}
                  <td>
                    {vehicle.assignedUserName ? (
                      <div>
                        <div className="small">{vehicle.assignedUserName}</div>
                        <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                          {vehicle.assignedUserPhone}
                        </div>
                      </div>
                    ) : (
                      <span className="text-muted">-</span>
                    )}
                  </td>

                  {/* Kilometre */}
                  <td>
                    {vehicle.currentMileage ? (
                      <span>{vehicle.currentMileage.toLocaleString()} km</span>
                    ) : (
                      <span className="text-muted">-</span>
                    )}
                  </td>

                  {/* Kayıt Tarihi */}
                  <td>
                    {vehicle.createdAt ? (
                      <small>{new Date(vehicle.createdAt).toLocaleDateString('tr-TR')}</small>
                    ) : (
                      <span className="text-muted">-</span>
                    )}
                  </td>

                  {/* İşlemler */}
                  <td className="text-center">
                    <div className="btn-group btn-group-sm">
                      <button
                        className="btn btn-outline-secondary"
                        onClick={() => onViewVehicle?.(vehicle)}
                        title="Görüntüle"
                      >
                        <i className="bi bi-eye"></i>
                      </button>
                      <button
                        className="btn btn-outline-primary"
                        onClick={() => onEditVehicle?.(vehicle)}
                        title="Düzenle"
                      >
                        <i className="bi bi-pencil"></i>
                      </button>
                      <button
                        className="btn btn-outline-danger"
                        onClick={() => handleDeleteClick(vehicle)}
                        title="Sil"
                      >
                        <i className="bi bi-trash"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Loading Overlay */}
      {loading && vehicles.length > 0 && (
        <div className="position-relative" style={{ minHeight: '100px' }}>
          <div className="position-absolute top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center bg-white bg-opacity-75">
            <div className="spinner-border text-danger" role="status">
              <span className="visually-hidden">Yükleniyor...</span>
            </div>
          </div>
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="d-flex justify-content-between align-items-center mt-4">
          <div className="text-muted small">
            Sayfa {pagination.currentPage} / {pagination.totalPages}
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
              {[...Array(pagination.totalPages)].map((_, index) => (
                <li
                  key={index + 1}
                  className={`page-item ${pagination.currentPage === index + 1 ? 'active' : ''}`}
                >
                  <button
                    className="page-link"
                    onClick={() => onPageChange?.(index + 1)}
                  >
                    {index + 1}
                  </button>
                </li>
              ))}
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

      {/* Import Modal */}
      <FuelPurchaseImportModal
        show={showImportModal}
        onHide={() => setShowImportModal(false)}
        onSuccess={onRefresh}
      />
    </div>
  );
};

export default VehiclesList;