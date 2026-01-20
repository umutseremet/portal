// src/frontend/src/pages/Reports/ProjectAnalyticsReportPage.js
import React, { useState, useEffect, useRef } from 'react';
import apiService from '../../services/api';
import './ProjectAnalyticsReportPage.css';
import Chartist from 'chartist';
import 'chartist/dist/chartist.min.css';

const ProjectAnalyticsReportPage = () => {
    const [projects, setProjects] = useState([]);
    const [filteredProjects, setFilteredProjects] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    
    const chartsRendered = useRef(new Set());

    // Load projects on mount
    useEffect(() => {
        loadProjects();
        
        // Auto-refresh every 5 minutes
        const interval = setInterval(() => {
            loadProjects();
        }, 5 * 60 * 1000);
        
        return () => clearInterval(interval);
    }, []);

    // Filter projects when search term changes
    useEffect(() => {
        if (searchTerm.trim() === '') {
            setFilteredProjects(projects);
        } else {
            const filtered = projects.filter(project =>
                project.projectCode?.toLowerCase().includes(searchTerm.toLowerCase())
            );
            setFilteredProjects(filtered);
        }
        
        // Reset rendered charts when filtered projects change
        chartsRendered.current.clear();
    }, [searchTerm, projects]);

    // Render charts when filtered projects change
    useEffect(() => {
        if (filteredProjects.length > 0) {
            // Add delay to ensure DOM is ready
            setTimeout(() => {
                filteredProjects.forEach((project, index) => {
                    const chartId = getChartId(project, index);
                    if (!chartsRendered.current.has(chartId)) {
                        renderProjectChart(chartId, project);
                        chartsRendered.current.add(chartId);
                    }
                });
            }, 100);
        }
    }, [filteredProjects]);

    const loadProjects = async () => {
        try {
            setLoading(true);
            setError(null);
            
            const data = await apiService.getProjectAnalytics();
            setProjects(data);
            setFilteredProjects(data);
            
            console.log('✅ Projects loaded:', data.length);
        } catch (err) {
            console.error('❌ Error loading projects:', err);
            setError('Proje verileri yüklenirken hata oluştu');
        } finally {
            setLoading(false);
        }
    };

    const getChartId = (project, index) => {
        const safeProjectCode = String(project.projectCode || `proje${index}`).replace(/[^a-zA-Z0-9_]/g, '_');
        const safeIssueId = String(project.issueId || `is${index}`).replace(/[^a-zA-Z0-9_]/g, '_');
        return `horizontal-bar-chart-${safeProjectCode}_${safeIssueId}`;
    };

    const parseProgressValue = (valueStr) => {
        if (typeof valueStr === 'string' && valueStr.trim() !== '') {
            // Turkish number format (1.234,56) to float
            const cleaned = valueStr.replace('.', '').replace(',', '.');
            return parseFloat(cleaned) || 0;
        }
        return 0;
    };

    const getMonthNameTR = (dateStr) => {
        if (!dateStr) return '';
        try {
            const datePart = dateStr.split(' ')[0];
            const parts = datePart.split('.');
            if (parts.length === 3) {
                const monthIndex = parseInt(parts[1], 10) - 1;
                const months = [
                    'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
                    'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
                ];
                return months[monthIndex] || '';
            }
            return '';
        } catch (e) {
            console.error('Tarih ayrıştırma hatası:', dateStr, e);
            return '';
        }
    };

    const renderProjectChart = (elementId, projectData) => {
        const element = document.getElementById(elementId);
        if (!element) {
            console.warn(`Chart element not found: ${elementId}`);
            return;
        }

        const tamamlanan = {
            tasarim: parseProgressValue(projectData.tamamlananTasarim),
            satinalma: parseProgressValue(projectData.tamamlananSatinalma),
            uretim: parseProgressValue(projectData.tamamlananUretim),
            montaj: parseProgressValue(projectData.tamamlananMontaj),
            elektrik: parseProgressValue(projectData.tamamlananElektrik),
            fat: parseProgressValue(projectData.tamamlananFat),
            sevkiyat: parseProgressValue(projectData.tamamlananSevkiyat),
            sat: parseProgressValue(projectData.tamamlananSat)
        };

        const calisiliyor = {
            tasarim: 0,
            satinalma: parseProgressValue(projectData.calisiliyorSatinalma),
            uretim: parseProgressValue(projectData.calisiliyorUretim),
            montaj: parseProgressValue(projectData.calisiliyorMontaj),
            elektrik: parseProgressValue(projectData.calisiliyorElektrik),
            fat: parseProgressValue(projectData.calisiliyorFat),
            sevkiyat: parseProgressValue(projectData.calisiliyorSevkiyat),
            sat: parseProgressValue(projectData.calisiliyorSat)
        };

        const data = {
            labels: ['SAT', 'Sevkiyat', 'FAT', 'Elektrik', 'Montaj', 'Üretim', 'Satınalma', 'Tasarım'],
            series: [[
                tamamlanan.sat,
                tamamlanan.sevkiyat,
                tamamlanan.fat,
                tamamlanan.elektrik,
                tamamlanan.montaj,
                tamamlanan.uretim,
                tamamlanan.satinalma,
                tamamlanan.tasarim
            ]]
        };

        const options = {
            seriesBarDistance: 15,
            reverseData: false,
            horizontalBars: true,
            axisX: {
                labelInterpolationFnc: function (value) {
                    return value + '%';
                },
                onlyInteger: true
            },
            axisY: {
                offset: 100
            },
            height: '300px',
            high: 100,
            low: 0,
            plugins: []
        };

        const chart = new Chartist.Bar(`#${elementId}`, data, options);

        // Add tooltips and working bars
        chart.on('draw', function (context) {
            if (context.type === 'bar') {
                const meta = context.meta;
                const value = context.value.x;
                const label = data.labels[context.index];

                context.element._node.addEventListener('mouseenter', function () {
                    const tooltip = document.createElement('div');
                    tooltip.className = 'chartist-tooltip tooltip-show';
                    tooltip.textContent = `${label}: ${value.toFixed(2)}%`;
                    document.body.appendChild(tooltip);

                    const rect = this.getBoundingClientRect();
                    tooltip.style.left = rect.left + (rect.width / 2) - (tooltip.offsetWidth / 2) + 'px';
                    tooltip.style.top = rect.top - tooltip.offsetHeight - 10 + 'px';

                    this._tooltip = tooltip;
                });

                context.element._node.addEventListener('mouseleave', function () {
                    if (this._tooltip) {
                        this._tooltip.remove();
                        this._tooltip = null;
                    }
                });
            }
        });

        // Add background and working bars after chart creation
        chart.on('created', function () {
            const chartElement = document.getElementById(elementId);
            if (!chartElement) return;

            const svg = chartElement.querySelector('svg');
            if (!svg) return;

            const bars = svg.querySelectorAll('.ct-bar');
            const workingValues = [
                calisiliyor.sat, calisiliyor.sevkiyat, calisiliyor.fat,
                calisiliyor.elektrik, calisiliyor.montaj, calisiliyor.uretim,
                calisiliyor.satinalma, calisiliyor.tasarim
            ];

            bars.forEach((bar, index) => {
                const x1 = parseFloat(bar.getAttribute('x1'));
                const y1 = parseFloat(bar.getAttribute('y1'));
                const x2 = parseFloat(bar.getAttribute('x2'));

                const grids = svg.querySelector('.ct-grids');
                if (grids) {
                    const gridLines = grids.querySelectorAll('.ct-grid');
                    if (gridLines.length > 0) {
                        const lastGrid = gridLines[gridLines.length - 1];
                        const maxX = parseFloat(lastGrid.getAttribute('x1'));

                        // Background bar (100%)
                        const backgroundLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                        backgroundLine.setAttribute('class', 'ct-background-bar');
                        backgroundLine.setAttribute('x1', x1);
                        backgroundLine.setAttribute('y1', y1);
                        backgroundLine.setAttribute('x2', maxX);
                        backgroundLine.setAttribute('y2', y1);
                        bar.parentNode.insertBefore(backgroundLine, bar);

                        // Working bar (if exists)
                        const workingValue = workingValues[index];
                        if (workingValue > 0) {
                            const barWidth = x2 - x1;
                            const workingWidth = (barWidth * workingValue) / 100;
                            const workingStartX = x2;
                            const workingEndX = Math.min(workingStartX + workingWidth, maxX);

                            const workingLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                            workingLine.setAttribute('class', 'ct-working-bar');
                            workingLine.setAttribute('x1', workingStartX);
                            workingLine.setAttribute('y1', y1);
                            workingLine.setAttribute('x2', workingEndX);
                            workingLine.setAttribute('y2', y1);
                            workingLine.setAttribute('style', 'stroke: #FFF59D; stroke-width: 20px; opacity: 0.9;');
                            svg.appendChild(workingLine);
                        }
                    }
                }
            });
        });
    };

    const handleClearSearch = () => {
        setSearchTerm('');
    };

    const redmineBaseUrl = process.env.REACT_APP_REDMINE_URL || 'http://192.168.1.17:9292';

    return (
        <div className="project-analytics-report-page">
            <div className="page-header mb-4">
                <div className="d-flex justify-content-between align-items-center">
                    <div>
                        <h2 className="mb-1">
                            <i className="bi bi-bar-chart-line me-2"></i>
                            Proje Analizi Raporu
                        </h2>
                        <p className="text-muted mb-0">
                            Projelerin ilerleme durumlarını görüntüleyin
                        </p>
                    </div>
                </div>
            </div>

            {/* Search Box */}
            <div className="row mb-4">
                <div className="col-xl-12">
                    <div className="search-container">
                        <div className="row align-items-center">
                            <div className="col-lg-6">
                                <h4 className="search-title">
                                    {filteredProjects.length} Proje
                                </h4>
                            </div>
                            <div className="col-lg-6 d-flex justify-content-end">
                                <div className="input-group" style={{ maxWidth: '400px' }}>
                                    <input
                                        type="text"
                                        className="form-control"
                                        placeholder="Projelerde ara..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        autoComplete="off"
                                    />
                                    <div className="input-group-append">
                                        <button
                                            className="btn btn-clear"
                                            type="button"
                                            onClick={handleClearSearch}
                                        >
                                            <i className="bi bi-x"></i> Temizle
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Loading State */}
            {loading && (
                <div className="text-center py-5">
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Yükleniyor...</span>
                    </div>
                    <p className="mt-3 text-muted">Projeler yükleniyor...</p>
                </div>
            )}

            {/* Error State */}
            {error && (
                <div className="alert alert-danger" role="alert">
                    <i className="bi bi-exclamation-triangle me-2"></i>
                    {error}
                </div>
            )}

            {/* Projects Grid */}
            {!loading && !error && filteredProjects.length === 0 && (
                <div className="col-12">
                    <p className="text-center text-muted">Arama kriterinize uygun proje bulunamadı.</p>
                </div>
            )}

            {!loading && !error && filteredProjects.length > 0 && (
                <div className="row">
                    {filteredProjects.map((project, index) => {
                        const chartId = getChartId(project, index);
                        const fatMonth = getMonthNameTR(project.fatTarih);
                        const sevkiyatMonth = getMonthNameTR(project.sevkiyatTarih);
                        const issueLink = `${redmineBaseUrl}/issues/${project.issueId}`;

                        return (
                            <div key={`${project.issueId}-${index}`} className="col-xl-3 col-lg-6 col-md-12 mb-3">
                                <div className="card">
                                    <div className="card-header pb-2 border-0">
                                        <div className="d-flex justify-content-between align-items-flex-start w-100">
                                            <div className="flex-1 min-w-0">
                                                <h4 className="card-title mb-2 text-black fw-bold">
                                                    {project.projectCode || 'Bilgi Yok'}
                                                </h4>
                                                <div className="d-flex flex-wrap gap-3 mb-1">
                                                    <p className="fs-13 mb-0 text-nowrap">
                                                        <strong>FAT:</strong> {fatMonth || '--'}
                                                    </p>
                                                    <p className="fs-13 mb-0 text-nowrap">
                                                        <strong>Sevkiyat:</strong> {sevkiyatMonth || '--'}
                                                    </p>
                                                </div>
                                                {project.issueId ? (
                                                    <a
                                                        href={issueLink}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="fs-13 d-inline-block mt-1"
                                                    >
                                                        <strong>İş No:</strong> {project.issueId}
                                                    </a>
                                                ) : (
                                                    <p className="fs-13 mb-0 mt-1">
                                                        <strong>İş No:</strong> Belirtilmemiş
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="card-body pt-1 pb-2">
                                        <div id={chartId} className="ct-chart ct-golden-section chartlist-chart"></div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default ProjectAnalyticsReportPage;