// src/frontend/src/components/BOM/BOMWorkInfo.js

import React from 'react';

const BOMWorkInfo = ({ currentWork, excelCount }) => {
  if (!currentWork) return null;

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
        <div className="card border-primary">
          <div className="card-body">
            <div className="row align-items-center">
              <div className="col-md-8">
                <div className="badge bg-primary bg-opacity-10 text-primary mb-2">
                  AKTİF ÇALIŞMA
                </div>
                <h4 className="card-title mb-2">
                  <i className="bi bi-clipboard-data me-2"></i>
                  {currentWork.workName}
                </h4>
                <p className="card-text text-muted mb-2">
                  <i className="bi bi-folder me-1"></i> {currentWork.projectName}
                </p>
                <p className="card-text text-muted small mb-0">
                  <i className="bi bi-calendar me-1"></i> 
                  Oluşturulma: {formatDate(currentWork.createdAt)}
                  {currentWork.updatedAt && (
                    <>
                      <span className="mx-2">|</span>
                      <i className="bi bi-clock-history me-1"></i>
                      Güncelleme: {formatDate(currentWork.updatedAt)}
                    </>
                  )}
                </p>
              </div>
              <div className="col-md-4">
                <div className="row g-3">
                  <div className="col-6">
                    <div className="text-center p-3 bg-light rounded">
                      <h2 className="display-5 text-primary mb-1">{excelCount || 0}</h2>
                      <p className="text-muted mb-0 small">Excel Dosyası</p>
                    </div>
                  </div>
                  <div className="col-6">
                    <div className="text-center p-3 bg-light rounded">
                      <h2 className="display-5 text-success mb-1">{currentWork.totalRows || 0}</h2>
                      <p className="text-muted mb-0 small">Toplam Satır</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BOMWorkInfo;