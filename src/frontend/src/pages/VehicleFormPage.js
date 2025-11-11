// src/frontend/src/pages/VehicleFormPage.js
// ✅ YENİ TAM SAYFA - Araç ekleme ve düzenleme

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useVehicles } from '../hooks/useVehicles';

const VehicleFormPage = () => {
  const navigate = useNavigate();
  const { id } = useParams(); // Düzenleme için ID
  const location = useLocation();
  const vehicle = location.state?.vehicle; // State'den gelen araç bilgisi

  const isEdit = !!id; // Düzenleme modu mu?

  const { createVehicle, updateVehicle, loading } = useVehicles();

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
    tireCondition: 'good',
    lastServiceDate: '',
    insurance: '',
    insuranceExpiryDate: '',
    inspectionDate: '',
    ownershipType: 'company',
    vehicleImageUrl: '',
    registrationInfo: '',
    notes: ''
  });

  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Initialize form when editing
  useEffect(() => {
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
        tireCondition: vehicle.tireCondition || 'good',
        lastServiceDate: vehicle.lastServiceDate ? vehicle.lastServiceDate.split('T')[0] : '',
        insurance: vehicle.insurance || '',
        insuranceExpiryDate: vehicle.insuranceExpiryDate ? vehicle.insuranceExpiryDate.split('T')[0] : '',
        inspectionDate: vehicle.inspectionDate ? vehicle.inspectionDate.split('T')[0] : '',
        ownershipType: vehicle.ownershipType || 'company',
        vehicleImageUrl: vehicle.vehicleImageUrl || '',
        registrationInfo: vehicle.registrationInfo || '',
        notes: vehicle.notes || ''
      });
    }
  }, [isEdit, vehicle]);

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
      // ✅ Decimal alanları güvenli parse et
      const submitData = {
        licensePlate: formData.licensePlate.trim().toUpperCase(),
        brand: formData.brand.trim(),
        model: formData.model.trim(),
        year: parseInt(formData.year),
        vin: formData.vin.trim(),
        companyName: formData.companyName.trim(),
        location: formData.location.trim(),
        assignedUserName: formData.assignedUserName.trim(),
        assignedUserPhone: formData.assignedUserPhone.trim(),
        
        // ✅ Decimal - Boş ise null
        currentMileage: formData.currentMileage && formData.currentMileage !== '' 
          ? parseInt(formData.currentMileage) 
          : null,
        
        fuelConsumption: formData.fuelConsumption && formData.fuelConsumption !== '' 
          ? parseFloat(formData.fuelConsumption) 
          : null,
        
        // Tarihler
        lastServiceDate: formData.lastServiceDate || null,
        insuranceExpiryDate: formData.insuranceExpiryDate || null,
        inspectionDate: formData.inspectionDate || null,
        
        // Diğer
        tireCondition: formData.tireCondition,
        insurance: formData.insurance.trim(),
        ownershipType: formData.ownershipType,
        vehicleImageUrl: formData.vehicleImageUrl?.trim() || null,
        registrationInfo: formData.registrationInfo?.trim() || null,
        notes: formData.notes?.trim() || null
      };

      console.log('📤 Submitting:', submitData);

      if (isEdit) {
        await updateVehicle(id, submitData);
      } else {
        await createVehicle(submitData);
      }

      // Başarılı, listeye dön
      navigate('/vehicles');
      
    } catch (error) {
      console.error('❌ Form error:', error);
      setErrors({ submit: error.message || 'Kayıt sırasında hata oluştu' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate('/vehicles');
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - 1979 }, (_, i) => currentYear - i);

  return (
    <div className="container-fluid py-4">
      <div className="row">
        <div className="col-12">
          {/* Header */}
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2 className="h3 mb-0">
              <i className="bi bi-car-front me-2"></i>
              {isEdit ? 'Araç Düzenle' : 'Yeni Araç Ekle'}
            </h2>
            <button className="btn btn-outline-secondary" onClick={handleCancel}>
              <i className="bi bi-x me-1"></i>
              İptal
            </button>
          </div>

          {/* Error Alert */}
          {errors.submit && (
            <div className="alert alert-danger alert-dismissible fade show">
              <i className="bi bi-exclamation-triangle me-2"></i>
              {errors.submit}
              <button type="button" className="btn-close" onClick={() => setErrors({})}></button>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <div className="card">
              <div className="card-body">
                {/* Temel Bilgiler */}
                <h5 className="card-title mb-3">
                  <i className="bi bi-info-circle me-2"></i>
                  Temel Bilgiler
                </h5>
                <div className="row g-3 mb-4">
                  <div className="col-md-4">
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
                    />
                    {errors.licensePlate && <div className="invalid-feedback">{errors.licensePlate}</div>}
                  </div>

                  <div className="col-md-4">
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
                    />
                    {errors.brand && <div className="invalid-feedback">{errors.brand}</div>}
                  </div>

                  <div className="col-md-4">
                    <label className="form-label">
                      Model <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      className={`form-control ${errors.model ? 'is-invalid' : ''}`}
                      name="model"
                      value={formData.model}
                      onChange={handleChange}
                      placeholder="Corolla, X5..."
                    />
                    {errors.model && <div className="invalid-feedback">{errors.model}</div>}
                  </div>

                  <div className="col-md-4">
                    <label className="form-label">Model Yılı</label>
                    <select
                      className="form-select"
                      name="year"
                      value={formData.year}
                      onChange={handleChange}
                    >
                      {years.map(y => (
                        <option key={y} value={y}>{y}</option>
                      ))}
                    </select>
                  </div>

                  <div className="col-md-4">
                    <label className="form-label">VIN</label>
                    <input
                      type="text"
                      className="form-control"
                      name="vin"
                      value={formData.vin}
                      onChange={handleChange}
                      placeholder="17 haneli VIN numarası"
                    />
                  </div>

                  <div className="col-md-4">
                    <label className="form-label">Sahiplik Tipi</label>
                    <select
                      className="form-select"
                      name="ownershipType"
                      value={formData.ownershipType}
                      onChange={handleChange}
                    >
                      <option value="company">Şirket</option>
                      <option value="rental">Kiralık</option>
                      <option value="personal">Kişisel</option>
                    </select>
                  </div>
                </div>

                {/* Kullanıcı Bilgileri */}
                <h5 className="card-title mb-3">
                  <i className="bi bi-person me-2"></i>
                  Kullanıcı Bilgileri
                </h5>
                <div className="row g-3 mb-4">
                  <div className="col-md-4">
                    <label className="form-label">Şirket</label>
                    <input
                      type="text"
                      className="form-control"
                      name="companyName"
                      value={formData.companyName}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="col-md-4">
                    <label className="form-label">Konum</label>
                    <input
                      type="text"
                      className="form-control"
                      name="location"
                      value={formData.location}
                      onChange={handleChange}
                      placeholder="İstanbul, Ankara..."
                    />
                  </div>

                  <div className="col-md-4">
                    <label className="form-label">Atanan Kullanıcı</label>
                    <input
                      type="text"
                      className="form-control"
                      name="assignedUserName"
                      value={formData.assignedUserName}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="col-md-4">
                    <label className="form-label">Telefon</label>
                    <input
                      type="tel"
                      className="form-control"
                      name="assignedUserPhone"
                      value={formData.assignedUserPhone}
                      onChange={handleChange}
                      placeholder="0555 123 45 67"
                    />
                  </div>
                </div>

                {/* Teknik Bilgiler */}
                <h5 className="card-title mb-3">
                  <i className="bi bi-gear me-2"></i>
                  Teknik Bilgiler
                </h5>
                <div className="row g-3 mb-4">
                  <div className="col-md-4">
                    <label className="form-label">Kilometre</label>
                    <input
                      type="number"
                      className="form-control"
                      name="currentMileage"
                      value={formData.currentMileage}
                      onChange={handleChange}
                      min="0"
                    />
                  </div>

                  <div className="col-md-4">
                    <label className="form-label">Yakıt Tüketimi (L/100km)</label>
                    <input
                      type="number"
                      className="form-control"
                      name="fuelConsumption"
                      value={formData.fuelConsumption}
                      onChange={handleChange}
                      step="0.1"
                      min="0"
                      max="99.9"
                    />
                  </div>

                  <div className="col-md-4">
                    <label className="form-label">Lastik Durumu</label>
                    <select
                      className="form-select"
                      name="tireCondition"
                      value={formData.tireCondition}
                      onChange={handleChange}
                    >
                      <option value="excellent">Mükemmel</option>
                      <option value="good">İyi</option>
                      <option value="fair">Orta</option>
                      <option value="poor">Kötü</option>
                      <option value="needsReplacement">Değiştirilmeli</option>
                    </select>
                  </div>

                  <div className="col-md-4">
                    <label className="form-label">Son Servis Tarihi</label>
                    <input
                      type="date"
                      className="form-control"
                      name="lastServiceDate"
                      value={formData.lastServiceDate}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                {/* Resmi Bilgiler */}
                <h5 className="card-title mb-3">
                  <i className="bi bi-file-earmark-text me-2"></i>
                  Resmi Bilgiler
                </h5>
                <div className="row g-3 mb-4">
                  <div className="col-md-4">
                    <label className="form-label">Muayene Tarihi</label>
                    <input
                      type="date"
                      className="form-control"
                      name="inspectionDate"
                      value={formData.inspectionDate}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="col-md-4">
                    <label className="form-label">Sigorta Şirketi</label>
                    <input
                      type="text"
                      className="form-control"
                      name="insurance"
                      value={formData.insurance}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="col-md-4">
                    <label className="form-label">Sigorta Bitiş Tarihi</label>
                    <input
                      type="date"
                      className="form-control"
                      name="insuranceExpiryDate"
                      value={formData.insuranceExpiryDate}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="col-12">
                    <label className="form-label">Ruhsat Bilgisi</label>
                    <input
                      type="text"
                      className="form-control"
                      name="registrationInfo"
                      value={formData.registrationInfo}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                {/* Notlar */}
                <div className="row g-3">
                  <div className="col-12">
                    <label className="form-label">Notlar</label>
                    <textarea
                      className="form-control"
                      name="notes"
                      value={formData.notes}
                      onChange={handleChange}
                      rows="3"
                      placeholder="İlave bilgiler..."
                    ></textarea>
                  </div>
                </div>
              </div>

              {/* Form Actions */}
              <div className="card-footer bg-light">
                <div className="d-flex justify-content-end gap-2">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={handleCancel}
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
                    {submitting ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2"></span>
                        Kaydediliyor...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-check-lg me-1"></i>
                        {isEdit ? 'Güncelle' : 'Kaydet'}
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default VehicleFormPage;