// src/frontend/src/pages/RevisedIssuesPage.js
// ✅ Haftalık Revize Edilmiş İşler Listesi

import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import apiService from '../services/api';
import './RevisedIssuesPage.css';
import { REDMINE_BASE_URL } from '../utils/constants';

const RevisedIssuesPage = () => {
    const location = useLocation();
    const navigate = useNavigate();

    const { weekStart, weekEnd } = location.state || {};

    const [issues, setIssues] = useState([]);
    const [filteredIssues, setFilteredIssues] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Filtreler
    const [dateFilter, setDateFilter] = useState('all'); // all, planned, revised
    const [projectFilter, setProjectFilter] = useState('');
    const [typeFilter, setTypeFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (weekStart && weekEnd) {
            fetchRevisedIssues();
        }
    }, [weekStart, weekEnd]);

    useEffect(() => {
        applyFilters();
    }, [dateFilter, projectFilter, typeFilter, statusFilter, searchTerm, issues]);

    const fetchRevisedIssues = async () => {
        setLoading(true);
        setError(null);

        try {
            const start = new Date(weekStart);
            const end = new Date(weekEnd);

            // Haftanın her günü için verileri topla
            const allIssues = [];
            const seenIssueIds = new Set();

            for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
                const formattedDate = date.toISOString().split('T')[0];
                const response = await apiService.getIssuesByDate(formattedDate);

                if (response.issues) {
                    response.issues.forEach(issue => {
                        // Sadece revize edilmiş işleri al ve tekrar etmesin
                        const hasRevised = (issue.revisedPlannedStartDate && 
                                          !issue.revisedPlannedStartDate.startsWith('0001-01-01')) ||
                                         (issue.revisedPlannedEndDate && 
                                          !issue.revisedPlannedEndDate.startsWith('0001-01-01'));

                        if (hasRevised && !seenIssueIds.has(issue.issueId)) {
                            seenIssueIds.add(issue.issueId);
                            allIssues.push(issue);
                        }
                    });
                }
            }

            console.log(`📋 Found ${allIssues.length} revised issues in the week`);
            setIssues(allIssues);
            setFilteredIssues(allIssues);
        } catch (err) {
            console.error('❌ Error fetching revised issues:', err);
            setError(err.message || 'Revize işler yüklenirken bir hata oluştu');
        } finally {
            setLoading(false);
        }
    };

    const applyFilters = () => {
        let filtered = [...issues];

        // Tarih Filtresi
        if (dateFilter !== 'all') {
            const start = new Date(weekStart);
            const end = new Date(weekEnd);

            filtered = filtered.filter(issue => {
                if (dateFilter === 'planned') {
                    // Planlanan tarihler hafta içinde
                    const plannedStart = issue.plannedStartDate ? new Date(issue.plannedStartDate) : null;
                    const plannedEnd = issue.plannedEndDate ? new Date(issue.plannedEndDate) : null;

                    return (plannedStart && plannedStart >= start && plannedStart <= end) ||
                           (plannedEnd && plannedEnd >= start && plannedEnd <= end) ||
                           (plannedStart && plannedEnd && plannedStart <= start && plannedEnd >= end);
                } else if (dateFilter === 'revised') {
                    // Revize tarihler hafta içinde
                    const revisedStart = issue.revisedPlannedStartDate ? new Date(issue.revisedPlannedStartDate) : null;
                    const revisedEnd = issue.revisedPlannedEndDate ? new Date(issue.revisedPlannedEndDate) : null;

                    return (revisedStart && revisedStart >= start && revisedStart <= end) ||
                           (revisedEnd && revisedEnd >= start && revisedEnd <= end) ||
                           (revisedStart && revisedEnd && revisedStart <= start && revisedEnd >= end);
                }
                return true;
            });
        }

        // Proje Filtresi
        if (projectFilter) {
            filtered = filtered.filter(i => i.projectId === parseInt(projectFilter));
        }

        // Tip Filtresi
        if (typeFilter !== 'all') {
            filtered = filtered.filter(i => 
                i.trackerName?.replace('Üretim - ', '').trim() === typeFilter
            );
        }

        // Durum Filtresi
        if (statusFilter !== 'all') {
            filtered = filtered.filter(i => i.statusName === statusFilter);
        }

        // Arama
        if (searchTerm) {
            const searchLower = searchTerm.toLowerCase();
            filtered = filtered.filter(issue =>
                issue.issueId?.toString().includes(searchLower) ||
                issue.subject?.toLowerCase().includes(searchLower) ||
                issue.projectName?.toLowerCase().includes(searchLower) ||
                issue.projectCode?.toLowerCase().includes(searchLower) ||
                issue.revisedPlanDescription?.toLowerCase().includes(searchLower)
            );
        }

        setFilteredIssues(filtered);
    };

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        if (dateString.startsWith('0001-01-01')) return '-';
        
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
        const plannedEnd = issue.plannedEndDate ? new Date(issue.plannedEndDate) : null;
        const revisedEnd = issue.revisedPlannedEndDate ? new Date(issue.revisedPlannedEndDate) : null;

        if (!plannedEnd || !revisedEnd) return null;

        const diffTime = revisedEnd - plannedEnd;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        return diffDays;
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
        setDateFilter('all');
        setProjectFilter('');
        setTypeFilter('all');
        setStatusFilter('all');
        setSearchTerm('');
    };

    const hasActiveFilters = dateFilter !== 'all' || projectFilter || 
                            typeFilter !== 'all' || statusFilter !== 'all' || searchTerm;

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

    const uniqueProjects = [...new Map(issues.map(i => [i.projectId, { id: i.projectId, name: i.projectName, code: i.projectCode }])).values()];
    const productionTypes = [...new Set(issues.map(i => i.trackerName?.replace('Üretim - ', '').trim()).filter(Boolean))];
    const statuses = [...new Set(issues.map(i => i.statusName).filter(Boolean))];

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
                                Plan Tarihi Revize Edilmiş İşler
                            </h4>
                            <p className="mb-0 opacity-75">
                                <i className="bi bi-calendar-range me-2"></i>
                                {formatDateForDisplay(weekStart)} - {formatDateForDisplay(weekEnd)}
                            </p>
                        </div>
                        <div className="d-flex gap-2">
                            <button
                                className="btn btn-light"
                                onClick={fetchRevisedIssues}
                                disabled={loading}
                            >
                                <i className="bi bi-arrow-clockwise me-2"></i>
                                Yenile
                            </button>
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
            </div>

            {/* Filters */}
            <div className="card mb-4">
                <div className="card-header bg-light">
                    <h6 className="mb-0">
                        <i className="bi bi-funnel me-2"></i>
                        Filtreler
                        {hasActiveFilters && (
                            <span className="badge bg-primary ms-2">{filteredIssues.length}/{issues.length}</span>
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
                                onChange={(e) => setDateFilter(e.target.value)}
                            >
                                <option value="all">Plan Tarihi Revize Edilen İşler</option>
                                <option value="planned">Planlanan Tarih Bu Hafta</option>
                                <option value="revised">Revize Tarih Bu Hafta</option>
                            </select>
                            <small className="text-muted">
                                {dateFilter === 'all' && 'Tüm revize edilmiş işler'}
                                {dateFilter === 'planned' && 'Orijinal planı bu haftada olanlar'}
                                {dateFilter === 'revised' && 'Revize tarihi bu haftada olanlar'}
                            </small>
                        </div>

                        {/* Proje Filtresi */}
                        <div className="col-md-3">
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
                                {uniqueProjects.map(project => (
                                    <option key={project.id} value={project.id}>
                                        {project.code} - {project.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Tip Filtresi */}
                        <div className="col-md-3">
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
                                {productionTypes.map((type, idx) => (
                                    <option key={idx} value={type}>{type}</option>
                                ))}
                            </select>
                        </div>

                        {/* Durum Filtresi */}
                        <div className="col-md-3">
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
                                {statuses.map((status, idx) => (
                                    <option key={idx} value={status}>{status}</option>
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

                        {hasActiveFilters && (
                            <div className="col-12">
                                <button className="btn btn-secondary btn-sm" onClick={resetFilters}>
                                    <i className="bi bi-x-circle me-1"></i>
                                    Filtreleri Temizle
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Statistics Cards */}
            {!loading && !error && filteredIssues.length > 0 && (
                <div className="row mb-4">
                    <div className="col-md-3">
                        <div className="card text-center">
                            <div className="card-body">
                                <h3 className="text-primary mb-2">{filteredIssues.length}</h3>
                                <p className="text-muted mb-0 small">Toplam Revize İş</p>
                            </div>
                        </div>
                    </div>
                    <div className="col-md-3">
                        <div className="card text-center">
                            <div className="card-body">
                                <h3 className="text-success mb-2">
                                    {filteredIssues.filter(i => i.isClosed).length}
                                </h3>
                                <p className="text-muted mb-0 small">Tamamlanan</p>
                            </div>
                        </div>
                    </div>
                    <div className="col-md-3">
                        <div className="card text-center">
                            <div className="card-body">
                                <h3 className="text-warning mb-2">
                                    {filteredIssues.filter(i => !i.isClosed).length}
                                </h3>
                                <p className="text-muted mb-0 small">Devam Eden</p>
                            </div>
                        </div>
                    </div>
                    <div className="col-md-3">
                        <div className="card text-center">
                            <div className="card-body">
                                <h3 className="text-info mb-2">
                                    {Math.round(
                                        filteredIssues.reduce((sum, issue) => {
                                            const days = getRevisionDays(issue);
                                            return sum + (days || 0);
                                        }, 0) / filteredIssues.length
                                    )}
                                </h3>
                                <p className="text-muted mb-0 small">Ort. Revize (Gün)</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Issues Table */}
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
                    ) : filteredIssues.length === 0 ? (
                        <div className="text-center py-5">
                            <i className="bi bi-inbox fs-1 text-muted"></i>
                            <p className="mt-3 text-muted">
                                {hasActiveFilters 
                                    ? 'Filtrelere uygun revize iş bulunamadı' 
                                    : 'Bu hafta revize edilmiş iş bulunamadı'}
                            </p>
                            {hasActiveFilters && (
                                <button className="btn btn-outline-secondary btn-sm mt-2" onClick={resetFilters}>
                                    <i className="bi bi-x-circle me-1"></i>
                                    Filtreleri Temizle
                                </button>
                            )}
                        </div>
                    ) : (
                        <>
                            <div className="alert alert-info mb-4">
                                <i className="bi bi-info-circle me-2"></i>
                                Bu liste, seçili hafta içinde planlanan veya revize edilmiş olan tüm işleri gösterir.
                                Tarih filtresini kullanarak sadece planlanan veya revize tarihleri bu haftada olan işleri görebilirsiniz.
                            </div>

                            <div className="table-responsive">
                                <table className="table table-hover">
                                    <thead className="table-light">
                                        <tr>
                                            <th style={{ width: '80px' }}>İş No</th>
                                            <th style={{ width: '150px' }}>Proje</th>
                                            <th>Konu</th>
                                            <th style={{ width: '100px' }}>Tip</th>
                                            <th style={{ width: '130px' }}>Planlanan</th>
                                            <th style={{ width: '130px' }}>Revize</th>
                                            <th style={{ width: '80px' }}>Fark</th>
                                            <th style={{ width: '250px' }}>Revize Açıklaması</th>
                                            <th style={{ width: '100px' }}>Durum</th>
                                            <th style={{ width: '80px' }}>İşlem</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredIssues.map(issue => {
                                            const revisionDays = getRevisionDays(issue);
                                            return (
                                                <tr key={issue.issueId}>
                                                    <td>
                                                        <a
                                                            href={`${REDMINE_BASE_URL}/issues/${issue.issueId}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-decoration-none fw-bold"
                                                        >
                                                            #{issue.issueId}
                                                        </a>
                                                    </td>
                                                    <td>
                                                        <small className="text-muted d-block">{issue.projectCode}</small>
                                                        <small>{issue.projectName?.substring(0, 20)}</small>
                                                    </td>
                                                    <td>
                                                        <div className="d-flex align-items-center gap-2">
                                                            <i className={`bi ${issue.isClosed ? 'bi-check-circle-fill text-success' : 'bi-circle text-warning'}`}></i>
                                                            <span title={issue.subject}>
                                                                {issue.subject?.length > 50 
                                                                    ? issue.subject.substring(0, 50) + '...' 
                                                                    : issue.subject}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <span className="badge bg-secondary">
                                                            {issue.trackerName?.replace('Üretim - ', '')}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <small className="d-block text-muted">
                                                            <i className="bi bi-calendar-check me-1"></i>
                                                            {formatDate(issue.plannedStartDate)}
                                                        </small>
                                                        <small className="d-block">
                                                            <i className="bi bi-calendar-x me-1"></i>
                                                            {formatDate(issue.plannedEndDate)}
                                                        </small>
                                                    </td>
                                                    <td className="table-warning">
                                                        <small className="d-block fw-bold">
                                                            <i className="bi bi-calendar-event me-1"></i>
                                                            {formatDate(issue.revisedPlannedStartDate)}
                                                        </small>
                                                        <small className="d-block fw-bold">
                                                            <i className="bi bi-calendar-event-fill me-1"></i>
                                                            {formatDate(issue.revisedPlannedEndDate)}
                                                        </small>
                                                    </td>
                                                    <td className="text-center">
                                                        {revisionDays !== null && (
                                                            <span className={`badge ${revisionDays > 0 ? 'bg-danger' : revisionDays < 0 ? 'bg-success' : 'bg-secondary'}`}>
                                                                {revisionDays > 0 ? '+' : ''}{revisionDays} gün
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td>
                                                        <small className="text-muted" title={issue.revisedPlanDescription}>
                                                            {issue.revisedPlanDescription?.length > 40
                                                                ? issue.revisedPlanDescription.substring(0, 40) + '...'
                                                                : issue.revisedPlanDescription || '-'}
                                                        </small>
                                                    </td>
                                                    <td>
                                                        <span className={`badge ${getStatusBadgeClass(issue.statusName, issue.isClosed)}`}>
                                                            {issue.statusName}
                                                        </span>
                                                    </td>
                                                    <td>
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
                            </div>

                            <div className="mt-3 text-muted small">
                                <i className="bi bi-info-circle me-1"></i>
                                {filteredIssues.length} iş gösteriliyor
                                {filteredIssues.length !== issues.length && ` (toplam ${issues.length} revize işten)`}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default RevisedIssuesPage;