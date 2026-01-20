// src/frontend/src/pages/Reports/ProjectAnalyticsReportPage.js
// TAMAMEN YENİDEN YAZILMIŞ - ORİJİNAL ANALYTICS.JS İLE %100 UYUMLU

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

    useEffect(() => {
        loadProjects();
        const interval = setInterval(() => {
            loadProjects();
        }, 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (searchTerm.trim() === '') {
            setFilteredProjects(projects);
        } else {
            const filtered = projects.filter(project =>
                project.projectCode?.toLowerCase().includes(searchTerm.toLowerCase())
            );
            setFilteredProjects(filtered);
        }
        chartsRendered.current.clear();
    }, [searchTerm, projects]);

    useEffect(() => {
        if (filteredProjects.length > 0) {
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
                const months = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
                    'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
                return months[monthIndex] || '';
            }
            return '';
        } catch (e) {
            console.error('Tarih ayrıştırma hatası:', dateStr, e);
            return '';
        }
    };

    const renderProjectChart = (elementId, projectData) => {
        console.log('🎨 Rendering chart:', elementId);
        
        // Parse values
        const tamamlanan = {
            tasarim: parseProgressValue(projectData.tamamlananTasarim),
            satinalma: parseProgressValue(projectData.tamamlananSatinalma),
            uretim: parseProgressValue(projectData.tamamlananUretim),
            montaj: parseProgressValue(projectData.tamamlananMontaj),
            elektrik: parseProgressValue(projectData.tamamlananElektrik),
            fat: parseProgressValue(projectData.tamamlananFat),
            sat: parseProgressValue(projectData.tamamlananSat),
            sevkiyat: parseProgressValue(projectData.tamamlananSevkiyat)
        };

        const calisiliyor = {
            tasarim: 0,
            satinalma: parseProgressValue(projectData.calisiliyorSatinalma),
            uretim: parseProgressValue(projectData.calisiliyorUretim),
            montaj: parseProgressValue(projectData.calisiliyorMontaj),
            elektrik: parseProgressValue(projectData.calisiliyorElektrik),
            fat: parseProgressValue(projectData.calisiliyorFat),
            sat: parseProgressValue(projectData.calisiliyorSat),
            sevkiyat: parseProgressValue(projectData.calisiliyorSevkiyat)
        };

        console.log('📊 Tamamlanan:', tamamlanan);
        console.log('🔄 Çalışılıyor:', calisiliyor);

        // Bar colors
        const barColors = [
            '#FF9500', // Tasarım
            '#00A2E8', // Satınalma
            '#FE634E', // Üretim
            '#707070', // Montaj
            '#BFBFBF', // Elektrik
            '#22B14C', // FAT
            '#FF5722', // Sevkiyat
            '#9C27B0'  // SAT
        ];

        // Chartist options
        const chartOptions = {
            seriesBarDistance: 10,
            reverseData: true, // ÖNEMLİ!
            horizontalBars: true,
            axisY: { offset: 80 },
            axisX: {
                showGrid: true,
                showLabel: true,
                labelInterpolationFnc: value => Math.round(value)
            },
            high: 100,
            low: 0,
            chartPadding: { top: 10, right: 25, bottom: 10, left: 10 }
        };

        // Create chart
        const chart = new Chartist.Bar('#' + elementId, {
            labels: ['Tasarım', 'Satınalma', 'Üretim', 'Montaj', 'Elektrik', 'FAT', 'Sevkiyat', 'SAT'],
            series: [[
                { meta: 'Tasarım', value: tamamlanan.tasarim || 0.01, working: calisiliyor.tasarim },
                { meta: 'Satınalma', value: tamamlanan.satinalma || 0.01, working: calisiliyor.satinalma },
                { meta: 'Üretim', value: tamamlanan.uretim || 0.01, working: calisiliyor.uretim },
                { meta: 'Montaj', value: tamamlanan.montaj || 0.01, working: calisiliyor.montaj },
                { meta: 'Elektrik', value: tamamlanan.elektrik || 0.01, working: calisiliyor.elektrik },
                { meta: 'FAT', value: tamamlanan.fat || 0.01, working: calisiliyor.fat },
                { meta: 'Sevkiyat', value: tamamlanan.sevkiyat || 0.01, working: calisiliyor.sevkiyat },
                { meta: 'SAT', value: tamamlanan.sat || 0.01, working: calisiliyor.sat }
            ]]
        }, chartOptions);

        // Tooltip labels (reversed because of reverseData: true)
        const tooltipLabels = ['SAT', 'Sevkiyat', 'FAT', 'Elektrik', 'Montaj', 'Üretim', 'Satınalma', 'Tasarım'];
        const tooltipValues = [
            { completed: tamamlanan.sat, working: calisiliyor.sat },
            { completed: tamamlanan.sevkiyat, working: calisiliyor.sevkiyat },
            { completed: tamamlanan.fat, working: calisiliyor.fat },
            { completed: tamamlanan.elektrik, working: calisiliyor.elektrik },
            { completed: tamamlanan.montaj, working: calisiliyor.montaj },
            { completed: tamamlanan.uretim, working: calisiliyor.uretim },
            { completed: tamamlanan.satinalma, working: calisiliyor.satinalma },
            { completed: tamamlanan.tasarim, working: calisiliyor.tasarim }
        ];

        // Draw event - set bar colors and tooltips
        chart.on('draw', function (data) {
            if (data.type === 'bar') {
                const barIndex = data.index;
                const barColor = barColors[barIndex] || '#cccccc';
                const correctLabel = tooltipLabels[barIndex];
                const correctValue = tooltipValues[barIndex];
                
                // Hide bar if value is 0
                if (correctValue.completed === 0) {
                    data.element.attr({
                        'style': 'stroke: transparent; stroke-width: 0;'
                    });
                    return;
                }
                
                // Create tooltip text
                let tooltipText = correctLabel + ': ' + Math.round(correctValue.completed) + '% tamamlandı';
                if (correctValue.working > 0) {
                    tooltipText += ', ' + Math.round(correctValue.working) + '% çalışılıyor';
                }
                
                // Set bar color
                data.element.attr({
                    'style': `stroke: ${barColor}; stroke-width: 20px;`,
                    'data-tooltip': tooltipText
                });

                // Tooltip events
                data.element._node.addEventListener('mouseenter', function (e) {
                    // Remove any existing tooltips
                    document.querySelectorAll('.chartist-tooltip').forEach(t => t.remove());
                    
                    const tooltip = document.createElement('div');
                    tooltip.className = 'chartist-tooltip tooltip-show';
                    tooltip.innerHTML = e.target.getAttribute('data-tooltip');
                    document.body.appendChild(tooltip);

                    const rect = e.target.getBoundingClientRect();
                    tooltip.style.left = (rect.left + rect.width / 2 - tooltip.offsetWidth / 2) + 'px';
                    tooltip.style.top = (rect.top - tooltip.offsetHeight - 10) + 'px';
                    
                    console.log('📍 Tooltip position:', {
                        barRect: rect,
                        tooltipLeft: tooltip.style.left,
                        tooltipTop: tooltip.style.top
                    });
                });

                data.element._node.addEventListener('mouseleave', function () {
                    document.querySelectorAll('.chartist-tooltip').forEach(t => t.remove());
                });
            }
        });

        // Created event - add background and working bars
        chart.on('created', function() {
            console.log('✨ Chart created, adding working bars...');
            
            const chartElement = document.getElementById(elementId);
            if (!chartElement) {
                console.error('❌ Chart element not found:', elementId);
                return;
            }

            const svg = chartElement.querySelector('svg');
            if (!svg) {
                console.error('❌ SVG not found');
                return;
            }

            const bars = svg.querySelectorAll('.ct-bar');
            console.log('📊 Found', bars.length, 'bars');
            
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
                        
                        // Background bar
                        const backgroundLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                        backgroundLine.setAttribute('class', 'ct-background-bar');
                        backgroundLine.setAttribute('x1', x1);
                        backgroundLine.setAttribute('y1', y1);
                        backgroundLine.setAttribute('x2', maxX);
                        backgroundLine.setAttribute('y2', y1);
                        backgroundLine.setAttribute('style', 'stroke: #f8f9fa; stroke-width: 20px; opacity: 1;');
                        bar.parentNode.insertBefore(backgroundLine, bar);
                        
                        // Working bar
                        const workingValue = workingValues[index];
                        if (workingValue > 0) {
                            console.log(`🟡 Adding working bar for ${tooltipLabels[index]}: ${workingValue}%`);
                            
                            const barWidth = x2 - x1;
                            const workingWidth = (barWidth * workingValue) / 100;
                            const workingStartX = x2;
                            const workingEndX = workingStartX + workingWidth;
                            
                            const workingLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                            workingLine.setAttribute('class', 'ct-working-bar');
                            workingLine.setAttribute('x1', workingStartX);
                            workingLine.setAttribute('y1', y1);
                            workingLine.setAttribute('x2', Math.min(workingEndX, maxX));
                            workingLine.setAttribute('y2', y1);
                            workingLine.setAttribute('style', 'stroke: #FFEB3B; stroke-width: 20px; opacity: 0.9;');
                            
                            svg.appendChild(workingLine);
                            
                            console.log('✅ Working bar added:', {
                                label: tooltipLabels[index],
                                value: workingValue,
                                startX: workingStartX,
                                endX: Math.min(workingEndX, maxX),
                                width: workingWidth
                            });
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
                        <p className="text-muted mb-0">Projelerin ilerleme durumlarını görüntüleyin</p>
                    </div>
                </div>
            </div>

            <div className="row mb-4">
                <div className="col-xl-12">
                    <div className="search-container">
                        <div className="row align-items-center">
                            <div className="col-lg-6">
                                <h4 className="search-title">{filteredProjects.length} Proje</h4>
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
                                        <button className="btn btn-clear" type="button" onClick={handleClearSearch}>
                                            <i className="bi bi-x"></i> Temizle
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {loading && (
                <div className="text-center py-5">
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Yükleniyor...</span>
                    </div>
                    <p className="mt-3 text-muted">Projeler yükleniyor...</p>
                </div>
            )}

            {error && (
                <div className="alert alert-danger" role="alert">
                    <i className="bi bi-exclamation-triangle me-2"></i>
                    {error}
                </div>
            )}

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