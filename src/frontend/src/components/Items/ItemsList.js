// src/frontend/src/components/Items/ItemsList.js
// ✅ Teknik resim filtresi eklenmiş TAM versiyon

import React, { useState } from 'react';

const ItemsList = ({
  items = [],
  itemGroups = [],
  loading = false,
  pagination = {},
  filters = {},
  sorting = { field: 'Name', direction: 'asc' },
  selectedItems = [],
  onPageChange,
  onFilterChange,
  onSort,
  onSelectItem,
  onSelectAll,
  onClearSelection,
  onViewItem,
  onEditItem,
  onDeleteItem,
  onBulkDelete,
  onNewItem,
  onResetFilters,
  onRefresh,
  hasFilters,
  isEmpty,
  selectedCount,
  isAllSelected,
  filterSummary,
  apiBaseUrl
}) => {
  const [showFilters, setShowFilters] = useState(false);
  
  // ✅ technicalDrawingCompleted eklendi
  const [localFilters, setLocalFilters] = useState({
    name: filters.name || '',
    code: filters.code || '',
    groupId: filters.groupId || '',
    includeCancelled: filters.includeCancelled || false,
    technicalDrawingCompleted: filters.technicalDrawingCompleted ?? null
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

  // ✅ technicalDrawingCompleted eklendi
  const handleResetFilters = () => {
    const resetFilters = {
      name: '',
      code: '',
      groupId: '',
      includeCancelled: false,
      technicalDrawingCompleted: null
    };
    setLocalFilters(resetFilters);
    onResetFilters?.();
    setShowFilters(false);
  };

  const getGroupName = (groupId) => {
    const group = itemGroups.find(g => g.id === groupId);
    return group?.name || 'Bilinmiyor';
  };

  // API Base URL
  const baseUrl = apiBaseUrl?.replace('/api', '') || 'http://localhost:5154';

  // Loading state
  if (loading && items.length === 0) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Yükleniyor...</span>
        </div>
        <p className="mt-3 text-muted">Ürünler yükleniyor...</p>
      </div>
    );
  }

  return (
    <div className="items-list">
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

      {/* Filters Panel */}
      {showFilters && (
        <div className="card mb-3">
          <div className="card-body">
            <div className="row g-3">
              <div className="col-md-4">
                <label className="form-label">Ürün Adı</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Ürün adı..."
                  value={localFilters.name}
                  onChange={(e) => handleLocalFilterChange('name', e.target.value)}
                />
              </div>
              <div className="col-md-4">
                <label className="form-label">Kod</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Ürün kodu..."
                  value={localFilters.code}
                  onChange={(e) => handleLocalFilterChange('code', e.target.value)}
                />
              </div>
              <div className="col-md-4">
                <label className="form-label">Grup</label>
                <select
                  className="form-select"
                  value={localFilters.groupId}
                  onChange={(e) => handleLocalFilterChange('groupId', e.target.value ? parseInt(e.target.value) : '')}
                >
                  <option value="">Tüm Gruplar</option>
                  {itemGroups.map(group => (
                    <option key={group.id} value={group.id}>
                      {group.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="col-md-12">
                <div className="form-check form-switch">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="includeCancelled"
                    checked={localFilters.includeCancelled}
                    onChange={(e) => handleLocalFilterChange('includeCancelled', e.target.checked)}
                  />
                  <label className="form-check-label" htmlFor="includeCancelled">
                    İptal edilmiş ürünleri göster
                  </label>
                </div>
              </div>

              {/* ✅ YENİ EKLEME: Teknik Resim Filtresi */}
              <div className="col-md-12 mt-2">
                <label className="form-label">Teknik Resim Durumu</label>
                <select
                  className="form-select"
                  value={
                    localFilters.technicalDrawingCompleted === null 
                      ? '' 
                      : localFilters.technicalDrawingCompleted.toString()
                  }
                  onChange={(e) => {
                    const value = e.target.value === '' 
                      ? null 
                      : e.target.value === 'true';
                    handleLocalFilterChange('technicalDrawingCompleted', value);
                  }}
                >
                  <option value="">Tümü</option>
                  <option value="true">Tamamlanmış</option>
                  <option value="false">Bekliyor</option>
                </select>
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

      {/* Filter Summary */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div className="text-muted small">
          Toplam {pagination.totalCount || items.length} ürün
          {selectedItems.length > 0 && (
            <span className="ms-2 text-primary">
              ({selectedItems.length} seçili)
            </span>
          )}
        </div>
      </div>

      {/* Items Table */}
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
              <th width="80">Resim</th>
              <th>
                <button
                  className={getSortButtonClass('Code')}
                  onClick={() => onSort?.('Code')}
                >
                  Kod
                  <i className={`bi ${getSortIcon('Code')} ms-1`}></i>
                </button>
              </th>
              <th>
                <button
                  className={getSortButtonClass('Name')}
                  onClick={() => onSort?.('Name')}
                >
                  Ürün Adı
                  <i className={`bi ${getSortIcon('Name')} ms-1`}></i>
                </button>
              </th>
              <th>
                <button
                  className={getSortButtonClass('GroupId')}
                  onClick={() => onSort?.('GroupId')}
                >
                  Grup
                  <i className={`bi ${getSortIcon('GroupId')} ms-1`}></i>
                </button>
              </th>
              <th>Fiyat</th>
              <th>Durum</th>
              <th width="150">İşlemler</th>
            </tr>
          </thead>
          <tbody>
            {isEmpty ? (
              <tr>
                <td colSpan="8" className="text-center py-5">
                  <i className="bi bi-inbox display-4 text-muted d-block mb-3"></i>
                  <p className="text-muted">
                    {hasFilters ? 'Filtrelere uygun ürün bulunamadı' : 'Henüz ürün eklenmemiş'}
                  </p>
                  {hasFilters ? (
                    <button className="btn btn-sm btn-outline-primary" onClick={handleResetFilters}>
                      <i className="bi bi-arrow-clockwise me-1"></i>
                      Filtreleri Temizle
                    </button>
                  ) : (
                    <button className="btn btn-sm btn-primary" onClick={onNewItem}>
                      <i className="bi bi-plus-circle me-1"></i>
                      Yeni Ürün Ekle
                    </button>
                  )}
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr key={item.id}>
                  <td>
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        checked={selectedItems.includes(item.id)}
                        onChange={() => onSelectItem?.(item.id)}
                      />
                    </div>
                  </td>
                  <td>
                    {item.imageUrl ? (
                      <img
                        src={`${baseUrl}${item.imageUrl}`}
                        alt={item.name}
                        className="img-thumbnail"
                        style={{
                          width: '50px',
                          height: '50px',
                          objectFit: 'cover',
                          cursor: 'pointer'
                        }}
                        onClick={() => onViewItem?.(item)}
                      />
                    ) : (
                      <div
                        className="img-thumbnail d-flex align-items-center justify-content-center bg-light"
                        style={{ width: '50px', height: '50px' }}
                      >
                        <i className="bi bi-image text-muted"></i>
                      </div>
                    )}
                  </td>
                  <td>
                    <code className="text-primary">{item.code}</code>
                  </td>
                  <td>
                    <strong>{item.name}</strong>
                    {item.docNumber && (
                      <div className="small text-muted">Dok: {item.docNumber}</div>
                    )}
                  </td>
                  <td>
                    <span className="badge bg-secondary">
                      {getGroupName(item.groupId)}
                    </span>
                  </td>
                  <td>
                    {item.price ? (
                      <span className="text-success fw-bold">
                        ₺{item.price.toFixed(2)}
                      </span>
                    ) : (
                      <span className="text-muted">-</span>
                    )}
                  </td>
                  <td>
                    <div className="d-flex gap-1 flex-wrap">
                      {item.cancelled && (
                        <span className="badge bg-danger">İptal</span>
                      )}
                      
                      {/* ✅ YENİ: Teknik resim badge */}
                      {item.technicalDrawingCompleted ? (
                        <span className="badge bg-success" title="Teknik resim çalışması tamamlandı">
                          <i className="bi bi-check-circle me-1"></i>
                          TR Tamam
                        </span>
                      ) : (
                        <span className="badge bg-warning text-dark" title="Teknik resim çalışması bekliyor">
                          <i className="bi bi-clock me-1"></i>
                          TR Bekliyor
                        </span>
                      )}
                    </div>
                  </td>
                  <td>
                    <div className="btn-group btn-group-sm">
                      <button
                        className="btn btn-outline-primary"
                        onClick={() => onViewItem?.(item)}
                        title="Detayları Gör"
                      >
                        <i className="bi bi-eye"></i>
                      </button>
                      <button
                        className="btn btn-outline-secondary"
                        onClick={() => onEditItem?.(item)}
                        title="Düzenle"
                      >
                        <i className="bi bi-pencil"></i>
                      </button>
                      <button
                        className="btn btn-outline-danger"
                        onClick={() => onDeleteItem?.(item.id)}
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
        <nav className="mt-4">
          <ul className="pagination justify-content-center">
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
              const pageNum = index + 1;
              // Show first, last, current, and 2 pages around current
              if (
                pageNum === 1 ||
                pageNum === pagination.totalPages ||
                (pageNum >= pagination.currentPage - 2 && pageNum <= pagination.currentPage + 2)
              ) {
                return (
                  <li
                    key={pageNum}
                    className={`page-item ${pagination.currentPage === pageNum ? 'active' : ''}`}
                  >
                    <button
                      className="page-link"
                      onClick={() => onPageChange?.(pageNum)}
                    >
                      {pageNum}
                    </button>
                  </li>
                );
              } else if (
                pageNum === pagination.currentPage - 3 ||
                pageNum === pagination.currentPage + 3
              ) {
                return (
                  <li key={pageNum} className="page-item disabled">
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
      )}
    </div>
  );
};

export default ItemsList;