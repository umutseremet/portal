// src/frontend/src/pages/PurchaseRequestDetailPage.js
// Modal'sız tam sayfa yapısı - ItemDetailPage benzeri

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import apiService from '../services/api';
import {
  PURCHASE_REQUEST_STATUS,
  PURCHASE_REQUEST_STATUS_LABELS,
  PURCHASE_REQUEST_STATUS_COLORS,
  REQUEST_PRIORITY_LABELS,
  REQUEST_PRIORITY_COLORS,
  REQUEST_TYPE_LABELS
} from '../utils/constants';

const PurchaseRequestDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [request, setRequest] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadRequest();
  }, [id]);

  const loadRequest = async () => {
    try {
      setLoading(true);
      const response = await apiService.getPurchaseRequest(id);
      setRequest(response);
    } catch (error) {
      console.error('Error loading request:', error);
      alert('Talep yüklenirken hata oluştu');
      navigate('/purchase-requests');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    navigate(`/purchase-requests/${id}/edit`);
  };

  const handleSubmit = async () => {
    if (!window.confirm('Talebi onaya göndermek istediğinizden emin misiniz?')) {
      return;
    }

    try {
      setActionLoading(true);
      await apiService.submitPurchaseRequest(id);
      alert('Talep başarıyla gönderildi');
      await loadRequest();
    } catch (error) {
      console.error('Error submitting request:', error);
      alert('Hata: ' + (error.response?.data?.message || error.message));
    } finally {
      setActionLoading(false);
    }
  };

  const handleApprove = async () => {
    const notes = window.prompt('Onay notunuzu girin:');
    if (notes === null) return; // Cancelled

    try {
      setActionLoading(true);
      await apiService.approvePurchaseRequest(id, { notes });
      alert('Talep başarıyla onaylandı');
      await loadRequest();
    } catch (error) {
      console.error('Error approving request:', error);
      alert('Hata: ' + (error.response?.data?.message || error.message));
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    const notes = window.prompt('Red nedenini girin:');
    if (!notes) {
      alert('Red nedeni zorunludur');
      return;
    }

    try {
      setActionLoading(true);
      await apiService.rejectPurchaseRequest(id, { notes });
      alert('Talep reddedildi');
      await loadRequest();
    } catch (error) {
      console.error('Error rejecting request:', error);
      alert('Hata: ' + (error.response?.data?.message || error.message));
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async () => {
    const notes = window.prompt('İptal nedenini girin:');
    if (!notes) {
      alert('İptal nedeni zorunludur');
      return;
    }

    try {
      setActionLoading(true);
      await apiService.cancelPurchaseRequest(id, { notes });
      alert('Talep iptal edildi');
      await loadRequest();
    } catch (error) {
      console.error('Error cancelling request:', error);
      alert('Hata: ' + (error.response?.data?.message || error.message));
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Bu talebi silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.')) {
      return;
    }

    try {
      setActionLoading(true);
      await apiService.deletePurchaseRequest(id);
      alert('Talep başarıyla silindi');
      navigate('/purchase-requests');
    } catch (error) {
      console.error('Error deleting request:', error);
      alert('Hata: ' + (error.response?.data?.message || error.message));
    } finally {
      setActionLoading(false);
    }
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

  const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const canEdit = request?.status === PURCHASE_REQUEST_STATUS.DRAFT;
  const canSubmit = request?.status === PURCHASE_REQUEST_STATUS.DRAFT;
  const canDelete = request?.status === PURCHASE_REQUEST_STATUS.DRAFT;
  const canApprove = request?.status === PURCHASE_REQUEST_STATUS.SUBMITTED || 
                     request?.status === PURCHASE_REQUEST_STATUS.MANAGER_APPROVAL ||
                     request?.status === PURCHASE_REQUEST_STATUS.PURCHASING_REVIEW;
  const canReject = request?.status === PURCHASE_REQUEST_STATUS.SUBMITTED ||
                    request?.status === PURCHASE_REQUEST_STATUS.MANAGER_APPROVAL ||
                    request?.status === PURCHASE_REQUEST_STATUS.PURCHASING_REVIEW;
  const canCancel = request?.status !== PURCHASE_REQUEST_STATUS.COMPLETED &&
                    request?.status !== PURCHASE_REQUEST_STATUS.CANCELLED;

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

  if (!request) {
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
                    <i className="bi bi-file-earmark-text text-primary me-2"></i>
                    Talep Detayı
                  </h2>
                  <p className="text-muted mb-0">{request.requestNumber}</p>
                </div>
                <button 
                  className="btn btn-outline-secondary" 
                  onClick={() => navigate('/purchase-requests')}
                  disabled={actionLoading}
                >
                  <i className="bi bi-arrow-left me-2"></i>
                  Geri
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="card shadow-sm">
            <div className="card-body">
              <div className="d-flex gap-2 flex-wrap">
                {canEdit && (
                  <button
                    className="btn btn-warning"
                    onClick={handleEdit}
                    disabled={actionLoading}
                  >
                    <i className="bi bi-pencil me-2"></i>
                    Düzenle
                  </button>
                )}
                {canSubmit && (
                  <button
                    className="btn btn-primary"
                    onClick={handleSubmit}
                    disabled={actionLoading}
                  >
                    <i className="bi bi-send me-2"></i>
                    Onaya Gönder
                  </button>
                )}
                {canApprove && (
                  <button
                    className="btn btn-success"
                    onClick={handleApprove}
                    disabled={actionLoading}
                  >
                    <i className="bi bi-check-circle me-2"></i>
                    Onayla
                  </button>
                )}
                {canReject && (
                  <button
                    className="btn btn-danger"
                    onClick={handleReject}
                    disabled={actionLoading}
                  >
                    <i className="bi bi-x-circle me-2"></i>
                    Reddet
                  </button>
                )}
                {canCancel && (
                  <button
                    className="btn btn-outline-danger"
                    onClick={handleCancel}
                    disabled={actionLoading}
                  >
                    <i className="bi bi-slash-circle me-2"></i>
                    İptal Et
                  </button>
                )}
                {canDelete && (
                  <button
                    className="btn btn-outline-danger"
                    onClick={handleDelete}
                    disabled={actionLoading}
                  >
                    <i className="bi bi-trash me-2"></i>
                    Sil
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="row">
        {/* Left Column - Temel Bilgiler */}
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
                    <td className="text-muted" width="40%">Talep No:</td>
                    <td><strong>{request.requestNumber}</strong></td>
                  </tr>
                  <tr>
                    <td className="text-muted">Durum:</td>
                    <td>{getStatusBadge(request.status)}</td>
                  </tr>
                  <tr>
                    <td className="text-muted">Öncelik:</td>
                    <td>{getPriorityBadge(request.priority)}</td>
                  </tr>
                  <tr>
                    <td className="text-muted">Talep Türü:</td>
                    <td>{REQUEST_TYPE_LABELS[request.requestType] || request.requestType}</td>
                  </tr>
                  <tr>
                    <td className="text-muted">Talep Eden:</td>
                    <td>{request.userName}</td>
                  </tr>
                  <tr>
                    <td className="text-muted">Departman:</td>
                    <td>{request.departmentName || '-'}</td>
                  </tr>
                  <tr>
                    <td className="text-muted">Talep Tarihi:</td>
                    <td>{formatDate(request.requestDate)}</td>
                  </tr>
                  <tr>
                    <td className="text-muted">Oluşturma Tarihi:</td>
                    <td>{formatDate(request.createdAt)}</td>
                  </tr>
                  {request.updatedAt && (
                    <tr>
                      <td className="text-muted">Güncelleme Tarihi:</td>
                      <td>{formatDate(request.updatedAt)}</td>
                    </tr>
                  )}
                </tbody>
              </table>

              {request.description && (
                <div className="mt-3">
                  <label className="text-muted small d-block mb-2">Açıklama:</label>
                  <div className="border rounded p-3 bg-light">
                    {request.description}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Onay Süreci */}
        <div className="col-lg-6 mb-4">
          <div className="card shadow-sm h-100">
            <div className="card-header bg-light">
              <h5 className="mb-0">
                <i className="bi bi-check2-square me-2"></i>
                Onay Süreci
              </h5>
            </div>
            <div className="card-body">
              {request.submittedDate && (
                <div className="mb-3 pb-3 border-bottom">
                  <div className="d-flex align-items-start">
                    <div className="me-3">
                      <div className="rounded-circle bg-info d-flex align-items-center justify-content-center" 
                           style={{ width: '40px', height: '40px' }}>
                        <i className="bi bi-send text-white"></i>
                      </div>
                    </div>
                    <div className="flex-grow-1">
                      <h6 className="mb-1">Gönderildi</h6>
                      <p className="text-muted small mb-0">{formatDate(request.submittedDate)}</p>
                    </div>
                  </div>
                </div>
              )}

              {request.managerApprovalDate && (
                <div className="mb-3 pb-3 border-bottom">
                  <div className="d-flex align-items-start">
                    <div className="me-3">
                      <div className="rounded-circle bg-success d-flex align-items-center justify-content-center" 
                           style={{ width: '40px', height: '40px' }}>
                        <i className="bi bi-check-lg text-white"></i>
                      </div>
                    </div>
                    <div className="flex-grow-1">
                      <h6 className="mb-1">Yönetici Onayı</h6>
                      <p className="text-muted small mb-1">{formatDate(request.managerApprovalDate)}</p>
                      {request.managerApprovalNote && (
                        <div className="alert alert-success py-2 px-3 mb-0 small">
                          <i className="bi bi-chat-square-quote me-2"></i>
                          {request.managerApprovalNote}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {request.purchasingReviewDate && (
                <div className="mb-3 pb-3 border-bottom">
                  <div className="d-flex align-items-start">
                    <div className="me-3">
                      <div className="rounded-circle bg-primary d-flex align-items-center justify-content-center" 
                           style={{ width: '40px', height: '40px' }}>
                        <i className="bi bi-check-lg text-white"></i>
                      </div>
                    </div>
                    <div className="flex-grow-1">
                      <h6 className="mb-1">Satınalma İncelemesi</h6>
                      <p className="text-muted small mb-1">{formatDate(request.purchasingReviewDate)}</p>
                      {request.purchasingReviewNote && (
                        <div className="alert alert-info py-2 px-3 mb-0 small">
                          <i className="bi bi-chat-square-quote me-2"></i>
                          {request.purchasingReviewNote}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {request.finalApprovalDate && (
                <div className="mb-3 pb-3 border-bottom">
                  <div className="d-flex align-items-start">
                    <div className="me-3">
                      <div className="rounded-circle bg-success d-flex align-items-center justify-content-center" 
                           style={{ width: '40px', height: '40px' }}>
                        <i className="bi bi-check-circle text-white"></i>
                      </div>
                    </div>
                    <div className="flex-grow-1">
                      <h6 className="mb-1">Final Onay</h6>
                      <p className="text-muted small mb-1">{formatDate(request.finalApprovalDate)}</p>
                      {request.finalApprovalNote && (
                        <div className="alert alert-success py-2 px-3 mb-0 small">
                          <i className="bi bi-chat-square-quote me-2"></i>
                          {request.finalApprovalNote}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {request.rejectionDate && (
                <div className="mb-3">
                  <div className="d-flex align-items-start">
                    <div className="me-3">
                      <div className="rounded-circle bg-danger d-flex align-items-center justify-content-center" 
                           style={{ width: '40px', height: '40px' }}>
                        <i className="bi bi-x-lg text-white"></i>
                      </div>
                    </div>
                    <div className="flex-grow-1">
                      <h6 className="mb-1 text-danger">Reddedildi</h6>
                      <p className="text-muted small mb-1">{formatDate(request.rejectionDate)}</p>
                      {request.rejectionReason && (
                        <div className="alert alert-danger py-2 px-3 mb-0 small">
                          <i className="bi bi-exclamation-triangle me-2"></i>
                          {request.rejectionReason}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {request.cancelledDate && (
                <div className="mb-3">
                  <div className="d-flex align-items-start">
                    <div className="me-3">
                      <div className="rounded-circle bg-warning d-flex align-items-center justify-content-center" 
                           style={{ width: '40px', height: '40px' }}>
                        <i className="bi bi-slash-circle text-white"></i>
                      </div>
                    </div>
                    <div className="flex-grow-1">
                      <h6 className="mb-1 text-warning">İptal Edildi</h6>
                      <p className="text-muted small mb-1">{formatDate(request.cancelledDate)}</p>
                      {request.cancellationReason && (
                        <div className="alert alert-warning py-2 px-3 mb-0 small">
                          <i className="bi bi-info-circle me-2"></i>
                          {request.cancellationReason}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {!request.submittedDate && request.status === PURCHASE_REQUEST_STATUS.DRAFT && (
                <div className="text-center text-muted py-4">
                  <i className="bi bi-hourglass-split fs-1 d-block mb-2"></i>
                  <p>Talep henüz onaya gönderilmedi</p>
                </div>
              )}
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
                Ürün Detayları ({request.details?.length || 0})
              </h5>
            </div>
            <div className="card-body">
              <div className="table-responsive">
                <table className="table table-hover align-middle">
                  <thead className="table-light">
                    <tr>
                      <th>Ürün Kodu</th>
                      <th>Ürün Adı</th>
                      <th>Grup</th>
                      <th className="text-end">Miktar</th>
                      <th>Birim</th>
                      <th className="text-end">Birim Fiyat</th>
                      <th className="text-end">Toplam</th>
                      <th>İhtiyaç Tarihi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {request.details?.length > 0 ? (
                      request.details.map((detail, index) => (
                        <tr key={index}>
                          <td><code>{detail.itemCode}</code></td>
                          <td>{detail.itemName}</td>
                          <td>
                            <span className="badge bg-secondary">{detail.itemGroupName || '-'}</span>
                          </td>
                          <td className="text-end"><strong>{detail.quantity}</strong></td>
                          <td>{detail.unit}</td>
                          <td className="text-end">{formatCurrency(detail.estimatedUnitPrice)}</td>
                          <td className="text-end"><strong>{formatCurrency(detail.estimatedTotalPrice)}</strong></td>
                          <td>
                            {detail.requiredDate ? 
                              new Date(detail.requiredDate).toLocaleDateString('tr-TR') : 
                              '-'
                            }
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="8" className="text-center py-4 text-muted">
                          Ürün detayı bulunamadı
                        </td>
                      </tr>
                    )}
                  </tbody>
                  {request.details?.length > 0 && (
                    <tfoot className="table-light">
                      <tr>
                        <td colSpan="6" className="text-end"><strong>Toplam Tahmini Tutar:</strong></td>
                        <td className="text-end">
                          <strong className="text-primary fs-5">
                            {formatCurrency(request.details.reduce((sum, d) => sum + (d.estimatedTotalPrice || 0), 0))}
                          </strong>
                        </td>
                        <td></td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PurchaseRequestDetailPage;