// src/frontend/src/components/Items/ItemFileUpload.js

import React, { useState } from 'react';
import { Upload, FileText, Download, Trash2, Eye, ChevronLeft, ChevronRight } from 'lucide-react';

const ItemFileUpload = ({ 
  itemId,
  uploadedFiles, 
  onFileUpload, 
  onDeleteFile, 
  onDeleteMultiple,
  onPreviewFile,
  uploading, 
  loading 
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFileIds, setSelectedFileIds] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const filesPerPage = 5;

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
        alert('Lütfen sadece desteklenen dosya türlerini yükleyin.');
      }
    }
  };

  const handleToggleSelectFile = (fileId) => {
    setSelectedFileIds(prev => {
      if (prev.includes(fileId)) {
        return prev.filter(id => id !== fileId);
      } else {
        return [...prev, fileId];
      }
    });
  };

  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedFileIds([]);
    } else {
      setSelectedFileIds(currentFiles.map(f => f.id));
    }
  };

  const handleDeleteSelected = () => {
    if (selectedFileIds.length === 0) {
      alert('Lütfen silinecek dosyaları seçin');
      return;
    }

    if (window.confirm(`${selectedFileIds.length} dosyayı silmek istediğinizden emin misiniz?`)) {
      onDeleteMultiple(selectedFileIds);
      setSelectedFileIds([]);
    }
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    setSelectedFileIds([]); // Sayfa değişince seçimleri temizle
  };

  const isAllSelected = currentFiles.length > 0 && selectedFileIds.length === currentFiles.length;
  const isSomeSelected = selectedFileIds.length > 0 && selectedFileIds.length < currentFiles.length;

  const getFileIcon = (extension) => {
    const ext = extension.toLowerCase();
    if (ext === '.pdf') return '📄';
    if (ext === '.xlsx' || ext === '.xls') return '📊';
    if (ext === '.esp') return '🔧';
    if (ext === '.nc') return '⚙️';
    if (ext === '.x_t') return '📐';
    return '📎';
  };

  const getFileTypeClass = (extension) => {
    const ext = extension.toLowerCase();
    if (ext === '.pdf') return 'text-danger';
    if (ext === '.xlsx' || ext === '.xls') return 'text-success';
    return 'text-primary';
  };

  const getFileTypeBadge = (fileType, extension) => {
    const ext = extension.toLowerCase().replace('.', '').toUpperCase();
    return ext;
  };

  return (
    <div className="card shadow-sm h-100">
      <div className="card-header bg-white py-2 px-3">
        <div className="d-flex justify-content-between align-items-center">
          <h6 className="mb-0 d-flex align-items-center">
            <Upload size={16} className="me-2" />
            Dosyalar
            {uploadedFiles.length > 0 && (
              <span className="badge bg-secondary ms-2" style={{ fontSize: '0.7rem' }}>
                {uploadedFiles.length}
              </span>
            )}
          </h6>
          {selectedFileIds.length > 0 && (
            <button 
              className="btn btn-sm btn-danger py-1 px-2"
              onClick={handleDeleteSelected}
              disabled={uploading || loading}
              style={{ fontSize: '0.75rem' }}
            >
              <Trash2 size={14} className="me-1" />
              Sil ({selectedFileIds.length})
            </button>
          )}
        </div>
      </div>

      <div className="card-body p-3">
        {/* Dosya Yükleme Alanı - Kompakt */}
        <div className="mb-3">
          <label htmlFor="fileUpload" className="w-100" style={{ cursor: 'pointer' }}>
            <input
              id="fileUpload"
              type="file"
              multiple
              onChange={handleFileSelect}
              disabled={uploading || loading}
              accept=".esp,.nc,.pdf,.x_t,.xlsx,.xls"
              style={{ display: 'none' }}
            />
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded p-3 text-center ${
                isDragging ? 'border-primary bg-primary bg-opacity-10' : 'border-secondary'
              }`}
              style={{ cursor: uploading || loading ? 'not-allowed' : 'pointer', transition: 'all 0.3s ease' }}
            >
              <Upload 
                size={32} 
                className={`mb-1 ${isDragging ? 'text-primary' : 'text-secondary'}`}
              />
              <div className={isDragging ? 'text-primary mb-0' : 'text-dark mb-0'} style={{ fontSize: '0.85rem', fontWeight: '500' }}>
                {isDragging ? 'Dosyaları buraya bırakın' : 'Dosyaları sürükleyip bırakın'}
              </div>
              <p className="text-muted mb-0" style={{ fontSize: '0.7rem' }}>
                veya tıklayarak seçin (.esp, .nc, .pdf, .x_t, .xlsx, .xls)
              </p>
            </div>
          </label>
        </div>

        {/* Yüklü Dosyalar Listesi - Kompakt Tablo */}
        {uploadedFiles.length > 0 ? (
          <>
            <div className="table-responsive">
              <table className="table table-sm table-hover mb-2" style={{ fontSize: '0.8rem' }}>
                <thead className="table-light">
                  <tr>
                    <th style={{ width: '30px', padding: '0.4rem' }}>
                      <input
                        className="form-check-input"
                        type="checkbox"
                        checked={isAllSelected}
                        onChange={handleToggleSelectAll}
                        disabled={uploading || loading}
                        style={{ cursor: 'pointer' }}
                        ref={input => {
                          if (input) {
                            input.indeterminate = isSomeSelected;
                          }
                        }}
                      />
                    </th>
                    <th style={{ width: '35px', padding: '0.4rem' }}>#</th>
                    <th style={{ padding: '0.4rem' }}>Dosya</th>
                    <th style={{ width: '60px', padding: '0.4rem', textAlign: 'center' }}>Tür</th>
                    <th style={{ width: '70px', padding: '0.4rem', textAlign: 'center' }}>Boyut</th>
                    <th style={{ width: '110px', padding: '0.4rem', textAlign: 'center' }}>İşlem</th>
                  </tr>
                </thead>
                <tbody>
                  {currentFiles.map((file, index) => (
                    <tr 
                      key={file.id}
                      className={selectedFileIds.includes(file.id) ? 'table-active' : ''}
                    >
                      <td style={{ padding: '0.4rem' }}>
                        <input
                          className="form-check-input"
                          type="checkbox"
                          checked={selectedFileIds.includes(file.id)}
                          onChange={() => handleToggleSelectFile(file.id)}
                          disabled={uploading || loading}
                          style={{ cursor: 'pointer' }}
                        />
                      </td>
                      <td className="text-muted" style={{ padding: '0.4rem' }}>
                        {startIndex + index + 1}
                      </td>
                      <td style={{ padding: '0.4rem' }}>
                        <div className="d-flex align-items-center">
                          <span className="me-1" style={{ fontSize: '1.1rem' }}>
                            {getFileIcon(file.fileExtension)}
                          </span>
                          <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '200px' }}>
                            <div className="fw-medium" title={file.fileName} style={{ fontSize: '0.8rem' }}>
                              {file.fileName}
                            </div>
                            <small className="text-muted" style={{ fontSize: '0.65rem' }}>
                              {file.formattedUploadDate}
                            </small>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '0.4rem', textAlign: 'center' }}>
                        <span className={`badge ${getFileTypeClass(file.fileExtension)}`} style={{ fontSize: '0.65rem' }}>
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
                              onClick={() => onPreviewFile(file.id)}
                              disabled={loading}
                              title="PDF Önizle"
                              style={{ fontSize: '0.7rem' }}
                            >
                              <Eye size={12} />
                            </button>
                          )}
                          <a
                            href={`${process.env.REACT_APP_API_URL || 'https://localhost:7123'}/api/ItemFiles/download/${file.id}`}
                            className="btn btn-outline-success py-0 px-1"
                            download
                            title="İndir"
                            style={{ fontSize: '0.7rem' }}
                          >
                            <Download size={12} />
                          </a>
                          <button
                            className="btn btn-outline-danger py-0 px-1"
                            onClick={() => onDeleteFile(file.id)}
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
              <div className="d-flex justify-content-between align-items-center mt-2">
                <div className="text-muted" style={{ fontSize: '0.7rem' }}>
                  Sayfa {currentPage} / {totalPages} 
                  <span className="ms-2">({uploadedFiles.length} dosya)</span>
                </div>
                <div className="btn-group btn-group-sm" role="group">
                  <button
                    className="btn btn-outline-secondary py-0 px-2"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    style={{ fontSize: '0.7rem' }}
                  >
                    <ChevronLeft size={12} />
                  </button>
                  {[...Array(totalPages)].map((_, i) => {
                    const page = i + 1;
                    if (
                      page === 1 ||
                      page === totalPages ||
                      (page >= currentPage - 1 && page <= currentPage + 1)
                    ) {
                      return (
                        <button
                          key={page}
                          className={`btn btn-outline-secondary py-0 px-2 ${page === currentPage ? 'active' : ''}`}
                          onClick={() => handlePageChange(page)}
                          style={{ fontSize: '0.7rem', minWidth: '28px' }}
                        >
                          {page}
                        </button>
                      );
                    } else if (page === currentPage - 2 || page === currentPage + 2) {
                      return <span key={page} className="px-1" style={{ fontSize: '0.7rem' }}>...</span>;
                    }
                    return null;
                  })}
                  <button
                    className="btn btn-outline-secondary py-0 px-2"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    style={{ fontSize: '0.7rem' }}
                  >
                    <ChevronRight size={12} />
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="alert alert-info mb-0 py-2" style={{ fontSize: '0.8rem' }}>
            <i className="bi bi-info-circle me-2"></i>
            Henüz dosya yüklenmemiş
          </div>
        )}

        {/* Loading indicator */}
        {(uploading || loading) && (
          <div className="text-center mt-2">
            <div className="spinner-border spinner-border-sm text-primary me-2" role="status" style={{ width: '1rem', height: '1rem' }}>
              <span className="visually-hidden">Yükleniyor...</span>
            </div>
            <span className="text-muted" style={{ fontSize: '0.75rem' }}>
              {uploading ? 'Dosyalar yükleniyor...' : 'Yükleniyor...'}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ItemFileUpload;