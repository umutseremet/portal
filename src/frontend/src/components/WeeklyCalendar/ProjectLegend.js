// src/frontend/src/components/WeeklyCalendar/ProjectLegend.js
import React, { useState } from 'react';

const ProjectLegend = ({ projects }) => {
  const [showLegend, setShowLegend] = useState(false);

  if (!projects || projects.length === 0) {
    return null;
  }

  return (
    <div className="card mb-4">
      <div className="card-body">
        {/* Header ile Toggle Butonu */}
        <div className="d-flex justify-content-between align-items-center">
          <h6 className="card-title mb-0">
            <i className="bi bi-palette me-2"></i>
            Proje Renk Kodları
            <span className="badge bg-secondary ms-2">{projects.length} proje</span>
          </h6>
          <button
            className="btn btn-sm btn-outline-secondary"
            onClick={() => setShowLegend(!showLegend)}
          >
            <i className={`bi bi-chevron-${showLegend ? 'up' : 'down'} me-1`}></i>
            {showLegend ? 'Gizle' : 'Göster'}
          </button>
        </div>

        {/* Açılır/Kapanır Legend İçeriği */}
        {showLegend && (
          <div className="project-legend-collapse">
            <hr className="my-3" />
            <div className="project-legend-container">
              {projects.map((project, index) => (
                <div key={index} className="project-legend-item">
                  <div 
                    className="project-color-box"
                    style={{ backgroundColor: project.color }}
                  ></div>
                  <div className="project-info">
                    <span className="project-code">{project.code}</span>
                    <span className="project-name text-muted">{project.name}</span>
                  </div>
                  <span className="project-count badge bg-secondary ms-auto">
                    {project.count} iş
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectLegend;