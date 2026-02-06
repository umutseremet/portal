// src/frontend/src/components/Visitors/VisitorsList.js
// ✅ ALTERNATİF ÇÖZÜM - Bootstrap Dropdown Conflict Olmadan

import { useState, useEffect, useRef } from 'react';

const VisitorsList = ({ 
  visitors, 
  loading, 
  error, 
  isEmpty, 
  hasFilters, 
  filters, 
  pagination,
  selectedVisitors = [],
  selectedCount = 0,
  isAllSelected = false,
  filterSummary = '',
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

  // ✅ ÇÖZÜM: Her satır için ayrı dropdown state
  const [openDropdownId, setOpenDropdownId] = useState(null);
  
  // ✅ Dropdown ref - dışarı tıklamada kapatmak için
  const dropdownRefs = useRef({});

  // ✅ CRITICAL FIX: Bootstrap'in dropdown initialization'ını devre dışı bırak
  useEffect(() => {
    // Bootstrap dropdown'larını temizle
    const dropdowns = document.querySelectorAll('[data-bs-toggle="dropdown"]');
    dropdowns.forEach(dropdown => {
      dropdown.removeAttribute('data-bs-toggle');
    });
  }, [visitors]);

  // ✅ Dışarı tıklamada dropdown'ı kapat
  useEffect(() => {
    const handleClickOutside = (event) => {
      const isClickInside = Object.values(dropdownRefs.current).some(ref => 
        ref && ref.contains(event.target)
      );
      
      if (!isClickInside) {
        setOpenDropdownId(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Update local filters when props change
  useEffect(() => {
    setLocalFilters({
      fromDate: filters.fromDate || '',
      toDate: filters.toDate || '',
      company: filters.company || '',
      visitor: filters.visitor || '',
      sortBy: filters.sortBy || 'date',
      sortOrder: filters.sortOrder || 'desc'
    });
  }, [filters]);

  // Format date for display
  const formatDisplayDate = (dateStr) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('tr-TR');
    } catch (error) {
      return dateStr;
    }
  };

  // Get time ago color based on days
  const getTimeAgoColor = (dateStr) => {
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const diffTime = Math.abs(now - date);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays <= 1) return 'text-success';
      if (diffDays <= 7) return 'text-info';
      if (diffDays <= 30) return 'text-warning';
      return 'text-muted';
    } catch {
      return 'text-muted';
    }
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
    setOpenDropdownId(null);
    if (window.confirm(`${visitor.visitorName || visitor.visitor} ziyaretçisini silmek istediğinizden emin misiniz?`)) {
      if (onDeleteVisitor) {
        onDeleteVisitor(visitor);
      }
    }
  };

  // ✅ Toggle dropdown
  const toggleDropdown = (visitorId, event) => {
    event.preventDefault();
    event.stopPropagation();
    console.log('Toggle dropdown for:', visitorId, 'Current:', openDropdownId);
    setOpenDropdownId(prev => prev === visitorId ? null : visitorId);
  };

  // Handle sort - Backend'e istek gönderir
  const handleSort = (column) => {
    console.log('🔄 VisitorsList: Sorting requested for column:', column);
    console.log('   Current filters:', { sortBy: filters.sortBy, sortOrder: filters.sortOrder });
    
    // Aynı kolona tıklandığında sıralama yönünü değiştir
    const newOrder = filters.sortBy === column && filters.sortOrder === 'desc' ? 'asc' : 'desc';
    
    console.log('   New sort order will be:', newOrder);
    console.log('   Calling onSort callback...');
    
    if (onSort) {
      onSort(column, newOrder);
    } else {
      console.error('❌ onSort callback is not defined!');
    }
  };

  // Get sort icon
  const getSortIcon = (column) => {
    if (filters.sortBy !== column) {
      return 'bi-arrow-down-up';
    }
    return filters.sortOrder === 'desc' ? 'bi-arrow-down' : 'bi-arrow-up';
  };

  // Get sort button class
  const getSortButtonClass = (column) => {
    const baseClass = "btn btn-link text-decoration-none p-0 fw-medium d-flex align-items-center";
    const activeClass = filters.sortBy === column ? "text-primary" : "text-dark";
    return `${baseClass} ${activeClass}`;
  };

  // Loading state
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

  // Empty state
  if (!loading && (!visitors || visitors.length === 0)) {
    return (
      <>
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div></div>
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

        {showFilters && (
          <div className="card mb-4">
            <div className="card-body">
              <div className="row">
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
                    value={localFilters.company}
                    onChange={(e) => handleLocalFilterChange('company', e.target.value)}
                    placeholder="Şirket adı..."
                  />
                </div>
                <div className="col-md-3">
                  <label className="form-label small">Ziyaretçi</label>
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    value={localFilters.visitor}
                    onChange={(e) => handleLocalFilterChange('visitor', e.target.value)}
                    placeholder="Ziyaretçi adı..."
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
              : 'İlk ziyaretçi kaydınızı oluşturmak için yukarıdaki "Yeni Ziyaretçi" butonunu kullanın.'
            }
          </p>
          {hasFilters && (
            <button className="btn btn-outline-secondary" onClick={handleResetFilters}>
              <i className="bi bi-arrow-clockwise me-1"></i>
              Filtreleri Temizle
            </button>
          )}
        </div>
      </>
    );
  }

  return (
    <>
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
            Yeni Ziyaretçi
          </button>
        </div>
      </div>

      {showFilters && (
        <div className="card mb-4">
          <div className="card-body">
            <div className="row">
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
                  value={localFilters.company}
                  onChange={(e) => handleLocalFilterChange('company', e.target.value)}
                  placeholder="Şirket adı..."
                />
              </div>
              <div className="col-md-3">
                <label className="form-label small">Ziyaretçi</label>
                <input
                  type="text"
                  className="form-control form-control-sm"
                  value={localFilters.visitor}
                  onChange={(e) => handleLocalFilterChange('visitor', e.target.value)}
                  placeholder="Ziyaretçi adı..."
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
                  className={getSortButtonClass('date')}
                  onClick={() => handleSort('date')}
                  title="Tarihe göre sırala"
                >
                  Tarih
                  <i className={`bi ms-1 ${getSortIcon('date')}`}></i>
                </button>
              </th>
              <th>
                <button 
                  className={getSortButtonClass('company')}
                  onClick={() => handleSort('company')}
                  title="Şirkete göre sırala"
                >
                  Şirket
                  <i className={`bi ms-1 ${getSortIcon('company')}`}></i>
                </button>
              </th>
              <th>
                <button 
                  className={getSortButtonClass('visitor')}
                  onClick={() => handleSort('visitor')}
                  title="Ziyaretçiye göre sırala"
                >
                  Ziyaretçi
                  <i className={`bi ms-1 ${getSortIcon('visitor')}`}></i>
                </button>
              </th>
              <th>Açıklama</th>
              <th style={{ width: '140px' }}>İşlemler</th>
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
                      onChange={() => onSelectVisitor(visitor.id)}
                    />
                  </div>
                </td>
                <td>
                  <span className={`small ${getTimeAgoColor(visitor.date)}`}>
                    {formatDisplayDate(visitor.date)}
                  </span>
                </td>
                <td>
                  <span className="fw-medium">{visitor.company}</span>
                </td>
                <td>
                  <span>{visitor.visitorName || visitor.visitor}</span>
                </td>
                <td>
                  <span className="small text-muted">
                    {visitor.description ? (
                      visitor.description.length > 50 
                        ? visitor.description.substring(0, 50) + '...'
                        : visitor.description
                    ) : '-'}
                  </span>
                </td>
                <td>
                  {/* ✅ TAMAMEN YENİ DROPDOWN - Bootstrap conflict yok */}
                  <div 
                    className="position-relative" 
                    ref={el => dropdownRefs.current[visitor.id] = el}
                    style={{ display: 'inline-block' }}
                  >
                    <button 
                      className="btn btn-sm btn-outline-secondary"
                      type="button"
                      onClick={(e) => toggleDropdown(visitor.id, e)}
                      style={{ minWidth: '40px' }}
                    >
                      <i className="bi bi-three-dots-vertical"></i>
                    </button>
                    
                    {/* ✅ Sadece ilgili dropdown açık ise göster */}
                    {openDropdownId === visitor.id && (
                      <div 
                        className="position-absolute bg-white border rounded shadow-sm"
                        style={{ 
                          top: '100%', 
                          right: 0, 
                          zIndex: 1050,
                          minWidth: '160px',
                          marginTop: '4px'
                        }}
                      >
                        <div className="py-1">
                          <button 
                            className="dropdown-item d-flex align-items-center px-3 py-2"
                            onClick={() => {
                              setOpenDropdownId(null);
                              onViewVisitor(visitor);
                            }}
                            style={{ 
                              border: 'none',
                              background: 'transparent',
                              cursor: 'pointer',
                              transition: 'background-color 0.15s'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                          >
                            <i className="bi bi-eye me-2"></i>
                            Detayları Gör
                          </button>
                          
                          <button 
                            className="dropdown-item d-flex align-items-center px-3 py-2"
                            onClick={() => {
                              setOpenDropdownId(null);
                              onEditVisitor(visitor);
                            }}
                            style={{ 
                              border: 'none',
                              background: 'transparent',
                              cursor: 'pointer',
                              transition: 'background-color 0.15s'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                          >
                            <i className="bi bi-pencil me-2"></i>
                            Düzenle
                          </button>
                          
                          <div style={{ borderTop: '1px solid #dee2e6', margin: '4px 0' }}></div>
                          
                          <button 
                            className="dropdown-item d-flex align-items-center px-3 py-2 text-danger"
                            onClick={() => handleDeleteClick(visitor)}
                            style={{ 
                              border: 'none',
                              background: 'transparent',
                              cursor: 'pointer',
                              transition: 'background-color 0.15s'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8d7da'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                          >
                            <i className="bi bi-trash me-2"></i>
                            Sil
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

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
              {[...Array(pagination.totalPages)].map((_, index) => {
                const page = index + 1;
                if (
                  page === 1 ||
                  page === pagination.totalPages ||
                  (page >= pagination.currentPage - 2 && page <= pagination.currentPage + 2)
                ) {
                  return (
                    <li 
                      key={page} 
                      className={`page-item ${pagination.currentPage === page ? 'active' : ''}`}
                    >
                      <button 
                        className="page-link"
                        onClick={() => onPageChange(page)}
                      >
                        {page}
                      </button>
                    </li>
                  );
                } else if (
                  page === pagination.currentPage - 3 ||
                  page === pagination.currentPage + 3
                ) {
                  return (
                    <li key={page} className="page-item disabled">
                      <span className="page-link">...</span>
                    </li>
                  );
                }
                return null;
              })}
              <li className={`page-item ${pagination.currentPage >= pagination.totalPages ? 'disabled' : ''}`}>
                <button 
                  className="page-link"
                  onClick={() => onPageChange(pagination.currentPage + 1)}
                  disabled={pagination.currentPage >= pagination.totalPages}
                >
                  <i className="bi bi-chevron-right"></i>
                </button>
              </li>
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

export default VisitorsList;