// src/components/WeeklyCalendar/IssueDetailsModal.js
import React, { useState, useEffect } from 'react';
import apiService from '../../services/api';
import { REDMINE_BASE_URL } from '../../utils/constants'; // ✅ Environment variable'dan okunur

const IssueDetailsModal = ({ show, onHide, selectedGroup, selectedDate }) => {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    console.log('🔄 Modal useEffect:', { show, selectedGroup, selectedDate });
    if (show && selectedGroup && selectedDate) {
      fetchIssueDetails();
    }
  }, [show, selectedGroup, selectedDate]);

  const fetchIssueDetails = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Tarih formatını düzelt
      let formattedDate = selectedDate;
      if (selectedDate instanceof Date) {
        formattedDate = selectedDate.toISOString().split('T')[0];
      } else if (typeof selectedDate === 'string') {
        formattedDate = new Date(selectedDate).toISOString().split('T')[0];
      }

      const params = {
        date: formattedDate,
        projectId: selectedGroup.projectId,
        productionType: selectedGroup.productionType
      };

      console.log('📤 Calling API with params:', params);

      const response = await apiService.getIssuesByDateAndType(params);

      console.log('📥 API Response:', response);

      const issuesData = response.issues || [];
      
      console.log('✅ Issues extracted:', issuesData);
      setIssues(issuesData);
    } catch (err) {
      console.error('❌ Error fetching issue details:', err);
      setError(err.message || 'İşler yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeClass = (statusName, isClosed) => {
    if (isClosed) return 'bg-success';
    if (statusName?.includes('İptal')) return 'bg-danger';
    if (statusName?.includes('Bekliyor')) return 'bg-warning';
    return 'bg-info';
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch (e) {
      return '-';
    }
  };

  if (!show) return null;

  console.log('🎨 Rendering modal - issues count:', issues.length);

  return (
    <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
      <div className="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
        <div className="modal-content">
          {/* Modal Header */}
          <div className="modal-header" style={{ 
            background: 'linear-gradient(135deg, #FF6B6B, #FF8E53)',
            color: 'white'
          }}>
            <div>
              <h5 className="modal-title mb-1">
                <i className="bi bi-list-task me-2"></i>
                İş Detayları
              </h5>
              <div className="d-flex align-items-center gap-3 small">
                <span>
                  <i className="bi bi-calendar3 me-1"></i>
                  {formatDate(selectedDate)}
                </span>
                <span>
                  <i className="bi bi-building me-1"></i>
                  {selectedGroup?.projectCode}
                </span>
                <span className="badge bg-light text-dark">
                  {selectedGroup?.productionType}
                </span>
              </div>
            </div>
            <button 
              type="button" 
              className="btn-close btn-close-white" 
              onClick={onHide}
            ></button>
          </div>

          {/* Modal Body */}
          <div className="modal-body p-0">
            {loading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-danger" role="status">
                  <span className="visually-hidden">Yükleniyor...</span>
                </div>
                <p className="mt-3 text-muted">İşler yükleniyor...</p>
              </div>
            ) : error ? (
              <div className="alert alert-danger m-4">
                <i className="bi bi-exclamation-triangle me-2"></i>
                {error}
                <div className="mt-2 small">
                  <strong>Debug Bilgisi:</strong>
                  <br />
                  Proje ID: {selectedGroup?.projectId}
                  <br />
                  İş Tipi: {selectedGroup?.productionType}
                  <br />
                  Tarih: {formatDate(selectedDate)}
                </div>
              </div>
            ) : issues.length === 0 ? (
              <div className="text-center py-5">
                <i className="bi bi-inbox fs-1 text-muted"></i>
                <p className="mt-3 text-muted">Bu tarih ve iş tipi için kayıt bulunamadı</p>
                <div className="mt-2 small text-muted">
                  <strong>Arama Kriterleri:</strong>
                  <br />
                  Proje ID: {selectedGroup?.projectId}
                  <br />
                  İş Tipi: {selectedGroup?.productionType}
                  <br />
                  Tarih: {formatDate(selectedDate)}
                </div>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover mb-0">
                  <thead className="table-light sticky-top">
                    <tr>
                      <th style={{ width: '80px' }}>İş No</th>
                      <th>Konu</th>
                      <th style={{ width: '120px' }}>Planlanan Başlangıç</th>
                      <th style={{ width: '120px' }}>Planlanan Bitiş</th>
                      <th style={{ width: '100px' }}>Durum</th>
                      <th style={{ width: '80px' }} className="text-center">İlerleme</th>
                      <th style={{ width: '120px' }}>Atanan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {issues.map((issue, index) => (
                      <tr key={issue.issueId || index}>
                        <td>
                          {/* ✅ REDMINE_BASE_URL constants'dan okunuyor */}
                          <a 
                            href={`${REDMINE_BASE_URL}/issues/${issue.issueId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="badge bg-secondary text-decoration-none"
                            style={{ cursor: 'pointer' }}
                            title={`Redmine'da aç: #${issue.issueId}`}
                          >
                            #{issue.issueId}
                          </a>
                        </td>
                        <td>
                          <div className="d-flex align-items-start">
                            <i className={`bi bi-circle-fill me-2 mt-1 ${issue.isClosed ?
                              'text-success' : 'text-warning'}`}
                              style={{ fontSize: '0.5rem' }}
                            ></i>
                            <div>
                              <div className="fw-medium">{issue.subject || 'Konu yok'}</div>
                              <small className="text-muted">{issue.trackerName}</small>
                            </div>
                          </div>
                        </td>
                        <td>
                          <small className="text-muted">
                            <i className="bi bi-calendar-check me-1"></i>
                            {formatDate(issue.plannedStartDate)}
                          </small>
                        </td>
                        <td>
                          <small className="text-muted">
                            <i className="bi bi-calendar-x me-1"></i>
                            {formatDate(issue.plannedEndDate)}
                          </small>
                        </td>
                        <td>
                          <span className={`badge ${getStatusBadgeClass(issue.statusName, issue.isClosed)}`}>
                            {issue.statusName || 'Durum Yok'}
                          </span>
                        </td>
                        <td>
                          <div className="d-flex align-items-center gap-2">
                            <div className="progress flex-grow-1" style={{ height: '6px' }}>
                              <div
                                className={`progress-bar ${
                                  issue.completionPercentage === 100 ? 'bg-success' :
                                  issue.completionPercentage >= 75 ? 'bg-info' :
                                  issue.completionPercentage >= 50 ? 'bg-warning' : 'bg-danger'
                                }`}
                                role="progressbar"
                                style={{ width: `${issue.completionPercentage}%` }}
                                aria-valuenow={issue.completionPercentage}
                                aria-valuemin="0"
                                aria-valuemax="100"
                              ></div>
                            </div>
                            <small className="text-nowrap" style={{ minWidth: '35px' }}>
                              {issue.completionPercentage}%
                            </small>
                          </div>
                        </td>
                        <td>
                          <small className="text-muted">
                            <i className="bi bi-person me-1"></i>
                            {issue.assignedTo || 'Atanmamış'}
                          </small>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Modal Footer */}
          <div className="modal-footer">
            <div className="d-flex justify-content-between align-items-center w-100">
              <div className="text-muted small">
                <i className="bi bi-info-circle me-1"></i>
                Toplam <strong>{issues.length}</strong> iş gösteriliyor
              </div>
              <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={onHide}
              >
                <i className="bi bi-x-lg me-2"></i>
                Kapat
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IssueDetailsModal;