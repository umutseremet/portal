// src/frontend/src/components/Items/ItemsList.js
import React, { useState } from 'react';
import { Image as ImageIcon } from 'lucide-react';

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
  apiBaseUrl = ''
}) => {
  const [showFilters, setShowFilters] = useState(false);
  const [localFilters, setLocalFilters] = useState({
    name: filters.name || '',
    code: filters.code || '',
    groupId: filters.groupId || '',
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
      code: '',
      groupId: '',
      includeCancelled: false
    };
    setLocalFilters(resetFilters);
    onResetFilters?.();
    setShowFilters(false);
  };

  const getGroupName = (groupId) => {
    const group = itemGroups.find(g => g.id === groupId);
    return group?.name || 'Bilinmiyor';
  };

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
                <i className="bi bi-x-circle me-1"></i>
                Seçimi Temizle
              </button>
            </>
          )}
        </div>

        <button 
          className="btn btn-outline-secondary btn-sm"
          onClick={onRefresh}
          disabled={loading}
        >
          <i className="bi bi-arrow-clockwise me-1"></i>
          Yenile
        </button>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="card mb-3">
          <div className="card-body">
            <div className="row g-3">
              <div className="col-md-3">
                <label className="form-label">İsim</label>
                <input
                  type="text"
                  className="form-control form-control-sm"
                  placeholder="Ürün adı"
                  value={localFilters.name}
                  onChange={(e) => handleLocalFilterChange('name', e.target.value)}
                />
              </div>
              <div className="col-md-3">
                <label className="form-label">Kod</label>
                <input
                  type="text"
                  className="form-control form-control-sm"
                  placeholder="Ürün kodu"
                  value={localFilters.code}
                  onChange={(e) => handleLocalFilterChange('code', e.target.value)}
                />
              </div>
              <div className="col-md-3">
                <label className="form-label">Grup</label>
                <select
                  className="form-select form-select-sm"
                  value={localFilters.groupId}
                  onChange={(e) => handleLocalFilterChange('groupId', e.target.value)}
                >
                  <option value="">Tüm Gruplar</option>
                  {itemGroups.map(group => (
                    <option key={group.id} value={group.id}>
                      {group.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-md-3 d-flex align-items-end">
                <div className="form-check">
                  <input
                    type="checkbox"
                    className="form-check-input"
                    id="includeCancelled"
                    checked={localFilters.includeCancelled}
                    onChange={(e) => handleLocalFilterChange('includeCancelled', e.target.checked)}
                  />
                  <label className="form-check-label" htmlFor="includeCancelled">
                    İptal edilmiş ürünleri göster
                  </label>
                </div>
              </div>
            </div>
            <div className="mt-3 d-flex gap-2">
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
                <i className="bi bi-x-circle me-1"></i>
                Temizle
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filter Summary */}
      {hasFilters && filterSummary && (
        <div className="alert alert-info alert-dismissible fade show" role="alert">
          <i className="bi bi-funnel-fill me-2"></i>
          <strong>Aktif Filtreler:</strong> {filterSummary}
          <button 
            type="button" 
            className="btn-close" 
            onClick={onResetFilters}
          ></button>
        </div>
      )}

      {/* Items Table */}
      <div className="table-responsive">
        <table className="table table-hover align-middle">
          <thead>
            <tr>
              <th style={{ width: '40px' }}>
                <input
                  type="checkbox"
                  className="form-check-input"
                  checked={isAllSelected}
                  onChange={onSelectAll}
                />
              </th>
              <th style={{ width: '60px' }} className="text-center">Resim</th>
              <th style={{ width: '80px' }}>
                <button
                  className={getSortButtonClass('Number')}
                  onClick={() => onSort?.('Number')}
                >
                  Numara <i className={`bi ${getSortIcon('Number')}`}></i>
                </button>
              </th>
              <th style={{ width: '150px' }}>
                <button
                  className={getSortButtonClass('Code')}
                  onClick={() => onSort?.('Code')}
                >
                  Kod <i className={`bi ${getSortIcon('Code')}`}></i>
                </button>
              </th>
              <th>
                <button
                  className={getSortButtonClass('Name')}
                  onClick={() => onSort?.('Name')}
                >
                  İsim <i className={`bi ${getSortIcon('Name')}`}></i>
                </button>
              </th>
              <th style={{ width: '120px' }}>Doküman No</th>
              <th style={{ width: '150px' }}>Grup</th>
              <th style={{ width: '100px' }}>X-Y-Z</th>
              <th style={{ width: '100px' }}>Durum</th>
              <th style={{ width: '100px' }} className="text-end">İşlemler</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan="10" className="text-center py-5">
                  <i className="bi bi-inbox display-4 text-muted d-block mb-3"></i>
                  <p className="text-muted mb-0">
                    {hasFilters ? 'Filtreye uygun ürün bulunamadı' : 'Henüz ürün bulunmuyor'}
                  </p>
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr key={item.id}>
                  <td>
                    <input
                      type="checkbox"
                      className="form-check-input"
                      checked={selectedItems.includes(item.id)}
                      onChange={() => onSelectItem?.(item.id)}
                    />
                  </td>
                  
                  {/* Resim Kolonu */}
                  <td className="text-center">
                    {item.imageUrl ? (
                      <img 
                        src={apiBaseUrl + item.imageUrl} 
                        alt={item.code}
                        className="img-thumbnail"
                        style={{ 
                          width: '40px', 
                          height: '40px', 
                          objectFit: 'cover',
                          cursor: 'pointer',
                          border: '2px solid #e9ecef'
                        }}
                        onClick={() => onViewItem?.(item)}
                        title="Detayları görüntüle"
                        onError={(e) => { 
                          e.target.style.display = 'none'; 
                        }}
                      />
                    ) : (
                      <div 
                        className="d-flex align-items-center justify-content-center rounded"
                        style={{ 
                          width: '40px', 
                          height: '40px',
                          background: '#f0f0f0',
                          border: '2px solid #e9ecef'
                        }}
                      >
                        <ImageIcon size={16} className="text-muted opacity-50" />
                      </div>
                    )}
                  </td>
                  
                  <td className="fw-medium">{item.number}</td>
                  
                  <td>
                    <button
                      className="btn btn-link p-0 text-start text-decoration-none"
                      onClick={() => onViewItem?.(item)}
                      title="Detayları görüntüle"
                    >
                      <span className="badge bg-light text-dark">{item.code}</span>
                    </button>
                  </td>
                  
                  <td>{item.name}</td>
                  <td className="text-muted small">{item.docNumber || '-'}</td>
                  <td>
                    <span className="badge bg-info text-dark">
                      {getGroupName(item.groupId)}
                    </span>
                  </td>
                  <td className="text-muted small">
                    {item.x || 0} x {item.y || 0} x {item.z || 0}
                  </td>
                  <td>
                    {item.cancelled ? (
                      <span className="badge bg-danger">İptal</span>
                    ) : (
                      <span className="badge bg-success">Aktif</span>
                    )}
                  </td>
                  <td className="text-end">
                    <div className="btn-group btn-group-sm">
                      <button
                        className="btn btn-outline-secondary"
                        onClick={() => onViewItem?.(item)}
                        title="Görüntüle"
                      >
                        <i className="bi bi-eye"></i>
                      </button>
                      <button
                        className="btn btn-outline-primary"
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
        <div className="d-flex justify-content-between align-items-center mt-3">
          <div className="text-muted small">
            Sayfa {pagination.currentPage} / {pagination.totalPages} 
            (Toplam: {pagination.totalCount} ürün)
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

export default ItemsList;