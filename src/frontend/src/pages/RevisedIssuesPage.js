// src/frontend/src/pages/RevisedIssuesPage.js
// ✅ OPTİMİZE EDİLMİŞ VERSİYON - Backend Filtering

import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import apiService from '../services/api';
import './RevisedIssuesPage.css';
import { REDMINE_BASE_URL } from '../utils/constants';

const RevisedIssuesPage = () => {
    const location = useLocation();
    const navigate = useNavigate();

    const { weekStart, weekEnd } = location.state || {};

    // State
    const [issues, setIssues] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Filtreler
    const [dateFilter, setDateFilter] = useState('planned_this_week');
    const [projectFilter, setProjectFilter] = useState('');
    const [typeFilter, setTypeFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [customStartDate, setCustomStartDate] = useState('');
    const [customEndDate, setCustomEndDate] = useState('');

    // Dropdown seçenekleri
    const [availableProjects, setAvailableProjects] = useState([]);
    const [availableTypes, setAvailableTypes] = useState([]);
    const [availableStatuses, setAvailableStatuses] = useState([]);

    // İlk yükleme
    useEffect(() => {
        if (weekStart && weekEnd) {
            fetchRevisedIssues();
            fetchFilterOptions();
        }
    }, [weekStart, weekEnd]);

    // Filtreler değişince backend'den yeniden fetch
    useEffect(() => {
        if (!weekStart || !weekEnd) return;

        const timeoutId = setTimeout(() => {
            fetchRevisedIssues();
        }, searchTerm ? 500 : 0); // Search için 500ms debounce

        return () => clearTimeout(timeoutId);
    }, [dateFilter, projectFilter, typeFilter, statusFilter, searchTerm, customStartDate, customEndDate]);

    const fetchRevisedIssues = async () => {
        setLoading(true);
        setError(null);

        try {
            const filters = {
                startDate: weekStart.split('T')[0],
                endDate: weekEnd.split('T')[0],
                dateFilterType: dateFilter,
                customStartDate: dateFilter === 'custom_range' ? customStartDate : null,
                customEndDate: dateFilter === 'custom_range' ? customEndDate : null,
                projectId: projectFilter ? parseInt(projectFilter) : null,
                productionType: typeFilter !== 'all' ? typeFilter : null,
                statusName: statusFilter !== 'all' ? statusFilter : null,
                searchTerm: searchTerm || null
            };

            console.log('📡 Fetching revised issues with filters:', filters);

            const response = await apiService.getRevisedIssues(filters);

            console.log(`✅ Received ${response.totalCount} revised issues`);
            setIssues(response.issues || []);
        } catch (err) {
            console.error('❌ Error fetching revised issues:', err);
            setError(err.message || 'Revize işler yüklenirken bir hata oluştu');
        } finally {
            setLoading(false);
        }
    };

    const fetchFilterOptions = async () => {
        try {
            const response = await apiService.getRevisedIssues({
                startDate: weekStart.split('T')[0],
                endDate: weekEnd.split('T')[0],
                dateFilterType: 'all'
            });

            const allIssues = response.issues || [];

            const projects = [...new Map(
                allIssues.map(i => [i.projectId, { 
                    id: i.projectId, 
                    name: i.projectName, 
                    code: i.projectCode 
                }])
            ).values()];

            const types = [...new Set(
                allIssues.map(i => i.trackerName?.replace('Üretim - ', '').trim()).filter(Boolean)
            )];

            const statuses = [...new Set(
                allIssues.map(i => i.statusName).filter(Boolean)
            )];

            setAvailableProjects(projects);
            setAvailableTypes(types);
            setAvailableStatuses(statuses);
        } catch (err) {
            console.error('❌ Error fetching filter options:', err);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString || dateString.startsWith('0001-01-01')) return '-';
        
        try {
            const [year, month, day] = dateString.split('T')[0].split('-');
            if (parseInt(year) < 1900) return '-';
            return `${day}.${month}.${year}`;
        } catch (e) {
            return '-';
        }
    };

    const formatDateForDisplay = (dateString) => {
        if (!dateString) return '-';
        
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('tr-TR', {
                day: '2-digit',
                month: 'long',
                year: 'numeric'
            });
        } catch (e) {
            return '-';
        }
    };

    const getRevisionDays = (issue) => {
        const plannedEndStr = issue.plannedEndDate ? issue.plannedEndDate.split('T')[0] : null;
        const revisedEndStr = issue.revisedPlannedEndDate ? issue.revisedPlannedEndDate.split('T')[0] : null;

        if (!plannedEndStr || !revisedEndStr) return null;

        const plannedEnd = new Date(plannedEndStr);
        const revisedEnd = new Date(revisedEndStr);
        const diffTime = revisedEnd - plannedEnd;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        return diffDays;
    };

    const checkIfIssueOverdue = (issue) => {
        if (issue.isClosed) return false;

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const effectiveEndDateStr = issue.revisedPlannedEndDate && 
                                    !issue.revisedPlannedEndDate.startsWith('0001-01-01')
            ? issue.revisedPlannedEndDate.split('T')[0]
            : issue.plannedEndDate ? issue.plannedEndDate.split('T')[0] : null;

        if (!effectiveEndDateStr) return false;

        const effectiveEndDate = new Date(effectiveEndDateStr);
        return effectiveEndDate < today;
    };

    const getStatusBadgeClass = (statusName, isClosed) => {
        if (isClosed) return 'bg-success';
        if (statusName?.includes('İptal')) return 'bg-danger';
        if (statusName?.includes('Bekliyor')) return 'bg-warning';
        return 'bg-info';
    };

    const handleBackToCalendar = () => {
        navigate('/production/weekly-calendar', {
            state: { currentWeek: weekStart }
        });
    };

    const resetFilters = () => {
        setDateFilter('planned_this_week');
        setProjectFilter('');
        setTypeFilter('all');
        setStatusFilter('all');
        setSearchTerm('');
        setCustomStartDate('');
        setCustomEndDate('');
    };

    const hasActiveFilters = dateFilter !== 'planned_this_week' || projectFilter || 
                            typeFilter !== 'all' || statusFilter !== 'all' || searchTerm ||
                            customStartDate || customEndDate;

    if (!weekStart || !weekEnd) {
        return (
            <div className="container-fluid py-4">
                <div className="alert alert-warning">
                    <i className="bi bi-exclamation-triangle me-2"></i>
                    Hafta bilgisi bulunamadı. Lütfen takvimden erişin.
                </div>
            </div>
        );
    }

    return (
        <div className="container-fluid py-4">
            {/* Header */}
            <div className="card mb-4" style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                border: 'none'
            }}>
                <div className="card-body">
                    <div className="d-flex justify-content-between align-items-center flex-wrap">
                        <div className="mb-2 mb-md-0">
                            <h4 className="mb-2">
                                <i className="bi bi-arrow-repeat me-2"></i>
                                Planı Revize Edilmiş İşler
                            </h4>
                            <p className="mb-0 opacity-75">
                                <i className="bi bi-calendar-range me-2"></i>
                                {formatDateForDisplay(weekStart)} - {formatDateForDisplay(weekEnd)}
                            </p>
                        </div>
                        <div className="d-flex gap-2">
                            <button className="btn btn-light" onClick={fetchRevisedIssues} disabled={loading}>
                                <i className="bi bi-arrow-clockwise me-2"></i>
                                Yenile
                            </button>
                            <button className="btn btn-light" onClick={handleBackToCalendar}>
                                <i className="bi bi-arrow-left me-2"></i>
                                Takvime Dön
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="card mb-4">
                <div className="card-header bg-light">
                    <h6 className="mb-0">
                        <i className="bi bi-funnel me-2"></i>
                        Filtreler
                        {hasActiveFilters && (
                            <span className="badge bg-primary ms-2">{issues.length} sonuç</span>
                        )}
                    </h6>
                </div>
                <div className="card-body">
                    <div className="row g-3">
                        {/* Tarih Filtresi */}
                        <div className="col-md-3">
                            <label className="form-label small fw-bold">
                                <i className="bi bi-calendar-event me-1"></i>
                                Tarih Filtresi
                            </label>
                            <select
                                className="form-select form-select-sm"
                                value={dateFilter}
                                onChange={(e) => {
                                    setDateFilter(e.target.value);
                                    if (e.target.value !== 'custom_range') {
                                        setCustomStartDate('');
                                        setCustomEndDate('');
                                    }
                                }}
                            >
                                <option value="all">Tüm Revize İşler</option>
                                <option value="planned_this_week">İlk Planı Bu Hafta Olanlar</option>
                                <option value="revised_this_week">Revize Tarihi Bu Hafta Olanlar</option>
                                <option value="custom_range">Manuel Tarih Aralığı</option>
                            </select>
                            <small className="text-muted">
                                {dateFilter === 'all' && 'Tüm revize edilmiş işler'}
                                {dateFilter === 'planned_this_week' && 'Orijinal planı bu haftada olan revize işler'}
                                {dateFilter === 'revised_this_week' && 'Revize sonrası tarihi bu haftada olan işler'}
                                {dateFilter === 'custom_range' && 'Özel tarih aralığı seçin'}
                            </small>
                        </div>

                        {/* Manuel Tarih Aralığı */}
                        {dateFilter === 'custom_range' && (
                            <>
                                <div className="col-md-2">
                                    <label className="form-label small fw-bold">
                                        <i className="bi bi-calendar-check me-1"></i>
                                        Başlangıç
                                    </label>
                                    <input
                                        type="date"
                                        className="form-control form-control-sm"
                                        value={customStartDate}
                                        onChange={(e) => setCustomStartDate(e.target.value)}
                                    />
                                </div>
                                <div className="col-md-2">
                                    <label className="form-label small fw-bold">
                                        <i className="bi bi-calendar-x me-1"></i>
                                        Bitiş
                                    </label>
                                    <input
                                        type="date"
                                        className="form-control form-control-sm"
                                        value={customEndDate}
                                        onChange={(e) => setCustomEndDate(e.target.value)}
                                        min={customStartDate}
                                    />
                                </div>
                            </>
                        )}

                        {/* Proje */}
                        <div className={dateFilter === 'custom_range' ? 'col-md-2' : 'col-md-3'}>
                            <label className="form-label small fw-bold">
                                <i className="bi bi-folder me-1"></i>
                                Proje
                            </label>
                            <select
                                className="form-select form-select-sm"
                                value={projectFilter}
                                onChange={(e) => setProjectFilter(e.target.value)}
                            >
                                <option value="">Tüm Projeler</option>
                                {availableProjects.map(proj => (
                                    <option key={proj.id} value={proj.id}>
                                        {proj.code ? `${proj.code} - ${proj.name}` : proj.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Üretim Tipi */}
                        <div className={dateFilter === 'custom_range' ? 'col-md-2' : 'col-md-3'}>
                            <label className="form-label small fw-bold">
                                <i className="bi bi-gear me-1"></i>
                                Üretim Tipi
                            </label>
                            <select
                                className="form-select form-select-sm"
                                value={typeFilter}
                                onChange={(e) => setTypeFilter(e.target.value)}
                            >
                                <option value="all">Tüm Tipler</option>
                                {availableTypes.map(type => (
                                    <option key={type} value={type}>{type}</option>
                                ))}
                            </select>
                        </div>

                        {/* Durum */}
                        <div className={dateFilter === 'custom_range' ? 'col-md-1' : 'col-md-3'}>
                            <label className="form-label small fw-bold">
                                <i className="bi bi-flag me-1"></i>
                                Durum
                            </label>
                            <select
                                className="form-select form-select-sm"
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                            >
                                <option value="all">Tüm Durumlar</option>
                                {availableStatuses.map(status => (
                                    <option key={status} value={status}>{status}</option>
                                ))}
                            </select>
                        </div>

                        {/* Arama */}
                        <div className="col-12">
                            <label className="form-label small fw-bold">
                                <i className="bi bi-search me-1"></i>
                                Arama
                            </label>
                            <input
                                type="text"
                                className="form-control form-control-sm"
                                placeholder="İş No, Konu, Proje, Açıklama..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        {/* Temizle */}
                        {hasActiveFilters && (
                            <div className="col-12">
                                <button className="btn btn-outline-secondary btn-sm" onClick={resetFilters}>
                                    <i className="bi bi-x-circle me-1"></i>
                                    Filtreleri Temizle
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Statistics */}
            {!loading && !error && issues.length > 0 && (
                <div className="row g-3 mb-4">
                    <div className="col-md-3">
                        <div className="card text-center">
                            <div className="card-body">
                                <h3 className="text-primary mb-2">{issues.length}</h3>
                                <p className="text-muted mb-0 small">Toplam Revize İş</p>
                            </div>
                        </div>
                    </div>
                    <div className="col-md-3">
                        <div className="card text-center">
                            <div className="card-body">
                                <h3 className="text-success mb-2">
                                    {issues.filter(i => i.isClosed).length}
                                </h3>
                                <p className="text-muted mb-0 small">Tamamlanan</p>
                            </div>
                        </div>
                    </div>
                    <div className="col-md-3">
                        <div className="card text-center">
                            <div className="card-body">
                                <h3 className="text-warning mb-2">
                                    {issues.filter(i => !i.isClosed).length}
                                </h3>
                                <p className="text-muted mb-0 small">Devam Eden</p>
                            </div>
                        </div>
                    </div>
                    <div className="col-md-3">
                        <div className="card text-center">
                            <div className="card-body">
                                <h3 className="text-info mb-2">
                                    {issues.length > 0 ? Math.round(
                                        issues.reduce((sum, issue) => {
                                            const days = getRevisionDays(issue);
                                            return sum + (days || 0);
                                        }, 0) / issues.length
                                    ) : 0}
                                </h3>
                                <p className="text-muted mb-0 small">Ort. Revize (Gün)</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Table */}
            <div className="card">
                <div className="card-body">
                    {loading ? (
                        <div className="text-center py-5">
                            <div className="spinner-border text-primary" role="status">
                                <span className="visually-hidden">Yükleniyor...</span>
                            </div>
                            <p className="mt-3 text-muted">Revize işler yükleniyor...</p>
                        </div>
                    ) : error ? (
                        <div className="alert alert-danger">
                            <i className="bi bi-exclamation-triangle me-2"></i>
                            {error}
                        </div>
                    ) : issues.length === 0 ? (
                        <div className="text-center py-5">
                            <i className="bi bi-inbox fs-1 text-muted"></i>
                            <p className="mt-3 text-muted">
                                {hasActiveFilters ? 'Filtrelere uygun revize iş bulunamadı' : 'Bu hafta revize edilmiş iş bulunamadı'}
                            </p>
                            {hasActiveFilters && (
                                <button className="btn btn-outline-secondary btn-sm mt-2" onClick={resetFilters}>
                                    <i className="bi bi-x-circle me-1"></i>
                                    Filtreleri Temizle
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="table-responsive">
                            <table className="table table-hover table-sm">
                                <thead className="table-light sticky-top">
                                    <tr>
                                        <th style={{ width: '60px' }}>İş No</th>
                                        <th style={{ width: '150px' }}>Proje</th>
                                        <th>Konu</th>
                                        <th style={{ width: '100px' }}>Tip</th>
                                        <th style={{ width: '120px' }}>
                                            <i className="bi bi-calendar-check text-primary me-1"></i>
                                            Planlanan
                                            <div className="small fw-normal text-muted" style={{ fontSize: '0.7rem' }}>
                                                (Başlangıç / Bitiş)
                                            </div>
                                        </th>
                                        <th style={{ width: '160px' }} className="table-warning">
                                            <i className="bi bi-calendar-event text-warning me-1"></i>
                                            Revize Tarihler
                                            <div className="small fw-normal text-muted" style={{ fontSize: '0.7rem' }}>
                                                (Başlangıç / Bitiş)
                                            </div>
                                        </th>
                                        <th style={{ width: '80px' }}>Fark</th>
                                        <th style={{ width: '200px' }}>Revize Açıklaması</th>
                                        <th style={{ width: '100px' }}>Durum</th>
                                        <th style={{ width: '80px' }}>İlerleme</th>
                                        <th style={{ width: '60px' }}>İşlem</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {issues.map((issue) => {
                                        const isOverdue = checkIfIssueOverdue(issue);
                                        const revisionDays = getRevisionDays(issue);
                                        
                                        return (
                                            <tr key={issue.issueId} className={isOverdue && !issue.isClosed ? 'table-danger' : ''}>
                                                <td>
                                                    <a
                                                        href={`${REDMINE_BASE_URL}/issues/${issue.issueId}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-decoration-none fw-bold"
                                                        style={{ color: '#FF6B6B' }}
                                                    >
                                                        #{issue.issueId}
                                                    </a>
                                                </td>
                                                <td className="small">
                                                    <div className="fw-bold">{issue.projectCode || issue.projectName}</div>
                                                    {issue.projectCode && (
                                                        <div className="text-muted" style={{ fontSize: '0.7rem' }}>
                                                            {issue.projectName}
                                                        </div>
                                                    )}
                                                </td>
                                                <td>
                                                    <div className="text-truncate" style={{ maxWidth: '250px' }} title={issue.subject}>
                                                        {issue.subject}
                                                    </div>
                                                </td>
                                                <td className="small">
                                                    <span className="badge bg-secondary">
                                                        {issue.trackerName?.replace('Üretim - ', '')}
                                                    </span>
                                                </td>
                                                <td className="text-center small">
                                                    <div className="text-primary">
                                                        <i className="bi bi-calendar-check me-1"></i>
                                                        {formatDate(issue.plannedStartDate)}
                                                    </div>
                                                    <div className="text-danger mt-1">
                                                        <i className="bi bi-calendar-x me-1"></i>
                                                        {formatDate(issue.plannedEndDate)}
                                                    </div>
                                                </td>
                                                <td className="text-center small table-warning">
                                                    <div className="text-success fw-bold">
                                                        <i className="bi bi-calendar-event me-1"></i>
                                                        {formatDate(issue.revisedPlannedStartDate)}
                                                    </div>
                                                    <div className="text-danger fw-bold mt-1">
                                                        <i className="bi bi-calendar-event-fill me-1"></i>
                                                        {formatDate(issue.revisedPlannedEndDate)}
                                                    </div>
                                                </td>
                                                <td className="text-center">
                                                    {revisionDays !== null && (
                                                        <span className={`badge ${
                                                            revisionDays > 0 ? 'bg-danger' : 
                                                            revisionDays < 0 ? 'bg-success' : 'bg-secondary'
                                                        }`}>
                                                            {revisionDays > 0 ? '+' : ''}{revisionDays} gün
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="small">
                                                    <div className="text-truncate" style={{ maxWidth: '180px' }} title={issue.revisedPlanDescription || '-'}>
                                                        {issue.revisedPlanDescription || '-'}
                                                    </div>
                                                </td>
                                                <td className="text-center">
                                                    <span className={`badge ${getStatusBadgeClass(issue.statusName, issue.isClosed)}`}>
                                                        {issue.statusName}
                                                    </span>
                                                </td>
                                                <td className="text-center">
                                                    <div className="small text-muted">{issue.completionPercentage}%</div>
                                                    <div className="progress" style={{ height: '4px' }}>
                                                        <div
                                                            className="progress-bar bg-success"
                                                            style={{ width: `${issue.completionPercentage}%` }}
                                                        ></div>
                                                    </div>
                                                </td>
                                                <td className="text-center">
                                                    <a
                                                        href={`${REDMINE_BASE_URL}/issues/${issue.issueId}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="btn btn-sm btn-outline-primary"
                                                        title="Redmine'da Aç"
                                                    >
                                                        <i className="bi bi-box-arrow-up-right"></i>
                                                    </a>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                            <div className="text-muted small mt-3">
                                <i className="bi bi-info-circle me-1"></i>
                                {issues.length} iş gösteriliyor (Backend'de filtrelenmiş)
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default RevisedIssuesPage;