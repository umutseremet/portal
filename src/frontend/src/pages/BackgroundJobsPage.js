// src/frontend/src/pages/BackgroundJobsPage.js

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import backgroundJobsService from '../services/backgroundJobsService';
import permissionService from '../services/permissionService';
import './BackgroundJobsPage.css';

const BackgroundJobsPage = () => {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showJobModal, setShowJobModal] = useState(false);
  const [editingJob, setEditingJob] = useState(null);
  const [formData, setFormData] = useState({
    jobName: '',
    jobKey: '',
    cronExpression: '0 */2 * * *',
    description: '',
    isActive: true
  });

  const cronSuggestions = backgroundJobsService.getCronExpressionSuggestions();

  // Hangfire Dashboard URL'i
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5154';
  const hangfireDashboardUrl = API_BASE_URL.replace('/api', '') + '/hangfire';

  useEffect(() => {
    // ✅ Admin kontrolü - mevcut permissionService yapısı
    if (!permissionService.isAdmin()) {
      setError('Bu sayfaya erişim yetkiniz bulunmamaktadır.');
      setTimeout(() => navigate('/dashboard'), 2000);
      return;
    }

    loadJobs();
  }, [navigate]);

  const loadJobs = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await backgroundJobsService.getAllJobs();
      setJobs(response || []);
    } catch (err) {
      console.error('Job listesi yüklenirken hata:', err);
      setError('Job listesi yüklenirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const handleRunJob = async (jobId) => {
    if (!window.confirm('Bu job\'u şimdi çalıştırmak istediğinizden emin misiniz?')) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await backgroundJobsService.runJob(jobId);
      setSuccess(response.message || 'Job başarıyla çalıştırıldı.');
      await loadJobs();
    } catch (err) {
      console.error('Job çalıştırılırken hata:', err);
      setError(err.response?.data?.message || 'Job çalıştırılırken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleJob = async (jobId) => {
    try {
      setLoading(true);
      setError(null);
      const response = await backgroundJobsService.toggleJob(jobId);
      setSuccess(response.message || 'Job durumu değiştirildi.');
      await loadJobs();
    } catch (err) {
      console.error('Job toggle edilirken hata:', err);
      setError(err.response?.data?.message || 'Job durumu değiştirilirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const handleEditJob = (job) => {
    setEditingJob(job);
    setFormData({
      jobName: job.jobName,
      jobKey: job.jobKey,
      cronExpression: job.cronExpression || '0 */2 * * *',
      description: job.description || '',
      isActive: job.isActive
    });
    setShowJobModal(true);
  };

  const handleCreateJob = () => {
    setEditingJob(null);
    setFormData({
      jobName: '',
      jobKey: '',
      cronExpression: '0 */2 * * *',
      description: '',
      isActive: true
    });
    setShowJobModal(true);
  };

  const handleSaveJob = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);
      setError(null);

      if (editingJob) {
        // Güncelleme
        await backgroundJobsService.updateJob(editingJob.id, {
          jobName: formData.jobName,
          cronExpression: formData.cronExpression,
          description: formData.description,
          isActive: formData.isActive
        });
        setSuccess('Job başarıyla güncellendi.');
      } else {
        // Yeni oluşturma
        await backgroundJobsService.createJob({
          jobName: formData.jobName,
          jobKey: formData.jobKey,
          jobType: 'Recurring',
          cronExpression: formData.cronExpression,
          description: formData.description,
          isActive: formData.isActive
        });
        setSuccess('Job başarıyla oluşturuldu.');
      }

      setShowJobModal(false);
      await loadJobs();
    } catch (err) {
      console.error('Job kaydedilirken hata:', err);
      setError(err.response?.data?.message || 'Job kaydedilirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteJob = async (jobId) => {
    if (!window.confirm('Bu job\'u silmek istediğinizden emin misiniz?')) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await backgroundJobsService.deleteJob(jobId);
      setSuccess('Job başarıyla silindi.');
      await loadJobs();
    } catch (err) {
      console.error('Job silinirken hata:', err);
      setError(err.response?.data?.message || 'Job silinirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
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
        return <span className="badge bg-secondary">-</span>;
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
      minute: '2-digit'
    });
  };

  return (
    <div className="background-jobs-page">
      {/* Header */}
      <div className="page-header mb-4">
        <div className="d-flex justify-content-between align-items-center">
          <div>
            <h2>
              <i className="bi bi-gear-fill me-2"></i>
              Arka Plan Görevleri
            </h2>
            <p className="text-muted mb-0">
              Zamanlanmış işleri yönetin ve izleyin
            </p>
          </div>
          <div>
            <button
              className="btn btn-primary me-2"
              onClick={loadJobs}
              disabled={loading}
            >
              <i className="bi bi-arrow-clockwise me-2"></i>
              Yenile
            </button>
            <button
              className="btn btn-success"
              onClick={handleCreateJob}
              disabled={loading}
            >
              <i className="bi bi-plus-lg me-2"></i>
              Yeni Job Ekle
            </button>
          </div>
        </div>
      </div>

      {/* Alerts */}
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

      {success && (
        <div className="alert alert-success alert-dismissible fade show" role="alert">
          <i className="bi bi-check-circle-fill me-2"></i>
          {success}
          <button
            type="button"
            className="btn-close"
            onClick={() => setSuccess(null)}
          ></button>
        </div>
      )}

      {/* Jobs Table */}
      <div className="card">
        <div className="card-header" style={{ backgroundColor: '#f8f9fa', color: '#212529', borderBottom: '2px solid #dee2e6' }}>
          <h5 className="mb-0">
            <i className="bi bi-list-task me-2"></i>
            Kayıtlı Job'lar
          </h5>
        </div>
        <div className="card-body">
          {loading && !jobs.length ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Yükleniyor...</span>
              </div>
              <p className="mt-3 text-muted">Job'lar yükleniyor...</p>
            </div>
          ) : jobs.length === 0 ? (
            <div className="text-center py-5">
              <i className="bi bi-inbox display-1 text-muted"></i>
              <p className="mt-3 text-muted">Henüz kayıtlı job bulunmamaktadır.</p>
              <button className="btn btn-primary mt-2" onClick={handleCreateJob}>
                <i className="bi bi-plus-lg me-2"></i>
                İlk Job'u Oluştur
              </button>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover">
                <thead className="table-light">
                  <tr>
                    <th>Job Adı</th>
                    <th>Job Key</th>
                    <th>Cron</th>
                    <th>Durum</th>
                    <th>Son Çalışma</th>
                    <th>Sonraki Çalışma</th>
                    <th>Son Durum</th>
                    <th>İstatistikler</th>
                    <th className="text-center">İşlemler</th>
                  </tr>
                </thead>
                <tbody>
                  {jobs.map((job) => (
                    <tr key={job.id}>
                      <td>
                        <strong>{job.jobName}</strong>
                        {job.description && (
                          <div className="small text-muted">{job.description}</div>
                        )}
                      </td>
                      <td>
                        <code className="small">{job.jobKey}</code>
                      </td>
                      <td>
                        <code className="small">{job.cronExpression || '-'}</code>
                      </td>
                      <td>
                        {job.isActive ? (
                          <span className="badge bg-success">Aktif</span>
                        ) : (
                          <span className="badge bg-secondary">Pasif</span>
                        )}
                      </td>
                      <td className="small">{formatDateTime(job.lastRunTime)}</td>
                      <td className="small">{formatDateTime(job.nextRunTime)}</td>
                      <td>{getStatusBadge(job.lastRunStatus)}</td>
                      <td className="small">
                        <div>Toplam: {job.totalRunCount}</div>
                        <div className="text-success">✓ {job.successCount}</div>
                        <div className="text-danger">✗ {job.failureCount}</div>
                      </td>
                      <td>
                        <div className="btn-group btn-group-sm" role="group">
                          {/* ✅ YENİ: Log Görüntüleme Butonu */}
                          <button
                            className="btn btn-outline-info"
                            onClick={() => navigate(`/background-jobs/${job.id}/logs`)}
                            title="Çalışma Geçmişi"
                          >
                            <i className="bi bi-clock-history"></i>
                          </button>
                          
                          <button
                            className="btn btn-outline-primary"
                            onClick={() => handleRunJob(job.id)}
                            disabled={loading}
                            title="Şimdi Çalıştır"
                          >
                            <i className="bi bi-play-fill"></i>
                          </button>
                          <button
                            className={`btn btn-outline-${job.isActive ? 'warning' : 'success'}`}
                            onClick={() => handleToggleJob(job.id)}
                            disabled={loading}
                            title={job.isActive ? 'Pasif Yap' : 'Aktif Yap'}
                          >
                            <i className={`bi bi-${job.isActive ? 'pause-fill' : 'play-circle'}`}></i>
                          </button>
                          <button
                            className="btn btn-outline-secondary"
                            onClick={() => handleEditJob(job)}
                            disabled={loading}
                            title="Düzenle"
                          >
                            <i className="bi bi-pencil"></i>
                          </button>
                          <button
                            className="btn btn-outline-danger"
                            onClick={() => handleDeleteJob(job.id)}
                            disabled={loading}
                            title="Sil"
                          >
                            <i className="bi bi-trash"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Hangfire Dashboard Link */}
      <div className="card mt-3">
        <div className="card-body">
          <h5 className="card-title">
            <i className="bi bi-speedometer2 me-2"></i>
            Hangfire Dashboard
          </h5>
          <p className="card-text text-muted">
            Job'ların detaylı çalışma geçmişini ve performans metriklerini görmek için Hangfire Dashboard'u kullanabilirsiniz.
          </p>
          {/* ✅ DÜZELTİLDİ: Doğru URL ile */}
          <a
            href={hangfireDashboardUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-outline-primary"
          >
            <i className="bi bi-box-arrow-up-right me-2"></i>
            Hangfire Dashboard'u Aç
          </a>
        </div>
      </div>

      {/* Job Modal */}
      {showJobModal && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header" style={{ backgroundColor: '#f8f9fa', color: '#212529' }}>
                <h5 className="modal-title">
                  <i className="bi bi-gear me-2"></i>
                  {editingJob ? 'Job Düzenle' : 'Yeni Job Oluştur'}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowJobModal(false)}
                ></button>
              </div>
              <form onSubmit={handleSaveJob}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Job Adı *</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.jobName}
                      onChange={(e) => setFormData({ ...formData, jobName: e.target.value })}
                      required
                      placeholder="Örn: Logo Fatura Otomatik Onay"
                    />
                  </div>

                  {!editingJob && (
                    <div className="mb-3">
                      <label className="form-label">Job Key (Benzersiz) *</label>
                      <input
                        type="text"
                        className="form-control"
                        value={formData.jobKey}
                        onChange={(e) => setFormData({ ...formData, jobKey: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') })}
                        required
                        placeholder="Örn: logo-invoice-auto-approval"
                      />
                      <small className="text-muted">
                        Sadece küçük harf, rakam ve tire (-) kullanın
                      </small>
                    </div>
                  )}

                  <div className="mb-3">
                    <label className="form-label">Cron Expression *</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.cronExpression}
                      onChange={(e) => setFormData({ ...formData, cronExpression: e.target.value })}
                      required
                      placeholder="Örn: 0 */2 * * *"
                    />
                    <small className="text-muted d-block mt-1">
                      Yaygın kullanılan ifadeler:
                    </small>
                    <div className="d-flex flex-wrap gap-2 mt-2">
                      {cronSuggestions.slice(0, 6).map((suggestion, index) => (
                        <button
                          key={index}
                          type="button"
                          className="btn btn-sm btn-outline-secondary"
                          onClick={() => setFormData({ ...formData, cronExpression: suggestion.expression })}
                        >
                          {suggestion.description}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Açıklama</label>
                    <textarea
                      className="form-control"
                      rows="3"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Job'un ne yaptığını açıklayın..."
                    ></textarea>
                  </div>

                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      id="jobActiveCheck"
                    />
                    <label className="form-check-label" htmlFor="jobActiveCheck">
                      Job aktif olsun
                    </label>
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowJobModal(false)}
                  >
                    İptal
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={loading}
                  >
                    <i className="bi bi-save me-2"></i>
                    {editingJob ? 'Güncelle' : 'Oluştur'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BackgroundJobsPage;