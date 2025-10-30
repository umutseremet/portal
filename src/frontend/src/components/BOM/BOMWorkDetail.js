// src/frontend/src/components/BOM/BOMWorkDetail.js

import React, { useState, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import BOMWorkInfo from './BOMWorkInfo';
import BOMExcelUpload from './BOMExcelUpload';
import BOMExcelDetails from './BOMExcelDetails';
import apiService from '../../services/api';

const BOMWorkDetail = ({ currentWork, onBackToList }) => {
  const [uploadedExcels, setUploadedExcels] = useState([]);
  const [selectedExcel, setSelectedExcel] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Excel dosyalarını yükle
  const fetchExcels = async () => {
    if (!currentWork?.id) return;

    try {
      setLoading(true);
      const excels = await apiService.getBOMExcels(currentWork.id);
      setUploadedExcels(Array.isArray(excels) ? excels : []);
      console.log('✅ Excels loaded:', excels.length);
    } catch (err) {
      console.error('❌ Error loading excels:', err);
      alert('Excel dosyaları yüklenirken hata oluştu: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // İlk yüklemede excel dosyalarını getir
  useEffect(() => {
    if (currentWork?.id) {
      fetchExcels();
    }
  }, [currentWork?.id]);

  const handleFileUpload = async (files) => {
    if (!currentWork?.id) {
      alert('Çalışma bilgisi bulunamadı');
      return;
    }

    setUploading(true);

    // Her dosyayı sırayla yükle
    for (const file of Array.from(files)) {
      try {
        console.log('📤 Uploading file:', file.name);
        const result = await apiService.uploadBOMExcel(currentWork.id, file);
        console.log('✅ File uploaded:', result);
      } catch (err) {
        console.error('❌ Error uploading file:', err);
        alert(`${file.name} yüklenirken hata oluştu: ${err.message}`);
      }
    }

    setUploading(false);
    
    // Listeyi yenile
    fetchExcels();
  };

  const handleDeleteExcel = async (excelId) => {
    if (!window.confirm('Bu Excel dosyasını silmek istediğinizden emin misiniz?')) {
      return;
    }

    try {
      setLoading(true);
      await apiService.deleteBOMExcel(excelId);
      
      // Listeyi güncelle
      setUploadedExcels(uploadedExcels.filter(excel => excel.id !== excelId));
      
      // Seçili excel silinirse seçimi kaldır
      if (selectedExcel?.id === excelId) {
        setSelectedExcel(null);
      }

      console.log('✅ Excel deleted:', excelId);
      alert('Excel dosyası başarıyla silindi.');
    } catch (err) {
      console.error('❌ Error deleting excel:', err);
      alert('Excel dosyası silinirken hata oluştu: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (excel) => {
    setSelectedExcel(excel);
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 KB';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  return (
    <>
      {/* Loading Overlay */}
      {(loading || uploading) && (
        <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center bg-dark bg-opacity-50" style={{ zIndex: 9999 }}>
          <div className="text-center">
            <div className="spinner-border text-danger" role="status" style={{ width: '3rem', height: '3rem' }}>
              <span className="visually-hidden">Yükleniyor...</span>
            </div>
            <p className="text-white mt-3">
              {uploading ? 'Dosyalar yükleniyor...' : 'İşlem yapılıyor...'}
            </p>
          </div>
        </div>
      )}

      {/* Page Header */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="d-flex justify-content-between align-items-start flex-wrap">
            <div className="page-header mb-3 mb-md-0">
              <div className="d-flex align-items-center gap-3 mb-2">
                <button
                  onClick={onBackToList}
                  className="btn btn-outline-secondary btn-sm"
                  disabled={loading || uploading}
                >
                  <ArrowLeft size={16} className="me-1" />
                  Geri
                </button>
                <h2 className="page-title mb-0">BOM Listesi Aktarımı</h2>
              </div>
              <p className="page-subtitle text-muted">
                {currentWork ? `${currentWork.projectName} - ${currentWork.workName}` : 'Proje bazlı BOM çalışmaları'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Work Info Card */}
      <BOMWorkInfo 
        currentWork={currentWork} 
        excelCount={uploadedExcels.length} 
      />

      {/* Excel Upload Section */}
      <BOMExcelUpload
        uploadedExcels={uploadedExcels.map(excel => ({
          ...excel,
          size: formatFileSize(excel.fileSize)
        }))}
        onFileUpload={handleFileUpload}
        onDeleteExcel={handleDeleteExcel}
        onViewDetails={handleViewDetails}
        selectedExcel={selectedExcel}
        uploading={uploading}
        loading={loading}
      />

      {/* Excel Details Section */}
      {selectedExcel && (
        <BOMExcelDetails 
          selectedExcel={selectedExcel}
          workId={currentWork?.id}
        />
      )}
    </>
  );
};

export default BOMWorkDetail;