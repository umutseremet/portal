// src/frontend/src/pages/VehicleDetailPage.js
// ✅ TAM DÜZELTİLMİŞ VERSİYON - Ürün detay sayfası stil ve yapısı

import React from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useToast } from '../contexts/ToastContext';
import { vehicleService } from '../services/vehicleService';

const VehicleDetailPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { id } = useParams();
  const toast = useToast();
  const vehicle = location.state?.vehicle;

  // Resim URL'sini oluştur
  const apiBaseUrl = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5154/api';
  const baseUrl = apiBaseUrl.replace('/api', '');
  const imageUrl = vehicle?.vehicleImageUrl ? `${baseUrl}${vehicle.vehicleImageUrl}` : null;

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
      case 'company': return 'success';
      case 'rental': return 'warning';
      case 'personal': return 'info';
      default: return 'secondary';
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
      case 'excellent': return 'success';
      case 'good': return 'primary';
      case 'fair': return 'warning';
      case 'poor': return 'danger';
      case 'needsReplacement': return 'danger';
      default: return 'secondary';
    }
  };

  const handleDelete = async () => {
    if (window.confirm(`${vehicle.brand} ${vehicle.model} (${vehicle.licensePlate}) aracını silmek istediğinizden emin misiniz?`)) {
      try {
        await vehicleService.deleteVehicle(vehicle.id);
        toast.success('Araç başarıyla silindi');
        navigate('/vehicles');
      } catch (error) {
        console.error('Delete vehicle error:', error);
        toast.error('Araç silinirken hata oluştu');
      }
    }
  };

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
      {/* Header - Ürün detay benzeri */}
      <div className="mb-4">
        <button className="btn btn-outline-secondary mb-3" onClick={handleBack}>
          <i className="bi bi-arrow-left me-2"></i>
          Araç Listesine Dön
        </button>
        
        <div className="d-flex justify-content-between align-items-start flex-wrap gap-3">
          <div>
            <h2 className="h3 mb-2">
              <i className="bi bi-truck me-2 text-danger"></i>
              {vehicle.brand} {vehicle.model}
            </h2>
            <div className="d-flex align-items-center gap-3 flex-wrap">
              <span className="badge bg-primary fs-6">{vehicle.licensePlate}</span>
              <span className="text-muted">• {vehicle.year}</span>
              <span className={`badge bg-${getOwnershipTypeBadge(vehicle.ownershipType)}`}>
                {getOwnershipTypeText(vehicle.ownershipType)}
              </span>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="d-flex gap-2 flex-wrap">
            <button 
              className="btn btn-info" 
              onClick={handleViewFuelPurchases}
            >
              <i className="bi bi-fuel-pump-fill me-2"></i>
              Yakıt Alımları
            </button>
            <button 
              className="btn btn-primary" 
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
      </div>

      <div className="row g-4">
        {/* Sol Kolon - Bilgiler */}
        <div className={`${imageUrl ? 'col-12 col-lg-7' : 'col-12'}`}>
          <div className="card shadow-sm">
            <div className="card-body">
              {/* Temel Bilgiler */}
              <h5 className="card-title border-bottom pb-2 mb-3">
                <i className="bi bi-info-circle me-2 text-primary"></i>
                Temel Bilgiler
              </h5>
              <div className="row g-3 mb-4">
                <div className="col-md-6">
                  <label className="form-label text-muted small mb-1">Plaka</label>
                  <div className="fw-semibold">{vehicle.licensePlate}</div>
                </div>
                <div className="col-md-6">
                  <label className="form-label text-muted small mb-1">Marka</label>
                  <div className="fw-semibold">{vehicle.brand || '-'}</div>
                </div>
                <div className="col-md-6">
                  <label className="form-label text-muted small mb-1">Model</label>
                  <div className="fw-semibold">{vehicle.model || '-'}</div>
                </div>
                <div className="col-md-6">
                  <label className="form-label text-muted small mb-1">Yıl</label>
                  <div className="fw-semibold">{vehicle.year || '-'}</div>
                </div>
                <div className="col-md-6">
                  <label className="form-label text-muted small mb-1">Şasi No (VIN)</label>
                  <div className="fw-semibold">{vehicle.vin || '-'}</div>
                </div>
                <div className="col-md-6">
                  <label className="form-label text-muted small mb-1">Şirket</label>
                  <div>
                    <span className="badge bg-light text-dark">
                      {vehicle.companyName || 'Belirtilmemiş'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Kullanıcı Bilgileri */}
              <h5 className="card-title border-bottom pb-2 mb-3">
                <i className="bi bi-person me-2 text-success"></i>
                Kullanıcı Bilgileri
              </h5>
              <div className="row g-3 mb-4">
                <div className="col-md-6">
                  <label className="form-label text-muted small mb-1">Atanan Kullanıcı</label>
                  <div className="fw-semibold">{vehicle.assignedUserName || '-'}</div>
                </div>
                <div className="col-md-6">
                  <label className="form-label text-muted small mb-1">Telefon</label>
                  <div className="fw-semibold">{vehicle.assignedUserPhone || '-'}</div>
                </div>
                <div className="col-md-12">
                  <label className="form-label text-muted small mb-1">Konum</label>
                  <div className="fw-semibold">{vehicle.location || '-'}</div>
                </div>
              </div>

              {/* Teknik Bilgiler */}
              <h5 className="card-title border-bottom pb-2 mb-3">
                <i className="bi bi-gear me-2 text-warning"></i>
                Teknik Bilgiler
              </h5>
              <div className="row g-3 mb-4">
                <div className="col-md-6">
                  <label className="form-label text-muted small mb-1">Kilometre</label>
                  <div className="fw-semibold">
                    {vehicle.currentMileage ? `${vehicle.currentMileage.toLocaleString()} km` : '-'}
                  </div>
                </div>
                <div className="col-md-6">
                  <label className="form-label text-muted small mb-1">Yakıt Tüketimi</label>
                  <div className="fw-semibold">
                    {vehicle.fuelConsumption ? `${vehicle.fuelConsumption} L/100km` : '-'}
                  </div>
                </div>
                <div className="col-md-12">
                  <label className="form-label text-muted small mb-1">Lastik Durumu</label>
                  <div>
                    <span className={`badge bg-${getTireConditionBadge(vehicle.tireCondition)}`}>
                      {getTireConditionText(vehicle.tireCondition)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Bakım ve Sigorta */}
              <h5 className="card-title border-bottom pb-2 mb-3">
                <i className="bi bi-tools me-2 text-danger"></i>
                Bakım ve Sigorta
              </h5>
              <div className="row g-3 mb-4">
                <div className="col-md-6">
                  <label className="form-label text-muted small mb-1">Son Servis Tarihi</label>
                  <div className="fw-semibold">{formatDate(vehicle.lastServiceDate)}</div>
                </div>
                <div className="col-md-6">
                  <label className="form-label text-muted small mb-1">Muayene Tarihi</label>
                  <div className="fw-semibold">{formatDate(vehicle.inspectionDate)}</div>
                </div>
                <div className="col-md-6">
                  <label className="form-label text-muted small mb-1">Sigorta Şirketi</label>
                  <div className="fw-semibold">{vehicle.insurance || '-'}</div>
                </div>
                <div className="col-md-6">
                  <label className="form-label text-muted small mb-1">Sigorta Bitiş Tarihi</label>
                  <div className="fw-semibold">{formatDate(vehicle.insuranceExpiryDate)}</div>
                </div>
                <div className="col-md-12">
                  <label className="form-label text-muted small mb-1">Ruhsat Bilgisi</label>
                  <div className="fw-semibold">{vehicle.registrationInfo || '-'}</div>
                </div>
              </div>

              {/* Notlar */}
              {vehicle.notes && (
                <>
                  <h5 className="card-title border-bottom pb-2 mb-3">
                    <i className="bi bi-journal-text me-2 text-info"></i>
                    Notlar
                  </h5>
                  <div className="alert alert-light">
                    {vehicle.notes}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Sağ Kolon - Resim (Varsa) */}
        {imageUrl && (
          <div className="col-12 col-lg-5">
            <div className="card shadow-sm">
              <div className="card-header bg-white">
                <h6 className="mb-0">
                  <i className="bi bi-image me-2"></i>
                  Araç Resmi
                </h6>
              </div>
              <div className="card-body text-center">
                <img
                  src={imageUrl}
                  alt={`${vehicle.brand} ${vehicle.model}`}
                  className="img-fluid rounded"
                  style={{ maxHeight: '400px', objectFit: 'contain' }}
                  onError={(e) => {
                    e.target.src = 'https://via.placeholder.com/400x300?text=Resim+Yüklenemedi';
                  }}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VehicleDetailPage;