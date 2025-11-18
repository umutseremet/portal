// src/frontend/src/components/BOM/BOMWorkManagement.js

import React, { useState, useEffect } from 'react';
import BOMWorkList from './BOMWorkList';
import BOMWorkDetail from './BOMWorkDetail';
import apiService from '../../services/api';

const BOMWorkManagement = () => {
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'detail'
  const [currentWork, setCurrentWork] = useState(null);
  const [existingWorks, setExistingWorks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Çalışmaları yükle
  const fetchWorks = async (searchTerm = '') => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiService.getBOMWorks({
        page: 1,
        pageSize: 100,
        searchTerm: searchTerm
      });
      
      setExistingWorks(response.works || []);
      console.log('✅ BOM works loaded:', response.works?.length);
    } catch (err) {
      console.error('❌ Error loading BOM works:', err);
      setError('Çalışmalar yüklenirken hata oluştu: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // İlk yüklemede çalışmaları getir
  useEffect(() => {
    fetchWorks();
  }, []);

  const handleOpenWork = async (work) => {
    try {
      setLoading(true);
      // Çalışmanın tam detaylarını getir
      const workDetail = await apiService.getBOMWork(work.id);
      setCurrentWork(workDetail);
      setViewMode('detail');
      console.log('✅ Opened work:', workDetail);
    } catch (err) {
      console.error('❌ Error opening work:', err);
      alert('Çalışma açılırken hata oluştu: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleBackToList = () => {
    setViewMode('list');
    setCurrentWork(null);
    // Liste görünümüne dönünce çalışmaları yenile
    fetchWorks();
  };

  const handleDeleteWork = async (workId) => {
    if (!window.confirm('Bu çalışmayı silmek istediğinizden emin misiniz? Tüm Excel dosyaları ve içerik silinecektir.')) {
      return;
    }

    try {
      setLoading(true);
      await apiService.deleteBOMWork(workId);
      
      // Listeyi güncelle
      setExistingWorks(existingWorks.filter(work => work.id !== workId));
      
      console.log('✅ Work deleted:', workId);
      alert('Çalışma başarıyla silindi.');
    } catch (err) {
      console.error('❌ Error deleting work:', err);
      alert('Çalışma silinirken hata oluştu: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateWork = async (projectId, projectName, workName) => {
    try {
      setLoading(true);
      
      const newWork = await apiService.createBOMWork({
        projectId: parseInt(projectId),
        projectName: projectName,
        workName: workName
      });

      console.log('✅ Work created:', newWork);
      
      // Yeni çalışmayı aç
      handleOpenWork(newWork);
    } catch (err) {
      console.error('❌ Error creating work:', err);
      alert('Çalışma oluşturulurken hata oluştu: ' + err.message);
      setLoading(false);
    }
  };

  const handleSearch = (searchTerm) => {
    fetchWorks(searchTerm);
  };

  return (
    <div className="container-fluid">
      {loading && (
        <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center bg-dark bg-opacity-50" style={{ zIndex: 9999 }}>
          <div className="spinner-border text-danger" role="status" style={{ width: '3rem', height: '3rem' }}>
            <span className="visually-hidden">Yükleniyor...</span>
          </div>
        </div>
      )}

      {error && (
        <div className="alert alert-danger alert-dismissible fade show" role="alert">
          <strong>Hata!</strong> {error}
          <button type="button" className="btn-close" onClick={() => setError(null)}></button>
        </div>
      )}

      {viewMode === 'list' ? (
        <BOMWorkList
          existingWorks={existingWorks}
          onOpenWork={handleOpenWork}
          onDeleteWork={handleDeleteWork}
          onCreateWork={handleCreateWork}
          onSearch={handleSearch}
          loading={loading}
        />
      ) : (
        <BOMWorkDetail
          currentWork={currentWork}
          onBackToList={handleBackToList}
        />
      )}
    </div>
  );
};

export default BOMWorkManagement;