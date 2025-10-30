// src/frontend/src/components/BOM/BOMExcelUpload.js

import React, { useState } from 'react';
import { Upload, FileText, Eye, Trash2 } from 'lucide-react';

const BOMExcelUpload = ({ uploadedExcels, onFileUpload, onDeleteExcel, onViewDetails, selectedExcel, uploading, loading }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleFileSelect = (e) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      // Sadece Excel dosyalarını filtrele
      const excelFiles = Array.from(files).filter(file => 
        file.name.endsWith('.xlsx') || file.name.endsWith('.xls')
      );
      
      if (excelFiles.length > 0) {
        onFileUpload(excelFiles);
      } else {
        alert('Lütfen sadece Excel dosyaları (.xlsx, .xls) seçin.');
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
      const excelFiles = Array.from(files).filter(file => 
        file.name.endsWith('.xlsx') || file.name.endsWith('.xls')
      );
      
      if (excelFiles.length > 0) {
        onFileUpload(excelFiles);
      } else {
        alert('Lütfen sadece Excel dosyaları (.xlsx, .xls) yükleyin.');
      }
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      return date.toLocaleString('tr-TR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="row mb-4">
      <div className="col-12">
        <div className="card">
          <div className="card-header d-flex justify-content-between align-items-center">
            <div className="d-flex align-items-center">
              <FileText size={20} className="text-info me-2" />
              <h5 className="card-title mb-0">
                Excel Dosyaları
                {uploadedExcels.length > 0 && (
                  <span className="badge bg-info ms-2">{uploadedExcels.length}</span>
                )}
              </h5>
            </div>
            
            <button
              onClick={() => document.getElementById('excel-file-input').click()}
              className="btn btn-danger btn-sm"
              disabled={uploading || loading}
            >
              {uploading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                  Yükleniyor...
                </>
              ) : (
                <>
                  <Upload size={16} className="me-1" />
                  Excel Ekle
                </>
              )}
            </button>
            <input
              id="excel-file-input"
              type="file"
              accept=".xlsx,.xls"
              multiple
              style={{ display: 'none' }}
              onChange={handleFileSelect}
              disabled={uploading || loading}
            />
          </div>

          <div className="card-body">
            {loading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-danger" role="status">
                  <span className="visually-hidden">Yükleniyor...</span>
                </div>
                <p className="text-muted mt-2">Excel dosyaları yükleniyor...</p>
              </div>
            ) : uploadedExcels.length > 0 ? (
              <div className="table-responsive">
                <table className="table table-hover align-middle">
                  <thead className="table-light">
                    <tr>
                      <th style={{ width: '50px' }}>#</th>
                      <th>Dosya Adı</th>
                      <th style={{ width: '180px' }}>Yükleme Tarihi</th>
                      <th className="text-center" style={{ width: '120px' }}>Satır Sayısı</th>
                      <th className="text-center" style={{ width: '100px' }}>Boyut</th>
                      <th className="text-center" style={{ width: '200px' }}>İşlemler</th>
                    </tr>
                  </thead>
                  <tbody>
                    {uploadedExcels.map((excel, index) => (
                      <tr 
                        key={excel.id}
                        className={selectedExcel?.id === excel.id ? 'table-warning' : ''}
                      >
                        <td className="text-muted small">{index + 1}</td>
                        <td className="fw-medium">
                          <i className="bi bi-file-earmark-spreadsheet me-2 text-success"></i>
                          {excel.fileName}
                        </td>
                        <td className="text-muted small">
                          <i className="bi bi-calendar me-1"></i>
                          {formatDate(excel.uploadDate)}
                        </td>
                        <td className="text-center">
                          <span className="badge bg-info">{excel.rowCount || 0}</span>
                        </td>
                        <td className="text-center text-muted small">{excel.size}</td>
                        <td>
                          <div className="d-flex gap-2 justify-content-center">
                            <button
                              onClick={() => onViewDetails(excel)}
                              className="btn btn-sm btn-info text-white"
                              title="Detayları Gör"
                              disabled={uploading || loading}
                            >
                              <Eye size={14} className="me-1" />
                              Detay
                            </button>
                            <button
                              onClick={() => onDeleteExcel(excel.id)}
                              className="btn btn-sm btn-danger"
                              title="Dosyayı Sil"
                              disabled={uploading || loading}
                            >
                              <Trash2 size={14} className="me-1" />
                              Sil
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div 
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => !uploading && !loading && document.getElementById('excel-file-input').click()}
                className={`text-center py-5 border-3 border-dashed rounded ${
                  isDragging ? 'border-primary bg-primary bg-opacity-10' : 'border-secondary'
                }`}
                style={{ cursor: uploading || loading ? 'not-allowed' : 'pointer', transition: 'all 0.3s ease' }}
              >
                <Upload 
                  size={64} 
                  className={`mb-3 ${isDragging ? 'text-primary' : 'text-secondary'}`}
                />
                <h5 className={isDragging ? 'text-primary' : 'text-dark'}>
                  {isDragging ? 'Dosyaları buraya bırakın' : 'Excel dosyalarını sürükleyip bırakın'}
                </h5>
                <p className="text-muted mb-1">
                  veya tıklayarak dosya seçin
                </p>
                <p className="text-muted small mb-0">
                  <i className="bi bi-file-earmark-spreadsheet me-1"></i>
                  Desteklenen formatlar: .xlsx, .xls | Birden fazla dosya seçebilirsiniz
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BOMExcelUpload;