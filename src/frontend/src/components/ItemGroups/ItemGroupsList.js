// src/frontend/src/components/ItemGroups/ItemGroupsList.js
import React, { useState } from 'react';

const ItemGroupsList = ({
  itemGroups = [],
  loading = false,
  pagination = {},
  filters = {},
  sorting = { field: 'Name', direction: 'asc' },
  selectedItemGroups = [],
  onPageChange,
  onFilterChange,
  onSort,
  onSelectItemGroup,
  onSelectAll,
  onClearSelection,
  onViewItemGroup,
  onEditItemGroup,
  onDeleteItemGroup,
  onBulkDelete,
  onNewItemGroup,
  onResetFilters,
  onRefresh,
  hasFilters,
  isEmpty,
  selectedCount,
  isAllSelected,
  filterSummary
}) => {
  const [showFilters, setShowFilters] = useState(false);
  const [localFilters, setLocalFilters] = useState({
    name: filters.name || '',
    includeCancelled: filters.includeCancelled || false
  });

  // Sorting helpers
  const getSortIcon = (field) => {
    if (sorting.field !== field) return 'bi-arrow-down-up';
    return sorting.direction === 'asc' ? 'bi-sort-alpha-down' : 'bi-sort-alpha-up';
  };

  const getSortButtonClass = (field) => {
    const baseClass = 'btn btn-sm border-0 text-muted';
    return sorting.field === field ? `${baseClass} text-primary fw-bold` : baseClass;
  };

  // Filter handlers
  const handleLocalFilterChange = (field, value) => {
    setLocalFilters(prev => ({ ...prev, [field]: value }));
  };

  const handleApplyFilters = () => {
    onFilterChange?.(localFilters);
    setShowFilters(false);
  };

  const handleResetFilters = () => {
    const resetFilters = {
      name: '',
      includeCancelled: false
    };
    setLocalFilters(resetFilters);
    onResetFilters?.();
    setShowFilters(false);
  };

  // Loading state
  if (loading && itemGroups.length === 0) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Yükleniyor...</span>
        </div>
        <p className="mt-3 text-muted">Ürün grupları yükleniyor...</p>
      </div>
    );
  }

  return (
    <div className="item-groups-list">
      {/* Toolbar */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div className="d-flex gap-2">
          <button 
            className="btn btn-outline-secondary btn-sm"
            onClick={() => setShowFilters(!showFilters)}
          >
            <i className="bi bi-funnel me-1"></i>
            Filtreler
            {hasFilters && <span className="badge bg-primary ms-2">!</span>}
          </button>
          
          {selectedCount > 0 && (
            <>
              <button 
                className="btn btn-outline-danger btn-sm"
                onClick={onBulkDelete}
              >
                <i className="bi bi-trash me-1"></i>
                Seçilenleri Sil ({selectedCount})
              </button>
              <button 
                className="btn btn-outline-secondary btn-sm"
                onClick={onClearSelection}
              >
                <i className="bi bi-x-circle me-1"></i>
                Seçimi Temizle
              </button>
            </>
          )}
        </div>
        
        <div className="d-flex gap-2">
          <button 
            className="btn btn-outline-secondary btn-sm"
            onClick={onRefresh}
            disabled={loading}
          >
            <i className="bi bi-arrow-clockwise me-1"></i>
            Yenile
          </button>
        </div>
      </div>

      {/* Filter Summary */}
      {hasFilters && filterSummary && (
        <div className="alert alert-info alert-dismissible fade show mb-3" role="alert">
          <i className="bi bi-funnel-fill me-2"></i>
          <strong>Aktif Filtreler:</strong> {filterSummary}
          <button 
            type="button" 
            className="btn-close" 
            onClick={handleResetFilters}
          ></button>
        </div>
      )}

      {/* Filters Panel */}
      {showFilters && (
        <div className="card mb-3">
          <div className="card-body">
            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label">Grup Adı</label>
                <input
                  type="text"
                  className="form-control"
                  value={localFilters.name}
                  onChange={(e) => handleLocalFilterChange('name', e.target.value)}
                  placeholder="Grup adı ara..."
                />
              </div>
              <div className="col-md-6">
                <label className="form-label d-block">Durum</label>
                <div className="form-check form-check-inline mt-2">
                  <input
                    type="checkbox"
                    className="form-check-input"
                    id="includeCancelled"
                    checked={localFilters.includeCancelled}
                    onChange={(e) => handleLocalFilterChange('includeCancelled', e.target.checked)}
                  />
                  <label className="form-check-label" htmlFor="includeCancelled">
                    İptal edilenleri göster
                  </label>
                </div>
              </div>
            </div>
            <div className="d-flex gap-2 mt-3">
              <button 
                className="btn btn-primary btn-sm"
                onClick={handleApplyFilters}
              >
                <i className="bi bi-check-circle me-1"></i>
                Uygula
              </button>
              <button 
                className="btn btn-outline-secondary btn-sm"
                onClick={handleResetFilters}
              >
                <i className="bi bi-x-circle me-1"></i>
                Temizle
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="table-responsive">
        <table className="table table-hover">
          <thead>
            <tr>
              <th width="40">
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
                  className={getSortButtonClass('Name')}
                  onClick={() => onSort?.('Name')}
                >
                  Grup Adı
                  <i className={`bi ${getSortIcon('Name')} ms-1`}></i>
                </button>
              </th>
              <th>Ürün Sayısı</th>
              <th>
                <button
                  className={getSortButtonClass('CreatedAt')}
                  onClick={() => onSort?.('CreatedAt')}
                >
                  Oluşturma Tarihi
                  <i className={`bi ${getSortIcon('CreatedAt')} ms-1`}></i>
                </button>
              </th>
              <th>Durum</th>
              <th width="150">İşlemler</th>
            </tr>
          </thead>
          <tbody>
            {isEmpty ? (
              <tr>
                <td colSpan="6" className="text-center py-5">
                  <i className="bi bi-inbox display-4 text-muted d-block mb-3"></i>
                  <p className="text-muted">
                    {hasFilters ? 'Filtrelere uygun grup bulunamadı' : 'Henüz ürün grubu eklenmemiş'}
                  </p>
                  {hasFilters ? (
                    <button className="btn btn-sm btn-outline-primary" onClick={handleResetFilters}>
                      <i className="bi bi-arrow-clockwise me-1"></i>
                      Filtreleri Temizle
                    </button>
                  ) : (
                    <button className="btn btn-sm btn-primary" onClick={onNewItemGroup}>
                      <i className="bi bi-plus-circle me-1"></i>
                      Yeni Grup Ekle
                    </button>
                  )}
                </td>
              </tr>
            ) : (
              itemGroups.map((itemGroup) => (
                <tr key={itemGroup.id}>
                  <td>
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        checked={selectedItemGroups.includes(itemGroup.id)}
                        onChange={() => onSelectItemGroup?.(itemGroup.id)}
                      />
                    </div>
                  </td>
                  <td>
                    <button
                      className="btn btn-link text-start p-0 text-decoration-none"
                      onClick={() => onViewItemGroup?.(itemGroup)}
                    >
                      <span className="fw-bold text-primary">{itemGroup.name}</span>
                    </button>
                  </td>
                  <td>
                    <span className="badge bg-light text-dark">
                      {itemGroup.itemCount || 0} ürün
                    </span>
                  </td>
                  <td>
                    <small className="text-muted">
                      {itemGroup.formattedCreatedAt || new Date(itemGroup.createdAt).toLocaleDateString('tr-TR')}
                    </small>
                  </td>
                  <td>
                    {itemGroup.cancelled ? (
                      <span className="badge bg-danger">İptal</span>
                    ) : (
                      <span className="badge bg-success">Aktif</span>
                    )}
                  </td>
                  <td>
                    <div className="btn-group btn-group-sm" role="group">
                      <button
                        className="btn btn-outline-primary"
                        onClick={() => onViewItemGroup?.(itemGroup)}
                        title="Ürünleri Görüntüle"
                      >
                        <i className="bi bi-eye"></i>
                      </button>
                      <button
                        className="btn btn-outline-secondary"
                        onClick={() => onEditItemGroup?.(itemGroup)}
                        title="Düzenle"
                      >
                        <i className="bi bi-pencil"></i>
                      </button>
                      <button
                        className="btn btn-outline-danger"
                        onClick={() => onDeleteItemGroup?.(itemGroup)}
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

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="d-flex justify-content-between align-items-center mt-3">
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
                  <i className="bi bi-chevron-left"></i>
                </button>
              </li>
              
              {[...Array(pagination.totalPages)].map((_, i) => {
                const page = i + 1;
                if (
                  page === 1 ||
                  page === pagination.totalPages ||
                  (page >= pagination.currentPage - 1 && page <= pagination.currentPage + 1)
                ) {
                  return (
                    <li key={page} className={`page-item ${page === pagination.currentPage ? 'active' : ''}`}>
                      <button
                        className="page-link"
                        onClick={() => onPageChange?.(page)}
                      >
                        {page}
                      </button>
                    </li>
                  );
                } else if (
                  page === pagination.currentPage - 2 ||
                  page === pagination.currentPage + 2
                ) {
                  return <li key={page} className="page-item disabled"><span className="page-link">...</span></li>;
                }
                return null;
              })}
              
              <li className={`page-item ${!pagination.hasNextPage ? 'disabled' : ''}`}>
                <button
                  className="page-link"
                  onClick={() => onPageChange?.(pagination.currentPage + 1)}
                  disabled={!pagination.hasNextPage}
                >
                  <i className="bi bi-chevron-right"></i>
                </button>
              </li>
            </ul>
          </nav>
        </div>
      )}
    </div>
  );
};

export default ItemGroupsList;