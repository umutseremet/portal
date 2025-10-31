// src/frontend/src/components/BOM/BOMWorkList.js

import React, { useState } from 'react';
import { Search, FolderOpen } from 'lucide-react';
import BOMNewWorkForm from './BOMNewWorkForm';
import BOMWorkListTable from './BOMWorkListTable';

const BOMWorkList = ({ existingWorks, onOpenWork, onDeleteWork, onCreateWork, onSearch, loading }) => {
  const [showNewWorkForm, setShowNewWorkForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    
    // Debounce için timeout kullanabilirsiniz
    if (onSearch) {
      onSearch(value);
    }
  };

  const handleCreateNewWork = (projectId, projectName, workName) => {
    onCreateWork(projectId, projectName, workName);
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
                disabled={loading}
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
              <h5 className="card-title mb-0">
                Mevcut Çalışmalar 
                {!loading && <span className="badge bg-primary ms-2">{existingWorks.length}</span>}
              </h5>
              
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
                  onChange={handleSearchChange}
                  className="form-control form-control-sm"
                  style={{ paddingLeft: '40px' }}
                  disabled={loading}
                />
              </div>
            </div>

            <div className="card-body">
              {loading ? (
                <div className="text-center py-5">
                  <div className="spinner-border text-danger" role="status">
                    <span className="visually-hidden">Yükleniyor...</span>
                  </div>
                  <p className="text-muted mt-2">Çalışmalar yükleniyor...</p>
                </div>
              ) : existingWorks.length > 0 ? (
                <BOMWorkListTable
                  works={existingWorks}
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