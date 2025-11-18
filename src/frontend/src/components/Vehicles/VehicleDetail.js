// src/frontend/src/components/Vehicles/VehicleDetail.js

import React from 'react';

const VehicleDetail = ({ 
  vehicle, 
  onBack, 
  onEdit, 
  onDelete, 
  loading = false 
}) => {
  if (!vehicle) {
    return (
      <div className="text-center py-5">
        <i className="bi bi-exclamation-triangle display-4 text-warning mb-3"></i>
        <h4>Araç bulunamadı</h4>
        <p className="text-muted">Görüntülemek istediğiniz araç bulunamadı.</p>
        <button className="btn btn-primary" onClick={onBack}>
          <i className="bi bi-arrow-left me-2"></i>
          Geri Dön
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

  return (
    <div className="vehicle-detail">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-start mb-4">
        <div>
          <button className="btn btn-outline-secondary mb-2" onClick={onBack} disabled={loading}>
            <i className="bi bi-arrow-left me-2"></i>
            Araç Listesine Dön
          </button>
          <h2 className="h3 mb-1">{vehicle.brand} {vehicle.model}</h2>
          <p className="text-muted mb-0">
            <span className="fw-bold">{vehicle.licensePlate}</span> • {vehicle.year}
          </p>
        </div>
        <div className="d-flex gap-2">
          <button 
            className="btn btn-outline-primary" 
            onClick={() => onEdit?.(vehicle)}
            disabled={loading}
          >
            <i className="bi bi-pencil me-2"></i>
            Düzenle
          </button>
          <button 
            className="btn btn-outline-danger" 
            onClick={() => onDelete?.(vehicle)}
            disabled={loading}
          >
            <i className="bi bi-trash me-2"></i>
            Sil
          </button>
        </div>
      </div>

      {/* Vehicle Info Cards */}
      <div className="row g-4">
        {/* Basic Information */}
        <div className="col-md-6">
          <div className="card h-100">
            <div className="card-header">
              <h5 className="card-title mb-0">
                <i className="bi bi-info-circle me-2"></i>
                Temel Bilgiler
              </h5>
            </div>
            <div className="card-body">
              <div className="row g-3">
                <div className="col-6">
                  <label className="form-label text-muted small">Plaka</label>
                  <div className="fw-bold">{vehicle.licensePlate}</div>
                </div>
                <div className="col-6">
                  <label className="form-label text-muted small">Marka</label>
                  <div>{vehicle.brand}</div>
                </div>
                <div className="col-6">
                  <label className="form-label text-muted small">Model</label>
                  <div>{vehicle.model}</div>
                </div>
                <div className="col-6">
                  <label className="form-label text-muted small">Yıl</label>
                  <div>{vehicle.year}</div>
                </div>
                <div className="col-12">
                  <label className="form-label text-muted small">VIN Numarası</label>
                  <div className="font-monospace small">{vehicle.vin || 'Belirtilmemiş'}</div>
                </div>
                <div className="col-12">
                  <label className="form-label text-muted small">Sahiplik Türü</label>
                  <div>
                    <span className={`badge ${getOwnershipTypeBadge(vehicle.ownershipType)}`}>
                      {getOwnershipTypeText(vehicle.ownershipType)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Company & Location */}
        <div className="col-md-6">
          <div className="card h-100">
            <div className="card-header">
              <h5 className="card-title mb-0">
                <i className="bi bi-building me-2"></i>
                Şirket & Konum
              </h5>
            </div>
            <div className="card-body">
              <div className="row g-3">
                <div className="col-12">
                  <label className="form-label text-muted small">Şirket Adı</label>
                  <div className="fw-medium">{vehicle.companyName || 'Belirtilmemiş'}</div>
                </div>
                <div className="col-12">
                  <label className="form-label text-muted small">Konum</label>
                  <div>{vehicle.location || 'Belirtilmemiş'}</div>
                </div>
                <div className="col-6">
                  <label className="form-label text-muted small">Kullanıcı</label>
                  <div>{vehicle.assignedUserName || 'Atanmamış'}</div>
                </div>
                <div className="col-6">
                  <label className="form-label text-muted small">Telefon</label>
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
              <h5 className="card-title mb-0">
                <i className="bi bi-gear me-2"></i>
                Teknik Bilgiler
              </h5>
            </div>
            <div className="card-body">
              <div className="row g-3">
                <div className="col-6">
                  <label className="form-label text-muted small">Kilometre</label>
                  <div>{vehicle.currentMileage ? `${vehicle.currentMileage.toLocaleString()} km` : 'Belirtilmemiş'}</div>
                </div>
                <div className="col-6">
                  <label className="form-label text-muted small">Yakıt Tüketimi</label>
                  <div>{vehicle.fuelConsumption ? `${vehicle.fuelConsumption} L/100km` : 'Belirtilmemiş'}</div>
                </div>
                <div className="col-6">
                  <label className="form-label text-muted small">Lastik Durumu</label>
                  <div>{vehicle.tireCondition || 'Belirtilmemiş'}</div>
                </div>
                <div className="col-6">
                  <label className="form-label text-muted small">Son Servis</label>
                  <div>{formatDate(vehicle.lastServiceDate)}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Insurance & Inspection */}
        <div className="col-md-6">
          <div className="card h-100">
            <div className="card-header">
              <h5 className="card-title mb-0">
                <i className="bi bi-shield-check me-2"></i>
                Sigorta & Muayene
              </h5>
            </div>
            <div className="card-body">
              <div className="row g-3">
                <div className="col-12">
                  <label className="form-label text-muted small">Sigorta Şirketi</label>
                  <div>{vehicle.insurance || 'Belirtilmemiş'}</div>
                </div>
                <div className="col-6">
                  <label className="form-label text-muted small">Sigorta Bitiş</label>
                  <div>{formatDate(vehicle.insuranceExpiryDate)}</div>
                </div>
                <div className="col-6">
                  <label className="form-label text-muted small">Muayene Tarihi</label>
                  <div>{formatDate(vehicle.inspectionDate)}</div>
                </div>
                <div className="col-12">
                  <label className="form-label text-muted small">Ruhsat Bilgileri</label>
                  <div className="small">{vehicle.registrationInfo || 'Belirtilmemiş'}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Vehicle Image */}
        {vehicle.vehicleImageUrl && (
          <div className="col-12">
            <div className="card">
              <div className="card-header">
                <h5 className="card-title mb-0">
                  <i className="bi bi-image me-2"></i>
                  Araç Fotoğrafı
                </h5>
              </div>
              <div className="card-body text-center">
                <img 
                  src={vehicle.vehicleImageUrl} 
                  alt={`${vehicle.brand} ${vehicle.model}`}
                  className="img-fluid rounded"
                  style={{ maxHeight: '400px' }}
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {/* System Information */}
        <div className="col-12">
          <div className="card">
            <div className="card-header">
              <h5 className="card-title mb-0">
                <i className="bi bi-clock-history me-2"></i>
                Sistem Bilgileri
              </h5>
            </div>
            <div className="card-body">
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label text-muted small">Oluşturulma Tarihi</label>
                  <div>{formatDate(vehicle.createdAt)}</div>
                </div>
                <div className="col-md-6">
                  <label className="form-label text-muted small">Son Güncellenme</label>
                  <div>{formatDate(vehicle.updatedAt)}</div>
                </div>
                <div className="col-md-12">
                  <label className="form-label text-muted small">Araç ID</label>
                  <div className="font-monospace small">{vehicle.id}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="d-flex justify-content-center gap-3 mt-4">
        <button 
          className="btn btn-outline-secondary" 
          onClick={onBack}
          disabled={loading}
        >
          <i className="bi bi-arrow-left me-2"></i>
          Geri Dön
        </button>
        <button 
          className="btn btn-primary" 
          onClick={() => onEdit?.(vehicle)}
          disabled={loading}
        >
          <i className="bi bi-pencil me-2"></i>
          Düzenle
        </button>
        <button 
          className="btn btn-outline-danger" 
          onClick={() => onDelete?.(vehicle)}
          disabled={loading}
        >
          <i className="bi bi-trash me-2"></i>
          Sil
        </button>
      </div>
    </div>
  );
};

export default VehicleDetail;