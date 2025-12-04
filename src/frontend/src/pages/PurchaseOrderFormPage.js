// src/frontend/src/pages/PurchaseOrderFormPage.js
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../services/api';

const PurchaseOrderFormPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;

  // State
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [approvedRequests, setApprovedRequests] = useState([]);
  const [items, setItems] = useState([]);

  // Sipariş bilgileri
  const [orderData, setOrderData] = useState({
    supplierCode: '',
    supplierName: '',
    supplierContact: '',
    supplierPhone: '',
    supplierEmail: '',
    supplierAddress: '',
    deliveryAddress: '',
    requestedDeliveryDate: '',
    confirmedDeliveryDate: '',
    description: '',
    paymentTerms: '',
    deliveryTerms: '',
    currency: 'TRY',
    vatRate: 20
  });

  // Ürün ekleme formu
  const [productForm, setProductForm] = useState({
    itemId: '',
    itemCode: '',
    itemName: '',
    itemGroupId: '',
    itemGroupName: '',
    orderedQuantity: '',
    unit: '',
    unitPrice: '',
    totalPrice: '',
    currency: 'TRY',
    vatRate: 20,
    description: '',
    requestDetailId: ''
  });

  // Eklenen ürünler listesi
  const [addedProducts, setAddedProducts] = useState([]);

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Onaylanmış talepleri yükle
      const requestsResponse = await api.getPurchaseRequests({
        status: 'Approved'
      });
      setApprovedRequests(requestsResponse.data || []);

      // Ürünleri yükle
      const itemsResponse = await api.getItems();
      setItems(itemsResponse.data || []);

      // Düzenleme modundaysa, mevcut siparişi yükle
      if (isEdit) {
        const response = await api.getPurchaseOrder(id);
        const order = response.data;
        
        setOrderData({
          supplierCode: order.supplierCode || '',
          supplierName: order.supplierName || '',
          supplierContact: order.supplierContact || '',
          supplierPhone: order.supplierPhone || '',
          supplierEmail: order.supplierEmail || '',
          supplierAddress: order.supplierAddress || '',
          deliveryAddress: order.deliveryAddress || '',
          requestedDeliveryDate: order.requestedDeliveryDate?.split('T')[0] || '',
          confirmedDeliveryDate: order.confirmedDeliveryDate?.split('T')[0] || '',
          description: order.description || '',
          paymentTerms: order.paymentTerms || '',
          deliveryTerms: order.deliveryTerms || '',
          currency: order.currency || 'TRY',
          vatRate: order.vatRate || 20
        });

        setAddedProducts(order.details || []);
      }
    } catch (error) {
      console.error('Veri yükleme hatası:', error);
      alert('Veriler yüklenirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const handleOrderDataChange = (e) => {
    const { name, value } = e.target;
    setOrderData(prev => ({
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
    } else if (name === 'orderedQuantity' || name === 'unitPrice') {
      // Miktar veya birim fiyat değiştiğinde toplam fiyatı hesapla
      const qty = name === 'orderedQuantity' ? parseFloat(value) || 0 : parseFloat(productForm.orderedQuantity) || 0;
      const price = name === 'unitPrice' ? parseFloat(value) || 0 : parseFloat(productForm.unitPrice) || 0;
      
      setProductForm(prev => ({
        ...prev,
        [name]: value,
        totalPrice: qty * price
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
    if (!productForm.itemId || !productForm.orderedQuantity || !productForm.unitPrice) {
      alert('Lütfen ürün, miktar ve birim fiyat bilgilerini giriniz.');
      return;
    }

    // Ürünü listeye ekle
    const newProduct = {
      itemId: parseInt(productForm.itemId),
      itemCode: productForm.itemCode,
      itemName: productForm.itemName,
      itemGroupId: productForm.itemGroupId,
      itemGroupName: productForm.itemGroupName,
      orderedQuantity: parseFloat(productForm.orderedQuantity),
      unit: productForm.unit,
      unitPrice: parseFloat(productForm.unitPrice),
      totalPrice: parseFloat(productForm.totalPrice),
      currency: productForm.currency,
      vatRate: parseFloat(productForm.vatRate),
      description: productForm.description,
      requestDetailId: productForm.requestDetailId || null
    };

    setAddedProducts(prev => [...prev, newProduct]);

    // Formu temizle
    setProductForm({
      itemId: '',
      itemCode: '',
      itemName: '',
      itemGroupId: '',
      itemGroupName: '',
      orderedQuantity: '',
      unit: '',
      unitPrice: '',
      totalPrice: '',
      currency: 'TRY',
      vatRate: 20,
      description: '',
      requestDetailId: ''
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
        ...orderData,
        details: addedProducts.map(product => ({
          itemId: product.itemId,
          orderedQuantity: product.orderedQuantity,
          unit: product.unit,
          unitPrice: product.unitPrice,
          currency: product.currency,
          vatRate: product.vatRate,
          description: product.description,
          requestDetailId: product.requestDetailId
        }))
      };

      if (isEdit) {
        await api.updatePurchaseOrder(id, requestData);
        alert('Sipariş başarıyla güncellendi.');
      } else {
        await api.createPurchaseOrder(requestData);
        alert('Sipariş başarıyla oluşturuldu.');
      }

      navigate('/purchase-orders');
    } catch (error) {
      console.error('Kaydetme hatası:', error);
      alert(error.response?.data?.message || 'Sipariş kaydedilirken bir hata oluştu.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate('/purchase-orders');
  };

  // Toplam hesaplamaları
  const calculateSubtotal = () => {
    return addedProducts.reduce((sum, p) => sum + (p.totalPrice || 0), 0);
  };

  const calculateVAT = () => {
    return addedProducts.reduce((sum, p) => {
      const productVat = (p.totalPrice || 0) * ((p.vatRate || 0) / 100);
      return sum + productVat;
    }, 0);
  };

  const calculateGrandTotal = () => {
    return calculateSubtotal() + calculateVAT();
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
              {isEdit ? 'Sipariş Düzenle' : 'Yeni Satınalma Siparişi'}
            </h2>
            <p className="text-muted mb-0">
              {isEdit ? 'Mevcut siparişi düzenleyin' : 'Onaylanmış taleplerden sipariş oluşturun'}
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
        {/* ===== 1. TEDARİKÇİ BİLGİLERİ ===== */}
        <div className="card shadow-sm mb-4">
          <div className="card-header bg-primary text-white">
            <h5 className="mb-0">
              <i className="bi bi-building me-2"></i>
              Tedarikçi Bilgileri
            </h5>
          </div>
          <div className="card-body">
            <div className="row">
              <div className="col-md-3 mb-3">
                <label className="form-label fw-bold">
                  Tedarikçi Adı <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  className="form-control"
                  name="supplierName"
                  value={orderData.supplierName}
                  onChange={handleOrderDataChange}
                  disabled={submitting}
                  required
                  placeholder="Tedarikçi adı"
                />
              </div>

              <div className="col-md-3 mb-3">
                <label className="form-label fw-bold">Tedarikçi Kodu</label>
                <input
                  type="text"
                  className="form-control"
                  name="supplierCode"
                  value={orderData.supplierCode}
                  onChange={handleOrderDataChange}
                  disabled={submitting}
                  placeholder="Tedarikçi kodu"
                />
              </div>

              <div className="col-md-3 mb-3">
                <label className="form-label fw-bold">Yetkili Kişi</label>
                <input
                  type="text"
                  className="form-control"
                  name="supplierContact"
                  value={orderData.supplierContact}
                  onChange={handleOrderDataChange}
                  disabled={submitting}
                  placeholder="Yetkili adı"
                />
              </div>

              <div className="col-md-3 mb-3">
                <label className="form-label fw-bold">Telefon</label>
                <input
                  type="text"
                  className="form-control"
                  name="supplierPhone"
                  value={orderData.supplierPhone}
                  onChange={handleOrderDataChange}
                  disabled={submitting}
                  placeholder="+90 (___) ___ __ __"
                />
              </div>

              <div className="col-md-4 mb-3">
                <label className="form-label fw-bold">E-posta</label>
                <input
                  type="email"
                  className="form-control"
                  name="supplierEmail"
                  value={orderData.supplierEmail}
                  onChange={handleOrderDataChange}
                  disabled={submitting}
                  placeholder="tedarikci@firma.com"
                />
              </div>

              <div className="col-md-8 mb-3">
                <label className="form-label fw-bold">Tedarikçi Adresi</label>
                <textarea
                  className="form-control"
                  name="supplierAddress"
                  value={orderData.supplierAddress}
                  onChange={handleOrderDataChange}
                  rows="2"
                  placeholder="Tedarikçi adresi"
                  disabled={submitting}
                />
              </div>
            </div>
          </div>
        </div>

        {/* ===== 2. SİPARİŞ BİLGİLERİ ===== */}
        <div className="card shadow-sm mb-4">
          <div className="card-header bg-info text-white">
            <h5 className="mb-0">
              <i className="bi bi-clipboard-check me-2"></i>
              Sipariş Bilgileri
            </h5>
          </div>
          <div className="card-body">
            <div className="row">
              <div className="col-md-4 mb-3">
                <label className="form-label fw-bold">Teslimat Adresi</label>
                <textarea
                  className="form-control"
                  name="deliveryAddress"
                  value={orderData.deliveryAddress}
                  onChange={handleOrderDataChange}
                  rows="2"
                  placeholder="Teslimat adresi"
                  disabled={submitting}
                />
              </div>

              <div className="col-md-2 mb-3">
                <label className="form-label fw-bold">İstenen Teslimat</label>
                <input
                  type="date"
                  className="form-control"
                  name="requestedDeliveryDate"
                  value={orderData.requestedDeliveryDate}
                  onChange={handleOrderDataChange}
                  disabled={submitting}
                />
              </div>

              <div className="col-md-2 mb-3">
                <label className="form-label fw-bold">Onaylanan Teslimat</label>
                <input
                  type="date"
                  className="form-control"
                  name="confirmedDeliveryDate"
                  value={orderData.confirmedDeliveryDate}
                  onChange={handleOrderDataChange}
                  disabled={submitting}
                />
              </div>

              <div className="col-md-2 mb-3">
                <label className="form-label fw-bold">Para Birimi</label>
                <select
                  className="form-select"
                  name="currency"
                  value={orderData.currency}
                  onChange={handleOrderDataChange}
                  disabled={submitting}
                >
                  <option value="TRY">TRY (₺)</option>
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                </select>
              </div>

              <div className="col-md-2 mb-3">
                <label className="form-label fw-bold">KDV Oranı (%)</label>
                <input
                  type="number"
                  className="form-control"
                  name="vatRate"
                  value={orderData.vatRate}
                  onChange={handleOrderDataChange}
                  step="1"
                  min="0"
                  max="100"
                  disabled={submitting}
                />
              </div>

              <div className="col-md-6 mb-3">
                <label className="form-label fw-bold">Ödeme Koşulları</label>
                <input
                  type="text"
                  className="form-control"
                  name="paymentTerms"
                  value={orderData.paymentTerms}
                  onChange={handleOrderDataChange}
                  placeholder="Örn: 30 gün vadeli"
                  disabled={submitting}
                />
              </div>

              <div className="col-md-6 mb-3">
                <label className="form-label fw-bold">Teslimat Koşulları</label>
                <input
                  type="text"
                  className="form-control"
                  name="deliveryTerms"
                  value={orderData.deliveryTerms}
                  onChange={handleOrderDataChange}
                  placeholder="Örn: DAP, FOB"
                  disabled={submitting}
                />
              </div>

              <div className="col-md-12 mb-3">
                <label className="form-label fw-bold">Sipariş Açıklaması</label>
                <textarea
                  className="form-control"
                  name="description"
                  value={orderData.description}
                  onChange={handleOrderDataChange}
                  rows="2"
                  placeholder="İsteğe bağlı açıklama"
                  disabled={submitting}
                />
              </div>
            </div>
          </div>
        </div>

        {/* ===== 3. ÜRÜN EKLEME FORMU ===== */}
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
                  Sipariş Miktarı <span className="text-danger">*</span>
                </label>
                <input
                  type="number"
                  className="form-control"
                  name="orderedQuantity"
                  value={productForm.orderedQuantity}
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

              {/* Birim Fiyat */}
              <div className="col-md-2 mb-3">
                <label className="form-label fw-bold">
                  Birim Fiyat <span className="text-danger">*</span>
                </label>
                <input
                  type="number"
                  className="form-control"
                  name="unitPrice"
                  value={productForm.unitPrice}
                  onChange={handleProductFormChange}
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  disabled={submitting}
                />
              </div>

              {/* KDV Oranı */}
              <div className="col-md-2 mb-3">
                <label className="form-label fw-bold">KDV (%)</label>
                <input
                  type="number"
                  className="form-control"
                  name="vatRate"
                  value={productForm.vatRate}
                  onChange={handleProductFormChange}
                  step="1"
                  min="0"
                  max="100"
                  disabled={submitting}
                />
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

            {/* Toplam Fiyat (Hesaplanan) */}
            {productForm.totalPrice > 0 && (
              <div className="alert alert-info d-flex align-items-center mb-3">
                <i className="bi bi-calculator me-2 fs-4"></i>
                <div>
                  <strong>Ara Toplam:</strong> {productForm.totalPrice.toFixed(2)} {productForm.currency}
                  <span className="ms-3">
                    <strong>KDV:</strong> {(productForm.totalPrice * (productForm.vatRate / 100)).toFixed(2)} {productForm.currency}
                  </span>
                  <span className="ms-3 text-success fw-bold">
                    <strong>Genel Toplam:</strong> {(productForm.totalPrice * (1 + productForm.vatRate / 100)).toFixed(2)} {productForm.currency}
                  </span>
                </div>
              </div>
            )}

            {/* Ekle Butonu */}
            <div className="d-flex justify-content-end">
              <button
                type="button"
                className="btn btn-success btn-lg"
                onClick={handleAddProduct}
                disabled={submitting || !productForm.itemId || !productForm.orderedQuantity || !productForm.unitPrice}
              >
                <i className="bi bi-plus-circle me-2"></i>
                Ürünü Siparişe Ekle
              </button>
            </div>
          </div>
        </div>

        {/* ===== 4. EKLENEN ÜRÜNLER LİSTESİ ===== */}
        <div className="card shadow-sm mb-4">
          <div className="card-header bg-warning text-dark">
            <h5 className="mb-0">
              <i className="bi bi-cart-check me-2"></i>
              Sipariş Kalemleri ({addedProducts.length})
            </h5>
          </div>
          <div className="card-body">
            {addedProducts.length === 0 ? (
              <div className="text-center py-5 text-muted">
                <i className="bi bi-inbox fs-1 d-block mb-3"></i>
                <p className="mb-0">Henüz ürün eklenmedi. Yukarıdaki formdan ürün ekleyiniz.</p>
              </div>
            ) : (
              <>
                <div className="table-responsive">
                  <table className="table table-hover table-bordered align-middle">
                    <thead className="table-light">
                      <tr>
                        <th style={{ width: '4%' }}>#</th>
                        <th style={{ width: '10%' }}>Ürün Kodu</th>
                        <th style={{ width: '20%' }}>Ürün Adı</th>
                        <th style={{ width: '10%' }}>Grup</th>
                        <th style={{ width: '8%' }} className="text-end">Miktar</th>
                        <th style={{ width: '6%' }}>Birim</th>
                        <th style={{ width: '10%' }} className="text-end">Birim Fiyat</th>
                        <th style={{ width: '8%' }} className="text-end">KDV (%)</th>
                        <th style={{ width: '10%' }} className="text-end">Ara Toplam</th>
                        <th style={{ width: '10%' }} className="text-end">KDV Tutarı</th>
                        <th style={{ width: '10%' }} className="text-end">Toplam</th>
                        <th style={{ width: '6%' }} className="text-center">İşlem</th>
                      </tr>
                    </thead>
                    <tbody>
                      {addedProducts.map((product, index) => {
                        const subtotal = product.totalPrice || 0;
                        const vatAmount = subtotal * ((product.vatRate || 0) / 100);
                        const total = subtotal + vatAmount;
                        
                        return (
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
                            <td className="text-end fw-bold">{product.orderedQuantity}</td>
                            <td>{product.unit}</td>
                            <td className="text-end">
                              {product.unitPrice.toFixed(2)} {product.currency}
                            </td>
                            <td className="text-end">{product.vatRate}%</td>
                            <td className="text-end">{subtotal.toFixed(2)} {product.currency}</td>
                            <td className="text-end text-info">{vatAmount.toFixed(2)} {product.currency}</td>
                            <td className="text-end fw-bold text-success">{total.toFixed(2)} {product.currency}</td>
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
                        );
                      })}
                    </tbody>
                    <tfoot className="table-light">
                      <tr>
                        <td colSpan="8" className="text-end fw-bold fs-6">Ara Toplam:</td>
                        <td className="text-end fw-bold">{calculateSubtotal().toFixed(2)} TRY</td>
                        <td colSpan="3"></td>
                      </tr>
                      <tr>
                        <td colSpan="8" className="text-end fw-bold fs-6 text-info">KDV Toplamı:</td>
                        <td className="text-end fw-bold text-info">{calculateVAT().toFixed(2)} TRY</td>
                        <td colSpan="3"></td>
                      </tr>
                      <tr className="table-success">
                        <td colSpan="8" className="text-end fw-bold fs-5">Genel Toplam:</td>
                        <td className="text-end fw-bold text-success fs-5">{calculateGrandTotal().toFixed(2)} TRY</td>
                        <td colSpan="3"></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </>
            )}
          </div>
        </div>

        {/* ===== 5. KAYDET BUTONU ===== */}
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
                {isEdit ? 'Değişiklikleri Kaydet' : 'Siparişi Oluştur'}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PurchaseOrderFormPage;