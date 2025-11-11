// src/frontend/src/components/Vehicles/VehicleModal.js

import React, { useState, useEffect } from 'react';

const VehicleModal = ({
  show,
  onHide,
  onSave,
  vehicle = null,
  loading = false
}) => {
  const isEdit = vehicle !== null;

  const [formData, setFormData] = useState({
    licensePlate: '',
    brand: '',
    model: '',
    year: new Date().getFullYear(),
    vin: '',
    companyName: '',
    location: '',
    assignedUserName: '',
    assignedUserPhone: '',
    currentMileage: '',
    fuelConsumption: '',
    tireCondition: '',
    lastServiceDate: '',
    insurance: '',
    insuranceExpiryDate: '',
    inspectionDate: '',
    ownershipType: 'company',
    vehicleImageUrl: '',
    registrationInfo: ''
  });

  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Initialize form data when modal opens
  useEffect(() => {
    if (show) {
      if (isEdit && vehicle) {
        setFormData({
          licensePlate: vehicle.licensePlate || '',
          brand: vehicle.brand || '',
          model: vehicle.model || '',
          year: vehicle.year || new Date().getFullYear(),
          vin: vehicle.vin || '',
          companyName: vehicle.companyName || '',
          location: vehicle.location || '',
          assignedUserName: vehicle.assignedUserName || '',
          assignedUserPhone: vehicle.assignedUserPhone || '',
          currentMileage: vehicle.currentMileage || '',
          fuelConsumption: vehicle.fuelConsumption || '',
          tireCondition: vehicle.tireCondition || '',
          lastServiceDate: vehicle.lastServiceDate ? vehicle.lastServiceDate.split('T')[0] : '',
          insurance: vehicle.insurance || '',
          insuranceExpiryDate: vehicle.insuranceExpiryDate ? vehicle.insuranceExpiryDate.split('T')[0] : '',
          inspectionDate: vehicle.inspectionDate ? vehicle.inspectionDate.split('T')[0] : '',
          ownershipType: vehicle.ownershipType || 'company',
          vehicleImageUrl: vehicle.vehicleImageUrl || '',
          registrationInfo: vehicle.registrationInfo || ''
        });
      } else {
        setFormData({
          licensePlate: '',
          brand: '',
          model: '',
          year: new Date().getFullYear(),
          vin: '',
          companyName: '',
          location: '',
          assignedUserName: '',
          assignedUserPhone: '',
          currentMileage: '',
          fuelConsumption: '',
          tireCondition: '',
          lastServiceDate: '',
          insurance: '',
          insuranceExpiryDate: '',
          inspectionDate: '',
          ownershipType: 'company',
          vehicleImageUrl: '',
          registrationInfo: ''
        });
      }
      setErrors({});
    }
  }, [show, vehicle, isEdit]);

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};

    if (!formData.licensePlate.trim()) {
      newErrors.licensePlate = 'Plaka zorunludur';
    }

    if (!formData.brand.trim()) {
      newErrors.brand = 'Marka zorunludur';
    }

    if (!formData.model.trim()) {
      newErrors.model = 'Model zorunludur';
    }

    if (!formData.year || formData.year < 1980 || formData.year > new Date().getFullYear() + 1) {
      newErrors.year = 'Geçerli bir yıl giriniz';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setSubmitting(true);

    try {
      // ✅ DÜZELTİLDİ: Decimal alanları güvenli şekilde parse et
      const submitData = {
        licensePlate: formData.licensePlate.trim(),
        brand: formData.brand.trim(),
        model: formData.model.trim(),
        year: parseInt(formData.year),
        vin: formData.vin.trim(),
        companyName: formData.companyName.trim(),
        location: formData.location.trim(),
        assignedUserName: formData.assignedUserName.trim(),
        assignedUserPhone: formData.assignedUserPhone.trim(),

        // ✅ DECIMAL ALANLARI - Boş ise null gönder
        currentMileage: formData.currentMileage && formData.currentMileage !== ''
          ? parseInt(formData.currentMileage)
          : null,

        fuelConsumption: formData.fuelConsumption && formData.fuelConsumption !== ''
          ? parseFloat(formData.fuelConsumption)
          : null, // ← BURASI ÖNEMLİ!

        // Tarih alanları
        lastServiceDate: formData.lastServiceDate || null,
        insuranceExpiryDate: formData.insuranceExpiryDate || null,
        inspectionDate: formData.inspectionDate || null,

        // Diğer alanlar
        tireCondition: formData.tireCondition.trim() || null,
        insurance: formData.insurance.trim() || null,
        ownershipType: formData.ownershipType,
        vehicleImageUrl: formData.vehicleImageUrl?.trim() || null,
        registrationInfo: formData.registrationInfo?.trim() || null,
        notes: formData.notes?.trim() || null
      };

      console.log('📤 Submitting vehicle data:', submitData);

      await onSave(submitData);
    } catch (error) {
      console.error('❌ Form submission error:', error);
      setErrors({ submit: error.message || 'Kayıt sırasında hata oluştu' });
    } finally {
      setSubmitting(false);
    }
  };

  // Handle modal close
  const handleClose = () => {
    if (!submitting) {
      setErrors({});
      onHide?.();
    }
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - 1979 }, (_, i) => currentYear - i);

  if (!show) return null;

  return (
    <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-lg modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">
              <i className="bi bi-car-front me-2"></i>
              {isEdit ? 'Araç Düzenle' : 'Yeni Araç Ekle'}
            </h5>
            <button
              type="button"
              className="btn-close"
              onClick={handleClose}
              disabled={submitting}
            ></button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              {/* Temel Bilgiler */}
              <div className="row mb-4">
                <div className="col-12">
                  <h6 className="text-muted border-bottom pb-2 mb-3">
                    <i className="bi bi-info-circle me-1"></i>
                    Temel Bilgiler
                  </h6>
                </div>

                <div className="col-md-6 mb-3">
                  <label className="form-label">
                    Plaka <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    className={`form-control ${errors.licensePlate ? 'is-invalid' : ''}`}
                    name="licensePlate"
                    value={formData.licensePlate}
                    onChange={handleChange}
                    placeholder="34 ABC 123"
                    disabled={submitting}
                  />
                  {errors.licensePlate && (
                    <div className="invalid-feedback">{errors.licensePlate}</div>
                  )}
                </div>

                <div className="col-md-6 mb-3">
                  <label className="form-label">
                    Marka <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    className={`form-control ${errors.brand ? 'is-invalid' : ''}`}
                    name="brand"
                    value={formData.brand}
                    onChange={handleChange}
                    placeholder="Toyota, BMW..."
                    disabled={submitting}
                  />
                  {errors.brand && (
                    <div className="invalid-feedback">{errors.brand}</div>
                  )}
                </div>

                <div className="col-md-6 mb-3">
                  <label className="form-label">
                    Model <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    className={`form-control ${errors.model ? 'is-invalid' : ''}`}
                    name="model"
                    value={formData.model}
                    onChange={handleChange}
                    placeholder="Corolla, X3..."
                    disabled={submitting}
                  />
                  {errors.model && (
                    <div className="invalid-feedback">{errors.model}</div>
                  )}
                </div>

                <div className="col-md-6 mb-3">
                  <label className="form-label">
                    Yıl <span className="text-danger">*</span>
                  </label>
                  <select
                    className={`form-select ${errors.year ? 'is-invalid' : ''}`}
                    name="year"
                    value={formData.year}
                    onChange={handleChange}
                    disabled={submitting}
                  >
                    {years.map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                  {errors.year && (
                    <div className="invalid-feedback">{errors.year}</div>
                  )}
                </div>

                <div className="col-md-6 mb-3">
                  <label className="form-label">VIN Numarası</label>
                  <input
                    type="text"
                    className="form-control"
                    name="vin"
                    value={formData.vin}
                    onChange={handleChange}
                    placeholder="17 karakter VIN"
                    disabled={submitting}
                  />
                </div>

                <div className="col-md-6 mb-3">
                  <label className="form-label">Sahiplik Türü</label>
                  <select
                    className="form-select"
                    name="ownershipType"
                    value={formData.ownershipType}
                    onChange={handleChange}
                    disabled={submitting}
                  >
                    <option value="company">Şirket</option>
                    <option value="rental">Kiralık</option>
                    <option value="personal">Kişisel</option>
                  </select>
                </div>
              </div>

              {/* Şirket & Konum Bilgileri */}
              <div className="row mb-4">
                <div className="col-12">
                  <h6 className="text-muted border-bottom pb-2 mb-3">
                    <i className="bi bi-building me-1"></i>
                    Şirket & Konum Bilgileri
                  </h6>
                </div>

                <div className="col-md-6 mb-3">
                  <label className="form-label">Şirket Adı</label>
                  <input
                    type="text"
                    className="form-control"
                    name="companyName"
                    value={formData.companyName}
                    onChange={handleChange}
                    placeholder="Şirket adı"
                    disabled={submitting}
                  />
                </div>

                <div className="col-md-6 mb-3">
                  <label className="form-label">Konum</label>
                  <input
                    type="text"
                    className="form-control"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    placeholder="Araç konumu"
                    disabled={submitting}
                  />
                </div>

                <div className="col-md-6 mb-3">
                  <label className="form-label">Atanan Kullanıcı</label>
                  <input
                    type="text"
                    className="form-control"
                    name="assignedUserName"
                    value={formData.assignedUserName}
                    onChange={handleChange}
                    placeholder="Kullanıcı adı"
                    disabled={submitting}
                  />
                </div>

                <div className="col-md-6 mb-3">
                  <label className="form-label">Telefon</label>
                  <input
                    type="tel"
                    className="form-control"
                    name="assignedUserPhone"
                    value={formData.assignedUserPhone}
                    onChange={handleChange}
                    placeholder="0555 123 45 67"
                    disabled={submitting}
                  />
                </div>
              </div>

              {/* Teknik Bilgiler */}
              <div className="row mb-4">
                <div className="col-12">
                  <h6 className="text-muted border-bottom pb-2 mb-3">
                    <i className="bi bi-gear me-1"></i>
                    Teknik Bilgiler
                  </h6>
                </div>

                <div className="col-md-6 mb-3">
                  <label className="form-label">Kilometre</label>
                  <div className="input-group">
                    <input
                      type="number"
                      className="form-control"
                      name="currentMileage"
                      value={formData.currentMileage}
                      onChange={handleChange}
                      min="0"
                      placeholder="0"
                      disabled={submitting}
                    />
                    <span className="input-group-text">km</span>
                  </div>
                </div>

                <div className="col-md-6 mb-3">
                  <label className="form-label">Yakıt Tüketimi</label>
                  <div className="input-group">
                    <input
                      type="number"
                      step="0.1"
                      className="form-control"
                      name="fuelConsumption"
                      value={formData.fuelConsumption}
                      onChange={handleChange}
                      min="0"
                      placeholder="6.5"
                      disabled={submitting}
                    />
                    <span className="input-group-text">L/100km</span>
                  </div>
                </div>

                <div className="col-md-6 mb-3">
                  <label className="form-label">Lastik Durumu</label>
                  <select
                    className="form-select"
                    name="tireCondition"
                    value={formData.tireCondition}
                    onChange={handleChange}
                    disabled={submitting}
                  >
                    <option value="">Seçiniz</option>
                    <option value="excellent">Mükemmel</option>
                    <option value="good">İyi</option>
                    <option value="fair">Orta</option>
                    <option value="poor">Kötü</option>
                    <option value="needsReplacement">Değiştirilmeli</option>
                  </select>
                </div>

                <div className="col-md-6 mb-3">
                  <label className="form-label">Son Servis Tarihi</label>
                  <input
                    type="date"
                    className="form-control"
                    name="lastServiceDate"
                    value={formData.lastServiceDate}
                    onChange={handleChange}
                    disabled={submitting}
                  />
                </div>
              </div>

              {/* Sigorta & Muayene Bilgileri */}
              <div className="row mb-4">
                <div className="col-12">
                  <h6 className="text-muted border-bottom pb-2 mb-3">
                    <i className="bi bi-shield-check me-1"></i>
                    Sigorta & Muayene Bilgileri
                  </h6>
                </div>

                <div className="col-md-6 mb-3">
                  <label className="form-label">Sigorta Şirketi</label>
                  <input
                    type="text"
                    className="form-control"
                    name="insurance"
                    value={formData.insurance}
                    onChange={handleChange}
                    placeholder="Sigorta şirketi adı"
                    disabled={submitting}
                  />
                </div>

                <div className="col-md-6 mb-3">
                  <label className="form-label">Sigorta Bitiş Tarihi</label>
                  <input
                    type="date"
                    className="form-control"
                    name="insuranceExpiryDate"
                    value={formData.insuranceExpiryDate}
                    onChange={handleChange}
                    disabled={submitting}
                  />
                </div>

                <div className="col-md-6 mb-3">
                  <label className="form-label">Muayene Tarihi</label>
                  <input
                    type="date"
                    className="form-control"
                    name="inspectionDate"
                    value={formData.inspectionDate}
                    onChange={handleChange}
                    disabled={submitting}
                  />
                </div>
              </div>

              {/* Diğer Bilgiler */}
              <div className="row mb-4">
                <div className="col-12">
                  <h6 className="text-muted border-bottom pb-2 mb-3">
                    <i className="bi bi-image me-1"></i>
                    Diğer Bilgiler
                  </h6>
                </div>

                <div className="col-12 mb-3">
                  <label className="form-label">Araç Resmi URL</label>
                  <input
                    type="url"
                    className="form-control"
                    name="vehicleImageUrl"
                    value={formData.vehicleImageUrl}
                    onChange={handleChange}
                    placeholder="https://example.com/image.jpg"
                    disabled={submitting}
                  />
                </div>

                <div className="col-12 mb-3">
                  <label className="form-label">Ruhsat Bilgileri</label>
                  <textarea
                    className="form-control"
                    name="registrationInfo"
                    value={formData.registrationInfo}
                    onChange={handleChange}
                    rows="3"
                    placeholder="Ruhsat bilgilerini girin"
                    disabled={submitting}
                  />
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleClose}
                disabled={submitting}
              >
                <i className="bi bi-x me-1"></i>
                İptal
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={submitting || loading}
              >
                {(submitting || loading) && (
                  <span className="spinner-border spinner-border-sm me-2" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </span>
                )}
                <i className="bi bi-check2 me-1"></i>
                {isEdit ? 'Güncelle' : 'Kaydet'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default VehicleModal;