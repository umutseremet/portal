// src/frontend/src/components/BOM/BOMNewWorkForm.js

import React, { useState } from 'react';
import { X, Save, FolderOpen } from 'lucide-react';

const BOMNewWorkForm = ({ projects, onClose, onCreate }) => {
  const [selectedProject, setSelectedProject] = useState('');
  const [workName, setWorkName] = useState('');

  const handleCreate = () => {
    if (selectedProject && workName.trim()) {
      onCreate(selectedProject, workName);
      setSelectedProject('');
      setWorkName('');
    }
  };

  return (
    <div className="card border-danger">
      <div className="card-header bg-danger bg-opacity-10 d-flex justify-content-between align-items-center">
        <div className="d-flex align-items-center">
          <FolderOpen size={20} className="text-danger me-2" />
          <h5 className="card-title mb-0">Yeni Çalışma Oluştur</h5>
        </div>
        <button
          onClick={onClose}
          className="btn btn-sm btn-link text-secondary p-0"
          style={{ textDecoration: 'none' }}
        >
          <X size={20} />
        </button>
      </div>

      <div className="card-body">
        <div className="row g-3 align-items-end">
          <div className="col-md-5">
            <label className="form-label fw-semibold">
              <i className="bi bi-folder me-1"></i>
              Proje <span className="text-danger">*</span>
            </label>
            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              className="form-select"
            >
              <option value="">Proje Seçiniz</option>
              {projects.map(project => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>

          <div className="col-md-5">
            <label className="form-label fw-semibold">
              <i className="bi bi-pencil me-1"></i>
              Çalışma Adı <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              value={workName}
              onChange={(e) => setWorkName(e.target.value)}
              placeholder="Örn: 2024 Q1 Revizyon"
              className="form-control"
            />
          </div>

          <div className="col-md-2">
            <button
              onClick={handleCreate}
              disabled={!selectedProject || !workName.trim()}
              className="btn btn-success w-100"
            >
              <Save size={16} className="me-1" />
              Oluştur
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BOMNewWorkForm;