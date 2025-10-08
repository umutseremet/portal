// src/frontend/src/components/WeeklyCalendar/CalendarNavigation.js
import React, { useState } from 'react';

const CalendarNavigation = ({ 
  weekStart, 
  weekEnd, 
  loading,
  onPrevious, 
  onNext, 
  onToday,
  // Filtre props'ları
  filters,
  projectList,
  productionTypes,
  onFilterChange,
  onResetFilters,
  // Proje legend props'ları
  projectLegend
}) => {
  const [showFilters, setShowFilters] = useState(false);
  const [showLegend, setShowLegend] = useState(false);

  const formatDisplayDate = (dateInput) => {
    try {
      const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
      
      if (!(date instanceof Date) || isNaN(date.getTime())) {
        return '-';
      }
      
      return date.toLocaleDateString('tr-TR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    } catch (error) {
      console.error('Error formatting navigation date:', error);
      return '-';
    }
  };

  const handleFilterChange = (field, value) => {
    onFilterChange({ [field]: value });
  };

  const hasActiveFilters = filters.projectId || filters.productionType !== 'all';

  return (
    <div className="card mb-4">
      <div className="card-body">
        {/* Navigation Satırı */}
        <div className="d-flex justify-content-between align-items-center mb-0">
          <button
            className="btn btn-outline-secondary"
            onClick={onPrevious}
            disabled={loading}
          >
            <i className="bi bi-chevron-left me-2"></i>
            Önceki Hafta
          </button>

          <div className="text-center">
            <h5 className="mb-0">
              {formatDisplayDate(weekStart)} - {formatDisplayDate(weekEnd)}
            </h5>
          </div>

          <div className="d-flex gap-2">
            
            
            {/* Proje Renkleri Butonu */}
            <button
              className={`btn ${showLegend ? 'btn-info' : 'btn-outline-info'}`}
              onClick={() => {
                setShowLegend(!showLegend);
                if (!showLegend) setShowFilters(false); // Diğerini kapat
              }}
            >
              <i className={`bi bi-palette${showLegend ? '-fill' : ''} me-2`}></i>
              Proje Renkleri
              {projectLegend && projectLegend.length > 0 && (
                <span className="badge bg-light text-dark ms-2">{projectLegend.length}</span>
              )}
            </button>
            
            {/* Filtrele Butonu */}
            <button
              className={`btn ${hasActiveFilters ? 'btn-outline-secondary' : 'btn-outline-secondary'} ${showFilters ? 'btn-outline-secondary' : ''} position-relative`}
              onClick={() => {
                setShowFilters(!showFilters);
                if (!showFilters) setShowLegend(false); // Diğerini kapat
              }}
            >
              <i className={`bi bi-funnel${showFilters ? '-fill' : ''} me-2`}></i>
              Filtrele
              {hasActiveFilters && (
                <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
                  !
                </span>
              )}
            </button>
            <button
              className="btn btn-outline-primary"
              onClick={onToday}
              disabled={loading}
            >
              <i className="bi bi-calendar-today me-2"></i>
              Bugün
            </button>
            <button
              className="btn btn-outline-secondary"
              onClick={onNext}
              disabled={loading}
            >
              Sonraki Hafta
              <i className="bi bi-chevron-right ms-2"></i>
            </button>
          </div>
        </div>

        {/* Filtre Alanı - Açılır/Kapanır */}
        {showFilters && (
          <div className="filter-collapse-area">
            <hr className="my-3" />
            <div className="row g-3">
              <div className="col-lg-4 col-md-6">
                <label className="form-label fw-semibold">
                  <i className="bi bi-folder me-1"></i>
                  Proje
                </label>
                <select
                  className="form-select"
                  value={filters.projectId}
                  onChange={(e) => handleFilterChange('projectId', e.target.value)}
                >
                  <option value="">Tüm Projeler</option>
                  {projectList.map(project => (
                    <option key={project.id} value={project.id}>
                      {project.code || project.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-lg-4 col-md-6">
                <label className="form-label fw-semibold">
                  <i className="bi bi-gear me-1"></i>
                  İş Tipi
                </label>
                <select
                  className="form-select"
                  value={filters.productionType}
                  onChange={(e) => handleFilterChange('productionType', e.target.value)}
                >
                  <option value="all">Tümü</option>
                  {productionTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div className="col-lg-4 col-md-12 d-flex align-items-end">
                <button
                  className="btn btn-outline-danger w-100"
                  onClick={() => {
                    onResetFilters();
                    setShowFilters(false);
                  }}
                  disabled={!hasActiveFilters}
                >
                  <i className="bi bi-x-circle me-2"></i>
                  Filtreleri Temizle
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Proje Renk Kodları Alanı - Açılır/Kapanır */}
        {showLegend && projectLegend && projectLegend.length > 0 && (
          <div className="legend-collapse-area">
            <hr className="my-3" />
            <div className="project-legend-grid">
              {projectLegend.map((project, index) => (
                <div key={index} className="project-legend-item">
                  <div 
                    className="project-color-box"
                    style={{ backgroundColor: project.color }}
                  ></div>
                  <div className="project-info">
                    <span className="project-code">{project.code}</span>
                    <span className="project-name text-muted">{project.name}</span>
                  </div> 
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CalendarNavigation;