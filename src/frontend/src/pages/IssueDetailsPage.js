// src/frontend/src/pages/IssueDetailsPage.js
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import apiService from '../services/api';

const IssueDetailsPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const { selectedGroup, selectedDate, viewType } = location.state || {};
  
  const [issues, setIssues] = useState([]);
  const [filteredIssues, setFilteredIssues] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    projectId: '',
    productionType: 'all',
    status: 'all',
    assignedTo: ''
  });

  const [projectList, setProjectList] = useState([]);
  const [productionTypes, setProductionTypes] = useState([]);
  const [statusList, setStatusList] = useState([]);
  const [assigneeList, setAssigneeList] = useState([]);

  useEffect(() => {
    if (selectedDate) {
      fetchIssueDetails();
    }
  }, [selectedDate, selectedGroup]);

  useEffect(() => {
    if (issues.length > 0) {
      const projects = [...new Set(issues.map(i => i.projectName))];
      const types = [...new Set(issues.map(i => i.productionType).filter(Boolean))];
      const statuses = [...new Set(issues.map(i => i.statusName))];
      const assignees = [...new Set(issues.map(i => i.assignedTo))];

      setProjectList(projects);
      setProductionTypes(types);
      setStatusList(statuses);
      setAssigneeList(assignees);
    }
  }, [issues]);

  useEffect(() => {
    let filtered = [...issues];

    if (filters.projectId) {
      filtered = filtered.filter(i => i.projectName === filters.projectId);
    }

    if (filters.productionType && filters.productionType !== 'all') {
      filtered = filtered.filter(i => i.productionType === filters.productionType);
    }

    if (filters.status && filters.status !== 'all') {
      filtered = filtered.filter(i => i.statusName === filters.status);
    }

    if (filters.assignedTo) {
      filtered = filtered.filter(i => i.assignedTo === filters.assignedTo);
    }

    setFilteredIssues(filtered);
  }, [issues, filters]);

  const fetchIssueDetails = async () => {
    setLoading(true);
    setError(null);
    
    try {
      let formattedDate = selectedDate;
      if (selectedDate instanceof Date) {
        formattedDate = selectedDate.toISOString().split('T')[0];
      } else if (typeof selectedDate === 'string') {
        formattedDate = new Date(selectedDate).toISOString().split('T')[0];
      }

      let response;
      
      if (selectedGroup) {
        const params = {
          date: formattedDate,
          projectId: selectedGroup.projectId,
          productionType: selectedGroup.productionType
        };
        response = await apiService.getIssuesByDateAndType(params);
      } else {
        response = await apiService.getIssuesByDate(formattedDate);
      }

      const issuesData = response.issues || [];
      setIssues(issuesData);
      setFilteredIssues(issuesData);
    } catch (err) {
      console.error('❌ Error fetching issue details:', err);
      setError(err.message || 'İşler yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const resetFilters = () => {
    setFilters({
      projectId: '',
      productionType: 'all',
      status: 'all',
      assignedTo: ''
    });
    setShowFilters(false);
  };

  const hasActiveFilters = filters.projectId || filters.productionType !== 'all' || 
                          filters.status !== 'all' || filters.assignedTo;

  // ✅ GECİKME KONTROLÜ FONKSİYONU
  const checkIfIssueOverdue = (issue) => {
    if (!issue.plannedEndDate) return false;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const plannedEnd = new Date(issue.plannedEndDate);
    plannedEnd.setHours(0, 0, 0, 0);
    
    // İş kapanmışsa, kapanma tarihini kontrol et
    if (issue.isClosed && issue.closedOn) {
      const closedDate = new Date(issue.closedOn);
      closedDate.setHours(0, 0, 0, 0);
      return closedDate > plannedEnd;
    }
    
    // İş açıksa, bugünü kontrol et
    return today > plannedEnd;
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
          <div className="d-flex justify-content-between align-items-center flex-wrap">
            <div className="mb-2 mb-md-0">
              <h4 className="mb-2">
                <i className="bi bi-list-task me-2"></i>
                {selectedGroup ? 'İş Detayları (Filtrelenmiş)' : 'Günlük İş Listesi'}
              </h4>
              <div className="d-flex align-items-center gap-3 small flex-wrap">
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
            <div className="d-flex gap-2">
              <button 
                className="btn btn-light btn-sm"
                onClick={() => setShowFilters(!showFilters)}
              >
                <i className="bi bi-funnel me-1"></i>
                Filtrele
                {hasActiveFilters && (
                  <span className="badge bg-danger ms-1">!</span>
                )}
              </button>
              <button 
                className="btn btn-light btn-sm"
                onClick={handleBackToCalendar}
              >
                <i className="bi bi-arrow-left me-1"></i>
                Takvime Dön
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="card mb-4">
          <div className="card-body">
            <div className="row g-3">
              <div className="col-md-3">
                <label className="form-label small">Proje</label>
                <select 
                  className="form-select form-select-sm"
                  value={filters.projectId}
                  onChange={(e) => handleFilterChange('projectId', e.target.value)}
                >
                  <option value="">Tümü</option>
                  {projectList.map((project, idx) => (
                    <option key={idx} value={project}>{project}</option>
                  ))}
                </select>
              </div>
              <div className="col-md-3">
                <label className="form-label small">İş Tipi</label>
                <select 
                  className="form-select form-select-sm"
                  value={filters.productionType}
                  onChange={(e) => handleFilterChange('productionType', e.target.value)}
                >
                  <option value="all">Tümü</option>
                  {productionTypes.map((type, idx) => (
                    <option key={idx} value={type}>{type}</option>
                  ))}
                </select>
              </div>
              <div className="col-md-3">
                <label className="form-label small">Durum</label>
                <select 
                  className="form-select form-select-sm"
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                >
                  <option value="all">Tümü</option>
                  {statusList.map((status, idx) => (
                    <option key={idx} value={status}>{status}</option>
                  ))}
                </select>
              </div>
              <div className="col-md-3">
                <label className="form-label small">Atanan</label>
                <select 
                  className="form-select form-select-sm"
                  value={filters.assignedTo}
                  onChange={(e) => handleFilterChange('assignedTo', e.target.value)}
                >
                  <option value="">Tümü</option>
                  {assigneeList.map((assignee, idx) => (
                    <option key={idx} value={assignee}>{assignee}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="mt-3">
              <button 
                className="btn btn-sm btn-outline-secondary"
                onClick={resetFilters}
              >
                <i className="bi bi-x-circle me-1"></i>
                Filtreleri Temizle
              </button>
            </div>
          </div>
        </div>
      )}

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
            </div>
          ) : filteredIssues.length === 0 ? (
            <div className="text-center py-5">
              <i className="bi bi-inbox fs-1 text-muted"></i>
              <p className="mt-3 text-muted">
                {hasActiveFilters ? 'Filtrelere uygun kayıt bulunamadı' : 'Bu tarih için kayıt bulunamadı'}
              </p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead className="table-light">
                  <tr>
                    <th style={{ width: '80px' }}>İş No</th>
                    <th>Konu</th>
                    <th style={{ width: '120px' }}>İş Tipi</th>
                    <th style={{ width: '120px' }}>Planlanan Başlangıç</th>
                    <th style={{ width: '120px' }}>Planlanan Bitiş</th>
                    <th style={{ width: '100px' }}>Durum</th>
                    <th style={{ width: '80px' }} className="text-center">İlerleme</th>
                    <th style={{ width: '120px' }}>Atanan</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredIssues.map((issue, index) => {
                    const isOverdue = checkIfIssueOverdue(issue);
                    
                    return (
                      <tr 
                        key={issue.issueId || index}
                        className={isOverdue ? 'overdue-row' : ''}
                        style={isOverdue ? {
                          backgroundColor: 'rgba(220, 53, 69, 0.05)',
                          borderLeft: '4px solid #dc3545'
                        } : {}}
                      >
                        <td>
                          <div className="d-flex align-items-center gap-2">
                            {/* ✅ ÜNLEM İKONU - Sadece gecikmiş işlerde */}
                            {isOverdue && (
                              <div 
                                className="overdue-indicator blinking"
                                title="Bu iş planlanan bitiş tarihini aştı!"
                              >
                                <i className="bi bi-exclamation-triangle-fill text-danger"></i>
                              </div>
                            )}
                            <span className="badge bg-secondary">
                              #{issue.issueId}
                            </span>
                          </div>
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
                          <span className="badge bg-primary">{issue.productionType || '-'}</span>
                        </td>
                        <td>
                          <small className="text-muted">
                            <i className="bi bi-calendar-check me-1"></i>
                            {formatDate(issue.plannedStartDate)}
                          </small>
                        </td>
                        <td>
                          <small className={isOverdue ? 'text-danger fw-bold' : 'text-muted'}>
                            <i className="bi bi-calendar-x me-1"></i>
                            {formatDate(issue.plannedEndDate)}
                            {isOverdue && (
                              <i className="bi bi-exclamation-circle-fill ms-1"></i>
                            )}
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
                            <span className="small text-nowrap">{issue.completionPercentage}%</span>
                          </div>
                        </td>
                        <td>
                          <small>{issue.assignedTo}</small>
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

      {/* Summary */}
      {filteredIssues.length > 0 && (
        <div className="card mt-4">
          <div className="card-body">
            <div className="row text-center">
              <div className="col-md-3">
                <div className="p-3">
                  <h5 className="text-primary mb-1">{filteredIssues.length}</h5>
                  <small className="text-muted">Toplam İş</small>
                </div>
              </div>
              <div className="col-md-3">
                <div className="p-3">
                  <h5 className="text-success mb-1">
                    {filteredIssues.filter(i => i.isClosed).length}
                  </h5>
                  <small className="text-muted">Tamamlanan</small>
                </div>
              </div>
              <div className="col-md-3">
                <div className="p-3">
                  <h5 className="text-warning mb-1">
                    {filteredIssues.filter(i => !i.isClosed).length}
                  </h5>
                  <small className="text-muted">Devam Eden</small>
                </div>
              </div>
              <div className="col-md-3">
                <div className="p-3">
                  <h5 className="text-danger mb-1">
                    {filteredIssues.filter(i => checkIfIssueOverdue(i)).length}
                  </h5>
                  <small className="text-muted">Gecikmiş</small>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default IssueDetailsPage;