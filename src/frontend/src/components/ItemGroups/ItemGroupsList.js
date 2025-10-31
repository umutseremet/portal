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

  const handleDeleteClick = (itemGroup) => {
    if (window.confirm(`"${itemGroup.name}" grubunu silmek istediğinizden emin misiniz?`)) {
      onDeleteItemGroup?.(itemGroup);
    }
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
            {hasFilters && <span className="badge bg-primary ms-2">{hasFilters}</span>}
          </button>
          
          {selectedCount > 0 && (
            <>
              <button 
                className="btn btn-outline-danger btn-sm"
                onClick={onBulkDelete}
              >
                <i className="bi bi-trash me-1"></i>
                Seçili {selectedCount} Grubu Sil
              </button>
              <button 
                className="btn btn-outline-secondary btn-sm"
                onClick={onClearSelection}
              >
                <i className="bi bi-x me-1"></i>
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

      {/* Active Filters Summary */}
      {hasFilters && (
        <div className="alert alert-info alert-dismissible fade show" role="alert">
          <i className="bi bi-info-circle me-2"></i>
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
            <h6 className="card-title mb-3">
              <i className="bi bi-funnel me-2"></i>
              Filtrele
            </h6>
            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label">Grup Adı</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Grup adı ile ara..."
                  value={localFilters.name}
                  onChange={(e) => handleLocalFilterChange('name', e.target.value)}
                />
              </div>
              <div className="col-md-6">
                <label className="form-label">Durum</label>
                <div className="form-check form-switch">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="includeCancelled"
                    checked={localFilters.includeCancelled}
                    onChange={(e) => handleLocalFilterChange('includeCancelled', e.target.checked)}
                  />
                  <label className="form-check-label" htmlFor="includeCancelled">
                    İptal edilmiş grupları göster
                  </label>
                </div>
              </div>
            </div>
            <div className="mt-3">
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
      )}

      <div className="d-flex justify-content-between align-items-center mb-3">
        <div className="text-muted small">
          Toplam {pagination.totalCount || itemGroups.length} grup
          {selectedItemGroups.length > 0 && (
            <span className="ms-2 text-primary">
              ({selectedItemGroups.length} seçili)
            </span>
          )}
        </div>
      </div>

      {/* Item Groups Table */}
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
                  className={getSortButtonClass('Name')}
                  onClick={() => onSort?.('Name')}
                >
                  Grup Adı
                  <i className={`bi ${getSortIcon('Name')} ms-1`}></i>
                </button>
              </th>
              <th>
                <button
                  className={getSortButtonClass('ItemCount')}
                  onClick={() => onSort?.('ItemCount')}
                >
                  Ürün Sayısı
                  <i className={`bi ${getSortIcon('ItemCount')} ms-1`}></i>
                </button>
              </th>
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
                      <span className="badge bg-danger">İptal Edilmiş</span>
                    ) : (
                      <span className="badge bg-success">Aktif</span>
                    )}
                  </td>
                  <td>
                    <div className="btn-group btn-group-sm">
                      <button
                        className="btn btn-outline-secondary"
                        onClick={() => onViewItemGroup?.(itemGroup)}
                        title="Ürünleri Görüntüle"
                      >
                        <i className="bi bi-eye"></i>
                      </button>
                      <button
                        className="btn btn-outline-primary"
                        onClick={() => onEditItemGroup?.(itemGroup)}
                        title="Düzenle"
                      >
                        <i className="bi bi-pencil"></i>
                      </button>
                      <button
                        className="btn btn-outline-danger"
                        onClick={() => handleDeleteClick(itemGroup)}
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
                  <i className="bi bi-chevron-left"></i>
                </button>
              </li>
              
              {[...Array(pagination.totalPages)].map((_, index) => {
                const page = index + 1;
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
                  (page === pagination.currentPage - 2 && page > 1) ||
                  (page === pagination.currentPage + 2 && page < pagination.totalPages)
                ) {
                  return (
                    <li key={page} className="page-item disabled">
                      <span className="page-link">...</span>
                    </li>
                  );
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