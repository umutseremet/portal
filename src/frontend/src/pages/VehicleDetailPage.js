// src/frontend/src/pages/VehicleDetailPage.js
// ✅ TAM DÜZELTİLMİŞ VERSİYON - API'den veri çekme eklendi

import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useToast } from '../contexts/ToastContext';
import vehicleService from '../services/vehicleService';

const VehicleDetailPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { id } = useParams();
  const toast = useToast();

  const [vehicle, setVehicle] = useState(location.state?.vehicle || null);
  const [loading, setLoading] = useState(false);

  // Resim URL'sini oluştur
  const apiBaseUrl = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5154/api';
  const baseUrl = apiBaseUrl.replace('/api', '');
  const imageUrl = vehicle?.vehicleImageUrl ? `${baseUrl}${vehicle.vehicleImageUrl}` : null;

  // ✅ API'den veri çek (eğer state'te yoksa)
  useEffect(() => {
    if (!vehicle && id) {
      loadVehicle();
    }
  }, [id]);

  const loadVehicle = async () => {
    try {
      setLoading(true);
      console.log('🔍 Loading vehicle with ID:', id);
      
      const data = await vehicleService.getVehicle(id);
      console.log('✅ Vehicle loaded:', data);
      
      setVehicle(data);
    } catch (error) {
      console.error('❌ Error loading vehicle:', error);
      toast.error('Araç bilgisi yüklenirken hata oluştu: ' + error.message);
      // Hata durumunda listeye yönlendir
      setTimeout(() => navigate('/vehicles'), 2000);
    } finally {
      setLoading(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="container-fluid py-4">
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Yükleniyor...</span>
          </div>
          <p className="mt-3 text-muted">Araç bilgileri yükleniyor...</p>
        </div>
      </div>
    );
  }

  // No vehicle state
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
    navigate(`/vehicles/${vehicle.id}/fuel-purchases`, { state: { vehicle } });
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
        <div className={`${imageUrl ? 'col-lg-8' : 'col-12'}`}>
          {/* Temel Bilgiler */}
          <div className="card mb-4">
            <div className="card-header bg-light">
              <h5 className="card-title mb-0">
                <i className="bi bi-info-circle me-2"></i>
                Temel Bilgiler
              </h5>
            </div>
            <div className="card-body">
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label text-muted small">Plaka</label>
                  <div className="fw-bold text-primary">{vehicle.licensePlate}</div>
                </div>
                <div className="col-md-6">
                  <label className="form-label text-muted small">Marka</label>
                  <div>{vehicle.brand}</div>
                </div>
                <div className="col-md-6">
                  <label className="form-label text-muted small">Model</label>
                  <div>{vehicle.model}</div>
                </div>
                <div className="col-md-6">
                  <label className="form-label text-muted small">Yıl</label>
                  <div>{vehicle.year}</div>
                </div>
                <div className="col-12">
                  <label className="form-label text-muted small">VIN Numarası</label>
                  <div className="font-monospace small">{vehicle.vin || 'Belirtilmemiş'}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Şirket & Konum */}
          <div className="card mb-4">
            <div className="card-header bg-light">
              <h5 className="card-title mb-0">
                <i className="bi bi-building me-2"></i>
                Şirket & Konum
              </h5>
            </div>
            <div className="card-body">
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label text-muted small">Şirket Adı</label>
                  <div className="fw-medium">{vehicle.companyName || 'Belirtilmemiş'}</div>
                </div>
                <div className="col-md-6">
                  <label className="form-label text-muted small">Konum</label>
                  <div>{vehicle.location || 'Belirtilmemiş'}</div>
                </div>
                <div className="col-md-6">
                  <label className="form-label text-muted small">Atanan Kullanıcı</label>
                  <div>{vehicle.assignedUserName || 'Belirtilmemiş'}</div>
                </div>
                <div className="col-md-6">
                  <label className="form-label text-muted small">Telefon</label>
                  <div>{vehicle.assignedUserPhone || 'Belirtilmemiş'}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Araç Durumu */}
          <div className="card mb-4">
            <div className="card-header bg-light">
              <h5 className="card-title mb-0">
                <i className="bi bi-speedometer2 me-2"></i>
                Araç Durumu
              </h5>
            </div>
            <div className="card-body">
              <div className="row g-3">
                <div className="col-md-4">
                  <label className="form-label text-muted small">Kilometre</label>
                  <div className="fw-bold">{vehicle.currentMileage ? vehicle.currentMileage.toLocaleString() : '-'} km</div>
                </div>
                <div className="col-md-4">
                  <label className="form-label text-muted small">Yakıt Tüketimi</label>
                  <div>{vehicle.fuelConsumption || '-'} L/100km</div>
                </div>
                <div className="col-md-4">
                  <label className="form-label text-muted small">Lastik Durumu</label>
                  <div>
                    <span className={`badge bg-${getTireConditionBadge(vehicle.tireCondition)}`}>
                      {getTireConditionText(vehicle.tireCondition)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bakım & Sigorta */}
          <div className="card">
            <div className="card-header bg-light">
              <h5 className="card-title mb-0">
                <i className="bi bi-shield-check me-2"></i>
                Bakım & Sigorta
              </h5>
            </div>
            <div className="card-body">
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label text-muted small">Son Servis Tarihi</label>
                  <div>{formatDate(vehicle.lastServiceDate)}</div>
                </div>
                <div className="col-md-6">
                  <label className="form-label text-muted small">Muayene Tarihi</label>
                  <div>{formatDate(vehicle.inspectionDate)}</div>
                </div>
                <div className="col-md-6">
                  <label className="form-label text-muted small">Sigorta</label>
                  <div>{vehicle.insurance || 'Belirtilmemiş'}</div>
                </div>
                <div className="col-md-6">
                  <label className="form-label text-muted small">Sigorta Bitiş</label>
                  <div>{formatDate(vehicle.insuranceExpiryDate)}</div>
                </div>
                <div className="col-12">
                  <label className="form-label text-muted small">Ruhsat Bilgisi</label>
                  <div>{vehicle.registrationInfo || 'Belirtilmemiş'}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sağ Kolon - Resim */}
        {imageUrl && (
          <div className="col-lg-4">
            <div className="card sticky-top" style={{ top: '100px' }}>
              <div className="card-header bg-light">
                <h5 className="card-title mb-0">
                  <i className="bi bi-image me-2"></i>
                  Araç Resmi
                </h5>
              </div>
              <div className="card-body p-0">
                <img 
                  src={imageUrl} 
                  alt={`${vehicle.brand} ${vehicle.model}`}
                  className="img-fluid w-100"
                  style={{ objectFit: 'cover', maxHeight: '400px' }}
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