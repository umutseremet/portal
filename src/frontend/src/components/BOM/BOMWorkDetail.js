// src/frontend/src/components/BOM/BOMWorkDetail.js

import React, { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import BOMWorkInfo from './BOMWorkInfo';
import BOMExcelUpload from './BOMExcelUpload';
import BOMExcelDetails from './BOMExcelDetails';

const BOMWorkDetail = ({ currentWork, onBackToList }) => {
  const [uploadedExcels, setUploadedExcels] = useState([]);
  const [selectedExcel, setSelectedExcel] = useState(null);

  const handleFileUpload = (files) => {
    const newExcels = Array.from(files).map(file => ({
      id: Date.now() + Math.random(),
      fileName: file.name,
      uploadDate: new Date().toLocaleString('tr-TR'),
      rowCount: 325,
      size: (file.size / 1024).toFixed(2) + ' KB'
    }));
    setUploadedExcels([...uploadedExcels, ...newExcels]);
  };

  const handleDeleteExcel = (id) => {
    setUploadedExcels(uploadedExcels.filter(excel => excel.id !== id));
    if (selectedExcel?.id === id) {
      setSelectedExcel(null);
    }
  };

  const handleViewDetails = (excel) => {
    setSelectedExcel(excel);
  };

  return (
    <>
      {/* Page Header */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="d-flex justify-content-between align-items-start flex-wrap">
            <div className="page-header mb-3 mb-md-0">
              <div className="d-flex align-items-center gap-3 mb-2">
                <button
                  onClick={onBackToList}
                  className="btn btn-outline-secondary btn-sm"
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
      <BOMWorkInfo currentWork={currentWork} excelCount={uploadedExcels.length} />

      {/* Excel Upload Section */}
      <BOMExcelUpload
        uploadedExcels={uploadedExcels}
        onFileUpload={handleFileUpload}
        onDeleteExcel={handleDeleteExcel}
        onViewDetails={handleViewDetails}
        selectedExcel={selectedExcel}
      />

      {/* Excel Details Section */}
      {selectedExcel && <BOMExcelDetails selectedExcel={selectedExcel} />}
    </>
  );
};

export default BOMWorkDetail;