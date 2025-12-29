// src/frontend/src/pages/RevisedIssuesPage.js
// ✅ Haftalık Revize Edilmiş İşler Listesi - Revize Düzenleme Özelliği Dahil

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

    // ✅ REVİZE MODAL STATE'LERİ
    const [showRevisedModal, setShowRevisedModal] = useState(false);
    const [selectedIssueForRevise, setSelectedIssueForRevise] = useState(null);
    const [tempRevisedStartDate, setTempRevisedStartDate] = useState('');
    const [tempRevisedEndDate, setTempRevisedEndDate] = useState('');
    const [tempRevisedDescription, setTempRevisedDescription] = useState('');
    const [savingRevised, setSavingRevised] = useState(false);
    const [clearingRevised, setClearingRevised] = useState(false);

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

    // ✅ REVİZE MODAL AÇMA
    const handleOpenRevisedModal = (issue) => {
        setSelectedIssueForRevise(issue);
        
        const startDate = issue.revisedPlannedStartDate;
        const endDate = issue.revisedPlannedEndDate;
        
        if (startDate && !startDate.startsWith('0001-01-01')) {
            setTempRevisedStartDate(formatDateForInput(startDate));
        } else {
            setTempRevisedStartDate(formatDateForInput(issue.plannedStartDate) || '');
        }
        
        if (endDate && !endDate.startsWith('0001-01-01')) {
            setTempRevisedEndDate(formatDateForInput(endDate));
        } else {
            setTempRevisedEndDate(formatDateForInput(issue.plannedEndDate) || '');
        }
        
        setTempRevisedDescription(issue.revisedPlanDescription || '');
        setShowRevisedModal(true);
    };

    // ✅ REVİZE TARİHLER KAYDETME
    const handleSaveRevisedDates = async () => {
        if (!tempRevisedStartDate || tempRevisedStartDate.trim() === '') {
            alert('Revize başlangıç tarihi boş olamaz!');
            return;
        }
        
        if (!tempRevisedEndDate || tempRevisedEndDate.trim() === '') {
            alert('Revize bitiş tarihi boş olamaz!');
            return;
        }
        
        if (!tempRevisedDescription || tempRevisedDescription.trim() === '') {
            alert('Revize açıklaması zorunludur!');
            return;
        }
        
        if (tempRevisedStartDate > tempRevisedEndDate) {
            alert('Revize başlangıç tarihi, bitiş tarihinden sonra olamaz!');
            return;
        }
        
        const issue = selectedIssueForRevise;
        const hasStartChanged = formatDateForInput(issue.revisedPlannedStartDate) !== tempRevisedStartDate;
        const hasEndChanged = formatDateForInput(issue.revisedPlannedEndDate) !== tempRevisedEndDate;
        const hasDescChanged = (issue.revisedPlanDescription || '') !== tempRevisedDescription;
        
        if (!hasStartChanged && !hasEndChanged && !hasDescChanged) {
            setShowRevisedModal(false);
            return;
        }

        setSavingRevised(true);

        try {
            const requestData = {
                issueId: issue.issueId,
                revisedPlannedStartDate: tempRevisedStartDate,
                revisedPlannedEndDate: tempRevisedEndDate,
                revisedPlanDescription: tempRevisedDescription,
                updatedBy: 'User'
            };

            const response = await apiService.updateIssueDates(requestData);

            if (response.success) {
                setIssues(prevIssues =>
                    prevIssues.map(i =>
                        i.issueId === issue.issueId
                            ? {
                                ...i,
                                revisedPlannedStartDate: tempRevisedStartDate,
                                revisedPlannedEndDate: tempRevisedEndDate,
                                revisedPlanDescription: tempRevisedDescription
                            }
                            : i
                    )
                );

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

    // ✅ REVİZE TARİHLER TEMİZLEME
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

            const response = await apiService.updateIssueDates(requestData);

            if (response.success) {
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
                alert('✅ Revize tarihler iptal edildi, sistem planlanan tarihlere döndü.');
            }
        } catch (error) {
            console.error('❌ Error clearing revised dates:', error);
            alert('Revize tarihler silinirken hata oluştu: ' + (error.message || 'Bilinmeyen hata'));
        } finally {
            setClearingRevised(false);
        }
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

    const formatDateForInput = (dateString) => {
        if (!dateString) return '';
        if (dateString.startsWith('0001-01-01')) return '';
        
        try {
            const date = new Date(dateString);
            const year = date.getFullYear();
            if (year < 1900) return '';
            
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        } catch (e) {
            return '';
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

        if (!plannedEnd || !revisedEnd || revisedEnd.getFullYear() < 1900) {
            return null;
        }

        const diffTime = revisedEnd - plannedEnd;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    };

    const getStatusBadgeClass = (status, isClosed) => {
        if (isClosed) return 'bg-success';
        
        const statusMap = {
            'Yeni': 'bg-primary',
            'İşleniyor': 'bg-info',
            'Çözüldü': 'bg-success',
            'Geri Bildirim': 'bg-warning',
            'Kapatıldı': 'bg-secondary',
            'Reddedildi': 'bg-danger'
        };
        
        return statusMap[status] || 'bg-secondary';
    };

    const handleBackToCalendar = () => {
        navigate('/calendar');
    };

    const resetFilters = () => {
        setDateFilter('all');
        setProjectFilter('');
        setTypeFilter('all');
        setStatusFilter('all');
        setSearchTerm('');
    };

    const hasActiveFilters = dateFilter !== 'all' || projectFilter || typeFilter !== 'all' || 
                             statusFilter !== 'all' || searchTerm;

    if (!weekStart || !weekEnd) {
        return (
            <div className="container-fluid py-4">
                <div className="alert alert-warning">
                    <i className="bi bi-exclamation-triangle me-2"></i>
                    Lütfen takvimden erişin.
                </div>
            </div>
        );
    }

    const uniqueProjects = [...new Map(issues.map(i => [i.projectId, { id: i.projectId, name: i.projectName, code: i.projectCode }])).values()];
    const productionTypes = [...new Set(issues.map(i => i.trackerName?.replace('Üretim - ', '').trim()).filter(Boolean))];
    const statuses = [...new Set(issues.map(i => i.statusName).filter(Boolean))];

    return (
        <div className="container-fluid py-4">
            {/* ✅ REVİZE MODAL */}
            {showRevisedModal && selectedIssueForRevise && (
                <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content">
                            <div className="modal-header bg-warning">
                                <h5 className="modal-title">
                                    <i className="bi bi-calendar-event me-2"></i>
                                    Revize Plan Tarihleri Güncelle
                                </h5>
                                <button
                                    type="button"
                                    className="btn-close"
                                    onClick={() => setShowRevisedModal(false)}
                                    disabled={savingRevised || clearingRevised}
                                ></button>
                            </div>
                            
                            <div className="modal-body">
                                {/* İş Bilgisi */}
                                <div className="alert alert-info small mb-3">
                                    <strong>#{selectedIssueForRevise.issueId}</strong> - {selectedIssueForRevise.subject}
                                    <div className="mt-2">
                                        <small className="text-muted">
                                            <i className="bi bi-calendar-check me-1"></i>
                                            Planlanan: {formatDate(selectedIssueForRevise.plannedStartDate)} → {formatDate(selectedIssueForRevise.plannedEndDate)}
                                        </small>
                                    </div>
                                </div>

                                {/* Mevcut Revize Durumu */}
                                {(selectedIssueForRevise.revisedPlannedStartDate || selectedIssueForRevise.revisedPlannedEndDate) && 
                                 !selectedIssueForRevise.revisedPlannedStartDate?.startsWith('0001-01-01') && (
                                    <div className="alert alert-warning small mb-3">
                                        <i className="bi bi-exclamation-triangle me-2"></i>
                                        <strong>Mevcut Revize:</strong>
                                        <div className="mt-1">
                                            {formatDate(selectedIssueForRevise.revisedPlannedStartDate)} → {formatDate(selectedIssueForRevise.revisedPlannedEndDate)}
                                        </div>
                                    </div>
                                )}

                                {/* Form Alanları */}
                                <div className="mb-3">
                                    <label className="form-label small fw-bold">
                                        <i className="bi bi-calendar-check me-1"></i>
                                        Revize Başlangıç Tarihi *
                                    </label>
                                    <input
                                        type="date"
                                        className="form-control"
                                        value={tempRevisedStartDate}
                                        onChange={(e) => setTempRevisedStartDate(e.target.value)}
                                        disabled={savingRevised || clearingRevised}
                                    />
                                </div>

                                <div className="mb-3">
                                    <label className="form-label small fw-bold">
                                        <i className="bi bi-calendar-x me-1"></i>
                                        Revize Bitiş Tarihi *
                                    </label>
                                    <input
                                        type="date"
                                        className="form-control"
                                        value={tempRevisedEndDate}
                                        onChange={(e) => setTempRevisedEndDate(e.target.value)}
                                        disabled={savingRevised || clearingRevised}
                                    />
                                </div>

                                <div className="mb-3">
                                    <label className="form-label small fw-bold">
                                        <i className="bi bi-chat-left-text me-1"></i>
                                        Revize Açıklaması *
                                    </label>
                                    <textarea
                                        className="form-control"
                                        rows="3"
                                        placeholder="Örn: 'Malzeme gecikmesi nedeniyle', 'Müşteri talebi üzerine' (Zorunlu)"
                                        value={tempRevisedDescription}
                                        onChange={(e) => setTempRevisedDescription(e.target.value)}
                                        disabled={savingRevised || clearingRevised}
                                    />
                                    <small className="text-muted">
                                        Örn: "Malzeme gecikmesi nedeniyle", "Müşteri talebi üzerine"
                                    </small>
                                </div>
                            </div>
                            
                            {/* Footer - 3 Buton */}
                            <div className="modal-footer">
                                <div className="d-flex justify-content-between w-100">
                                    {/* Sol: Revize İptal */}
                                    <div>
                                        {(selectedIssueForRevise.revisedPlannedStartDate || 
                                          selectedIssueForRevise.revisedPlannedEndDate) && 
                                         !selectedIssueForRevise.revisedPlannedStartDate?.startsWith('0001-01-01') && (
                                            <button
                                                type="button"
                                                className="btn btn-outline-danger"
                                                onClick={handleClearRevisedDates}
                                                disabled={savingRevised || clearingRevised}
                                                title="Revize tarihlerini iptal et ve planlanan tarihlere dön"
                                            >
                                                {clearingRevised ? (
                                                    <>
                                                        <span className="spinner-border spinner-border-sm me-2"></span>
                                                        İptal Ediliyor...
                                                    </>
                                                ) : (
                                                    <>
                                                        <i className="bi bi-x-circle me-2"></i>
                                                        Revize İptal Et
                                                    </>
                                                )}
                                            </button>
                                        )}
                                    </div>

                                    {/* Sağ: Vazgeç ve Kaydet */}
                                    <div className="d-flex gap-2">
                                        <button
                                            type="button"
                                            className="btn btn-secondary"
                                            onClick={() => setShowRevisedModal(false)}
                                            disabled={savingRevised || clearingRevised}
                                        >
                                            Vazgeç
                                        </button>
                                        <button
                                            type="button"
                                            className="btn btn-warning"
                                            onClick={handleSaveRevisedDates}
                                            disabled={savingRevised || clearingRevised}
                                        >
                                            {savingRevised ? (
                                                <>
                                                    <span className="spinner-border spinner-border-sm me-2"></span>
                                                    Kaydediliyor...
                                                </>
                                            ) : (
                                                <>
                                                    <i className="bi bi-check-lg me-2"></i>
                                                    Kaydet
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

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
                                Revize Edilmiş İşler
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
                                <option value="all">Tüm Revize İşler</option>
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
                                placeholder="İş no, konu, proje veya açıklama ile ara..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

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

            {/* Stats */}
            {!loading && !error && filteredIssues.length > 0 && (
                <div className="row g-3 mb-4">
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
                                                            <i className={`bi ${issue.isClosed ? 'bi-check-circle-fill text-success' : 'bi-hourglass-split text-warning'}`}></i>
                                                            <span>{issue.subject}</span>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <small className="badge bg-secondary">
                                                            {issue.trackerName?.replace('Üretim - ', '')}
                                                        </small>
                                                    </td>
                                                    <td>
                                                        <small className="text-muted">
                                                            {formatDate(issue.plannedStartDate)}<br/>
                                                            {formatDate(issue.plannedEndDate)}
                                                        </small>
                                                    </td>
                                                    <td 
                                                        className="cursor-pointer table-warning"
                                                        onClick={() => handleOpenRevisedModal(issue)}
                                                        title="Revize tarihleri düzenlemek için tıklayın"
                                                        style={{ cursor: 'pointer' }}
                                                    >
                                                        <div className="d-flex align-items-center gap-1">
                                                            <i className="bi bi-pencil-fill text-warning" style={{ fontSize: '0.75rem' }}></i>
                                                            <small className="fw-bold">
                                                                {formatDate(issue.revisedPlannedStartDate)}<br/>
                                                                {formatDate(issue.revisedPlannedEndDate)}
                                                            </small>
                                                        </div>
                                                    </td>
                                                    <td>
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