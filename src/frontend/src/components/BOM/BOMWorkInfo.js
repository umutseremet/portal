// src/frontend/src/components/BOM/BOMWorkInfo.js

import React from 'react';

const BOMWorkInfo = ({ currentWork, excelCount }) => {
  if (!currentWork) return null;

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
                <h4 className="card-title mb-2">{currentWork.workName}</h4>
                <p className="card-text text-muted mb-0">
                  <i className="bi bi-folder me-1"></i> {currentWork.projectName}
                  <span className="mx-2">|</span>
                  <i className="bi bi-calendar me-1"></i> {currentWork.createdAt}
                </p>
              </div>
              <div className="col-md-4">
                <div className="text-center p-3 bg-light rounded">
                  <h2 className="display-4 text-primary mb-1">{excelCount}</h2>
                  <p className="text-muted mb-0 small">Excel Dosyası</p>
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