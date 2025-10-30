// src/frontend/src/components/BOM/BOMWorkList.js

import React, { useState } from 'react';
import { Search, Plus, FolderOpen, Trash2 } from 'lucide-react';
import BOMNewWorkForm from './BOMNewWorkForm';
import BOMWorkListTable from './BOMWorkListTable';

const BOMWorkList = ({ existingWorks, onOpenWork, onDeleteWork, onCreateWork }) => {
  const [showNewWorkForm, setShowNewWorkForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Örnek proje listesi
  const projects = [
    { id: 1, name: 'Proje Alpha - Web Geliştirme' },
    { id: 2, name: 'Proje Beta - Mobil Uygulama' },
    { id: 3, name: 'Proje Gamma - ERP Sistemi' },
    { id: 4, name: 'Proje Delta - CRM Entegrasyonu' }
  ];

  // Filtreleme
  const filteredWorks = existingWorks.filter(work => {
    const searchLower = searchTerm.toLowerCase();
    return (
      work.workName.toLowerCase().includes(searchLower) ||
      work.projectName.toLowerCase().includes(searchLower)
    );
  });

  const handleCreateNewWork = (selectedProject, workName) => {
    const newWork = {
      id: Date.now(),
      projectId: parseInt(selectedProject),
      projectName: projects.find(p => p.id === parseInt(selectedProject))?.name,
      workName: workName,
      createdAt: new Date().toLocaleString('tr-TR'),
      excelCount: 0,
      totalRows: 0
    };
    onCreateWork(newWork);
    setShowNewWorkForm(false);
  };

  return (
    <>
      {/* Page Header */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="d-flex justify-content-between align-items-start flex-wrap">
            <div className="page-header mb-3 mb-md-0">
              <h2 className="page-title mb-2">BOM Listesi Aktarımı</h2>
              <p className="page-subtitle text-muted">
                Mevcut çalışmaları görüntüleyin veya yeni çalışma oluşturun
              </p>
            </div>
            <div className="page-actions">
              <button
                onClick={() => setShowNewWorkForm(!showNewWorkForm)}
                className="btn btn-danger"
              >
                <i className="bi bi-plus-lg me-1"></i>
                Yeni Çalışma
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* New Work Form */}
      {showNewWorkForm && (
        <div className="row mb-4">
          <div className="col-12">
            <BOMNewWorkForm
              projects={projects}
              onClose={() => setShowNewWorkForm(false)}
              onCreate={handleCreateNewWork}
            />
          </div>
        </div>
      )}

      {/* Works List */}
      <div className="row">
        <div className="col-12">
          <div className="card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h5 className="card-title mb-0">Mevcut Çalışmalar</h5>
              
              <div className="position-relative" style={{ width: '320px' }}>
                <Search 
                  size={16} 
                  style={{
                    position: 'absolute',
                    left: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#6c757d',
                    zIndex: 1
                  }}
                />
                <input
                  type="text"
                  placeholder="Çalışma veya proje ara..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="form-control form-control-sm"
                  style={{ paddingLeft: '40px' }}
                />
              </div>
            </div>

            <div className="card-body">
              {filteredWorks.length > 0 ? (
                <BOMWorkListTable
                  works={filteredWorks}
                  onOpenWork={onOpenWork}
                  onDeleteWork={onDeleteWork}
                />
              ) : (
                <div className="text-center py-5">
                  <FolderOpen size={64} color="#adb5bd" className="mb-3" />
                  <p className="text-muted mb-1">
                    {searchTerm ? 'Arama kriterine uygun çalışma bulunamadı' : 'Henüz çalışma oluşturulmamış'}
                  </p>
                  <p className="text-muted small">
                    {searchTerm ? 'Farklı bir arama terimi deneyin' : 'Yukarıdaki "Yeni Çalışma" butonunu kullanarak başlayın'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default BOMWorkList;