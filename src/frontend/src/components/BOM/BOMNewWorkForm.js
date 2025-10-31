// src/frontend/src/components/BOM/BOMNewWorkForm.js

import React, { useState, useEffect } from 'react';
import { X, Save, FolderOpen, AlertCircle } from 'lucide-react';
import apiService from '../../services/api';

const BOMNewWorkForm = ({ onClose, onCreate }) => {
  const [selectedProject, setSelectedProject] = useState('');
  const [workName, setWorkName] = useState('');
  const [projects, setProjects] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [projectsError, setProjectsError] = useState(null);

  // Component mount olduğunda projeleri çek
  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setLoadingProjects(true);
      setProjectsError(null);

      // NOT: Redmine password'ü kullanıcıdan almak yerine,
      // backend'de JWT token ile birlikte stored password kullanabilirsiniz
      // veya login sırasında şifreyi session'da tutabilirsiniz
      const projectsList = await apiService.getProjects({
        status: 1, // Sadece aktif projeler
        limit: 100
      });

      setProjects(projectsList || []);
      console.log('✅ Projects loaded:', projectsList);
    } catch (error) {
      console.error('❌ Error loading projects:', error);
      setProjectsError('Projeler yüklenirken hata oluştu. Lütfen tekrar deneyin.');
      
      // Hata durumunda boş liste göster
      setProjects([]);
    } finally {
      setLoadingProjects(false);
    }
  };

  const handleCreate = () => {
    if (selectedProject && workName.trim()) {
      const project = projects.find(p => p.id === parseInt(selectedProject));
      if (project) {
        onCreate(selectedProject, project.name, workName);
        setSelectedProject('');
        setWorkName('');
      }
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && selectedProject && workName.trim()) {
      handleCreate();
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
          title="Kapat"
        >
          <X size={20} />
        </button>
      </div>

      <div className="card-body">
        {/* Projeler yüklenirken hata varsa göster */}
        {projectsError && (
          <div className="alert alert-warning alert-dismissible fade show mb-3" role="alert">
            <AlertCircle size={16} className="me-2" />
            {projectsError}
            <button
              type="button"
              className="btn btn-sm btn-link text-warning ms-2"
              onClick={fetchProjects}
            >
              Tekrar Dene
            </button>
            <button 
              type="button" 
              className="btn-close" 
              onClick={() => setProjectsError(null)}
            ></button>
          </div>
        )}

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
              disabled={loadingProjects}
            >
              <option value="">
                {loadingProjects ? 'Projeler yükleniyor...' : 'Proje Seçiniz'}
              </option>
              {projects.map(project => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
            {!loadingProjects && projects.length === 0 && !projectsError && (
              <small className="text-muted">Proje bulunamadı</small>
            )}
            {!loadingProjects && !selectedProject && projects.length > 0 && (
              <small className="text-muted">Lütfen bir proje seçin</small>
            )}
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
              onKeyPress={handleKeyPress}
              placeholder="Örn: 2024 Q1 Revizyon"
              className="form-control"
              maxLength={255}
              disabled={loadingProjects}
            />
            {!workName.trim() && (
              <small className="text-muted">Lütfen bir çalışma adı girin</small>
            )}
          </div>

          <div className="col-md-2">
            <button
              onClick={handleCreate}
              disabled={!selectedProject || !workName.trim() || loadingProjects}
              className="btn btn-success w-100"
              title="Çalışma Oluştur"
            >
              {loadingProjects ? (
                <>
                  <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                  Yükleniyor
                </>
              ) : (
                <>
                  <Save size={16} className="me-1" />
                  Oluştur
                </>
              )}
            </button>
          </div>
        </div>

        <div className="row mt-3">
          <div className="col-12">
            <div className="alert alert-info mb-0 py-2">
              <i className="bi bi-info-circle me-2"></i>
              <small>
                Yeni çalışma oluşturduktan sonra Excel dosyalarınızı yükleyebilirsiniz.
                {loadingProjects && ' Projeler Redmine\'dan yükleniyor...'}
              </small>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BOMNewWorkForm;