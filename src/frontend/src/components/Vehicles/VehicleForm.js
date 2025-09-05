// src/frontend/src/components/Vehicles/VehicleForm.js
import React, { useState, useEffect } from 'react';

const VehicleForm = ({
  vehicle = null,
  onSubmit,
  onCancel,
  isEditing = false
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
    tireCondition: 'İyi',
    registrationInfo: '',
    ownershipType: 'company',
    assignedUserName: '',
    assignedUserPhone: '',
    location: '',
    vehicleImage: null
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);

  // Populate form when editing
  useEffect(() => {
    if (isEditing && vehicle) {
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
        tireCondition: vehicle.tireCondition || 'İyi',
        registrationInfo: vehicle.registrationInfo || '',
        ownershipType: vehicle.ownershipType || 'company',
        assignedUserName: vehicle.assignedUserName || '',
        assignedUserPhone: vehicle.assignedUserPhone || '',
        location: vehicle.location || '',
        vehicleImage: null
      });

      if (vehicle.vehicleImageUrl) {
        setImagePreview(vehicle.vehicleImageUrl);
      }
    }
  }, [isEditing, vehicle]);

  /**
   * Handle input changes
   */
  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  /**
   * Handle file upload
   */
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        setErrors(prev => ({
          ...prev,
          vehicleImage: 'Sadece JPG, PNG ve WebP formatları desteklenir'
        }));
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setErrors(prev => ({
          ...prev,
          vehicleImage: 'Dosya boyutu 5MB\'dan küçük olmalıdır'
        }));
        return;
      }

      setFormData(prev => ({
        ...prev,
        vehicleImage: file
      }));

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target.result);
      };
      reader.readAsDataURL(file);

      // Clear error
      setErrors(prev => ({
        ...prev,
        vehicleImage: ''
      }));
    }
  };

  /**
   * Remove image
   */
  const removeImage = () => {
    setFormData(prev => ({
      ...prev,
      vehicleImage: null
    }));
    setImagePreview(null);
    
    // Clear file input
    const fileInput = document.getElementById('vehicleImage');
    if (fileInput) {
      fileInput.value = '';
    }
  };

  /**
   * Validate form
   */
  const validateForm = () => {
    const newErrors = {};

    // Required fields
    if (!formData.licensePlate?.trim()) {
      newErrors.licensePlate = 'Plaka alanı zorunludur';
    } else if (!/^[0-9]{2}\s?[A-Z]{1,3}\s?[0-9]{1,4}$/i.test(formData.licensePlate.trim())) {
      newErrors.licensePlate = 'Geçerli bir plaka formatı girin (örn: 34 ABC 123)';
    }

    if (!formData.brand?.trim()) {
      newErrors.brand = 'Marka alanı zorunludur';
    }

    if (!formData.model?.trim()) {
      newErrors.model = 'Model alanı zorunludur';
    }

    if (!formData.year || formData.year < 1990 || formData.year > new Date().getFullYear() + 1) {
      newErrors.year = `Yıl 1990-${new Date().getFullYear() + 1} arasında olmalıdır`;
    }

    if (!formData.vin?.trim()) {
      newErrors.vin = 'VIN numarası zorunludur';
    } else if (formData.vin.length !== 17) {
      newErrors.vin = 'VIN numarası 17 karakter olmalıdır';
    }

    if (!formData.companyName?.trim()) {
      newErrors.companyName = 'Şirket adı zorunludur';
    }

    if (!formData.insurance?.trim()) {
      newErrors.insurance = 'Sigorta bilgisi zorunludur';
    }

    if (!formData.assignedUserName?.trim()) {
      newErrors.assignedUserName = 'Atanan kullanıcı zorunludur';
    }

    if (!formData.assignedUserPhone?.trim()) {
      newErrors.assignedUserPhone = 'Telefon numarası zorunludur';
    } else if (!/^(\+90|0)?[5][0-9]{9}$/.test(formData.assignedUserPhone.replace(/\s/g, ''))) {
      newErrors.assignedUserPhone = 'Geçerli bir telefon numarası girin';
    }

    if (formData.currentMileage < 0) {
      newErrors.currentMileage = 'Kilometre negatif olamaz';
    }

    if (formData.fuelConsumption < 0 || formData.fuelConsumption > 50) {
      newErrors.fuelConsumption = 'Yakıt tüketimi 0-50 lt/100km arasında olmalıdır';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    
    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Form submission error:', error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Get current year options
   */
  const getYearOptions = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let year = currentYear + 1; year >= 1990; year--) {
      years.push(year);
    }
    return years;
  };

  return (
    <div className="vehicle-form">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h3 text-gray-800">
            {isEditing ? 'Araç Düzenle' : 'Yeni Araç Ekle'}
          </h1>
          <p className="text-muted mb-0">
            {isEditing 
              ? `${vehicle?.brand} ${vehicle?.model} (${vehicle?.licensePlate}) düzenleniyor`
              : 'Yeni araç bilgilerini girin'
            }
          </p>
        </div>
        <button
          type="button"
          className="btn btn-outline-secondary"
          onClick={onCancel}
        >
          <i className="bi bi-x me-1"></i>
          İptal
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="row">
          {/* Left Column */}
          <div className="col-lg-8">
            {/* Basic Information */}
            <div className="card mb-4">
              <div className="card-header">
                <h5 className="mb-0">
                  <i className="bi bi-car-front me-2"></i>
                  Temel Bilgiler
                </h5>
              </div>
              <div className="card-body">
                <div className="row">
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label htmlFor="licensePlate" className="form-label">
                        Plaka <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        className={`form-control ${errors.licensePlate ? 'is-invalid' : ''}`}
                        id="licensePlate"
                        placeholder="34 ABC 123"
                        value={formData.licensePlate}
                        onChange={(e) => handleInputChange('licensePlate', e.target.value.toUpperCase())}
                      />
                      {errors.licensePlate && (
                        <div className="invalid-feedback">{errors.licensePlate}</div>
                      )}
                    </div>
                  </div>
                  
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label htmlFor="vin" className="form-label">
                        VIN Numarası <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        className={`form-control ${errors.vin ? 'is-invalid' : ''}`}
                        id="vin"
                        placeholder="17 haneli VIN numarası"
                        maxLength="17"
                        value={formData.vin}
                        onChange={(e) => handleInputChange('vin', e.target.value.toUpperCase())}
                      />
                      {errors.vin && (
                        <div className="invalid-feedback">{errors.vin}</div>
                      )}
                    </div>
                  </div>

                  <div className="col-md-4">
                    <div className="mb-3">
                      <label htmlFor="brand" className="form-label">
                        Marka <span className="text-danger">*</span>
                      </label>
                      <select
                        className={`form-select ${errors.brand ? 'is-invalid' : ''}`}
                        id="brand"
                        value={formData.brand}
                        onChange={(e) => handleInputChange('brand', e.target.value)}
                      >
                        <option value="">Marka Seçin</option>
                        <option value="Toyota">Toyota</option>
                        <option value="Volkswagen">Volkswagen</option>
                        <option value="Ford">Ford</option>
                        <option value="Mercedes-Benz">Mercedes-Benz</option>
                        <option value="BMW">BMW</option>
                        <option value="Audi">Audi</option>
                        <option value="Hyundai">Hyundai</option>
                        <option value="Kia">Kia</option>
                        <option value="Nissan">Nissan</option>
                        <option value="Honda">Honda</option>
                        <option value="Opel">Opel</option>
                        <option value="Peugeot">Peugeot</option>
                        <option value="Renault">Renault</option>
                        <option value="Fiat">Fiat</option>
                        <option value="Diğer">Diğer</option>
                      </select>
                      {errors.brand && (
                        <div className="invalid-feedback">{errors.brand}</div>
                      )}
                    </div>
                  </div>

                  <div className="col-md-4">
                    <div className="mb-3">
                      <label htmlFor="model" className="form-label">
                        Model <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        className={`form-control ${errors.model ? 'is-invalid' : ''}`}
                        id="model"
                        placeholder="Araç modeli"
                        value={formData.model}
                        onChange={(e) => handleInputChange('model', e.target.value)}
                      />
                      {errors.model && (
                        <div className="invalid-feedback">{errors.model}</div>
                      )}
                    </div>
                  </div>

                  <div className="col-md-4">
                    <div className="mb-3">
                      <label htmlFor="year" className="form-label">
                        Model Yılı <span className="text-danger">*</span>
                      </label>
                      <select
                        className={`form-select ${errors.year ? 'is-invalid' : ''}`}
                        id="year"
                        value={formData.year}
                        onChange={(e) => handleInputChange('year', parseInt(e.target.value))}
                      >
                        {getYearOptions().map(year => (
                          <option key={year} value={year}>{year}</option>
                        ))}
                      </select>
                      {errors.year && (
                        <div className="invalid-feedback">{errors.year}</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Company and Assignment */}
            <div className="card mb-4">
              <div className="card-header">
                <h5 className="mb-0">
                  <i className="bi bi-building me-2"></i>
                  Şirket ve Atama Bilgileri
                </h5>
              </div>
              <div className="card-body">
                <div className="row">
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label htmlFor="companyName" className="form-label">
                        Şirket Adı <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        className={`form-control ${errors.companyName ? 'is-invalid' : ''}`}
                        id="companyName"
                        placeholder="Şirket adı"
                        value={formData.companyName}
                        onChange={(e) => handleInputChange('companyName', e.target.value)}
                      />
                      {errors.companyName && (
                        <div className="invalid-feedback">{errors.companyName}</div>
                      )}
                    </div>
                  </div>

                  <div className="col-md-6">
                    <div className="mb-3">
                      <label htmlFor="ownershipType" className="form-label">
                        Sahiplik Türü
                      </label>
                      <select
                        className="form-select"
                        id="ownershipType"
                        value={formData.ownershipType}
                        onChange={(e) => handleInputChange('ownershipType', e.target.value)}
                      >
                        <option value="company">Şirket Aracı</option>
                        <option value="rental">Kiralama</option>
                      </select>
                    </div>
                  </div>

                  <div className="col-md-6">
                    <div className="mb-3">
                      <label htmlFor="assignedUserName" className="form-label">
                        Atanan Kullanıcı <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        className={`form-control ${errors.assignedUserName ? 'is-invalid' : ''}`}
                        id="assignedUserName"
                        placeholder="Kullanıcı adı soyadı"
                        value={formData.assignedUserName}
                        onChange={(e) => handleInputChange('assignedUserName', e.target.value)}
                      />
                      {errors.assignedUserName && (
                        <div className="invalid-feedback">{errors.assignedUserName}</div>
                      )}
                    </div>
                  </div>

                  <div className="col-md-6">
                    <div className="mb-3">
                      <label htmlFor="assignedUserPhone" className="form-label">
                        Telefon Numarası <span className="text-danger">*</span>
                      </label>
                      <input
                        type="tel"
                        className={`form-control ${errors.assignedUserPhone ? 'is-invalid' : ''}`}
                        id="assignedUserPhone"
                        placeholder="05XX XXX XX XX"
                        value={formData.assignedUserPhone}
                        onChange={(e) => handleInputChange('assignedUserPhone', e.target.value)}
                      />
                      {errors.assignedUserPhone && (
                        <div className="invalid-feedback">{errors.assignedUserPhone}</div>
                      )}
                    </div>
                  </div>

                  <div className="col-12">
                    <div className="mb-3">
                      <label htmlFor="location" className="form-label">
                        Konum
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        id="location"
                        placeholder="Şehir, ilçe, adres"
                        value={formData.location}
                        onChange={(e) => handleInputChange('location', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Technical Information */}
            <div className="card mb-4">
              <div className="card-header">
                <h5 className="mb-0">
                  <i className="bi bi-gear me-2"></i>
                  Teknik Bilgiler
                </h5>
              </div>
              <div className="card-body">
                <div className="row">
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label htmlFor="currentMileage" className="form-label">
                        Mevcut Kilometre
                      </label>
                      <div className="input-group">
                        <input
                          type="number"
                          className={`form-control ${errors.currentMileage ? 'is-invalid' : ''}`}
                          id="currentMileage"
                          min="0"
                          value={formData.currentMileage}
                          onChange={(e) => handleInputChange('currentMileage', parseInt(e.target.value) || 0)}
                        />
                        <span className="input-group-text">km</span>
                      </div>
                      {errors.currentMileage && (
                        <div className="invalid-feedback">{errors.currentMileage}</div>
                      )}
                    </div>
                  </div>

                  <div className="col-md-6">
                    <div className="mb-3">
                      <label htmlFor="fuelConsumption" className="form-label">
                        Yakıt Tüketimi
                      </label>
                      <div className="input-group">
                        <input
                          type="number"
                          step="0.1"
                          className={`form-control ${errors.fuelConsumption ? 'is-invalid' : ''}`}
                          id="fuelConsumption"
                          min="0"
                          max="50"
                          value={formData.fuelConsumption}
                          onChange={(e) => handleInputChange('fuelConsumption', parseFloat(e.target.value) || 0)}
                        />
                        <span className="input-group-text">lt/100km</span>
                      </div>
                      {errors.fuelConsumption && (
                        <div className="invalid-feedback">{errors.fuelConsumption}</div>
                      )}
                    </div>
                  </div>

                  <div className="col-md-6">
                    <div className="mb-3">
                      <label htmlFor="tireCondition" className="form-label">
                        Lastik Durumu
                      </label>
                      <select
                        className="form-select"
                        id="tireCondition"
                        value={formData.tireCondition}
                        onChange={(e) => handleInputChange('tireCondition', e.target.value)}
                      >
                        <option value="İyi">İyi</option>
                        <option value="Orta">Orta</option>
                        <option value="Kötü">Kötü</option>
                        <option value="Değişmeli">Değişmeli</option>
                      </select>
                    </div>
                  </div>

                  <div className="col-md-6">
                    <div className="mb-3">
                      <label htmlFor="lastServiceDate" className="form-label">
                        Son Servis Tarihi
                      </label>
                      <input
                        type="date"
                        className="form-control"
                        id="lastServiceDate"
                        value={formData.lastServiceDate}
                        onChange={(e) => handleInputChange('lastServiceDate', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Documents */}
            <div className="card mb-4">
              <div className="card-header">
                <h5 className="mb-0">
                  <i className="bi bi-file-earmark-text me-2"></i>
                  Belge Bilgileri
                </h5>
              </div>
              <div className="card-body">
                <div className="row">
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label htmlFor="registrationInfo" className="form-label">
                        Ruhsat Bilgisi
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        id="registrationInfo"
                        placeholder="Ruhsat bilgisi"
                        value={formData.registrationInfo}
                        onChange={(e) => handleInputChange('registrationInfo', e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="col-md-6">
                    <div className="mb-3">
                      <label htmlFor="inspectionDate" className="form-label">
                        Son Muayene Tarihi
                      </label>
                      <input
                        type="date"
                        className="form-control"
                        id="inspectionDate"
                        value={formData.inspectionDate}
                        onChange={(e) => handleInputChange('inspectionDate', e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="col-md-6">
                    <div className="mb-3">
                      <label htmlFor="insurance" className="form-label">
                        Sigorta Şirketi <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        className={`form-control ${errors.insurance ? 'is-invalid' : ''}`}
                        id="insurance"
                        placeholder="Sigorta şirketi adı"
                        value={formData.insurance}
                        onChange={(e) => handleInputChange('insurance', e.target.value)}
                      />
                      {errors.insurance && (
                        <div className="invalid-feedback">{errors.insurance}</div>
                      )}
                    </div>
                  </div>

                  <div className="col-md-6">
                    <div className="mb-3">
                      <label htmlFor="insuranceExpiryDate" className="form-label">
                        Sigorta Bitiş Tarihi
                      </label>
                      <input
                        type="date"
                        className="form-control"
                        id="insuranceExpiryDate"
                        value={formData.insuranceExpiryDate}
                        onChange={(e) => handleInputChange('insuranceExpiryDate', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="col-lg-4">
            {/* Vehicle Image */}
            <div className="card mb-4">
              <div className="card-header">
                <h5 className="mb-0">
                  <i className="bi bi-image me-2"></i>
                  Araç Resmi
                </h5>
              </div>
              <div className="card-body">
                {imagePreview ? (
                  <div className="text-center">
                    <img 
                      src={imagePreview} 
                      alt="Araç resmi"
                      className="img-fluid rounded mb-3"
                      style={{ maxHeight: '200px', objectFit: 'cover' }}
                    />
                    <div className="d-flex gap-2 justify-content-center">
                      <button
                        type="button"
                        className="btn btn-outline-secondary btn-sm"
                        onClick={() => document.getElementById('vehicleImage').click()}
                      >
                        <i className="bi bi-pencil me-1"></i>
                        Değiştir
                      </button>
                      <button
                        type="button"
                        className="btn btn-outline-danger btn-sm"
                        onClick={removeImage}
                      >
                        <i className="bi bi-trash me-1"></i>
                        Kaldır
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center">
                    <div 
                      className="bg-light rounded d-flex align-items-center justify-content-center mb-3"
                      style={{ height: '200px' }}
                    >
                      <div className="text-muted">
                        <i className="bi bi-image display-4 mb-2"></i>
                        <div>Resim Yok</div>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="btn btn-outline-primary"
                      onClick={() => document.getElementById('vehicleImage').click()}
                    >
                      <i className="bi bi-cloud-upload me-1"></i>
                      Resim Yükle
                    </button>
                  </div>
                )}

                <input
                  type="file"
                  className="d-none"
                  id="vehicleImage"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  onChange={handleFileChange}
                />

                {errors.vehicleImage && (
                  <div className="text-danger small mt-2">
                    <i className="bi bi-exclamation-triangle me-1"></i>
                    {errors.vehicleImage}
                  </div>
                )}

                <small className="text-muted d-block mt-2">
                  Desteklenen formatlar: JPG, PNG, WebP<br />
                  Maksimum boyut: 5MB
                </small>
              </div>
            </div>

            {/* Form Actions */}
            <div className="card">
              <div className="card-body">
                <div className="d-grid gap-2">
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                        {isEditing ? 'Güncelleniyor...' : 'Ekleniyor...'}
                      </>
                    ) : (
                      <>
                        <i className={`bi ${isEditing ? 'bi-check' : 'bi-plus'} me-1`}></i>
                        {isEditing ? 'Güncelle' : 'Ekle'}
                      </>
                    )}
                  </button>
                  
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={onCancel}
                    disabled={loading}
                  >
                    <i className="bi bi-x me-1"></i>
                    İptal
                  </button>
                </div>

                <hr className="my-3" />

                <div className="small text-muted">
                  <div className="mb-1">
                    <i className="bi bi-info-circle me-1"></i>
                    <span className="text-danger">*</span> işaretli alanlar zorunludur
                  </div>
                  <div>
                    <i className="bi bi-clock me-1"></i>
                    Tüm değişiklikler kayıt altına alınır
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default VehicleForm;