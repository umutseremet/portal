// src/components/Vehicles/VehicleDetail.js
import React from 'react';

const VehicleDetail = ({ vehicle, onBack, onEdit, onDelete }) => {
  return (
    <div className="vehicle-detail">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <button className="btn btn-outline-secondary" onClick={onBack}>
          <i className="bi bi-arrow-left me-1"></i>
          Geri
        </button>
        <div>
          <button className="btn btn-outline-primary me-2" onClick={onEdit}>
            <i className="bi bi-pencil me-1"></i>
            Düzenle
          </button>
          <button className="btn btn-outline-danger" onClick={onDelete}>
            <i className="bi bi-trash me-1"></i>
            Sil
          </button>
        </div>
      </div>
      
      <div className="card">
        <div className="card-body text-center py-5">
          <i className="bi bi-car-front display-4 text-primary mb-3"></i>
          <h4>Araç Detayı</h4>
          <p className="text-muted">Araç detay bileşeni geliştirme aşamasında...</p>
          {vehicle && <p>Araç ID: {vehicle.id}</p>}
        </div>
      </div>
    </div>
  );
};

export default VehicleDetail;
