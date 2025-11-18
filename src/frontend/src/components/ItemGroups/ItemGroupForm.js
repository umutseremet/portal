// src/frontend/src/components/ItemGroups/ItemGroupForm.js
import React, { useState, useEffect } from 'react';

const ItemGroupForm = ({ itemGroup, onSave, onCancel, loading }) => {
  const [formData, setFormData] = useState({
    name: ''
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (itemGroup) {
      setFormData({
        name: itemGroup.name || ''
      });
    } else {
      setFormData({
        name: ''
      });
    }
  }, [itemGroup]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user types
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validate = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Grup adı zorunludur';
    } else if (formData.name.trim().length > 100) {
      newErrors.name = 'Grup adı en fazla 100 karakter olabilir';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validate()) {
      return;
    }

    try {
      setSubmitting(true);
      const submitData = {
        name: formData.name.trim()
      };
      await onSave(submitData);
    } catch (err) {
      console.error('Error saving item group:', err);
      alert(err.message || 'Ürün grubu kaydedilirken bir hata oluştu');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="card mb-3 border-primary">
      <div className="card-header bg-primary text-white">
        <h5 className="mb-0">
          <i className="bi bi-collection me-2"></i>
          {itemGroup ? 'Ürün Grubu Düzenle' : 'Yeni Ürün Grubu'}
        </h5>
      </div>
      <div className="card-body">
        <form onSubmit={handleSubmit}>
          <div className="row">
            <div className="col-md-8">
              <div className="mb-3">
                <label className="form-label">
                  Grup Adı <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  className={`form-control ${errors.name ? 'is-invalid' : ''}`}
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  placeholder="Ürün grubu adını giriniz..."
                  disabled={submitting || loading}
                  autoFocus
                />
                {errors.name && <div className="invalid-feedback">{errors.name}</div>}
              </div>
            </div>
            <div className="col-md-4 d-flex align-items-end">
              <div className="mb-3 d-flex gap-2 w-100">
                <button
                  type="submit"
                  className="btn btn-primary flex-grow-1"
                  disabled={submitting || loading}
                >
                  {submitting ? (
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
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={onCancel}
                  disabled={submitting || loading}
                >
                  <i className="bi bi-x-circle me-2"></i>
                  İptal
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ItemGroupForm;