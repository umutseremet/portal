// src/frontend/src/pages/PurchaseRequestFormPage.js
// Modal'sız tam sayfa yapısı - ItemEditPage benzeri

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import apiService from '../services/api';
import {
  REQUEST_PRIORITY,
  REQUEST_PRIORITY_LABELS,
  REQUEST_TYPE,
  REQUEST_TYPE_LABELS
} from '../utils/constants';

const PurchaseRequestFormPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isEdit = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [items, setItems] = useState([]);
  const [errors, setErrors] = useState({});

  const [formData, setFormData] = useState({
    description: '',
    priority: REQUEST_PRIORITY.NORMAL,
    requestType: REQUEST_TYPE.STANDARD,
    details: []
  });

  const [detailForm, setDetailForm] = useState({
    itemId: '',
    quantity: 1,
    unit: 'Adet',
    description: '',
    requiredDate: '',
    estimatedUnitPrice: ''
  });

  // Load data
  useEffect(() => {
    loadItems();
    if (isEdit) {
      loadRequest();
    }
  }, [id]);

  const loadItems = async () => {
    try {
      const response = await apiService.getItems({ pageSize: 1000 });
      setItems(response.items || []);
    } catch (error) {
      console.error('Error loading items:', error);
      alert('Ürün listesi yüklenirken hata oluştu');
    }
  };

  const loadRequest = async () => {
    try {
      setLoading(true);
      const response = await apiService.getPurchaseRequest(id);
      setFormData({
        description: response.description || '',
        priority: response.priority,
        requestType: response.requestType,
        details: response.details || []
      });
    } catch (error) {
      console.error('Error loading request:', error);
      alert('Talep yüklenirken hata oluştu');
      navigate('/purchase-requests');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleDetailInputChange = (e) => {
    const { name, value } = e.target;
    setDetailForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddDetail = () => {
    // Validation
    if (!detailForm.itemId || !detailForm.quantity) {
      alert('Ürün ve miktar zorunludur');
      return;
    }

    if (parseFloat(detailForm.quantity) <= 0) {
      alert('Miktar 0\'dan büyük olmalıdır');
      return;
    }

    const selectedItem = items.find(i => i.id === parseInt(detailForm.itemId));
    if (!selectedItem) {
      alert('Seçilen ürün bulunamadı');
      return;
    }

    const newDetail = {
      itemId: selectedItem.id,
      itemCode: selectedItem.code,
      itemName: selectedItem.name,
      itemGroupId: selectedItem.groupId,
      itemGroupName: selectedItem.groupName,
      quantity: parseFloat(detailForm.quantity),
      unit: detailForm.unit,
      description: detailForm.description,
      requiredDate: detailForm.requiredDate || null,
      estimatedUnitPrice: detailForm.estimatedUnitPrice ? parseFloat(detailForm.estimatedUnitPrice) : null
    };

    setFormData(prev => ({
      ...prev,
      details: [...prev.details, newDetail]
    }));

    // Reset detail form
    setDetailForm({
      itemId: '',
      quantity: 1,
      unit: 'Adet',
      description: '',
      requiredDate: '',
      estimatedUnitPrice: ''
    });
  };

  const handleRemoveDetail = (index) => {
    if (!window.confirm('Bu ürünü listeden çıkarmak istediğinizden emin misiniz?')) {
      return;
    }

    setFormData(prev => ({
      ...prev,
      details: prev.details.filter((_, i) => i !== index)
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (formData.details.length === 0) {
      newErrors.details = 'En az bir ürün eklemelisiniz';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      alert('Lütfen tüm zorunlu alanları doldurun');
      return;
    }

    try {
      setSubmitting(true);

      const requestData = {
        description: formData.description,
        priority: formData.priority,
        requestType: formData.requestType,
        details: formData.details.map(d => ({
          itemId: d.itemId,
          quantity: d.quantity,
          unit: d.unit,
          description: d.description,
          requiredDate: d.requiredDate,
          estimatedUnitPrice: d.estimatedUnitPrice
        }))
      };

      if (isEdit) {
        await apiService.updatePurchaseRequest(id, requestData);
        alert('Talep başarıyla güncellendi');
      } else {
        await apiService.createPurchaseRequest(requestData);
        alert('Talep başarıyla oluşturuldu');
      }

      navigate('/purchase-requests');
    } catch (error) {
      console.error('Error saving request:', error);
      alert('Hata: ' + (error.response?.data?.message || error.message));
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (formData.details.length > 0) {
      if (!window.confirm('Kaydedilmemiş değişiklikler var. Çıkmak istediğinizden emin misiniz?')) {
        return;
      }
    }
    navigate('/purchase-requests');
  };

  if (loading) {
    return (
      <div className="container-fluid py-4">
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Yükleniyor...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid py-4">
      {/* Header */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="card shadow-sm">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h2 className="mb-1">
                    <i className="bi bi-file-earmark-text text-primary me-2"></i>
                    {isEdit ? 'Talep Düzenle' : 'Yeni Talep Oluştur'}
                  </h2>
                  <p className="text-muted mb-0">
                    {isEdit ? 'Mevcut talebi düzenleyin' : 'Yeni satınalma talebi oluşturun'}
                  </p>
                </div>
                <button 
                  className="btn btn-outline-secondary" 
                  onClick={handleCancel}
                  disabled={submitting}
                >
                  <i className="bi bi-x me-2"></i>
                  İptal
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="row">
          {/* Left Column - Form */}
          <div className="col-lg-8 mb-4">
            {/* Temel Bilgiler */}
            <div className="card shadow-sm mb-4">
              <div className="card-header bg-light">
                <h5 className="mb-0">
                  <i className="bi bi-info-circle me-2"></i>
                  Temel Bilgiler
                </h5>
              </div>
              <div className="card-body">
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label">
                      Öncelik <span className="text-danger">*</span>
                    </label>
                    <select
                      className="form-select"
                      name="priority"
                      value={formData.priority}
                      onChange={handleInputChange}
                      disabled={submitting}
                      required
                    >
                      {Object.entries(REQUEST_PRIORITY_LABELS).map(([key, label]) => (
                        <option key={key} value={key}>{label}</option>
                      ))}
                    </select>
                  </div>

                  <div className="col-md-6 mb-3">
                    <label className="form-label">
                      Talep Türü <span className="text-danger">*</span>
                    </label>
                    <select
                      className="form-select"
                      name="requestType"
                      value={formData.requestType}
                      onChange={handleInputChange}
                      disabled={submitting}
                      required
                    >
                      {Object.entries(REQUEST_TYPE_LABELS).map(([key, label]) => (
                        <option key={key} value={key}>{label}</option>
                      ))}
                    </select>
                  </div>

                  <div className="col-12 mb-3">
                    <label className="form-label">Açıklama</label>
                    <textarea
                      className="form-control"
                      name="description"
                      rows="3"
                      value={formData.description}
                      onChange={handleInputChange}
                      disabled={submitting}
                      placeholder="Talep hakkında açıklama yazın..."
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Ürün Ekle */}
            <div className="card shadow-sm mb-4">
              <div className="card-header bg-light">
                <h5 className="mb-0">
                  <i className="bi bi-plus-circle me-2"></i>
                  Ürün Ekle
                </h5>
              </div>
              <div className="card-body">
                <div className="row">
                  <div className="col-md-12 mb-3">
                    <label className="form-label">
                      Ürün <span className="text-danger">*</span>
                    </label>
                    <select
                      className="form-select"
                      name="itemId"
                      value={detailForm.itemId}
                      onChange={handleDetailInputChange}
                      disabled={submitting}
                    >
                      <option value="">Seçiniz...</option>
                      {items.map(item => (
                        <option key={item.id} value={item.id}>
                          {item.code} - {item.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="col-md-3 mb-3">
                    <label className="form-label">
                      Miktar <span className="text-danger">*</span>
                    </label>
                    <input
                      type="number"
                      className="form-control"
                      name="quantity"
                      value={detailForm.quantity}
                      onChange={handleDetailInputChange}
                      min="0.01"
                      step="0.01"
                      disabled={submitting}
                    />
                  </div>

                  <div className="col-md-3 mb-3">
                    <label className="form-label">Birim</label>
                    <input
                      type="text"
                      className="form-control"
                      name="unit"
                      value={detailForm.unit}
                      onChange={handleDetailInputChange}
                      disabled={submitting}
                    />
                  </div>

                  <div className="col-md-3 mb-3">
                    <label className="form-label">Tahmini Fiyat</label>
                    <input
                      type="number"
                      className="form-control"
                      name="estimatedUnitPrice"
                      value={detailForm.estimatedUnitPrice}
                      onChange={handleDetailInputChange}
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      disabled={submitting}
                    />
                  </div>

                  <div className="col-md-3 mb-3">
                    <label className="form-label">İhtiyaç Tarihi</label>
                    <input
                      type="date"
                      className="form-control"
                      name="requiredDate"
                      value={detailForm.requiredDate}
                      onChange={handleDetailInputChange}
                      disabled={submitting}
                    />
                  </div>

                  <div className="col-md-12 mb-3">
                    <label className="form-label">Ürün Açıklaması</label>
                    <input
                      type="text"
                      className="form-control"
                      name="description"
                      value={detailForm.description}
                      onChange={handleDetailInputChange}
                      placeholder="Ürün için özel notlar..."
                      disabled={submitting}
                    />
                  </div>

                  <div className="col-12">
                    <button
                      type="button"
                      className="btn btn-primary w-100"
                      onClick={handleAddDetail}
                      disabled={submitting}
                    >
                      <i className="bi bi-plus-lg me-2"></i>
                      Ürünü Listeye Ekle
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Eklenen Ürünler */}
          <div className="col-lg-4 mb-4">
            <div className="card shadow-sm sticky-top" style={{ top: '20px' }}>
              <div className="card-header bg-light">
                <h5 className="mb-0">
                  <i className="bi bi-cart-check me-2"></i>
                  Eklenen Ürünler ({formData.details.length})
                </h5>
              </div>
              <div className="card-body" style={{ maxHeight: '600px', overflowY: 'auto' }}>
                {formData.details.length === 0 ? (
                  <div className="text-center py-5 text-muted">
                    <i className="bi bi-inbox fs-1 d-block mb-2"></i>
                    <p className="mb-0">Henüz ürün eklenmedi</p>
                    <small>Soldaki formdan ürün ekleyin</small>
                  </div>
                ) : (
                  <div className="list-group list-group-flush">
                    {formData.details.map((detail, index) => (
                      <div key={index} className="list-group-item px-0 border-bottom">
                        <div className="d-flex justify-content-between align-items-start mb-2">
                          <div className="flex-grow-1">
                            <h6 className="mb-1">
                              <code className="text-primary">{detail.itemCode}</code>
                            </h6>
                            <p className="mb-1 small">{detail.itemName}</p>
                            {detail.itemGroupName && (
                              <span className="badge bg-secondary mb-2">{detail.itemGroupName}</span>
                            )}
                          </div>
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => handleRemoveDetail(index)}
                            disabled={submitting}
                            title="Çıkar"
                          >
                            <i className="bi bi-trash"></i>
                          </button>
                        </div>
                        <div className="d-flex justify-content-between small text-muted">
                          <span><strong>{detail.quantity}</strong> {detail.unit}</span>
                          {detail.estimatedUnitPrice && (
                            <span className="text-primary">
                              {new Intl.NumberFormat('tr-TR', {
                                style: 'currency',
                                currency: 'TRY'
                              }).format(detail.estimatedUnitPrice)}
                            </span>
                          )}
                        </div>
                        {detail.requiredDate && (
                          <div className="small text-muted mt-1">
                            <i className="bi bi-calendar-event me-1"></i>
                            {new Date(detail.requiredDate).toLocaleDateString('tr-TR')}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {errors.details && (
                  <div className="alert alert-danger mt-3 mb-0">
                    <i className="bi bi-exclamation-triangle me-2"></i>
                    {errors.details}
                  </div>
                )}
              </div>
              <div className="card-footer bg-light">
                <div className="d-grid gap-2">
                  <button
                    type="submit"
                    className="btn btn-success"
                    disabled={submitting || formData.details.length === 0}
                  >
                    {submitting ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                        Kaydediliyor...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-check-lg me-2"></i>
                        {isEdit ? 'Değişiklikleri Kaydet' : 'Talebi Oluştur'}
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={handleCancel}
                    disabled={submitting}
                  >
                    İptal
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

export default PurchaseRequestFormPage;