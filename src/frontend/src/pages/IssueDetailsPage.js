// src/frontend/src/pages/IssueDetailsPage.js
// ✅ COMPLETE VERSION - Revize İptal Özelliği Dahil

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

    // INLINE TARİH DÜZENLEME STATE'LERİ (Planlanan Tarihler için)
    const [editingDateCell, setEditingDateCell] = useState(null);
    const [tempDate, setTempDate] = useState('');
    const [savingDate, setSavingDate] = useState(false);

    // REVİZE PLAN TARİHLERİ STATE'LERİ (Birleşik Modal)
    const [showRevisedModal, setShowRevisedModal] = useState(false);
    const [selectedIssueForRevise, setSelectedIssueForRevise] = useState(null);
    const [tempRevisedStartDate, setTempRevisedStartDate] = useState('');
    const [tempRevisedEndDate, setTempRevisedEndDate] = useState('');
    const [tempRevisedDescription, setTempRevisedDescription] = useState('');
    const [savingRevised, setSavingRevised] = useState(false);
    const [clearingRevised, setClearingRevised] = useState(false); // ✅ YENİ

    const [filters, setFilters] = useState({
        projectId: '',
        productionType: 'all',
        status: 'all',
        assignedTo: ''
    });

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
            } else if (typeof selectedDate === 'string') {
                if (selectedDate.includes('T')) {
                    formattedDate = selectedDate.split('T')[0];
                } else {
                    formattedDate = selectedDate;
                }
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

    // PLANLANAN TARİH KAYDETME (Inline Edit)
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
            }
        } catch (error) {
            console.error('❌ Error updating date:', error);
            alert('Tarih güncellenirken hata oluştu: ' + (error.message || 'Bilinmeyen hata'));
        } finally {
            setSavingDate(false);
            setEditingDateCell(null);
        }
    };

    // REVİZE MODAL AÇMA
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

    // REVİZE TARİHLER KAYDETME
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
                showSuccessFeedback('Revize plan tarihleri güncellendi!');
            }
        } catch (error) {
            console.error('❌ Error updating revised dates:', error);
            alert('Revize tarihler güncellenirken hata oluştu: ' + (error.message || 'Bilinmeyen hata'));
        } finally {
            setSavingRevised(false);
        }
    };

    // ✅ YENİ: REVİZE TARİHLER TEMİZLEME
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
                revisedPlannedStartDate: '', // ✅ Boş string gönder
                revisedPlannedEndDate: '',   // ✅ Boş string gönder
                revisedPlanDescription: newDescription,
                updatedBy: 'User'
            };

            console.log('🗑️ Clearing revised dates:', requestData);

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
                showSuccessFeedback('Revize tarihler iptal edildi, sistem planlanan tarihlere döndü.');
            }
        } catch (error) {
            console.error('❌ Error clearing revised dates:', error);
            alert('Revize tarihler silinirken hata oluştu: ' + (error.message || 'Bilinmeyen hata'));
        } finally {
            setClearingRevised(false);
        }
    };

    const showSuccessFeedback = (message) => {
        const toast = document.createElement('div');
        toast.className = 'position-fixed top-0 end-0 p-3';
        toast.style.zIndex = '9999';
        toast.innerHTML = `
            <div class="toast show align-items-center text-white bg-success border-0" role="alert">
                <div class="d-flex">
                    <div class="toast-body">
                        <i class="bi bi-check-circle me-2"></i>
                        ${message}
                    </div>
                    <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
                </div>
            </div>
        `;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    };

    const formatDateForInput = (dateString) => {
        if (!dateString) return '';
        
        if (dateString.startsWith('0001-01-01') || dateString === '0001-01-01T00:00:00') {
            return '';
        }
        
        try {
            const date = new Date(dateString);
            const year = date.getFullYear();
            
            if (year < 1900) {
                return '';
            }
            
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        } catch (e) {
            return '';
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        
        if (dateString.startsWith('0001-01-01') || dateString === '0001-01-01T00:00:00') {
            return '-';
        }
        
        try {
            const dateOnly = dateString.split('T')[0];
            const [year, month, day] = dateOnly.split('-');
            
            if (parseInt(year) < 1900) {
                return '-';
            }
            
            return `${day}.${month}.${year}`;
        } catch (e) {
            return '-';
        }
    };

    const formatDateForDisplay = (dateString) => {
        if (!dateString) return '-';
        
        if (dateString.startsWith('0001-01-01') || dateString === '0001-01-01T00:00:00') {
            return '-';
        }
        
        try {
            const date = new Date(dateString);
            const year = date.getFullYear();
            
            if (year < 1900) {
                return '-';
            }
            
            return date.toLocaleDateString('tr-TR', {
                day: '2-digit',
                month: 'long',
                year: 'numeric'
            });
        } catch (e) {
            return '-';
        }
    };

    const renderEditableDateCell = (issue, field, icon, color) => {
        const cellKey = `${issue.issueId}-${field}`;
        const isEditing = editingDateCell === cellKey;
        const dateValue = issue[field];

        if (isEditing) {
            return (
                <td className="date-edit-cell">
                    <div className="d-flex align-items-center gap-2">
                        <input
                            type="date"
                            className="form-control form-control-sm"
                            value={tempDate}
                            onChange={(e) => setTempDate(e.target.value)}
                            onBlur={() => {
                                const originalDate = formatDateForInput(dateValue);
                                if (tempDate && tempDate !== originalDate) {
                                    handleSaveDate(issue, field);
                                } else {
                                    setEditingDateCell(null);
                                }
                            }}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    const originalDate = formatDateForInput(dateValue);
                                    if (tempDate && tempDate !== originalDate) {
                                        handleSaveDate(issue, field);
                                    } else {
                                        setEditingDateCell(null);
                                    }
                                } else if (e.key === 'Escape') {
                                    setEditingDateCell(null);
                                }
                            }}
                            disabled={savingDate}
                            autoFocus
                        />
                        <button
                            className="btn btn-sm btn-outline-success"
                            onClick={() => {
                                const originalDate = formatDateForInput(dateValue);
                                if (tempDate && tempDate !== originalDate) {
                                    handleSaveDate(issue, field);
                                } else {
                                    setEditingDateCell(null);
                                }
                            }}
                            disabled={savingDate}
                            title="Kaydet (Enter)"
                        >
                            {savingDate ? (
                                <span className="spinner-border spinner-border-sm"></span>
                            ) : (
                                <i className="bi bi-check-lg"></i>
                            )}
                        </button>
                        <button
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => setEditingDateCell(null)}
                            disabled={savingDate}
                            title="İptal (Esc)"
                        >
                            <i className="bi bi-x-lg"></i>
                        </button>
                    </div>
                </td>
            );
        }

        return (
            <td
                className="editable-date-cell"
                onClick={() => {
                    setEditingDateCell(cellKey);
                    setTempDate(formatDateForInput(dateValue));
                }}
                title="Düzenlemek için tıklayın"
            >
                <div className="d-flex align-items-center">
                    <i className={`bi ${icon} text-${color} me-2`}></i>
                    <span>{formatDate(dateValue)}</span>
                    <i className="bi bi-pencil-fill edit-icon ms-2"></i>
                </div>
            </td>
        );
    };

    const renderRevisedDatesCell = (issue) => {
        const hasRevisedStart = issue.revisedPlannedStartDate && 
                               !issue.revisedPlannedStartDate.startsWith('0001-01-01');
        const hasRevisedEnd = issue.revisedPlannedEndDate && 
                             !issue.revisedPlannedEndDate.startsWith('0001-01-01');
        const hasAnyRevised = hasRevisedStart || hasRevisedEnd;

        return (
            <td
                className={`editable-date-cell ${hasAnyRevised ? 'table-warning' : ''}`}
                onClick={() => handleOpenRevisedModal(issue)}
                title={hasAnyRevised ? "Revize edilmiş - Düzenlemek için tıklayın" : "Revize plan eklemek için tıklayın"}
                style={{ cursor: 'pointer' }}
            >
                <div className="d-flex flex-column gap-1">
                    <div className="d-flex align-items-center justify-content-between">
                        <div className="d-flex align-items-center">
                            <i className="bi bi-calendar-event text-warning me-2" style={{ fontSize: '0.85rem' }}></i>
                            <small className={hasRevisedStart ? 'fw-bold' : 'text-muted'}>
                                {hasRevisedStart ? formatDate(issue.revisedPlannedStartDate) : '-'}
                            </small>
                        </div>
                    </div>
                    
                    <div className="d-flex align-items-center justify-content-between">
                        <div className="d-flex align-items-center">
                            <i className="bi bi-calendar-event-fill text-warning me-2" style={{ fontSize: '0.85rem' }}></i>
                            <small className={hasRevisedEnd ? 'fw-bold' : 'text-muted'}>
                                {hasRevisedEnd ? formatDate(issue.revisedPlannedEndDate) : '-'}
                            </small>
                        </div>
                        <i className={`bi ${hasAnyRevised ? 'bi-pencil-fill' : 'bi-plus-circle'} edit-icon ms-2`}></i>
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
                                        {selectedIssueForRevise.revisedPlanDescription && (
                                            <div className="mt-1 small text-muted">
                                                "{selectedIssueForRevise.revisedPlanDescription}"
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Revize Başlangıç */}
                                <div className="mb-3">
                                    <label className="form-label fw-bold">
                                        <i className="bi bi-calendar-event text-warning me-2"></i>
                                        Revize Başlangıç Tarihi <span className="text-danger">*</span>
                                    </label>
                                    <input
                                        type="date"
                                        className="form-control"
                                        value={tempRevisedStartDate}
                                        onChange={(e) => setTempRevisedStartDate(e.target.value)}
                                        disabled={savingRevised || clearingRevised}
                                    />
                                </div>

                                {/* Revize Bitiş */}
                                <div className="mb-3">
                                    <label className="form-label fw-bold">
                                        <i className="bi bi-calendar-event-fill text-warning me-2"></i>
                                        Revize Bitiş Tarihi <span className="text-danger">*</span>
                                    </label>
                                    <input
                                        type="date"
                                        className="form-control"
                                        value={tempRevisedEndDate}
                                        onChange={(e) => setTempRevisedEndDate(e.target.value)}
                                        disabled={savingRevised || clearingRevised}
                                    />
                                </div>

                                {/* Açıklama */}
                                <div className="mb-3">
                                    <label className="form-label fw-bold">
                                        <i className="bi bi-chat-left-text text-warning me-2"></i>
                                        Revize Açıklaması <span className="text-danger">*</span>
                                    </label>
                                    <textarea
                                        className="form-control"
                                        rows="3"
                                        placeholder="Plan neden revize edildi? (Zorunlu)"
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
                background: 'linear-gradient(135deg, #FF6B6B, #FF8E53)',
                color: 'white',
                border: 'none'
            }}>
                <div className="card-body">
                    <div className="d-flex justify-content-between align-items-center flex-wrap">
                        <div className="mb-2 mb-md-0">
                            <h4 className="mb-2">
                                <i className="bi bi-list-task me-2"></i>
                                {selectedGroup
                                    ? `${selectedGroup.projectCode} - ${selectedGroup.productionType}`
                                    : 'Tüm İşler'
                                }
                            </h4>
                            <p className="mb-0 opacity-75">
                                <i className="bi bi-calendar-event me-2"></i>
                                {formatDateForDisplay(selectedDate)}
                            </p>
                        </div>
                        <div className="d-flex gap-2">
                            <button
                                className="btn btn-light"
                                onClick={() => setShowFilters(!showFilters)}
                            >
                                <i className={`bi bi-funnel${hasActiveFilters ? '-fill' : ''} me-2`}></i>
                                Filtreler
                                {hasActiveFilters && (
                                    <span className="badge bg-danger ms-2">●</span>
                                )}
                            </button>
                            <button
                                className="btn btn-light"
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
            {showFilters && (
                <div className="card mb-4">
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
                                    {uniqueProjects.map((project) => (
                                        <option key={project.id} value={project.id}>
                                            {project.code}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="col-md-3">
                                <label className="form-label small fw-bold">Üretim Tipi</label>
                                <select
                                    className="form-select form-select-sm"
                                    value={filters.productionType}
                                    onChange={(e) => handleFilterChange('productionType', e.target.value)}
                                >
                                    <option value="all">Tümü</option>
                                    {productionTypeList.map((type, idx) => (
                                        <option key={idx} value={type}>{type}</option>
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
                                    {statusList.map((status, idx) => (
                                        <option key={idx} value={status}>{status}</option>
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
                                    {assigneeList.map((assignee, idx) => (
                                        <option key={idx} value={assignee}>{assignee}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="col-12">
                                <button className="btn btn-secondary btn-sm" onClick={resetFilters}>
                                    <i className="bi bi-x-circle me-1"></i>
                                    Filtreleri Temizle
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Search Box */}
            {!loading && !error && issues.length > 0 && (
                <div className="card mb-4">
                    <div className="card-body">
                        <div className="input-group">
                            <span className="input-group-text">
                                <i className="bi bi-search"></i>
                            </span>
                            <input
                                type="text"
                                className="form-control"
                                placeholder="İş No, Konu, Proje ile ara..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                            {searchTerm && (
                                <button
                                    className="btn btn-outline-secondary"
                                    onClick={() => setSearchTerm('')}
                                >
                                    <i className="bi bi-x-lg"></i>
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Issues Table */}
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
                                {searchTerm || hasActiveFilters
                                    ? 'Filtrelere uygun iş bulunamadı'
                                    : 'İş bulunamadı'}
                            </p>
                            {(searchTerm || hasActiveFilters) && (
                                <button className="btn btn-outline-secondary btn-sm mt-2" onClick={resetFilters}>
                                    <i className="bi bi-x-circle me-1"></i>
                                    Filtreleri Temizle
                                </button>
                            )}
                        </div>
                    ) : (
                        <>
                            <div className="alert alert-info">
                                <i className="bi bi-info-circle me-2"></i>
                                <strong>Not:</strong> Sarı arka planlı hücre <strong>revize edilmiş</strong> tarihleri gösterir. 
                                Hücreye tıklayarak başlangıç, bitiş ve açıklama bilgilerini birlikte güncelleyebilir veya revize iptal edebilirsiniz.
                            </div>

                            <div className="table-responsive">
                                <table className="table table-hover table-sm">
                                    <thead className="table-light sticky-top">
                                        <tr>
                                            <th style={{ width: '60px' }}>İş No</th>
                                            <th style={{ width: '150px' }}>Proje</th>
                                            <th>Konu</th>
                                            <th style={{ width: '100px' }}>İş Tipi</th>
                                            
                                            <th style={{ width: '120px' }}>
                                                <i className="bi bi-calendar-check text-primary me-1"></i>
                                                Plan Başlangıç
                                            </th>
                                            <th style={{ width: '120px' }}>
                                                <i className="bi bi-calendar-x text-danger me-1"></i>
                                                Plan Bitiş
                                            </th>

                                            <th style={{ width: '160px' }} className="table-warning">
                                                <i className="bi bi-calendar-event text-warning me-1"></i>
                                                Revize Tarihler
                                                <div className="small fw-normal text-muted" style={{ fontSize: '0.7rem' }}>
                                                    (Başlangıç / Bitiş)
                                                </div>
                                            </th>

                                            <th style={{ width: '100px' }}>Durum</th>
                                            <th style={{ width: '80px' }}>İlerleme</th>
                                            <th style={{ width: '100px' }}>Atanan</th>
                                            <th style={{ width: '60px' }}>İşlem</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredIssues.map((issue) => {
                                            const isOverdue = checkIfIssueOverdue(issue);
                                            return (
                                                <tr
                                                    key={issue.issueId}
                                                    className={isOverdue && !issue.isClosed ? 'table-danger' : ''}
                                                >
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
                                                        <span style={{ fontSize: '0.85rem' }}>
                                                            {issue.projectName?.length > 20
                                                                ? issue.projectName.substring(0, 20) + '...'
                                                                : issue.projectName}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <div className="d-flex align-items-start gap-2">
                                                            <i
                                                                className={`bi ${issue.isClosed ? 'bi-check-circle-fill' : 'bi-circle'} text-${issue.isClosed ? 'success' : 'warning'}`}
                                                                style={{ fontSize: '0.5rem', marginTop: '4px' }}
                                                            ></i>
                                                            <div>
                                                                <div className="fw-medium" title={issue.subject}>
                                                                    {issue.subject?.length > 40
                                                                        ? issue.subject.substring(0, 40) + '...'
                                                                        : issue.subject}
                                                                </div>
                                                                {isOverdue && !issue.isClosed && (
                                                                    <div className="text-danger small mt-1">
                                                                        <i className="bi bi-exclamation-triangle-fill me-1"></i>
                                                                        Gecikmiş
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <span className="badge bg-secondary">
                                                            {issue.trackerName?.replace('Üretim - ', '')}
                                                        </span>
                                                    </td>

                                                    {renderEditableDateCell(issue, 'plannedStartDate', 'bi-calendar-check', 'primary')}
                                                    {renderEditableDateCell(issue, 'plannedEndDate', 'bi-calendar-x', 'danger')}

                                                    {renderRevisedDatesCell(issue)}

                                                    <td>
                                                        <span className={`badge ${getStatusBadgeClass(issue.statusName, issue.isClosed)}`}>
                                                            {issue.statusName}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <div className="progress" style={{ height: '20px' }}>
                                                            <div
                                                                className={`progress-bar ${issue.completionPercentage === 100 ? 'bg-success' : 'bg-primary'}`}
                                                                role="progressbar"
                                                                style={{ width: `${issue.completionPercentage}%` }}
                                                            >
                                                                <small>{issue.completionPercentage}%</small>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <small>{issue.assignedTo || 'Atanmamış'}</small>
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
                                Toplam {filteredIssues.length} iş gösteriliyor
                                {filteredIssues.length !== issues.length && ` (${issues.length} işten)`}
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Statistics */}
            {filteredIssues.length > 0 && (
                <div className="card mt-4">
                    <div className="card-body">
                        <div className="row text-center">
                            <div className="col-md-2">
                                <div className="p-3">
                                    <h5 className="text-primary mb-1">{filteredIssues.length}</h5>
                                    <small className="text-muted">Toplam</small>
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
            )}
        </div>
    );
};

export default IssueDetailsPage;