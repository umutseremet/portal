import React, { useState } from 'react';
import { formatDate } from '../../utils/helpers';

const VisitorsList = ({ 
  visitors = [], 
  loading = false, 
  onEdit, 
  onDelete, 
  onView,
  pagination = {},
  onPageChange,
  onSort,
  sortBy = 'date',
  sortOrder = 'desc',
  selectedVisitors = [],
  onSelectVisitor,
  onSelectAll,
  isAllSelected = false
}) => {
  const [deleteModal, setDeleteModal] = useState({ show: false, visitor: null });

  // Debug log
  console.log('VisitorsList rendered with:', {
    visitorsCount: visitors?.length || 0,
    visitors: visitors,
    loading,
    pagination
  });

  const handleSort = (column) => {
    const newOrder = sortBy === column && sortOrder === 'asc' ? 'desc' : 'asc';
    onSort?.(column, newOrder);
  };

  const getSortIcon = (column) => {
    if (sortBy !== column) return 'bi-arrow-down-up text-muted';
    return sortOrder === 'asc' ? 'bi-arrow-up text-primary' : 'bi-arrow-down text-primary';
  };

  const handleDeleteClick = (visitor) => {
    setDeleteModal({ show: true, visitor });
  };

  const handleDeleteConfirm = async () => {
    if (deleteModal.visitor) {
      try {
        await onDelete?.(deleteModal.visitor.id);
        setDeleteModal({ show: false, visitor: null });
      } catch (error) {
        // Error will be handled by parent component
        console.error('Delete failed:', error);
      }
    }
  };

  const handleDeleteCancel = () => {
    setDeleteModal({ show: false, visitor: null });
  };

  const getStatusColor = (date) => {
    const visitDate = new Date(date);
    const today = new Date();
    const diffTime = today - visitDate;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'text-success'; // Today
    if (diffDays <= 7) return 'text-info';     // This week
    if (diffDays <= 30) return 'text-warning'; // This month
    return 'text-muted';                        // Older
  };

  const getRelativeDate = (date) => {
    const visitDate = new Date(date);
    const today = new Date();
    const diffTime = today - visitDate;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Bugün';
    if (diffDays === 1) return 'Dün';
    if (diffDays <= 7) return `${diffDays} gün önce`;
    if (diffDays <= 30) return `${Math.ceil(diffDays / 7)} hafta önce`;
    if (diffDays <= 365) return `${Math.ceil(diffDays / 30)} ay önce`;
    return `${Math.ceil(diffDays / 365)} yıl önce`;
  };

  if (loading && visitors.length === 0) {
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

  if (!loading && visitors.length === 0) {
    return (
      <div className="text-center py-5">
        <div className="mb-4">
          <i className="bi bi-people display-1 text-muted"></i>
        </div>
        <h5 className="text-muted mb-3">Henüz ziyaretçi kaydı bulunmuyor</h5>
        <p className="text-muted">İlk ziyaretçi kaydınızı oluşturmak için "Yeni Ziyaretçi" butonunu kullanın.</p>
      </div>
    );
  }

  return (
    <>
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
        <div className="d-flex gap-2">
          {selectedVisitors.length > 0 && (
            <button 
              className="btn btn-sm btn-outline-danger"
              onClick={() => {/* Handle bulk delete */}}
            >
              <i className="bi bi-trash me-1"></i>
              Seçilenleri Sil ({selectedVisitors.length})
            </button>
          )}
          <button className="btn btn-sm btn-outline-secondary">
            <i className="bi bi-funnel me-1"></i>
            Filtrele
          </button>
          <button className="btn btn-sm btn-outline-secondary">
            <i className="bi bi-download me-1"></i>
            Excel
          </button>
        </div>
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
              <th>
                <button 
                  className="btn btn-link p-0 text-decoration-none fw-semibold text-dark"
                  onClick={() => handleSort('date')}
                >
                  Tarih
                  <i className={`bi ${getSortIcon('date')} ms-1 small`}></i>
                </button>
              </th>
              <th>
                <button 
                  className="btn btn-link p-0 text-decoration-none fw-semibold text-dark"
                  onClick={() => handleSort('company')}
                >
                  Şirket
                  <i className={`bi ${getSortIcon('company')} ms-1 small`}></i>
                </button>
              </th>
              <th>
                <button 
                  className="btn btn-link p-0 text-decoration-none fw-semibold text-dark"
                  onClick={() => handleSort('visitor')}
                >
                  Ziyaretçi
                  <i className={`bi ${getSortIcon('visitor')} ms-1 small`}></i>
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
                    <div className={`fw-semibold ${getStatusColor(visitor.date)}`}>
                      {formatDate(visitor.date, 'DD/MM/YYYY')}
                    </div>
                    <small className="text-muted">
                      {getRelativeDate(visitor.date)}
                    </small>
                  </div>
                </td>
                <td>
                  <div className="d-flex align-items-center">
                    <div className="me-2">
                      <div className="bg-primary text-white rounded d-flex align-items-center justify-content-center" 
                           style={{ width: '32px', height: '32px', fontSize: '0.75rem' }}>
                        {visitor.company?.charAt(0)?.toUpperCase() || 'N/A'}
                      </div>
                    </div>
                    <div>
                      <div className="fw-semibold">{visitor.company || 'Belirtilmemiş'}</div>
                      <small className="text-muted">Şirket</small>
                    </div>
                  </div>
                </td>
                <td>
                  <div className="fw-semibold">{visitor.visitor || 'Belirtilmemiş'}</div>
                  <small className="text-muted">Ziyaretçi</small>
                </td>
                <td>
                  <div className="description-cell">
                    {visitor.description ? (
                      <>
                        <div className="description-text">
                          {visitor.description.length > 100 
                            ? `${visitor.description.substring(0, 100)}...` 
                            : visitor.description
                          }
                        </div>
                        {visitor.description.length > 100 && (
                          <small className="text-muted">
                            <i className="bi bi-three-dots"></i>
                          </small>
                        )}
                      </>
                    ) : (
                      <span className="text-muted">-</span>
                    )}
                  </div>
                </td>
                <td>
                  <div className="dropdown">
                    <button 
                      className="btn btn-sm btn-outline-secondary dropdown-toggle"
                      data-bs-toggle="dropdown"
                      aria-expanded="false"
                    >
                      <i className="bi bi-three-dots-vertical"></i>
                    </button>
                    <ul className="dropdown-menu">
                      <li>
                        <button 
                          className="dropdown-item"
                          onClick={() => onView?.(visitor)}
                        >
                          <i className="bi bi-eye me-2"></i>Detayları Gör
                        </button>
                      </li>
                      <li>
                        <button 
                          className="dropdown-item"
                          onClick={() => onEdit?.(visitor)}
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

      {/* Loading overlay */}
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
            {pagination.page * pagination.pageSize - pagination.pageSize + 1}-
            {Math.min(pagination.page * pagination.pageSize, pagination.totalCount)} of{' '}
            {pagination.totalCount} entries
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
                const pageNum = pagination.page - 2 + i;
                if (pageNum < 1 || pageNum > pagination.totalPages) return null;
                
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
              }).filter(Boolean)}
              
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

      {/* Delete Confirmation Modal */}
      {deleteModal.show && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Ziyaretçi Sil</h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={handleDeleteCancel}
                ></button>
              </div>
              <div className="modal-body">
                <div className="d-flex align-items-center mb-3">
                  <div className="me-3">
                    <i className="bi bi-exclamation-triangle-fill text-warning display-6"></i>
                  </div>
                  <div>
                    <h6 className="mb-1">Bu ziyaretçi kaydını silmek istediğinizden emin misiniz?</h6>
                    <p className="text-muted mb-0">
                      <strong>{deleteModal.visitor?.visitor}</strong> ({deleteModal.visitor?.company})
                    </p>
                    <small className="text-muted">
                      Tarih: {formatDate(deleteModal.visitor?.date, 'DD/MM/YYYY')}
                    </small>
                  </div>
                </div>
                <div className="alert alert-warning small mb-0">
                  <i className="bi bi-info-circle me-2"></i>
                  Bu işlem geri alınamaz. Ziyaretçi kaydı kalıcı olarak silinecektir.
                </div>
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={handleDeleteCancel}
                >
                  İptal
                </button>
                <button 
                  type="button" 
                  className="btn btn-danger"
                  onClick={handleDeleteConfirm}
                >
                  <i className="bi bi-trash me-1"></i>
                  Sil
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .description-cell {
          max-width: 200px;
        }
        .description-text {
          word-wrap: break-word;
          white-space: normal;
        }
        .table td {
          vertical-align: middle;
        }
        .dropdown-menu {
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          border: none;
          border-radius: 8px;
        }
        .dropdown-item:hover {
          background-color: rgba(255, 107, 107, 0.1);
          color: #FF6B6B;
        }
        .dropdown-item.text-danger:hover {
          background-color: rgba(220, 53, 69, 0.1);
          color: #dc3545;
        }
      `}</style>
    </>
  );
};

export default VisitorsList;