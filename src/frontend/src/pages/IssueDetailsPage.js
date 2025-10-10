// src/frontend/src/pages/IssueDetailsPage.js
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import apiService from '../services/api';

const IssueDetailsPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  console.log('🔍 IssueDetailsPage mounted');
  console.log('🔍 Location state:', location.state);
  
  // URL'den gelen parametreleri al
  const { selectedGroup, selectedDate, viewType } = location.state || {};
  
  console.log('🔍 Parsed values:', { selectedGroup, selectedDate, viewType });
  
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    console.log('🔍 IssueDetailsPage useEffect triggered');
    console.log('🔍 selectedDate:', selectedDate);
    console.log('🔍 selectedGroup:', selectedGroup);
    
    if (selectedDate) {
      console.log('✅ selectedDate exists, calling fetchIssueDetails');
      fetchIssueDetails();
    } else {
      console.warn('❌ No selectedDate, redirecting to calendar');
      // Eğer state yoksa takvime geri dön
      navigate('/production/weekly-calendar');
    }
  }, [selectedDate]); // Sadece selectedDate'e bağlı

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

      let response;
      
      // Eğer selectedGroup varsa (kart tıklandı), iş tipine göre filtrele
      if (selectedGroup) {
        const params = {
          date: formattedDate,
          projectId: selectedGroup.projectId,
          productionType: selectedGroup.productionType
        };

        console.log('📤 Calling API with type filter:', params);
        response = await apiService.getIssuesByDateAndType(params);
      } 
      // Eğer selectedGroup yoksa (tarih tıklandı), o tarihteki TÜM işleri getir
      else {
        console.log('📤 Calling API for all issues on date:', formattedDate);
        response = await apiService.getIssuesByDate(formattedDate);
      }

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

  const handleBackToCalendar = () => {
    navigate('/production/weekly-calendar');
  };

  if (!selectedDate) {
    return null;
  }

  return (
    <div className="container-fluid py-4">
      {/* Header */}
      <div className="card mb-4" style={{ 
        background: 'linear-gradient(135deg, #FF6B6B, #FF8E53)',
        color: 'white',
        border: 'none'
      }}>
        <div className="card-body">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h4 className="mb-2">
                <i className="bi bi-list-task me-2"></i>
                {selectedGroup ? 'İş Detayları (Filtrelenmiş)' : 'Günlük İş Listesi'}
              </h4>
              <div className="d-flex align-items-center gap-3 small">
                <span>
                  <i className="bi bi-calendar3 me-1"></i>
                  {formatDate(selectedDate)}
                </span>
                {selectedGroup && (
                  <>
                    <span>
                      <i className="bi bi-building me-1"></i>
                      {selectedGroup.projectCode}
                    </span>
                    <span className="badge bg-light text-dark">
                      {selectedGroup.productionType}
                    </span>
                  </>
                )}
                {!selectedGroup && (
                  <span className="badge bg-light text-dark">
                    <i className="bi bi-funnel me-1"></i>
                    Tüm İşler
                  </span>
                )}
              </div>
            </div>
            <button 
              className="btn btn-light"
              onClick={handleBackToCalendar}
            >
              <i className="bi bi-arrow-left me-2"></i>
              Takvime Dön
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="card">
        <div className="card-body">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-danger" role="status">
                <span className="visually-hidden">Yükleniyor...</span>
              </div>
              <p className="mt-3 text-muted">İşler yükleniyor...</p>
            </div>
          ) : error ? (
            <div className="alert alert-danger">
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
                <thead className="table-light">
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
                        <span className="badge bg-secondary">
                          #{issue.issueId}
                        </span>
                      </td>
                      <td>
                        <div className="d-flex align-items-start">
                          <i className={`bi bi-circle-fill me-2 mt-1 ${issue.isClosed ? 
                            'text-success' : 'text-warning'}`} 
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
                                issue.completionPercentage >= 50 ? 'bg-warning' :
                                'bg-danger'
                              }`}
                              role="progressbar"
                              style={{ width: `${issue.completionPercentage}%` }}
                              aria-valuenow={issue.completionPercentage}
                              aria-valuemin="0"
                              aria-valuemax="100"
                            ></div>
                          </div>
                          <small className="text-muted">{issue.completionPercentage}%</small>
                        </div>
                      </td>
                      <td>
                        <small className="text-muted">
                          <i className="bi bi-person me-1"></i>
                          {issue.assignedTo || '-'}
                        </small>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Geri Dönme Butonu - Alt Kısım */}
      <div className="mt-3">
        <button 
          className="btn btn-outline-secondary"
          onClick={handleBackToCalendar}
        >
          <i className="bi bi-arrow-left me-2"></i>
          Takvime Geri Dön
        </button>
      </div>
    </div>
  );
};

export default IssueDetailsPage;