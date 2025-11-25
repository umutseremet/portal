// src/frontend/src/components/Items/ItemFileUpload.js

import React, { useState } from 'react';
import { Upload, FileText, Download, Trash2, Eye, ChevronLeft, ChevronRight } from 'lucide-react';

const ItemFileUpload = ({ 
  itemId,
  uploadedFiles, 
  onFileUpload, 
  onFileDeleted, 
  onDeleteMultiple,
  onPreviewFile,
  uploading, 
  loading 
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFileIds, setSelectedFileIds] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const filesPerPage = 10;

  // ✅ DÜZELTME: API URL'yi doğru şekilde al
  const apiBaseUrl = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5154/api';
  const baseUrl = apiBaseUrl.replace('/api', '');

  // Pagination hesaplamaları
  const totalPages = Math.ceil(uploadedFiles.length / filesPerPage);
  const startIndex = (currentPage - 1) * filesPerPage;
  const endIndex = startIndex + filesPerPage;
  const currentFiles = uploadedFiles.slice(startIndex, endIndex);

  const handleFileSelect = (e) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const allowedFiles = Array.from(files).filter(file => {
        const ext = file.name.toLowerCase();
        return ext.endsWith('.esp') || ext.endsWith('.nc') || ext.endsWith('.pdf') || 
               ext.endsWith('.x_t') || ext.endsWith('.xlsx') || ext.endsWith('.xls');
      });
      
      if (allowedFiles.length > 0) {
        onFileUpload(allowedFiles);
      } else {
        alert('Lütfen sadece desteklenen dosya türlerini seçin (.esp, .nc, .pdf, .x_t, .xlsx, .xls)');
      }
    }
    e.target.value = '';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const allowedFiles = Array.from(files).filter(file => {
        const ext = file.name.toLowerCase();
        return ext.endsWith('.esp') || ext.endsWith('.nc') || ext.endsWith('.pdf') || 
               ext.endsWith('.x_t') || ext.endsWith('.xlsx') || ext.endsWith('.xls');
      });
      
      if (allowedFiles.length > 0) {
        onFileUpload(allowedFiles);
      } else {
        alert('Lütfen sadece desteklenen dosya türlerini yükleyin');
      }
    }
  };

  const handleSelectFile = (fileId) => {
    setSelectedFileIds(prev => 
      prev.includes(fileId) 
        ? prev.filter(id => id !== fileId)
        : [...prev, fileId]
    );
  };

  const handleSelectAll = () => {
    if (selectedFileIds.length === currentFiles.length) {
      setSelectedFileIds([]);
    } else {
      setSelectedFileIds(currentFiles.map(f => f.id));
    }
  };

  const handleDeleteSelected = () => {
    if (selectedFileIds.length === 0) return;
    
    if (window.confirm(`${selectedFileIds.length} dosyayı silmek istediğinizden emin misiniz?`)) {
      onDeleteMultiple(selectedFileIds);
      setSelectedFileIds([]);
    }
  };

  const getFileTypeBadge = (fileType, extension) => {
    const types = {
      'CAD': 'primary',
      'CNC': 'success',
      'Document': 'danger',
      'Spreadsheet': 'info'
    };
    const color = types[fileType] || 'secondary';
    return <span className={`badge bg-${color}`}>{extension.replace('.', '').toUpperCase()}</span>;
  };

  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      setSelectedFileIds([]);
    }
  };

  return (
    <div className="card shadow-sm border-0">
      <div className="card-header bg-white border-bottom">
        <div className="d-flex justify-content-between align-items-center">
          <h6 className="mb-0 text-primary" style={{ fontSize: '0.9rem' }}>
            <FileText size={16} className="me-2" />
            Dosyalar {uploadedFiles.length > 0 && `(${uploadedFiles.length})`}
          </h6>
          {selectedFileIds.length > 0 && (
            <button
              className="btn btn-danger btn-sm py-0 px-2"
              onClick={handleDeleteSelected}
              title="Seçili dosyaları sil"
              style={{ fontSize: '0.7rem' }}
            >
              <Trash2 size={12} className="me-1" />
              Sil ({selectedFileIds.length})
            </button>
          )}
        </div>
      </div>

      <div className="card-body p-3">
        {/* Upload Area */}
        <div 
          className={`upload-area mb-3 p-3 border-2 border-dashed rounded text-center ${isDragging ? 'border-primary bg-light' : 'border-secondary'}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          style={{ 
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            minHeight: '80px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center'
          }}
        >
          <input
            type="file"
            id="fileInput"
            multiple
            accept=".esp,.nc,.pdf,.x_t,.xlsx,.xls"
            onChange={handleFileSelect}
            style={{ display: 'none' }}
            disabled={uploading}
          />
          <label 
            htmlFor="fileInput" 
            className="mb-0 w-100" 
            style={{ cursor: uploading ? 'not-allowed' : 'pointer' }}
          >
            {uploading ? (
              <div>
                <div className="spinner-border spinner-border-sm text-primary mb-2" role="status">
                  <span className="visually-hidden">Yükleniyor...</span>
                </div>
                <div className="text-muted" style={{ fontSize: '0.75rem' }}>Yükleniyor...</div>
              </div>
            ) : (
              <>
                <Upload size={24} className="text-muted mb-2" />
                <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                  Dosya seçin veya sürükleyin
                </div>
                <div className="text-muted mt-1" style={{ fontSize: '0.65rem' }}>
                  .esp, .nc, .pdf, .x_t, .xlsx, .xls (Max 10MB)
                </div>
              </>
            )}
          </label>
        </div>

        {/* File List */}
        {loading ? (
          <div className="text-center py-3">
            <div className="spinner-border spinner-border-sm text-primary" role="status">
              <span className="visually-hidden">Yükleniyor...</span>
            </div>
          </div>
        ) : uploadedFiles.length === 0 ? (
          <div className="text-center text-muted py-3" style={{ fontSize: '0.8rem' }}>
            <FileText size={32} className="mb-2 opacity-50" />
            <div>Henüz dosya yüklenmemiş</div>
          </div>
        ) : (
          <>
            {/* Select All Checkbox */}
            {currentFiles.length > 0 && (
              <div className="mb-2 pb-2 border-bottom">
                <div className="form-check form-check-sm">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    checked={selectedFileIds.length === currentFiles.length}
                    onChange={handleSelectAll}
                    style={{ fontSize: '0.7rem' }}
                  />
                  <label className="form-check-label text-muted" style={{ fontSize: '0.7rem' }}>
                    Tümünü Seç
                  </label>
                </div>
              </div>
            )}

            {/* Files Table */}
            <div className="table-responsive">
              <table className="table table-sm table-hover mb-0">
                <thead>
                  <tr style={{ fontSize: '0.7rem' }}>
                    <th style={{ width: '30px', padding: '0.4rem' }}></th>
                    <th style={{ padding: '0.4rem' }}>Dosya Adı</th>
                    <th style={{ width: '80px', padding: '0.4rem', textAlign: 'center' }}>Tür</th>
                    <th style={{ width: '70px', padding: '0.4rem', textAlign: 'center' }}>Boyut</th>
                    <th style={{ width: '120px', padding: '0.4rem', textAlign: 'center' }}>İşlemler</th>
                  </tr>
                </thead>
                <tbody>
                  {currentFiles.map((file) => (
                    <tr key={file.id} style={{ fontSize: '0.75rem' }}>
                      <td style={{ padding: '0.4rem' }}>
                        <input
                          className="form-check-input"
                          type="checkbox"
                          checked={selectedFileIds.includes(file.id)}
                          onChange={() => handleSelectFile(file.id)}
                          style={{ fontSize: '0.7rem' }}
                        />
                      </td>
                      <td style={{ padding: '0.4rem' }}>
                        <div className="d-flex align-items-center">
                          <FileText size={14} className="text-muted me-2" />
                          <span className="text-truncate" style={{ maxWidth: '200px' }} title={file.fileName}>
                            {file.fileName}
                          </span>
                        </div>
                      </td>
                      <td style={{ padding: '0.4rem', textAlign: 'center' }}>
                        <span style={{ fontSize: '0.65rem' }}>
                          {getFileTypeBadge(file.fileType, file.fileExtension)}
                        </span>
                      </td>
                      <td style={{ padding: '0.4rem', textAlign: 'center' }}>
                        <span className="text-muted" style={{ fontSize: '0.7rem' }}>
                          {file.formattedSize}
                        </span>
                      </td>
                      <td style={{ padding: '0.4rem' }}>
                        <div className="btn-group btn-group-sm d-flex justify-content-center" role="group">
                          {file.isPdf && (
                            <button
                              className="btn btn-outline-primary py-0 px-1"
                              onClick={() => onPreviewFile(file)}
                              disabled={loading}
                              title="PDF Önizle"
                              style={{ fontSize: '0.7rem' }}
                            >
                              <Eye size={12} />
                            </button>
                          )}
                          <a
                            href={`${baseUrl}/api/ItemFiles/download/${file.id}`}
                            className="btn btn-outline-success py-0 px-1"
                            download
                            title="İndir"
                            style={{ fontSize: '0.7rem' }}
                          >
                            <Download size={12} />
                          </a>
                          <button
                            className="btn btn-outline-danger py-0 px-1"
                            onClick={() => {
                              if (window.confirm('Bu dosyayı silmek istediğinizden emin misiniz?')) {
                                onFileDeleted(file.id);
                              }
                            }}
                            disabled={loading}
                            title="Sil"
                            style={{ fontSize: '0.7rem' }}
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="d-flex justify-content-between align-items-center mt-3 pt-2 border-top">
                <span className="text-muted" style={{ fontSize: '0.7rem' }}>
                  Sayfa {currentPage} / {totalPages}
                </span>
                <div className="btn-group btn-group-sm">
                  <button
                    className="btn btn-outline-secondary py-0 px-2"
                    onClick={() => goToPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    style={{ fontSize: '0.7rem' }}
                  >
                    <ChevronLeft size={14} />
                  </button>
                  <button
                    className="btn btn-outline-secondary py-0 px-2"
                    onClick={() => goToPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    style={{ fontSize: '0.7rem' }}
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ItemFileUpload;