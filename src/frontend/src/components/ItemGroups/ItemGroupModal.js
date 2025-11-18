// src/frontend/src/components/ItemGroups/ItemGroupModal.js
import React, { useState, useEffect } from 'react';

const ItemGroupModal = ({ show, onHide, onSave, itemGroup, loading }) => {
  const [formData, setFormData] = useState({
    name: '',
    cancelled: false
  });

  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (itemGroup) {
      setFormData({
        name: itemGroup.name || '',
        cancelled: itemGroup.cancelled || false
      });
    } else {
      setFormData({
        name: '',
        cancelled: false
      });
    }
    setErrors({});
  }, [itemGroup, show]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Grup adı zorunludur';
    } else if (formData.name.length > 100) {
      newErrors.name = 'Grup adı en fazla 100 karakter olabilir';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setSubmitting(true);
      await onSave(formData);
    } catch (err) {
      console.error('Error saving item group:', err);
      alert(err.message || 'Ürün grubu kaydedilirken bir hata oluştu');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!submitting) {
      onHide();
    }
  };

  return (
    <div className={`modal ${show ? 'show d-block' : ''}`} tabIndex="-1" style={{ backgroundColor: show ? 'rgba(0,0,0,0.5)' : 'transparent', display: show ? 'block' : 'none' }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">
              {itemGroup ? 'Ürün Grubu Düzenle' : 'Yeni Ürün Grubu'}
            </h5>
            <button type="button" className="btn-close" onClick={handleClose} disabled={submitting || loading}></button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              <div className="mb-3">
                <label className="form-label">
                  Grup Adı <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  className={`form-control ${errors.name ? 'is-invalid' : ''}`}
                  placeholder="Örn: Elektronik Parçalar"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  disabled={submitting || loading}
                  maxLength={100}
                />
                {errors.name && (
                  <div className="invalid-feedback">
                    {errors.name}
                  </div>
                )}
                <div className="form-text text-muted">
                  Ürün grubunun adını girin (En fazla 100 karakter)
                </div>
              </div>

              {itemGroup && (
                <div className="mb-3">
                  <div className="form-check form-switch">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="cancelled"
                      checked={formData.cancelled}
                      onChange={(e) => handleChange('cancelled', e.target.checked)}
                      disabled={submitting || loading}
                    />
                    <label className="form-check-label" htmlFor="cancelled">
                      İptal Edilmiş
                    </label>
                  </div>
                  <div className="form-text text-muted">
                    İptal edilen gruplar listede varsayılan olarak görünmez
                  </div>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button 
                type="button"
                className="btn btn-secondary" 
                onClick={handleClose}
                disabled={submitting || loading}
              >
                <i className="bi bi-x-circle me-2"></i>
                İptal
              </button>
              <button 
                type="submit"
                className="btn btn-primary"
                disabled={submitting || loading}
              >
                {submitting || loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Kaydediliyor...
                  </>
                ) : (
                  <>
                    <i className="bi bi-check-circle me-2"></i>
                    {itemGroup ? 'Güncelle' : 'Kaydet'}
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

export default ItemGroupModal;