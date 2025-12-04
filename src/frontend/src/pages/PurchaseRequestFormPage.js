// src/frontend/src/pages/PurchaseRequestFormPage.js
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  REQUEST_PRIORITY_LABELS, 
  REQUEST_TYPE_LABELS,
  PURCHASE_REQUEST_STATUS 
} from '../utils/constants';
import api from '../services/api';

const PurchaseRequestFormPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;

  // State
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [items, setItems] = useState([]);
  const [itemGroups, setItemGroups] = useState([]);
  
  // Form verileri
  const [formData, setFormData] = useState({
    description: '',
    priority: 'Normal',
    requestType: 'Standard'
  });

  // Ürün ekleme formu
  const [productForm, setProductForm] = useState({
    itemId: '',
    itemCode: '',
    itemName: '',
    itemGroupId: '',
    itemGroupName: '',
    quantity: '',
    unit: '',
    description: '',
    requiredDate: '',
    estimatedUnitPrice: '',
    estimatedTotalPrice: ''
  });

  // Eklenen ürünler listesi
  const [addedProducts, setAddedProducts] = useState([]);

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Ürünleri yükle
      const itemsResponse = await api.getItems();
      setItems(itemsResponse.data || []);

      // Ürün gruplarını yükle
      const groupsResponse = await api.getItemGroups();
      setItemGroups(groupsResponse.data || []);

      // Düzenleme modundaysa, mevcut talebi yükle
      if (isEdit) {
        const response = await api.getPurchaseRequest(id);
        const request = response.data;
        
        setFormData({
          description: request.description || '',
          priority: request.priority || 'Normal',
          requestType: request.requestType || 'Standard'
        });

        setAddedProducts(request.details || []);
      }
    } catch (error) {
      console.error('Veri yükleme hatası:', error);
      alert('Veriler yüklenirken bir hata oluştu.');
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
    
    // Ürün seçildiğinde
    if (name === 'itemId') {
      const selectedItem = items.find(item => item.id === parseInt(value));
      if (selectedItem) {
        setProductForm(prev => ({
          ...prev,
          itemId: value,
          itemCode: selectedItem.code,
          itemName: selectedItem.name,
          itemGroupId: selectedItem.groupId,
          itemGroupName: selectedItem.itemGroup?.name || '',
          unit: selectedItem.unit || ''
        }));
      }
    } else if (name === 'quantity' || name === 'estimatedUnitPrice') {
      // Miktar veya birim fiyat değiştiğinde toplam fiyatı hesapla
      const qty = name === 'quantity' ? parseFloat(value) || 0 : parseFloat(productForm.quantity) || 0;
      const price = name === 'estimatedUnitPrice' ? parseFloat(value) || 0 : parseFloat(productForm.estimatedUnitPrice) || 0;
      
      setProductForm(prev => ({
        ...prev,
        [name]: value,
        estimatedTotalPrice: qty * price
      }));
    } else {
      setProductForm(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleAddProduct = () => {
    // Validasyon
    if (!productForm.itemId || !productForm.quantity) {
      alert('Lütfen en az ürün ve miktar bilgilerini giriniz.');
      return;
    }

    // Ürünü listeye ekle
    const newProduct = {
      itemId: parseInt(productForm.itemId),
      itemCode: productForm.itemCode,
      itemName: productForm.itemName,
      itemGroupId: productForm.itemGroupId,
      itemGroupName: productForm.itemGroupName,
      quantity: parseFloat(productForm.quantity),
      unit: productForm.unit,
      description: productForm.description,
      requiredDate: productForm.requiredDate,
      estimatedUnitPrice: productForm.estimatedUnitPrice ? parseFloat(productForm.estimatedUnitPrice) : null,
      estimatedTotalPrice: productForm.estimatedTotalPrice ? parseFloat(productForm.estimatedTotalPrice) : null,
      currency: 'TRY'
    };

    setAddedProducts(prev => [...prev, newProduct]);

    // Formu temizle
    setProductForm({
      itemId: '',
      itemCode: '',
      itemName: '',
      itemGroupId: '',
      itemGroupName: '',
      quantity: '',
      unit: '',
      description: '',
      requiredDate: '',
      estimatedUnitPrice: '',
      estimatedTotalPrice: ''
    });
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
        <div className="spinner-border text-primary" role="status">
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
              <i className={`bi ${isEdit ? 'bi-pencil-square' : 'bi-plus-circle'} text-primary me-2`}></i>
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
          <div className="card-header bg-primary text-white">
            <h5 className="mb-0">
              <i className="bi bi-info-circle me-2"></i>
              Talep Bilgileri
            </h5>
          </div>
          <div className="card-body">
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
          <div className="card-header bg-success text-white">
            <h5 className="mb-0">
              <i className="bi bi-plus-circle me-2"></i>
              Ürün Ekle
            </h5>
          </div>
          <div className="card-body">
            <div className="row">
              {/* Ürün Seçimi */}
              <div className="col-md-4 mb-3">
                <label className="form-label fw-bold">
                  Ürün <span className="text-danger">*</span>
                </label>
                <select
                  className="form-select"
                  name="itemId"
                  value={productForm.itemId}
                  onChange={handleProductFormChange}
                  disabled={submitting}
                >
                  <option value="">Ürün Seçiniz</option>
                  {items.map(item => (
                    <option key={item.id} value={item.id}>
                      {item.code} - {item.name}
                    </option>
                  ))}
                </select>
                {productForm.itemGroupName && (
                  <small className="text-muted">Grup: {productForm.itemGroupName}</small>
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

              {/* İhtiyaç Tarihi */}
              <div className="col-md-2 mb-3">
                <label className="form-label fw-bold">İhtiyaç Tarihi</label>
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
              <div className="col-md-2 mb-3">
                <label className="form-label fw-bold">Tahmini Birim Fiyat</label>
                <div className="input-group">
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
                  <span className="input-group-text">₺</span>
                </div>
              </div>

              {/* Açıklama */}
              <div className="col-md-12 mb-3">
                <label className="form-label fw-bold">Ürün Açıklaması</label>
                <textarea
                  className="form-control"
                  name="description"
                  value={productForm.description}
                  onChange={handleProductFormChange}
                  rows="2"
                  placeholder="İsteğe bağlı ürün açıklaması"
                  disabled={submitting}
                />
              </div>
            </div>

            {/* Tahmini Toplam Fiyat (Hesaplanan) */}
            {productForm.estimatedTotalPrice > 0 && (
              <div className="alert alert-info d-flex align-items-center mb-3">
                <i className="bi bi-calculator me-2 fs-4"></i>
                <div>
                  <strong>Tahmini Toplam:</strong> {productForm.estimatedTotalPrice.toFixed(2)} ₺
                </div>
              </div>
            )}

            {/* Ekle Butonu */}
            <div className="d-flex justify-content-end">
              <button
                type="button"
                className="btn btn-success btn-lg"
                onClick={handleAddProduct}
                disabled={submitting || !productForm.itemId || !productForm.quantity}
              >
                <i className="bi bi-plus-circle me-2"></i>
                Ürünü Listeye Ekle
              </button>
            </div>
          </div>
        </div>

        {/* ===== 3. EKLENEN ÜRÜNLER LİSTESİ ===== */}
        <div className="card shadow-sm mb-4">
          <div className="card-header bg-info text-white">
            <h5 className="mb-0">
              <i className="bi bi-list-ul me-2"></i>
              Eklenen Ürünler ({addedProducts.length})
            </h5>
          </div>
          <div className="card-body">
            {addedProducts.length === 0 ? (
              <div className="text-center py-5 text-muted">
                <i className="bi bi-inbox fs-1 d-block mb-3"></i>
                <p className="mb-0">Henüz ürün eklenmedi. Yukarıdaki formdan ürün ekleyiniz.</p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover table-bordered align-middle">
                  <thead className="table-light">
                    <tr>
                      <th style={{ width: '5%' }}>#</th>
                      <th style={{ width: '12%' }}>Ürün Kodu</th>
                      <th style={{ width: '20%' }}>Ürün Adı</th>
                      <th style={{ width: '12%' }}>Grup</th>
                      <th style={{ width: '8%' }} className="text-end">Miktar</th>
                      <th style={{ width: '6%' }}>Birim</th>
                      <th style={{ width: '10%' }}>İhtiyaç Tarihi</th>
                      <th style={{ width: '10%' }} className="text-end">Birim Fiyat</th>
                      <th style={{ width: '10%' }} className="text-end">Toplam</th>
                      <th style={{ width: '7%' }} className="text-center">İşlem</th>
                    </tr>
                  </thead>
                  <tbody>
                    {addedProducts.map((product, index) => (
                      <tr key={index}>
                        <td className="text-center fw-bold">{index + 1}</td>
                        <td>
                          <span className="badge bg-secondary">{product.itemCode}</span>
                        </td>
                        <td>
                          <strong>{product.itemName}</strong>
                          {product.description && (
                            <div className="text-muted small">{product.description}</div>
                          )}
                        </td>
                        <td>
                          <span className="badge bg-light text-dark">{product.itemGroupName}</span>
                        </td>
                        <td className="text-end fw-bold">{product.quantity}</td>
                        <td>{product.unit}</td>
                        <td>
                          {product.requiredDate 
                            ? new Date(product.requiredDate).toLocaleDateString('tr-TR')
                            : '-'}
                        </td>
                        <td className="text-end">
                          {product.estimatedUnitPrice 
                            ? `${product.estimatedUnitPrice.toFixed(2)} ₺`
                            : '-'}
                        </td>
                        <td className="text-end fw-bold text-success">
                          {product.estimatedTotalPrice 
                            ? `${product.estimatedTotalPrice.toFixed(2)} ₺`
                            : '-'}
                        </td>
                        <td className="text-center">
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => handleRemoveProduct(index)}
                            disabled={submitting}
                            title="Sil"
                          >
                            <i className="bi bi-trash"></i>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="table-light">
                    <tr>
                      <td colSpan="8" className="text-end fw-bold">Genel Toplam:</td>
                      <td className="text-end fw-bold text-success fs-5">
                        {addedProducts
                          .reduce((sum, p) => sum + (p.estimatedTotalPrice || 0), 0)
                          .toFixed(2)} ₺
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* ===== 4. KAYDET BUTONU ===== */}
        <div className="d-flex justify-content-end gap-2">
          <button 
            type="button" 
            className="btn btn-secondary btn-lg"
            onClick={handleCancel}
            disabled={submitting}
          >
            <i className="bi bi-x-circle me-2"></i>
            İptal
          </button>
          <button 
            type="submit" 
            className="btn btn-primary btn-lg"
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
                {isEdit ? 'Değişiklikleri Kaydet' : 'Talebi Oluştur'}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PurchaseRequestFormPage;