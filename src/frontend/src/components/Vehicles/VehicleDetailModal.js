// src/frontend/src/components/Vehicles/VehicleDetailModal.js

import React from 'react';

const VehicleDetailModal = ({ 
  show = false, 
  onHide, 
  vehicle = null, 
  onEdit, 
  onDelete,
  loading = false 
}) => {
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

  return (
    <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
      <div className="modal-dialog modal-xl modal-dialog-scrollable">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">
              <i className="bi bi-car-front me-2"></i>
              {vehicle.brand} {vehicle.model} - {vehicle.licensePlate}
            </h5>
            <button 
              type="button" 
              className="btn-close" 
              onClick={onHide}
              disabled={loading}
            ></button>
          </div>
          
          <div className="modal-body">
            <div className="row g-4">
              {/* Vehicle Image */}
              {vehicle.vehicleImageUrl && (
                <div className="col-12 text-center">
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
              )}

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
                        <small className="text-muted">Plaka</small>
                        <div className="fw-bold text-primary">{vehicle.licensePlate}</div>
                      </div>
                      <div className="col-6">
                        <small className="text-muted">Marka</small>
                        <div>{vehicle.brand}</div>
                      </div>
                      <div className="col-6">
                        <small className="text-muted">Model</small>
                        <div>{vehicle.model}</div>
                      </div>
                      <div className="col-6">
                        <small className="text-muted">Yıl</small>
                        <div>{vehicle.year}</div>
                      </div>
                      <div className="col-12">
                        <small className="text-muted">VIN Numarası</small>
                        <div className="font-monospace small">{vehicle.vin || 'Belirtilmemiş'}</div>
                      </div>
                      <div className="col-12">
                        <small className="text-muted">Sahiplik Türü</small>
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
                    <h6 className="card-title mb-0">
                      <i className="bi bi-building me-2"></i>
                      Şirket & Konum
                    </h6>
                  </div>
                  <div className="card-body">
                    <div className="row g-2">
                      <div className="col-12">
                        <small className="text-muted">Şirket Adı</small>
                        <div className="fw-medium">{vehicle.companyName || 'Belirtilmemiş'}</div>
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
                        <div>{vehicle.currentMileage ? `${vehicle.currentMileage.toLocaleString()} km` : 'Belirtilmemiş'}</div>
                      </div>
                      <div className="col-6">
                        <small className="text-muted">Yakıt Tüketimi</small>
                        <div>{vehicle.fuelConsumption ? `${vehicle.fuelConsumption} L/100km` : 'Belirtilmemiş'}</div>
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
                        <small className="text-muted">Son Servis</small>
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
                    <h6 className="card-title mb-0">
                      <i className="bi bi-shield-check me-2"></i>
                      Sigorta & Muayene
                    </h6>
                  </div>
                  <div className="card-body">
                    <div className="row g-2">
                      <div className="col-12">
                        <small className="text-muted">Sigorta Şirketi</small>
                        <div>{vehicle.insurance || 'Belirtilmemiş'}</div>
                      </div>
                      <div className="col-6">
                        <small className="text-muted">Sigorta Bitiş</small>
                        <div>{formatDate(vehicle.insuranceExpiryDate)}</div>
                      </div>
                      <div className="col-6">
                        <small className="text-muted">Muayene Tarihi</small>
                        <div>{formatDate(vehicle.inspectionDate)}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Registration Information */}
              {vehicle.registrationInfo && (
                <div className="col-12">
                  <div className="card">
                    <div className="card-header">
                      <h6 className="card-title mb-0">
                        <i className="bi bi-file-earmark-text me-2"></i>
                        Ruhsat Bilgileri
                      </h6>
                    </div>
                    <div className="card-body">
                      <p className="mb-0">{vehicle.registrationInfo}</p>
                    </div>
                  </div>
                </div>
              )}

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
              Kapat
            </button>
            <button 
              type="button" 
              className="btn btn-primary"
              onClick={() => onEdit?.(vehicle)}
              disabled={loading}
            >
              <i className="bi bi-pencil me-1"></i>
              Düzenle
            </button>
            <button 
              type="button" 
              className="btn btn-danger"
              onClick={() => onDelete?.(vehicle)}
              disabled={loading}
            >
              <i className="bi bi-trash me-1"></i>
              Sil
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VehicleDetailModal;