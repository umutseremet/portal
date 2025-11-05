// src/frontend/src/pages/ItemDetailPage.js

import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

// ✅ API_BASE_URL'den /api kısmını kaldırıyoruz çünkü imageUrl direkt /Uploads ile başlıyor
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL 
  ? process.env.REACT_APP_API_BASE_URL.replace('/api', '') 
  : 'http://localhost:5154';

const ItemDetailPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const item = location.state?.item;
  const itemGroups = location.state?.itemGroups || [];

  if (!item) {
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

  const getGroupName = (groupId) => {
    const group = itemGroups?.find(g => g.id === groupId);
    return group?.name || 'Bilinmiyor';
  };

  const handleBack = () => {
    navigate('/definitions/items');
  };

  const handleEdit = () => {
    navigate('/definitions/items/edit', { state: { item, itemGroups } });
  };

  const handleDelete = () => {
    if (window.confirm(`${item.code} - ${item.name} ürününü silmek istediğinizden emin misiniz?`)) {
      console.log('Delete item:', item.id);
      navigate('/definitions/items');
    }
  };

  return (
    <div className="container-fluid py-4">
      {/* Header */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="d-flex justify-content-between align-items-center">
            <div className="d-flex align-items-center">
              <button 
                className="btn btn-outline-secondary me-3"
                onClick={handleBack}
              >
                <i className="bi bi-arrow-left me-2"></i>
                Geri
              </button>
              <div>
                <h2 className="mb-1">
                  <i className="bi bi-box me-2"></i>
                  {item.code}
                </h2>
                <p className="text-muted mb-0">{item.name}</p>
              </div>
            </div>
            <div className="d-flex gap-2">
              <button 
                className="btn btn-primary"
                onClick={handleEdit}
              >
                <i className="bi bi-pencil me-2"></i>
                Düzenle
              </button>
              <button 
                className="btn btn-outline-danger"
                onClick={handleDelete}
              >
                <i className="bi bi-trash me-2"></i>
                Sil
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="row">
        {/* Resim Bölümü */}
        {item.imageUrl && (
          <div className="col-12 mb-4">
            <div className="card">
              <div className="card-header bg-light">
                <h5 className="card-title mb-0">
                  <i className="bi bi-image me-2"></i>
                  Ürün Resmi
                </h5>
              </div>
              <div className="card-body text-center">
                <img 
                  src={`${API_BASE_URL}${item.imageUrl}`}
                  alt={item.name}
                  className="img-thumbnail"
                  style={{ 
                    maxWidth: '500px', 
                    maxHeight: '500px',
                    objectFit: 'contain',
                    border: '2px solid #dee2e6',
                    borderRadius: '8px'
                  }}
                  onError={(e) => { 
                    e.target.style.display = 'none';
                    const parent = e.target.parentElement;
                    if (parent) {
                      parent.innerHTML = '<p class="text-muted">Resim yüklenemedi</p>';
                    }
                  }}
                />
              </div>
            </div>
          </div>
        )}

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
                <div className="col-6">
                  <small className="text-muted d-block mb-1">Numara</small>
                  <strong>{item.number}</strong>
                </div>
                <div className="col-6">
                  <small className="text-muted d-block mb-1">Kod</small>
                  <span className="badge bg-light text-dark">{item.code}</span>
                </div>
                <div className="col-12">
                  <small className="text-muted d-block mb-1">İsim</small>
                  <strong>{item.name}</strong>
                </div>
                <div className="col-6">
                  <small className="text-muted d-block mb-1">Doküman No</small>
                  <div>{item.docNumber || '-'}</div>
                </div>
                <div className="col-6">
                  <small className="text-muted d-block mb-1">Grup</small>
                  <span className="badge bg-info text-dark">{getGroupName(item.groupId)}</span>
                </div>
                <div className="col-6">
                  <small className="text-muted d-block mb-1">Durum</small>
                  {item.cancelled ? (
                    <span className="badge bg-danger">İptal Edilmiş</span>
                  ) : (
                    <span className="badge bg-success">Aktif</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Boyutlar ve Tedarikçi Bilgileri */}
        <div className="col-md-6 mb-4">
          <div className="card h-100">
            <div className="card-header bg-light">
              <h5 className="card-title mb-0">
                <i className="bi bi-rulers me-2"></i>
                Boyutlar
              </h5>
            </div>
            <div className="card-body">
              <div className="row g-3 mb-4">
                <div className="col-4">
                  <small className="text-muted d-block mb-1">X</small>
                  <strong>{item.x || '-'}</strong>
                </div>
                <div className="col-4">
                  <small className="text-muted d-block mb-1">Y</small>
                  <strong>{item.y || '-'}</strong>
                </div>
                <div className="col-4">
                  <small className="text-muted d-block mb-1">Z</small>
                  <strong>{item.z || '-'}</strong>
                </div>
              </div>

              <hr />

              <h6 className="text-muted mb-3">
                <i className="bi bi-truck me-2"></i>
                Tedarikçi Bilgileri
              </h6>
              <div className="row g-3">
                <div className="col-12">
                  <small className="text-muted d-block mb-1">Tedarikçi</small>
                  <div>{item.supplier || '-'}</div>
                </div>
                <div className="col-6">
                  <small className="text-muted d-block mb-1">Tedarikçi Kodu</small>
                  <div>{item.supplierCode || '-'}</div>
                </div>
                <div className="col-6">
                  <small className="text-muted d-block mb-1">Fiyat</small>
                  <div>
                    {item.price ? (
                      <strong className="text-success">
                        {item.price.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
                      </strong>
                    ) : '-'}
                  </div>
                </div>
                <div className="col-6">
                  <small className="text-muted d-block mb-1">Birim</small>
                  <div>{item.unit || '-'}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tarih Bilgileri */}
        <div className="col-12">
          <div className="card">
            <div className="card-header bg-light">
              <h5 className="card-title mb-0">
                <i className="bi bi-calendar-event me-2"></i>
                Tarih Bilgileri
              </h5>
            </div>
            <div className="card-body">
              <div className="row g-3">
                <div className="col-md-6">
                  <small className="text-muted d-block mb-1">Oluşturma Tarihi</small>
                  <div>
                    {item.createdAt ? (
                      <>
                        <i className="bi bi-calendar-plus me-2 text-muted"></i>
                        {new Date(item.createdAt).toLocaleString('tr-TR')}
                      </>
                    ) : '-'}
                  </div>
                </div>
                <div className="col-md-6">
                  <small className="text-muted d-block mb-1">Güncelleme Tarihi</small>
                  <div>
                    {item.updatedAt ? (
                      <>
                        <i className="bi bi-calendar-check me-2 text-muted"></i>
                        {new Date(item.updatedAt).toLocaleString('tr-TR')}
                      </>
                    ) : '-'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ItemDetailPage;