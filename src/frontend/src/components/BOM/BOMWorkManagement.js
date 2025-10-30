// src/frontend/src/components/BOM/BOMWorkManagement.js

import React, { useState } from 'react';
import BOMWorkList from './BOMWorkList';
import BOMWorkDetail from './BOMWorkDetail';

const BOMWorkManagement = () => {
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'detail'
  const [currentWork, setCurrentWork] = useState(null);

  // Örnek mevcut çalışmalar
  const [existingWorks, setExistingWorks] = useState([
    { 
      id: 1, 
      projectId: 1, 
      projectName: 'Proje Alpha - Web Geliştirme', 
      workName: '2024 Q1 Revizyon', 
      createdAt: '15.01.2024 14:30', 
      excelCount: 3, 
      totalRows: 825 
    },
    { 
      id: 2, 
      projectId: 2, 
      projectName: 'Proje Beta - Mobil Uygulama', 
      workName: '2024 Q2 BOM Listesi', 
      createdAt: '10.04.2024 09:15', 
      excelCount: 2, 
      totalRows: 450 
    },
    { 
      id: 3, 
      projectId: 1, 
      projectName: 'Proje Alpha - Web Geliştirme', 
      workName: 'Ana Malzeme Listesi', 
      createdAt: '22.03.2024 16:45', 
      excelCount: 5, 
      totalRows: 1250 
    },
    { 
      id: 4, 
      projectId: 3, 
      projectName: 'Proje Gamma - ERP Sistemi', 
      workName: 'Revize v2.0', 
      createdAt: '05.05.2024 11:20', 
      excelCount: 1, 
      totalRows: 325 
    },
    { 
      id: 5, 
      projectId: 4, 
      projectName: 'Proje Delta - CRM Entegrasyonu', 
      workName: 'İlk Versiyon', 
      createdAt: '18.02.2024 13:50', 
      excelCount: 4, 
      totalRows: 980 
    }
  ]);

  const handleOpenWork = (work) => {
    setCurrentWork(work);
    setViewMode('detail');
  };

  const handleBackToList = () => {
    setViewMode('list');
    setCurrentWork(null);
  };

  const handleDeleteWork = (workId) => {
    if (window.confirm('Bu çalışmayı silmek istediğinizden emin misiniz?')) {
      setExistingWorks(existingWorks.filter(work => work.id !== workId));
    }
  };

  const handleCreateWork = (newWork) => {
    setExistingWorks([newWork, ...existingWorks]);
    setCurrentWork(newWork);
    setViewMode('detail');
  };

  return (
    <div className="container-fluid">
      {viewMode === 'list' ? (
        <BOMWorkList
          existingWorks={existingWorks}
          onOpenWork={handleOpenWork}
          onDeleteWork={handleDeleteWork}
          onCreateWork={handleCreateWork}
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