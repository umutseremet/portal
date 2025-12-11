// src/frontend/src/pages/VehicleFormPage.js
// ✅ TAM DÜZELTİLMİŞ VERSİYON - SADECE PLAKA, MARKA, MODEL ZORUNLU
// PART 1: Imports ve State

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useVehicles } from '../hooks/useVehicles';
import { useToast } from '../contexts/ToastContext';
import { vehicleService } from '../services/vehicleService';
import { Upload } from 'lucide-react';

const VehicleFormPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const toast = useToast();
  const vehicle = location.state?.vehicle;

  const isEdit = !!id;
  const { createVehicle, updateVehicle, loading } = useVehicles();

  // Resim URL'sini oluştur
  const apiBaseUrl = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5154/api';
  const baseUrl = apiBaseUrl.replace('/api', '');

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
  
  // Resim yükleme state'leri
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

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

      // Mevcut resmi göster
      if (vehicle.vehicleImageUrl) {
        setImagePreview(`${baseUrl}${vehicle.vehicleImageUrl}`);
      }
    }
  }, [isEdit, vehicle, baseUrl]);

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // PART 2: Image Upload Functions

  // Resim seçme
  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      processImageFile(file);
    }
    e.target.value = '';
  };

  // Resim işleme
  const processImageFile = (file) => {
    // Dosya türü kontrolü
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Sadece resim dosyaları yüklenebilir (JPG, PNG, GIF, WEBP)');
      return;
    }

    // Dosya boyutu kontrolü (5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error('Resim boyutu 5MB\'dan küçük olmalıdır');
      return;
    }

    setImageFile(file);

    // Preview oluştur
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  // Resmi kaldır
  const handleRemoveImage = async () => {
    if (isEdit && formData.vehicleImageUrl && window.confirm('Araç resmini silmek istediğinize emin misiniz?')) {
      try {
        setUploadingImage(true);
        await vehicleService.deleteVehicleImage(id);
        
        setImageFile(null);
        setImagePreview(null);
        setFormData(prev => ({ ...prev, vehicleImageUrl: '' }));
        
        toast.success('Resim başarıyla silindi');
      } catch (error) {
        console.error('Error deleting image:', error);
        toast.error('Resim silinirken hata oluştu');
      } finally {
        setUploadingImage(false);
      }
    } else {
      setImageFile(null);
      setImagePreview(null);
    }
  };

  // Resim yükleme
  const uploadImage = async (vehicleId) => {
    if (!imageFile) return;

    try {
      setUploadingImage(true);
      const result = await vehicleService.uploadVehicleImage(vehicleId, imageFile);
      
      setFormData(prev => ({ 
        ...prev, 
        vehicleImageUrl: result.imageUrl || result.ImageUrl 
      }));
      
      toast.success('Resim başarıyla yüklendi');
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Resim yüklenirken hata oluştu');
      throw error;
    } finally {
      setUploadingImage(false);
    }
  };

  // Sürükle-bırak
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      processImageFile(files[0]);
    }
  };

  // ✅ Validate form - SADECE 3 ALAN ZORUNLU
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

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ✅ Handle form submission - TÜM ALANLAR OPSİYONEL
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setSubmitting(true);
    
    try {
      const submitData = {
        // ✅ ZORUNLU ALANLAR
        licensePlate: formData.licensePlate.trim().toUpperCase(),
        brand: formData.brand.trim(),
        model: formData.model.trim(),
        
        // ✅ OPSİYONEL ALANLAR - Boşsa null gönder
        year: formData.year && formData.year !== '' ? parseInt(formData.year) : null,
        vin: formData.vin?.trim() || null,
        companyName: formData.companyName?.trim() || null,
        location: formData.location?.trim() || null,
        assignedUserName: formData.assignedUserName?.trim() || null,
        assignedUserPhone: formData.assignedUserPhone?.trim() || null,
        currentMileage: formData.currentMileage && formData.currentMileage !== '' 
          ? parseInt(formData.currentMileage) 
          : null,
        fuelConsumption: formData.fuelConsumption && formData.fuelConsumption !== '' 
          ? parseFloat(formData.fuelConsumption) 
          : null,
        tireCondition: formData.tireCondition?.trim() || null,
        lastServiceDate: formData.lastServiceDate || null,
        insurance: formData.insurance?.trim() || null,
        insuranceExpiryDate: formData.insuranceExpiryDate || null,
        inspectionDate: formData.inspectionDate || null,
        ownershipType: formData.ownershipType || 'company',
        vehicleImageUrl: formData.vehicleImageUrl || null,
        registrationInfo: formData.registrationInfo?.trim() || null,
        notes: formData.notes?.trim() || null
      };

      console.log('📤 Submitting vehicle data:', submitData);

      let savedVehicle;
      if (isEdit) {
        await updateVehicle(id, submitData);
        savedVehicle = { id, ...submitData };
      } else {
        savedVehicle = await createVehicle(submitData);
      }

      console.log('✅ Vehicle saved:', savedVehicle);

      // Resim yükleme
      if (imageFile && savedVehicle.id) {
        await uploadImage(savedVehicle.id);
      }

      toast.success(isEdit ? 'Araç başarıyla güncellendi' : 'Araç başarıyla eklendi');
      navigate('/vehicles');
    } catch (err) {
      console.error('❌ Error saving vehicle:', err);
      toast.error(err.message || 'Araç kaydedilirken bir hata oluştu');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate('/vehicles');
  };

  // PART 3: JSX Return - Form Render

  return (
    <div className="container-fluid py-4">
      <div className="mb-4">
        <button className="btn btn-outline-secondary mb-3" onClick={handleCancel}>
          <i className="bi bi-arrow-left me-2"></i>
          Araç Listesine Dön
        </button>
        
        <h2 className="h3 mb-1">
          <i className="bi bi-truck me-2 text-danger"></i>
          {isEdit ? 'Araç Düzenle' : 'Yeni Araç Ekle'}
        </h2>
        <p className="text-muted">
          {isEdit ? 'Araç bilgilerini güncelleyin' : 'Yeni araç bilgilerini girin'}
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="row g-4">
          {/* Sol Kolon - Form */}
          <div className={`${imagePreview || imageFile ? 'col-12 col-lg-7' : 'col-12'}`}>
            <div className="card shadow-sm">
              <div className="card-body">
                {/* Temel Bilgiler */}
                <h5 className="card-title border-bottom pb-2 mb-3">
                  <i className="bi bi-info-circle me-2 text-primary"></i>
                  Temel Bilgiler
                </h5>
                <div className="row g-3 mb-4">
                  <div className="col-md-6">
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
                    {errors.licensePlate && (
                      <div className="invalid-feedback">{errors.licensePlate}</div>
                    )}
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">
                      Marka <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      className={`form-control ${errors.brand ? 'is-invalid' : ''}`}
                      name="brand"
                      value={formData.brand}
                      onChange={handleChange}
                      placeholder="Ford, Mercedes, vs."
                    />
                    {errors.brand && (
                      <div className="invalid-feedback">{errors.brand}</div>
                    )}
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">
                      Model <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      className={`form-control ${errors.model ? 'is-invalid' : ''}`}
                      name="model"
                      value={formData.model}
                      onChange={handleChange}
                      placeholder="Transit, Sprinter, vs."
                    />
                    {errors.model && (
                      <div className="invalid-feedback">{errors.model}</div>
                    )}
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">Model Yılı</label>
                    <input
                      type="number"
                      className="form-control"
                      name="year"
                      value={formData.year}
                      onChange={handleChange}
                      min="1980"
                      max={new Date().getFullYear() + 1}
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">VIN / Şase No</label>
                    <input
                      type="text"
                      className="form-control"
                      name="vin"
                      value={formData.vin}
                      onChange={handleChange}
                      placeholder="VIN numarası"
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">Şirket</label>
                    <input
                      type="text"
                      className="form-control"
                      name="companyName"
                      value={formData.companyName}
                      onChange={handleChange}
                      placeholder="Şirket adı"
                    />
                  </div>
                </div>

                {/* Kullanıcı Bilgileri */}
                <h5 className="card-title border-bottom pb-2 mb-3">
                  <i className="bi bi-person me-2 text-success"></i>
                  Kullanıcı Bilgileri
                </h5>
                <div className="row g-3 mb-4">
                  <div className="col-md-6">
                    <label className="form-label">Kullanıcı Adı</label>
                    <input
                      type="text"
                      className="form-control"
                      name="assignedUserName"
                      value={formData.assignedUserName}
                      onChange={handleChange}
                      placeholder="Araç kullanıcısı"
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
                      placeholder="0555 555 55 55"
                    />
                  </div>

                  <div className="col-md-12">
                    <label className="form-label">Konum</label>
                    <input
                      type="text"
                      className="form-control"
                      name="location"
                      value={formData.location}
                      onChange={handleChange}
                      placeholder="Araç konumu"
                    />
                  </div>
                </div>

                {/* Araç Durumu */}
                <h5 className="card-title border-bottom pb-2 mb-3">
                  <i className="bi bi-speedometer2 me-2 text-warning"></i>
                  Araç Durumu
                </h5>
                <div className="row g-3 mb-4">
                  <div className="col-md-6">
                    <label className="form-label">Kilometre</label>
                    <input
                      type="number"
                      className="form-control"
                      name="currentMileage"
                      value={formData.currentMileage}
                      onChange={handleChange}
                      placeholder="0"
                      min="0"
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">Yakıt Tüketimi (L/100km)</label>
                    <input
                      type="number"
                      className="form-control"
                      name="fuelConsumption"
                      value={formData.fuelConsumption}
                      onChange={handleChange}
                      placeholder="0.0"
                      step="0.1"
                      min="0"
                      max="99.9"
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">Lastik Durumu</label>
                    <select
                      className="form-select"
                      name="tireCondition"
                      value={formData.tireCondition}
                      onChange={handleChange}
                    >
                      <option value="">Seçiniz</option>
                      <option value="excellent">Mükemmel</option>
                      <option value="good">İyi</option>
                      <option value="fair">Orta</option>
                      <option value="poor">Kötü</option>
                      <option value="needReplacement">Değişmeli</option>
                    </select>
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">Son Bakım Tarihi</label>
                    <input
                      type="date"
                      className="form-control"
                      name="lastServiceDate"
                      value={formData.lastServiceDate}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                {/* Sigorta ve Muayene */}
                <h5 className="card-title border-bottom pb-2 mb-3">
                  <i className="bi bi-shield-check me-2 text-primary"></i>
                  Sigorta ve Muayene
                </h5>
                <div className="row g-3 mb-4">
                  <div className="col-md-6">
                    <label className="form-label">Sigorta Şirketi</label>
                    <input
                      type="text"
                      className="form-control"
                      name="insurance"
                      value={formData.insurance}
                      onChange={handleChange}
                      placeholder="Sigorta şirketi adı"
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
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">Sahiplik Tipi</label>
                    <select
                      className="form-select"
                      name="ownershipType"
                      value={formData.ownershipType}
                      onChange={handleChange}
                    >
                      <option value="company">Şirket</option>
                      <option value="rental">Kiralık</option>
                      <option value="leased">Leasing</option>
                      <option value="personal">Şahıs</option>
                    </select>
                  </div>

                  <div className="col-md-12">
                    <label className="form-label">Ruhsat Bilgisi</label>
                    <input
                      type="text"
                      className="form-control"
                      name="registrationInfo"
                      value={formData.registrationInfo}
                      onChange={handleChange}
                      placeholder="Ruhsat bilgileri"
                    />
                  </div>
                </div>

                {/* Notlar */}
                <h5 className="card-title border-bottom pb-2 mb-3">
                  <i className="bi bi-journal-text me-2 text-info"></i>
                  Notlar
                </h5>
                <div className="row g-3">
                  <div className="col-12">
                    <textarea
                      className="form-control"
                      name="notes"
                      value={formData.notes}
                      onChange={handleChange}
                      rows="3"
                      placeholder="İlave notlar..."
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
                    disabled={submitting || uploadingImage}
                  >
                    <i className="bi bi-x me-1"></i>
                    İptal
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={submitting || uploadingImage || loading}
                  >
                    {submitting || uploadingImage ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2"></span>
                        {uploadingImage ? 'Resim Yükleniyor...' : 'Kaydediliyor...'}
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
          </div>

          {/* Sağ Kolon - Resim Yükleme */}
          <div className="col-12 col-lg-5">
            <div className="card shadow-sm">
              <div className="card-header bg-white">
                <h6 className="mb-0">
                  <i className="bi bi-image me-2"></i>
                  Araç Resmi
                </h6>
              </div>
              <div className="card-body">
                {/* Preview varsa göster */}
                {imagePreview ? (
                  <div className="text-center mb-3">
                    <img
                      src={imagePreview}
                      alt="Araç Önizleme"
                      className="img-fluid rounded mb-3"
                      style={{ maxHeight: '300px', objectFit: 'contain' }}
                    />
                    <div>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-danger"
                        onClick={handleRemoveImage}
                        disabled={uploadingImage}
                      >
                        <i className="bi bi-trash me-1"></i>
                        Resmi Kaldır
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Sürükle-Bırak Alanı */
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => document.getElementById('vehicle-image-input').click()}
                    className={`text-center py-5 border-3 border-dashed rounded ${
                      isDragging ? 'border-primary bg-primary bg-opacity-10' : 'border-secondary'
                    }`}
                    style={{ cursor: 'pointer', transition: 'all 0.3s ease' }}
                  >
                    <Upload 
                      size={48} 
                      className={`mb-2 ${isDragging ? 'text-primary' : 'text-secondary'}`}
                    />
                    <h6 className={isDragging ? 'text-primary mb-1' : 'text-dark mb-1'}>
                      {isDragging ? 'Resmi Buraya Bırakın' : 'Resim Yükle'}
                    </h6>
                    <p className="text-muted small mb-0">
                      Sürükle-bırak veya tıklayın
                    </p>
                    <p className="text-muted small mb-0">
                      (JPG, PNG, GIF, WEBP - Max 5MB)
                    </p>
                  </div>
                )}

                {/* Hidden File Input */}
                <input
                  type="file"
                  id="vehicle-image-input"
                  accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                  style={{ display: 'none' }}
                  onChange={handleImageSelect}
                />

                {/* Bilgi Notu */}
                <div className="alert alert-info mt-3 mb-0">
                  <small>
                    <i className="bi bi-info-circle me-1"></i>
                    <strong>Not:</strong> Aracı kaydettiğinizde resim otomatik olarak yüklenecektir.
                  </small>
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default VehicleFormPage;