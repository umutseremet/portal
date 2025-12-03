// src/frontend/src/pages/PurchaseRequestsListPage.js
// ⚠️ NOT: Bu dosya direkt pages klasörü altına konulacak (PurchaseManagement alt klasörü YOK)

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import apiService from '../services/api';
import {
  PURCHASE_REQUEST_STATUS,
  PURCHASE_REQUEST_STATUS_LABELS,
  PURCHASE_REQUEST_STATUS_COLORS,
  REQUEST_PRIORITY,
  REQUEST_PRIORITY_LABELS,
  REQUEST_PRIORITY_COLORS
} from '../utils/constants';

const PurchaseRequestsListPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // State
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 20,
    totalCount: 0,
    totalPages: 0
  });

  // Filters
  const [filters, setFilters] = useState({
    requestNumber: '',
    status: '',
    priority: '',
    fromDate: '',
    toDate: '',
    includeCancelled: false
  });

  // Load data
  useEffect(() => {
    loadRequests();
  }, [pagination.page, pagination.pageSize]);

  const loadRequests = async () => {
    try {
      setLoading(true);

      const params = {
        ...filters,
        page: pagination.page,
        pageSize: pagination.pageSize,
        sortBy: 'RequestDate',
        sortOrder: 'desc'
      };

      const response = await apiService.getPurchaseRequests(params);

      setRequests(response.items || []);
      setPagination({
        ...pagination,
        totalCount: response.totalCount,
        totalPages: response.totalPages
      });
    } catch (error) {
      console.error('Error loading purchase requests:', error);
      alert('Talep listesi yüklenirken hata oluştu: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSearch = () => {
    setPagination(prev => ({ ...prev, page: 1 }));
    loadRequests();
  };

  const handleClearFilters = () => {
    setFilters({
      requestNumber: '',
      status: '',
      priority: '',
      fromDate: '',
      toDate: '',
      includeCancelled: false
    });
    setPagination(prev => ({ ...prev, page: 1 }));
    setTimeout(() => loadRequests(), 100);
  };

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const handleCreateNew = () => {
    navigate('/purchase-requests/new');
  };

  const handleViewDetail = (id) => {
    navigate(`/purchase-requests/${id}`);
  };

  const handleEdit = (id) => {
    navigate(`/purchase-requests/${id}/edit`);
  };

  const getStatusBadge = (status) => {
    const color = PURCHASE_REQUEST_STATUS_COLORS[status] || 'secondary';
    const label = PURCHASE_REQUEST_STATUS_LABELS[status] || status;
    return <span className={`badge bg-${color}`}>{label}</span>;
  };

  const getPriorityBadge = (priority) => {
    const color = REQUEST_PRIORITY_COLORS[priority] || 'secondary';
    const label = REQUEST_PRIORITY_LABELS[priority] || priority;
    return <span className={`badge bg-${color}`}>{label}</span>;
  };

  const formatCurrency = (amount) => {
    if (!amount) return '-';
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY'
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Yükleniyor...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid p-4">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="mb-1">
            <i className="bi bi-file-earmark-text text-primary me-2"></i>
            Satınalma Talepleri
          </h2>
          <p className="text-muted mb-0">Tüm satınalma taleplerini görüntüleyin ve yönetin</p>
        </div>
        <button className="btn btn-primary" onClick={handleCreateNew}>
          <i className="bi bi-plus-circle me-2"></i>
          Yeni Talep Oluştur
        </button>
      </div>

      {/* Filters Card */}
      <div className="card mb-4">
        <div className="card-body">
          <div className="row g-3">
            {/* Talep No */}
            <div className="col-md-3">
              <label className="form-label">Talep No</label>
              <input
                type="text"
                className="form-control"
                placeholder="TR-2024-0001"
                value={filters.requestNumber}
                onChange={(e) => handleFilterChange('requestNumber', e.target.value)}
              />
            </div>

            {/* Durum */}
            <div className="col-md-3">
              <label className="form-label">Durum</label>
              <select
                className="form-select"
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
              >
                <option value="">Tümü</option>
                {Object.entries(PURCHASE_REQUEST_STATUS_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>

            {/* Öncelik */}
            <div className="col-md-2">
              <label className="form-label">Öncelik</label>
              <select
                className="form-select"
                value={filters.priority}
                onChange={(e) => handleFilterChange('priority', e.target.value)}
              >
                <option value="">Tümü</option>
                {Object.entries(REQUEST_PRIORITY_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>

            {/* Başlangıç Tarihi */}
            <div className="col-md-2">
              <label className="form-label">Başlangıç</label>
              <input
                type="date"
                className="form-control"
                value={filters.fromDate}
                onChange={(e) => handleFilterChange('fromDate', e.target.value)}
              />
            </div>

            {/* Bitiş Tarihi */}
            <div className="col-md-2">
              <label className="form-label">Bitiş</label>
              <input
                type="date"
                className="form-control"
                value={filters.toDate}
                onChange={(e) => handleFilterChange('toDate', e.target.value)}
              />
            </div>

            {/* İptal edilenleri göster */}
            <div className="col-md-12">
              <div className="form-check">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="includeCancelled"
                  checked={filters.includeCancelled}
                  onChange={(e) => handleFilterChange('includeCancelled', e.target.checked)}
                />
                <label className="form-check-label" htmlFor="includeCancelled">
                  İptal edilenleri göster
                </label>
              </div>
            </div>

            {/* Buttons */}
            <div className="col-md-12">
              <button className="btn btn-primary me-2" onClick={handleSearch}>
                <i className="bi bi-search me-2"></i>
                Ara
              </button>
              <button className="btn btn-outline-secondary" onClick={handleClearFilters}>
                <i className="bi bi-x-circle me-2"></i>
                Temizle
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Table Card */}
      <div className="card">
        <div className="card-body">
          {/* Results Info */}
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5 className="card-title mb-0">
              Talep Listesi ({pagination.totalCount} kayıt)
            </h5>
          </div>

          {/* Table */}
          <div className="table-responsive">
            <table className="table table-hover align-middle">
              <thead className="table-light">
                <tr>
                  <th>Talep No</th>
                  <th>Tarih</th>
                  <th>Talep Eden</th>
                  <th>Departman</th>
                  <th>Öncelik</th>
                  <th>Durum</th>
                  <th className="text-end">Kalem Sayısı</th>
                  <th className="text-end">Tahmini Tutar</th>
                  <th className="text-center">İşlemler</th>
                </tr>
              </thead>
              <tbody>
                {requests.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="text-center py-4">
                      <i className="bi bi-inbox fs-1 text-muted d-block mb-2"></i>
                      <p className="text-muted mb-0">Kayıt bulunamadı</p>
                    </td>
                  </tr>
                ) : (
                  requests.map(request => (
                    <tr key={request.id} style={{ cursor: 'pointer' }} onClick={() => handleViewDetail(request.id)}>
                      <td>
                        <strong className="text-primary">{request.requestNumber}</strong>
                      </td>
                      <td>{new Date(request.requestDate).toLocaleDateString('tr-TR')}</td>
                      <td>{request.userName}</td>
                      <td>{request.departmentName || '-'}</td>
                      <td>{getPriorityBadge(request.priority)}</td>
                      <td>{getStatusBadge(request.status)}</td>
                      <td className="text-end">{request.detailCount}</td>
                      <td className="text-end">{formatCurrency(request.totalEstimatedAmount)}</td>
                      <td className="text-center">
                        <button
                          className="btn btn-sm btn-outline-primary me-1"
                          onClick={(e) => { e.stopPropagation(); handleViewDetail(request.id); }}
                          title="Detay Görüntüle"
                        >
                          <i className="bi bi-eye"></i>
                        </button>
                        {request.status === PURCHASE_REQUEST_STATUS.DRAFT && (
                          <button
                            className="btn btn-sm btn-outline-warning"
                            onClick={(e) => { e.stopPropagation(); handleEdit(request.id); }}
                            title="Düzenle"
                          >
                            <i className="bi bi-pencil"></i>
                          </button>
                        )}
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
              <ul className="pagination justify-content-center mb-0">
                <li className={`page-item ${pagination.page === 1 ? 'disabled' : ''}`}>
                  <button
                    className="page-link"
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page === 1}
                  >
                    Önceki
                  </button>
                </li>
                {[...Array(pagination.totalPages)].map((_, i) => (
                  <li key={i + 1} className={`page-item ${pagination.page === i + 1 ? 'active' : ''}`}>
                    <button
                      className="page-link"
                      onClick={() => handlePageChange(i + 1)}
                    >
                      {i + 1}
                    </button>
                  </li>
                ))}
                <li className={`page-item ${pagination.page === pagination.totalPages ? 'disabled' : ''}`}>
                  <button
                    className="page-link"
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page === pagination.totalPages}
                  >
                    Sonraki
                  </button>
                </li>
              </ul>
            </nav>
          )}
        </div>
      </div>
    </div>
  );
};

export default PurchaseRequestsListPage;