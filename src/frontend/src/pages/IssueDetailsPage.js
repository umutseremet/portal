// src/frontend/src/pages/IssueDetailsPage.js
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

    // ✅ INLINE TARİH DÜZENLEME STATE'LERİ
    const [editingDateCell, setEditingDateCell] = useState(null);
    const [tempDate, setTempDate] = useState('');
    const [savingDate, setSavingDate] = useState(false);

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
                // ✅ TIMEZONE-SAFE DÖNÜŞÜM
                const year = selectedDate.getFullYear();
                const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
                const day = String(selectedDate.getDate()).padStart(2, '0');
                formattedDate = `${year}-${month}-${day}`;
            } else if (typeof selectedDate === 'string') {
                // ✅ String ise direkt split yap (timezone-safe)
                if (selectedDate.includes('T')) {
                    formattedDate = selectedDate.split('T')[0];
                } else {
                    formattedDate = selectedDate;
                }
            }

            console.log('📅 Formatted date for API:', formattedDate);

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

    // ✅ INLINE TARİH KAYDETME FONKSİYONU
    const handleSaveDate = async (issue, field) => {
        // ✅ Boş tarih kontrolü
        if (!tempDate || tempDate.trim() === '') {
            setEditingDateCell(null);
            return;
        }

        // ✅ Tarih değişmemişse kaydetme
        const originalDate = formatDateForInput(issue[field]);
        if (tempDate === originalDate) {
            setEditingDateCell(null);
            return;
        }

        // Validasyon - tempDate zaten yyyy-MM-dd formatında olduğu için direkt karşılaştır
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
            console.log('💾 Saving date:', {
                issueId: issue.issueId,
                field,
                tempDate,
                tempDateType: typeof tempDate,
                originalDate: formatDateForInput(issue[field])
            });

            // ✅ tempDate zaten yyyy-MM-dd formatında, direkt gönder
            const requestData = {
                issueId: issue.issueId,
                plannedStartDate: field === 'plannedStartDate' ? tempDate : null,
                plannedEndDate: field === 'plannedEndDate' ? tempDate : null,
                updatedBy: 'User'
            };

            console.log('📤 API Request:', requestData);

            const response = await apiService.updateIssueDates(requestData);

            if (response.success) {
                console.log('✅ Date updated successfully:', response);

                // ✅ State'i güncelle - tempDate'i direkt kullan (yyyy-MM-dd formatında)
                setIssues(prevIssues =>
                    prevIssues.map(i =>
                        i.issueId === issue.issueId
                            ? {
                                ...i,
                                [field]: tempDate,
                                plannedStartDate: field === 'plannedStartDate' ? tempDate : i.plannedStartDate,
                                plannedEndDate: field === 'plannedEndDate' ? tempDate : i.plannedEndDate
                            }
                            : i
                    )
                );

                // Success feedback
                showSuccessFeedback();
            }
        } catch (error) {
            console.error('❌ Error updating date:', error);
            alert('Tarih güncellenirken hata oluştu: ' + (error.message || 'Bilinmeyen hata'));
        } finally {
            setSavingDate(false);
            setEditingDateCell(null);
        }
    };

    // ✅ BAŞARI FEEDBACK'İ
    const showSuccessFeedback = () => {
        const toast = document.createElement('div');
        toast.className = 'position-fixed top-0 end-0 p-3';
        toast.style.zIndex = '9999';
        toast.innerHTML = `
            <div class="toast show align-items-center text-white bg-success border-0" role="alert">
                <div class="d-flex">
                    <div class="toast-body">
                        <i class="bi bi-check-circle me-2"></i>
                        Tarih başarıyla güncellendi!
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
        try {
            // Date nesnesi kullan ama getFullYear/getMonth/getDate ile al
            // (Bu local timezone'u kullanır)
            const date = new Date(dateString);
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        } catch (e) {
            console.error('Date format error:', e);
            return '';
        }
    };

    // ✅ INLINE DÜZENLENEBILIR TARİH HÜCRESİ RENDER
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
                                // ✅ Sadece tarih değiştiyse kaydet
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
                    setTempDate(formatDateForInput(dateValue)); // ✅ Düzeltildi
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

    const checkIfIssueOverdue = (issue) => {
        if (!issue.plannedEndDate) return false;

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const plannedEnd = new Date(issue.plannedEndDate);
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

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        try {
            const dateOnly = dateString.split('T')[0];
            const [year, month, day] = dateOnly.split('-');
            return `${day}.${month}.${year}`;
        } catch (e) {
            console.error('Date format error:', e);
            return '-';
        }
    };

    const handleBackToCalendar = () => {
        navigate('/production/weekly-calendar', {
            state: {
                currentWeek: currentWeek
            }
        });
    };

    if (!selectedDate) {
        return null;
    }

    // Filtre için benzersiz değerleri al
    const projectList = [...new Set(issues.map(i => ({ id: i.projectId, name: i.projectName })))];
    const productionTypeList = [...new Set(issues.map(i => i.trackerName?.replace('Üretim - ', '').trim()))];
    const statusList = [...new Set(issues.map(i => i.statusName))];
    const assigneeList = [...new Set(issues.map(i => i.assignedTo))];

    return (
        <div className="container-fluid py-4">
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
                                {selectedGroup ?
                                    `${selectedGroup.projectCode} - ${selectedGroup.productionType}` :
                                    'Tüm İşler'
                                }
                            </h4>
                            <p className="mb-0 opacity-75">
                                <i className="bi bi-calendar-event me-2"></i>
                                {formatDate(selectedDate)}
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
                                    <span className="badge bg-danger ms-2">
                                        {[filters.projectId, filters.productionType !== 'all', filters.status !== 'all', filters.assignedTo].filter(Boolean).length}
                                    </span>
                                )}
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
                                <label className="form-label small">Proje</label>
                                <select
                                    className="form-select form-select-sm"
                                    value={filters.projectId}
                                    onChange={(e) => handleFilterChange('projectId', e.target.value)}
                                >
                                    <option value="">Tümü</option>
                                    {projectList.map((project, idx) => (
                                        <option key={idx} value={project.id}>{project.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="col-md-3">
                                <label className="form-label small">Üretim Tipi</label>
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
                                <label className="form-label small">Durum</label>
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
                                <label className="form-label small">Atanan</label>
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

            {/* Issues Table */}
            <div className="card">
                <div className="card-body">
                    {loading ? (
                        <div className="text-center py-5">
                            <div className="spinner-border text-danger" role="status">
                                <span className="visually-hidden">Yükleniyor...</span>
                            </div>
                        </div>
                    ) : error ? (
                        <div className="alert alert-danger">
                            <i className="bi bi-exclamation-triangle me-2"></i>
                            {error}
                        </div>
                    ) : filteredIssues.length === 0 ? (
                        <div className="text-center py-5">
                            <i className="bi bi-inbox fs-1 text-muted"></i>
                            <p className="mt-3 text-muted">İş bulunamadı</p>
                        </div>
                    ) : (
                        <div className="table-responsive">
                            <table className="table table-hover">
                                <thead className="table-light">
                                    <tr>
                                        <th style={{ width: '60px' }}>İş No</th>
                                        <th>Proje</th>
                                        <th>Konu</th>
                                        <th style={{ width: '120px' }}>İş Tipi</th>
                                        <th style={{ width: '130px' }}>
                                            <i className="bi bi-calendar-check text-primary me-1"></i>
                                            Pln Bşl Tarihi
                                        </th>
                                        <th style={{ width: '130px' }}>
                                            <i className="bi bi-calendar-x text-danger me-1"></i>
                                            Pln Bit Tarihi
                                        </th>
                                        {/* ✅ YENİ KOLON */}
                                        <th style={{ width: '130px' }}>
                                            <i className="bi bi-calendar-check-fill text-success me-1"></i>
                                            Kap. Tarihi
                                        </th>
                                        <th style={{ width: '100px' }}>Durum</th>
                                        <th style={{ width: '80px' }} className="text-center">İlerleme</th>
                                        <th style={{ width: '120px' }}>Atanan</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredIssues.map((issue) => {
                                        const isOverdue = checkIfIssueOverdue(issue);
                                        return (
                                            <tr key={issue.issueId} className={isOverdue ? 'overdue-row' : ''}>
                                                <td>
                                                    <a
                                                        href={`${REDMINE_BASE_URL}/issues/${issue.issueId}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="badge bg-secondary text-decoration-none"
                                                        style={{ cursor: 'pointer' }}
                                                        title={`Redmine'da aç: #${issue.issueId}`}
                                                    >
                                                        #{issue.issueId}
                                                    </a>
                                                </td>
                                                <td>
                                                    <div className="d-flex align-items-center">
                                                        <div
                                                            style={{
                                                                width: '8px',
                                                                height: '30px',
                                                                borderRadius: '4px',
                                                                marginRight: '8px',
                                                                backgroundColor: `var(--project-${issue.projectId % 10})`
                                                            }}
                                                        />
                                                        <div>
                                                            <div className="fw-medium small">{issue.projectCode}</div>
                                                            <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                                                                {issue.projectName}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td>
                                                    <div className="d-flex align-items-start">
                                                        <i className={`bi bi-circle-fill me-2 mt-1 ${issue.isClosed ? 'text-success' : 'text-warning'}`}
                                                            style={{ fontSize: '0.5rem' }}
                                                        ></i>
                                                        <div>
                                                            <div className="fw-medium">{issue.subject}</div>
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

                                                {/* ✅ YENİ KOLON - Kapanma Tarihi (sadece okunabilir) */}
                                                <td>
                                                    {issue.closedOn ? (
                                                        <div className="d-flex align-items-center">
                                                            <i className="bi bi-calendar-check-fill text-success me-2"></i>
                                                            <span className="text-success fw-medium">{formatDate(issue.closedOn)}</span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-muted">-</span>
                                                    )}
                                                </td>
                                                <td>
                                                    <span className={`badge ${getStatusBadgeClass(issue.statusName, issue.isClosed)}`}>
                                                        {issue.statusName}
                                                    </span>
                                                </td>
                                                <td className="text-center">
                                                    <div className="d-flex flex-column align-items-center">
                                                        <span className="fw-bold">{issue.completionPercentage}%</span>
                                                        <div className="progress" style={{ width: '60px', height: '6px' }}>
                                                            <div
                                                                className={`progress-bar ${issue.completionPercentage >= 100 ? 'bg-success' :
                                                                    issue.completionPercentage >= 50 ? 'bg-info' : 'bg-warning'
                                                                    }`}
                                                                style={{ width: `${issue.completionPercentage}%` }}
                                                            ></div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td>
                                                    <div className="d-flex align-items-center">
                                                        <span className="small">{issue.assignedTo}</span>
                                                    </div>
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

            {/* Statistics */}
            {filteredIssues.length > 0 && (
                <div className="card mt-4">
                    <div className="card-body">
                        <div className="row text-center">
                            <div className="col-md-3">
                                <div className="p-3">
                                    <h5 className="text-primary mb-1">{filteredIssues.length}</h5>
                                    <small className="text-muted">Toplam İş</small>
                                </div>
                            </div>
                            <div className="col-md-3">
                                <div className="p-3">
                                    <h5 className="text-success mb-1">
                                        {filteredIssues.filter(i => i.isClosed).length}
                                    </h5>
                                    <small className="text-muted">Tamamlanan</small>
                                </div>
                            </div>
                            <div className="col-md-3">
                                <div className="p-3">
                                    <h5 className="text-warning mb-1">
                                        {filteredIssues.filter(i => !i.isClosed).length}
                                    </h5>
                                    <small className="text-muted">Devam Eden</small>
                                </div>
                            </div>
                            <div className="col-md-3">
                                <div className="p-3">
                                    <h5 className="text-danger mb-1">
                                        {filteredIssues.filter(i => checkIfIssueOverdue(i)).length}
                                    </h5>
                                    <small className="text-muted">Gecikmiş</small>
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