// src/frontend/src/pages/WeeklyProductionCalendarPage.js
import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import '../styles/WeeklyProductionCalendar.css';
import apiService from '../services/api';

const WeeklyProductionCalendarPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  
  // State
  const [calendarData, setCalendarData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Filters
  const [parentIssueId, setParentIssueId] = useState(searchParams.get('parentIssueId') || '');
  const [projectId, setProjectId] = useState(searchParams.get('projectId') || '');
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [selectedProductionType, setSelectedProductionType] = useState('all');
  const [projectList, setProjectList] = useState([]);

  // Fetch calendar data
  const fetchCalendarData = async () => {
    setLoading(true);
    setError(null);

    try {
      const requestBody = {
        startDate: formatDate(getWeekStart(currentWeek)),
        parentIssueId: parentIssueId ? parseInt(parentIssueId) : null,
        projectId: projectId ? parseInt(projectId) : null
      };

      console.log('📅 Fetching calendar data:', requestBody);

      const response = await apiService.post('/RedmineWeeklyCalendar/GetWeeklyProductionCalendar', requestBody);
      
      console.log('✅ Calendar data received:', response);
      setCalendarData(response);

      // Extract unique projects
      const projects = new Set();
      response.days?.forEach(day => {
        day.productionIssues?.forEach(issue => {
          if (issue.projectId && issue.projectName) {
            projects.add(JSON.stringify({ id: issue.projectId, name: issue.projectName }));
          }
        });
      });
      setProjectList(Array.from(projects).map(p => JSON.parse(p)));

    } catch (err) {
      console.error('❌ Error fetching calendar:', err);
      setError(err.message || 'Takvim verileri yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  // Load data on mount and when filters change
  useEffect(() => {
    fetchCalendarData();
  }, [currentWeek, parentIssueId, projectId]);

  // Update URL params when filters change
  useEffect(() => {
    const params = {};
    if (parentIssueId) params.parentIssueId = parentIssueId;
    if (projectId) params.projectId = projectId;
    setSearchParams(params);
  }, [parentIssueId, projectId]);

  // Helper functions
  const getWeekStart = (date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Pazartesi
    return new Date(d.setDate(diff));
  };

  const formatDate = (date) => {
    return date.toISOString().split('T')[0];
  };

  const formatDisplayDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' });
  };

  const goToPreviousWeek = () => {
    const prevWeek = new Date(currentWeek);
    prevWeek.setDate(prevWeek.getDate() - 7);
    setCurrentWeek(prevWeek);
  };

  const goToNextWeek = () => {
    const nextWeek = new Date(currentWeek);
    nextWeek.setDate(nextWeek.getDate() + 7);
    setCurrentWeek(nextWeek);
  };

  const goToToday = () => {
    setCurrentWeek(new Date());
  };

  const resetFilters = () => {
    setParentIssueId('');
    setProjectId('');
    setSelectedProductionType('all');
  };

  // Filter issues by production type
  const filterIssuesByType = (issues) => {
    if (selectedProductionType === 'all') return issues;
    return issues.filter(issue => issue.productionType === selectedProductionType);
  };

  // Get production type color
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

  // Get completion badge class
  const getCompletionBadgeClass = (percentage) => {
    if (percentage >= 100) return 'bg-success';
    if (percentage >= 75) return 'bg-info';
    if (percentage >= 50) return 'bg-warning';
    return 'bg-danger';
  };

  // Get all unique production types
  const getAllProductionTypes = () => {
    if (!calendarData) return [];
    const types = new Set();
    calendarData.days?.forEach(day => {
      day.productionIssues?.forEach(issue => {
        if (issue.productionType) types.add(issue.productionType);
      });
    });
    return Array.from(types).sort();
  };

  // Calculate statistics
  const getStatistics = () => {
    if (!calendarData) return { total: 0, completed: 0, inProgress: 0, avgCompletion: 0 };
    
    let total = 0;
    let completed = 0;
    let totalCompletion = 0;

    calendarData.days?.forEach(day => {
      const filteredIssues = filterIssuesByType(day.productionIssues || []);
      filteredIssues.forEach(issue => {
        total++;
        totalCompletion += issue.completionPercentage || 0;
        if (issue.isCompleted) completed++;
      });
    });

    return {
      total,
      completed,
      inProgress: total - completed,
      avgCompletion: total > 0 ? Math.round(totalCompletion / total) : 0
    };
  };

  const stats = getStatistics();

  return (
    <div className="weekly-production-calendar-page">
      <div className="container-fluid">
        {/* Page Header */}
        <div className="row mb-4">
          <div className="col-12">
            <div className="d-flex justify-content-between align-items-start flex-wrap">
              <div className="page-header mb-3">
                <h2 className="page-title mb-2">
                  <i className="bi bi-calendar3 me-2"></i>
                  Haftalık Üretim Takvimi
                </h2>
                <p className="page-subtitle text-muted">
                  Üretim işlerini planlanan tarihlere göre görüntüleyin ve takip edin
                </p>
              </div>
              <div className="page-actions">
                <button 
                  className="btn btn-outline-secondary me-2"
                  onClick={() => window.print()}
                >
                  <i className="bi bi-printer me-1"></i>
                  Yazdır
                </button>
                <button 
                  className="btn btn-danger"
                  onClick={fetchCalendarData}
                  disabled={loading}
                >
                  <i className="bi bi-arrow-clockwise me-1"></i>
                  Yenile
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="row g-3 mb-4">
          <div className="col-lg-3 col-md-6">
            <div className="stat-card bg-primary text-white">
              <div className="stat-icon">
                <i className="bi bi-list-task"></i>
              </div>
              <div className="stat-content">
                <div className="stat-value">{stats.total}</div>
                <div className="stat-label">Toplam İş</div>
              </div>
            </div>
          </div>
          <div className="col-lg-3 col-md-6">
            <div className="stat-card bg-success text-white">
              <div className="stat-icon">
                <i className="bi bi-check-circle"></i>
              </div>
              <div className="stat-content">
                <div className="stat-value">{stats.completed}</div>
                <div className="stat-label">Tamamlanan</div>
              </div>
            </div>
          </div>
          <div className="col-lg-3 col-md-6">
            <div className="stat-card bg-warning text-white">
              <div className="stat-icon">
                <i className="bi bi-hourglass-split"></i>
              </div>
              <div className="stat-content">
                <div className="stat-value">{stats.inProgress}</div>
                <div className="stat-label">Devam Eden</div>
              </div>
            </div>
          </div>
          <div className="col-lg-3 col-md-6">
            <div className="stat-card bg-info text-white">
              <div className="stat-icon">
                <i className="bi bi-speedometer2"></i>
              </div>
              <div className="stat-content">
                <div className="stat-value">%{stats.avgCompletion}</div>
                <div className="stat-label">Ortalama Tamamlanma</div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="card mb-4">
          <div className="card-body">
            <div className="row g-3">
              <div className="col-lg-3 col-md-6">
                <label className="form-label">Ana İş ID</label>
                <input
                  type="number"
                  className="form-control"
                  placeholder="Ör: 4560"
                  value={parentIssueId}
                  onChange={(e) => setParentIssueId(e.target.value)}
                />
                <small className="text-muted">Boş bırakılırsa tüm işler gösterilir</small>
              </div>
              <div className="col-lg-3 col-md-6">
                <label className="form-label">Proje</label>
                <select
                  className="form-select"
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
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
                <label className="form-label">Üretim Tipi</label>
                <select
                  className="form-select"
                  value={selectedProductionType}
                  onChange={(e) => setSelectedProductionType(e.target.value)}
                >
                  <option value="all">Tümü</option>
                  {getAllProductionTypes().map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
              <div className="col-lg-3 col-md-6 d-flex align-items-end">
                <button
                  className="btn btn-outline-secondary w-100"
                  onClick={resetFilters}
                >
                  <i className="bi bi-x-circle me-1"></i>
                  Filtreleri Temizle
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Week Navigation */}
        <div className="card mb-4">
          <div className="card-body">
            <div className="d-flex justify-content-between align-items-center">
              <button
                className="btn btn-outline-primary"
                onClick={goToPreviousWeek}
                disabled={loading}
              >
                <i className="bi bi-chevron-left"></i>
                Önceki Hafta
              </button>
              
              <div className="text-center">
                <h4 className="mb-1">
                  {calendarData && formatDisplayDate(calendarData.weekStart)} - {calendarData && formatDisplayDate(calendarData.weekEnd)}
                </h4>
                <button
                  className="btn btn-link btn-sm"
                  onClick={goToToday}
                >
                  Bugüne Git
                </button>
              </div>

              <button
                className="btn btn-outline-primary"
                onClick={goToNextWeek}
                disabled={loading}
              >
                Sonraki Hafta
                <i className="bi bi-chevron-right ms-1"></i>
              </button>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-5">
            <div className="spinner-border text-danger" role="status">
              <span className="visually-hidden">Yükleniyor...</span>
            </div>
            <p className="mt-3 text-muted">Takvim verileri yükleniyor...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="alert alert-danger d-flex align-items-center" role="alert">
            <i className="bi bi-exclamation-triangle-fill me-2"></i>
            <div>{error}</div>
          </div>
        )}

        {/* Calendar Grid */}
        {!loading && !error && calendarData && (
          <div className="calendar-grid">
            {calendarData.days?.map((day, index) => {
              const filteredIssues = filterIssuesByType(day.productionIssues || []);
              const isToday = formatDate(new Date()) === formatDate(new Date(day.date));
              
              return (
                <div key={index} className={`calendar-day-card ${isToday ? 'today' : ''}`}>
                  {/* Day Header */}
                  <div className="day-header">
                    <div className="day-name">{day.dayName}</div>
                    <div className="day-date">{formatDisplayDate(day.date)}</div>
                    {filteredIssues.length > 0 && (
                      <span className="badge bg-danger ms-auto">{filteredIssues.length}</span>
                    )}
                  </div>

                  {/* Issues List */}
                  <div className="day-issues">
                    {filteredIssues.length === 0 ? (
                      <div className="no-issues">
                        <i className="bi bi-inbox text-muted"></i>
                        <p className="text-muted mb-0">İş bulunmamaktadır</p>
                      </div>
                    ) : (
                      filteredIssues.map((issue) => (
                        <div 
                          key={issue.issueId} 
                          className="issue-card"
                          style={{ borderLeftColor: getProductionTypeColor(issue.productionType) }}
                        >
                          {/* Issue Header */}
                          <div className="issue-header">
                            <span 
                              className="production-type-badge"
                              style={{ backgroundColor: getProductionTypeColor(issue.productionType) }}
                            >
                              {issue.productionType}
                            </span>
                            <span className={`badge ${getCompletionBadgeClass(issue.completionPercentage)}`}>
                              %{issue.completionPercentage}
                            </span>
                          </div>

                          {/* Issue Title */}
                          <h6 className="issue-title" title={issue.subject}>
                            {issue.subject}
                          </h6>

                          {/* Project Name */}
                          <div className="issue-project">
                            <i className="bi bi-folder me-1"></i>
                            {issue.projectName}
                          </div>

                          {/* Issue Meta */}
                          <div className="issue-meta">
                            <div className="meta-item">
                              <i className="bi bi-person"></i>
                              <span>{issue.assignedTo}</span>
                            </div>
                            {issue.estimatedHours && (
                              <div className="meta-item">
                                <i className="bi bi-clock"></i>
                                <span>{issue.estimatedHours}h</span>
                              </div>
                            )}
                          </div>

                          {/* Date Range */}
                          <div className="issue-dates">
                            <small className="text-muted">
                              <i className="bi bi-calendar-range me-1"></i>
                              {new Date(issue.plannedStartDate).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}
                              {' - '}
                              {new Date(issue.plannedEndDate).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}
                            </small>
                          </div>

                          {/* Status */}
                          <div className="issue-status">
                            <span className={`status-badge ${issue.isCompleted ? 'completed' : 'in-progress'}`}>
                              {issue.statusText}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && calendarData && calendarData.days?.every(d => d.productionIssues?.length === 0) && (
          <div className="text-center py-5">
            <i className="bi bi-inbox" style={{ fontSize: '4rem', color: '#ccc' }}></i>
            <h5 className="mt-3 text-muted">Bu hafta için üretim işi bulunmamaktadır</h5>
            <p className="text-muted">Farklı bir hafta seçebilir veya filtreleri değiştirebilirsiniz.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default WeeklyProductionCalendarPage;