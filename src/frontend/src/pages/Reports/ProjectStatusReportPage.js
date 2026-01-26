// src/frontend/src/pages/Reports/ProjectStatusReportPage.js
import React, { useState, useEffect, useCallback, useRef } from 'react';
import apiService from '../../services/api';
import ProjectStatusCard from '../../components/Reports/ProjectStatusCard';
import './ProjectStatusReportPage.css';

const ProjectStatusReportPage = () => {
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    reportDate: new Date().toISOString().split('T')[0]
  });
  const [availableProjects, setAvailableProjects] = useState([]);
  const [selectedProjects, setSelectedProjects] = useState([]);
  
  // Dropdown States
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [dropdownSearch, setDropdownSearch] = useState('');
  
  // Refs for dropdown close
  const dropdownRef = useRef(null);

  // Dashboard gösterimli projeleri yükle
  useEffect(() => {
    const loadProjects = async () => {
      try {
        if (reportData && reportData.projects) {
          const projects = reportData.projects.map(p => ({
            id: p.projectId,
            code: p.projectCode,
            name: p.projectName
          }));
          setAvailableProjects(projects);
        }
      } catch (err) {
        console.error('Error loading projects:', err);
      }
    };
    loadProjects();
  }, [reportData]);

  // Raporu yükle
  const loadReport = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const filterData = {
        reportDate: filters.reportDate
      };

      const data = await apiService.getProjectStatusReport(filterData);
      setReportData(data);
    } catch (err) {
      console.error('Error loading report:', err);
      setError(err.message || 'Rapor yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  }, [filters.reportDate]);

  // İlk yükleme
  useEffect(() => {
    loadReport();
  }, [loadReport]);

  // Dropdown dışına tıklamada kapat
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Dropdown toggle
  const toggleDropdown = () => {
    setDropdownOpen(!dropdownOpen);
  };

  // Checkbox change handler
  const handleCheckboxChange = (projectId) => {
    setSelectedProjects(prev => {
      if (prev.includes(projectId)) {
        return prev.filter(id => id !== projectId);
      } else {
        return [...prev, projectId];
      }
    });
  };

  // Select all handler
  const handleSelectAll = () => {
    const filteredIds = getFilteredProjectList().map(p => p.id);
    const allSelected = filteredIds.every(id => selectedProjects.includes(id));
    
    if (allSelected) {
      setSelectedProjects(prev => prev.filter(id => !filteredIds.includes(id)));
    } else {
      setSelectedProjects(prev => [...new Set([...prev, ...filteredIds])]);
    }
  };

  // Filtered project list based on search
  const getFilteredProjectList = () => {
    if (!dropdownSearch) return availableProjects;
    
    const searchLower = dropdownSearch.toLowerCase();
    return availableProjects.filter(project => 
      project.code.toLowerCase().includes(searchLower) ||
      project.name.toLowerCase().includes(searchLower)
    );
  };

  // Tarih değiştirme
  const handleDateChange = (e) => {
    setFilters(prev => ({ ...prev, reportDate: e.target.value }));
  };

  // Filtrelenmiş projeleri getir
  const getFilteredProjects = () => {
    if (!reportData || !reportData.projects) return [];
    
    if (selectedProjects.length === 0) {
      return reportData.projects;
    }
    
    return reportData.projects.filter(p => selectedProjects.includes(p.projectId));
  };

  // Tarihi formatla
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  return (
    <div className="container-fluid">
      {/* Sayfa Başlığı */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="page-header">
            <h2 className="page-title mb-2">
              <i className="bi bi-graph-up-arrow me-2"></i>
              Projeler Anlık Durum Raporu
            </h2>
            <p className="page-subtitle text-muted">
              Projelerin güncel durumunu ve haftalık planlarını görüntüleyin
            </p>
          </div>
        </div>
      </div>

      {/* Filtreler */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="card shadow-sm">
            <div className="card-body">
              <div className="row g-3">
                {/* Tarih Seçimi */}
                <div className="col-md-3">
                  <label className="form-label small fw-bold">
                    <i className="bi bi-calendar3 me-1"></i>
                    Rapor Tarihi
                  </label>
                  <input
                    type="date"
                    className="form-control"
                    value={filters.reportDate}
                    onChange={handleDateChange}
                  />
                  <small className="text-muted d-block mt-2">
                    <i className="bi bi-info-circle me-1"></i>
                    Sadece Dashboard Gösterim işaretli projeler gösterilir
                  </small>
                </div>

                {/* Proje Filtreleme - Custom Dropdown */}
                <div className="col-md-6" ref={dropdownRef}>
                  <label className="form-label small fw-bold">
                    <i className="bi bi-folder me-1"></i>
                    Proje Filtresi
                    {selectedProjects.length > 0 && (
                      <span className="badge bg-primary ms-2">{selectedProjects.length}</span>
                    )}
                  </label>
                  <div className="position-relative">
                    <button
                      className={`btn btn-outline-secondary w-100 d-flex justify-content-between align-items-center ${selectedProjects.length > 0 ? 'btn-outline-primary' : ''}`}
                      onClick={toggleDropdown}
                      type="button"
                    >
                      <span className="text-truncate">
                        {selectedProjects.length === 0 ? 'Seçiniz' : `${selectedProjects.length} proje seçili`}
                      </span>
                      <i className={`bi bi-chevron-${dropdownOpen ? 'up' : 'down'}`}></i>
                    </button>

                    {dropdownOpen && (
                      <div className="dropdown-menu show w-100" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                        {/* Arama */}
                        <div className="px-3 py-2 border-bottom bg-light">
                          <input
                            type="text"
                            className="form-control form-control-sm"
                            placeholder="Ara..."
                            value={dropdownSearch}
                            onChange={(e) => setDropdownSearch(e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>

                        {/* Tümünü Seç */}
                        <div className="px-3 py-2 border-bottom">
                          <div className="form-check">
                            <input
                              className="form-check-input"
                              type="checkbox"
                              checked={getFilteredProjectList().length > 0 && 
                                getFilteredProjectList().every(p => selectedProjects.includes(p.id))}
                              onChange={handleSelectAll}
                              id="select-all-projects"
                            />
                            <label className="form-check-label fw-bold" htmlFor="select-all-projects">
                              Tümünü Seç
                            </label>
                          </div>
                        </div>

                        {/* Proje Listesi */}
                        {getFilteredProjectList().length === 0 ? (
                          <div className="px-3 py-2 text-center text-muted">
                            <i className="bi bi-search me-1"></i>
                            Sonuç bulunamadı
                          </div>
                        ) : (
                          getFilteredProjectList().map(project => (
                            <div key={project.id} className="px-3 py-2">
                              <div className="form-check">
                                <input
                                  className="form-check-input"
                                  type="checkbox"
                                  checked={selectedProjects.includes(project.id)}
                                  onChange={() => handleCheckboxChange(project.id)}
                                  id={`project-${project.id}`}
                                />
                                <label
                                  className="form-check-label"
                                  htmlFor={`project-${project.id}`}
                                  style={{ cursor: 'pointer' }}
                                >
                                  <strong>{project.code}</strong> - {project.name}
                                </label>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                  <div className="d-flex justify-content-between align-items-center mt-2">
                    {selectedProjects.length > 0 ? (
                      <>
                        <small className="text-primary">
                          <i className="bi bi-filter me-1"></i>
                          {selectedProjects.length} proje seçili
                        </small>
                        <button
                          className="btn btn-sm btn-outline-secondary"
                          onClick={() => setSelectedProjects([])}
                        >
                          <i className="bi bi-x-circle me-1"></i>
                          Filtreyi Temizle
                        </button>
                      </>
                    ) : (
                      <small className="text-muted">
                        <i className="bi bi-info-circle me-1"></i>
                        Tüm projeler gösteriliyor
                      </small>
                    )}
                  </div>
                </div>

                {/* Yenile Butonu */}
                <div className="col-md-3 d-flex align-items-end">
                  <button
                    className="btn w-100 text-white"
                    style={{ background: 'linear-gradient(135deg, #ff6b6b 0%, #ff8e53 100%)' }}
                    onClick={loadReport}
                    disabled={loading}
                  >
                    <i className="bi bi-arrow-clockwise me-1"></i>
                    {loading ? 'Yükleniyor...' : 'Raporu Yenile'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Rapor Özet Bilgi */}
      {reportData && !loading && (
        <div className="row mb-3">
          <div className="col-12">
            <div className="alert alert-info mb-0">
              <div className="row">
                <div className="col-md-4">
                  <strong>
                    <i className="bi bi-calendar-event me-1"></i>
                    Rapor Tarihi:
                  </strong>{' '}
                  {formatDate(reportData.reportDate)}
                </div>
                <div className="col-md-4">
                  <strong>
                    <i className="bi bi-calendar-week me-1"></i>
                    Hafta Aralığı:
                  </strong>{' '}
                  {formatDate(reportData.weekStart)} - {formatDate(reportData.weekEnd)}
                </div>
                <div className="col-md-4">
                  <strong>
                    <i className="bi bi-folder-fill me-1"></i>
                    Toplam Proje:
                  </strong>{' '}
                  {reportData.projects.length}
                  {selectedProjects.length > 0 && (
                    <span className="text-primary ms-2">
                      (Gösterilen: {getFilteredProjects().length})
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="row">
          <div className="col-12">
            <div className="card">
              <div className="card-body text-center py-5">
                <div className="spinner-border text-primary mb-3" role="status">
                  <span className="visually-hidden">Yükleniyor...</span>
                </div>
                <p className="text-muted">Rapor hazırlanıyor...</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="row">
          <div className="col-12">
            <div className="alert alert-danger">
              <i className="bi bi-exclamation-triangle me-2"></i>
              <strong>Hata:</strong> {error}
            </div>
          </div>
        </div>
      )}

      {/* Proje Kartları */}
      {reportData && !loading && !error && (
        <>
          {getFilteredProjects().length === 0 ? (
            <div className="row">
              <div className="col-12">
                <div className="alert alert-warning">
                  <i className="bi bi-info-circle me-2"></i>
                  Seçilen kriterlere uygun proje bulunamadı.
                </div>
              </div>
            </div>
          ) : (
            <div className="row">
              {getFilteredProjects().map(project => (
                <ProjectStatusCard key={project.projectId} project={project} />
              ))}
            </div>
          )}
        </>
      )}

      {/* Print Styles */}
      <style jsx>{`
        @media print {
          .page-header,
          .card-body .btn,
          .alert-info {
            display: none !important;
          }
          .card {
            break-inside: avoid;
            page-break-inside: avoid;
          }
        }
      `}</style>
    </div>
  );
};

export default ProjectStatusReportPage;