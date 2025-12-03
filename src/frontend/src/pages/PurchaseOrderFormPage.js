// src/frontend/src/pages/PurchaseOrderFormPage.js
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import apiService from '../services/api';

const PurchaseOrderFormPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isEdit = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [approvedRequests, setApprovedRequests] = useState([]);
  const [selectedRequests, setSelectedRequests] = useState([]);

  const [formData, setFormData] = useState({
    supplierName: '',
    supplierContactPerson: '',
    supplierEmail: '',
    supplierPhone: '',
    supplierAddress: '',
    deliveryDate: '',
    vatRate: 20,
    notes: ''
  });

  useEffect(() => {
    if (!isEdit) {
      loadApprovedRequests();
    } else {
      loadOrder();
    }
  }, [id]);

  const loadApprovedRequests = async () => {
    try {
      setLoading(true);
      const response = await apiService.getPurchaseRequests({ 
        status: 'Approved', 
        pageSize: 100 
      });
      setApprovedRequests(response.items || []);
    } catch (error) {
      console.error('Error loading requests:', error);
      alert('Onaylanmış talepler yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const loadOrder = async () => {
    try {
      setLoading(true);
      const response = await apiService.getPurchaseOrder(id);
      setFormData({
        supplierName: response.supplierName || '',
        supplierContactPerson: response.supplierContactPerson || '',
        supplierEmail: response.supplierEmail || '',
        supplierPhone: response.supplierPhone || '',
        supplierAddress: response.supplierAddress || '',
        deliveryDate: response.deliveryDate ? response.deliveryDate.split('T')[0] : '',
        vatRate: response.vatRate || 20,
        notes: response.notes || ''
      });
    } catch (error) {
      console.error('Error loading order:', error);
      alert('Sipariş yüklenirken hata oluştu');
      navigate('/purchase-orders');
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

  const handleRequestSelect = (requestId) => {
    setSelectedRequests(prev =>
      prev.includes(requestId) 
        ? prev.filter(id => id !== requestId) 
        : [...prev, requestId]
    );
  };

  const handleSelectAll = () => {
    if (selectedRequests.length === approvedRequests.length) {
      setSelectedRequests([]);
    } else {
      setSelectedRequests(approvedRequests.map(r => r.id));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isEdit && selectedRequests.length === 0) {
      alert('En az bir talep seçmelisiniz');
      return;
    }

    if (!formData.supplierName || !formData.deliveryDate) {
      alert('Tedarikçi adı ve teslim tarihi zorunludur');
      return;
    }

    try {
      setSubmitting(true);

      if (isEdit) {
        await apiService.updatePurchaseOrder(id, formData);
        alert('Sipariş başarıyla güncellendi');
      } else {
        await apiService.createPurchaseOrderFromRequests({
          ...formData,
          requestIds: selectedRequests
        });
        alert('Sipariş başarıyla oluşturuldu');
      }

      navigate('/purchase-orders');
    } catch (error) {
      console.error('Error saving order:', error);
      alert('Hata: ' + (error.response?.data?.message || error.message));
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (selectedRequests.length > 0 || formData.supplierName) {
      if (!window.confirm('Kaydedilmemiş değişiklikler var. Çıkmak istediğinizden emin misiniz?')) {
        return;
      }
    }
    navigate('/purchase-orders');
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
                    <i className="bi bi-receipt text-primary me-2"></i>
                    {isEdit ? 'Sipariş Düzenle' : 'Yeni Sipariş Oluştur'}
                  </h2>
                  <p className="text-muted mb-0">
                    {isEdit 
                      ? 'Mevcut siparişi düzenleyin' 
                      : 'Onaylanmış taleplerden sipariş oluşturun'}
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
            <div className="card shadow-sm">
              <div className="card-header bg-light">
                <h5 className="mb-0">
                  <i className="bi bi-building me-2"></i>
                  Tedarikçi Bilgileri
                </h5>
              </div>
              <div className="card-body">
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label">
                      Tedarikçi Adı <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      name="supplierName"
                      value={formData.supplierName}
                      onChange={handleInputChange}
                      disabled={submitting}
                      required
                      placeholder="Tedarikçi firma adı"
                    />
                  </div>

                  <div className="col-md-6 mb-3">
                    <label className="form-label">İletişim Kişisi</label>
                    <input
                      type="text"
                      className="form-control"
                      name="supplierContactPerson"
                      value={formData.supplierContactPerson}
                      onChange={handleInputChange}
                      disabled={submitting}
                      placeholder="İsim Soyisim"
                    />
                  </div>

                  <div className="col-md-6 mb-3">
                    <label className="form-label">E-posta</label>
                    <input
                      type="email"
                      className="form-control"
                      name="supplierEmail"
                      value={formData.supplierEmail}
                      onChange={handleInputChange}
                      disabled={submitting}
                      placeholder="email@example.com"
                    />
                  </div>

                  <div className="col-md-6 mb-3">
                    <label className="form-label">Telefon</label>
                    <input
                      type="tel"
                      className="form-control"
                      name="supplierPhone"
                      value={formData.supplierPhone}
                      onChange={handleInputChange}
                      disabled={submitting}
                      placeholder="0555 123 45 67"
                    />
                  </div>

                  <div className="col-md-6 mb-3">
                    <label className="form-label">
                      Teslim Tarihi <span className="text-danger">*</span>
                    </label>
                    <input
                      type="date"
                      className="form-control"
                      name="deliveryDate"
                      value={formData.deliveryDate}
                      onChange={handleInputChange}
                      disabled={submitting}
                      required
                    />
                  </div>

                  <div className="col-md-6 mb-3">
                    <label className="form-label">KDV Oranı (%)</label>
                    <input
                      type="number"
                      className="form-control"
                      name="vatRate"
                      value={formData.vatRate}
                      onChange={handleInputChange}
                      disabled={submitting}
                      min="0"
                      max="100"
                      step="1"
                    />
                  </div>

                  <div className="col-12 mb-3">
                    <label className="form-label">Adres</label>
                    <textarea
                      className="form-control"
                      name="supplierAddress"
                      rows="2"
                      value={formData.supplierAddress}
                      onChange={handleInputChange}
                      disabled={submitting}
                      placeholder="Tedarikçi adresi"
                    />
                  </div>

                  <div className="col-12 mb-3">
                    <label className="form-label">Notlar</label>
                    <textarea
                      className="form-control"
                      name="notes"
                      rows="3"
                      value={formData.notes}
                      onChange={handleInputChange}
                      disabled={submitting}
                      placeholder="Sipariş ile ilgili notlar..."
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Approved Requests */}
          {!isEdit && (
            <div className="col-lg-4 mb-4">
              <div className="card shadow-sm sticky-top" style={{ top: '20px' }}>
                <div className="card-header bg-light">
                  <div className="d-flex justify-content-between align-items-center">
                    <h5 className="mb-0">
                      <i className="bi bi-check2-square me-2"></i>
                      Onaylanmış Talepler
                    </h5>
                    {approvedRequests.length > 0 && (
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-primary"
                        onClick={handleSelectAll}
                      >
                        {selectedRequests.length === approvedRequests.length ? 'Hiçbiri' : 'Tümü'}
                      </button>
                    )}
                  </div>
                </div>
                <div className="card-body" style={{ maxHeight: '500px', overflowY: 'auto' }}>
                  {approvedRequests.length === 0 ? (
                    <div className="text-center py-5 text-muted">
                      <i className="bi bi-inbox fs-1 d-block mb-2"></i>
                      <p className="mb-0">Onaylanmış talep bulunamadı</p>
                    </div>
                  ) : (
                    <div className="list-group list-group-flush">
                      {approvedRequests.map(request => (
                        <div key={request.id} className="list-group-item px-0 border-bottom">
                          <div className="form-check">
                            <input
                              className="form-check-input"
                              type="checkbox"
                              id={`request-${request.id}`}
                              checked={selectedRequests.includes(request.id)}
                              onChange={() => handleRequestSelect(request.id)}
                              disabled={submitting}
                            />
                            <label 
                              className="form-check-label w-100" 
                              htmlFor={`request-${request.id}`}
                              style={{ cursor: 'pointer' }}
                            >
                              <div>
                                <strong className="d-block">
                                  <code className="text-primary">{request.requestNumber}</code>
                                </strong>
                                <small className="text-muted d-block mt-1">
                                  {request.userName}
                                </small>
                                <small className="text-muted d-block">
                                  {request.departmentName || 'Departman belirtilmemiş'}
                                </small>
                                {request.description && (
                                  <small className="text-muted d-block mt-1">
                                    <i className="bi bi-chat-square-text me-1"></i>
                                    {request.description.length > 50 
                                      ? request.description.substring(0, 50) + '...' 
                                      : request.description}
                                  </small>
                                )}
                              </div>
                            </label>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="card-footer bg-light">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <small className="text-muted">Seçili Talepler:</small>
                    <strong className="text-primary">{selectedRequests.length}</strong>
                  </div>
                  <button
                    type="submit"
                    className="btn btn-success w-100"
                    disabled={submitting || selectedRequests.length === 0}
                  >
                    {submitting ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                        Oluşturuluyor...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-check-lg me-2"></i>
                        Sipariş Oluştur
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Edit Mode - Submit Button */}
          {isEdit && (
            <div className="col-12">
              <div className="card shadow-sm">
                <div className="card-body">
                  <div className="d-flex justify-content-end gap-2">
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={handleCancel}
                      disabled={submitting}
                    >
                      İptal
                    </button>
                    <button
                      type="submit"
                      className="btn btn-success"
                      disabled={submitting}
                    >
                      {submitting ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                          Güncelleniyor...
                        </>
                      ) : (
                        <>
                          <i className="bi bi-check-lg me-2"></i>
                          Güncelle
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </form>
    </div>
  );
};

export default PurchaseOrderFormPage;