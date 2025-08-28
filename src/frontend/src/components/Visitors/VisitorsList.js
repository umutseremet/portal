// ===== 2. src/frontend/src/components/Visitors/VisitorsList.js (DÜZELTME) =====

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

    if (diffDays === 0) return 'text-success';
    if (diffDays <= 7) return 'text-info';
    if (diffDays <= 30) return 'text-warning';
    return 'text-muted';
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

  const formatDateForDisplay = (date) => {
    if (!date) return '';
    const d = new Date(date);
    if (isNaN(d)) return '';
    
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    
    return `${day}.${month}.${year}`;
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
        <h5 className="text-muted mb-3">Henüz ziyaretçi kaydı bulunmuyor</h5>
        <p className="text-muted">İlk ziyaretçi kaydınızı oluşturmak için "Yeni Ziyaretçi" butonunu kullanın.</p>
      </div>
    );
  }

  // ⚡ VISITOR LIST - Ana içerik
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
                    onChange={() => onSelectAll?.()}
                  />
                </div>
              </th>
              <th 
                style={{ cursor: 'pointer' }}
                onClick={() => handleSort('date')}
              >
                Tarih
                <i className={`bi ${getSortIcon('date')} ms-1`}></i>
              </th>
              <th 
                style={{ cursor: 'pointer' }}
                onClick={() => handleSort('company')}
              >
                Şirket
                <i className={`bi ${getSortIcon('company')} ms-1`}></i>
              </th>
              <th 
                style={{ cursor: 'pointer' }}
                onClick={() => handleSort('visitor')}
              >
                Ziyaretçi
                <i className={`bi ${getSortIcon('visitor')} ms-1`}></i>
              </th>
              <th>Açıklama</th>
              <th style={{ width: '100px' }}>İşlemler</th>
            </tr>
          </thead>
          <tbody>
            {visitors.map((visitor, index) => (
              <tr key={visitor.id || index}>
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
                <p>
                  <strong>{deleteModal.visitor?.visitor}</strong> adlı ziyaretçiyi silmek istediğinizden emin misiniz?
                </p>
                <p className="text-muted small mb-0">Bu işlem geri alınamaz.</p>
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
    </>
  );
};

export default VisitorsList;