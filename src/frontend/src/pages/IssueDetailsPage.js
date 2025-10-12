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
  const [filteredIssues, setFilteredIssues] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Filtre state'leri
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    projectId: '',
    productionType: 'all',
    status: 'all',
    assignedTo: ''
  });

  // Benzersiz liste değerleri
  const [projectList, setProjectList] = useState([]);
  const [productionTypes, setProductionTypes] = useState([]);
  const [statusList, setStatusList] = useState([]);
  const [assigneeList, setAssigneeList] = useState([]);

  useEffect(() => {
    console.log('🔍 IssueDetailsPage useEffect triggered');
    console.log('🔍 selectedDate:', selectedDate);
    console.log('🔍 selectedGroup:', selectedGroup);
    
    if (selectedDate) {
      console.log('✅ selectedDate exists, calling fetchIssueDetails');
      fetchIssueDetails();
    } else {
      console.warn('❌ No selectedDate, redirecting to calendar');
      navigate('/production/weekly-calendar');
    }
  }, [selectedDate]);

  // İşler değiştiğinde benzersiz listeleri oluştur
  useEffect(() => {
    if (issues.length > 0) {
      // Benzersiz projeler
      const uniqueProjects = [...new Set(issues.map(i => JSON.stringify({
        id: i.projectId,
        name: i.projectName
      })))].map(str => JSON.parse(str));
      setProjectList(uniqueProjects);

      // Benzersiz üretim tipleri (API'den gelen productionType alanından)
      const uniqueTypes = [...new Set(
        issues
          .map(i => i.productionType)
          .filter(Boolean)
      )];
      setProductionTypes(uniqueTypes);

      // Benzersiz durumlar
      const uniqueStatuses = [...new Set(issues.map(i => i.statusName).filter(Boolean))];
      setStatusList(uniqueStatuses);

      // Benzersiz atananlar
      const uniqueAssignees = [...new Set(issues.map(i => i.assignedTo).filter(Boolean))];
      setAssigneeList(uniqueAssignees);
    }
  }, [issues]);

  // Filtreleme efekti
  useEffect(() => {
    let filtered = [...issues];

    // Proje filtresi
    if (filters.projectId) {
      filtered = filtered.filter(i => i.projectId.toString() === filters.projectId);
    }

    // Üretim tipi filtresi
    if (filters.productionType !== 'all') {
      filtered = filtered.filter(i => i.productionType === filters.productionType);
    }

    // Durum filtresi
    if (filters.status !== 'all') {
      filtered = filtered.filter(i => i.statusName === filters.status);
    }

    // Atanan filtresi
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
        console.log('📤 Calling API with type filter:', params);
        response = await apiService.getIssuesByDateAndType(params);
      } else {
        console.log('📤 Calling API for all issues on date:', formattedDate);
        response = await apiService.getIssuesByDate(formattedDate);
      }

      console.log('📥 API Response:', response);
      const issuesData = response.issues || [];
      console.log('✅ Issues extracted:', issuesData);
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

      {/* Filtre Navigasyonu */}
      <div className="card mb-4">
        <div className="card-body">
          <div className="d-flex justify-content-between align-items-center">
            <div className="d-flex align-items-center gap-2">
              <h6 className="mb-0">
                <i className="bi bi-filter me-2"></i>
                Filtreleme Seçenekleri
              </h6>
              {hasActiveFilters && (
                <span className="badge bg-danger">Aktif Filtre</span>
              )}
            </div>
            <button
              className={`btn ${showFilters ? 'btn-primary' : 'btn-outline-primary'} position-relative`}
              onClick={() => setShowFilters(!showFilters)}
            >
              <i className={`bi bi-funnel${showFilters ? '-fill' : ''} me-2`}></i>
              {showFilters ? 'Filtreleri Gizle' : 'Filtrele'}
              {hasActiveFilters && !showFilters && (
                <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
                  !
                </span>
              )}
            </button>
          </div>

          {/* Filtre Alanı */}
          {showFilters && (
            <>
              <hr className="my-3" />
              <div className="row g-3">
                <div className="col-lg-3 col-md-6">
                  <label className="form-label fw-semibold">
                    <i className="bi bi-folder me-1"></i>
                    Proje
                  </label>
                  <select
                    className="form-select"
                    value={filters.projectId}
                    onChange={(e) => handleFilterChange('projectId', e.target.value)}
                  >
                    <option value="">Tüm Projeler</option>
                    {projectList.map(project => (
                      <option key={project.id} value={project.id}>
                        {project.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-lg-3 col-md-6">
                  <label className="form-label fw-semibold">
                    <i className="bi bi-gear me-1"></i>
                    İş Tipi
                  </label>
                  <select
                    className="form-select"
                    value={filters.productionType}
                    onChange={(e) => handleFilterChange('productionType', e.target.value)}
                  >
                    <option value="all">Tümü</option>
                    {productionTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>

                <div className="col-lg-3 col-md-6">
                  <label className="form-label fw-semibold">
                    <i className="bi bi-flag me-1"></i>
                    Durum
                  </label>
                  <select
                    className="form-select"
                    value={filters.status}
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                  >
                    <option value="all">Tümü</option>
                    {statusList.map(status => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </div>

                <div className="col-lg-3 col-md-6">
                  <label className="form-label fw-semibold">
                    <i className="bi bi-person me-1"></i>
                    Atanan
                  </label>
                  <select
                    className="form-select"
                    value={filters.assignedTo}
                    onChange={(e) => handleFilterChange('assignedTo', e.target.value)}
                  >
                    <option value="">Tümü</option>
                    {assigneeList.map(assignee => (
                      <option key={assignee} value={assignee}>{assignee}</option>
                    ))}
                  </select>
                </div>

                <div className="col-12">
                  <button
                    className="btn btn-outline-danger"
                    onClick={resetFilters}
                    disabled={!hasActiveFilters}
                  >
                    <i className="bi bi-x-circle me-2"></i>
                    Filtreleri Temizle
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* İstatistikler */}
      {/* <div className="row mb-4">
        <div className="col-md-3">
          <div className="card border-primary">
            <div className="card-body text-center">
              <h3 className="mb-0 text-primary">{issues.length}</h3>
              <small className="text-muted">Toplam İş</small>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card border-success">
            <div className="card-body text-center">
              <h3 className="mb-0 text-success">{filteredIssues.length}</h3>
              <small className="text-muted">Filtrelenmiş İş</small>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card border-info">
            <div className="card-body text-center">
              <h3 className="mb-0 text-info">
                {filteredIssues.filter(i => i.completionPercentage === 100 || i.isClosed).length}
              </h3>
              <small className="text-muted">Tamamlanan</small>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card border-warning">
            <div className="card-body text-center">
              <h3 className="mb-0 text-warning">
                {filteredIssues.filter(i => i.completionPercentage < 100 && !i.isClosed).length}
              </h3>
              <small className="text-muted">Devam Eden</small>
            </div>
          </div>
        </div>
      </div> */}

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
                    return (
                      <tr key={issue.issueId || index}>
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
                          <span className="badge bg-primary">{issue.productionType || '-'}</span>
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
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Geri Dönme Butonu */}
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