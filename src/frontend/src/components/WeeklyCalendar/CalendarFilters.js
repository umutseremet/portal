// src/frontend/src/components/WeeklyCalendar/CalendarFilters.js
import React from 'react';

const CalendarFilters = ({ 
  filters, 
  projectList, 
  productionTypes,
  onFilterChange, 
  onResetFilters 
}) => {
  const handleChange = (field, value) => {
    onFilterChange({ [field]: value });
  };

  return (
    <div className="card mb-4">
      <div className="card-body">
        <div className="row g-3">
          {/* <div className="col-lg-3 col-md-6">
            <label className="form-label">Ana İş ID</label>
            <input
              type="number"
              className="form-control"
              placeholder="Ör: 4560"
              value={filters.parentIssueId}
              onChange={(e) => handleChange('parentIssueId', e.target.value)}
            />
            <small className="text-muted">Boş bırakılırsa tüm işler gösterilir</small>
          </div> */}

          <div className="col-lg-3 col-md-6">
            <label className="form-label">Proje</label>
            <select
              className="form-select"
              value={filters.projectId}
              onChange={(e) => handleChange('projectId', e.target.value)}
            >
              <option value="">Tüm Projeler</option>
              {projectList.map(project => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>

          <div className="col-lg-3 col-md-6">
            <label className="form-label">İş Tipi</label>
            <select
              className="form-select"
              value={filters.productionType}
              onChange={(e) => handleChange('productionType', e.target.value)}
            >
              <option value="all">Tümü</option>
              {productionTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          <div className="col-lg-3 col-md-6 d-flex align-items-end">
            <button
              className="btn btn-outline-secondary w-100"
              onClick={onResetFilters}
            >
              <i className="bi bi-x-circle me-1"></i>
              Filtreleri Temizle
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalendarFilters;