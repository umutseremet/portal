import React, { useEffect } from 'react';
import apiService from '../../services/api';
import './ProjectAnalyticsReportPage.css';
import Chartist from 'chartist';
import 'chartist/dist/chartist.min.css';

const ProjectAnalyticsReportPage = () => {
    useEffect(() => {
        let allProjects = [];

        const parseProgressValue = (valueStr) => {
            if (typeof valueStr === 'string' && valueStr.trim() !== '') {
                return parseFloat(valueStr);
            }
            return 0;
        };

        const getMonthNameTR = (dateStr) => {
            if (!dateStr) return "";
            try {
                const datePart = dateStr.split(' ')[0];
                const parts = datePart.split('.');
                if (parts.length === 3) {
                    const monthIndex = parseInt(parts[1], 10) - 1;
                    const months = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
                    return months[monthIndex] || "";
                }
                return "";
            } catch (e) {
                console.error("Tarih ayrıştırma hatası:", dateStr, e);
                return "";
            }
        };

        const filterProjects = (searchTerm) => {
            const filteredProjects = allProjects.filter(project => {
                const projectCode = (project.projectCode || '').toLowerCase();
                return projectCode.includes(searchTerm.toLowerCase());
            });
            renderProjects(filteredProjects);
        };

        const renderProjects = (projects) => {
            const container = document.getElementById('project-charts-container');
            if (!container) return;

            container.innerHTML = '';

            if (projects.length === 0) {
                container.innerHTML = '<div class="col-12"><p class="text-center text-muted">Arama kriterinize uygun proje bulunamadı.</p></div>';
                return;
            }

            // ✅ Sidebar durumunu kontrol et
            const mainContent = document.querySelector('.main-content');
            const isSidebarCollapsed = mainContent && mainContent.classList.contains('sidebar-collapsed');

            // ✅ Sidebar açıkken 3 kart, kapalıyken 4 kart
            const colClass = isSidebarCollapsed ? 'col-xl-3 col-lg-4 col-md-6' : 'col-xl-4 col-lg-6 col-md-12';

            projects.forEach((project, index) => {
                const safeProjectCode = String(project.projectCode || `proje${index}`).replace(/[^a-zA-Z0-9_]/g, '_');
                const safeIssueId = String(project.issueId || `is${index}`).replace(/[^a-zA-Z0-9_]/g, '_');
                const chartId = `horizontal-bar-chart-${safeProjectCode}_${safeIssueId}`;
                const fatMonth = getMonthNameTR(project.fatTarih);
                const sevkiyatMonth = getMonthNameTR(project.sevkiyatTarih);
                const issueLink = `http://192.168.1.17:9292/issues/${project.issueId}`;

                const projectCardHTML = `
            <div class="${colClass} mb-3">
                <div class="card"> 
                    <div class="card-header pb-2 border-bottom">
                        <div style="display: flex; justify-content: space-between; align-items: flex-start; width: 100%;">
                            <div style="flex: 1; min-width: 0;"> 
                                <h4 class="card-title mb-2 text-black font-weight-bold">${project.projectCode || 'Bilgi Yok'}</h4>
                                <div style="display: flex; flex-wrap: wrap; gap: 15px; margin-bottom: 5px;">
                                    <p class="fs-13 mb-0" style="white-space: nowrap;">
                                        <strong>FAT:</strong> ${fatMonth || '--'}
                                    </p>
                                    <p class="fs-13 mb-0" style="white-space: nowrap;">
                                        <strong>Sevkiyat:</strong> ${sevkiyatMonth || '--'}
                                    </p>
                                </div>
                                ${project.issueId ? `
                                <div class="fs-13 mb-2" style="margin-top: 5px;">
                                    <a href="${issueLink}" target="_blank" style="color: #007bff; text-decoration: none;">
                                        <strong>İş No:</strong> #${project.issueId}
                                    </a>
                                    <span class="text-muted mx-2">|</span>
                                    <strong>Tasarım Sorumlusu:</strong> 
                                    <span class="text-primary">${project.tasarimSorumlusu || 'Atanmamış'}</span>
                                </div>` : `
                                <p class="fs-13 mb-0" style="margin-top: 5px;">
                                    <strong>İş No:</strong> Belirtilmemiş
                                    <span class="text-muted mx-2">|</span>
                                    <strong>Tasarım Sorumlusu:</strong> 
                                    <span class="text-primary">${project.tasarimSorumlusu || 'Atanmamış'}</span>
                                </p>`}
                            </div>
                        </div>
                    </div>
                    <div class="card-body pt-1 pb-2"> 
                        <div id="${chartId}" class="ct-chart ct-golden-section chartlist-chart"></div>
                    </div>
                </div>
            </div>
        `;

                container.insertAdjacentHTML('beforeend', projectCardHTML);
                setTimeout(() => renderProjectChart(chartId, project), 200 + (index * 50));
            });
        };

        const renderProjectChart = (elementId, projectData) => {
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

            const barColors = [
                '#FF9500', '#00A2E8', '#FE634E', '#707070',
                '#BFBFBF', '#22B14C', '#FF5722', '#9C27B0'
            ];

            const chartOptions = {
                seriesBarDistance: 10,
                reverseData: true,
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

            // renderProjectChart fonksiyonunda, chart.on('draw') event'inde:

            chart.on('draw', function (data) {
                if (data.type === 'bar') {
                    const barIndex = data.index;
                    const barColor = barColors[barIndex] || '#cccccc';
                    const correctLabel = tooltipLabels[barIndex];
                    const correctValue = tooltipValues[barIndex];

                    if (correctValue.completed === 0) {
                        data.element.attr({ 'style': 'stroke: transparent; stroke-width: 0;' });
                        return;
                    }

                    let tooltipText = correctLabel + ': ' + Math.round(correctValue.completed) + '% tamamlandı';
                    if (correctValue.working > 0) {
                        tooltipText += ', ' + Math.round(correctValue.working) + '% çalışılıyor';
                    }

                    data.element.attr({
                        'style': `stroke: ${barColor}; stroke-width: 20px;`,
                        'data-tooltip': tooltipText
                    });

                    // MOUSEENTER
                    data.element._node.addEventListener('mouseenter', function (e) {
                        // Eski tooltip'leri temizle
                        document.querySelectorAll('.chartist-tooltip').forEach(t => t.remove());

                        const tooltip = document.createElement('div');
                        tooltip.className = 'chartist-tooltip';
                        tooltip.innerHTML = e.target.getAttribute('data-tooltip');

                        // Inline style'ları ekle
                        tooltip.style.position = 'fixed';
                        tooltip.style.display = 'block';
                        tooltip.style.opacity = '1';
                        tooltip.style.zIndex = '99999';
                        tooltip.style.background = '#333';
                        tooltip.style.color = 'white';
                        tooltip.style.padding = '8px 12px';
                        tooltip.style.borderRadius = '4px';
                        tooltip.style.fontSize = '13px';
                        tooltip.style.fontWeight = '600';
                        tooltip.style.whiteSpace = 'nowrap';
                        tooltip.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.3)';
                        tooltip.style.pointerEvents = 'none';

                        document.body.appendChild(tooltip);

                        const rect = e.target.getBoundingClientRect();
                        const tooltipRect = tooltip.getBoundingClientRect();

                        const left = rect.left + (rect.width / 2) - (tooltipRect.width / 2);
                        const top = rect.top - tooltipRect.height - 10;

                        tooltip.style.left = left + 'px';
                        tooltip.style.top = top + 'px';
                    });

                    // MOUSELEAVE
                    data.element._node.addEventListener('mouseleave', function () {
                        document.querySelectorAll('.chartist-tooltip').forEach(tooltip => {
                            tooltip.remove();
                        });
                    });
                }
            });

            chart.on('created', function () {
                const chartElement = document.getElementById(elementId);
                if (chartElement) {
                    const svg = chartElement.querySelector('svg');
                    if (svg) {
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

                                    const backgroundLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                                    backgroundLine.setAttribute('class', 'ct-background-bar');
                                    backgroundLine.setAttribute('x1', x1);
                                    backgroundLine.setAttribute('y1', y1);
                                    backgroundLine.setAttribute('x2', maxX);
                                    backgroundLine.setAttribute('y2', y1);
                                    backgroundLine.setAttribute('style', 'stroke: #f8f9fa; stroke-width: 20px; opacity: 1;');
                                    bar.parentNode.insertBefore(backgroundLine, bar);

                                    const workingValue = workingValues[index];
                                    if (workingValue > 0) {
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
                                    }
                                }
                            }
                        });
                    }
                }
            });
        };

        const loadProjectCharts = async () => {
            try {
                const data = await apiService.getProjectAnalytics();
                allProjects = data;
                renderProjects(allProjects);

                // Event listener'ları ekle
                setTimeout(() => {
                    const searchInput = document.getElementById('projectSearch');
                    const clearButton = document.getElementById('clearSearch');

                    if (searchInput) {
                        searchInput.addEventListener('input', function (e) {
                            filterProjects(e.target.value.trim());
                        });
                    }

                    if (clearButton) {
                        clearButton.addEventListener('click', function () {
                            if (searchInput) {
                                searchInput.value = '';
                                renderProjects(allProjects);
                                searchInput.focus();
                            }
                        });
                    }
                }, 100);

                // ✅ YENİ: Window resize listener ekle - chart'ları yeniden çiz
                let resizeTimeout;
                window.addEventListener('resize', function () {
                    clearTimeout(resizeTimeout);
                    resizeTimeout = setTimeout(() => {
                        console.log('🔄 Window resized, re-rendering charts...');
                        renderProjects(allProjects);
                    }, 250); // 250ms debounce
                });
            } catch (error) {
                console.error("Hata:", error);
                const container = document.getElementById('project-charts-container');
                if (container) {
                    container.innerHTML = '<div class="col-12"><p class="text-danger text-center">Proje yüklenemedi: ' + error.message + '</p></div>';
                }
            }
        };

        loadProjectCharts();
    }, []);

    return (
        <div className="project-analytics-report-page">
            <div className="page-header mb-4">
                <h2 className="mb-1"><i className="bi bi-bar-chart-line me-2"></i>Projeler Dashboard</h2>
                <p className="text-muted mb-0">Projelerin ilerleme durumlarını görüntüleyin</p>
            </div>

            <div className="row mb-4">
                <div className="col-xl-12">
                    <div className="search-container">
                        <div className="row align-items-center">
                            <div className="col-lg-6">
                                <h4 className="search-title">Projeler</h4>
                            </div>
                            <div className="col-lg-6 d-flex justify-content-end">
                                <div className="input-group" style={{ maxWidth: '400px' }}>
                                    <input type="text" id="projectSearch" className="form-control" placeholder="Projelerde ara..." autoComplete="off" />
                                    <div className="input-group-append">
                                        <button className="btn btn-clear" type="button" id="clearSearch">
                                            <i className="bi bi-x"></i> Temizle
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="row">
                <div className="col-xl-12">
                    <div className="row" id="project-charts-container"></div>
                </div>
            </div>
        </div>
    );
};

export default ProjectAnalyticsReportPage;