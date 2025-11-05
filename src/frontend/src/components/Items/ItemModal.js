// src/frontend/src/components/Items/ItemModal.js
import React, { useState, useEffect } from 'react';

const ItemModal = ({ show, onHide, onSave, item, itemGroups, loading }) => {
  const [formData, setFormData] = useState({
    number: '',
    code: '',
    name: '',
    docNumber: '',
    groupId: '',
    x: '',
    y: '',
    z: '',
    imageUrl: '',
    supplierCode: '',
    price: '',
    supplier: '',
    unit: '',
    cancelled: false
  });

  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (item) {
      setFormData({
        number: item.number || '',
        code: item.code || '',
        name: item.name || '',
        docNumber: item.docNumber || '',
        groupId: item.groupId || '',
        x: item.x || '',
        y: item.y || '',
        z: item.z || '',
        imageUrl: item.imageUrl || '',
        supplierCode: item.supplierCode || '',
        price: item.price || '',
        supplier: item.supplier || '',
        unit: item.unit || '',
        cancelled: item.cancelled || false
      });
    } else {
      setFormData({
        number: '',
        code: '',
        name: '',
        docNumber: '',
        groupId: '',
        x: '',
        y: '',
        z: '',
        imageUrl: '',
        supplierCode: '',
        price: '',
        supplier: '',
        unit: '',
        cancelled: false
      });
    }
    setErrors({});
  }, [item, show]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.number) newErrors.number = 'Numara zorunludur';
    if (!formData.code?.trim()) newErrors.code = 'Kod zorunludur';
    if (!formData.name?.trim()) newErrors.name = 'İsim zorunludur';
    if (!formData.groupId) newErrors.groupId = 'Grup seçimi zorunludur';

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

    if (!validateForm()) return;

    try {
      setSubmitting(true);
      const submitData = {
        ...formData,
        number: parseInt(formData.number) || 0,
        groupId: parseInt(formData.groupId),
        x: formData.x ? parseInt(formData.x) : null,
        y: formData.y ? parseInt(formData.y) : null,
        z: formData.z ? parseInt(formData.z) : null,
        price: formData.price ? parseFloat(formData.price) : 0
      };
      await onSave(submitData);
    } catch (err) {
      console.error('Error saving item:', err);
      alert(err.message || 'Ürün kaydedilirken bir hata oluştu');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!submitting) {
      onHide();
    }
  };

  if (!show) return null;

  return (
    <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">{item ? 'Ürün Düzenle' : 'Yeni Ürün'}</h5>
            <button type="button" className="btn-close" onClick={handleClose} disabled={submitting || loading}></button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              {/* Temel Bilgiler */}
              <div className="row mb-3">
                <div className="col-12">
                  <h6 className="text-muted border-bottom pb-2 mb-3">
                    <i className="bi bi-info-circle me-1"></i>
                    Temel Bilgiler
                  </h6>
                </div>

                <div className="col-md-6">
                  <div className="mb-3">
                    <label className="form-label">Numara <span className="text-danger">*</span></label>
                    <input
                      type="number"
                      className={`form-control ${errors.number ? 'is-invalid' : ''}`}
                      value={formData.number}
                      onChange={(e) => handleChange('number', e.target.value)}
                      disabled={submitting || loading}
                    />
                    {errors.number && <div className="invalid-feedback">{errors.number}</div>}
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="mb-3">
                    <label className="form-label">Kod <span className="text-danger">*</span></label>
                    <input
                      type="text"
                      className={`form-control ${errors.code ? 'is-invalid' : ''}`}
                      value={formData.code}
                      onChange={(e) => handleChange('code', e.target.value)}
                      disabled={submitting || loading}
                      maxLength={50}
                    />
                    {errors.code && <div className="invalid-feedback">{errors.code}</div>}
                  </div>
                </div>
              </div>

              <div className="mb-3">
                <label className="form-label">İsim <span className="text-danger">*</span></label>
                <input
                  type="text"
                  className={`form-control ${errors.name ? 'is-invalid' : ''}`}
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  disabled={submitting || loading}
                  maxLength={500}
                />
                {errors.name && <div className="invalid-feedback">{errors.name}</div>}
              </div>

              <div className="row">
                <div className="col-md-6">
                  <div className="mb-3">
                    <label className="form-label">Doküman No</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.docNumber}
                      onChange={(e) => handleChange('docNumber', e.target.value)}
                      disabled={submitting || loading}
                      maxLength={50}
                    />
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="mb-3">
                    <label className="form-label">Grup <span className="text-danger">*</span></label>
                    <select
                      className={`form-select ${errors.groupId ? 'is-invalid' : ''}`}
                      value={formData.groupId}
                      onChange={(e) => handleChange('groupId', e.target.value)}
                      disabled={submitting || loading}
                    >
                      <option value="">Seçiniz...</option>
                      {itemGroups?.map(group => (
                        <option key={group.id} value={group.id}>
                          {group.name}
                        </option>
                      ))}
                    </select>
                    {errors.groupId && <div className="invalid-feedback">{errors.groupId}</div>}
                  </div>
                </div>
              </div>

              {/* Boyutlar */}
              <div className="row mb-3">
                <div className="col-12">
                  <h6 className="text-muted border-bottom pb-2 mb-3">
                    <i className="bi bi-rulers me-1"></i>
                    Boyutlar
                  </h6>
                </div>

                <div className="col-md-4">
                  <div className="mb-3">
                    <label className="form-label">X</label>
                    <input
                      type="number"
                      className="form-control"
                      value={formData.x}
                      onChange={(e) => handleChange('x', e.target.value)}
                      disabled={submitting || loading}
                    />
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="mb-3">
                    <label className="form-label">Y</label>
                    <input
                      type="number"
                      className="form-control"
                      value={formData.y}
                      onChange={(e) => handleChange('y', e.target.value)}
                      disabled={submitting || loading}
                    />
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="mb-3">
                    <label className="form-label">Z</label>
                    <input
                      type="number"
                      className="form-control"
                      value={formData.z}
                      onChange={(e) => handleChange('z', e.target.value)}
                      disabled={submitting || loading}
                    />
                  </div>
                </div>
              </div>

              {/* Tedarikçi Bilgileri */}
              <div className="row mb-3">
                <div className="col-12">
                  <h6 className="text-muted border-bottom pb-2 mb-3">
                    <i className="bi bi-truck me-1"></i>
                    Tedarikçi Bilgileri
                  </h6>
                </div>

                <div className="col-md-6">
                  <div className="mb-3">
                    <label className="form-label">Tedarikçi</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.supplier}
                      onChange={(e) => handleChange('supplier', e.target.value)}
                      disabled={submitting || loading}
                    />
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="mb-3">
                    <label className="form-label">Tedarikçi Kodu</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.supplierCode}
                      onChange={(e) => handleChange('supplierCode', e.target.value)}
                      disabled={submitting || loading}
                    />
                  </div>
                </div>
              </div>

              <div className="row">
                <div className="col-md-6">
                  <div className="mb-3">
                    <label className="form-label">Fiyat</label>
                    <input
                      type="number"
                      step="0.01"
                      className="form-control"
                      value={formData.price}
                      onChange={(e) => handleChange('price', e.target.value)}
                      disabled={submitting || loading}
                    />
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="mb-3">
                    <label className="form-label">Birim</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.unit}
                      onChange={(e) => handleChange('unit', e.target.value)}
                      disabled={submitting || loading}
                    />
                  </div>
                </div>
              </div>

              {/* Resim URL */}
              <div className="row mb-3">
                <div className="col-12">
                  <h6 className="text-muted border-bottom pb-2 mb-3">
                    <i className="bi bi-image me-1"></i>
                    Resim
                  </h6>
                </div>

                <div className="col-12">
                  <div className="mb-3">
                    <label className="form-label">Resim URL</label>
                    <input
                      type="url"
                      className="form-control"
                      value={formData.imageUrl}
                      onChange={(e) => handleChange('imageUrl', e.target.value)}
                      placeholder="https://example.com/image.jpg"
                      disabled={submitting || loading}
                    />
                    <div className="form-text">
                      Ürün resminin URL'sini girin
                    </div>
                  </div>

                  {/* Resim Önizleme */}
                  {formData.imageUrl && (
                    <div className="mt-2">
                      <img
                        src={formData.imageUrl}
                        alt="Ürün resmi önizleme"
                        className="img-thumbnail"
                        style={{ maxWidth: '200px', maxHeight: '200px' }}
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Durum */}
              {item && (
                <div className="row">
                  <div className="col-12">
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
                {item ? 'Güncelle' : 'Kaydet'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ItemModal;