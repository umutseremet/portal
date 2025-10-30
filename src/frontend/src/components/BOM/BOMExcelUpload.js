// src/frontend/src/components/BOM/BOMExcelUpload.js

import React, { useState } from 'react';
import { Upload, FileText, Eye, Trash2 } from 'lucide-react';

const BOMExcelUpload = ({ uploadedExcels, onFileUpload, onDeleteExcel, onViewDetails, selectedExcel }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleFileSelect = (e) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      onFileUpload(files);
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

  return (
    <div className="row mb-4">
      <div className="col-12">
        <div className="card">
          <div className="card-header d-flex justify-content-between align-items-center">
            <div className="d-flex align-items-center">
              <FileText size={20} className="text-info me-2" />
              <h5 className="card-title mb-0">Excel Dosyaları</h5>
            </div>
            
            <button
              onClick={() => document.getElementById('excel-file-input').click()}
              className="btn btn-danger btn-sm"
            >
              <Upload size={16} className="me-1" />
              Excel Ekle
            </button>
            <input
              id="excel-file-input"
              type="file"
              accept=".xlsx,.xls"
              multiple
              style={{ display: 'none' }}
              onChange={handleFileSelect}
            />
          </div>

          <div className="card-body">
            {uploadedExcels.length > 0 ? (
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
                        <td className="text-muted small">{excel.uploadDate}</td>
                        <td className="text-center fw-medium">{excel.rowCount}</td>
                        <td className="text-center text-muted small">{excel.size}</td>
                        <td>
                          <div className="d-flex gap-2 justify-content-center">
                            <button
                              onClick={() => onViewDetails(excel)}
                              className="btn btn-sm btn-info text-white"
                              title="Detayları Gör"
                            >
                              <Eye size={14} className="me-1" />
                              Detay
                            </button>
                            <button
                              onClick={() => onDeleteExcel(excel.id)}
                              className="btn btn-sm btn-danger"
                              title="Dosyayı Sil"
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
                onClick={() => document.getElementById('excel-file-input').click()}
                className={`text-center py-5 border-3 border-dashed rounded ${
                  isDragging ? 'border-primary bg-primary bg-opacity-10' : 'border-secondary'
                }`}
                style={{ cursor: 'pointer', transition: 'all 0.3s ease' }}
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