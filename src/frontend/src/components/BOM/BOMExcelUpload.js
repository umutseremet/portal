// src/frontend/src/components/BOM/BOMExcelUpload.js

import React, { useState } from 'react';
import { Upload, FileText, Eye, Trash2, CheckSquare, Square } from 'lucide-react';

const BOMExcelUpload = ({ 
  uploadedExcels, 
  onFileUpload, 
  onDeleteExcel, 
  onDeleteMultiple, // ✅ Yeni prop - toplu silme
  onViewDetails, 
  selectedExcel, 
  uploading, 
  loading 
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedExcelIds, setSelectedExcelIds] = useState([]); // ✅ Seçili excel'lerin ID'leri

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
      // ✅ UTC'den local time'a çevir
      const date = new Date(dateString);
      return date.toLocaleString('tr-TR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Europe/Istanbul' // ✅ Türkiye saat dilimi
      });
    } catch {
      return dateString;
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return '-';
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(2)} MB`;
  };

  // ✅ Tek bir excel'i seç/kaldır
  const handleToggleSelect = (excelId) => {
    setSelectedExcelIds(prev => {
      if (prev.includes(excelId)) {
        return prev.filter(id => id !== excelId);
      } else {
        return [...prev, excelId];
      }
    });
  };

  // ✅ Tümünü seç/kaldır
  const handleToggleSelectAll = () => {
    if (selectedExcelIds.length === uploadedExcels.length) {
      setSelectedExcelIds([]);
    } else {
      setSelectedExcelIds(uploadedExcels.map(excel => excel.id));
    }
  };

  // ✅ Seçili excel'leri toplu sil
  const handleDeleteSelected = async () => {
    if (selectedExcelIds.length === 0) {
      alert('Lütfen silmek istediğiniz dosyaları seçin.');
      return;
    }

    const message = `${selectedExcelIds.length} Excel dosyasını silmek istediğinizden emin misiniz?`;
    if (!window.confirm(message)) {
      return;
    }

    // Parent component'e toplu silme isteği gönder
    if (onDeleteMultiple) {
      await onDeleteMultiple(selectedExcelIds);
      setSelectedExcelIds([]); // Seçimleri temizle
    }
  };

  // ✅ Tüm checkbox'lar seçili mi?
  const isAllSelected = uploadedExcels.length > 0 && selectedExcelIds.length === uploadedExcels.length;

  // ✅ Bazı checkbox'lar seçili mi?
  const isSomeSelected = selectedExcelIds.length > 0 && selectedExcelIds.length < uploadedExcels.length;

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
            
            <div className="d-flex gap-2">
              {/* ✅ Toplu Silme Butonu */}
              {selectedExcelIds.length > 0 && (
                <button
                  onClick={handleDeleteSelected}
                  className="btn btn-danger btn-sm"
                  disabled={uploading || loading}
                >
                  <Trash2 size={16} className="me-1" />
                  Seçilenleri Sil ({selectedExcelIds.length})
                </button>
              )}

              {/* Excel Ekle Butonu */}
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
            </div>

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
            ) : (
              <>
                {/* ✅ Sürükle-bırak alanı her zaman görünür */}
                <div 
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => !uploading && !loading && document.getElementById('excel-file-input').click()}
                  className={`text-center py-4 border-3 border-dashed rounded mb-4 ${
                    isDragging ? 'border-primary bg-primary bg-opacity-10' : 'border-secondary'
                  }`}
                  style={{ cursor: uploading || loading ? 'not-allowed' : 'pointer', transition: 'all 0.3s ease' }}
                >
                  <Upload 
                    size={48} 
                    className={`mb-2 ${isDragging ? 'text-primary' : 'text-secondary'}`}
                  />
                  <h6 className={isDragging ? 'text-primary mb-1' : 'text-dark mb-1'}>
                    {isDragging ? 'Dosyaları buraya bırakın' : 'Excel dosyalarını sürükleyip bırakın'}
                  </h6>
                  <p className="text-muted small mb-0">
                    veya tıklayarak dosya seçin (.xlsx, .xls)
                  </p>
                </div>

                {/* ✅ Yüklü excel'ler tablosu */}
                {uploadedExcels.length > 0 && (
                  <div className="table-responsive">
                    <table className="table table-hover align-middle">
                      <thead className="table-light">
                        <tr>
                          {/* ✅ Tümünü Seç Checkbox */}
                          <th style={{ width: '50px' }}>
                            <div 
                              className="form-check"
                              onClick={(e) => e.stopPropagation()}
                            >
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
                            </div>
                          </th>
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
                            className={`
                              ${selectedExcel?.id === excel.id ? 'table-warning' : ''}
                              ${selectedExcelIds.includes(excel.id) ? 'table-active' : ''}
                            `}
                          >
                            {/* ✅ Seçim Checkbox */}
                            <td onClick={(e) => e.stopPropagation()}>
                              <div className="form-check">
                                <input
                                  className="form-check-input"
                                  type="checkbox"
                                  checked={selectedExcelIds.includes(excel.id)}
                                  onChange={() => handleToggleSelect(excel.id)}
                                  disabled={uploading || loading}
                                  style={{ cursor: 'pointer' }}
                                />
                              </div>
                            </td>

                            <td className="text-muted small">{index + 1}</td>
                            <td className="fw-medium">
                              <i className="bi bi-file-earmark-spreadsheet me-2 text-success"></i>
                              {excel.fileName}
                            </td>
                            <td className="text-muted small">
                              <i className="bi bi-calendar me-1"></i>
                              {formatDate(excel.uploadedAt)}
                            </td>
                            <td className="text-center">
                              <span className="badge bg-info">{excel.rowCount || 0}</span>
                            </td>
                            <td className="text-center text-muted small">
                              {formatFileSize(excel.fileSize)}
                            </td>
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
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BOMExcelUpload;