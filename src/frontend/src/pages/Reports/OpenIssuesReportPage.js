// src/frontend/src/pages/Reports/OpenIssuesReportPage.js
import React, { useState, useEffect, useRef } from 'react';
import apiService from '../../services/api';
import './OpenIssuesReportPage.css';

const OpenIssuesReportPage = () => {
    // State Management
    const [issues, setIssues] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Filter States
    const [filters, setFilters] = useState({
        assignedToIds: [],
        trackerIds: [],
        projectIds: [],
        createdAfter: '',
        createdBefore: '',
        searchTerm: '',
        emptyDateFilter: ''
    });

    // Date preset state
    const [datePreset, setDatePreset] = useState('');

    // Dropdown Data
    const [users, setUsers] = useState([]);
    const [trackers, setTrackers] = useState([]);
    const [projects, setProjects] = useState([]);

    // Dropdown States
    const [dropdownOpen, setDropdownOpen] = useState({
        assignedTo: false,
        tracker: false,
        project: false
    });

    const [dropdownSearch, setDropdownSearch] = useState({
        assignedTo: '',
        tracker: '',
        project: ''
    });

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const [totalCount, setTotalCount] = useState(0);
    const pageSize = 20;

    // Export state
    const [exporting, setExporting] = useState(false);

    // Refs for dropdown close
    const dropdownRefs = {
        assignedTo: useRef(null),
        tracker: useRef(null),
        project: useRef(null)
    };

    // Load initial data
    useEffect(() => {
        loadDropdownData();
        loadIssues();
    }, []);

    // Load issues when filters or pagination changes
    useEffect(() => {
        loadIssues();
    }, [currentPage, filters]);

    // Close dropdowns on outside click
    useEffect(() => {
        const handleClickOutside = (event) => {
            Object.keys(dropdownRefs).forEach(key => {
                if (dropdownRefs[key].current && !dropdownRefs[key].current.contains(event.target)) {
                    setDropdownOpen(prev => ({ ...prev, [key]: false }));
                }
            });
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const loadDropdownData = async () => {
        try {
            const [usersData, trackersData, projectsData] = await Promise.all([
                apiService.getReportUsers(),
                apiService.getReportTrackers(),
                apiService.getReportProjects()
            ]);

            setUsers(usersData);
            setTrackers(trackersData);
            setProjects(projectsData);
        } catch (err) {
            console.error('Error loading dropdown data:', err);
            setError('Dropdown verileri yüklenirken hata oluştu');
        }
    };

    const loadIssues = async () => {
        setLoading(true);
        setError(null);

        try {
            const response = await apiService.getOpenIssues({
                ...filters,
                page: currentPage,
                pageSize: pageSize
            });

            setIssues(response.issues);
            setTotalPages(response.totalPages);
            setTotalCount(response.totalCount);
        } catch (err) {
            console.error('Error loading issues:', err);
            setError('İşler yüklenirken hata oluştu');
        } finally {
            setLoading(false);
        }
    };

    // Date preset helper functions
    const getDatePresetRange = (preset) => {
        const now = new Date();
        let startDate, endDate;

        switch (preset) {
            case 'last-2-hours':
                startDate = new Date(now.getTime() - (2 * 60 * 60 * 1000));
                endDate = now;
                break;

            case 'today':
                startDate = new Date(now.setHours(0, 0, 0, 0));
                endDate = new Date(now.setHours(23, 59, 59, 999));
                break;

            case 'yesterday':
                const yesterday = new Date(now);
                yesterday.setDate(yesterday.getDate() - 1);
                startDate = new Date(yesterday.setHours(0, 0, 0, 0));
                endDate = new Date(yesterday.setHours(23, 59, 59, 999));
                break;

            case 'tomorrow':
                const tomorrow = new Date(now);
                tomorrow.setDate(tomorrow.getDate() + 1);
                startDate = new Date(tomorrow.setHours(0, 0, 0, 0));
                endDate = new Date(tomorrow.setHours(23, 59, 59, 999));
                break;

            case 'this-week':
                const startOfWeek = new Date(now);
                const dayOfWeek = startOfWeek.getDay();
                const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Monday as first day
                startOfWeek.setDate(startOfWeek.getDate() + diff);
                startDate = new Date(startOfWeek.setHours(0, 0, 0, 0));

                const endOfWeek = new Date(startOfWeek);
                endOfWeek.setDate(endOfWeek.getDate() + 6);
                endDate = new Date(endOfWeek.setHours(23, 59, 59, 999));
                break;

            case 'next-week':
                const nextWeekStart = new Date(now);
                const currentDay = nextWeekStart.getDay();
                const daysToMonday = currentDay === 0 ? 1 : 8 - currentDay;
                nextWeekStart.setDate(nextWeekStart.getDate() + daysToMonday);
                startDate = new Date(nextWeekStart.setHours(0, 0, 0, 0));

                const nextWeekEnd = new Date(startDate);
                nextWeekEnd.setDate(nextWeekEnd.getDate() + 6);
                endDate = new Date(nextWeekEnd.setHours(23, 59, 59, 999));
                break;

            case 'last-week':
                const lastWeekStart = new Date(now);
                const currentDayLast = lastWeekStart.getDay();
                const daysToLastMonday = currentDayLast === 0 ? -6 : 1 - currentDayLast - 7;
                lastWeekStart.setDate(lastWeekStart.getDate() + daysToLastMonday);
                startDate = new Date(lastWeekStart.setHours(0, 0, 0, 0));

                const lastWeekEnd = new Date(startDate);
                lastWeekEnd.setDate(lastWeekEnd.getDate() + 6);
                endDate = new Date(lastWeekEnd.setHours(23, 59, 59, 999));
                break;

            case 'this-month':
                startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
                endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
                break;

            case 'last-30-days':
                startDate = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
                startDate.setHours(0, 0, 0, 0);
                endDate = now;
                break;

            default:
                return null;
        }

        // Format to datetime-local input format
        const formatToDateTimeLocal = (date) => {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            const hours = String(date.getHours()).padStart(2, '0');
            const minutes = String(date.getMinutes()).padStart(2, '0');
            return `${year}-${month}-${day}T${hours}:${minutes}`;
        };

        return {
            createdAfter: formatToDateTimeLocal(startDate),
            createdBefore: formatToDateTimeLocal(endDate)
        };
    };

    const handleDatePresetChange = (preset) => {
        setDatePreset(preset);

        if (!preset) {
            // Clear date filters
            handleFilterChange('createdAfter', '');
            handleFilterChange('createdBefore', '');
            return;
        }

        const dateRange = getDatePresetRange(preset);
        if (dateRange) {
            setFilters(prev => ({
                ...prev,
                createdAfter: dateRange.createdAfter,
                createdBefore: dateRange.createdBefore
            }));
            setCurrentPage(1);
        }
    };

    const handleFilterChange = (filterKey, value) => {
        // If manually changing date filters, clear preset
        if (filterKey === 'createdAfter' || filterKey === 'createdBefore') {
            setDatePreset('');
        }

        setFilters(prev => ({
            ...prev,
            [filterKey]: value
        }));
        setCurrentPage(1);
    };

    const toggleDropdown = (key) => {
        setDropdownOpen(prev => ({
            ...prev,
            [key]: !prev[key]
        }));
    };

    const handleCheckboxChange = (filterKey, id) => {
        const currentValues = filters[filterKey] || [];
        const newValues = currentValues.includes(id)
            ? currentValues.filter(val => val !== id)
            : [...currentValues, id];

        handleFilterChange(filterKey, newValues);
    };

    const handleSelectAll = (filterKey, allIds) => {
        const currentValues = filters[filterKey] || [];
        const allSelected = allIds.every(id => currentValues.includes(id));

        if (allSelected) {
            handleFilterChange(filterKey, []);
        } else {
            handleFilterChange(filterKey, allIds);
        }
    };

    const getFilteredList = (key, items) => {
        const searchTerm = dropdownSearch[key].toLowerCase();
        if (!searchTerm) return items;

        return items.filter(item => {
            const name = key === 'assignedTo' ? item.fullName : item.name;
            return name.toLowerCase().includes(searchTerm);
        });
    };

    const resetFilters = () => {
        setFilters({
            assignedToIds: [],
            trackerIds: [],
            projectIds: [],
            createdAfter: '',
            createdBefore: '',
            searchTerm: '',
            emptyDateFilter: ''
        });
        setDatePreset('');
        setCurrentPage(1);
    };

    const handleExportToExcel = async () => {
        setExporting(true);
        try {
            await apiService.exportOpenIssuesToExcel(filters);
            // Success notification could be added here
        } catch (err) {
            console.error('Error exporting to Excel:', err);
            setError('Excel dosyası oluşturulurken hata oluştu');
        } finally {
            setExporting(false);
        }
    };

    const hasActiveFilters =
        filters.assignedToIds.length > 0 ||
        filters.trackerIds.length > 0 ||
        filters.projectIds.length > 0 ||
        filters.createdAfter ||
        filters.createdBefore ||
        filters.searchTerm ||
        filters.emptyDateFilter;

    const renderMultiSelectDropdown = (filterKey, label, icon, items, displayKey) => {
        const isOpen = dropdownOpen[filterKey];
        const keyMap = {
            'assignedTo': 'assignedToIds',
            'tracker': 'trackerIds',
            'project': 'projectIds'
        };
        const selectedCount = filters[keyMap[filterKey]].length;
        const filteredItems = getFilteredList(filterKey, items);

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

                            <div className="px-3 py-2 border-bottom">
                                <div className="form-check">
                                    <input
                                        className="form-check-input"
                                        type="checkbox"
                                        checked={filteredItems.length > 0 && filteredItems.every(item => {
                                            return filters[keyMap[filterKey]].includes(item.id);
                                        })}
                                        onChange={() => {
                                            handleSelectAll(keyMap[filterKey], filteredItems.map(item => item.id));
                                        }}
                                        id={`${filterKey}-all`}
                                    />
                                    <label className="form-check-label fw-bold" htmlFor={`${filterKey}-all`}>
                                        Tümünü Seç
                                    </label>
                                </div>
                            </div>

                            {filteredItems.length === 0 ? (
                                <div className="px-3 py-2 text-center text-muted">
                                    <i className="bi bi-search me-1"></i>
                                    Sonuç bulunamadı
                                </div>
                            ) : (
                                filteredItems.map(item => {
                                    const isChecked = filters[keyMap[filterKey]].includes(item.id);
                                    const displayName = displayKey === 'fullName' ? item.fullName : item.name;

                                    return (
                                        <div key={item.id} className="px-3 py-2 dropdown-item-custom">
                                            <div className="form-check">
                                                <input
                                                    className="form-check-input"
                                                    type="checkbox"
                                                    checked={isChecked}
                                                    onChange={() => handleCheckboxChange(keyMap[filterKey], item.id)}
                                                    id={`${filterKey}-${item.id}`}
                                                />
                                                <label
                                                    className="form-check-label"
                                                    htmlFor={`${filterKey}-${item.id}`}
                                                    style={{ cursor: 'pointer' }}
                                                >
                                                    {displayName}
                                                </label>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    )}
                </div>
            </div>
        );
    };

    const formatDateTime = (dateString) => {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date.toLocaleString('tr-TR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date.toLocaleDateString('tr-TR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    return (
        <div className="open-issues-report-page">
            <div className="page-header mb-4">
                <div className="d-flex justify-content-between align-items-center">
                    <div>
                        <h2 className="mb-1">
                            <i className="bi bi-clipboard-data me-2"></i>
                            Açık İşler Raporu
                        </h2>
                        <p className="text-muted mb-0">Vervo İş Takip Sistemi'ndeki açık işleri görüntüleyin ve filtreleyin</p>
                    </div>
                    <div>
                        <button
                            className="btn btn-success"
                            onClick={handleExportToExcel}
                            disabled={exporting || loading}
                        >
                            {exporting ? (
                                <>
                                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                    Excel Hazırlanıyor...
                                </>
                            ) : (
                                <>
                                    <i className="bi bi-file-earmark-excel me-2"></i>
                                    Excel'e Aktar
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            <div className="card shadow-sm mb-4">
                <div className="card-header bg-light">
                    <h5 className="mb-0">
                        <i className="bi bi-funnel me-2"></i>
                        Filtreler
                    </h5>
                </div>
                <div className="card-body">
                    <div className="row g-3">

                        {/* Project Multi-Select */}
                        {renderMultiSelectDropdown('project', 'Proje', 'folder', projects, 'name')}
                        {/* Tracker Multi-Select */}
                        {renderMultiSelectDropdown('tracker', 'İş Tipi', 'tag', trackers, 'name')}
                        {/* Assigned To Multi-Select */}
                        {renderMultiSelectDropdown('assignedTo', 'Atanan', 'person', users, 'fullName')}

                        {/* Empty Date Filter Dropdown */}
                        <div className="col-md-3">
                            <label className="form-label small fw-bold">
                                <i className="bi bi-calendar-x me-1"></i>
                                Boş Tarih Filtresi
                            </label>
                            <select
                                className="form-select form-select-sm"
                                value={filters.emptyDateFilter}
                                onChange={(e) => handleFilterChange('emptyDateFilter', e.target.value)}
                            >
                                <option value="">Tümü</option>
                                <option value="empty-order-date">Sipariş Tarihi Boş</option>
                                <option value="empty-deadline-date">Termin Tarihi Boş</option>
                                <option value="empty-planning-dates">Planlama Tarihleri Boş</option>
                            </select>
                        </div>
                    </div>

                    <div className="row g-3 mt-2">
                        {/* Date Preset Dropdown */}
                        <div className="col-md-3">
                            <label className="form-label small fw-bold">
                                <i className="bi bi-calendar-check me-1"></i>
                                Hızlı Tarih
                            </label>
                            <select
                                className="form-select form-select-sm"
                                value={datePreset}
                                onChange={(e) => handleDatePresetChange(e.target.value)}
                            >
                                <option value="">Manuel</option>
                                <option value="last-2-hours">Son 2 Saat</option>
                                <option value="today">Bugün</option>
                                <option value="yesterday">Dün</option>
                                <option value="tomorrow">Yarın</option>
                                <option value="this-week">Bu Hafta</option>
                                <option value="last-week">Geçen Hafta</option>
                                <option value="next-week">Gelecek Hafta</option>
                                <option value="this-month">Bu Ay</option>
                                <option value="last-30-days">Son 30 Gün</option>
                            </select>
                        </div>

                        {/* Search - moved next to Date Preset */}
                        <div className="col-md-3">
                            <label className="form-label small fw-bold">
                                <i className="bi bi-search me-1"></i>
                                Arama
                            </label>
                            <input
                                type="text"
                                className="form-control form-control-sm"
                                placeholder="İş no veya konu..."
                                value={filters.searchTerm}
                                onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Manual Date Range */}
                    <div className="row g-3 mt-1">
                        <div className="col-md-12">
                            <label className="form-label small fw-bold">
                                <i className="bi bi-calendar-range me-1"></i>
                                Oluşturulma Tarihi (Detaylı)
                                {datePreset && (
                                    <span className="badge bg-info ms-2">
                                        {datePreset === 'last-2-hours' && 'Son 2 Saat'}
                                        {datePreset === 'today' && 'Bugün'}
                                        {datePreset === 'yesterday' && 'Dün'}
                                        {datePreset === 'tomorrow' && 'Yarın'}
                                        {datePreset === 'this-week' && 'Bu Hafta'}
                                        {datePreset === 'last-week' && 'Geçen Hafta'}
                                        {datePreset === 'next-week' && 'Önümüzdeki Hafta'}
                                        {datePreset === 'this-month' && 'Bu Ay'}
                                        {datePreset === 'last-30-days' && 'Son 30 Gün'}
                                    </span>
                                )}
                            </label>
                            <div className="row g-2">
                                <div className="col-md-6">
                                    <input
                                        type="datetime-local"
                                        className="form-control form-control-sm"
                                        value={filters.createdAfter}
                                        onChange={(e) => handleFilterChange('createdAfter', e.target.value)}
                                    />
                                    <small className="text-muted">Başlangıç</small>
                                </div>
                                <div className="col-md-6">
                                    <input
                                        type="datetime-local"
                                        className="form-control form-control-sm"
                                        value={filters.createdBefore}
                                        onChange={(e) => handleFilterChange('createdBefore', e.target.value)}
                                    />
                                    <small className="text-muted">Bitiş</small>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Reset Button */}
                    {hasActiveFilters && (
                        <div className="row mt-3">
                            <div className="col-12">
                                <button className="btn btn-outline-secondary btn-sm" onClick={resetFilters}>
                                    <i className="bi bi-x-circle me-1"></i>
                                    Filtreleri Temizle
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {loading ? (
                <div className="text-center py-5">
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Yükleniyor...</span>
                    </div>
                    <p className="mt-3 text-muted">İşler yükleniyor...</p>
                </div>
            ) : error ? (
                <div className="alert alert-danger">
                    <i className="bi bi-exclamation-triangle me-2"></i>
                    {error}
                </div>
            ) : (
                <>
                    <div className="card shadow-sm mb-3">
                        <div className="card-body">
                            <div className="d-flex justify-content-between align-items-center">
                                <div>
                                    <h6 className="mb-0">
                                        <i className="bi bi-list-check me-2"></i>
                                        Toplam: <strong>{totalCount}</strong> açık iş
                                    </h6>
                                </div>
                                <div className="text-muted small">
                                    Sayfa {currentPage} / {totalPages}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="card shadow-sm">
                        <div className="card-body p-0">
                            <div className="table-responsive">
                                <table className="table table-hover mb-0">
                                    <thead className="table-light">
                                        <tr>
                                            <th style={{ width: '80px' }}>İş No</th>
                                            <th>İş Açıklaması</th>
                                            <th style={{ width: '120px' }}>İş Tipi</th>
                                            <th style={{ width: '120px' }}>Durum</th>
                                            <th style={{ width: '120px' }}>Atanan</th>
                                            <th style={{ width: '120px' }}>Oluşturan</th>
                                            <th style={{ width: '130px' }}>Oluşturma</th>
                                            <th style={{ width: '110px' }}>Sipariş</th>
                                            <th style={{ width: '110px' }}>Termin</th>
                                            <th style={{ width: '110px' }}>Plan Baş.</th>
                                            <th style={{ width: '110px' }}>Plan Bit.</th>
                                            <th style={{ width: '80px' }}>Link</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {issues.length === 0 ? (
                                            <tr>
                                                <td colSpan="12" className="text-center py-5 text-muted">
                                                    <i className="bi bi-inbox display-4 d-block mb-3"></i>
                                                    Açık iş bulunamadı
                                                </td>
                                            </tr>
                                        ) : (
                                            issues.map((issue) => (
                                                <tr key={issue.issueId}>
                                                    <td>
                                                        <span className="badge bg-primary">#{issue.issueId}</span>
                                                    </td>
                                                    <td>
                                                        <div className="text-truncate" style={{ maxWidth: '300px' }}>
                                                            {issue.subject}
                                                        </div>
                                                        <small className="text-muted d-block">
                                                            {issue.projectName}
                                                        </small>
                                                    </td>
                                                    <td>
                                                        <span className="badge bg-secondary">{issue.trackerName}</span>
                                                    </td>
                                                    <td>
                                                        <span className="badge bg-info">{issue.statusName}</span>
                                                    </td>
                                                    <td>
                                                        <small>{issue.assignedTo}</small>
                                                    </td>
                                                    <td>
                                                        <small>{issue.createdBy}</small>
                                                    </td>
                                                    <td>
                                                        <small>{formatDateTime(issue.createdOn)}</small>
                                                    </td>
                                                    <td>
                                                        <small className={!issue.orderDate ? 'text-danger fw-bold' : ''}>
                                                            {formatDate(issue.orderDate) === '-' ? '❌ Boş' : formatDate(issue.orderDate)}
                                                        </small>
                                                    </td>
                                                    <td>
                                                        <small className={!issue.deadlineDate ? 'text-danger fw-bold' : ''}>
                                                            {formatDate(issue.deadlineDate) === '-' ? '❌ Boş' : formatDate(issue.deadlineDate)}
                                                        </small>
                                                    </td>
                                                    <td>
                                                        <small className={!issue.plannedStartDate ? 'text-warning' : ''}>
                                                            {formatDate(issue.plannedStartDate)}
                                                        </small>
                                                    </td>
                                                    <td>
                                                        <small className={!issue.plannedEndDate ? 'text-warning' : ''}>
                                                            {formatDate(issue.plannedEndDate)}
                                                        </small>
                                                    </td>
                                                    <td>
                                                        <a
                                                            href={`http://192.168.1.17:9292/issues/${issue.issueId}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="btn btn-sm btn-outline-primary"
                                                            title="Redmine'da aç"
                                                        >
                                                            <i className="bi bi-box-arrow-up-right"></i>
                                                        </a>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    {totalPages > 1 && (
                        <div className="d-flex justify-content-center mt-4">
                            <nav>
                                <ul className="pagination">
                                    <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                                        <button
                                            className="page-link"
                                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                            disabled={currentPage === 1}
                                        >
                                            <i className="bi bi-chevron-left"></i>
                                        </button>
                                    </li>

                                    {[...Array(Math.min(5, totalPages))].map((_, idx) => {
                                        let pageNum;
                                        if (totalPages <= 5) {
                                            pageNum = idx + 1;
                                        } else if (currentPage <= 3) {
                                            pageNum = idx + 1;
                                        } else if (currentPage >= totalPages - 2) {
                                            pageNum = totalPages - 4 + idx;
                                        } else {
                                            pageNum = currentPage - 2 + idx;
                                        }

                                        return (
                                            <li
                                                key={pageNum}
                                                className={`page-item ${currentPage === pageNum ? 'active' : ''}`}
                                            >
                                                <button
                                                    className="page-link"
                                                    onClick={() => setCurrentPage(pageNum)}
                                                >
                                                    {pageNum}
                                                </button>
                                            </li>
                                        );
                                    })}

                                    <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                                        <button
                                            className="page-link"
                                            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                            disabled={currentPage === totalPages}
                                        >
                                            <i className="bi bi-chevron-right"></i>
                                        </button>
                                    </li>
                                </ul>
                            </nav>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default OpenIssuesReportPage;