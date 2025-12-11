// src/frontend/src/pages/PurchaseRequestFormPage.js
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../services/api';
import {
  REQUEST_PRIORITY_LABELS,
  REQUEST_TYPE_LABELS
} from '../../src/utils/constants';

const PurchaseRequestFormPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [items, setItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  // Form state
  const [formData, setFormData] = useState({
    priority: 'Normal',
    requestType: 'Standard',
    description: ''
  });

  // Product form state
  const [productForm, setProductForm] = useState({
    itemId: '',
    itemCode: '',
    itemName: '',
    quantity: '',
    unit: '',
    description: '',
    requiredDate: '',
    estimatedUnitPrice: '',
    itemGroupName: ''
  });

  // Added products list
  const [addedProducts, setAddedProducts] = useState([]);

  // Load items
  useEffect(() => {
    loadItems();
  }, []);

  // Load existing request if edit mode
  useEffect(() => {
    if (isEdit) {
      loadRequest();
    }
  }, [id, isEdit]);

  // Filter items when search term changes
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredItems(items.slice(0, 50)); // İlk 50 ürünü göster
    } else {
      const filtered = items.filter(item => 
        item.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.docNumber?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredItems(filtered.slice(0, 50)); // Max 50 sonuç
    }
  }, [searchTerm, items]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const loadItems = async () => {
    try {
      console.log('📦 Loading items...');
      const response = await api.getItems({ 
        pageSize: 1000, 
        includeCancelled: false 
      });
      
      console.log('📦 Items API Response:', response);
      
      // API response yapısına göre items'ı al
      const itemsData = response.items || response.data?.items || response.data || [];
      
      console.log('✅ Items loaded:', itemsData.length);
      setItems(itemsData);
      setFilteredItems(itemsData.slice(0, 50));
    } catch (error) {
      console.error('❌ Ürünler yüklenemedi:', error);
      alert('Ürünler yüklenirken bir hata oluştu.');
    }
  };

  const loadRequest = async () => {
    setLoading(true);
    try {
      const response = await api.getPurchaseRequest(id);
      const request = response.data;
      
      setFormData({
        priority: request.priority,
        requestType: request.requestType,
        description: request.description || ''
      });

      if (request.details && request.details.length > 0) {
        const products = request.details.map(detail => ({
          itemId: detail.itemId,
          itemCode: detail.itemCode,
          itemName: detail.itemName,
          itemGroupName: detail.itemGroupName,
          quantity: detail.quantity,
          unit: detail.unit,
          description: detail.description || '',
          requiredDate: detail.requiredDate || '',
          estimatedUnitPrice: detail.estimatedUnitPrice || ''
        }));
        setAddedProducts(products);
      }
    } catch (error) {
      console.error('Talep yüklenirken hata:', error);
      alert('Talep bilgileri yüklenemedi.');
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
  };

  const handleProductFormChange = (e) => {
    const { name, value } = e.target;
    setProductForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setShowDropdown(true);
  };

  const handleSelectItem = (item) => {
    setProductForm(prev => ({
      ...prev,
      itemId: item.id,
      itemCode: item.code,
      itemName: item.name,
      unit: item.unit || '',
      itemGroupName: item.groupName || item.itemGroupName || ''
    }));
    setSearchTerm(`${item.code} - ${item.name}`);
    setShowDropdown(false);
  };

  const handleSearchFocus = () => {
    setShowDropdown(true);
  };

  const handleAddProduct = () => {
    if (!productForm.itemId || !productForm.quantity) {
      alert('Lütfen ürün ve miktar seçiniz.');
      return;
    }

    const newProduct = {
      itemId: productForm.itemId,
      itemCode: productForm.itemCode,
      itemName: productForm.itemName,
      itemGroupName: productForm.itemGroupName,
      quantity: parseFloat(productForm.quantity),
      unit: productForm.unit,
      description: productForm.description,
      requiredDate: productForm.requiredDate,
      estimatedUnitPrice: productForm.estimatedUnitPrice ? parseFloat(productForm.estimatedUnitPrice) : null
    };

    setAddedProducts(prev => [...prev, newProduct]);
    
    // Reset form
    setProductForm({
      itemId: '',
      itemCode: '',
      itemName: '',
      quantity: '',
      unit: '',
      description: '',
      requiredDate: '',
      estimatedUnitPrice: '',
      itemGroupName: ''
    });
    setSearchTerm('');
  };

  const handleRemoveProduct = (index) => {
    setAddedProducts(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (addedProducts.length === 0) {
      alert('Lütfen en az bir ürün ekleyiniz.');
      return;
    }

    setSubmitting(true);
    try {
      const requestData = {
        ...formData,
        details: addedProducts.map(product => ({
          itemId: product.itemId,
          quantity: product.quantity,
          unit: product.unit,
          description: product.description,
          requiredDate: product.requiredDate || null,
          estimatedUnitPrice: product.estimatedUnitPrice
        }))
      };

      if (isEdit) {
        await api.updatePurchaseRequest(id, requestData);
        alert('Talep başarıyla güncellendi.');
      } else {
        await api.createPurchaseRequest(requestData);
        alert('Talep başarıyla oluşturuldu.');
      }

      navigate('/purchase-requests');
    } catch (error) {
      console.error('Kaydetme hatası:', error);
      alert(error.response?.data?.message || 'Talep kaydedilirken bir hata oluştu.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate('/purchase-requests');
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <div className="spinner-border" style={{ color: '#4dd4d4' }} role="status">
          <span className="visually-hidden">Yükleniyor...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid p-4">
      {/* Header */}
      <div className="mb-4">
        <div className="d-flex justify-content-between align-items-center">
          <div>
            <h2 className="mb-1">
              <i className={`bi ${isEdit ? 'bi-pencil-square' : 'bi-plus-circle'} me-2`} style={{ color: '#4dd4d4' }}></i>
              {isEdit ? 'Talep Düzenle' : 'Yeni Satınalma Talebi'}
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

      <form onSubmit={handleSubmit}>
        {/* ===== 1. TEMEL BİLGİLER ===== */}
        <div className="card shadow-sm mb-4">
          <div className="card-header" style={{ 
            backgroundColor: '#f8f9fa', 
            color: '#333',
            fontWeight: '500',
            border: 'none'
          }}>
            <h5 className="mb-0">
              <i className="bi bi-info-circle me-2"></i>
              Talep Bilgileri
            </h5>
          </div>
          <div className="card-body bg-light">
            <div className="row">
              <div className="col-md-4 mb-3">
                <label className="form-label fw-bold">
                  Öncelik <span className="text-danger">*</span>
                </label>
                <select
                  className="form-select form-select-lg"
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

              <div className="col-md-4 mb-3">
                <label className="form-label fw-bold">
                  Talep Türü <span className="text-danger">*</span>
                </label>
                <select
                  className="form-select form-select-lg"
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

              <div className="col-md-4 mb-3">
                <label className="form-label fw-bold">Açıklama</label>
                <textarea
                  className="form-control"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows="1"
                  placeholder="İsteğe bağlı açıklama giriniz"
                  disabled={submitting}
                />
              </div>
            </div>
          </div>
        </div>

        {/* ===== 2. ÜRÜN EKLEME FORMU ===== */}
        <div className="card shadow-sm mb-4">
          <div className="card-header" style={{ 
            backgroundColor: '#f8f9fa', 
            color: '#fff',
            fontWeight: '500',
            border: 'none'
          }}>
            <h5 className="mb-0">
              <i className="bi bi-plus-circle me-2"></i>
              Ürün Ekle
            </h5>
          </div>
          <div className="card-body bg-light">
            <div className="row">
              {/* Ürün Seçimi - Arama Özellikli Dropdown */}
              <div className="col-md-4 mb-3">
                <label className="form-label fw-bold">
                  Ürün Ara ve Seç <span className="text-danger">*</span>
                </label>
                <div className="position-relative" ref={dropdownRef}>
                  <div className="input-group">
                    <span className="input-group-text">
                      <i className="bi bi-search"></i>
                    </span>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Ürün kodu, adı veya doküman no..."
                      value={searchTerm}
                      onChange={handleSearchChange}
                      onFocus={handleSearchFocus}
                      disabled={submitting}
                    />
                    {searchTerm && (
                      <button
                        type="button"
                        className="btn btn-outline-secondary"
                        onClick={() => {
                          setSearchTerm('');
                          setProductForm(prev => ({ ...prev, itemId: '', itemCode: '', itemName: '' }));
                        }}
                      >
                        <i className="bi bi-x"></i>
                      </button>
                    )}
                  </div>
                  
                  {/* Dropdown Liste */}
                  {showDropdown && (
                    <div 
                      className="position-absolute w-100 bg-white border rounded shadow-lg mt-1" 
                      style={{ 
                        maxHeight: '300px', 
                        overflowY: 'auto', 
                        zIndex: 1000 
                      }}
                    >
                      {filteredItems.length === 0 ? (
                        <div className="p-3 text-center text-muted">
                          <i className="bi bi-inbox"></i>
                          <p className="mb-0 mt-2">Ürün bulunamadı</p>
                        </div>
                      ) : (
                        <>
                          <div className="p-2 bg-light border-bottom">
                            <small className="text-muted">
                              <i className="bi bi-info-circle me-1"></i>
                              {filteredItems.length} ürün gösteriliyor
                            </small>
                          </div>
                          {filteredItems.map(item => (
                            <div
                              key={item.id}
                              className="p-2 border-bottom cursor-pointer hover-bg-light"
                              style={{ cursor: 'pointer' }}
                              onClick={() => handleSelectItem(item)}
                              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
                              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
                            >
                              <div className="d-flex justify-content-between align-items-start">
                                <div className="flex-grow-1">
                                  <div>
                                    <span className="badge bg-secondary me-2">{item.code}</span>
                                    <strong>{item.name}</strong>
                                  </div>
                                  <small className="text-muted d-block mt-1">
                                    {item.groupName || item.itemGroupName || 'Grup yok'}
                                    {item.docNumber && ` • ${item.docNumber}`}
                                  </small>
                                </div>
                                {item.unit && (
                                  <span className="badge bg-info ms-2">{item.unit}</span>
                                )}
                              </div>
                            </div>
                          ))}
                        </>
                      )}
                    </div>
                  )}
                </div>
                {productForm.itemGroupName && (
                  <small className="text-muted d-block mt-1">
                    <i className="bi bi-tag me-1"></i>
                    Grup: {productForm.itemGroupName}
                  </small>
                )}
              </div>

              {/* Miktar */}
              <div className="col-md-2 mb-3">
                <label className="form-label fw-bold">
                  Miktar <span className="text-danger">*</span>
                </label>
                <input
                  type="number"
                  className="form-control"
                  name="quantity"
                  value={productForm.quantity}
                  onChange={handleProductFormChange}
                  step="0.01"
                  min="0"
                  placeholder="0"
                  disabled={submitting}
                />
              </div>

              {/* Birim */}
              <div className="col-md-2 mb-3">
                <label className="form-label fw-bold">Birim</label>
                <input
                  type="text"
                  className="form-control"
                  name="unit"
                  value={productForm.unit}
                  onChange={handleProductFormChange}
                  placeholder="Adet, Kg, vb."
                  disabled={submitting}
                />
              </div>

              {/* Açıklama */}
              <div className="col-md-4 mb-3">
                <label className="form-label fw-bold">Açıklama</label>
                <input
                  type="text"
                  className="form-control"
                  name="description"
                  value={productForm.description}
                  onChange={handleProductFormChange}
                  placeholder="Ürün açıklaması"
                  disabled={submitting}
                />
              </div>

              {/* Gerekli Tarih */}
              <div className="col-md-3 mb-3">
                <label className="form-label fw-bold">Gerekli Tarih</label>
                <input
                  type="date"
                  className="form-control"
                  name="requiredDate"
                  value={productForm.requiredDate}
                  onChange={handleProductFormChange}
                  disabled={submitting}
                />
              </div>

              {/* Tahmini Birim Fiyat */}
              <div className="col-md-3 mb-3">
                <label className="form-label fw-bold">Tahmini Birim Fiyat</label>
                <input
                  type="number"
                  className="form-control"
                  name="estimatedUnitPrice"
                  value={productForm.estimatedUnitPrice}
                  onChange={handleProductFormChange}
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  disabled={submitting}
                />
              </div>

              {/* Ekle Butonu */}
              <div className="col-md-6 mb-3 d-flex align-items-end">
                <button
                  type="button"
                  className="btn w-100"
                  style={{ backgroundColor: '#4dd4d4', color: '#fff', border: 'none' }}
                  onClick={handleAddProduct}
                  disabled={submitting}
                >
                  <i className="bi bi-plus-circle me-2"></i>
                  Ürün Ekle
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ===== 3. EKLENEN ÜRÜNLER LİSTESİ ===== */}
        <div className="card shadow-sm mb-4">
          <div className="card-header" style={{ 
            backgroundColor: '#f8f9fa', 
            color: '#fff',
            fontWeight: '500',
            border: 'none'
          }}>
            <h5 className="mb-0">
              <i className="bi bi-list-check me-2"></i>
              Eklenen Ürünler ({addedProducts.length})
            </h5>
          </div>
          <div className="card-body p-0">
            {addedProducts.length === 0 ? (
              <div className="text-center py-5 text-muted">
                <i className="bi bi-inbox display-1"></i>
                <p className="mt-3">Henüz ürün eklenmedi</p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead className="table-light">
                    <tr>
                      <th style={{ width: '50px' }}>#</th>
                      <th>Ürün Kodu</th>
                      <th>Ürün Adı</th>
                      <th>Grup</th>
                      <th className="text-end">Miktar</th>
                      <th>Birim</th>
                      <th>Açıklama</th>
                      <th>Gerekli Tarih</th>
                      <th className="text-end">Tahmini Fiyat</th>
                      <th className="text-center" style={{ width: '100px' }}>İşlem</th>
                    </tr>
                  </thead>
                  <tbody>
                    {addedProducts.map((product, index) => (
                      <tr key={index}>
                        <td>{index + 1}</td>
                        <td>
                          <span className="badge bg-secondary">{product.itemCode}</span>
                        </td>
                        <td>{product.itemName}</td>
                        <td>
                          <small className="text-muted">{product.itemGroupName || '-'}</small>
                        </td>
                        <td className="text-end fw-bold">{product.quantity}</td>
                        <td>{product.unit}</td>
                        <td>
                          <small>{product.description || '-'}</small>
                        </td>
                        <td>
                          <small>{product.requiredDate || '-'}</small>
                        </td>
                        <td className="text-end">
                          {product.estimatedUnitPrice 
                            ? `₺${product.estimatedUnitPrice.toFixed(2)}` 
                            : '-'
                          }
                        </td>
                        <td className="text-center">
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => handleRemoveProduct(index)}
                            disabled={submitting}
                          >
                            <i className="bi bi-trash"></i>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* ===== 4. FORM BUTONLARI ===== */}
        <div className="d-flex justify-content-end gap-3">
          <button
            type="button"
            className="btn btn-outline-secondary btn-lg"
            onClick={handleCancel}
            disabled={submitting}
          >
            <i className="bi bi-x-circle me-2"></i>
            İptal
          </button>
          <button
            type="submit"
            className="btn btn-lg"
            style={{ backgroundColor: '#4dd4d4', color: '#fff', border: 'none' }}
            disabled={submitting || addedProducts.length === 0}
          >
            {submitting ? (
              <>
                <span className="spinner-border spinner-border-sm me-2"></span>
                Kaydediliyor...
              </>
            ) : (
              <>
                <i className="bi bi-check-circle me-2"></i>
                {isEdit ? 'Güncelle' : 'Talebi Oluştur'}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PurchaseRequestFormPage;