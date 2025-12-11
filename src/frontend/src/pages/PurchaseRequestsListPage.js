// src/frontend/src/pages/PurchaseRequestsListPage.js
// ✅ Tüm onay aşamalarındaki talepleri gösterir (ManagerApproval, PurchasingReview, Approved)

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

      console.log('📦 Loading requests with params:', params);
      const response = await apiService.getPurchaseRequests(params);
      console.log('📦 API Response:', response);

      // Response yapısını kontrol et
      const items = response.items || response.data?.items || response.data?.requests || [];
      const totalCount = response.totalCount || response.data?.totalCount || 0;
      const totalPages = response.totalPages || response.data?.totalPages || 0;

      console.log('✅ Loaded requests:', items.length);
      console.log('📊 Status distribution:');
      const statusCounts = {};
      items.forEach(req => {
        statusCounts[req.status] = (statusCounts[req.status] || 0) + 1;
      });
      console.table(statusCounts);

      setRequests(items);
      setPagination({
        ...pagination,
        totalCount: totalCount,
        totalPages: totalPages
      });
    } catch (error) {
      console.error('❌ Error loading purchase requests:', error);
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

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('tr-TR');
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
          <p className="text-muted mb-0">
            Tüm satınalma taleplerini görüntüleyin ve yönetin
            <small className="ms-2">({pagination.totalCount} talep)</small>
          </p>
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
                  <option key={key} value={key}>
                    {label}
                  </option>
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
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            {/* Tarih Aralığı */}
            <div className="col-md-2">
              <label className="form-label">Başlangıç</label>
              <input
                type="date"
                className="form-control"
                value={filters.fromDate}
                onChange={(e) => handleFilterChange('fromDate', e.target.value)}
              />
            </div>

            <div className="col-md-2">
              <label className="form-label">Bitiş</label>
              <input
                type="date"
                className="form-control"
                value={filters.toDate}
                onChange={(e) => handleFilterChange('toDate', e.target.value)}
              />
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

              <div className="form-check form-switch d-inline-block ms-3">
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
          </div>
        </div>
      </div>

      {/* Results Table */}
      <div className="card">
        <div className="card-body p-0">
          {requests.length === 0 ? (
            <div className="text-center py-5 text-muted">
              <i className="bi bi-inbox display-1"></i>
              <p className="mt-3">Talep bulunamadı</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th style={{ width: '50px' }}>#</th>
                    <th>Talep No</th>
                    <th>Talep Tarihi</th>
                    <th>Talep Eden</th>
                    <th>Durum</th>
                    <th>Öncelik</th>
                    <th className="text-end">Ürün Sayısı</th>
                    <th className="text-end">Tahmini Tutar</th>
                    <th className="text-center">İşlemler</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map((request, index) => (
                    <tr key={request.id}>
                      <td>{(pagination.page - 1) * pagination.pageSize + index + 1}</td>
                      <td>
                        <strong>{request.requestNumber}</strong>
                      </td>
                      <td>{formatDate(request.requestDate)}</td>
                      <td>
                        {request.userName || request.requesterName || '-'}
                        {request.departmentName && (
                          <small className="d-block text-muted">{request.departmentName}</small>
                        )}
                      </td>
                      <td>{getStatusBadge(request.status)}</td>
                      <td>{getPriorityBadge(request.priority)}</td>
                      <td className="text-end">
                        <span className="badge bg-info">{request.detailCount || request.details?.length || 0}</span>
                      </td>
                      <td className="text-end">
                        {formatCurrency(request.totalEstimatedAmount)}
                      </td>
                      <td className="text-center">
                        <div className="btn-group btn-group-sm">
                          <button
                            className="btn btn-outline-primary"
                            onClick={() => handleViewDetail(request.id)}
                            title="Detay"
                          >
                            <i className="bi bi-eye"></i>
                          </button>
                          {request.status === 'Draft' && (
                            <button
                              className="btn btn-outline-secondary"
                              onClick={() => handleEdit(request.id)}
                              title="Düzenle"
                            >
                              <i className="bi bi-pencil"></i>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="card-footer">
            <nav>
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
          </div>
        )}
      </div>
    </div>
  );
};

export default PurchaseRequestsListPage;