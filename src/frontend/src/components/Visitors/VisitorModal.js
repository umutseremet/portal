// src/frontend/src/components/Visitors/VisitorModal.js
import { useState, useEffect } from 'react';

const VisitorModal = ({ 
  show, 
  onHide, 
  onSave, 
  visitor = null,
  loading = false 
}) => {
  // Form state - sadece database'de olan alanlar
  const [formData, setFormData] = useState({
    date: '',
    company: '',
    visitorName: '', // Backend'de VisitorName olarak kayıtlı
    description: ''
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize form data when modal opens or visitor changes
  useEffect(() => {
    if (show) {
      if (visitor) {
        // Edit mode - populate form with visitor data
        setFormData({
          date: visitor.date ? formatDateForInput(visitor.date) : '',
          company: visitor.company || '',
          visitorName: visitor.visitorName || visitor.visitor || '', // visitor.visitor backend'den geliyor
          description: visitor.description || ''
        });
      } else {
        // New mode - initialize with empty form
        setFormData({
          date: new Date().toISOString().split('T')[0], // Today's date
          company: '',
          visitorName: '',
          description: ''
        });
      }
      setErrors({});
    }
  }, [show, visitor]);

  // ✅ KALICI ÇÖZÜM: Backend'den DateTime gelirken timezone sorununu çöz
  const formatDateForInput = (dateString) => {
    try {
      if (!dateString) return '';
      
      console.log('📅 Formatting date input:', dateString); // Debug için
      
      // Eğer tarih zaten YYYY-MM-DD formatındaysa, doğrudan kullan
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
        console.log('✅ Already in correct format:', dateString);
        return dateString;
      }
      
      // Backend'den gelen DateTime string'i (.NET format)
      let date;
      
      // ISO string check
      if (dateString.includes('T')) {
        // ISO format: 2025-07-23T00:00:00 veya 2025-07-23T00:00:00.000Z
        date = new Date(dateString.split('T')[0] + 'T12:00:00'); // Noon'a set ederek timezone offset'ini önle
      } else {
        // Sadece tarih: 2025-07-23
        date = new Date(dateString + 'T12:00:00'); // Noon'a set et
      }
      
      // Manual format - daha güvenli
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      
      const result = `${year}-${month}-${day}`;
      console.log('✅ Formatted result:', result);
      
      return result;
    } catch (error) {
      console.error('❌ Date formatting error:', error);
      return '';
    }
  };

  // Handle input changes
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

  // Validate form
  const validateForm = () => {
    const newErrors = {};

    if (!formData.date.trim()) {
      newErrors.date = 'Tarih zorunludur';
    }

    if (!formData.company.trim()) {
      newErrors.company = 'Şirket adı zorunludur';
    } else if (formData.company.length > 100) {
      newErrors.company = 'Şirket adı en fazla 100 karakter olabilir';
    }

    if (!formData.visitorName.trim()) {
      newErrors.visitorName = 'Ziyaretçi adı zorunludur';
    } else if (formData.visitorName.length > 255) {
      newErrors.visitorName = 'Ziyaretçi adı en fazla 255 karakter olabilir';
    }

    if (formData.description && formData.description.length > 500) {
      newErrors.description = 'Açıklama en fazla 500 karakter olabilir';
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

    setIsSubmitting(true);
    
    try {
      // Prepare data for submission
      const submitData = {
        date: formData.date.trim(),
        company: formData.company.trim(),
        visitor: formData.visitorName.trim(), // Backend'de "visitor" olarak gönderilmeli
        description: formData.description.trim()
      };

      await onSave(submitData);
      
      // Reset form after successful save
      setFormData({
        date: new Date().toISOString().split('T')[0],
        company: '',
        visitorName: '',
        description: ''
      });
      setErrors({});
    } catch (error) {
      console.error('Error saving visitor:', error);
      // Error handling is done in parent component
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle modal close
  const handleClose = () => {
    setErrors({});
    onHide();
  };

  if (!show) return null;

  return (
    <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-lg modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">
              <i className="bi bi-person-plus me-2"></i>
              {visitor ? 'Ziyaretçi Düzenle' : 'Yeni Ziyaretçi Ekle'}
            </h5>
            <button 
              type="button" 
              className="btn-close" 
              onClick={handleClose}
              disabled={isSubmitting}
            ></button>
          </div>
          
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              {/* Ziyaret Bilgileri */}
              <div className="row mb-4">
                <div className="col-12">
                  <h6 className="text-muted border-bottom pb-2 mb-3">
                    <i className="bi bi-info-circle me-1"></i>
                    Ziyaret Bilgileri
                  </h6>
                </div>
                
                <div className="col-md-6 mb-3">
                  <label className="form-label">
                    Ziyaret Tarihi <span className="text-danger">*</span>
                  </label>
                  <input
                    type="date"
                    className={`form-control ${errors.date ? 'is-invalid' : ''}`}
                    value={formData.date}
                    onChange={(e) => handleInputChange('date', e.target.value)}
                    disabled={isSubmitting}
                  />
                  {errors.date && (
                    <div className="invalid-feedback">{errors.date}</div>
                  )}
                </div>

                <div className="col-md-6 mb-3">
                  <label className="form-label">
                    Şirket Adı <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    className={`form-control ${errors.company ? 'is-invalid' : ''}`}
                    value={formData.company}
                    onChange={(e) => handleInputChange('company', e.target.value)}
                    placeholder="Şirket adını giriniz"
                    disabled={isSubmitting}
                  />
                  {errors.company && (
                    <div className="invalid-feedback">{errors.company}</div>
                  )}
                </div>

                <div className="col-12 mb-3">
                  <label className="form-label">
                    Ziyaretçi Adı <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    className={`form-control ${errors.visitorName ? 'is-invalid' : ''}`}
                    value={formData.visitorName}
                    onChange={(e) => handleInputChange('visitorName', e.target.value)}
                    placeholder="Ziyaretçi adını giriniz"
                    disabled={isSubmitting}
                  />
                  {errors.visitorName && (
                    <div className="invalid-feedback">{errors.visitorName}</div>
                  )}
                </div>

                <div className="col-12 mb-3">
                  <label className="form-label">
                    Açıklama / Ziyaret Amacı
                  </label>
                  <textarea
                    className={`form-control ${errors.description ? 'is-invalid' : ''}`}
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Ziyaret ile ilgili açıklama giriniz (isteğe bağlı)"
                    rows="3"
                    disabled={isSubmitting}
                  />
                  {errors.description && (
                    <div className="invalid-feedback">{errors.description}</div>
                  )}
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={handleClose}
                disabled={isSubmitting}
              >
                <i className="bi bi-x me-1"></i>
                İptal
              </button>
              <button 
                type="submit" 
                className="btn btn-primary"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2"></span>
                    Kaydediliyor...
                  </>
                ) : (
                  <>
                    <i className="bi bi-check me-1"></i>
                    {visitor ? 'Güncelle' : 'Kaydet'}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default VisitorModal;