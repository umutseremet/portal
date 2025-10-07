// src/components/WeeklyCalendar/IssueDetailsModal.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const IssueDetailsModal = ({ show, onHide, selectedGroup, selectedDate }) => {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (show && selectedGroup && selectedDate) {
      fetchIssueDetails();
    }
  }, [show, selectedGroup, selectedDate]);

  const fetchIssueDetails = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const apiUrl = process.env.REACT_APP_API_URL || 'https://localhost:7123';
      const redmineUsername = localStorage.getItem('redmineUsername');
      const redminePassword = localStorage.getItem('redminePassword');

      const requestBody = {
        redmineUsername,
        redminePassword,
        date: selectedDate,
        projectId: selectedGroup.projectId,
        productionType: selectedGroup.productionType
      };

      const response = await axios.post(
        `${apiUrl}/api/RedmineWeeklyCalendar/GetIssuesByDateAndType`,
        requestBody
      );

      if (response.data && response.data.issues) {
        setIssues(response.data.issues);
      }
    } catch (err) {
      console.error('Error fetching issue details:', err);
      setError('İşler yüklenirken bir hata oluştu');
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
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const getProductionTypeColor = (type) => {
    const colors = {
      'Lazer': '#e74c3c',
      'Abkant': '#3498db',
      'Kaynak': '#f39c12',
      'Boya': '#9b59b6',
      'Freze': '#1abc9c',
      'Kaplama': '#34495e',
      'Delik': '#95a5a6',
      'Torna': '#e67e22',
      'Data Hazırlama': '#16a085'
    };
    return colors[type] || '#7f8c8d';
  };

  if (!show) return null;

  return (
    <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
      <div className="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
        <div className="modal-content">
          {/* Modal Header */}
          <div className="modal-header" style={{ 
            background: `linear-gradient(135deg, ${getProductionTypeColor(selectedGroup?.productionType)} 0%, ${getProductionTypeColor(selectedGroup?.productionType)}dd 100%)`,
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
              </div>
            ) : issues.length === 0 ? (
              <div className="text-center py-5">
                <i className="bi bi-inbox fs-1 text-muted"></i>
                <p className="mt-3 text-muted">Bu tarih ve iş tipi için kayıt bulunamadı</p>
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
                    {issues.map((issue) => (
                      <tr key={issue.issueId}>
                        <td>
                          <span className="badge bg-secondary">
                            #{issue.issueId}
                          </span>
                        </td>
                        <td>
                          <div className="d-flex align-items-start">
                            <i className={`bi bi-circle-fill me-2 mt-1 ${issue.isClosed ? 'text-success' : 'text-warning'}`} 
                               style={{ fontSize: '8px' }}></i>
                            <div className="flex-grow-1">
                              <div className="fw-medium">{issue.subject}</div>
                              <small className="text-muted">
                                <i className="bi bi-folder me-1"></i>
                                {issue.projectName}
                              </small>
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
                            {issue.statusName}
                          </span>
                        </td>
                        <td className="text-center">
                          <div className="d-flex align-items-center gap-2">
                            <div className="progress flex-grow-1" style={{ height: '8px' }}>
                              <div 
                                className={`progress-bar ${
                                  issue.completionPercentage >= 100 ? 'bg-success' :
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