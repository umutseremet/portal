// src/frontend/src/components/Vehicles/VehicleForm.js

import React, { useState, useEffect } from 'react';
import { vehicleService } from '../../services/vehicleService';

const VehicleForm = ({ 
  vehicle = null, 
  onSave, 
  onCancel, 
  loading = false, 
  isEdit = false 
}) => {
  const [formData, setFormData] = useState({
    licensePlate: '',
    brand: '',
    model: '',
    year: new Date().getFullYear(),
    vin: '',
    companyName: '',
    inspectionDate: '',
    insurance: '',
    insuranceExpiryDate: '',
    lastServiceDate: '',
    currentMileage: 0,
    fuelConsumption: 0,
    tireCondition: '',
    registrationInfo: '',
    ownershipType: 'company',
    assignedUserName: '',
    assignedUserPhone: '',
    location: '',
    vehicleImageUrl: ''
  });

  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Initialize form data
  useEffect(() => {
    if (vehicle && isEdit) {
      setFormData({
        licensePlate: vehicle.licensePlate || '',
        brand: vehicle.brand || '',
        model: vehicle.model || '',
        year: vehicle.year || new Date().getFullYear(),
        vin: vehicle.vin || '',
        companyName: vehicle.companyName || '',
        inspectionDate: vehicle.inspectionDate ? vehicle.inspectionDate.split('T')[0] : '',
        insurance: vehicle.insurance || '',
        insuranceExpiryDate: vehicle.insuranceExpiryDate ? vehicle.insuranceExpiryDate.split('T')[0] : '',
        lastServiceDate: vehicle.lastServiceDate ? vehicle.lastServiceDate.split('T')[0] : '',
        currentMileage: vehicle.currentMileage || 0,
        fuelConsumption: vehicle.fuelConsumption || 0,
        tireCondition: vehicle.tireCondition || '',
        registrationInfo: vehicle.registrationInfo || '',
        ownershipType: vehicle.ownershipType || 'company',
        assignedUserName: vehicle.assignedUserName || '',
        assignedUserPhone: vehicle.assignedUserPhone || '',
        location: vehicle.location || '',
        vehicleImageUrl: vehicle.vehicleImageUrl || ''
      });
    }
  }, [vehicle, isEdit]);

  // Handle input change
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

    // Required fields
    if (!formData.licensePlate.trim()) {
      newErrors.licensePlate = 'Plaka zorunludur';
    } else {
      // Basic Turkish license plate validation
      const plateRegex = /^[0-9]{2}\s?[A-Z]{1,3}\s?[0-9]{1,4}$/i;
      if (!plateRegex.test(formData.licensePlate.trim())) {
        newErrors.licensePlate = 'Geçerli bir plaka formatı giriniz (örn: 34 ABC 123)';
      }
    }

    if (!formData.brand.trim()) {
      newErrors.brand = 'Marka zorunludur';
    }

    if (!formData.model.trim()) {
      newErrors.model = 'Model zorunludur';
    }

    if (!formData.year || formData.year < 1900 || formData.year > new Date().getFullYear() + 1) {
      newErrors.year = 'Geçerli bir model yılı giriniz';
    }

    if (!formData.vin.trim()) {
      newErrors.vin = 'VIN numarası zorunludur';
    }

    if (!formData.companyName.trim()) {
      newErrors.companyName = 'Şirket adı zorunludur';
    }

    if (!formData.insurance.trim()) {
      newErrors.insurance = 'Sigorta bilgisi zorunludur';
    }

    if (!formData.tireCondition.trim()) {
      newErrors.tireCondition = 'Lastik durumu zorunludur';
    }

    if (!formData.registrationInfo.trim()) {
      newErrors.registrationInfo = 'Ruhsat bilgisi zorunludur';
    }

    if (!formData.assignedUserName.trim()) {
      newErrors.assignedUserName = 'Kullanıcı adı zorunludur';
    }

    if (!formData.assignedUserPhone.trim()) {
      newErrors.assignedUserPhone = 'Telefon numarası zorunludur';
    }

    if (!formData.location.trim()) {
      newErrors.location = 'Konum zorunludur';
    }

    // Numeric validations
    if (formData.currentMileage < 0) {
      newErrors.currentMileage = 'Kilometre negatif olamaz';
    }

    if (formData.fuelConsumption < 0 || formData.fuelConsumption > 99.9) {
      newErrors.fuelConsumption = 'Yakıt tüketimi 0-99.9 arasında olmalıdır';
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
      // Format data for API
      const submitData = {
        ...formData,
        licensePlate: formData.licensePlate.toUpperCase().trim(),
        year: parseInt(formData.year),
        currentMileage: parseInt(formData.currentMileage),
        fuelConsumption: parseFloat(formData.fuelConsumption),
        inspectionDate: formData.inspectionDate || null,
        insuranceExpiryDate: formData.insuranceExpiryDate || null,
        lastServiceDate: formData.lastServiceDate || null
      };

      await onSave?.(submitData);
    } catch (error) {
      console.error('Form submission error:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - 1979 }, (_, i) => currentYear - i);

  return (
    <div className="vehicle-form">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="h3 mb-1">
            {isEdit ? 'Araç Düzenle' : 'Yeni Araç Ekle'}
          </h2>
          <p className="text-muted mb-0">
            {isEdit ? 'Araç bilgilerini güncelleyin' : 'Yeni araç bilgilerini girin'}
          </p>
        </div>
        <button 
          className="btn btn-outline-secondary" 
          onClick={onCancel}
          disabled={submitting || loading}
        >
          <i className="bi bi-x me-2"></i>
          İptal
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="row g-4">
          {/* Basic Information */}
          <div className="col-12">
            <div className="card">
              <div className="card-header">
                <h5 className="card-title mb-0">
                  <i className="bi bi-info-circle me-2"></i>
                  Temel Bilgiler
                </h5>
              </div>
              <div className="card-body">
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label">Plaka <span className="text-danger">*</span></label>
                    <input
                      type="text"
                      className={`form-control ${errors.licensePlate ? 'is-invalid' : ''}`}
                      name="licensePlate"
                      value={formData.licensePlate}
                      onChange={handleChange}
                      placeholder="34 ABC 123"
                      disabled={submitting || loading}
                    />
                    {errors.licensePlate && (
                      <div className="invalid-feedback">{errors.licensePlate}</div>
                    )}
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">Marka <span className="text-danger">*</span></label>
                    <input
                      type="text"
                      className={`form-control ${errors.brand ? 'is-invalid' : ''}`}
                      name="brand"
                      value={formData.brand}
                      onChange={handleChange}
                      placeholder="Örn: Toyota"
                      disabled={submitting || loading}
                    />
                    {errors.brand && (
                      <div className="invalid-feedback">{errors.brand}</div>
                    )}
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">Model <span className="text-danger">*</span></label>
                    <input
                      type="text"
                      className={`form-control ${errors.model ? 'is-invalid' : ''}`}
                      name="model"
                      value={formData.model}
                      onChange={handleChange}
                      placeholder="Örn: Corolla"
                      disabled={submitting || loading}
                    />
                    {errors.model && (
                      <div className="invalid-feedback">{errors.model}</div>
                    )}
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">Model Yılı <span className="text-danger">*</span></label>
                    <select
                      className={`form-select ${errors.year ? 'is-invalid' : ''}`}
                      name="year"
                      value={formData.year}
                      onChange={handleChange}
                      disabled={submitting || loading}
                    >
                      {years.map(year => (
                        <option key={year} value={year}>{year}</option>
                      ))}
                    </select>
                    {errors.year && (
                      <div className="invalid-feedback">{errors.year}</div>
                    )}
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">VIN Numarası <span className="text-danger">*</span></label>
                    <input
                      type="text"
                      className={`form-control ${errors.vin ? 'is-invalid' : ''}`}
                      name="vin"
                      value={formData.vin}
                      onChange={handleChange}
                      placeholder="17 karakter VIN"
                      disabled={submitting || loading}
                    />
                    {errors.vin && (
                      <div className="invalid-feedback">{errors.vin}</div>
                    )}
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">Sahiplik Türü</label>
                    <select
                      className="form-select"
                      name="ownershipType"
                      value={formData.ownershipType}
                      onChange={handleChange}
                      disabled={submitting || loading}
                    >
                      <option value="company">Şirket</option>
                      <option value="rental">Kiralık</option>
                      <option value="personal">Kişisel</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Company & User Information */}
          <div className="col-12">
            <div className="card">
              <div className="card-header">
                <h5 className="card-title mb-0">
                  <i className="bi bi-building me-2"></i>
                  Şirket & Kullanıcı Bilgileri
                </h5>
              </div>
              <div className="card-body">
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label">Şirket Adı <span className="text-danger">*</span></label>
                    <input
                      type="text"
                      className={`form-control ${errors.companyName ? 'is-invalid' : ''}`}
                      name="companyName"
                      value={formData.companyName}
                      onChange={handleChange}
                      placeholder="Şirket adını girin"
                      disabled={submitting || loading}
                    />
                    {errors.companyName && (
                      <div className="invalid-feedback">{errors.companyName}</div>
                    )}
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">Konum <span className="text-danger">*</span></label>
                    <input
                      type="text"
                      className={`form-control ${errors.location ? 'is-invalid' : ''}`}
                      name="location"
                      value={formData.location}
                      onChange={handleChange}
                      placeholder="Araç konumu"
                      disabled={submitting || loading}
                    />
                    {errors.location && (
                      <div className="invalid-feedback">{errors.location}</div>
                    )}
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">Atanan Kullanıcı <span className="text-danger">*</span></label>
                    <input
                      type="text"
                      className={`form-control ${errors.assignedUserName ? 'is-invalid' : ''}`}
                      name="assignedUserName"
                      value={formData.assignedUserName}
                      onChange={handleChange}
                      placeholder="Kullanıcı adı"
                      disabled={submitting || loading}
                    />
                    {errors.assignedUserName && (
                      <div className="invalid-feedback">{errors.assignedUserName}</div>
                    )}
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">Telefon <span className="text-danger">*</span></label>
                    <input
                      type="tel"
                      className={`form-control ${errors.assignedUserPhone ? 'is-invalid' : ''}`}
                      name="assignedUserPhone"
                      value={formData.assignedUserPhone}
                      onChange={handleChange}
                      placeholder="0555 123 45 67"
                      disabled={submitting || loading}
                    />
                    {errors.assignedUserPhone && (
                      <div className="invalid-feedback">{errors.assignedUserPhone}</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Technical Information */}
          <div className="col-12">
            <div className="card">
              <div className="card-header">
                <h5 className="card-title mb-0">
                  <i className="bi bi-gear me-2"></i>
                  Teknik Bilgiler
                </h5>
              </div>
              <div className="card-body">
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label">Kilometre</label>
                    <div className="input-group">
                      <input
                        type="number"
                        className={`form-control ${errors.currentMileage ? 'is-invalid' : ''}`}
                        name="currentMileage"
                        value={formData.currentMileage}
                        onChange={handleChange}
                        min="0"
                        disabled={submitting || loading}
                      />
                      <span className="input-group-text">km</span>
                    </div>
                    {errors.currentMileage && (
                      <div className="invalid-feedback">{errors.currentMileage}</div>
                    )}
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">Yakıt Tüketimi</label>
                    <div className="input-group">
                      <input
                        type="number"
                        className={`form-control ${errors.fuelConsumption ? 'is-invalid' : ''}`}
                        name="fuelConsumption"
                        value={formData.fuelConsumption}
                        onChange={handleChange}
                        min="0"
                        max="99.9"
                        step="0.1"
                        disabled={submitting || loading}
                      />
                      <span className="input-group-text">L/100km</span>
                    </div>
                    {errors.fuelConsumption && (
                      <div className="invalid-feedback">{errors.fuelConsumption}</div>
                    )}
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">Lastik Durumu <span className="text-danger">*</span></label>
                    <select
                      className={`form-select ${errors.tireCondition ? 'is-invalid' : ''}`}
                      name="tireCondition"
                      value={formData.tireCondition}
                      onChange={handleChange}
                      disabled={submitting || loading}
                    >
                      <option value="">Seçiniz</option>
                      <option value="excellent">Mükemmel</option>
                      <option value="good">İyi</option>
                      <option value="fair">Orta</option>
                      <option value="poor">Kötü</option>
                      <option value="needsReplacement">Değiştirilmeli</option>
                    </select>
                    {errors.tireCondition && (
                      <div className="invalid-feedback">{errors.tireCondition}</div>
                    )}
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">Son Servis Tarihi</label>
                    <input
                      type="date"
                      className="form-control"
                      name="lastServiceDate"
                      value={formData.lastServiceDate}
                      onChange={handleChange}
                      disabled={submitting || loading}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Insurance & Documentation */}
          <div className="col-12">
            <div className="card">
              <div className="card-header">
                <h5 className="card-title mb-0">
                  <i className="bi bi-shield-check me-2"></i>
                  Sigorta & Evraklar
                </h5>
              </div>
              <div className="card-body">
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label">Sigorta Şirketi <span className="text-danger">*</span></label>
                    <input
                      type="text"
                      className={`form-control ${errors.insurance ? 'is-invalid' : ''}`}
                      name="insurance"
                      value={formData.insurance}
                      onChange={handleChange}
                      placeholder="Sigorta şirketi adı"
                      disabled={submitting || loading}
                    />
                    {errors.insurance && (
                      <div className="invalid-feedback">{errors.insurance}</div>
                    )}
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">Sigorta Bitiş Tarihi</label>
                    <input
                      type="date"
                      className="form-control"
                      name="insuranceExpiryDate"
                      value={formData.insuranceExpiryDate}
                      onChange={handleChange}
                      disabled={submitting || loading}
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">Muayene Tarihi</label>
                    <input
                      type="date"
                      className="form-control"
                      name="inspectionDate"
                      value={formData.inspectionDate}
                      onChange={handleChange}
                      disabled={submitting || loading}
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">Araç Resmi URL</label>
                    <input
                      type="url"
                      className="form-control"
                      name="vehicleImageUrl"
                      value={formData.vehicleImageUrl}
                      onChange={handleChange}
                      placeholder="https://example.com/image.jpg"
                      disabled={submitting || loading}
                    />
                  </div>

                  <div className="col-12">
                    <label className="form-label">Ruhsat Bilgileri <span className="text-danger">*</span></label>
                    <textarea
                      className={`form-control ${errors.registrationInfo ? 'is-invalid' : ''}`}
                      name="registrationInfo"
                      value={formData.registrationInfo}
                      onChange={handleChange}
                      rows="3"
                      placeholder="Ruhsat bilgilerini girin"
                      disabled={submitting || loading}
                    />
                    {errors.registrationInfo && (
                      <div className="invalid-feedback">{errors.registrationInfo}</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="d-flex justify-content-end gap-3 mt-4">
          <button 
            type="button" 
            className="btn btn-outline-secondary"
            onClick={onCancel}
            disabled={submitting || loading}
          >
            <i className="bi bi-x me-2"></i>
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
            <i className="bi bi-check me-2"></i>
            {isEdit ? 'Güncelle' : 'Kaydet'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default VehicleForm;