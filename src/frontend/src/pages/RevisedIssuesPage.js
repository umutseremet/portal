// src/frontend/src/pages/RevisedIssuesPage.js
// ✅ Haftalık Revize Edilmiş İşler Listesi - Revize Düzenleme ve Atanan Kullanıcı Seçimi

import React, { useState, useEffect, useMemo } from 'react';
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
    const [assignedFilter, setAssignedFilter] = useState(''); // ✅ YENİ: Atanan filtresi
    const [searchTerm, setSearchTerm] = useState('');

    // ✅ REVİZE MODAL STATE'LERİ
    const [showRevisedModal, setShowRevisedModal] = useState(false);
    const [selectedIssueForRevise, setSelectedIssueForRevise] = useState(null);
    const [tempRevisedStartDate, setTempRevisedStartDate] = useState('');
    const [tempRevisedEndDate, setTempRevisedEndDate] = useState('');
    const [tempRevisedDescription, setTempRevisedDescription] = useState('');
    const [savingRevised, setSavingRevised] = useState(false);
    const [clearingRevised, setClearingRevised] = useState(false);

    // ✅ YENİ: ATANAN KULLANICI STATE'LERİ
    const [projectMembers, setProjectMembers] = useState([]);
    const [selectedAssignedUser, setSelectedAssignedUser] = useState('');
    const [loadingMembers, setLoadingMembers] = useState(false);

    // ✅ YENİ: Tüm atanan kullanıcılar listesi (filtre için)
    const [allAssignedUsers, setAllAssignedUsers] = useState([]);

    useEffect(() => {
        if (weekStart && weekEnd) {
            fetchRevisedIssues();
            fetchAssignedUsers(); // ✅ YENİ: Atanan kullanıcıları getir
        }
    }, [weekStart, weekEnd]);

    useEffect(() => {
        applyFilters();
    }, [dateFilter, projectFilter, typeFilter, statusFilter, assignedFilter, searchTerm, issues]);

    // ✅ YENİ: Atanan kullanıcıları getir
    const fetchAssignedUsers = async () => {
        try {
            console.log('🔍 Atanan kullanıcılar getiriliyor...', { weekStart, weekEnd });
            const users = await apiService.getRevisedIssuesAssignedUsers(weekStart, weekEnd);
            console.log('✅ Atanan kullanıcılar:', users);
            setAllAssignedUsers(users);
        } catch (err) {
            console.error('❌ Error fetching assigned users:', err);
            setAllAssignedUsers([]);
        }
    };

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
                            allIssues.push(issue);
                            seenIssueIds.add(issue.issueId);
                        }
                    });
                }
            }

            console.log('📋 Toplam revize edilmiş iş:', allIssues.length);
            setIssues(allIssues);
            setFilteredIssues(allIssues);
        } catch (err) {
            console.error('❌ Error fetching revised issues:', err);
            setError(err.message || 'Veriler yüklenirken hata oluştu');
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
                    const plannedStart = issue.plannedStartDate ? new Date(issue.plannedStartDate) : null;
                    const plannedEnd = issue.plannedEndDate ? new Date(issue.plannedEndDate) : null;

                    return (plannedStart && plannedStart >= start && plannedStart <= end) ||
                        (plannedEnd && plannedEnd >= start && plannedEnd <= end) ||
                        (plannedStart && plannedEnd && plannedStart <= start && plannedEnd >= end);
                } else if (dateFilter === 'revised') {
                    const revisedStart = issue.revisedPlannedStartDate ?
                        new Date(issue.revisedPlannedStartDate) : null;
                    const revisedEnd = issue.revisedPlannedEndDate ?
                        new Date(issue.revisedPlannedEndDate) : null;

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

        // ✅ YENİ: Atanan Filtresi
        if (assignedFilter) {
            filtered = filtered.filter(i => i.assignedTo === assignedFilter);
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

        console.log('🔍 Filtrelenmiş iş sayısı:', filtered.length);
        setFilteredIssues(filtered);
    };

    const handleOpenRevisedModal = async (issue) => {
        console.log('=== MODAL AÇILIYOR ===');
        console.log('Issue:', issue);

        setSelectedIssueForRevise(issue);
        setTempRevisedStartDate(issue.revisedPlannedStartDate || '');
        setTempRevisedEndDate(issue.revisedPlannedEndDate || '');
        setTempRevisedDescription(issue.revisedPlanDescription || '');
        setSelectedAssignedUser('');
        setShowRevisedModal(true);

        // ✅ PROJE ÜYELERİNİ GETİR
        if (issue.projectId) {
            console.log('Proje üyeleri getiriliyor...', issue.projectId);
            setLoadingMembers(true);
            try {
                const members = await apiService.getProjectMembers(issue.projectId);
                console.log('✅ Proje üyeleri:', members);
                setProjectMembers(members);
            } catch (error) {
                console.error('❌ Proje üyeleri yüklenirken hata:', error);
                alert('Proje üyeleri yüklenemedi.');
                setProjectMembers([]);
            } finally {
                setLoadingMembers(false);
            }
        } else {
            console.warn('⚠️ Issue.projectId bulunamadı!');
            setProjectMembers([]);
        }
    };

    const handleCloseRevisedModal = () => {
        setShowRevisedModal(false);
        setSelectedIssueForRevise(null);
        setTempRevisedStartDate('');
        setTempRevisedEndDate('');
        setTempRevisedDescription('');
        setSelectedAssignedUser('');
        setProjectMembers([]);
    };

    const handleSaveRevised = async () => {
        if (!selectedIssueForRevise) return;

        if (!tempRevisedStartDate && !tempRevisedEndDate) {
            alert('En az bir revize tarihi giriniz.');
            return;
        }

        if (tempRevisedStartDate && tempRevisedEndDate && tempRevisedStartDate > tempRevisedEndDate) {
            alert('Revize başlangıç tarihi, bitiş tarihinden sonra olamaz!');
            return;
        }

        setSavingRevised(true);

        try {
            const issue = selectedIssueForRevise;

            const requestData = {
                issueId: issue.issueId,
                revisedPlannedStartDate: tempRevisedStartDate,
                revisedPlannedEndDate: tempRevisedEndDate,
                revisedPlanDescription: tempRevisedDescription,
                assignedUserId: selectedAssignedUser ? parseInt(selectedAssignedUser) : null,
                updatedBy: 'User'
            };

            console.log('💾 Revize kaydediliyor:', requestData);

            const response = await apiService.updateIssueDates(requestData);

            if (response.success !== false) {
                // State güncelle
                setIssues(prevIssues =>
                    prevIssues.map(i =>
                        i.issueId === issue.issueId
                            ? {
                                ...i,
                                revisedPlannedStartDate: tempRevisedStartDate,
                                revisedPlannedEndDate: tempRevisedEndDate,
                                revisedPlanDescription: tempRevisedDescription,
                                assignedTo: selectedAssignedUser ?
                                    projectMembers.find(m => m.userId === parseInt(selectedAssignedUser))?.fullName || i.assignedTo
                                    : i.assignedTo
                            }
                            : i
                    )
                );

                // Atanan kullanıcılar listesini güncelle
                fetchAssignedUsers();

                setShowRevisedModal(false);
                alert('✅ Revize plan tarihleri güncellendi!');
            }
        } catch (error) {
            console.error('❌ Error updating revised dates:', error);
            alert('Revize tarihler güncellenirken hata oluştu: ' + (error.message || 'Bilinmeyen hata'));
        } finally {
            setSavingRevised(false);
        }
    };

    const handleClearRevisedDates = async () => {
        const confirmMessage =
            'Revize tarihler silinecek ve sistem planlanan tarihlere dönecek.\n\n' +
            'Devam etmek istiyor musunuz?';

        if (!window.confirm(confirmMessage)) {
            return;
        }

        setClearingRevised(true);

        try {
            const issue = selectedIssueForRevise;

            const existingDescription = issue.revisedPlanDescription || '';
            const clearMessage = `[${new Date().toLocaleDateString('tr-TR')}] Revize tarihler iptal edildi.`;
            const newDescription = existingDescription
                ? `${existingDescription}\n\n${clearMessage}`
                : clearMessage;

            const requestData = {
                issueId: issue.issueId,
                revisedPlannedStartDate: '',
                revisedPlannedEndDate: '',
                revisedPlanDescription: newDescription,
                updatedBy: 'User'
            };

            console.log('🗑️ Revize tarihler temizleniyor:', requestData);

            const response = await apiService.updateIssueDates(requestData);

            if (response.success !== false) {
                setIssues(prevIssues =>
                    prevIssues.map(i =>
                        i.issueId === issue.issueId
                            ? {
                                ...i,
                                revisedPlannedStartDate: null,
                                revisedPlannedEndDate: null,
                                revisedPlanDescription: newDescription
                            }
                            : i
                    )
                );

                setShowRevisedModal(false);
                alert('✅ Revize tarihler temizlendi!');
            }
        } catch (error) {
            console.error('❌ Error clearing revised dates:', error);
            alert('Revize tarihler temizlenirken hata oluştu.');
        } finally {
            setClearingRevised(false);
        }
    };

    const formatDate = (dateStr) => {
        if (!dateStr || dateStr.startsWith('0001-01-01')) return '-';
        const date = new Date(dateStr);
        return date.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    };

    const uniqueProjects = useMemo(() => {
        return [...new Map(issues.map(i => [i.projectId, {
            id: i.projectId,
            code: i.projectCode,
            name: i.projectName
        }])).values()];
    }, [issues]);

    const productionTypes = useMemo(() => {
        return [...new Set(issues.map(i =>
            i.trackerName?.replace('Üretim - ', '').trim()
        ).filter(Boolean))];
    }, [issues]);

    const statuses = useMemo(() => {
        return [...new Set(issues.map(i => i.statusName).filter(Boolean))];
    }, [issues]);

    if (!weekStart || !weekEnd) {
        return (
            <div className="container-fluid mt-4">
                <div className="alert alert-warning">
                    <i className="bi bi-exclamation-triangle me-2"></i>
                    Hafta bilgisi bulunamadı. Lütfen haftalık takvimden tekrar giriş yapın.
                </div>
            </div>
        );
    }

    return (
        <div className="revised-issues-container">
            {/* ✅ BAŞLIK GRADIENT - Haftalık Üretim Takvimi ile aynı */}
            <div className="calendar-header">
                <div className="d-flex justify-content-between align-items-center">
                    <div>
                        <h2 className="mb-1">
                            <i className="bi bi-calendar-check me-2"></i>
                            Revize Edilmiş İşler
                        </h2>
                        <p className="mb-0 text-white-50">
                            {new Date(weekStart).toLocaleDateString('tr-TR')} - {new Date(weekEnd).toLocaleDateString('tr-TR')}
                        </p>
                    </div>
                    <button className="btn btn-light" onClick={() => navigate('/production/weekly-calendar')}>
                        <i className="bi bi-arrow-left me-2"></i>
                        Haftalık Takvime Dön
                    </button>
                </div>
            </div>

            <div className="container-fluid mt-4">
                {loading && (
                    <div className="text-center my-5">
                        <div className="spinner-border text-primary" role="status">
                            <span className="visually-hidden">Yükleniyor...</span>
                        </div>
                        <p className="mt-2">Revize edilmiş işler getiriliyor...</p>
                    </div>
                )}

                {error && (
                    <div className="alert alert-danger">
                        <i className="bi bi-exclamation-triangle me-2"></i>
                        {error}
                    </div>
                )}

                {!loading && !error && (
                    <div className="card shadow-sm">
                        <div className="card-header bg-white">
                            <div className="row g-3">
                                <div className="col-md-2">
                                    <label className="form-label small fw-bold">Tarih Filtresi</label>
                                    <select
                                        className="form-select"
                                        value={dateFilter}
                                        onChange={(e) => setDateFilter(e.target.value)}
                                    >
                                        <option value="all">Tümü</option>
                                        <option value="planned">Planlanan Tarihler</option>
                                        <option value="revised">Revize Tarihler</option>
                                    </select>
                                </div>

                                <div className="col-md-2">
                                    <label className="form-label small fw-bold">Proje</label>
                                    <select
                                        className="form-select"
                                        value={projectFilter}
                                        onChange={(e) => setProjectFilter(e.target.value)}
                                    >
                                        <option value="">Tüm Projeler</option>
                                        {uniqueProjects.map(p => (
                                            <option key={p.id} value={p.id}>
                                                {p.code} - {p.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="col-md-2">
                                    <label className="form-label small fw-bold">Üretim Tipi</label>
                                    <select
                                        className="form-select"
                                        value={typeFilter}
                                        onChange={(e) => setTypeFilter(e.target.value)}
                                    >
                                        <option value="all">Tümü</option>
                                        {productionTypes.map(type => (
                                            <option key={type} value={type}>{type}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="col-md-2">
                                    <label className="form-label small fw-bold">Durum</label>
                                    <select
                                        className="form-select"
                                        value={statusFilter}
                                        onChange={(e) => setStatusFilter(e.target.value)}
                                    >
                                        <option value="all">Tümü</option>
                                        {statuses.map(status => (
                                            <option key={status} value={status}>{status}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* ✅ YENİ: ATANAN FİLTRESİ */}
                                <div className="col-md-2">
                                    <label className="form-label small fw-bold">Atanan</label>
                                    <select
                                        className="form-select"
                                        value={assignedFilter}
                                        onChange={(e) => setAssignedFilter(e.target.value)}
                                    >
                                        <option value="">Tümü</option>
                                        {allAssignedUsers.map(user => (
                                            <option key={user.id} value={user.fullName}>
                                                {user.fullName}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="col-md-2">
                                    <label className="form-label small fw-bold">Toplam</label>
                                    <div className="form-control-plaintext fw-bold text-primary">
                                        {filteredIssues.length} iş
                                    </div>
                                </div>
                            </div>

                            <div className="row mt-3">
                                <div className="col-md-12">
                                    <input
                                        type="text"
                                        className="form-control"
                                        placeholder="🔍 İş No, Konu, Proje veya Revize Açıklaması ile ara..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="card-body p-0">
                            <div className="table-responsive">
                                <table className="table table-hover mb-0">
                                    <thead className="table-light">
                                        <tr>
                                            <th style={{ width: '80px' }}>İş No</th>
                                            <th style={{ width: '150px' }}>Proje</th>
                                            <th>Konu</th>
                                            <th style={{ width: '100px' }}>Tip</th>
                                            <th style={{ width: '140px' }}>Planlanan</th>
                                            <th style={{ width: '140px' }}>Revize</th>
                                            <th style={{ width: '80px' }}>Fark</th>
                                            <th style={{ width: '80px' }}>%</th>
                                            <th style={{ width: '120px' }}>Atanan</th>
                                            <th style={{ width: '200px' }}>Revize Açıklama</th>
                                            <th style={{ width: '120px' }}>Durum</th>
                                            <th style={{ width: '100px' }}>İşlemler</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredIssues.length === 0 ? (
                                            <tr>
                                                <td colSpan="12" className="text-center text-muted py-4">
                                                    <i className="bi bi-inbox me-2"></i>
                                                    Revize edilmiş iş bulunamadı
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredIssues.map(issue => {
                                                const plannedEnd = issue.plannedEndDate ? new Date(issue.plannedEndDate) : null;
                                                const revisedEnd = issue.revisedPlannedEndDate ? new Date(issue.revisedPlannedEndDate) : null;

                                                let revisionDays = null;
                                                if (plannedEnd && revisedEnd) {
                                                    const diffTime = revisedEnd - plannedEnd;
                                                    revisionDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                                                }

                                                return (
                                                    <tr key={issue.issueId}>
                                                        <td>
                                                            <a
                                                                href={`${REDMINE_BASE_URL}/issues/${issue.issueId}`}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="text-decoration-none text-danger fw-bold"
                                                            >
                                                                #{issue.issueId}
                                                            </a>
                                                        </td>
                                                        <td>
                                                            <small className="text-muted">{issue.projectCode}</small>
                                                            <br />
                                                            <small>{issue.projectName}</small>
                                                        </td>
                                                        <td>
                                                            <small>{issue.subject}</small>
                                                        </td>
                                                        <td>
                                                            <span className="badge bg-secondary">
                                                                {issue.trackerName?.replace('Üretim - ', '')}
                                                            </span>
                                                        </td>
                                                        <td>
                                                            <small className="text-muted">
                                                                {formatDate(issue.plannedStartDate)}
                                                            </small>
                                                            <br />
                                                            <small className="fw-bold">
                                                                {formatDate(issue.plannedEndDate)}
                                                            </small>
                                                        </td>
                                                        <td>
                                                            <small className="text-warning fw-bold">
                                                                {formatDate(issue.revisedPlannedStartDate)}
                                                            </small>
                                                            <br />
                                                            <small className="text-warning fw-bold">
                                                                {formatDate(issue.revisedPlannedEndDate)}
                                                            </small>
                                                        </td>
                                                        <td className="text-center">
                                                            {revisionDays !== null && (
                                                                <span className={`badge ${revisionDays > 0 ? 'bg-danger' : revisionDays < 0 ? 'bg-success' : 'bg-secondary'}`}>
                                                                    {revisionDays > 0 ? `+${revisionDays}` : revisionDays} gün
                                                                </span>
                                                            )}
                                                        </td>
                                                        <td>
                                                            <div className="progress" style={{ height: '20px' }}>
                                                                <div
                                                                    className="progress-bar"
                                                                    role="progressbar"
                                                                    style={{ width: `${issue.completionPercentage}%` }}
                                                                >
                                                                    {issue.completionPercentage}%
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td>
                                                            <small>{issue.assignedTo}</small>
                                                        </td>
                                                        <td>
                                                            <div
                                                                className="revision-description"
                                                                title={issue.revisedPlanDescription}
                                                            >
                                                                {issue.revisedPlanDescription || '-'}
                                                            </div>
                                                        </td>
                                                        <td>
                                                            <span className={`badge ${issue.isClosed ? 'bg-success' : 'bg-warning'}`}>
                                                                {issue.statusName}
                                                            </span>
                                                        </td>
                                                        <td>
                                                            <button
                                                                className="btn btn-sm btn-outline-primary"
                                                                onClick={() => handleOpenRevisedModal(issue)}
                                                            >
                                                                <i className="bi bi-pencil me-1"></i>
                                                                Revize
                                                            </button>
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {/* ✅ REVİZE MODAL */}
                {showRevisedModal && selectedIssueForRevise && (
                    <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                        <div className="modal-dialog modal-lg">
                            <div className="modal-content">
                                <div className="modal-header bg-primary text-white">
                                    <h5 className="modal-title">
                                        <i className="bi bi-calendar-check me-2"></i>
                                        Revize Plan Tarihlerini Düzenle
                                    </h5>
                                    <button
                                        type="button"
                                        className="btn-close btn-close-white"
                                        onClick={handleCloseRevisedModal}
                                    ></button>
                                </div>
                                <div className="modal-body">
                                    <div className="alert alert-info">
                                        <strong>İş #{selectedIssueForRevise.issueId}:</strong> {selectedIssueForRevise.subject}
                                    </div>

                                    <div className="row mb-3">
                                        <div className="col-md-6">
                                            <label className="form-label fw-bold text-primary">
                                                <i className="bi bi-calendar-event me-1"></i>
                                                Revize Başlangıç Tarihi
                                            </label>
                                            <input
                                                type="date"
                                                className="form-control"
                                                value={tempRevisedStartDate}
                                                onChange={(e) => setTempRevisedStartDate(e.target.value)}
                                            />
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label fw-bold text-primary">
                                                <i className="bi bi-calendar-check me-1"></i>
                                                Revize Bitiş Tarihi
                                            </label>
                                            <input
                                                type="date"
                                                className="form-control"
                                                value={tempRevisedEndDate}
                                                onChange={(e) => setTempRevisedEndDate(e.target.value)}
                                            />
                                        </div>
                                    </div>

                                    {/* ✅ YENİ: ATANAN KULLANICI SEÇİMİ */}
                                    <div className="mb-3">
                                        <label className="form-label small fw-bold">
                                            <i className="bi bi-person-fill text-info me-1"></i>
                                            Atanan Kullanıcı
                                            {loadingMembers && <span className="spinner-border spinner-border-sm ms-2"></span>}
                                        </label>
                                        <select
                                            className="form-select"
                                            value={selectedAssignedUser}
                                            onChange={(e) => setSelectedAssignedUser(e.target.value)}
                                            disabled={loadingMembers || projectMembers.length === 0 || savingRevised || clearingRevised}
                                        >
                                            <option value="">Değişiklik yok ({selectedIssueForRevise.assignedTo})</option>
                                            {projectMembers.map(member => (
                                                <option key={member.userId} value={member.userId}>
                                                    {member.fullName}
                                                </option>
                                            ))}
                                        </select>
                                        {projectMembers.length === 0 && !loadingMembers && (
                                            <div className="form-text text-warning">
                                                <i className="bi bi-exclamation-triangle me-1"></i>
                                                Bu projeye yetkili kullanıcı bulunamadı
                                            </div>
                                        )}
                                    </div>

                                    <div className="mb-3">
                                        <label className="form-label fw-bold text-primary">
                                            <i className="bi bi-chat-text me-1"></i>
                                            Revize Açıklaması
                                        </label>
                                        <textarea
                                            className="form-control"
                                            rows="3"
                                            placeholder="Revize açıklaması girin..."
                                            value={tempRevisedDescription}
                                            onChange={(e) => setTempRevisedDescription(e.target.value)}
                                        ></textarea>
                                    </div>
                                </div>
                                <div className="modal-footer">
                                    <button
                                        type="button"
                                        className="btn btn-danger"
                                        onClick={handleClearRevisedDates}
                                        disabled={savingRevised || clearingRevised}
                                    >
                                        {clearingRevised ? (
                                            <>
                                                <span className="spinner-border spinner-border-sm me-2"></span>
                                                Temizleniyor...
                                            </>
                                        ) : (
                                            <>
                                                <i className="bi bi-trash me-2"></i>
                                                Revize Tarihlerini Temizle
                                            </>
                                        )}
                                    </button>
                                    <button
                                        type="button"
                                        className="btn btn-secondary"
                                        onClick={handleCloseRevisedModal}
                                        disabled={savingRevised || clearingRevised}
                                    >
                                        İptal
                                    </button>
                                    <button
                                        type="button"
                                        className="btn btn-primary"
                                        onClick={handleSaveRevised}
                                        disabled={savingRevised || clearingRevised}
                                    >
                                        {savingRevised ? (
                                            <>
                                                <span className="spinner-border spinner-border-sm me-2"></span>
                                                Kaydediliyor...
                                            </>
                                        ) : (
                                            <>
                                                <i className="bi bi-save me-2"></i>
                                                Kaydet
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default RevisedIssuesPage;