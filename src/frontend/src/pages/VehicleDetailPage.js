// src/frontend/src/pages/VehicleDetailPage.js

import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const VehicleDetailPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const vehicle = location.state?.vehicle;

  if (!vehicle) {
    return (
      <div className="container-fluid py-4">
        <div className="alert alert-warning">
          <i className="bi bi-exclamation-triangle me-2"></i>
          Araç bilgisi bulunamadı. Lütfen araç listesinden tekrar seçin.
        </div>
        <button className="btn btn-secondary" onClick={() => navigate('/vehicles')}>
          <i className="bi bi-arrow-left me-2"></i>
          Araç Listesine Dön
        </button>
      </div>
    );
  }

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
      // TODO: Delete işlemi için hook kullanılabilir veya callback prop alınabilir
      console.log('Delete vehicle:', vehicle.id);
      navigate('/vehicles');
    }
  };

  const handleEdit = () => {
    navigate('/vehicles', { state: { editVehicle: vehicle } });
  };

  const handleViewFuelPurchases = () => {
    navigate('/vehicles/fuel-purchases', { state: { vehicle } });
  };

  const handleBack = () => {
    navigate('/vehicles');
  };

  return (
    <div className="container-fluid py-4">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div className="d-flex align-items-center">
          <div className="me-3">
            <div className="avatar-lg bg-primary text-white d-flex align-items-center justify-content-center rounded-circle" style={{ width: '60px', height: '60px' }}>
              <i className="bi bi-car-front-fill fs-3"></i>
            </div>
          </div>
          <div>
            <h2 className="mb-1">
              {vehicle.brand} {vehicle.model}
            </h2>
            <div className="d-flex align-items-center gap-2">
              <span className="text-muted">
                <i className="bi bi-hash me-1"></i>
                {vehicle.licensePlate} • {vehicle.year}
              </span>
              <span className={`badge ${getOwnershipTypeBadge(vehicle.ownershipType)}`}>
                {getOwnershipTypeText(vehicle.ownershipType)}
              </span>
            </div>
          </div>
        </div>
        <button className="btn btn-secondary" onClick={handleBack}>
          <i className="bi bi-arrow-left me-2"></i>
          Geri Dön
        </button>
      </div>

{/* Action Buttons */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="card shadow-sm">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0">
                  <i className="bi bi-tools me-2"></i>
                  İşlemler
                </h5>
                <div className="d-flex gap-2">
                  <button
                    type="button"
                    className="btn btn-info"
                    onClick={handleViewFuelPurchases}
                  >
                    <i className="bi bi-fuel-pump-fill me-2"></i>
                    Yakıt Alım Bilgileri
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleEdit}
                  >
                    <i className="bi bi-pencil me-2"></i>
                    Düzenle
                  </button>
                  <button
                    type="button"
                    className="btn btn-danger"
                    onClick={handleDelete}
                  >
                    <i className="bi bi-trash me-2"></i>
                    Sil
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Vehicle Image */}
      {vehicle.vehicleImageUrl && (
        <div className="row mb-4">
          <div className="col-12">
            <div className="card">
              <div className="card-body text-center">
                <img
                  src={vehicle.vehicleImageUrl}
                  alt={`${vehicle.brand} ${vehicle.model}`}
                  className="img-fluid rounded"
                  style={{ maxHeight: '300px', maxWidth: '100%' }}
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="row g-4 mb-4">
        {/* Basic Information */}
        <div className="col-lg-6">
          <div className="card h-100 shadow-sm">
            <div className="card-header bg-light">
              <h5 className="card-title mb-0">
                <i className="bi bi-info-circle me-2"></i>
                Temel Bilgiler
              </h5>
            </div>
            <div className="card-body">
              <div className="row g-3">
                <div className="col-md-6">
                  <small className="text-muted d-block mb-1">Marka</small>
                  <div className="fw-medium">{vehicle.brand}</div>
                </div>
                <div className="col-md-6">
                  <small className="text-muted d-block mb-1">Model</small>
                  <div className="fw-medium">{vehicle.model}</div>
                </div>
                <div className="col-md-6">
                  <small className="text-muted d-block mb-1">Plaka</small>
                  <div>
                    <span className="badge bg-primary fs-6">{vehicle.licensePlate}</span>
                  </div>
                </div>
                <div className="col-md-6">
                  <small className="text-muted d-block mb-1">Yıl</small>
                  <div className="fw-medium">{vehicle.year}</div>
                </div>
                <div className="col-md-12">
                  <small className="text-muted d-block mb-1">Renk</small>
                  <div className="fw-medium">{vehicle.color || 'Belirtilmemiş'}</div>
                </div>
                <div className="col-md-12">
                  <small className="text-muted d-block mb-1">Şirket</small>
                  <div className="fw-medium">{vehicle.companyName || 'Belirtilmemiş'}</div>
                </div>
                <div className="col-md-12">
                  <small className="text-muted d-block mb-1">Konum</small>
                  <div className="fw-medium">{vehicle.location || 'Belirtilmemiş'}</div>
                </div>
                <div className="col-md-6">
                  <small className="text-muted d-block mb-1">Kullanıcı</small>
                  <div className="fw-medium">{vehicle.assignedUserName || 'Atanmamış'}</div>
                </div>
                <div className="col-md-6">
                  <small className="text-muted d-block mb-1">Telefon</small>
                  <div className="fw-medium">{vehicle.assignedUserPhone || 'Belirtilmemiş'}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Technical Information */}
        <div className="col-lg-6">
          <div className="card h-100 shadow-sm">
            <div className="card-header bg-light">
              <h5 className="card-title mb-0">
                <i className="bi bi-gear me-2"></i>
                Teknik Bilgiler
              </h5>
            </div>
            <div className="card-body">
              <div className="row g-3">
                <div className="col-md-6">
                  <small className="text-muted d-block mb-1">Kilometre</small>
                  <div className="fw-medium">
                    <i className="bi bi-speedometer2 me-1 text-primary"></i>
                    {vehicle.currentMileage} km
                  </div>
                </div>
                <div className="col-md-6">
                  <small className="text-muted d-block mb-1">Yakıt Tüketimi</small>
                  <div className="fw-medium">
                    <i className="bi bi-fuel-pump me-1 text-warning"></i>
                    {vehicle.fuelConsumption} L/100km
                  </div>
                </div>
                <div className="col-md-12">
                  <small className="text-muted d-block mb-1">Lastik Durumu</small>
                  <div>
                    <span className={`badge ${getTireConditionBadge(vehicle.tireCondition)} fs-6`}>
                      {getTireConditionText(vehicle.tireCondition)}
                    </span>
                  </div>
                </div>
                <div className="col-md-12">
                  <small className="text-muted d-block mb-1">Notlar</small>
                  <div className="fw-medium">{vehicle.notes || 'Belirtilmemiş'}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* System Information */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="card shadow-sm">
            <div className="card-header bg-light">
              <h5 className="card-title mb-0">
                <i className="bi bi-clock-history me-2"></i>
                Sistem Bilgileri
              </h5>
            </div>
            <div className="card-body">
              <div className="row g-3">
                <div className="col-md-4">
                  <small className="text-muted d-block mb-1">Araç ID</small>
                  <div className="font-monospace">{vehicle.id}</div>
                </div>
                <div className="col-md-4">
                  <small className="text-muted d-block mb-1">Oluşturulma Tarihi</small>
                  <div>{formatDate(vehicle.createdAt)}</div>
                </div>
                <div className="col-md-4">
                  <small className="text-muted d-block mb-1">Son Güncellenme</small>
                  <div>{formatDate(vehicle.updatedAt)}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      
    </div>
  );
};

export default VehicleDetailPage;