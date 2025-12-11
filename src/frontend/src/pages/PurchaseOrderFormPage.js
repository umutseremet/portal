// src/frontend/src/pages/PurchaseOrderFormPage.js
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../services/api';

const PurchaseOrderFormPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [approvedRequests, setApprovedRequests] = useState([]);
  const [items, setItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  // Sipariş genel bilgileri
  const [orderData, setOrderData] = useState({
    supplierName: '',
    supplierCode: '',
    supplierContact: '',
    supplierPhone: '',
    supplierEmail: '',
    supplierAddress: '',
    deliveryAddress: '',
    requestedDeliveryDate: '',
    approvedDeliveryDate: '',
    paymentTerms: '',
    notes: ''
  });

  // Manuel ürün ekleme formu
  const [productForm, setProductForm] = useState({
    itemId: '',
    itemCode: '',
    itemName: '',
    orderedQuantity: '',
    unit: '',
    unitPrice: '',
    description: '',
    itemGroupName: ''
  });

  // Eklenen ürünler (manuel + taleplerden)
  const [selectedRequestDetails, setSelectedRequestDetails] = useState([]);

  // Load items ve approved requests
  useEffect(() => {
    loadData();
  }, []);

  // Load existing order if edit mode
  useEffect(() => {
    if (isEdit) {
      loadOrder();
    }
  }, [id, isEdit]);

  // Filter items when search term changes
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredItems(items.slice(0, 50));
    } else {
      const filtered = items.filter(item => 
        item.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.docNumber?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredItems(filtered.slice(0, 50));
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

  const loadData = async () => {
    try {
      console.log('📦 Loading items and approved requests...');
      
      // Ürünleri yükle
      const itemsResponse = await api.getItems({ 
        pageSize: 1000, 
        includeCancelled: false 
      });
      
      const itemsData = itemsResponse.items || itemsResponse.data?.items || itemsResponse.data || [];
      console.log('✅ Items loaded:', itemsData.length);
      setItems(itemsData);
      setFilteredItems(itemsData.slice(0, 50));

      // Onaylanmış talepleri yükle - TÜM ONAY AŞAMALARINDAKİ TALEPLERİ DAHİL ET
      console.log('📦 Fetching purchase requests (all approval stages)...');
      
      // Tüm talepleri çek - ✅ includeDetails=true parametresi ekle
      const allRequestsResponse = await api.getPurchaseRequests({ 
        includeDetails: true 
      });
      console.log('📦 Full API Response:', allRequestsResponse);
      
      const allRequests = allRequestsResponse.items
                 || allRequestsResponse.data?.items 
                 || allRequestsResponse.data?.requests 
                 || allRequestsResponse.data 
                 || [];
                 
      console.log('📊 Total requests:', allRequests.length);
      
      // Frontend'de filtrele - Yönetici Onayından sonraki tüm statüler
      const requestsData = allRequests.filter(r => 
        r.status === 'Approved' || 
        r.status === 'ManagerApproval' || 
        r.status === 'PurchasingReview'
      );
      
      console.log('✅ Filtered Requests (ManagerApproval, PurchasingReview, Approved):', requestsData.length);
      console.log('📋 Requests by status:');
      const statusGroups = {};
      requestsData.forEach(req => {
        statusGroups[req.status] = (statusGroups[req.status] || 0) + 1;
      });
      console.table(statusGroups);
      
      // Her bir talebin bilgilerini logla
      if (requestsData.length > 0) {
        console.log('📋 Available requests:');
        requestsData.forEach((req, index) => {
          console.log(`  ${index + 1}. ${req.requestNumber} - ${req.status} - ${req.requesterName || req.userName}`);
        });
      } else {
        console.warn('⚠️ No requests found in approval stages!');
      }
      
      setApprovedRequests(requestsData);
      console.log('✅ Set', requestsData.length, 'requests to state');
      
      // ✅ EKLEME: Her talebin detaylarını da logla
      requestsData.forEach(req => {
        console.log(`📋 Request ${req.requestNumber}:`, {
          id: req.id,
          status: req.status,
          detailCount: req.details?.length || 0,
          details: req.details
        });
      });
      
    } catch (error) {
      console.error('❌ Veri yükleme hatası:', error);
      console.error('❌ Error details:', error.response?.data);
      alert('Veriler yüklenirken bir hata oluştu: ' + (error.message || 'Bilinmeyen hata'));
    }
  };

  const loadOrder = async () => {
    setLoading(true);
    try {
      const response = await api.getPurchaseOrder(id);
      const order = response.data;
      
      setOrderData({
        supplierName: order.supplierName || '',
        supplierCode: order.supplierCode || '',
        supplierContact: order.supplierContact || '',
        supplierPhone: order.supplierPhone || '',
        supplierEmail: order.supplierEmail || '',
        supplierAddress: order.supplierAddress || '',
        deliveryAddress: order.deliveryAddress || '',
        requestedDeliveryDate: order.requestedDeliveryDate || '',
        approvedDeliveryDate: order.approvedDeliveryDate || '',
        paymentTerms: order.paymentTerms || '',
        notes: order.notes || ''
      });

      if (order.details && order.details.length > 0) {
        setSelectedRequestDetails(order.details);
      }
    } catch (error) {
      console.error('Sipariş yüklenirken hata:', error);
      alert('Sipariş bilgileri yüklenemedi.');
      navigate('/purchase-orders');
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

  // Manuel ürün ekleme
  const handleAddProduct = () => {
    if (!productForm.itemId || !productForm.orderedQuantity) {
      alert('Lütfen ürün ve miktar giriniz.');
      return;
    }

    const newProduct = {
      itemId: productForm.itemId,
      itemCode: productForm.itemCode,
      itemName: productForm.itemName,
      itemGroupName: productForm.itemGroupName,
      orderedQuantity: parseFloat(productForm.orderedQuantity),
      unit: productForm.unit,
      unitPrice: productForm.unitPrice ? parseFloat(productForm.unitPrice) : 0,
      description: productForm.description,
      requestDetailId: null,
      requestNumber: 'Manuel'
    };

    setSelectedRequestDetails(prev => [...prev, newProduct]);
    
    // Reset form
    setProductForm({
      itemId: '',
      itemCode: '',
      itemName: '',
      orderedQuantity: '',
      unit: '',
      unitPrice: '',
      description: '',
      itemGroupName: ''
    });
    setSearchTerm('');
  };

  // Talepten ürün ekleme - ✅ DÜZELTİLMİŞ
  const handleSelectRequest = (requestId) => {
    if (!requestId) return;

    console.log('🔍 handleSelectRequest called with requestId:', requestId);
    const request = approvedRequests.find(r => r.id === parseInt(requestId));
    console.log('📋 Found request:', request);
    
    if (request && request.details) {
      console.log('📦 Request has', request.details.length, 'details');
      
      const newDetails = request.details.map(detail => {
        console.log('🔧 Mapping detail:', detail);
        return {
          requestDetailId: detail.id,
          requestId: request.id,
          requestNumber: request.requestNumber,
          itemId: detail.itemId,
          itemCode: detail.itemCode,
          itemName: detail.itemName,
          itemGroupName: detail.itemGroupName || '', // ✅ EKLEME
          orderedQuantity: detail.quantity, // ✅ API'ye gönderilecek alan
          unit: detail.unit,
          unitPrice: detail.estimatedUnitPrice || 0,
          description: detail.description || ''
        };
      });
      
      console.log('✅ Mapped details:', newDetails);
      setSelectedRequestDetails(prev => {
        const updated = [...prev, ...newDetails];
        console.log('📊 Updated selectedRequestDetails:', updated);
        return updated;
      });
    } else {
      console.warn('⚠️ Request or details not found!');
    }
  };

  const handleRemoveDetail = (index) => {
    setSelectedRequestDetails(prev => prev.filter((_, i) => i !== index));
  };

  const handleDetailChange = (index, field, value) => {
    setSelectedRequestDetails(prev => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        [field]: field === 'orderedQuantity' || field === 'unitPrice' 
          ? parseFloat(value) || 0 
          : value
      };
      return updated;
    });
  };

  const calculateTotal = () => {
    return selectedRequestDetails.reduce((sum, detail) => {
      return sum + (detail.orderedQuantity * detail.unitPrice);
    }, 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!orderData.supplierName) {
      alert('Lütfen tedarikçi adı giriniz.');
      return;
    }

    if (selectedRequestDetails.length === 0) {
      alert('Lütfen en az bir ürün ekleyiniz.');
      return;
    }

    setSubmitting(true);
    try {
      const requestData = {
        ...orderData,
        details: selectedRequestDetails.map(detail => ({
          itemId: detail.itemId,
          orderedQuantity: detail.orderedQuantity,
          unit: detail.unit,
          unitPrice: detail.unitPrice,
          description: detail.description,
          requestDetailId: detail.requestDetailId || null
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
              {isEdit ? 'Sipariş Düzenle' : 'Yeni Satınalma Siparişi'}
            </h2>
            <p className="text-muted mb-0">
              {isEdit ? 'Mevcut siparişi düzenleyin' : 'Manuel ürün ekleyin veya onaylanmış taleplerden sipariş oluşturun'}
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
          <div className="card-header" style={{ 
            backgroundColor: '#f8f9fa', 
            color: '#333',
            fontWeight: '500',
            border: 'none'
          }}>
            <h5 className="mb-0">
              <i className="bi bi-building me-2"></i>
              Tedarikçi Bilgileri
            </h5>
          </div>
          <div className="card-body bg-light">
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
                  placeholder="Telefon"
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
                  placeholder="E-posta"
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
          <div className="card-header" style={{ 
            backgroundColor: '#f8f9fa', 
            color: '#333',
            fontWeight: '500',
            border: 'none'
          }}>
            <h5 className="mb-0">
              <i className="bi bi-clipboard-check me-2"></i>
              Sipariş Bilgileri
            </h5>
          </div>
          <div className="card-body bg-light">
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
                  name="approvedDeliveryDate"
                  value={orderData.approvedDeliveryDate}
                  onChange={handleOrderDataChange}
                  disabled={submitting}
                />
              </div>

              <div className="col-md-4 mb-3">
                <label className="form-label fw-bold">Ödeme Şartları</label>
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

              <div className="col-md-12 mb-3">
                <label className="form-label fw-bold">Notlar</label>
                <textarea
                  className="form-control"
                  name="notes"
                  value={orderData.notes}
                  onChange={handleOrderDataChange}
                  rows="2"
                  placeholder="Sipariş notları"
                  disabled={submitting}
                />
              </div>
            </div>
          </div>
        </div>

        {/* ===== 3A. TALEPTEN ÜRÜN EKLE ===== */}
        {!isEdit && approvedRequests.length > 0 && (
          <div className="card shadow-sm mb-4">
            <div className="card-header" style={{ 
              backgroundColor: '#f8f9fa', 
              color: '#333',
              fontWeight: '500',
              border: 'none'
            }}>
              <h5 className="mb-0">
                <i className="bi bi-file-earmark-check me-2"></i>
                Onaylanmış Talepten Ürün Ekle
              </h5>
            </div>
            <div className="card-body bg-light">
              <div className="row">
                <div className="col-md-12 mb-3">
                  <label className="form-label fw-bold">Onaylanmış Talep Seçiniz</label>
                  <select
                    className="form-select"
                    onChange={(e) => {
                      console.log('📝 Dropdown changed, value:', e.target.value);
                      handleSelectRequest(e.target.value);
                      e.target.value = ''; // ✅ Seçimden sonra reset
                    }}
                    disabled={submitting}
                    value="" // ✅ Kontrollü component
                  >
                    <option value="">Talep Seçiniz</option>
                    {approvedRequests.map(request => (
                      <option key={request.id} value={request.id}>
                        {request.requestNumber} - {request.requesterName || request.userName} 
                        {request.details && ` (${request.details.length} ürün)`}
                      </option>
                    ))}
                  </select>
                  <small className="text-muted">
                    Seçilen talebin tüm ürünleri otomatik olarak eklenecektir
                  </small>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Talep bulunamadı mesajı */}
        {!isEdit && approvedRequests.length === 0 && (
          <div className="card shadow-sm mb-4">
            <div className="card-header" style={{ 
              backgroundColor: '#f8f9fa', 
              color: '#333',
              fontWeight: '500',
              border: 'none'
            }}>
              <h5 className="mb-0">
                <i className="bi bi-file-earmark-check me-2"></i>
                Onaylanmış Talepten Ürün Ekle
              </h5>
            </div>
            <div className="card-body bg-light text-center py-4">
              <i className="bi bi-info-circle text-muted" style={{ fontSize: '3rem' }}></i>
              <p className="text-muted mt-3 mb-0">
                Şu anda onaylanmış talep bulunmamaktadır.
                <br />
                Manuel ürün ekleyerek sipariş oluşturabilirsiniz.
              </p>
            </div>
          </div>
        )}

        {/* ===== 3B. MANUEL ÜRÜN EKLEME ===== */}
        <div className="card shadow-sm mb-4">
          <div className="card-header" style={{ 
            backgroundColor: '#f8f9fa', 
            color: '#333',
            fontWeight: '500',
            border: 'none'
          }}>
            <h5 className="mb-0">
              <i className="bi bi-plus-circle me-2"></i>
              Manuel Ürün Ekle
            </h5>
          </div>
          <div className="card-body bg-light">
            <div className="row">
              {/* Ürün Seçimi - Arama Özellikli Dropdown */}
              <div className="col-md-4 mb-3">
                <label className="form-label fw-bold">Ürün Ara ve Seç</label>
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
                              className="p-2 border-bottom cursor-pointer"
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
                              </div>
                            </div>
                          ))}
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Miktar */}
              <div className="col-md-2 mb-3">
                <label className="form-label fw-bold">Miktar</label>
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
                  placeholder="Adet, Kg"
                  disabled={submitting}
                />
              </div>

              {/* Birim Fiyat */}
              <div className="col-md-2 mb-3">
                <label className="form-label fw-bold">Birim Fiyat</label>
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

              {/* Açıklama */}
              <div className="col-md-2 mb-3">
                <label className="form-label fw-bold">Açıklama</label>
                <input
                  type="text"
                  className="form-control"
                  name="description"
                  value={productForm.description}
                  onChange={handleProductFormChange}
                  placeholder="Açıklama"
                  disabled={submitting}
                />
              </div>

              {/* Ekle Butonu */}
              <div className="col-md-12">
                <button
                  type="button"
                  className="btn"
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

        {/* ===== 4. SİPARİŞ DETAYLARI ===== */}
        <div className="card shadow-sm mb-4">
          <div className="card-header" style={{ 
            backgroundColor: '#f8f9fa', 
            color: '#333',
            fontWeight: '500',
            border: 'none'
          }}>
            <h5 className="mb-0">
              <i className="bi bi-list-check me-2"></i>
              Sipariş Kalemleri ({selectedRequestDetails.length})
            </h5>
          </div>
          <div className="card-body p-0">
            {selectedRequestDetails.length === 0 ? (
              <div className="text-center py-5">
                <i className="bi bi-inbox" style={{ fontSize: '3rem', color: '#ccc' }}></i>
                <p className="text-muted mt-3">Henüz ürün eklenmedi</p>
                <p className="text-muted small">Manuel ürün ekleyin veya onaylanmış talepten seçim yapın</p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead className="table-light">
                    <tr>
                      <th style={{ width: '5%' }}>#</th>
                      <th style={{ width: '15%' }}>Ürün Kodu</th>
                      <th style={{ width: '20%' }}>Ürün Adı</th>
                      <th style={{ width: '10%' }}>Miktar</th>
                      <th style={{ width: '8%' }}>Birim</th>
                      <th style={{ width: '12%' }}>Birim Fiyat</th>
                      <th style={{ width: '12%' }}>Toplam</th>
                      <th style={{ width: '10%' }}>Talep No</th>
                      <th style={{ width: '8%' }} className="text-center">İşlem</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedRequestDetails.map((detail, index) => (
                      <tr key={index}>
                        <td>{index + 1}</td>
                        <td>
                          <span className="badge bg-secondary">{detail.itemCode}</span>
                        </td>
                        <td>
                          <div>{detail.itemName}</div>
                          {detail.itemGroupName && (
                            <small className="text-muted">{detail.itemGroupName}</small>
                          )}
                        </td>
                        <td>
                          <input
                            type="number"
                            className="form-control form-control-sm"
                            value={detail.orderedQuantity}
                            onChange={(e) => handleDetailChange(index, 'orderedQuantity', e.target.value)}
                            step="0.01"
                            min="0"
                            disabled={submitting}
                          />
                        </td>
                        <td>{detail.unit}</td>
                        <td>
                          <input
                            type="number"
                            className="form-control form-control-sm"
                            value={detail.unitPrice}
                            onChange={(e) => handleDetailChange(index, 'unitPrice', e.target.value)}
                            step="0.01"
                            min="0"
                            disabled={submitting}
                          />
                        </td>
                        <td className="fw-bold">
                          {(detail.orderedQuantity * detail.unitPrice).toLocaleString('tr-TR', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                          })} ₺
                        </td>
                        <td>
                          {detail.requestNumber ? (
                            <span className="badge bg-info">{detail.requestNumber}</span>
                          ) : (
                            <span className="badge bg-secondary">Manuel</span>
                          )}
                        </td>
                        <td className="text-center">
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => handleRemoveDetail(index)}
                            disabled={submitting}
                          >
                            <i className="bi bi-trash"></i>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="table-light">
                    <tr>
                      <td colSpan="6" className="text-end fw-bold">Genel Toplam:</td>
                      <td className="fw-bold text-primary" style={{ fontSize: '1.1rem' }}>
                        {calculateTotal().toLocaleString('tr-TR', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2
                        })} ₺
                      </td>
                      <td colSpan="2"></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* ===== 5. FORM BUTONLARI ===== */}
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
            disabled={submitting || selectedRequestDetails.length === 0}
          >
            {submitting ? (
              <>
                <span className="spinner-border spinner-border-sm me-2"></span>
                Kaydediliyor...
              </>
            ) : (
              <>
                <i className="bi bi-check-circle me-2"></i>
                {isEdit ? 'Güncelle' : 'Siparişi Oluştur'}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PurchaseOrderFormPage;