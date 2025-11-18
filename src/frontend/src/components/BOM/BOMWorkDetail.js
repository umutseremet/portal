// src/frontend/src/components/BOM/BOMWorkDetail.js

import React, { useState, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import BOMWorkInfo from './BOMWorkInfo';
import BOMExcelUpload from './BOMExcelUpload';
import BOMExcelDetails from './BOMExcelDetails';
import apiService from '../../services/api';

const BOMWorkDetail = ({ currentWork, onBackToList, onWorkUpdate }) => {
  const [uploadedExcels, setUploadedExcels] = useState([]);
  const [selectedExcel, setSelectedExcel] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [workInfo, setWorkInfo] = useState(currentWork);

  // Excel dosyalarını yükle
  const fetchExcels = async () => {
    if (!currentWork?.id) return;

    try {
      setLoading(true);
      const excels = await apiService.getBOMExcels(currentWork.id);
      setUploadedExcels(Array.isArray(excels) ? excels : []);
      console.log('✅ Excels loaded:', excels.length);
      
      await refreshWorkInfo();
    } catch (err) {
      console.error('❌ Error loading excels:', err);
      alert('Excel dosyaları yüklenirken hata oluştu: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Work bilgisini yeniden yükle (totalRows güncellemesi için)
  const refreshWorkInfo = async () => {
    if (!currentWork?.id) return;

    try {
      const updatedWork = await apiService.getBOMWork(currentWork.id);
      setWorkInfo(updatedWork);
      
      if (onWorkUpdate) {
        onWorkUpdate(updatedWork);
      }
      
      console.log('✅ Work info refreshed:', updatedWork);
    } catch (err) {
      console.error('❌ Error refreshing work info:', err);
    }
  };

  // İlk yüklemede excel dosyalarını getir
  useEffect(() => {
    if (currentWork?.id) {
      setWorkInfo(currentWork);
      fetchExcels();
    }
  }, [currentWork?.id]);

  const handleFileUpload = async (files) => {
    if (!currentWork?.id) {
      alert('Çalışma bilgisi bulunamadı');
      return;
    }

    setUploading(true);

    let successCount = 0;
    let errorCount = 0;

    for (const file of Array.from(files)) {
      try {
        console.log('📤 Uploading file:', file.name);
        const result = await apiService.uploadBOMExcel(currentWork.id, file);
        console.log('✅ File uploaded:', result);
        successCount++;
      } catch (err) {
        console.error('❌ Error uploading file:', err);
        alert(`${file.name} yüklenirken hata oluştu: ${err.message}`);
        errorCount++;
      }
    }

    setUploading(false);
    
    if (successCount > 0) {
      alert(`${successCount} dosya başarıyla yüklendi.${errorCount > 0 ? ` ${errorCount} dosya yüklenemedi.` : ''}`);
    }
    
    await fetchExcels();
  };

  const handleDeleteExcel = async (excelId) => {
    if (!window.confirm('Bu Excel dosyasını silmek istediğinizden emin misiniz?')) {
      return;
    }

    try {
      setLoading(true);
      await apiService.deleteBOMExcel(excelId);
      
      setUploadedExcels(uploadedExcels.filter(excel => excel.id !== excelId));
      
      if (selectedExcel?.id === excelId) {
        setSelectedExcel(null);
      }

      console.log('✅ Excel deleted:', excelId);
      alert('Excel dosyası başarıyla silindi.');
      
      await refreshWorkInfo();
    } catch (err) {
      console.error('❌ Error deleting excel:', err);
      alert('Excel dosyası silinirken hata oluştu: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // ✅ YENİ: Toplu Excel Silme
  const handleDeleteMultiple = async (excelIds) => {
    if (!excelIds || excelIds.length === 0) {
      return;
    }

    try {
      setLoading(true);
      
      let successCount = 0;
      let errorCount = 0;

      // Her excel'i sırayla sil
      for (const excelId of excelIds) {
        try {
          await apiService.deleteBOMExcel(excelId);
          successCount++;
          console.log(`✅ Excel ${excelId} deleted`);
        } catch (err) {
          errorCount++;
          console.error(`❌ Error deleting excel ${excelId}:`, err);
        }
      }

      // Listeyi güncelle
      setUploadedExcels(prev => prev.filter(excel => !excelIds.includes(excel.id)));
      
      // Seçili excel silinmişse seçimi kaldır
      if (selectedExcel && excelIds.includes(selectedExcel.id)) {
        setSelectedExcel(null);
      }

      // Bildirim göster
      if (successCount > 0) {
        alert(`${successCount} Excel dosyası silindi.${errorCount > 0 ? ` ${errorCount} dosya silinemedi.` : ''}`);
      } else {
        alert('Hiçbir dosya silinemedi.');
      }

      // Work bilgisini yenile
      await refreshWorkInfo();
    } catch (err) {
      console.error('❌ Error in bulk delete:', err);
      alert('Excel dosyaları silinirken hata oluştu: ' + err.message);
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
                {workInfo ? `${workInfo.projectName} - ${workInfo.workName}` : 'Proje bazlı BOM çalışmaları'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Work Info Card */}
      <BOMWorkInfo 
        currentWork={workInfo} 
        excelCount={uploadedExcels.length} 
      />

      {/* Excel Upload Section */}
      <BOMExcelUpload
        uploadedExcels={uploadedExcels}
        onFileUpload={handleFileUpload}
        onDeleteExcel={handleDeleteExcel}
        onDeleteMultiple={handleDeleteMultiple} // ✅ YENİ: Toplu silme prop'u
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