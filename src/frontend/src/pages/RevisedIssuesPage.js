// src/frontend/src/pages/RevisedIssuesPage.js
// ✅ Haftalık Revize Edilmiş İşler Listesi - Revize Düzenleme ve Atanan Kullanıcı Seçimi

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

    // ✅ YENİ: ATANAN KULLANICI STATE'LERİ
    const [projectMembers, setProjectMembers] = useState([]);
    const [selectedAssignedUser, setSelectedAssignedUser] = useState('');
    const [loadingMembers, setLoadingMembers] = useState(false);

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
                            allIssues.push(issue);
                            seenIssueIds.add(issue.issueId);
                        }
                    });
                }
            }

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

    // RevisedIssuesPage.js içindeki handleOpenRevisedModal metodunu BU ile değiştir:

    const handleOpenRevisedModal = async (issue) => {
        console.log('=== MODAL AÇILIYOR - DEBUG START ===');
        console.log('1. Issue objesi:', issue);
        console.log('2. Issue.projectId:', issue.projectId);
        console.log('3. Issue.trackerId:', issue.trackerId);
        console.log('4. apiService objesi:', apiService);
        console.log('5. apiService.getProjectMembers mevcut mu?', typeof apiService.getProjectMembers);

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
        setSelectedAssignedUser('');
        setShowRevisedModal(true);

        // ✅ PROJE ÜYELERİNİ YÜKLE
        console.log('6. ProjectId kontrolü:', issue.projectId ? 'VAR' : 'YOK');

        if (issue.projectId) {
            console.log('7. IF bloğuna GİRDİ - Proje üyeleri yüklenecek');
            console.log('8. ProjectId değeri:', issue.projectId);

            setLoadingMembers(true);

            try {
                console.log('9. TRY bloğuna girdi - API çağrısı yapılacak');
                console.log('10. Çağrılacak metod: apiService.getProjectMembers(' + issue.projectId + ')');

                const members = await apiService.getProjectMembers(issue.projectId);

                console.log('11. ✅ API çağrısı BAŞARILI - Gelen üyeler:', members);
                console.log('12. Üye sayısı:', members ? members.length : 0);

                setProjectMembers(members || []);
                console.log('13. State güncellendi - projectMembers set edildi');

            } catch (error) {
                console.error('14. ❌ HATA OLUŞTU - Catch bloğuna düştü');
                console.error('15. Hata detayı:', error);
                console.error('16. Hata mesajı:', error.message);
                console.error('17. Hata stack:', error.stack);

                setProjectMembers([]);
            } finally {
                console.log('18. Finally bloğu - Loading state kapatılıyor');
                setLoadingMembers(false);
            }
        } else {
            console.warn('19. ⚠️ IF bloğuna GİREMEDİ - ProjectId bulunamadı!');
            console.warn('20. Issue objesi:', issue);
            setProjectMembers([]);
        }

        console.log('=== MODAL AÇILIYOR - DEBUG END ===');
    };

    // ===================================
    // KULLANIM:
    // ===================================
    // 1. Bu kodu kopyala
    // 2. RevisedIssuesPage.js dosyasındaki handleOpenRevisedModal metodunu bununla değiştir
    // 3. Modal'ı aç
    // 4. Console'da tüm log'ları kontrol et
    // 5. Hangi adımda durduğunu bul

    // ✅ REVİZE TARİHLER KAYDETME - Atanan kullanıcı ile
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
        const hasAssignedChanged = selectedAssignedUser !== '';

        if (!hasStartChanged && !hasEndChanged && !hasDescChanged && !hasAssignedChanged) {
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
                assignedUserId: selectedAssignedUser ? parseInt(selectedAssignedUser) : null, // ✅ YENİ
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
                                revisedPlanDescription: tempRevisedDescription,
                                assignedTo: selectedAssignedUser ?
                                    projectMembers.find(m => m.userId === parseInt(selectedAssignedUser))?.fullName || i.assignedTo
                                    : i.assignedTo
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
        const revisedEnd = issue.revisedPlannedEndDate ?
            new Date(issue.revisedPlannedEndDate) : null;

        if (!plannedEnd || !revisedEnd) return null;

        const diffTime = revisedEnd - plannedEnd;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    };

    if (!weekStart || !weekEnd) {
        return (
            <div className="container-fluid py-4">
                <div className="alert alert-warning">
                    <i className="bi bi-exclamation-triangle me-2"></i>
                    Hafta bilgisi bulunamadı. Lütfen haftalık takvimden tekrar giriş yapın.
                </div>
                <button className="btn btn-primary" onClick={() => navigate('/production')}>
                    <i className="bi bi-arrow-left me-2"></i>
                    Haftalık Takvime Dön
                </button>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="container-fluid py-4">
                <div className="text-center py-5">
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Yükleniyor...</span>
                    </div>
                    <p className="mt-3 text-muted">Revize edilmiş işler yükleniyor...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="container-fluid py-4">
                <div className="alert alert-danger">
                    <i className="bi bi-exclamation-circle me-2"></i>
                    {error}
                </div>
                <button className="btn btn-primary" onClick={() => navigate('/production')}>
                    <i className="bi bi-arrow-left me-2"></i>
                    Haftalık Takvime Dön
                </button>
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
                                </div>

                                {/* Orijinal Tarihler (Readonly) */}
                                <div className="row mb-3">
                                    <div className="col-md-6">
                                        <label className="form-label small text-muted">
                                            <i className="bi bi-calendar me-1"></i>
                                            Orijinal Plan Başlangıç
                                        </label>
                                        <input
                                            type="text"
                                            className="form-control form-control-sm"
                                            value={formatDate(selectedIssueForRevise.plannedStartDate)}
                                            disabled
                                        />
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label small text-muted">
                                            <i className="bi bi-calendar me-1"></i>
                                            Orijinal Plan Bitiş
                                        </label>
                                        <input
                                            type="text"
                                            className="form-control form-control-sm"
                                            value={formatDate(selectedIssueForRevise.plannedEndDate)}
                                            disabled
                                        />
                                    </div>
                                </div>

                                <hr />

                                {/* Revize Tarihler */}
                                <div className="mb-3">
                                    <label className="form-label small fw-bold">
                                        <i className="bi bi-calendar-event text-primary me-1"></i>
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

                                {/* ✅ YENİ: Atanan Kullanıcı Seçimi */}
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

                                {/* Revize Açıklaması */}
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
            <div className="revised-issues-header mb-4">
                <div className="d-flex justify-content-between align-items-center">
                    <div>
                        <h2 className="mb-1">
                            <i className="bi bi-calendar-event me-2"></i>
                            Revize Edilmiş İşler
                        </h2>
                        <p className="mb-0 opacity-75">
                            {formatDateForDisplay(weekStart)} - {formatDateForDisplay(weekEnd)}
                        </p>
                    </div>
                    <button
                        className="btn btn-light"
                        onClick={() => navigate('/production')}
                    >
                        <i className="bi bi-arrow-left me-2"></i>
                        Haftalık Takvime Dön
                    </button>
                </div>
            </div>

            {/* İstatistikler */}
            <div className="row mb-4">
                <div className="col-md-3">
                    <div className="stats-card card text-center p-3">
                        <h3 className="mb-0 text-primary">{issues.length}</h3>
                        <small className="text-muted">Toplam Revize İş</small>
                    </div>
                </div>
                <div className="col-md-3">
                    <div className="stats-card card text-center p-3">
                        <h3 className="mb-0 text-success">
                            {issues.filter(i => i.isClosed).length}
                        </h3>
                        <small className="text-muted">Tamamlanan</small>
                    </div>
                </div>
                <div className="col-md-3">
                    <div className="stats-card card text-center p-3">
                        <h3 className="mb-0 text-warning">
                            {issues.filter(i => !i.isClosed).length}
                        </h3>
                        <small className="text-muted">Devam Eden</small>
                    </div>
                </div>
                <div className="col-md-3">
                    <div className="stats-card card text-center p-3">
                        <h3 className="mb-0 text-info">
                            {uniqueProjects.length}
                        </h3>
                        <small className="text-muted">Proje Sayısı</small>
                    </div>
                </div>
            </div>

            {/* Filtreler */}
            <div className="filter-card card mb-4">
                <div className="card-body">
                    <div className="row g-3">
                        <div className="col-md-3">
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

                        <div className="col-md-3">
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

                        <div className="col-md-2">
                            <label className="form-label small fw-bold">Arama</label>
                            <input
                                type="text"
                                className="form-control"
                                placeholder="İş No, Konu..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Tablo */}
            {filteredIssues.length === 0 ? (
                <div className="empty-state">
                    <i className="bi bi-inbox"></i>
                    <p className="text-muted mt-3">
                        {issues.length === 0
                            ? 'Bu hafta revize edilmiş iş bulunmuyor'
                            : 'Filtrelere uygun iş bulunamadı'}
                    </p>
                </div>
            ) : (
                <div className="card">
                    <div className="card-body p-0">
                        <div className="table-responsive">
                            <table className="table table-hover mb-0">
                                <thead className="table-light sticky-top">
                                    <tr>
                                        <th style={{ width: '80px' }}>İş No</th>
                                        <th>Proje</th>
                                        <th>Konu</th>
                                        <th style={{ width: '100px' }}>Tip</th>
                                        <th style={{ width: '120px' }}>Planlanan</th>
                                        <th style={{ width: '120px' }} className="table-warning">Revize</th>
                                        <th style={{ width: '80px' }}>Fark</th>
                                        <th style={{ width: '80px' }}>%</th>
                                        <th style={{ width: '120px' }}>Atanan</th>
                                        <th style={{ width: '250px' }}>Revize Açıklama</th>
                                        <th style={{ width: '100px' }}>Durum</th>
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
                                                        className="text-decoration-none"
                                                    >
                                                        #{issue.issueId}
                                                    </a>
                                                </td>
                                                <td>
                                                    <small className="text-muted">{issue.projectCode}</small>
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
                                                        {formatDate(issue.plannedStartDate)}<br />
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
                                                            {formatDate(issue.revisedPlannedStartDate)}<br />
                                                            {formatDate(issue.revisedPlannedEndDate)}
                                                        </small>
                                                    </div>
                                                </td>
                                                <td>
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
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RevisedIssuesPage;