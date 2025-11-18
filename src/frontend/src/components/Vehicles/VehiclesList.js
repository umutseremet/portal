// src/frontend/src/components/Vehicles/VehiclesList.js
// ✅ DÜZELTİLMİŞ VERSİYON - Araç prop isimleri düzeltildi

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
  onSelectVehicle,      // ✅ onSelectVisitor → onSelectVehicle
  onSelectAll,
  onClearSelection,
  onViewVehicle,        // ✅ onViewVisitor → onViewVehicle
  onEditVehicle,        // ✅ onEditVisitor → onEditVehicle
  onDeleteVehicle,      // ✅ onDeleteVisitor → onDeleteVehicle
  onBulkDelete,
  onNewVehicle,         // ✅ onNewVisitor → onNewVehicle
  onExport,
  onResetFilters,
  onRefresh,
  hasFilters = false,
  isEmpty = false,
  selectedCount = 0,
  isAllSelected = false,
  filterSummary = {}
}) => {
  const [showFilters, setShowFilters] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
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

  // ✅ Handle delete click - prop adı düzeltildi
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
    const baseClass = "btn btn-link text-decoration-none p-0 fw-medium d-flex align-items-center";
    const activeClass = filters.sortBy === column ? "text-primary" : "text-dark";
    return `${baseClass} ${activeClass}`;
  };

  if (loading && vehicles.length === 0) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Yükleniyor...</span>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Action Buttons */}
      <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
        <div className="d-flex gap-2">
          <button
            className="btn btn-primary"
            onClick={onNewVehicle}
          >
            <i className="bi bi-plus-circle me-2"></i>
            Yeni Araç
          </button>
          {selectedVehicles.length > 0 && (
            <>
              <button
                className="btn btn-outline-danger"
                onClick={onBulkDelete}
              >
                <i className="bi bi-trash me-2"></i>
                Seçilenleri Sil ({selectedVehicles.length})
              </button>
              <button
                className="btn btn-outline-secondary"
                onClick={onClearSelection}
              >
                <i className="bi bi-x-circle me-2"></i>
                Seçimi Temizle
              </button>
            </>
          )}
        </div>
        <div className="d-flex gap-2">
          <button
            className="btn btn-outline-secondary"
            onClick={() => setShowFilters(!showFilters)}
          >
            <i className="bi bi-funnel me-2"></i>
            Filtrele
            {hasFilters && <span className="badge bg-primary ms-2">✓</span>}
          </button>
          <button
            className="btn btn-outline-success"
            onClick={onExport}
          >
            <i className="bi bi-file-earmark-excel me-2"></i>
            Excel'e Aktar
          </button>
          <button
            className="btn btn-outline-info"
            onClick={() => setShowImportModal(true)}
          >
            <i className="bi bi-upload me-2"></i>
            Yakıt Alımı İçe Aktar
          </button>
          <button
            className="btn btn-outline-secondary"
            onClick={onRefresh}
          >
            <i className="bi bi-arrow-clockwise me-2"></i>
            Yenile
          </button>
        </div>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="card mb-3">
          <div className="card-body">
            <div className="row g-3">
              <div className="col-md-3">
                <label className="form-label small">Plaka</label>
                <input
                  type="text"
                  className="form-control form-control-sm"
                  value={localFilters.licensePlate}
                  onChange={(e) => handleLocalFilterChange('licensePlate', e.target.value)}
                  placeholder="Plaka ara..."
                />
              </div>
              <div className="col-md-3">
                <label className="form-label small">Marka</label>
                <input
                  type="text"
                  className="form-control form-control-sm"
                  value={localFilters.brand}
                  onChange={(e) => handleLocalFilterChange('brand', e.target.value)}
                  placeholder="Marka ara..."
                />
              </div>
              <div className="col-md-3">
                <label className="form-label small">Model</label>
                <input
                  type="text"
                  className="form-control form-control-sm"
                  value={localFilters.model}
                  onChange={(e) => handleLocalFilterChange('model', e.target.value)}
                  placeholder="Model ara..."
                />
              </div>
              <div className="col-md-3">
                <label className="form-label small">Şirket</label>
                <input
                  type="text"
                  className="form-control form-control-sm"
                  value={localFilters.companyName}
                  onChange={(e) => handleLocalFilterChange('companyName', e.target.value)}
                  placeholder="Şirket ara..."
                />
              </div>
              <div className="col-md-3">
                <label className="form-label small">Sahiplik Tipi</label>
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
              <div className="col-md-3">
                <label className="form-label small">Başlangıç Tarihi</label>
                <input
                  type="date"
                  className="form-control form-control-sm"
                  value={localFilters.fromDate}
                  onChange={(e) => handleLocalFilterChange('fromDate', e.target.value)}
                />
              </div>
              <div className="col-md-3">
                <label className="form-label small">Bitiş Tarihi</label>
                <input
                  type="date"
                  className="form-control form-control-sm"
                  value={localFilters.toDate}
                  onChange={(e) => handleLocalFilterChange('toDate', e.target.value)}
                />
              </div>
              <div className="col-12 mt-3">
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
                      onChange={() => onSelectVehicle?.(vehicle.id)}
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
                      <div className="small">{vehicle.assignedUserName}</div>
                      <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                        {vehicle.assignedUserPhone}
                      </div>
                    </div>
                  ) : (
                    <span className="text-muted">-</span>
                  )}
                </td>
                <td>
                  {vehicle.currentMileage ? (
                    <span>{vehicle.currentMileage.toLocaleString()} km</span>
                  ) : (
                    <span className="text-muted">-</span>
                  )}
                </td>
                <td>
                  {vehicle.createdAt ? (
                    <small>{new Date(vehicle.createdAt).toLocaleDateString('tr-TR')}</small>
                  ) : (
                    <span className="text-muted">-</span>
                  )}
                </td>
                <td>
                  <div className="btn-group btn-group-sm">
                    {/* ✅ DÜZELTİLDİ: onViewVehicle prop kullanılıyor */}
                    <button
                      className="btn btn-outline-secondary"
                      onClick={() => onViewVehicle?.(vehicle)}
                      title="Görüntüle"
                    >
                      <i className="bi bi-eye"></i>
                    </button>
                    {/* ✅ DÜZELTİLDİ: onEditVehicle prop kullanılıyor */}
                    <button
                      className="btn btn-outline-primary"
                      onClick={() => onEditVehicle?.(vehicle)}
                      title="Düzenle"
                    >
                      <i className="bi bi-pencil"></i>
                    </button>
                    {/* ✅ DÜZELTİLDİ: handleDeleteClick fonksiyonu kullanılıyor */}
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
            ))}
          </tbody>
        </table>
      </div>

      {/* Empty State */}
      {isEmpty && !loading && (
        <div className="text-center py-5">
          <i className="bi bi-truck display-1 text-muted"></i>
          <p className="mt-3 text-muted">
            {hasFilters
              ? 'Filtrelere uygun araç bulunamadı.'
              : 'Henüz araç kaydı bulunmuyor.'}
          </p>
          {hasFilters && (
            <button
              className="btn btn-outline-secondary"
              onClick={handleResetFilters}
            >
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