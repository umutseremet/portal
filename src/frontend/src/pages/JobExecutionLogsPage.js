// src/frontend/src/pages/JobExecutionLogsPage.js

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import backgroundJobsService from '../services/backgroundJobsService';
import permissionService from '../services/permissionService';
import './JobExecutionLogsPage.css';

const JobExecutionLogsPage = () => {
  const { jobId } = useParams();
  const navigate = useNavigate();
  
  const [job, setJob] = useState(null);
  const [logs, setLogs] = useState([]);
  const [selectedLog, setSelectedLog] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 20,
    totalCount: 0,
    totalPages: 0
  });

  useEffect(() => {
    if (!permissionService.isAdmin()) {
      setError('Bu sayfaya erişim yetkiniz bulunmamaktadır.');
      setTimeout(() => navigate('/dashboard'), 2000);
      return;
    }

    if (jobId) {
      loadJob();
      loadLogs();
    }
  }, [jobId, pagination.page, navigate]);

  const loadJob = async () => {
    try {
      const response = await backgroundJobsService.getJob(parseInt(jobId));
      setJob(response);
    } catch (err) {
      console.error('Job bilgisi yüklenirken hata:', err);
    }
  };

  const loadLogs = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await backgroundJobsService.getJobExecutionLogs(
        parseInt(jobId),
        pagination.page,
        pagination.pageSize
      );
      
      setLogs(response.logs || []);
      setPagination(prev => ({
        ...prev,
        totalCount: response.totalCount,
        totalPages: response.totalPages
      }));
    } catch (err) {
      console.error('Log kayıtları yüklenirken hata:', err);
      setError('Log kayıtları yüklenirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetail = async (logId) => {
    try {
      setLoading(true);
      const response = await backgroundJobsService.getExecutionLogDetail(logId);
      setSelectedLog(response);
    } catch (err) {
      console.error('Log detayı yüklenirken hata:', err);
      setError('Log detayı yüklenirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Success':
        return <span className="badge bg-success">Başarılı</span>;
      case 'Failed':
        return <span className="badge bg-danger">Başarısız</span>;
      case 'PartialSuccess':
        return <span className="badge bg-warning text-dark">Kısmi Başarılı</span>;
      case 'Running':
        return <span className="badge bg-info">Çalışıyor</span>;
      default:
        return <span className="badge bg-secondary">{status}</span>;
    }
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleString('tr-TR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const formatDuration = (seconds) => {
    if (!seconds) return '-';
    if (seconds < 60) return `${seconds.toFixed(2)}s`;
    const minutes = Math.floor(seconds / 60);
    const secs = (seconds % 60).toFixed(0);
    return `${minutes}m ${secs}s`;
  };

  return (
    <div className="job-execution-logs-page">
      {/* Header */}
      <div className="page-header mb-4">
        <div className="d-flex justify-content-between align-items-center">
          <div>
            <button 
              className="btn btn-outline-secondary btn-sm mb-2"
              onClick={() => navigate('/background-jobs')}
            >
              <i className="bi bi-arrow-left me-2"></i>
              Geri Dön
            </button>
            <h2>
              <i className="bi bi-clock-history me-2"></i>
              Çalışma Geçmişi
            </h2>
            {job && (
              <p className="text-muted mb-0">
                <strong>{job.jobName}</strong> - {job.jobKey}
              </p>
            )}
          </div>
          <div>
            <button
              className="btn btn-primary"
              onClick={loadLogs}
              disabled={loading}
            >
              <i className="bi bi-arrow-clockwise me-2"></i>
              Yenile
            </button>
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="alert alert-danger alert-dismissible fade show" role="alert">
          <i className="bi bi-exclamation-triangle-fill me-2"></i>
          {error}
          <button
            type="button"
            className="btn-close"
            onClick={() => setError(null)}
          ></button>
        </div>
      )}

      {/* Logs Table */}
      <div className="card">
        <div className="card-header" style={{ backgroundColor: '#f8f9fa', color: '#212529', borderBottom: '2px solid #dee2e6' }}>
          <h5 className="mb-0">
            <i className="bi bi-list-check me-2"></i>
            Çalıştırma Kayıtları
            {pagination.totalCount > 0 && (
              <span className="badge bg-secondary ms-2">{pagination.totalCount}</span>
            )}
          </h5>
        </div>
        <div className="card-body">
          {loading && !logs.length ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Yükleniyor...</span>
              </div>
              <p className="mt-3 text-muted">Log kayıtları yükleniyor...</p>
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-5">
              <i className="bi bi-inbox display-1 text-muted"></i>
              <p className="mt-3 text-muted">Henüz çalıştırma kaydı bulunmamaktadır.</p>
            </div>
          ) : (
            <>
              <div className="table-responsive">
                <table className="table table-hover">
                  <thead className="table-light">
                    <tr>
                      <th>Başlangıç</th>
                      <th>Bitiş</th>
                      <th>Süre</th>
                      <th>Durum</th>
                      <th>İşlenen</th>
                      <th>Başarılı</th>
                      <th>Hatalı</th>
                      <th>Atlanan</th>
                      <th>Tip</th>
                      <th>İşlemler</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((log) => (
                      <tr key={log.id}>
                        <td className="small">{formatDateTime(log.startTime)}</td>
                        <td className="small">{formatDateTime(log.endTime)}</td>
                        <td className="small">{formatDuration(log.durationSeconds)}</td>
                        <td>{getStatusBadge(log.status)}</td>
                        <td className="text-center">{log.processedCount || 0}</td>
                        <td className="text-center text-success">{log.successCount || 0}</td>
                        <td className="text-center text-danger">{log.failureCount || 0}</td>
                        <td className="text-center text-warning">{log.skippedCount || 0}</td>
                        <td>
                          {log.isManualExecution ? (
                            <span className="badge bg-info">Manuel</span>
                          ) : (
                            <span className="badge bg-secondary">Otomatik</span>
                          )}
                        </td>
                        <td>
                          <button
                            className="btn btn-sm btn-outline-primary"
                            onClick={() => handleViewDetail(log.id)}
                            title="Detayları Gör"
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
                    Sayfa {pagination.page} / {pagination.totalPages} 
                    <span className="ms-2">({pagination.totalCount} kayıt)</span>
                  </div>
                  <nav>
                    <ul className="pagination pagination-sm mb-0">
                      <li className={`page-item ${pagination.page === 1 ? 'disabled' : ''}`}>
                        <button
                          className="page-link"
                          onClick={() => handlePageChange(pagination.page - 1)}
                          disabled={pagination.page === 1}
                        >
                          Önceki
                        </button>
                      </li>
                      
                      {[...Array(Math.min(5, pagination.totalPages))].map((_, i) => {
                        let pageNum;
                        if (pagination.totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (pagination.page <= 3) {
                          pageNum = i + 1;
                        } else if (pagination.page >= pagination.totalPages - 2) {
                          pageNum = pagination.totalPages - 4 + i;
                        } else {
                          pageNum = pagination.page - 2 + i;
                        }
                        
                        return (
                          <li 
                            key={pageNum} 
                            className={`page-item ${pagination.page === pageNum ? 'active' : ''}`}
                          >
                            <button
                              className="page-link"
                              onClick={() => handlePageChange(pageNum)}
                            >
                              {pageNum}
                            </button>
                          </li>
                        );
                      })}
                      
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
            </>
          )}
        </div>
      </div>

      {/* Detail Modal */}
      {selectedLog && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-xl modal-dialog-scrollable">
            <div className="modal-content">
              <div className="modal-header" style={{ backgroundColor: '#f8f9fa', color: '#212529' }}>
                <h5 className="modal-title">
                  <i className="bi bi-file-text me-2"></i>
                  Çalıştırma Detayı
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setSelectedLog(null)}
                ></button>
              </div>
              <div className="modal-body">
                {/* Özet Bilgiler */}
                <div className="row mb-4">
                  <div className="col-md-6">
                    <table className="table table-sm">
                      <tbody>
                        <tr>
                          <th width="40%">Job Adı:</th>
                          <td>{selectedLog.jobName}</td>
                        </tr>
                        <tr>
                          <th>Başlangıç:</th>
                          <td>{formatDateTime(selectedLog.startTime)}</td>
                        </tr>
                        <tr>
                          <th>Bitiş:</th>
                          <td>{formatDateTime(selectedLog.endTime)}</td>
                        </tr>
                        <tr>
                          <th>Süre:</th>
                          <td>{formatDuration(selectedLog.durationSeconds)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <div className="col-md-6">
                    <table className="table table-sm">
                      <tbody>
                        <tr>
                          <th width="40%">Durum:</th>
                          <td>{getStatusBadge(selectedLog.status)}</td>
                        </tr>
                        <tr>
                          <th>İşlenen:</th>
                          <td>{selectedLog.processedCount || 0}</td>
                        </tr>
                        <tr>
                          <th>Başarılı:</th>
                          <td className="text-success">{selectedLog.successCount || 0}</td>
                        </tr>
                        <tr>
                          <th>Hatalı:</th>
                          <td className="text-danger">{selectedLog.failureCount || 0}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Özet Mesaj */}
                {selectedLog.message && (
                  <div className="alert alert-info">
                    <strong>Özet:</strong> {selectedLog.message}
                  </div>
                )}

                {/* Detaylı Log */}
                {selectedLog.detailedLog && (
                  <div className="mb-3">
                    <h6>Detaylı Log:</h6>
                    <pre className="log-content">{selectedLog.detailedLog}</pre>
                  </div>
                )}

                {/* Hata Mesajı */}
                {selectedLog.errorMessage && (
                  <div className="alert alert-danger">
                    <h6>Hata Mesajı:</h6>
                    <pre className="mb-0">{selectedLog.errorMessage}</pre>
                  </div>
                )}

                {/* Stack Trace */}
                {selectedLog.stackTrace && (
                  <div className="mb-3">
                    <h6>Stack Trace:</h6>
                    <pre className="log-content">{selectedLog.stackTrace}</pre>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setSelectedLog(null)}
                >
                  Kapat
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default JobExecutionLogsPage;