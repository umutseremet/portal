// src/frontend/src/components/Vehicles/VehiclesList.js
// Excel Import özelliği eklenmiş versiyon

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

  // Handle delete click
  const handleDeleteClick = (vehicle) => {
    if (onDeleteVisitor) {
      onDeleteVisitor(vehicle);
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
    const activeClass = filters.sortBy === column ? " text-danger" : " text-dark";
    return baseClass + activeClass;
  };

  // Handle import success
  const handleImportSuccess = (result) => {
    setShowImportModal(false);

    // Show success message
    if (result.successCount > 0) {
      alert(`Başarıyla ${result.successCount} yakıt alım kaydı içe aktarıldı!`);
    }

    // Refresh the vehicle list
    if (onRefresh) {
      onRefresh();
    }
  };

  // Loading state
  if (loading && vehicles.length === 0) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-danger mb-3" role="status">
          <span className="visually-hidden">Yükleniyor...</span>
        </div>
        <p className="text-muted">Araçlar yükleniyor...</p>
      </div>
    );
  }

  // Empty state
  if (isEmpty && !loading) {
    return (
      <>
        {/* Header with Actions - Empty state'de de göster */}
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

            {/* Excel'den Yükle Butonu */}
            <button
              className="btn btn-outline-success btn-sm"
              onClick={() => setShowImportModal(true)}
            >
              <i className="bi bi-file-earmark-arrow-up me-1"></i>
              Excel'den Yakıt Alımları Yükle
            </button>

            <button
              className="btn btn-outline-secondary btn-sm"
              onClick={onExport}
              disabled={true}
            >
              <i className="bi bi-download me-1"></i>
              Excel İndir
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

        {/* Filter Panel - Empty state'de de çalışsın */}
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
                    placeholder="Şirket adı..."
                  />
                </div>
              </div>

              <div className="row mt-3">
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
                  <label className="form-label small">Atanan Kullanıcı</label>
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    value={localFilters.assignedUser}
                    onChange={(e) => handleLocalFilterChange('assignedUser', e.target.value)}
                    placeholder="Kullanıcı adı..."
                  />
                </div>
                <div className="col-md-3">
                  <label className="form-label small">Konum</label>
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    value={localFilters.location}
                    onChange={(e) => handleLocalFilterChange('location', e.target.value)}
                    placeholder="İstanbul, Ankara..."
                  />
                </div>
              </div>

              <div className="d-flex justify-content-end gap-2 mt-3">
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
        )}

        {/* Empty State Message */}
        <div className="text-center py-5">
          <i className="bi bi-car-front display-1 text-muted mb-3"></i>
          <h5 className="text-muted mb-2">
            {hasFilters ? 'Filtrelere uygun araç bulunamadı' : 'Henüz araç kaydı bulunmuyor'}
          </h5>
          <p className="text-muted">
            {hasFilters
              ? 'Filtre kriterlerinizi değiştirmeyi deneyin.'
              : 'İlk araç kaydınızı oluşturmak için yukarıdaki "Yeni Araç" butonunu kullanın.'
            }
          </p>
          {hasFilters && (
            <button className="btn btn-outline-secondary" onClick={handleResetFilters}>
              <i className="bi bi-arrow-clockwise me-1"></i>
              Filtreleri Temizle
            </button>
          )}
        </div>

        {/* Excel Import Modal - Empty state'de de olmalı */}
        <FuelPurchaseImportModal
          show={showImportModal}
          onHide={() => setShowImportModal(false)}
          onSuccess={handleImportSuccess}
        />
      </>
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

          {/* YENİ - Excel'den Yükle Butonu */}
          <button
            className="btn btn-outline-success btn-sm"
            onClick={() => setShowImportModal(true)}
          >
            <i className="bi bi-file-earmark-arrow-up me-1"></i>
            Excel'den Yakıt Alımları Yükle
          </button>

          <button
            className="btn btn-outline-secondary btn-sm"
            onClick={onExport}
          >
            <i className="bi bi-download me-1"></i>
            Excel İndir
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
                      onChange={() => onSelectVisitor?.(vehicle.id)}
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
                    <button
                      className="btn btn-outline-secondary"
                      onClick={() => onViewVisitor?.(vehicle)}
                      title="Görüntüle"
                    >
                      <i className="bi bi-eye"></i>
                    </button>
                    <button
                      className="btn btn-outline-primary"
                      onClick={() => onEditVisitor?.(vehicle)}
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
            ))}
          </tbody>
        </table>
      </div>

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

              {[...Array(pagination.totalPages)].map((_, index) => {
                const pageNum = index + 1;
                const currentPage = pagination.currentPage;

                if (
                  pageNum === 1 ||
                  pageNum === pagination.totalPages ||
                  (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                ) {
                  return (
                    <li key={pageNum} className={`page-item ${pageNum === currentPage ? 'active' : ''}`}>
                      <button
                        className="page-link"
                        onClick={() => onPageChange?.(pageNum)}
                      >
                        {pageNum}
                      </button>
                    </li>
                  );
                }

                if (pageNum === currentPage - 2 || pageNum === currentPage + 2) {
                  return <li key={pageNum} className="page-item disabled"><span className="page-link">...</span></li>;
                }

                return null;
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

      {/* YENİ - Excel Import Modal */}
      <FuelPurchaseImportModal
        show={showImportModal}
        onHide={() => setShowImportModal(false)}
        onSuccess={handleImportSuccess}
      />
    </>
  );
};

export default VehiclesList;