// src/frontend/src/pages/ItemEditPage.js

import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import apiService from '../services/api';

// ✅ API_BASE_URL'den /api kısmını kaldırıyoruz çünkü imageUrl direkt /Uploads ile başlıyor
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL 
  ? process.env.REACT_APP_API_BASE_URL.replace('/api', '') 
  : 'http://localhost:5154';

const ItemEditPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const item = location.state?.item;
  const itemGroups = location.state?.itemGroups || [];
  const isEdit = !!item;

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
    }
  }, [item]);

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

      if (isEdit) {
        await apiService.updateItem(item.id, submitData);
        alert('Ürün başarıyla güncellendi');
      } else {
        await apiService.createItem(submitData);
        alert('Ürün başarıyla oluşturuldu');
      }
      
      navigate('/definitions/items');
    } catch (err) {
      console.error('Error saving item:', err);
      alert(err.message || 'Ürün kaydedilirken bir hata oluştu');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate('/definitions/items');
  };

  if (!item && isEdit) {
    return (
      <div className="container-fluid py-4">
        <div className="alert alert-warning">
          <i className="bi bi-exclamation-triangle me-2"></i>
          Ürün bilgisi bulunamadı. Lütfen ürün listesinden tekrar seçin.
        </div>
        <button className="btn btn-secondary" onClick={() => navigate('/definitions/items')}>
          <i className="bi bi-arrow-left me-2"></i>
          Ürün Listesine Dön
        </button>
      </div>
    );
  }

  return (
    <div className="container-fluid py-4">
      {/* Header */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="d-flex justify-content-between align-items-center">
            <div className="d-flex align-items-center">
              <button 
                className="btn btn-outline-secondary me-3"
                onClick={handleCancel}
                disabled={submitting}
              >
                <i className="bi bi-arrow-left me-2"></i>
                Geri
              </button>
              <div>
                <h2 className="mb-1">
                  <i className="bi bi-box me-2"></i>
                  {isEdit ? 'Ürün Düzenle' : 'Yeni Ürün'}
                </h2>
                {isEdit && (
                  <p className="text-muted mb-0">{item.code} - {item.name}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <div className="row">
          {/* Temel Bilgiler */}
          <div className="col-md-6 mb-4">
            <div className="card h-100">
              <div className="card-header bg-light">
                <h5 className="card-title mb-0">
                  <i className="bi bi-info-circle me-2"></i>
                  Temel Bilgiler
                </h5>
              </div>
              <div className="card-body">
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label">
                      Numara <span className="text-danger">*</span>
                    </label>
                    <input
                      type="number"
                      className={`form-control ${errors.number ? 'is-invalid' : ''}`}
                      value={formData.number}
                      onChange={(e) => handleChange('number', e.target.value)}
                      disabled={submitting}
                    />
                    {errors.number && <div className="invalid-feedback">{errors.number}</div>}
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">
                      Kod <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      className={`form-control ${errors.code ? 'is-invalid' : ''}`}
                      value={formData.code}
                      onChange={(e) => handleChange('code', e.target.value)}
                      disabled={submitting}
                    />
                    {errors.code && <div className="invalid-feedback">{errors.code}</div>}
                  </div>

                  <div className="col-12">
                    <label className="form-label">
                      İsim <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      className={`form-control ${errors.name ? 'is-invalid' : ''}`}
                      value={formData.name}
                      onChange={(e) => handleChange('name', e.target.value)}
                      disabled={submitting}
                    />
                    {errors.name && <div className="invalid-feedback">{errors.name}</div>}
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">Doküman No</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.docNumber}
                      onChange={(e) => handleChange('docNumber', e.target.value)}
                      disabled={submitting}
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">
                      Grup <span className="text-danger">*</span>
                    </label>
                    <select
                      className={`form-select ${errors.groupId ? 'is-invalid' : ''}`}
                      value={formData.groupId}
                      onChange={(e) => handleChange('groupId', e.target.value)}
                      disabled={submitting}
                    >
                      <option value="">Seçiniz</option>
                      {itemGroups.map(group => (
                        <option key={group.id} value={group.id}>
                          {group.name}
                        </option>
                      ))}
                    </select>
                    {errors.groupId && <div className="invalid-feedback">{errors.groupId}</div>}
                  </div>

                  {isEdit && (
                    <div className="col-12">
                      <div className="form-check form-switch">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id="cancelled"
                          checked={formData.cancelled}
                          onChange={(e) => handleChange('cancelled', e.target.checked)}
                          disabled={submitting}
                        />
                        <label className="form-check-label" htmlFor="cancelled">
                          İptal Edilmiş
                        </label>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Boyutlar ve Tedarikçi */}
          <div className="col-md-6 mb-4">
            <div className="card h-100">
              <div className="card-header bg-light">
                <h5 className="card-title mb-0">
                  <i className="bi bi-rulers me-2"></i>
                  Boyutlar ve Tedarikçi
                </h5>
              </div>
              <div className="card-body">
                <div className="row g-3 mb-4">
                  <div className="col-12">
                    <h6 className="text-muted mb-2">Boyutlar</h6>
                  </div>
                  <div className="col-4">
                    <label className="form-label">X</label>
                    <input
                      type="number"
                      className="form-control"
                      value={formData.x}
                      onChange={(e) => handleChange('x', e.target.value)}
                      disabled={submitting}
                    />
                  </div>
                  <div className="col-4">
                    <label className="form-label">Y</label>
                    <input
                      type="number"
                      className="form-control"
                      value={formData.y}
                      onChange={(e) => handleChange('y', e.target.value)}
                      disabled={submitting}
                    />
                  </div>
                  <div className="col-4">
                    <label className="form-label">Z</label>
                    <input
                      type="number"
                      className="form-control"
                      value={formData.z}
                      onChange={(e) => handleChange('z', e.target.value)}
                      disabled={submitting}
                    />
                  </div>
                </div>

                <hr />

                <div className="row g-3">
                  <div className="col-12">
                    <h6 className="text-muted mb-2">Tedarikçi Bilgileri</h6>
                  </div>
                  <div className="col-12">
                    <label className="form-label">Tedarikçi</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.supplier}
                      onChange={(e) => handleChange('supplier', e.target.value)}
                      disabled={submitting}
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Tedarikçi Kodu</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.supplierCode}
                      onChange={(e) => handleChange('supplierCode', e.target.value)}
                      disabled={submitting}
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Birim</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.unit}
                      onChange={(e) => handleChange('unit', e.target.value)}
                      disabled={submitting}
                      placeholder="Adet, Kg, Litre..."
                    />
                  </div>
                  <div className="col-12">
                    <label className="form-label">Fiyat</label>
                    <div className="input-group">
                      <input
                        type="number"
                        step="0.01"
                        className="form-control"
                        value={formData.price}
                        onChange={(e) => handleChange('price', e.target.value)}
                        disabled={submitting}
                      />
                      <span className="input-group-text">₺</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Resim URL */}
          <div className="col-12 mb-4">
            <div className="card">
              <div className="card-header bg-light">
                <h5 className="card-title mb-0">
                  <i className="bi bi-image me-2"></i>
                  Ürün Resmi
                </h5>
              </div>
              <div className="card-body">
                <div className="row g-3">
                  <div className="col-12">
                    <label className="form-label">Resim URL</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.imageUrl}
                      onChange={(e) => handleChange('imageUrl', e.target.value)}
                      disabled={submitting}
                      placeholder="/Uploads/BOM/Images/..."
                    />
                  </div>
                  {formData.imageUrl && (
                    <div className="col-12">
                      <img
                        src={API_BASE_URL + formData.imageUrl}
                        alt="Ürün resmi önizleme"
                        className="img-thumbnail"
                        style={{ maxWidth: '300px', maxHeight: '300px' }}
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="col-12">
            <div className="card">
              <div className="card-body">
                <div className="d-flex justify-content-end gap-2">
                  <button 
                    type="button" 
                    className="btn btn-secondary"
                    onClick={handleCancel}
                    disabled={submitting}
                  >
                    <i className="bi bi-x me-2"></i>
                    İptal
                  </button>
                  <button 
                    type="submit" 
                    className="btn btn-primary"
                    disabled={submitting}
                  >
                    {submitting && (
                      <span className="spinner-border spinner-border-sm me-2" role="status">
                        <span className="visually-hidden">Loading...</span>
                      </span>
                    )}
                    <i className="bi bi-check2 me-2"></i>
                    {isEdit ? 'Güncelle' : 'Kaydet'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default ItemEditPage;