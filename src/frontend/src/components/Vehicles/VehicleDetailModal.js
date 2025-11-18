// src/frontend/src/components/Vehicles/VehicleDetailModal.js

import React from 'react';
import { useNavigate } from 'react-router-dom';

const VehicleDetailModal = ({
  show = false,
  onHide,
  vehicle = null,
  onEdit,
  onDelete,
  loading = false
}) => {
  const navigate = useNavigate();

  if (!show || !vehicle) return null;

  const formatDate = (dateString) => {
    if (!dateString) return 'Belirtilmemiş';
    try {
      return new Date(dateString).toLocaleDateString('tr-TR');
    } catch {
      return 'Geçersiz tarih';
    }
  };

  const getOwnershipTypeText = (type) => {
    switch (type) {
      case 'company': return 'Şirket';
      case 'rental': return 'Kiralık';
      case 'personal': return 'Kişisel';
      default: return type || 'Belirtilmemiş';
    }
  };

  const getOwnershipTypeBadge = (type) => {
    switch (type) {
      case 'company': return 'bg-success';
      case 'rental': return 'bg-warning';
      case 'personal': return 'bg-info';
      default: return 'bg-secondary';
    }
  };

  const getTireConditionText = (condition) => {
    switch (condition) {
      case 'excellent': return 'Mükemmel';
      case 'good': return 'İyi';
      case 'fair': return 'Orta';
      case 'poor': return 'Kötü';
      case 'needsReplacement': return 'Değiştirilmeli';
      default: return condition || 'Belirtilmemiş';
    }
  };

  const getTireConditionBadge = (condition) => {
    switch (condition) {
      case 'excellent': return 'bg-success';
      case 'good': return 'bg-primary';
      case 'fair': return 'bg-warning';
      case 'poor': return 'bg-danger';
      case 'needsReplacement': return 'bg-danger';
      default: return 'bg-secondary';
    }
  };

  const handleDelete = () => {
    if (window.confirm(`${vehicle.brand} ${vehicle.model} (${vehicle.licensePlate}) aracını silmek istediğinizden emin misiniz?`)) {
      onDelete(vehicle);
      onHide();
    }
  };

  // Handle edit
  const handleEdit = () => {
    onEdit(vehicle);
    onHide();
  };

  // YENİ - Yakıt Alım Bilgileri sayfasına yönlendir
  const handleViewFuelPurchases = () => {
    onHide(); // Modal'ı kapat
    navigate('/vehicles/fuel-purchases', { state: { vehicle } });
  };

  return (
    <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
        <div className="modal-content">
          <div className="modal-header bg-light">
            <div className="d-flex align-items-center">
              <div className="me-3">
                <div className="avatar-lg bg-primary text-white d-flex align-items-center justify-content-center rounded-circle">
                  <i className="bi bi-car-front-fill fs-4"></i>
                </div>
              </div>
              <div>
                <h5 className="modal-title mb-1">
                  {vehicle.brand} {vehicle.model}
                </h5>
                <div className="d-flex align-items-center gap-2">
                  <span className="text-muted small">
                    <i className="bi bi-hash me-1"></i>
                    {vehicle.licensePlate} • {vehicle.year}
                  </span>
                  <span className={`badge ${getOwnershipTypeBadge(vehicle.ownershipType)} small`}>
                    {getOwnershipTypeText(vehicle.ownershipType)}
                  </span>
                </div>
              </div>
            </div>
            <button 
              type="button" 
              className="btn-close" 
              onClick={onHide}
              disabled={loading}
            ></button>
          </div>
          
          <div className="modal-body">
            {/* Vehicle Image */}
            {vehicle.vehicleImageUrl && (
              <div className="text-center mb-4">
                <img
                  src={vehicle.vehicleImageUrl}
                  alt={`${vehicle.brand} ${vehicle.model}`}
                  className="img-fluid rounded"
                  style={{ maxHeight: '200px', maxWidth: '100%' }}
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
              </div>
            )}

            <div className="row g-4">
              {/* Basic Information */}
              <div className="col-md-6">
                <div className="card h-100">
                  <div className="card-header">
                    <h6 className="card-title mb-0">
                      <i className="bi bi-info-circle me-2"></i>
                      Temel Bilgiler
                    </h6>
                  </div>
                  <div className="card-body">
                    <div className="row g-2">
                      <div className="col-6">
                        <small className="text-muted">Marka</small>
                        <div>{vehicle.brand}</div>
                      </div>
                      <div className="col-6">
                        <small className="text-muted">Model</small>
                        <div>{vehicle.model}</div>
                      </div>
                      <div className="col-6">
                        <small className="text-muted">Plaka</small>
                        <div className="badge bg-primary">{vehicle.licensePlate}</div>
                      </div>
                      <div className="col-6">
                        <small className="text-muted">Yıl</small>
                        <div>{vehicle.year}</div>
                      </div>
                      <div className="col-12">
                        <small className="text-muted">Renk</small>
                        <div>{vehicle.color || 'Belirtilmemiş'}</div>
                      </div>
                      <div className="col-12">
                        <small className="text-muted">Şirket</small>
                        <div>{vehicle.companyName || 'Belirtilmemiş'}</div>
                      </div>
                      <div className="col-12">
                        <small className="text-muted">Konum</small>
                        <div>{vehicle.location || 'Belirtilmemiş'}</div>
                      </div>
                      <div className="col-6">
                        <small className="text-muted">Kullanıcı</small>
                        <div>{vehicle.assignedUserName || 'Atanmamış'}</div>
                      </div>
                      <div className="col-6">
                        <small className="text-muted">Telefon</small>
                        <div>{vehicle.assignedUserPhone || 'Belirtilmemiş'}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Technical Information */}
              <div className="col-md-6">
                <div className="card h-100">
                  <div className="card-header">
                    <h6 className="card-title mb-0">
                      <i className="bi bi-gear me-2"></i>
                      Teknik Bilgiler
                    </h6>
                  </div>
                  <div className="card-body">
                    <div className="row g-2">
                      <div className="col-6">
                        <small className="text-muted">Kilometre</small>
                        <div>{vehicle.currentMileage}</div>
                      </div>
                      <div className="col-6">
                        <small className="text-muted">Yakıt Tüketimi</small>
                        <div>{vehicle.fuelConsumption + ' L/100km'}</div>
                      </div>
                      <div className="col-12">
                        <small className="text-muted">Lastik Durumu</small>
                        <div>
                          <span className={`badge ${getTireConditionBadge(vehicle.tireCondition)}`}>
                            {getTireConditionText(vehicle.tireCondition)}
                          </span>
                        </div>
                      </div>
                      <div className="col-12">
                        <small className="text-muted">Notlar</small>
                        <div>{vehicle.notes || 'Belirtilmemiş'}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* System Information */}
              <div className="col-12">
                <div className="card">
                  <div className="card-header">
                    <h6 className="card-title mb-0">
                      <i className="bi bi-clock-history me-2"></i>
                      Sistem Bilgileri
                    </h6>
                  </div>
                  <div className="card-body">
                    <div className="row g-3">
                      <div className="col-md-4">
                        <small className="text-muted">Araç ID</small>
                        <div className="font-monospace small">{vehicle.id}</div>
                      </div>
                      <div className="col-md-4">
                        <small className="text-muted">Oluşturulma Tarihi</small>
                        <div>{formatDate(vehicle.createdAt)}</div>
                      </div>
                      <div className="col-md-4">
                        <small className="text-muted">Son Güncellenme</small>
                        <div>{formatDate(vehicle.updatedAt)}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onHide}
              disabled={loading}
            >
              <i className="bi bi-x me-1"></i>
              Kapat
            </button>
            <div className="d-flex gap-2">
              {/* YENİ BUTON - Yakıt Alım Bilgileri */}
              <button
                type="button"
                className="btn btn-info"
                onClick={handleViewFuelPurchases}
                disabled={loading}
              >
                <i className="bi bi-fuel-pump-fill me-1"></i>
                Yakıt Alım Bilgileri
              </button>
              <button
                type="button"
                className="btn btn-outline-primary"
                onClick={handleEdit}
                disabled={loading}
              >
                <i className="bi bi-pencil me-1"></i>
                Düzenle
              </button>
              <button
                type="button"
                className="btn btn-outline-danger"
                onClick={handleDelete}
                disabled={loading}
              >
                <i className="bi bi-trash me-1"></i>
                Sil
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VehicleDetailModal;