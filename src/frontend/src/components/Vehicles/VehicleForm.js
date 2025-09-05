// src/components/Vehicles/VehicleForm.js
import React from 'react';

const VehicleForm = ({ vehicle, onSave, onCancel, loading = false, isEdit = false }) => {
  return (
    <div className="vehicle-form">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h3>{isEdit ? 'Araç Düzenle' : 'Yeni Araç Ekle'}</h3>
        <button className="btn btn-outline-secondary" onClick={onCancel}>
          <i className="bi bi-x me-1"></i>
          İptal
        </button>
      </div>
      
      <div className="card">
        <div className="card-body text-center py-5">
          <i className="bi bi-plus-circle display-4 text-success mb-3"></i>
          <h4>Araç Formu</h4>
          <p className="text-muted">Araç form bileşeni geliştirme aşamasında...</p>
          <button className="btn btn-success" onClick={() => onSave({})}>
            <i className="bi bi-check me-1"></i>
            Kaydet
          </button>
        </div>
      </div>
    </div>
  );
};

export default VehicleForm;
