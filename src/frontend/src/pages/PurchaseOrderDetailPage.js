// src/frontend/src/pages/PurchaseOrderDetailPage.js
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import apiService from '../services/api';
import {
  PURCHASE_ORDER_STATUS,
  PURCHASE_ORDER_STATUS_LABELS,
  PURCHASE_ORDER_STATUS_COLORS
} from '../utils/constants';

const PurchaseOrderDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState(null);

  useEffect(() => {
    loadOrder();
  }, [id]);

  const loadOrder = async () => {
    try {
      setLoading(true);
      const response = await apiService.getPurchaseOrder(id);
      setOrder(response);
    } catch (error) {
      console.error('Error loading order:', error);
      alert('Sipariş yüklenirken hata oluştu');
      navigate('/purchase-orders');
    } finally {
      setLoading(false);
    }
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
    return new Date(date).toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="container-fluid py-4">
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Yükleniyor...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!order) {
    return null;
  }

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
                    Sipariş Detayı
                  </h2>
                  <p className="text-muted mb-0">{order.orderNumber}</p>
                </div>
                <button 
                  className="btn btn-outline-secondary" 
                  onClick={() => navigate('/purchase-orders')}
                >
                  <i className="bi bi-arrow-left me-2"></i>
                  Geri
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="row">
        {/* Temel Bilgiler */}
        <div className="col-lg-6 mb-4">
          <div className="card shadow-sm h-100">
            <div className="card-header bg-light">
              <h5 className="mb-0">
                <i className="bi bi-info-circle me-2"></i>
                Temel Bilgiler
              </h5>
            </div>
            <div className="card-body">
              <table className="table table-borderless">
                <tbody>
                  <tr>
                    <td className="text-muted" width="40%">Sipariş No:</td>
                    <td><strong>{order.orderNumber}</strong></td>
                  </tr>
                  <tr>
                    <td className="text-muted">Durum:</td>
                    <td>{getStatusBadge(order.status)}</td>
                  </tr>
                  <tr>
                    <td className="text-muted">Tedarikçi:</td>
                    <td><strong>{order.supplierName}</strong></td>
                  </tr>
                  <tr>
                    <td className="text-muted">Sipariş Tarihi:</td>
                    <td>{formatDate(order.orderDate)}</td>
                  </tr>
                  <tr>
                    <td className="text-muted">Teslim Tarihi:</td>
                    <td>{formatDate(order.deliveryDate)}</td>
                  </tr>
                  <tr>
                    <td className="text-muted">Ara Toplam:</td>
                    <td className="text-end">{formatCurrency(order.totalAmount)}</td>
                  </tr>
                  <tr>
                    <td className="text-muted">KDV ({order.vatRate || 20}%):</td>
                    <td className="text-end">{formatCurrency(order.vatAmount)}</td>
                  </tr>
                  <tr className="table-light">
                    <td className="text-muted"><strong>Genel Toplam:</strong></td>
                    <td className="text-end">
                      <strong className="text-success fs-5">{formatCurrency(order.grandTotal)}</strong>
                    </td>
                  </tr>
                </tbody>
              </table>

              {order.notes && (
                <div className="mt-3">
                  <label className="text-muted small d-block mb-2">Notlar:</label>
                  <div className="border rounded p-3 bg-light">
                    {order.notes}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* İletişim Bilgileri */}
        <div className="col-lg-6 mb-4">
          <div className="card shadow-sm h-100">
            <div className="card-header bg-light">
              <h5 className="mb-0">
                <i className="bi bi-person-lines-fill me-2"></i>
                Tedarikçi İletişim
              </h5>
            </div>
            <div className="card-body">
              <table className="table table-borderless">
                <tbody>
                  <tr>
                    <td className="text-muted" width="40%">İletişim Kişisi:</td>
                    <td>{order.supplierContactPerson || '-'}</td>
                  </tr>
                  <tr>
                    <td className="text-muted">E-posta:</td>
                    <td>
                      {order.supplierEmail ? (
                        <a href={`mailto:${order.supplierEmail}`}>{order.supplierEmail}</a>
                      ) : '-'}
                    </td>
                  </tr>
                  <tr>
                    <td className="text-muted">Telefon:</td>
                    <td>
                      {order.supplierPhone ? (
                        <a href={`tel:${order.supplierPhone}`}>{order.supplierPhone}</a>
                      ) : '-'}
                    </td>
                  </tr>
                  <tr>
                    <td className="text-muted">Adres:</td>
                    <td>{order.supplierAddress || '-'}</td>
                  </tr>
                </tbody>
              </table>

              {/* Oluşturma ve Güncelleme Bilgileri */}
              <div className="mt-4 pt-3 border-top">
                <table className="table table-borderless mb-0">
                  <tbody>
                    <tr>
                      <td className="text-muted small" width="40%">Oluşturan:</td>
                      <td className="small">{order.createdBy || user?.name}</td>
                    </tr>
                    <tr>
                      <td className="text-muted small">Oluşturma Tarihi:</td>
                      <td className="small">{formatDate(order.createdAt)}</td>
                    </tr>
                    {order.updatedAt && order.updatedAt !== order.createdAt && (
                      <tr>
                        <td className="text-muted small">Son Güncelleme:</td>
                        <td className="small">{formatDate(order.updatedAt)}</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Ürün Detayları */}
      <div className="row">
        <div className="col-12">
          <div className="card shadow-sm">
            <div className="card-header bg-light">
              <h5 className="mb-0">
                <i className="bi bi-box-seam me-2"></i>
                Ürün Detayları ({order.details?.length || 0})
              </h5>
            </div>
            <div className="card-body">
              <div className="table-responsive">
                <table className="table table-hover align-middle">
                  <thead className="table-light">
                    <tr>
                      <th>Ürün Kodu</th>
                      <th>Ürün Adı</th>
                      <th className="text-end">Miktar</th>
                      <th>Birim</th>
                      <th className="text-end">Birim Fiyat</th>
                      <th className="text-end">Toplam</th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.details && order.details.length > 0 ? (
                      order.details.map((detail, index) => (
                        <tr key={index}>
                          <td><code className="text-primary">{detail.itemCode}</code></td>
                          <td>{detail.itemName}</td>
                          <td className="text-end"><strong>{detail.quantity}</strong></td>
                          <td>{detail.unit}</td>
                          <td className="text-end">{formatCurrency(detail.unitPrice)}</td>
                          <td className="text-end">
                            <strong>{formatCurrency(detail.totalPrice)}</strong>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="6" className="text-center py-4 text-muted">
                          Ürün detayı bulunamadı
                        </td>
                      </tr>
                    )}
                  </tbody>
                  {order.details && order.details.length > 0 && (
                    <tfoot className="table-light">
                      <tr>
                        <td colSpan="5" className="text-end"><strong>Ara Toplam:</strong></td>
                        <td className="text-end">
                          <strong>{formatCurrency(order.totalAmount)}</strong>
                        </td>
                      </tr>
                      <tr>
                        <td colSpan="5" className="text-end">
                          <strong>KDV ({order.vatRate || 20}%):</strong>
                        </td>
                        <td className="text-end">
                          <strong>{formatCurrency(order.vatAmount)}</strong>
                        </td>
                      </tr>
                      <tr className="table-success">
                        <td colSpan="5" className="text-end">
                          <strong className="fs-5">Genel Toplam:</strong>
                        </td>
                        <td className="text-end">
                          <strong className="text-success fs-4">
                            {formatCurrency(order.grandTotal)}
                          </strong>
                        </td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bağlı Talepler (varsa) */}
      {order.relatedRequests && order.relatedRequests.length > 0 && (
        <div className="row mt-4">
          <div className="col-12">
            <div className="card shadow-sm">
              <div className="card-header bg-light">
                <h5 className="mb-0">
                  <i className="bi bi-link-45deg me-2"></i>
                  Bağlı Talepler ({order.relatedRequests.length})
                </h5>
              </div>
              <div className="card-body">
                <div className="list-group">
                  {order.relatedRequests.map((request, index) => (
                    <button
                      key={index}
                      className="list-group-item list-group-item-action"
                      onClick={() => navigate(`/purchase-requests/${request.id}`)}
                    >
                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          <strong>{request.requestNumber}</strong>
                          <br />
                          <small className="text-muted">{request.userName}</small>
                        </div>
                        <i className="bi bi-arrow-right"></i>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PurchaseOrderDetailPage;