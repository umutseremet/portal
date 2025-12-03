// src/frontend/src/pages/PendingApprovalsPage.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import apiService from '../services/api';
import {
  PURCHASE_REQUEST_STATUS_LABELS,
  PURCHASE_REQUEST_STATUS_COLORS,
  REQUEST_PRIORITY_LABELS,
  REQUEST_PRIORITY_COLORS
} from '../utils/constants';

const PendingApprovalsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    byPriority: {
      Normal: 0,
      Urgent: 0,
      Critical: 0
    }
  });

  useEffect(() => {
    loadPendingRequests();
  }, []);

  const loadPendingRequests = async () => {
    try {
      setLoading(true);
      const response = await apiService.getPendingMyApprovalRequests();
      const items = response.items || response || [];
      setRequests(items);

      // Calculate stats
      const stats = {
        total: items.length,
        byPriority: {
          Normal: items.filter(r => r.priority === 'Normal').length,
          Urgent: items.filter(r => r.priority === 'Urgent').length,
          Critical: items.filter(r => r.priority === 'Critical').length
        }
      };
      setStats(stats);
    } catch (error) {
      console.error('Error loading pending requests:', error);
      alert('Onay bekleyen talepler yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetail = (requestId) => {
    navigate(`/purchase-requests/${requestId}`);
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

  const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatDateTime = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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
                    <i className="bi bi-hourglass-split text-warning me-2"></i>
                    Onay Bekleyen Talepler
                  </h2>
                  <p className="text-muted mb-0">
                    Toplam <strong className="text-primary">{stats.total}</strong> talep onayınızı bekliyor
                  </p>
                </div>
                <button
                  className="btn btn-outline-primary"
                  onClick={loadPendingRequests}
                  disabled={loading}
                >
                  <i className="bi bi-arrow-clockwise me-2"></i>
                  Yenile
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      {stats.total > 0 && (
        <div className="row mb-4">
          <div className="col-md-4 mb-3">
            <div className="card shadow-sm border-start border-danger border-5">
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <h6 className="text-muted mb-1">Kritik</h6>
                    <h3 className="mb-0 text-danger">{stats.byPriority.Critical}</h3>
                  </div>
                  <div className="text-danger">
                    <i className="bi bi-exclamation-triangle-fill fs-1"></i>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="col-md-4 mb-3">
            <div className="card shadow-sm border-start border-warning border-5">
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <h6 className="text-muted mb-1">Acil</h6>
                    <h3 className="mb-0 text-warning">{stats.byPriority.Urgent}</h3>
                  </div>
                  <div className="text-warning">
                    <i className="bi bi-exclamation-circle-fill fs-1"></i>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="col-md-4 mb-3">
            <div className="card shadow-sm border-start border-secondary border-5">
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <h6 className="text-muted mb-1">Normal</h6>
                    <h3 className="mb-0 text-secondary">{stats.byPriority.Normal}</h3>
                  </div>
                  <div className="text-secondary">
                    <i className="bi bi-info-circle-fill fs-1"></i>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pending Requests Table */}
      <div className="row">
        <div className="col-12">
          <div className="card shadow-sm">
            <div className="card-header bg-light">
              <h5 className="mb-0">
                <i className="bi bi-list-check me-2"></i>
                Onay Bekleyen Talepler
              </h5>
            </div>
            <div className="card-body">
              {loading ? (
                <div className="text-center py-5">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Yükleniyor...</span>
                  </div>
                  <p className="text-muted mt-3">Talepler yükleniyor...</p>
                </div>
              ) : requests.length === 0 ? (
                <div className="text-center py-5 text-muted">
                  <i className="bi bi-check-circle fs-1 d-block mb-3 text-success"></i>
                  <h5>Onay bekleyen talep yok</h5>
                  <p className="mb-0">Tüm talepler işlenmiş durumda</p>
                  <small className="text-muted d-block mt-2">
                    Yeni talep geldiğinde burada görünecektir
                  </small>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover align-middle">
                    <thead className="table-light">
                      <tr>
                        <th>Talep No</th>
                        <th>Talep Eden</th>
                        <th>Departman</th>
                        <th>Talep Tarihi</th>
                        <th>Öncelik</th>
                        <th>Durum</th>
                        <th className="text-center">Bekleme Süresi</th>
                        <th className="text-center">İşlem</th>
                      </tr>
                    </thead>
                    <tbody>
                      {requests.map((request) => {
                        const daysSinceSubmitted = request.submittedDate 
                          ? Math.floor((new Date() - new Date(request.submittedDate)) / (1000 * 60 * 60 * 24))
                          : 0;

                        return (
                          <tr key={request.id} className={daysSinceSubmitted > 3 ? 'table-warning' : ''}>
                            <td>
                              <code className="text-primary fw-bold">{request.requestNumber}</code>
                            </td>
                            <td>
                              <div>
                                <strong>{request.userName}</strong>
                                {request.userEmail && (
                                <React.Fragment>
                                    <br />
                                    <small className="text-muted">{request.userEmail}</small>
                                </React.Fragment>
                                )}
                              </div>
                            </td>
                            <td>
                              <span className="badge bg-info">
                                {request.departmentName || 'Belirtilmemiş'}
                              </span>
                            </td>
                            <td>
                              <small>{formatDate(request.requestDate)}</small>
                            </td>
                            <td>{getPriorityBadge(request.priority)}</td>
                            <td>{getStatusBadge(request.status)}</td>
                            <td className="text-center">
                              {daysSinceSubmitted > 0 ? (
                                <span className={`badge ${daysSinceSubmitted > 3 ? 'bg-danger' : 'bg-secondary'}`}>
                                  {daysSinceSubmitted} gün
                                </span>
                              ) : (
                                <span className="badge bg-success">Bugün</span>
                              )}
                            </td>
                            <td className="text-center">
                              <button
                                className="btn btn-sm btn-primary"
                                onClick={() => handleViewDetail(request.id)}
                                title="İncele ve Onayla"
                              >
                                <i className="bi bi-eye me-1"></i>
                                İncele
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Info Card */}
      {requests.length > 0 && (
        <div className="row mt-4">
          <div className="col-12">
            <div className="card shadow-sm border-primary">
              <div className="card-body">
                <div className="d-flex align-items-start">
                  <div className="me-3">
                    <i className="bi bi-info-circle-fill text-primary fs-3"></i>
                  </div>
                  <div>
                    <h6 className="mb-2">Onay Süreci Hakkında</h6>
                    <ul className="mb-0 small text-muted">
                      <li>Talebi incelemek için "İncele" butonuna tıklayın</li>
                      <li>Detay sayfasında tüm ürün bilgilerini görebilirsiniz</li>
                      <li>Onay veya red işlemini detay sayfasından gerçekleştirin</li>
                      <li>3 günden uzun bekleyen talepler sarı renkte gösterilir</li>
                      <li>Kritik öncelikli taleplere öncelik verilmesi önerilir</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PendingApprovalsPage;