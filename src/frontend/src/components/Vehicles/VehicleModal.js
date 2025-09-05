// src/frontend/src/components/Vehicles/VehicleModal.js

import React, { useState, useEffect } from 'react';
import { vehicleService } from '../../services/vehicleService';

const VehicleModal = ({ 
  show = false, 
  onHide, 
  onSave, 
  vehicle = null, 
  loading = false 
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

  const isEdit = Boolean(vehicle?.id);

  // Initialize form data when vehicle prop changes
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
    } else {
      // Reset form for new vehicle
      setFormData({
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
    }
    setErrors({});
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

    if (!formData.companyName.trim()) {
      newErrors.companyName = 'Şirket adı zorunludur';
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
      onHide?.();
    } catch (error) {
      console.error('Form submission error:', error);
    } finally {
      setSubmitting(false);
    }
  };

  // Handle modal close
  const handleClose = () => {
    if (!submitting) {
      onHide?.();
    }
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - 1979 }, (_, i) => currentYear - i);

  if (!show) return null;

  return (
    <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
      <div className="modal-dialog modal-xl modal-dialog-scrollable">
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
              <div className="row g-3">
                {/* Basic Information */}
                <div className="col-12">
                  <h6 className="text-primary border-bottom pb-2">
                    <i className="bi bi-info-circle me-1"></i>
                    Temel Bilgiler
                  </h6>
                </div>

                <div className="col-md-6">
                  <label className="form-label">Plaka <span className="text-danger">*</span></label>
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

                <div className="col-md-6">
                  <label className="form-label">Marka <span className="text-danger">*</span></label>
                  <input
                    type="text"
                    className={`form-control ${errors.brand ? 'is-invalid' : ''}`}
                    name="brand"
                    value={formData.brand}
                    onChange={handleChange}
                    placeholder="Örn: Toyota"
                    disabled={submitting}
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
                    disabled={submitting}
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

                {/* Company Information */}
                <div className="col-12 mt-4">
                  <h6 className="text-primary border-bottom pb-2">
                    <i className="bi bi-building me-1"></i>
                    Şirket Bilgileri
                  </h6>
                </div>

                <div className="col-md-6">
                  <label className="form-label">Şirket Adı <span className="text-danger">*</span></label>
                  <input
                    type="text"
                    className={`form-control ${errors.companyName ? 'is-invalid' : ''}`}
                    name="companyName"
                    value={formData.companyName}
                    onChange={handleChange}
                    placeholder="Şirket adını girin"
                    disabled={submitting}
                  />
                  {errors.companyName && (
                    <div className="invalid-feedback">{errors.companyName}</div>
                  )}
                </div>

                <div className="col-md-6">
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

                <div className="col-md-6">
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

                <div className="col-md-6">
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

                {/* Technical Information */}
                <div className="col-12 mt-4">
                  <h6 className="text-primary border-bottom pb-2">
                    <i className="bi bi-gear me-1"></i>
                    Teknik Bilgiler
                  </h6>
                </div>

                <div className="col-md-6">
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

                <div className="col-md-6">
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

                <div className="col-md-6">
                  <label className="form-label">Kilometre</label>
                  <div className="input-group">
                    <input
                      type="number"
                      className="form-control"
                      name="currentMileage"
                      value={formData.currentMileage}
                      onChange={handleChange}
                      min="0"
                      disabled={submitting}
                    />
                    <span className="input-group-text">km</span>
                  </div>
                </div>

                <div className="col-md-6">
                  <label className="form-label">Yakıt Tüketimi</label>
                  <div className="input-group">
                    <input
                      type="number"
                      className="form-control"
                      name="fuelConsumption"
                      value={formData.fuelConsumption}
                      onChange={handleChange}
                      min="0"
                      max="99.9"
                      step="0.1"
                      disabled={submitting}
                    />
                    <span className="input-group-text">L/100km</span>
                  </div>
                </div>

                {/* Insurance & Dates */}
                <div className="col-12 mt-4">
                  <h6 className="text-primary border-bottom pb-2">
                    <i className="bi bi-shield-check me-1"></i>
                    Sigorta & Tarihler
                  </h6>
                </div>

                <div className="col-md-6">
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

                <div className="col-md-6">
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

                <div className="col-md-6">
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

                <div className="col-md-6">
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

                <div className="col-md-6">
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

                <div className="col-md-6">
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

                <div className="col-12">
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