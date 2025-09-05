// src/components/Vehicles/VehiclesList.js
import React from 'react';

const VehiclesList = ({ vehicles = [], loading = false }) => {
  return (
    <div className="vehicles-list">
      <div className="card">
        <div className="card-body text-center py-5">
          <i className="bi bi-truck display-4 text-muted mb-3"></i>
          <h4>Araç Listesi</h4>
          <p className="text-muted">Araç listesi bileşeni geliştirme aşamasında...</p>
          {loading && <div className="spinner-border text-primary"></div>}
        </div>
      </div>
    </div>
  );
};

export default VehiclesList;
