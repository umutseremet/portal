// src/frontend/src/pages/VehicleDetailPage.js
// ✅ DÜZELTİLMİŞ VERSİYON - Düzenle butonu artık düzenleme sayfasına gidiyor

import React from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';

const VehicleDetailPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { id } = useParams();
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

  // ✅ DÜZELTİLDİ: Düzenleme sayfasına yönlendirme
  const handleEdit = () => {
    navigate(`/vehicles/edit/${vehicle.id}`, { state: { vehicle } });
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
      <div className="d-flex justify-content-between align-items-start mb-4">
        <div>
          <button className="btn btn-outline-secondary mb-2" onClick={handleBack}>
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
            className="btn btn-info" 
            onClick={handleViewFuelPurchases}
          >
            <i className="bi bi-fuel-pump-fill me-2"></i>
            Yakıt Alım Bilgileri
          </button>
          <button 
            className="btn btn-outline-primary" 
            onClick={handleEdit}
          >
            <i className="bi bi-pencil me-2"></i>
            Düzenle
          </button>
          <button 
            className="btn btn-outline-danger" 
            onClick={handleDelete}
          >
            <i className="bi bi-trash me-2"></i>
            Sil
          </button>
        </div>
      </div>

      {/* Vehicle Details Content */}
      <div className="row g-4">
        {/* Temel Bilgiler */}
        <div className="col-md-6">
          <div className="card h-100">
            <div className="card-header bg-primary text-white">
              <h5 className="card-title mb-0">
                <i className="bi bi-info-circle me-2"></i>
                Temel Bilgiler
              </h5>
            </div>
            <div className="card-body">
              <div className="row g-3">
                <div className="col-md-6">
                  <small className="text-muted">Plaka</small>
                  <div className="fw-bold">{vehicle.licensePlate}</div>
                </div>
                <div className="col-md-6">
                  <small className="text-muted">Marka</small>
                  <div>{vehicle.brand}</div>
                </div>
                <div className="col-md-6">
                  <small className="text-muted">Model</small>
                  <div>{vehicle.model}</div>
                </div>
                <div className="col-md-6">
                  <small className="text-muted">Model Yılı</small>
                  <div>{vehicle.year}</div>
                </div>
                <div className="col-md-6">
                  <small className="text-muted">VIN</small>
                  <div className="font-monospace small">{vehicle.vin || '-'}</div>
                </div>
                <div className="col-md-6">
                  <small className="text-muted">Renk</small>
                  <div>{vehicle.color || '-'}</div>
                </div>
                <div className="col-12">
                  <small className="text-muted">Sahiplik Tipi</small>
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

        {/* Kullanıcı Bilgileri */}
        <div className="col-md-6">
          <div className="card h-100">
            <div className="card-header bg-info text-white">
              <h5 className="card-title mb-0">
                <i className="bi bi-person me-2"></i>
                Kullanıcı Bilgileri
              </h5>
            </div>
            <div className="card-body">
              <div className="row g-3">
                <div className="col-md-6">
                  <small className="text-muted">Şirket</small>
                  <div>{vehicle.companyName || '-'}</div>
                </div>
                <div className="col-md-6">
                  <small className="text-muted">Konum</small>
                  <div>{vehicle.location || '-'}</div>
                </div>
                <div className="col-md-6">
                  <small className="text-muted">Atanan Kullanıcı</small>
                  <div>{vehicle.assignedUserName || '-'}</div>
                </div>
                <div className="col-md-6">
                  <small className="text-muted">Telefon</small>
                  <div>{vehicle.assignedUserPhone || '-'}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Teknik Bilgiler */}
        <div className="col-md-6">
          <div className="card h-100">
            <div className="card-header bg-success text-white">
              <h5 className="card-title mb-0">
                <i className="bi bi-gear me-2"></i>
                Teknik Bilgiler
              </h5>
            </div>
            <div className="card-body">
              <div className="row g-3">
                <div className="col-md-6">
                  <small className="text-muted">Kilometre</small>
                  <div>{vehicle.currentMileage ? `${vehicle.currentMileage.toLocaleString()} km` : '-'}</div>
                </div>
                <div className="col-md-6">
                  <small className="text-muted">Yakıt Tüketimi</small>
                  <div>{vehicle.fuelConsumption ? `${vehicle.fuelConsumption} L/100km` : '-'}</div>
                </div>
                <div className="col-md-6">
                  <small className="text-muted">Lastik Durumu</small>
                  <div>
                    <span className={`badge ${getTireConditionBadge(vehicle.tireCondition)}`}>
                      {getTireConditionText(vehicle.tireCondition)}
                    </span>
                  </div>
                </div>
                <div className="col-md-6">
                  <small className="text-muted">Son Servis</small>
                  <div>{formatDate(vehicle.lastServiceDate)}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Resmi Bilgiler */}
        <div className="col-md-6">
          <div className="card h-100">
            <div className="card-header bg-warning">
              <h5 className="card-title mb-0">
                <i className="bi bi-file-earmark-text me-2"></i>
                Resmi Bilgiler
              </h5>
            </div>
            <div className="card-body">
              <div className="row g-3">
                <div className="col-md-6">
                  <small className="text-muted">Muayene Tarihi</small>
                  <div>{formatDate(vehicle.inspectionDate)}</div>
                </div>
                <div className="col-md-6">
                  <small className="text-muted">Sigorta</small>
                  <div>{vehicle.insurance || '-'}</div>
                </div>
                <div className="col-md-6">
                  <small className="text-muted">Sigorta Bitiş</small>
                  <div>{formatDate(vehicle.insuranceExpiryDate)}</div>
                </div>
                <div className="col-md-6">
                  <small className="text-muted">Ruhsat Bilgisi</small>
                  <div>{vehicle.registrationInfo || '-'}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Notlar */}
        {vehicle.notes && (
          <div className="col-12">
            <div className="card">
              <div className="card-header">
                <h5 className="card-title mb-0">
                  <i className="bi bi-sticky me-2"></i>
                  Notlar
                </h5>
              </div>
              <div className="card-body">
                <p className="mb-0">{vehicle.notes}</p>
              </div>
            </div>
          </div>
        )}

        {/* Kayıt Bilgileri */}
        <div className="col-12">
          <div className="card">
            <div className="card-body">
              <div className="row g-3 text-muted small">
                <div className="col-md-4">
                  <small className="text-muted">Araç ID</small>
                  <div className="font-monospace">{vehicle.id}</div>
                </div>
                <div className="col-md-4">
                  <small className="text-muted">Oluşturulma Tarihi</small>
                  <div>{formatDate(vehicle.createdAt)}</div>
                </div>
                <div className="col-md-4">
                  <small className="text-muted">Son Güncelleme</small>
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