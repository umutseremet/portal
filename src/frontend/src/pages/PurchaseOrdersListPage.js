// src/frontend/src/pages/PurchaseOrdersListPage.js
// ItemsPage benzeri liste-detay yapısı

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import apiService from '../services/api';
import {
  PURCHASE_ORDER_STATUS,
  PURCHASE_ORDER_STATUS_LABELS,
  PURCHASE_ORDER_STATUS_COLORS
} from '../utils/constants';

const PurchaseOrdersListPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    orderNumber: '',
    status: '',
    supplierName: '',
    fromDate: '',
    toDate: '',
    page: 1,
    pageSize: 10,
    sortBy: 'orderDate',
    sortOrder: 'desc'
  });
  const [pagination, setPagination] = useState({
    totalCount: 0,
    totalPages: 0,
    currentPage: 1,
    hasNextPage: false,
    hasPreviousPage: false
  });

  useEffect(() => {
    loadOrders();
  }, [filters]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const response = await apiService.getPurchaseOrders(filters);
      setOrders(response.items || []);
      setPagination({
        totalCount: response.totalCount || 0,
        totalPages: response.totalPages || 0,
        currentPage: response.page || 1,
        hasNextPage: response.hasNextPage || false,
        hasPreviousPage: response.hasPreviousPage || false
      });
    } catch (error) {
      console.error('Error loading orders:', error);
      alert('Siparişler yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value,
      page: 1
    }));
  };

  const handlePageChange = (newPage) => {
    setFilters(prev => ({ ...prev, page: newPage }));
  };

  const handleViewDetail = (orderId) => {
    navigate(`/purchase-orders/${orderId}`);
  };

  const getStatusBadge = (status) => {
    const color = PURCHASE_ORDER_STATUS_COLORS[status] || 'secondary';
    const label = PURCHASE_ORDER_STATUS_LABELS[status] || status;
    return <span className={`badge bg-${color}`}>{label}</span>;
  };

  const formatCurrency = (amount) => {
    if (!amount) return '-';
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY'
    }).format(amount);
  };

  const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('tr-TR');
  };

  return (
    <div className="container-fluid py-4">
      {/* Header */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="card shadow-sm">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h2 className="mb-1">
                    <i className="bi bi-receipt text-primary me-2"></i>
                    Satınalma Siparişleri
                  </h2>
                  <p className="text-muted mb-0">
                    Toplam {pagination.totalCount} sipariş
                  </p>
                </div>
                <button
                  className="btn btn-primary"
                  onClick={() => navigate('/purchase-orders/new')}
                >
                  <i className="bi bi-plus-lg me-2"></i>
                  Yeni Sipariş
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="card shadow-sm">
            <div className="card-header bg-light">
              <h5 className="mb-0">
                <i className="bi bi-funnel me-2"></i>
                Filtrele
              </h5>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-md-3 mb-3">
                  <label className="form-label">Sipariş No</label>
                  <input
                    type="text"
                    className="form-control"
                    name="orderNumber"
                    value={filters.orderNumber}
                    onChange={handleFilterChange}
                    placeholder="Sipariş numarası..."
                  />
                </div>

                <div className="col-md-3 mb-3">
                  <label className="form-label">Tedarikçi</label>
                  <input
                    type="text"
                    className="form-control"
                    name="supplierName"
                    value={filters.supplierName}
                    onChange={handleFilterChange}
                    placeholder="Tedarikçi adı..."
                  />
                </div>

                <div className="col-md-2 mb-3">
                  <label className="form-label">Durum</label>
                  <select
                    className="form-select"
                    name="status"
                    value={filters.status}
                    onChange={handleFilterChange}
                  >
                    <option value="">Tümü</option>
                    {Object.entries(PURCHASE_ORDER_STATUS_LABELS).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </div>

                <div className="col-md-2 mb-3">
                  <label className="form-label">Başlangıç</label>
                  <input
                    type="date"
                    className="form-control"
                    name="fromDate"
                    value={filters.fromDate}
                    onChange={handleFilterChange}
                  />
                </div>

                <div className="col-md-2 mb-3">
                  <label className="form-label">Bitiş</label>
                  <input
                    type="date"
                    className="form-control"
                    name="toDate"
                    value={filters.toDate}
                    onChange={handleFilterChange}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="row">
        <div className="col-12">
          <div className="card shadow-sm">
            <div className="card-body">
              {loading ? (
                <div className="text-center py-5">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Yükleniyor...</span>
                  </div>
                </div>
              ) : orders.length === 0 ? (
                <div className="text-center py-5 text-muted">
                  <i className="bi bi-inbox fs-1 d-block mb-3"></i>
                  <p className="mb-0">Sipariş bulunamadı</p>
                </div>
              ) : (
                <>
                  <div className="table-responsive">
                    <table className="table table-hover align-middle">
                      <thead className="table-light">
                        <tr>
                          <th>Sipariş No</th>
                          <th>Tedarikçi</th>
                          <th>Sipariş Tarihi</th>
                          <th>Durum</th>
                          <th className="text-end">Toplam Tutar</th>
                          <th>Teslim Tarihi</th>
                          <th className="text-center">İşlem</th>
                        </tr>
                      </thead>
                      <tbody>
                        {orders.map((order) => (
                          <tr key={order.id}>
                            <td>
                              <code className="text-primary">{order.orderNumber}</code>
                            </td>
                            <td>{order.supplierName}</td>
                            <td>{formatDate(order.orderDate)}</td>
                            <td>{getStatusBadge(order.status)}</td>
                            <td className="text-end">
                              <strong>{formatCurrency(order.grandTotal)}</strong>
                            </td>
                            <td>{formatDate(order.deliveryDate)}</td>
                            <td className="text-center">
                              <button
                                className="btn btn-sm btn-outline-primary"
                                onClick={() => handleViewDetail(order.id)}
                                title="Görüntüle"
                              >
                                <i className="bi bi-eye"></i>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  {pagination.totalPages > 1 && (
                    <div className="d-flex justify-content-between align-items-center mt-3">
                      <div className="text-muted">
                        Sayfa {pagination.currentPage} / {pagination.totalPages}
                        {' '}(Toplam {pagination.totalCount} kayıt)
                      </div>
                      <nav>
                        <ul className="pagination mb-0">
                          <li className={`page-item ${!pagination.hasPreviousPage ? 'disabled' : ''}`}>
                            <button
                              className="page-link"
                              onClick={() => handlePageChange(filters.page - 1)}
                              disabled={!pagination.hasPreviousPage}
                            >
                              Önceki
                            </button>
                          </li>
                          <li className={`page-item ${!pagination.hasNextPage ? 'disabled' : ''}`}>
                            <button
                              className="page-link"
                              onClick={() => handlePageChange(filters.page + 1)}
                              disabled={!pagination.hasNextPage}
                            >
                              Sonraki
                            </button>
                          </li>
                        </ul>
                      </nav>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PurchaseOrdersListPage;