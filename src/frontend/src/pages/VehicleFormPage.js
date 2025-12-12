// src/frontend/src/pages/VehicleFormPage.js
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useToast } from '../contexts/ToastContext';
import vehicleService from '../services/vehicleService';

const VehicleFormPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;

  // State
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [errors, setErrors] = useState({});
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const toast = useToast();

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
    registrationInfo: '',
    notes: ''
  });

  // Load vehicle data if editing
  useEffect(() => {
    if (isEdit) {
      loadVehicle();
    }
  }, [id, isEdit]);

  const loadVehicle = async () => {
    try {
      setLoading(true);
      const vehicle = await vehicleService.getVehicle(id);

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
        registrationInfo: vehicle.registrationInfo || '',
        notes: vehicle.notes || ''
      });

      if (vehicle.vehicleImageUrl) {
        setImagePreview(vehicle.vehicleImageUrl);
      }
    } catch (error) {
      console.error('Error loading vehicle:', error);
      toast.error('Araç bilgileri yüklenirken hata oluştu');
      navigate('/vehicles');
    } finally {
      setLoading(false);
    }
  };

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

  // Handle image file selection
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      processImageFile(file);
    }
  };

  const processImageFile = (file) => {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Lütfen geçerli bir resim dosyası seçin');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Resim boyutu en fazla 5MB olabilir');
      return;
    }

    setImageFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  // Handle image deletion
  const handleImageDelete = async () => {
    if (isEdit && formData.vehicleImageUrl) {
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

  // Upload image
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
    } finally {
      setUploadingImage(false);
    }
  };

  // Drag and drop handlers
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

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    console.log('🔍 handleSubmit called');

    if (!validateForm()) {
      return;
    }

    setSubmitting(true);

    try {
      const submitData = {
        // Zorunlu alanlar
        licensePlate: formData.licensePlate.trim().toUpperCase(),
        brand: formData.brand.trim(),
        model: formData.model.trim(),

        // Opsiyonel alanlar - Boşsa null gönder
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
        // ✅ Direkt vehicleService kullan
        savedVehicle = await vehicleService.updateVehicle(id, submitData);
        console.log('✅ Vehicle updated:', savedVehicle);
      } else {
        // ✅ Direkt vehicleService kullan
        savedVehicle = await vehicleService.createVehicle(submitData);
        console.log('✅ Vehicle created:', savedVehicle);
      }

      // ✅ Response'dan ID çıkar
    let vehicleId;
    
    if (isEdit) {
      vehicleId = id; // Edit modunda zaten ID var
    } else {
      // Create modunda response'dan al
      vehicleId = savedVehicle?.id || 
                  savedVehicle?.Id || 
                  savedVehicle?.data?.id || 
                  savedVehicle?.vehicle?.id;
      
      console.log('🔍 Resolved vehicleId:', vehicleId);
    }
    
      // Resim yükleme
      // Resim yükleme - hata olsa bile devam et
      if (imageFile && vehicleId) {
        console.log('📸 Uploading image for vehicle:', vehicleId);
        try {
          await uploadImage(vehicleId);
        } catch (imgError) {
          console.warn('⚠️ Image upload failed, but vehicle was saved:', imgError);
          // Resim yüklenemese de araç kaydedildi, devam et
        }
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

  if (loading) {
    return (
      <div className="container-fluid py-4">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Yükleniyor...</span>
          </div>
          <p className="mt-2">Araç bilgileri yükleniyor...</p>
        </div>
      </div>
    );
  }

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
                    <label className="form-label">Yıl</label>
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
                      placeholder="17 haneli şase numarası"
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
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">Yakıt Tüketimi (L/100km)</label>
                    <input
                      type="number"
                      step="0.1"
                      className="form-control"
                      name="fuelConsumption"
                      value={formData.fuelConsumption}
                      onChange={handleChange}
                      placeholder="0.0"
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
                      <option value="good">İyi</option>
                      <option value="normal">Normal</option>
                      <option value="bad">Kötü</option>
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
                  <i className="bi bi-shield-check me-2 text-danger"></i>
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
          {(imagePreview || imageFile || !isEdit) && (
            <div className="col-12 col-lg-5">
              <div className="card shadow-sm">
                <div className="card-body">
                  <h5 className="card-title border-bottom pb-2 mb-3">
                    <i className="bi bi-image me-2 text-primary"></i>
                    Araç Resmi
                  </h5>

                  {/* Image Preview */}
                  {imagePreview ? (
                    <div className="position-relative mb-3">
                      <img
                        src={imagePreview}
                        alt="Vehicle"
                        className="img-fluid rounded"
                        style={{ maxHeight: '400px', width: '100%', objectFit: 'cover' }}
                      />
                      <button
                        type="button"
                        className="btn btn-danger btn-sm position-absolute top-0 end-0 m-2"
                        onClick={handleImageDelete}
                        disabled={uploadingImage}
                      >
                        <i className="bi bi-trash"></i>
                      </button>
                    </div>
                  ) : (
                    <div
                      className={`border border-2 border-dashed rounded p-4 text-center ${isDragging ? 'border-primary bg-light' : 'border-secondary'
                        }`}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      style={{ minHeight: '200px', cursor: 'pointer' }}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <i className="bi bi-cloud-upload display-4 text-muted"></i>
                      <p className="mt-2 mb-0">
                        Resim yüklemek için tıklayın veya sürükleyin
                      </p>
                      <small className="text-muted">Max 5MB</small>
                    </div>
                  )}

                  <input
                    ref={fileInputRef}
                    type="file"
                    className="d-none"
                    accept="image/*"
                    onChange={handleImageChange}
                  />

                  {!imagePreview && (
                    <button
                      type="button"
                      className="btn btn-outline-primary w-100"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingImage}
                    >
                      <i className="bi bi-upload me-2"></i>
                      Resim Seç
                    </button>
                  )}
                </div>
              </div>

              <div className="alert alert-info mt-3">
                <i className="bi bi-info-circle me-2"></i>
                <small>
                  Resim yükleme opsiyoneldir. Araç kaydedildikten sonra da resim ekleyebilirsiniz.
                </small>
              </div>
            </div>
          )}
        </div>
      </form>
    </div>
  );
};

export default VehicleFormPage;