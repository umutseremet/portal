// src/frontend/src/pages/IssueDetailsPage.js
// ✅ DROPDOWN ÇOKLU SEÇİM FİLTRELEME VERSİYONU

import React, { useState, useEffect, useRef, useMemo } from 'react';
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

    // ✅ ÇOKLU SEÇİM İÇİN FİLTRE STATE
    const [filters, setFilters] = useState({
        projectIds: [],
        productionTypes: [],
        statuses: [],
        assignedTos: []
    });

    // ✅ DROPDOWN AÇIK/KAPALI STATE'LERİ
    const [dropdownOpen, setDropdownOpen] = useState({
        project: false,
        productionType: false,
        status: false,
        assignedTo: false
    });

    // ✅ DROPDOWN ARAMA STATE'LERİ
    const [dropdownSearch, setDropdownSearch] = useState({
        project: '',
        productionType: '',
        status: '',
        assignedTo: ''
    });

    // PAGINATION
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 50;

    // ✅ DROPDOWN REF'LERİ (dışarı tıklamada kapatmak için)
    const dropdownRefs = {
        project: useRef(null),
        productionType: useRef(null),
        status: useRef(null),
        assignedTo: useRef(null)
    };

    useEffect(() => {
        if (selectedDate) {
            fetchIssueDetails();
        }
    }, [selectedDate, selectedGroup]); // ✅ filters'ı kaldırdık, filtre değişince backend'e gitmesin

    // ✅ Filtre değişince frontend'de filtrele
    useEffect(() => {
        if (issues.length > 0) {
            applyFrontendFilters(issues);
        }
    }, [filters]);

    // ✅ Sadece arama filtresi
    useEffect(() => {
        if (!searchTerm) {
            return;
        }

        const searchLower = searchTerm.toLowerCase();
        const filtered = filteredIssues.filter(issue => {
            return (
                issue.issueId?.toString().includes(searchLower) ||
                issue.subject?.toLowerCase().includes(searchLower) ||
                issue.projectName?.toLowerCase().includes(searchLower) ||
                issue.projectCode?.toLowerCase().includes(searchLower)
            );
        });

        setFilteredIssues(filtered);
    }, [searchTerm]);

    // ✅ Dışarı tıklamada dropdown'ları kapat
    useEffect(() => {
        const handleClickOutside = (event) => {
            Object.entries(dropdownRefs).forEach(([key, ref]) => {
                if (ref.current && !ref.current.contains(event.target)) {
                    setDropdownOpen(prev => ({ ...prev, [key]: false }));
                }
            });
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

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

            // ✅ GEÇİCİ: Backend henüz POST desteklemiyorsa GET kullan
            if (selectedGroup) {
                const params = {
                    date: formattedDate,
                    projectId: selectedGroup.projectId,
                    productionType: selectedGroup.productionType
                };
                response = await apiService.getIssuesByDateAndType(params);
            } else {
                // Filtresiz tüm veriyi al
                response = await apiService.getIssuesByDate(formattedDate);
            }

            const issuesData = response.issues || [];
            console.log('📊 Fetched issues:', issuesData.length);
            setIssues(issuesData);

            // Frontend'de filtreleme yap
            applyFrontendFilters(issuesData);

        } catch (err) {
            console.error('❌ Error fetching issue details:', err);
            setError(err.message || 'İşler yüklenirken bir hata oluştu');
        } finally {
            setLoading(false);
        }
    };

    // ✅ FRONTEND FİLTRELEME FONKSİYONU
    const applyFrontendFilters = (issuesData) => {
        let filtered = [...issuesData];

        // Proje filtresi
        if (filters.projectIds.length > 0) {
            filtered = filtered.filter(i => filters.projectIds.includes(i.projectId));
        }

        // Üretim tipi filtresi
        if (filters.productionTypes.length > 0) {
            filtered = filtered.filter(i => {
                const prodType = i.trackerName?.replace('Üretim - ', '').trim();
                return filters.productionTypes.includes(prodType);
            });
        }

        // Durum filtresi
        if (filters.statuses.length > 0) {
            filtered = filtered.filter(i => filters.statuses.includes(i.statusName));
        }

        // Atanan filtresi
        if (filters.assignedTos.length > 0) {
            filtered = filtered.filter(i => filters.assignedTos.includes(i.assignedTo));
        }

        console.log('🔍 Filtered issues:', filtered.length);
        setFilteredIssues(filtered);
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
                plannedEndDate: field === 'plannedEndDate' ? tempDate : null
            };

            await apiService.updateIssuePlannedDate(requestData);

            setIssues(prevIssues => prevIssues.map(i =>
                i.issueId === issue.issueId ? { ...i, [field]: tempDate } : i
            ));

            setFilteredIssues(prevFiltered => prevFiltered.map(i =>
                i.issueId === issue.issueId ? { ...i, [field]: tempDate } : i
            ));

            setEditingDateCell(null);
            setTempDate('');
        } catch (err) {
            console.error('❌ Error saving date:', err);
            alert(err.message || 'Tarih kaydedilemedi');
        } finally {
            setSavingDate(false);
        }
    };

    const handleCancelDateEdit = () => {
        setEditingDateCell(null);
        setTempDate('');
    };

    const formatDateForInput = (dateStr) => {
        if (!dateStr || dateStr.startsWith('0001-01-01')) return '';
        return dateStr.split('T')[0];
    };

    const formatDateDisplay = (dateStr) => {
        if (!dateStr || dateStr.startsWith('0001-01-01')) return '-';
        try {
            const date = new Date(dateStr);
            return date.toLocaleDateString('tr-TR');
        } catch {
            return '-';
        }
    };

    // REVİZE TARİH MODAL İŞLEMLERİ
    const handleOpenRevisedModal = (issue) => {
        setSelectedIssueForRevise(issue);
        setTempRevisedStartDate(formatDateForInput(issue.revisedPlannedStartDate) || '');
        setTempRevisedEndDate(formatDateForInput(issue.revisedPlannedEndDate) || '');
        setTempRevisedDescription(issue.revisedPlanDescription || '');
        setShowRevisedModal(true);
    };

    const handleCloseRevisedModal = () => {
        setShowRevisedModal(false);
        setSelectedIssueForRevise(null);
        setTempRevisedStartDate('');
        setTempRevisedEndDate('');
        setTempRevisedDescription('');
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
            const requestData = {
                issueId: selectedIssueForRevise.issueId,
                revisedPlannedStartDate: tempRevisedStartDate || null,
                revisedPlannedEndDate: tempRevisedEndDate || null,
                revisedPlanDescription: tempRevisedDescription.trim() || null
            };

            await apiService.updateIssueRevisedDate(requestData);

            setIssues(prevIssues => prevIssues.map(i =>
                i.issueId === selectedIssueForRevise.issueId
                    ? {
                        ...i,
                        revisedPlannedStartDate: tempRevisedStartDate || i.revisedPlannedStartDate,
                        revisedPlannedEndDate: tempRevisedEndDate || i.revisedPlannedEndDate,
                        revisedPlanDescription: tempRevisedDescription.trim() || i.revisedPlanDescription
                    }
                    : i
            ));

            setFilteredIssues(prevFiltered => prevFiltered.map(i =>
                i.issueId === selectedIssueForRevise.issueId
                    ? {
                        ...i,
                        revisedPlannedStartDate: tempRevisedStartDate || i.revisedPlannedStartDate,
                        revisedPlannedEndDate: tempRevisedEndDate || i.revisedPlannedEndDate,
                        revisedPlanDescription: tempRevisedDescription.trim() || i.revisedPlanDescription
                    }
                    : i
            ));

            handleCloseRevisedModal();
        } catch (err) {
            console.error('❌ Error saving revised dates:', err);
            alert(err.message || 'Revize tarihleri kaydedilemedi');
        } finally {
            setSavingRevised(false);
        }
    };

    const handleClearRevised = async () => {
        if (!selectedIssueForRevise) return;

        if (!window.confirm('Revize bilgilerini silmek istediğinizden emin misiniz?')) {
            return;
        }

        setClearingRevised(true);

        try {
            const requestData = {
                issueId: selectedIssueForRevise.issueId,
                revisedPlannedStartDate: null,
                revisedPlannedEndDate: null,
                revisedPlanDescription: null
            };

            await apiService.updateIssueRevisedDate(requestData);

            setIssues(prevIssues => prevIssues.map(i =>
                i.issueId === selectedIssueForRevise.issueId
                    ? {
                        ...i,
                        revisedPlannedStartDate: null,
                        revisedPlannedEndDate: null,
                        revisedPlanDescription: null
                    }
                    : i
            ));

            setFilteredIssues(prevFiltered => prevFiltered.map(i =>
                i.issueId === selectedIssueForRevise.issueId
                    ? {
                        ...i,
                        revisedPlannedStartDate: null,
                        revisedPlannedEndDate: null,
                        revisedPlanDescription: null
                    }
                    : i
            ));

            handleCloseRevisedModal();
        } catch (err) {
            console.error('❌ Error clearing revised dates:', err);
            alert(err.message || 'Revize bilgileri silinemedi');
        } finally {
            setClearingRevised(false);
        }
    };

    const renderDateCell = (issue, field, label) => {
        const cellKey = `${issue.issueId}-${field}`;
        const isEditing = editingDateCell === cellKey;
        const dateValue = issue[field];
        const displayValue = formatDateDisplay(dateValue);

        return (
            <td className="date-cell">
                {isEditing ? (
                    <div className="d-flex align-items-center gap-1">
                        <input
                            type="date"
                            className="form-control form-control-sm"
                            value={tempDate}
                            onChange={(e) => setTempDate(e.target.value)}
                            autoFocus
                            style={{ width: '140px', fontSize: '0.8rem' }}
                        />
                        <button
                            className="btn btn-sm btn-success"
                            onClick={() => handleSaveDate(issue, field)}
                            disabled={savingDate}
                            title="Kaydet"
                        >
                            <i className="bi bi-check"></i>
                        </button>
                        <button
                            className="btn btn-sm btn-secondary"
                            onClick={handleCancelDateEdit}
                            disabled={savingDate}
                            title="İptal"
                        >
                            <i className="bi bi-x"></i>
                        </button>
                    </div>
                ) : (
                    <div
                        className="date-display"
                        onClick={() => {
                            setEditingDateCell(cellKey);
                            setTempDate(formatDateForInput(dateValue));
                        }}
                        title={`${label} düzenlemek için tıklayın`}
                    >
                        {displayValue}
                    </div>
                )}
            </td>
        );
    };

    const renderRevisedDateCell = (issue) => {
        const hasRevisedStart = issue.revisedPlannedStartDate && !issue.revisedPlannedStartDate.startsWith('0001-01-01');
        const hasRevisedEnd = issue.revisedPlannedEndDate && !issue.revisedPlannedEndDate.startsWith('0001-01-01');
        const hasRevision = hasRevisedStart || hasRevisedEnd;

        return (
            <td className="text-center">
                {hasRevision ? (
                    <div className="d-flex flex-column align-items-center gap-1">
                        {hasRevisedStart && (
                            <small className="text-primary fw-bold">
                                {formatDateDisplay(issue.revisedPlannedStartDate)}
                            </small>
                        )}
                        {hasRevisedEnd && (
                            <small className="text-primary fw-bold">
                                {formatDateDisplay(issue.revisedPlannedEndDate)}
                            </small>
                        )}
                        <button
                            className="btn btn-sm btn-outline-primary"
                            onClick={() => handleOpenRevisedModal(issue)}
                            title="Revize bilgilerini düzenle"
                        >
                            <i className="bi bi-pencil"></i>
                        </button>
                    </div>
                ) : (
                    <button
                        className="btn btn-sm btn-outline-secondary"
                        onClick={() => handleOpenRevisedModal(issue)}
                        title="Revize tarihi ekle"
                    >
                        <i className="bi bi-plus"></i> Ekle
                    </button>
                )}
            </td>
        );
    };

    const renderRevisedDescriptionCell = (issue) => {
        return (
            <td className="text-start" style={{ maxWidth: '200px' }}>
                {issue.revisedPlanDescription ? (
                    <div
                        className="text-muted small"
                        title={issue.revisedPlanDescription}
                        style={{
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            cursor: 'pointer'
                        }}
                        onClick={() => handleOpenRevisedModal(issue)}
                    >
                        {issue.revisedPlanDescription.length > 25
                            ? issue.revisedPlanDescription.substring(0, 25) + '...'
                            : issue.revisedPlanDescription}
                    </div>
                ) : (
                    <span className="text-muted" style={{ fontSize: '0.75rem' }}>-</span>
                )}
            </td>
        );
    };

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

    // ✅ DROPDOWN TOGGLE FONKSİYONU
    const toggleDropdown = (filterKey) => {
        setDropdownOpen(prev => ({
            ...prev,
            [filterKey]: !prev[filterKey]
        }));
    };

    // ✅ DROPDOWN SEÇİM TOGGLE FONKSİYONU
    const handleMultiSelectToggle = (filterKey, value) => {
        const mappedKey = filterKey === 'project' ? 'projectIds'
            : filterKey === 'productionType' ? 'productionTypes'
            : filterKey === 'status' ? 'statuses'
            : 'assignedTos';

        setFilters(prev => {
            const currentValues = prev[mappedKey];
            const newValues = currentValues.includes(value)
                ? currentValues.filter(v => v !== value)
                : [...currentValues, value];
            
            return { ...prev, [mappedKey]: newValues };
        });
    };

    // ✅ DROPDOWN TEMİZLE
    const handleClearFilter = (filterKey) => {
        const mappedKey = filterKey === 'project' ? 'projectIds'
            : filterKey === 'productionType' ? 'productionTypes'
            : filterKey === 'status' ? 'statuses'
            : 'assignedTos';

        setFilters(prev => ({ ...prev, [mappedKey]: [] }));
    };

    // ✅ TÜMÜNÜ SEÇ/KALDIR
    const handleSelectAll = (filterKey, allItems) => {
        const mappedKey = filterKey === 'project' ? 'projectIds'
            : filterKey === 'productionType' ? 'productionTypes'
            : filterKey === 'status' ? 'statuses'
            : 'assignedTos';

        const currentValues = filters[mappedKey];
        const allSelected = allItems.every(item => currentValues.includes(item));

        if (allSelected) {
            setFilters(prev => ({ ...prev, [mappedKey]: [] }));
        } else {
            setFilters(prev => ({ ...prev, [mappedKey]: [...allItems] }));
        }
    };

    // ✅ TÜMÜNÜ SIFIRLA
    const resetFilters = () => {
        setFilters({
            projectIds: [],
            productionTypes: [],
            statuses: [],
            assignedTos: []
        });
        setSearchTerm('');
        setShowFilters(false);
    };

    const hasActiveFilters = 
        filters.projectIds.length > 0 || 
        filters.productionTypes.length > 0 ||
        filters.statuses.length > 0 || 
        filters.assignedTos.length > 0 || 
        searchTerm;

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

    // ✅ UNIQUE DEĞERLERİ MEMOIZE ET
    const uniqueProjects = useMemo(() => {
        return [...new Map(issues.map(i => [i.projectId, {
            id: i.projectId,
            code: i.projectCode,
            name: i.projectName
        }])).values()];
    }, [issues]);

    const productionTypeList = useMemo(() => {
        return [...new Set(issues.map(i =>
            i.trackerName?.replace('Üretim - ', '').trim()
        ).filter(Boolean))];
    }, [issues]);

    const statusList = useMemo(() => {
        return [...new Set(issues.map(i => i.statusName).filter(Boolean))];
    }, [issues]);

    const assigneeList = useMemo(() => {
        return [...new Set(issues.map(i => i.assignedTo).filter(Boolean))];
    }, [issues]);

    // ✅ DROPDOWN İÇİN FİLTRELENMİŞ LİSTELER
    const getFilteredList = (filterKey, allList) => {
        const searchTerm = dropdownSearch[filterKey].toLowerCase();
        if (!searchTerm) return allList;

        if (filterKey === 'project') {
            return allList.filter(p => 
                p.code.toLowerCase().includes(searchTerm) ||
                p.name.toLowerCase().includes(searchTerm)
            );
        }

        return allList.filter(item => 
            (typeof item === 'string' ? item : item.toString()).toLowerCase().includes(searchTerm)
        );
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
                    Tarih bilgisi bulunamadı.
                </div>
            </div>
        );
    }

    // ✅ DROPDOWN RENDER FONKSİYONU
    const renderDropdownFilter = (filterKey, label, icon, allItems, displayFunc = null) => {
        const mappedKey = filterKey === 'project' ? 'projectIds'
            : filterKey === 'productionType' ? 'productionTypes'
            : filterKey === 'status' ? 'statuses'
            : 'assignedTos';

        const selectedCount = filters[mappedKey].length;
        const isOpen = dropdownOpen[filterKey];
        const filteredItems = getFilteredList(filterKey, allItems);

        return (
            <div className="col-md-3" ref={dropdownRefs[filterKey]}>
                <label className="form-label small fw-bold">
                    <i className={`bi bi-${icon} me-1`}></i>
                    {label}
                    {selectedCount > 0 && (
                        <span className="badge bg-primary ms-2">{selectedCount}</span>
                    )}
                </label>
                <div className="position-relative">
                    <button
                        className={`btn btn-outline-secondary w-100 d-flex justify-content-between align-items-center ${selectedCount > 0 ? 'btn-outline-primary' : ''}`}
                        onClick={() => toggleDropdown(filterKey)}
                        type="button"
                    >
                        <span className="text-truncate">
                            {selectedCount === 0 ? 'Seçiniz' : `${selectedCount} seçili`}
                        </span>
                        <i className={`bi bi-chevron-${isOpen ? 'up' : 'down'}`}></i>
                    </button>

                    {isOpen && (
                        <div className="dropdown-menu show w-100" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                            {/* Arama */}
                            <div className="px-3 py-2 border-bottom bg-light">
                                <input
                                    type="text"
                                    className="form-control form-control-sm"
                                    placeholder="Ara..."
                                    value={dropdownSearch[filterKey]}
                                    onChange={(e) => setDropdownSearch(prev => ({
                                        ...prev,
                                        [filterKey]: e.target.value
                                    }))}
                                    onClick={(e) => e.stopPropagation()}
                                />
                            </div>

                            {/* Tümünü Seç */}
                            <div className="px-3 py-2 border-bottom">
                                <div className="form-check">
                                    <input
                                        className="form-check-input"
                                        type="checkbox"
                                        checked={filteredItems.length > 0 && filteredItems.every(item => {
                                            const value = filterKey === 'project' ? item.id : item;
                                            return filters[mappedKey].includes(value);
                                        })}
                                        onChange={() => {
                                            const values = filterKey === 'project' 
                                                ? filteredItems.map(p => p.id)
                                                : filteredItems;
                                            handleSelectAll(filterKey, values);
                                        }}
                                        id={`${filterKey}-all`}
                                    />
                                    <label className="form-check-label fw-bold" htmlFor={`${filterKey}-all`}>
                                        Tümünü Seç
                                    </label>
                                </div>
                            </div>

                            {/* Seçenekler */}
                            {filteredItems.length === 0 ? (
                                <div className="px-3 py-2 text-muted">
                                    <small>Sonuç bulunamadı</small>
                                </div>
                            ) : (
                                filteredItems.map(item => {
                                    const value = filterKey === 'project' ? item.id : item;
                                    const displayText = displayFunc ? displayFunc(item) : 
                                        (filterKey === 'project' ? `${item.code} - ${item.name}` : item);
                                    const itemId = `${filterKey}-${value}`;

                                    return (
                                        <div key={itemId} className="px-3 py-1">
                                            <div className="form-check">
                                                <input
                                                    className="form-check-input"
                                                    type="checkbox"
                                                    checked={filters[mappedKey].includes(value)}
                                                    onChange={() => handleMultiSelectToggle(filterKey, value)}
                                                    id={itemId}
                                                />
                                                <label 
                                                    className="form-check-label" 
                                                    htmlFor={itemId}
                                                    style={{ fontSize: '0.9rem' }}
                                                >
                                                    {displayText}
                                                </label>
                                            </div>
                                        </div>
                                    );
                                })
                            )}

                            {/* Temizle Butonu */}
                            {selectedCount > 0 && (
                                <div className="px-3 py-2 border-top">
                                    <button
                                        className="btn btn-sm btn-outline-danger w-100"
                                        onClick={() => handleClearFilter(filterKey)}
                                    >
                                        <i className="bi bi-x-circle me-1"></i>
                                        Temizle
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="container-fluid py-4">
            {/* Header */}
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h4 className="mb-1">
                        <i className="bi bi-calendar-check me-2 text-primary"></i>
                        İş Detayları
                    </h4>
                    <p className="text-muted mb-0">
                        <strong>Tarih:</strong> {formatDateDisplay(selectedDate)}
                        {selectedGroup && (
                            <>
                                {' | '}
                                <strong>Proje:</strong> {selectedGroup.projectCode}
                                {' | '}
                                <strong>Tip:</strong> {selectedGroup.productionType}
                            </>
                        )}
                    </p>
                </div>
                <button
                    className="btn btn-outline-secondary"
                    onClick={handleBackToCalendar}
                >
                    <i className="bi bi-arrow-left me-2"></i>
                    Takvime Dön
                </button>
            </div>

            {/* Filters Card */}
            <div className="card mb-3">
                <div className="card-header d-flex justify-content-between align-items-center">
                    <h6 className="mb-0">
                        <i className="bi bi-funnel me-2"></i>
                        Filtreler
                        {hasActiveFilters && (
                            <span className="badge bg-primary ms-2">Aktif</span>
                        )}
                    </h6>
                    <div className="d-flex gap-2">
                        <button
                            className="btn btn-sm btn-outline-primary"
                            onClick={() => setShowFilters(!showFilters)}
                        >
                            <i className={`bi bi-chevron-${showFilters ? 'up' : 'down'} me-1`}></i>
                            {showFilters ? 'Gizle' : 'Göster'}
                        </button>
                    </div>
                </div>
                {showFilters && (
                    <div className="card-body">
                        <div className="row g-3">
                            {/* Proje Dropdown */}
                            {renderDropdownFilter('project', 'Proje', 'folder', uniqueProjects)}

                            {/* İş Tipi Dropdown */}
                            {renderDropdownFilter('productionType', 'İş Tipi', 'gear', productionTypeList)}

                            {/* Durum Dropdown */}
                            {renderDropdownFilter('status', 'Durum', 'flag', statusList)}

                            {/* Atanan Dropdown */}
                            {renderDropdownFilter('assignedTo', 'Atanan', 'person', assigneeList)}
                        </div>

                        {/* Arama */}
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

                        {/* Filtreleri Temizle Butonu */}
                        {hasActiveFilters && (
                            <div className="row mt-3">
                                <div className="col-12">
                                    <button
                                        className="btn btn-sm btn-outline-secondary"
                                        onClick={resetFilters}
                                    >
                                        <i className="bi bi-x-circle me-2"></i>
                                        Tüm Filtreleri Temizle
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
                            <table className="table table-hover table-sm mb-0">
                                <thead className="table-light sticky-top">
                                    <tr>
                                        <th style={{ width: '80px' }} className="text-center">İş No</th>
                                        <th style={{ width: '120px' }}>Proje</th>
                                        <th style={{ minWidth: '200px' }}>Konu</th>
                                        <th style={{ width: '120px' }} className="text-center">İş Tipi</th>
                                        <th style={{ width: '100px' }} className="text-center">Durum</th>
                                        <th style={{ width: '120px' }}>Atanan</th>
                                        <th style={{ width: '110px' }} className="text-center">Plan Başlangıç</th>
                                        <th style={{ width: '110px' }} className="text-center">Plan Bitiş</th>
                                        <th style={{ width: '130px' }} className="text-center">Revize Tarih</th>
                                        <th style={{ width: '150px' }} className="text-center">Revize Açıklama</th>
                                        <th style={{ width: '100px' }} className="text-center">Grup Parça Adeti</th>
                                        <th style={{ width: '80px' }} className="text-center">İlerme</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {currentIssues.map(issue => (
                                        <tr
                                            key={issue.issueId}
                                            className={checkIfIssueOverdue(issue) ? 'table-danger' : ''}
                                        >
                                            <td className="text-center">
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
                                                <small className="text-muted d-block">{issue.projectCode}</small>
                                                <small>{issue.projectName}</small>
                                            </td>
                                            <td>
                                                <div className="text-truncate" title={issue.subject} style={{ maxWidth: '300px' }}>
                                                    {issue.subject}
                                                </div>
                                            </td>
                                            <td className="text-center">
                                                <span className="badge bg-secondary">
                                                    {issue.trackerName?.replace('Üretim - ', '')}
                                                </span>
                                            </td>
                                            <td className="text-center">
                                                <span className={`badge ${getStatusBadgeClass(issue.statusName, issue.isClosed)}`}>
                                                    {issue.statusName}
                                                </span>
                                            </td>
                                            <td>{issue.assignedTo}</td>
                                            {renderDateCell(issue, 'plannedStartDate', 'Planlanan Başlangıç')}
                                            {renderDateCell(issue, 'plannedEndDate', 'Planlanan Bitiş')}
                                            {renderRevisedDateCell(issue)}
                                            {renderRevisedDescriptionCell(issue)}
                                            {renderGroupQuantityCell(issue)}
                                            <td className="text-center">
                                                <div className="progress" style={{ height: '20px' }}>
                                                    <div
                                                        className="progress-bar"
                                                        role="progressbar"
                                                        style={{ width: `${issue.completionPercentage}%` }}
                                                        aria-valuenow={issue.completionPercentage}
                                                        aria-valuemin="0"
                                                        aria-valuemax="100"
                                                    >
                                                        {issue.completionPercentage}%
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="card-footer">
                            <div className="d-flex justify-content-between align-items-center">
                                <small className="text-muted">
                                    Toplam {filteredIssues.length} iş, {currentPage}/{totalPages} sayfa
                                </small>
                                <nav>
                                    <ul className="pagination pagination-sm mb-0">
                                        <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                                            <button
                                                className="page-link"
                                                onClick={() => paginate(currentPage - 1)}
                                                disabled={currentPage === 1}
                                            >
                                                Önceki
                                            </button>
                                        </li>
                                        {[...Array(totalPages)].map((_, idx) => (
                                            <li
                                                key={idx + 1}
                                                className={`page-item ${currentPage === idx + 1 ? 'active' : ''}`}
                                            >
                                                <button
                                                    className="page-link"
                                                    onClick={() => paginate(idx + 1)}
                                                >
                                                    {idx + 1}
                                                </button>
                                            </li>
                                        ))}
                                        <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                                            <button
                                                className="page-link"
                                                onClick={() => paginate(currentPage + 1)}
                                                disabled={currentPage === totalPages}
                                            >
                                                Sonraki
                                            </button>
                                        </li>
                                    </ul>
                                </nav>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* No Results */}
            {!loading && !error && filteredIssues.length === 0 && issues.length > 0 && (
                <div className="alert alert-info">
                    <i className="bi bi-info-circle me-2"></i>
                    Filtrelere uygun iş bulunamadı.
                </div>
            )}

            {!loading && !error && issues.length === 0 && (
                <div className="alert alert-warning">
                    <i className="bi bi-exclamation-triangle me-2"></i>
                    Bu tarih için iş bulunamadı.
                </div>
            )}

            {/* Summary Stats */}
            {!loading && !error && filteredIssues.length > 0 && (
                <div className="card mt-3">
                    <div className="card-body">
                        <h6 className="mb-3">
                            <i className="bi bi-graph-up me-2"></i>
                            Özet İstatistikler
                        </h6>
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

            {/* Revise Modal */}
            {showRevisedModal && selectedIssueForRevise && (
                <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog modal-lg">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">
                                    <i className="bi bi-calendar-event me-2"></i>
                                    Revize Plan Tarihleri
                                </h5>
                                <button
                                    type="button"
                                    className="btn-close"
                                    onClick={handleCloseRevisedModal}
                                    disabled={savingRevised || clearingRevised}
                                ></button>
                            </div>
                            <div className="modal-body">
                                <div className="alert alert-info">
                                    <strong>İş #{selectedIssueForRevise.issueId}:</strong> {selectedIssueForRevise.subject}
                                </div>

                                <div className="row mb-3">
                                    <div className="col-md-6">
                                        <label className="form-label fw-bold">Orijinal Plan Başlangıç</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            value={formatDateDisplay(selectedIssueForRevise.plannedStartDate)}
                                            disabled
                                        />
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label fw-bold">Orijinal Plan Bitiş</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            value={formatDateDisplay(selectedIssueForRevise.plannedEndDate)}
                                            disabled
                                        />
                                    </div>
                                </div>

                                <hr />

                                <div className="row mb-3">
                                    <div className="col-md-6">
                                        <label className="form-label fw-bold text-primary">
                                            <i className="bi bi-calendar-check me-1"></i>
                                            Revize Plan Başlangıç
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
                                            Revize Plan Bitiş
                                        </label>
                                        <input
                                            type="date"
                                            className="form-control"
                                            value={tempRevisedEndDate}
                                            onChange={(e) => setTempRevisedEndDate(e.target.value)}
                                        />
                                    </div>
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
                                    onClick={handleClearRevised}
                                    disabled={savingRevised || clearingRevised}
                                >
                                    {clearingRevised ? (
                                        <>
                                            <span className="spinner-border spinner-border-sm me-2"></span>
                                            Siliniyor...
                                        </>
                                    ) : (
                                        <>
                                            <i className="bi bi-trash me-2"></i>
                                            Revize Bilgilerini Sil
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
                                            <i className="bi bi-check-lg me-2"></i>
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
    );
};

export default IssueDetailsPage;