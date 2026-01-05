// src/frontend/src/pages/IssueDetailsPage.js
// ✅ COMPLETE VERSION - Grup Parça Adeti Kolonu ile

import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import apiService from '../services/api';
import './IssueDetailsPage.css';
import { REDMINE_BASE_URL } from '../utils/constants';

const IssueDetailsPage = () => {
    const location = useLocation();
    const navigate = useNavigate();

    const { selectedDate, selectedGroup, currentWeek } = location.state || {};

    const [issues, setIssues] = useState([]);
    const [filteredIssues, setFilteredIssues] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [showFilters, setShowFilters] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    // INLINE TARİH DÜZENLEME STATE'LERİ
    const [editingDateCell, setEditingDateCell] = useState(null);
    const [tempDate, setTempDate] = useState('');
    const [savingDate, setSavingDate] = useState(false);

    // REVİZE PLAN TARİHLERİ STATE'LERİ
    const [showRevisedModal, setShowRevisedModal] = useState(false);
    const [selectedIssueForRevise, setSelectedIssueForRevise] = useState(null);
    const [tempRevisedStartDate, setTempRevisedStartDate] = useState('');
    const [tempRevisedEndDate, setTempRevisedEndDate] = useState('');
    const [tempRevisedDescription, setTempRevisedDescription] = useState('');
    const [savingRevised, setSavingRevised] = useState(false);
    const [clearingRevised, setClearingRevised] = useState(false);

    const [filters, setFilters] = useState({
        projectId: '',
        productionType: 'all',
        status: 'all',
        assignedTo: ''
    });

    // PAGINATION
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 50;

    useEffect(() => {
        if (selectedDate) {
            fetchIssueDetails();
        }
    }, [selectedDate, selectedGroup]);

    useEffect(() => {
        applyFilters();
    }, [filters, issues]);

    useEffect(() => {
        if (!searchTerm) {
            applyFilters();
            return;
        }

        let filtered = [...issues];

        if (filters.projectId) {
            filtered = filtered.filter(i => i.projectId === parseInt(filters.projectId));
        }
        if (filters.productionType !== 'all') {
            filtered = filtered.filter(i =>
                i.trackerName?.replace('Üretim - ', '').trim() === filters.productionType
            );
        }
        if (filters.status !== 'all') {
            filtered = filtered.filter(i => i.statusName === filters.status);
        }
        if (filters.assignedTo) {
            filtered = filtered.filter(i => i.assignedTo === filters.assignedTo);
        }

        const searchLower = searchTerm.toLowerCase();
        filtered = filtered.filter(issue => {
            return (
                issue.issueId?.toString().includes(searchLower) ||
                issue.subject?.toLowerCase().includes(searchLower) ||
                issue.projectName?.toLowerCase().includes(searchLower) ||
                issue.projectCode?.toLowerCase().includes(searchLower)
            );
        });

        setFilteredIssues(filtered);
    }, [searchTerm, filters, issues]);

    const applyFilters = () => {
        let filtered = [...issues];

        if (filters.projectId) {
            filtered = filtered.filter(i => i.projectId === parseInt(filters.projectId));
        }

        if (filters.productionType !== 'all') {
            filtered = filtered.filter(i =>
                i.trackerName?.replace('Üretim - ', '').trim() === filters.productionType
            );
        }

        if (filters.status !== 'all') {
            filtered = filtered.filter(i => i.statusName === filters.status);
        }

        if (filters.assignedTo) {
            filtered = filtered.filter(i => i.assignedTo === filters.assignedTo);
        }

        setFilteredIssues(filtered);
    };

    const fetchIssueDetails = async () => {
        setLoading(true);
        setError(null);

        try {
            let formattedDate = selectedDate;

            if (selectedDate instanceof Date) {
                const year = selectedDate.getFullYear();
                const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
                const day = String(selectedDate.getDate()).padStart(2, '0');
                formattedDate = `${year}-${month}-${day}`;
            } else if (typeof selectedDate === 'string' && selectedDate.includes('T')) {
                formattedDate = selectedDate.split('T')[0];
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

    // PLANLANAN TARİH KAYDETME
    const handleSaveDate = async (issue, field) => {
        if (!tempDate || tempDate.trim() === '') {
            setEditingDateCell(null);
            return;
        }

        const originalDate = formatDateForInput(issue[field]);
        if (tempDate === originalDate) {
            setEditingDateCell(null);
            return;
        }

        const otherField = field === 'plannedStartDate' ? 'plannedEndDate' : 'plannedStartDate';
        const otherDate = issue[otherField];

        if (otherDate) {
            const otherDateFormatted = formatDateForInput(otherDate);

            if (field === 'plannedStartDate' && tempDate > otherDateFormatted) {
                alert('Başlangıç tarihi, bitiş tarihinden sonra olamaz!');
                setEditingDateCell(null);
                return;
            }

            if (field === 'plannedEndDate' && tempDate < otherDateFormatted) {
                alert('Bitiş tarihi, başlangıç tarihinden önce olamaz!');
                setEditingDateCell(null);
                return;
            }
        }

        setSavingDate(true);

        try {
            const requestData = {
                issueId: issue.issueId,
                plannedStartDate: field === 'plannedStartDate' ? tempDate : null,
                plannedEndDate: field === 'plannedEndDate' ? tempDate : null,
                updatedBy: 'User'
            };

            const response = await apiService.updateIssueDates(requestData);

            if (response.success) {
                setIssues(prevIssues =>
                    prevIssues.map(i =>
                        i.issueId === issue.issueId
                            ? { ...i, [field]: tempDate }
                            : i
                    )
                );

                showSuccessFeedback('Planlanan tarih güncellendi!');
            } else {
                alert(response.message || 'Güncelleme başarısız');
            }
        } catch (error) {
            console.error('❌ Tarih güncelleme hatası:', error);
            alert('Tarih güncellenirken hata oluştu: ' + error.message);
        } finally {
            setSavingDate(false);
            setEditingDateCell(null);
            setTempDate('');
        }
    };

    // REVİZE PLAN TARİHLERİ KAYDETME
    const handleSaveRevisedDates = async () => {
        if (!selectedIssueForRevise) return;

        if (tempRevisedStartDate && tempRevisedEndDate && tempRevisedStartDate > tempRevisedEndDate) {
            alert('Revize başlangıç tarihi, bitiş tarihinden sonra olamaz!');
            return;
        }

        setSavingRevised(true);

        try {
            const requestData = {
                issueId: selectedIssueForRevise.issueId,
                revisedPlannedStartDate: tempRevisedStartDate || null,
                revisedPlannedEndDate: tempRevisedEndDate || null,
                revisedPlanDescription: tempRevisedDescription || '',
                updatedBy: 'User'
            };

            const response = await apiService.updateIssueDates(requestData);

            if (response.success) {
                setIssues(prevIssues =>
                    prevIssues.map(i =>
                        i.issueId === selectedIssueForRevise.issueId
                            ? {
                                ...i,
                                revisedPlannedStartDate: tempRevisedStartDate || null,
                                revisedPlannedEndDate: tempRevisedEndDate || null,
                                revisedPlanDescription: tempRevisedDescription || ''
                            }
                            : i
                    )
                );

                showSuccessFeedback('Revize plan tarihleri güncellendi!');
                setShowRevisedModal(false);
                setSelectedIssueForRevise(null);
            } else {
                alert(response.message || 'Güncelleme başarısız');
            }
        } catch (error) {
            console.error('❌ Revize tarih güncelleme hatası:', error);
            alert('Revize tarihler güncellenirken hata oluştu: ' + error.message);
        } finally {
            setSavingRevised(false);
        }
    };

    // REVİZE PLAN İPTAL ETME
    const handleClearRevisedDates = async () => {
        if (!selectedIssueForRevise) return;

        if (!window.confirm('Revize plan tarihlerini ve açıklamayı iptal etmek istediğinizden emin misiniz?')) {
            return;
        }

        setClearingRevised(true);

        try {
            const requestData = {
                issueId: selectedIssueForRevise.issueId,
                revisedPlannedStartDate: null,
                revisedPlannedEndDate: null,
                revisedPlanDescription: '',
                updatedBy: 'User'
            };

            const response = await apiService.updateIssueDates(requestData);

            if (response.success) {
                setIssues(prevIssues =>
                    prevIssues.map(i =>
                        i.issueId === selectedIssueForRevise.issueId
                            ? {
                                ...i,
                                revisedPlannedStartDate: null,
                                revisedPlannedEndDate: null,
                                revisedPlanDescription: ''
                            }
                            : i
                    )
                );

                showSuccessFeedback('Revize plan iptal edildi!');
                setShowRevisedModal(false);
                setSelectedIssueForRevise(null);
            } else {
                alert(response.message || 'İptal işlemi başarısız');
            }
        } catch (error) {
            console.error('❌ Revize iptal hatası:', error);
            alert('Revize iptal edilirken hata oluştu: ' + error.message);
        } finally {
            setClearingRevised(false);
        }
    };

    const showSuccessFeedback = (message) => {
        const feedback = document.createElement('div');
        feedback.className = 'alert alert-success position-fixed top-50 start-50 translate-middle';
        feedback.style.zIndex = '9999';
        feedback.innerHTML = `<i class="bi bi-check-circle me-2"></i>${message}`;
        document.body.appendChild(feedback);

        setTimeout(() => {
            feedback.remove();
        }, 2000);
    };

    const formatDateForInput = (dateValue) => {
        if (!dateValue) return '';
        if (dateValue.startsWith('0001-01-01')) return '';

        try {
            const date = new Date(dateValue);
            if (isNaN(date.getTime())) return '';

            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        } catch {
            return '';
        }
    };

    const formatDateForDisplay = (dateValue) => {
        if (!dateValue || dateValue.startsWith('0001-01-01')) return '-';

        try {
            const date = new Date(dateValue);
            if (isNaN(date.getTime())) return '-';

            return date.toLocaleDateString('tr-TR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            });
        } catch {
            return '-';
        }
    };

    const renderDateCell = (issue, field) => {
        const cellKey = `${issue.issueId}_${field}`;
        const isEditing = editingDateCell === cellKey;
        const dateValue = issue[field];

        return (
            <td
                className="text-center position-relative"
                onDoubleClick={() => {
                    setEditingDateCell(cellKey);
                    setTempDate(formatDateForInput(dateValue));
                }}
                style={{ minWidth: '120px', cursor: 'pointer' }}
            >
                {isEditing ? (
                    <div className="d-flex align-items-center gap-1">
                        <input
                            type="date"
                            className="form-control form-control-sm"
                            value={tempDate}
                            onChange={(e) => setTempDate(e.target.value)}
                            onBlur={() => handleSaveDate(issue, field)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    handleSaveDate(issue, field);
                                } else if (e.key === 'Escape') {
                                    setEditingDateCell(null);
                                    setTempDate('');
                                }
                            }}
                            autoFocus
                            disabled={savingDate}
                        />
                        {savingDate && <div className="spinner-border spinner-border-sm text-primary" />}
                    </div>
                ) : (
                    <div className="d-flex align-items-center justify-content-center">
                        <span>{formatDateForDisplay(dateValue)}</span>
                        <i className="bi bi-pencil-fill ms-2 text-muted" style={{ fontSize: '0.7rem' }}></i>
                    </div>
                )}
            </td>
        );
    };

    const renderRevisedDateCell = (issue, field) => {
        const revisedDateValue = issue[field];
        const hasRevisedDate = revisedDateValue && !revisedDateValue.startsWith('0001-01-01');

        const plannedField = field === 'revisedPlannedStartDate' ? 'plannedStartDate' : 'plannedEndDate';
        const plannedDateValue = issue[plannedField];

        return (
            <td
                className="text-center position-relative"
                onClick={() => {
                    setSelectedIssueForRevise(issue);
                    setTempRevisedStartDate(formatDateForInput(issue.revisedPlannedStartDate));
                    setTempRevisedEndDate(formatDateForInput(issue.revisedPlannedEndDate));
                    setTempRevisedDescription(issue.revisedPlanDescription || '');
                    setShowRevisedModal(true);
                }}
                style={{ minWidth: '120px', cursor: 'pointer' }}
            >
                <div className="d-flex flex-column align-items-center">
                    <div className="d-flex align-items-center">
                        {hasRevisedDate ? (
                            <span className="text-warning fw-bold">{formatDateForDisplay(revisedDateValue)}</span>
                        ) : (
                            <span className="text-muted">{formatDateForDisplay(plannedDateValue)}</span>
                        )}
                        <i className={`bi ${hasRevisedDate ? 'bi-pencil-fill' : 'bi-plus-circle'} edit-icon ms-2`}></i>
                    </div>
                </div>

                {issue.revisedPlanDescription && (
                    <div className="small text-muted mt-1" style={{ fontSize: '0.7rem' }}>
                        <i className="bi bi-info-circle me-1"></i>
                        {issue.revisedPlanDescription.length > 25
                            ? issue.revisedPlanDescription.substring(0, 25) + '...'
                            : issue.revisedPlanDescription}
                    </div>
                )}
            </td>
        );
    };

    // ✅ YENİ: GRUP PARÇA ADETİ RENDER
    const renderGroupQuantityCell = (issue) => {
        const groupQuantity = issue.parentGroupPartQuantity || 0;

        return (
            <td className="text-center">
                {groupQuantity > 0 ? (
                    <span className="badge bg-info" style={{ fontSize: '0.85rem' }}>
                        <i className="bi bi-box-seam me-1"></i>
                        {groupQuantity}
                    </span>
                ) : (
                    <span className="text-muted" style={{ fontSize: '0.75rem' }}>-</span>
                )}
            </td>
        );
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
        setSearchTerm('');
        setShowFilters(false);
    };

    const hasActiveFilters = filters.projectId || filters.productionType !== 'all' ||
        filters.status !== 'all' || filters.assignedTo || searchTerm;

    const checkIfIssueOverdue = (issue) => {
        let effectiveEndDate = issue.revisedPlannedEndDate;

        if (!effectiveEndDate ||
            effectiveEndDate.startsWith('0001-01-01') ||
            effectiveEndDate === '0001-01-01T00:00:00') {
            effectiveEndDate = issue.plannedEndDate;
        }

        if (!effectiveEndDate ||
            effectiveEndDate.startsWith('0001-01-01') ||
            effectiveEndDate === '0001-01-01T00:00:00') {
            return false;
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const plannedEnd = new Date(effectiveEndDate);
        plannedEnd.setHours(0, 0, 0, 0);

        if (issue.isClosed && issue.closedOn) {
            const closedDate = new Date(issue.closedOn);
            closedDate.setHours(0, 0, 0, 0);
            return closedDate > plannedEnd;
        }

        return today > plannedEnd;
    };

    const getStatusBadgeClass = (statusName, isClosed) => {
        if (isClosed) return 'bg-success';
        if (statusName?.includes('İptal')) return 'bg-danger';
        if (statusName?.includes('Bekliyor')) return 'bg-warning';
        return 'bg-info';
    };

    const handleBackToCalendar = () => {
        navigate('/production/weekly-calendar', {
            state: { currentWeek: currentWeek }
        });
    };

    // PAGINATION
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentIssues = filteredIssues.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredIssues.length / itemsPerPage);

    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    if (!selectedDate) {
        return (
            <div className="container-fluid py-4">
                <div className="alert alert-warning">
                    <i className="bi bi-exclamation-triangle me-2"></i>
                    Tarih bilgisi bulunamadı. Lütfen haftalık takvimden bir tarih seçin.
                </div>
            </div>
        );
    }

    const uniqueProjects = [...new Map(issues.map(i => [i.projectId, { id: i.projectId, name: i.projectName, code: i.projectCode }])).values()];
    const productionTypeList = [...new Set(issues.map(i => i.trackerName?.replace('Üretim - ', '').trim()).filter(Boolean))];
    const statusList = [...new Set(issues.map(i => i.statusName).filter(Boolean))];
    const assigneeList = [...new Set(issues.map(i => i.assignedTo).filter(Boolean))];

    return (
        <div className="container-fluid py-4">
            {/* Revize Plan Modal */}
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
                                <div className="mb-3">
                                    <label className="form-label small fw-bold">
                                        İş Numarası: #{selectedIssueForRevise.issueId}
                                    </label>
                                    <p className="text-muted small">{selectedIssueForRevise.subject}</p>
                                </div>

                                <div className="mb-3">
                                    <label className="form-label small fw-bold">Revize Başlangıç Tarihi</label>
                                    <input
                                        type="date"
                                        className="form-control"
                                        value={tempRevisedStartDate}
                                        onChange={(e) => setTempRevisedStartDate(e.target.value)}
                                        disabled={savingRevised || clearingRevised}
                                    />
                                    <small className="text-muted">
                                        Orijinal: {formatDateForDisplay(selectedIssueForRevise.plannedStartDate)}
                                    </small>
                                </div>

                                <div className="mb-3">
                                    <label className="form-label small fw-bold">Revize Bitiş Tarihi</label>
                                    <input
                                        type="date"
                                        className="form-control"
                                        value={tempRevisedEndDate}
                                        onChange={(e) => setTempRevisedEndDate(e.target.value)}
                                        disabled={savingRevised || clearingRevised}
                                    />
                                    <small className="text-muted">
                                        Orijinal: {formatDateForDisplay(selectedIssueForRevise.plannedEndDate)}
                                    </small>
                                </div>

                                <div className="mb-3">
                                    <label className="form-label small fw-bold">Revize Açıklaması</label>
                                    <textarea
                                        className="form-control"
                                        rows="3"
                                        placeholder="Revize sebebini yazınız..."
                                        value={tempRevisedDescription}
                                        onChange={(e) => setTempRevisedDescription(e.target.value)}
                                        disabled={savingRevised || clearingRevised}
                                    />
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button
                                    className="btn btn-danger"
                                    onClick={handleClearRevisedDates}
                                    disabled={savingRevised || clearingRevised}
                                >
                                    {clearingRevised ? (
                                        <>
                                            <span className="spinner-border spinner-border-sm me-2"></span>
                                            İptal Ediliyor...
                                        </>
                                    ) : (
                                        <>
                                            <i className="bi bi-x-circle me-2"></i>
                                            Revizeyi İptal Et
                                        </>
                                    )}
                                </button>
                                <button
                                    className="btn btn-secondary"
                                    onClick={() => setShowRevisedModal(false)}
                                    disabled={savingRevised || clearingRevised}
                                >
                                    Vazgeç
                                </button>
                                <button
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
                                            <i className="bi bi-check-circle me-2"></i>
                                            Kaydet
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="card mb-4">
                <div className="card-body">
                    <div className="d-flex justify-content-between align-items-center">
                        <div>
                            <h2 className="mb-1">
                                <i className="bi bi-list-check me-2"></i>
                                İş Detayları
                            </h2>
                            <p className="text-muted mb-0">
                                {selectedDate instanceof Date
                                    ? selectedDate.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })
                                    : formatDateForDisplay(selectedDate)}
                                {selectedGroup && (
                                    <span className="ms-3">
                                        <span className="badge bg-secondary me-2">{selectedGroup.projectCode}</span>
                                        <span className="badge bg-primary">{selectedGroup.productionType}</span>
                                    </span>
                                )}
                            </p>
                        </div>
                        <div className="d-flex gap-2">
                            <button
                                className="btn btn-outline-primary"
                                onClick={fetchIssueDetails}
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
                    <div className="d-flex justify-content-between align-items-center">
                        <h6 className="mb-0">
                            <i className="bi bi-funnel me-2"></i>
                            Filtreler
                            {hasActiveFilters && (
                                <span className="badge bg-primary ms-2">{filteredIssues.length}/{issues.length}</span>
                            )}
                        </h6>
                        <button
                            className="btn btn-sm btn-link"
                            onClick={() => setShowFilters(!showFilters)}
                        >
                            {showFilters ? 'Gizle' : 'Göster'}
                        </button>
                    </div>
                </div>
                {showFilters && (
                    <div className="card-body">
                        <div className="row g-3">
                            <div className="col-md-3">
                                <label className="form-label small fw-bold">Proje</label>
                                <select
                                    className="form-select form-select-sm"
                                    value={filters.projectId}
                                    onChange={(e) => handleFilterChange('projectId', e.target.value)}
                                >
                                    <option value="">Tümü</option>
                                    {uniqueProjects.map(p => (
                                        <option key={p.id} value={p.id}>
                                            {p.code} - {p.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="col-md-3">
                                <label className="form-label small fw-bold">İş Tipi</label>
                                <select
                                    className="form-select form-select-sm"
                                    value={filters.productionType}
                                    onChange={(e) => handleFilterChange('productionType', e.target.value)}
                                >
                                    <option value="all">Tümü</option>
                                    {productionTypeList.map(type => (
                                        <option key={type} value={type}>{type}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="col-md-3">
                                <label className="form-label small fw-bold">Durum</label>
                                <select
                                    className="form-select form-select-sm"
                                    value={filters.status}
                                    onChange={(e) => handleFilterChange('status', e.target.value)}
                                >
                                    <option value="all">Tümü</option>
                                    {statusList.map(status => (
                                        <option key={status} value={status}>{status}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="col-md-3">
                                <label className="form-label small fw-bold">Atanan</label>
                                <select
                                    className="form-select form-select-sm"
                                    value={filters.assignedTo}
                                    onChange={(e) => handleFilterChange('assignedTo', e.target.value)}
                                >
                                    <option value="">Tümü</option>
                                    {assigneeList.map(assignee => (
                                        <option key={assignee} value={assignee}>{assignee}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className="row mt-3">
                            <div className="col-12">
                                <input
                                    type="text"
                                    className="form-control form-control-sm"
                                    placeholder="İş numarası, konu, proje adı veya kodu ile ara..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>
                        {hasActiveFilters && (
                            <div className="row mt-3">
                                <div className="col-12">
                                    <button
                                        className="btn btn-sm btn-outline-secondary"
                                        onClick={resetFilters}
                                    >
                                        <i className="bi bi-x-circle me-2"></i>
                                        Filtreleri Temizle
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Loading State */}
            {loading && (
                <div className="text-center py-5">
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Yükleniyor...</span>
                    </div>
                    <p className="mt-3 text-muted">İşler yükleniyor...</p>
                </div>
            )}

            {/* Error State */}
            {error && (
                <div className="alert alert-danger">
                    <i className="bi bi-exclamation-triangle me-2"></i>
                    {error}
                </div>
            )}

            {/* Issues Table */}
            {!loading && !error && filteredIssues.length > 0 && (
                <div className="card">
                    <div className="card-body p-0">
                        <div className="table-responsive">
                            <table className="table table-hover table-bordered mb-0">
                                <thead className="table-light sticky-top">
                                    <tr>
                                        <th className="text-center" style={{ width: '80px' }}>
                                            <i className="bi bi-hash me-1"></i>
                                            İş No
                                        </th>
                                        <th style={{ minWidth: '200px' }}>
                                            <i className="bi bi-building me-1"></i>
                                            Proje
                                        </th>
                                        <th className="text-center" style={{ width: '120px' }}>
                                            <i className="bi bi-gear me-1"></i>
                                            İş Tipi
                                        </th>
                                        <th className="text-center" style={{ width: '120px' }}>
                                            <i className="bi bi-calendar-check me-1"></i>
                                            Plan Başlangıç
                                        </th>
                                        <th className="text-center" style={{ width: '120px' }}>
                                            <i className="bi bi-calendar-x me-1"></i>
                                            Plan Bitiş
                                        </th>
                                        <th className="text-center" style={{ width: '120px' }}>
                                            <i className="bi bi-calendar-event me-1"></i>
                                            Revize Bitiş
                                        </th>
                                        <th className="text-center" style={{ width: '100px' }}>
                                            <i className="bi bi-box-seam me-1"></i>
                                            Grup Adeti
                                        </th>
                                        <th style={{ minWidth: '150px' }}>
                                            <i className="bi bi-person me-1"></i>
                                            Atanan
                                        </th>
                                        <th className="text-center" style={{ width: '120px' }}>
                                            <i className="bi bi-flag me-1"></i>
                                            Durum
                                        </th>
                                        <th className="text-center" style={{ width: '100px' }}>
                                            <i className="bi bi-percent me-1"></i>
                                            Tamamlanma
                                        </th>
                                        <th className="text-center" style={{ width: '80px' }}>
                                            <i className="bi bi-link-45deg me-1"></i>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {currentIssues.map((issue) => {
                                        const isOverdue = checkIfIssueOverdue(issue);
                                        return (
                                            <tr
                                                key={issue.issueId}
                                                className={isOverdue && !issue.isClosed ? 'table-danger' : ''}
                                            >
                                                <td className="text-center fw-bold">{issue.issueId}</td>
                                                <td>
                                                    <div className="d-flex flex-column">
                                                        <span className="fw-bold">{issue.projectCode}</span>
                                                        <small className="text-muted">{issue.projectName}</small>
                                                    </div>
                                                </td>
                                                <td className="text-center">
                                                    <span className="badge bg-primary">
                                                        {issue.trackerName?.replace('Üretim - ', '')}
                                                    </span>
                                                </td>
                                                {renderDateCell(issue, 'plannedStartDate')}
                                                {renderDateCell(issue, 'plannedEndDate')}
                                                {renderRevisedDateCell(issue, 'revisedPlannedEndDate')}
                                                {renderGroupQuantityCell(issue)} {/* ✅ Burası düzgün kapatılmalı */}
                                                <td>{issue.assignedTo}</td>
                                                <td className="text-center">
                                                    <span className={`badge ${getStatusBadgeClass(issue.statusName, issue.isClosed)}`}>
                                                        {issue.statusName}
                                                    </span>
                                                </td>
                                                <td className="text-center">
                                                    <div className="progress" style={{ height: '20px' }}>
                                                        <div
                                                            className={`progress-bar ${issue.completionPercentage >= 75 ? 'bg-success' :
                                                                issue.completionPercentage >= 50 ? 'bg-info' :
                                                                    issue.completionPercentage >= 25 ? 'bg-warning' : 'bg-danger'
                                                                }`}
                                                            style={{ width: `${issue.completionPercentage}%` }}
                                                        >
                                                            {issue.completionPercentage}%
                                                        </div>
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
                        </div>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="card-footer">
                            <div className="d-flex justify-content-between align-items-center">
                                <div className="text-muted small">
                                    Toplam {filteredIssues.length} kayıt - Sayfa {currentPage} / {totalPages}
                                </div>
                                <nav>
                                    <ul className="pagination pagination-sm mb-0">
                                        <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                                            <button
                                                className="page-link"
                                                onClick={() => paginate(1)}
                                                disabled={currentPage === 1}
                                            >
                                                İlk
                                            </button>
                                        </li>
                                        <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                                            <button
                                                className="page-link"
                                                onClick={() => paginate(currentPage - 1)}
                                                disabled={currentPage === 1}
                                            >
                                                Önceki
                                            </button>
                                        </li>

                                        {[...Array(totalPages)].map((_, index) => {
                                            const pageNumber = index + 1;
                                            if (
                                                pageNumber === 1 ||
                                                pageNumber === totalPages ||
                                                (pageNumber >= currentPage - 2 && pageNumber <= currentPage + 2)
                                            ) {
                                                return (
                                                    <li
                                                        key={pageNumber}
                                                        className={`page-item ${currentPage === pageNumber ? 'active' : ''}`}
                                                    >
                                                        <button
                                                            className="page-link"
                                                            onClick={() => paginate(pageNumber)}
                                                        >
                                                            {pageNumber}
                                                        </button>
                                                    </li>
                                                );
                                            } else if (
                                                pageNumber === currentPage - 3 ||
                                                pageNumber === currentPage + 3
                                            ) {
                                                return (
                                                    <li key={pageNumber} className="page-item disabled">
                                                        <span className="page-link">...</span>
                                                    </li>
                                                );
                                            }
                                            return null;
                                        })}

                                        <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                                            <button
                                                className="page-link"
                                                onClick={() => paginate(currentPage + 1)}
                                                disabled={currentPage === totalPages}
                                            >
                                                Sonraki
                                            </button>
                                        </li>
                                        <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                                            <button
                                                className="page-link"
                                                onClick={() => paginate(totalPages)}
                                                disabled={currentPage === totalPages}
                                            >
                                                Son
                                            </button>
                                        </li>
                                    </ul>
                                </nav>
                            </div>
                        </div>
                    )}
                </div>
            )
            }

            {/* Empty State */}
            {
                !loading && !error && filteredIssues.length === 0 && (
                    <div className="card">
                        <div className="card-body text-center py-5">
                            <i className="bi bi-inbox" style={{ fontSize: '4rem', color: '#ccc' }}></i>
                            <p className="text-muted mt-3">
                                {hasActiveFilters
                                    ? 'Filtrelere uygun iş bulunamadı'
                                    : 'Bu tarih için iş bulunmamaktadır'}
                            </p>
                        </div>
                    </div>
                )
            }

            {/* Statistics - Only show when there are issues */}
            {
                !loading && !error && filteredIssues.length > 0 && (
                    <div className="card mt-4">
                        <div className="card-body">
                            <h6 className="mb-3">
                                <i className="bi bi-bar-chart me-2"></i>
                                İstatistikler
                            </h6>
                            <div className="row text-center">
                                <div className="col-md-2">
                                    <div className="p-3">
                                        <h5 className="text-primary mb-1">{filteredIssues.length}</h5>
                                        <small className="text-muted">Toplam İş</small>
                                    </div>
                                </div>
                                <div className="col-md-2">
                                    <div className="p-3">
                                        <h5 className="text-success mb-1">
                                            {filteredIssues.filter(i => i.isClosed).length}
                                        </h5>
                                        <small className="text-muted">Tamamlanan</small>
                                    </div>
                                </div>
                                <div className="col-md-2">
                                    <div className="p-3">
                                        <h5 className="text-warning mb-1">
                                            {filteredIssues.filter(i => !i.isClosed).length}
                                        </h5>
                                        <small className="text-muted">Devam Eden</small>
                                    </div>
                                </div>
                                <div className="col-md-2">
                                    <div className="p-3">
                                        <h5 className="text-danger mb-1">
                                            {filteredIssues.filter(i => checkIfIssueOverdue(i) && !i.isClosed).length}
                                        </h5>
                                        <small className="text-muted">Gecikmiş</small>
                                    </div>
                                </div>
                                <div className="col-md-2">
                                    <div className="p-3">
                                        <h5 className="text-info mb-1">
                                            {filteredIssues.filter(i => {
                                                const hasStart = i.revisedPlannedStartDate && !i.revisedPlannedStartDate.startsWith('0001-01-01');
                                                const hasEnd = i.revisedPlannedEndDate && !i.revisedPlannedEndDate.startsWith('0001-01-01');
                                                return hasStart || hasEnd;
                                            }).length}
                                        </h5>
                                        <small className="text-muted">Revize Edilmiş</small>
                                    </div>
                                </div>
                                <div className="col-md-2">
                                    <div className="p-3">
                                        <h5 className="text-secondary mb-1">
                                            {filteredIssues.filter(i => i.revisedPlanDescription && i.revisedPlanDescription.trim()).length}
                                        </h5>
                                        <small className="text-muted">Açıklamalı</small>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
};

export default IssueDetailsPage;