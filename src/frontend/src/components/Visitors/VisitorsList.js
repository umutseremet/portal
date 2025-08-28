// ===== DÜZELTME 4: src/frontend/src/components/Visitors/VisitorsList.js =====

import React, { useState } from 'react';

const VisitorsList = ({
  visitors = [],
  loading = false,
  error = null,
  isEmpty = false,
  hasFilters = false,
  filters = {},
  pagination = {},
  selectedVisitors = [],
  selectedCount = 0,
  isAllSelected = false,
  filterSummary = '',
  
  // Action handlers
  onSort,
  onPageChange,
  onFilterChange,
  onResetFilters,
  onQuickDateFilter,
  onNewVisitor,
  onEditVisitor,
  onViewVisitor,
  onDeleteVisitor,
  onExport,
  onBulkDelete,
  onSelectVisitor,
  onSelectAll,
  onClearSelection,
  onClearError
}) => {
  const [showFilters, setShowFilters] = useState(false);
  const [localFilters, setLocalFilters] = useState({
    fromDate: filters.fromDate || '',
    toDate: filters.toDate || '',
    company: filters.company || '',
    visitor: filters.visitor || '',
    sortBy: filters.sortBy || 'date',
    sortOrder: filters.sortOrder || 'desc'
  });

  // Format date for display (Turkish format)
  const formatDateForDisplay = (dateString) => {
    if (!dateString) return 'N/A';
    const d = new Date(dateString);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}.${month}.${year}`;
  };

  // Get relative date
  const getRelativeDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const today = new Date();
    const diffTime = Math.abs(today - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Bugün';
    if (diffDays === 1) return '1 gün önce';
    if (diffDays < 7) return `${diffDays} gün önce`;
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)} hafta önce`;
    return `${Math.ceil(diffDays / 30)} ay önce`;
  };

  // Get status color based on date
  const getStatusColor = (dateString) => {
    if (!dateString) return 'text-muted';
    const date = new Date(dateString);
    const today = new Date();
    const diffTime = Math.abs(today - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'text-success';
    if (diffDays <= 7) return 'text-info';
    if (diffDays <= 30) return 'text-warning';
    return 'text-muted';
  };

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
      company: '',
      visitor: '',
      sortBy: 'date',
      sortOrder: 'desc'
    };
    setLocalFilters(defaultFilters);
    if (onResetFilters) {
      onResetFilters();
    }
  };

  // Handle delete click
  const handleDeleteClick = (visitor) => {
    if (window.confirm(`${visitor.visitor} ziyaretçisini silmek istediğinizden emin misiniz?`)) {
      if (onDeleteVisitor) {
        onDeleteVisitor(visitor);
      }
    }
  };

  // Handle sort
  const handleSort = (column) => {
    const newOrder = filters.sortBy === column && filters.sortOrder === 'desc' ? 'asc' : 'desc';
    if (onSort) {
      onSort(column, newOrder);
    }
  };

  // ⚡ DÜZELTME: Loading state sadece visitors boşken gösterilsin
  if (loading && (!visitors || visitors.length === 0)) {
    return (
      <div className="d-flex justify-content-center align-items-center py-5">
        <div className="text-center">
          <div className="spinner-border text-danger mb-3">
            <span className="visually-hidden">Yükleniyor...</span>
          </div>
          <p className="text-muted">Ziyaretçiler yükleniyor...</p>
        </div>
      </div>
    );
  }

  // ⚡ DÜZELTME: Empty state sadece loading false iken gösterilsin
  if (!loading && (!visitors || visitors.length === 0)) {
    return (
      <div className="text-center py-5">
        <div className="mb-4">
          <i className="bi bi-people display-1 text-muted"></i>
        </div>
        <h5 className="text-muted mb-3">
          {hasFilters ? 'Filtrelere uygun ziyaretçi bulunamadı' : 'Henüz ziyaretçi kaydı bulunmuyor'}
        </h5>
        <p className="text-muted">
          {hasFilters 
            ? 'Filtre kriterlerinizi değiştirmeyi deneyin.' 
            : 'İlk ziyaretçi kaydınızı oluşturmak için "Yeni Ziyaretçi" butonunu kullanın.'
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

  // ⚡ VISITOR LIST - Ana içerik
  return (
    <>
      {/* Header with Actions */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h5 className="card-title mb-0">Ziyaretçiler</h5>
          <p className="text-muted mb-0 small">
            Toplam {pagination.totalCount || 0} ziyaretçi
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
            Yeni Ziyaretçi
          </button>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="card mb-4">
          <div className="card-body">
            <div className="row g-3">
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
              <div className="col-md-3">
                <label className="form-label small">Şirket</label>
                <input
                  type="text"
                  className="form-control form-control-sm"
                  placeholder="Şirket adı ara..."
                  value={localFilters.company}
                  onChange={(e) => handleLocalFilterChange('company', e.target.value)}
                />
              </div>
              <div className="col-md-3">
                <label className="form-label small">Ziyaretçi</label>
                <input
                  type="text"
                  className="form-control form-control-sm"
                  placeholder="Ziyaretçi adı ara..."
                  value={localFilters.visitor}
                  onChange={(e) => handleLocalFilterChange('visitor', e.target.value)}
                />
              </div>
            </div>
            <div className="row mt-3">
              <div className="col-12">
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

      {/* Table Header */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div className="text-muted small">
          Toplam {pagination.totalCount || 0} ziyaretçi
          {selectedVisitors.length > 0 && (
            <span className="ms-2 text-primary">
              ({selectedVisitors.length} seçili)
            </span>
          )}
        </div>
        {selectedVisitors.length > 0 && (
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
              Seçilenleri Sil ({selectedVisitors.length})
            </button>
          </div>
        )}
      </div>

      {/* Visitors Table */}
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
              <th style={{ width: '120px' }}>
                <button 
                  className="btn btn-link text-decoration-none p-0 fw-medium text-dark d-flex align-items-center"
                  onClick={() => handleSort('date')}
                >
                  Tarih
                  <i className={`bi ms-1 ${
                    filters.sortBy === 'date' 
                      ? filters.sortOrder === 'desc' ? 'bi-arrow-down' : 'bi-arrow-up'
                      : 'bi-arrow-down-up'
                  }`}></i>
                </button>
              </th>
              <th>
                <button 
                  className="btn btn-link text-decoration-none p-0 fw-medium text-dark d-flex align-items-center"
                  onClick={() => handleSort('company')}
                >
                  Şirket
                  <i className={`bi ms-1 ${
                    filters.sortBy === 'company' 
                      ? filters.sortOrder === 'desc' ? 'bi-arrow-down' : 'bi-arrow-up'
                      : 'bi-arrow-down-up'
                  }`}></i>
                </button>
              </th>
              <th>
                <button 
                  className="btn btn-link text-decoration-none p-0 fw-medium text-dark d-flex align-items-center"
                  onClick={() => handleSort('visitor')}
                >
                  Ziyaretçi
                  <i className={`bi ms-1 ${
                    filters.sortBy === 'visitor' 
                      ? filters.sortOrder === 'desc' ? 'bi-arrow-down' : 'bi-arrow-up'
                      : 'bi-arrow-down-up'
                  }`}></i>
                </button>
              </th>
              <th>Açıklama</th>
              <th style={{ width: '120px' }}>İşlemler</th>
            </tr>
          </thead>
          <tbody>
            {visitors.map((visitor) => (
              <tr key={visitor.id}>
                <td>
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      checked={selectedVisitors.includes(visitor.id)}
                      onChange={() => onSelectVisitor?.(visitor.id)}
                    />
                  </div>
                </td>
                <td>
                  <div>
                    <div className={`fw-medium ${getStatusColor(visitor.date)}`}>
                      {formatDateForDisplay(visitor.date)}
                    </div>
                    <small className="text-muted">
                      {getRelativeDate(visitor.date)}
                    </small>
                  </div>
                </td>
                <td>
                  <span className="fw-medium text-primary">
                    {visitor.company || 'N/A'}
                  </span>
                </td>
                <td>
                  <div>
                    <div className="fw-medium">
                      {visitor.visitor || 'N/A'}
                    </div>
                  </div>
                </td>
                <td>
                  <div style={{ maxWidth: '200px' }}>
                    <div className="text-truncate" title={visitor.description}>
                      {visitor.description || 'Açıklama yok'}
                    </div>
                  </div>
                </td>
                <td>
                  <div className="dropdown">
                    <button
                      className="btn btn-outline-secondary btn-sm dropdown-toggle"
                      type="button"
                      data-bs-toggle="dropdown"
                    >
                      <i className="bi bi-three-dots"></i>
                    </button>
                    <ul className="dropdown-menu">
                      <li>
                        <button 
                          className="dropdown-item"
                          onClick={() => onViewVisitor?.(visitor)}
                        >
                          <i className="bi bi-eye me-2"></i>Detayları Gör
                        </button>
                      </li>
                      <li>
                        <button 
                          className="dropdown-item"
                          onClick={() => onEditVisitor?.(visitor)}
                        >
                          <i className="bi bi-pencil me-2"></i>Düzenle
                        </button>
                      </li>
                      <li><hr className="dropdown-divider" /></li>
                      <li>
                        <button 
                          className="dropdown-item text-danger"
                          onClick={() => handleDeleteClick(visitor)}
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

      {/* Loading overlay for additional data */}
      {loading && visitors.length > 0 && (
        <div className="position-relative">
          <div className="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center bg-light bg-opacity-75">
            <div className="spinner-border text-danger">
              <span className="visually-hidden">Yükleniyor...</span>
            </div>
          </div>
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="d-flex justify-content-between align-items-center mt-4">
          <div className="text-muted small">
            {((pagination.page - 1) * pagination.pageSize) + 1}-
            {Math.min(pagination.page * pagination.pageSize, pagination.totalCount)} / {' '}
            {pagination.totalCount} kayıt
          </div>
          <nav>
            <ul className="pagination pagination-sm mb-0">
              <li className={`page-item ${!pagination.hasPreviousPage ? 'disabled' : ''}`}>
                <button 
                  className="page-link"
                  onClick={() => onPageChange?.(pagination.page - 1)}
                  disabled={!pagination.hasPreviousPage}
                >
                  <i className="bi bi-chevron-left"></i>
                </button>
              </li>
              
              {/* Page numbers */}
              {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                const pageNum = Math.max(1, pagination.page - 2) + i;
                if (pageNum > pagination.totalPages) return null;
                
                return (
                  <li key={pageNum} className={`page-item ${pagination.page === pageNum ? 'active' : ''}`}>
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
                  onClick={() => onPageChange?.(pagination.page + 1)}
                  disabled={!pagination.hasNextPage}
                >
                  <i className="bi bi-chevron-right"></i>
                </button>
              </li>
            </ul>
          </nav>
        </div>
      )}
    </>
  );
};

export default VisitorsList;