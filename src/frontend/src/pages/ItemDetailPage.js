// src/frontend/src/pages/ItemDetailPage.js

import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const ItemDetailPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const item = location.state?.item;

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

  const handleBack = () => {
    navigate('/definitions/items');
  };

  const handleEdit = () => {
    navigate('/definitions/items', { state: { editItem: item } });
  };

  const handleDelete = () => {
    if (window.confirm(`${item.code} - ${item.name} ürününü silmek istediğinizden emin misiniz?`)) {
      // TODO: Delete işlemi için parent component'e callback gerekebilir
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
                <h2 className="mb-1">{item.code}</h2>
                <p className="text-muted mb-0">{item.name}</p>
              </div>
            </div>
            <div className="d-flex gap-2">
              <button 
                className="btn btn-warning"
                onClick={handleEdit}
              >
                <i className="bi bi-pencil me-2"></i>
                Düzenle
              </button>
              <button 
                className="btn btn-danger"
                onClick={handleDelete}
              >
                <i className="bi bi-trash me-2"></i>
                Sil
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="row">
        {/* Left Column - Image & Basic Info */}
        <div className="col-md-4">
          {/* Image Card */}
          {item.imageUrl && (
            <div className="card mb-3">
              <div className="card-body text-center">
                <img
                  src={item.imageUrl}
                  alt={item.name}
                  className="img-fluid rounded"
                  style={{ maxHeight: '300px' }}
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
              </div>
            </div>
          )}

          {/* Basic Info Card */}
          <div className="card">
            <div className="card-header">
              <h5 className="card-title mb-0">
                <i className="bi bi-info-circle me-2"></i>
                Temel Bilgiler
              </h5>
            </div>
            <div className="card-body">
              <div className="mb-3">
                <small className="text-muted d-block">Numara</small>
                <strong>{item.number}</strong>
              </div>
              <div className="mb-3">
                <small className="text-muted d-block">Kod</small>
                <span className="badge bg-primary">{item.code}</span>
              </div>
              <div className="mb-3">
                <small className="text-muted d-block">İsim</small>
                <strong>{item.name}</strong>
              </div>
              <div className="mb-3">
                <small className="text-muted d-block">Doküman No</small>
                <span>{item.docNumber || '-'}</span>
              </div>
              <div className="mb-3">
                <small className="text-muted d-block">Grup</small>
                <span className="badge bg-info">{item.groupName || 'Belirtilmemiş'}</span>
              </div>
              {item.cancelled && (
                <div className="mb-3">
                  <span className="badge bg-danger">
                    <i className="bi bi-x-circle me-1"></i>
                    İptal Edilmiş
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Details */}
        <div className="col-md-8">
          {/* Dimensions Card */}
          <div className="card mb-3">
            <div className="card-header">
              <h5 className="card-title mb-0">
                <i className="bi bi-box me-2"></i>
                Boyutlar
              </h5>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-md-4">
                  <div className="mb-3">
                    <small className="text-muted d-block">X</small>
                    <strong className="fs-4">{item.x || '-'}</strong>
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="mb-3">
                    <small className="text-muted d-block">Y</small>
                    <strong className="fs-4">{item.y || '-'}</strong>
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="mb-3">
                    <small className="text-muted d-block">Z</small>
                    <strong className="fs-4">{item.z || '-'}</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Supplier Info Card */}
          <div className="card mb-3">
            <div className="card-header">
              <h5 className="card-title mb-0">
                <i className="bi bi-truck me-2"></i>
                Tedarikçi Bilgileri
              </h5>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-md-6">
                  <div className="mb-3">
                    <small className="text-muted d-block">Tedarikçi</small>
                    <strong>{item.supplier || 'Belirtilmemiş'}</strong>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="mb-3">
                    <small className="text-muted d-block">Tedarikçi Kodu</small>
                    <strong>{item.supplierCode || 'Belirtilmemiş'}</strong>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="mb-3">
                    <small className="text-muted d-block">Fiyat</small>
                    <strong className="text-success">
                      {item.price ? `₺${item.price.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}` : '-'}
                    </strong>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="mb-3">
                    <small className="text-muted d-block">Birim</small>
                    <strong>{item.unit || 'Adet'}</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Timestamps Card */}
          <div className="card">
            <div className="card-header">
              <h5 className="card-title mb-0">
                <i className="bi bi-clock-history me-2"></i>
                Tarih Bilgileri
              </h5>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-md-6">
                  <div className="mb-3">
                    <small className="text-muted d-block">Oluşturulma Tarihi</small>
                    <strong>
                      {item.createdAt 
                        ? new Date(item.createdAt).toLocaleString('tr-TR')
                        : 'Belirtilmemiş'}
                    </strong>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="mb-3">
                    <small className="text-muted d-block">Güncellenme Tarihi</small>
                    <strong>
                      {item.updatedAt 
                        ? new Date(item.updatedAt).toLocaleString('tr-TR')
                        : 'Belirtilmemiş'}
                    </strong>
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