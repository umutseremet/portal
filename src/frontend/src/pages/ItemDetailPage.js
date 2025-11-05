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
        {/* Resim - Sol tarafta veya üstte */}
        {item.imageUrl && (
          <div className="col-12 mb-4">
            <div className="card">
              <div className="card-body text-center">
                <img 
                  src={item.imageUrl} 
                  alt={item.name}
                  className="img-fluid rounded"
                  style={{ maxWidth: '400px', maxHeight: '400px', objectFit: 'contain' }}
                  onError={(e) => { e.target.style.display = 'none'; }}
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
                <div className="col-md-6">
                  <div className="mb-3">
                    <small className="text-muted d-block">Numara</small>
                    <strong>{item.number}</strong>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="mb-3">
                    <small className="text-muted d-block">Kod</small>
                    <strong>
                      <span className="badge bg-light text-dark">{item.code}</span>
                    </strong>
                  </div>
                </div>
                <div className="col-12">
                  <div className="mb-3">
                    <small className="text-muted d-block">Ürün Adı</small>
                    <strong>{item.name}</strong>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="mb-3">
                    <small className="text-muted d-block">Doküman No</small>
                    <strong>{item.docNumber || 'Belirtilmemiş'}</strong>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="mb-3">
                    <small className="text-muted d-block">Durum</small>
                    <strong>
                      {item.cancelled ? (
                        <span className="badge bg-danger">İptal Edilmiş</span>
                      ) : (
                        <span className="badge bg-success">Aktif</span>
                      )}
                    </strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Boyutlar */}
        <div className="col-md-6 mb-4">
          <div className="card h-100">
            <div className="card-header bg-light">
              <h5 className="card-title mb-0">
                <i className="bi bi-rulers me-2"></i>
                Boyutlar
              </h5>
            </div>
            <div className="card-body">
              <div className="row g-3">
                <div className="col-4">
                  <div className="mb-3">
                    <small className="text-muted d-block">X</small>
                    <strong>{item.x || '-'}</strong>
                  </div>
                </div>
                <div className="col-4">
                  <div className="mb-3">
                    <small className="text-muted d-block">Y</small>
                    <strong>{item.y || '-'}</strong>
                  </div>
                </div>
                <div className="col-4">
                  <div className="mb-3">
                    <small className="text-muted d-block">Z</small>
                    <strong>{item.z || '-'}</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tedarikçi Bilgileri */}
        <div className="col-md-6 mb-4">
          <div className="card h-100">
            <div className="card-header bg-light">
              <h5 className="card-title mb-0">
                <i className="bi bi-truck me-2"></i>
                Tedarikçi Bilgileri
              </h5>
            </div>
            <div className="card-body">
              <div className="row g-3">
                <div className="col-12">
                  <div className="mb-3">
                    <small className="text-muted d-block">Tedarikçi</small>
                    <strong>{item.supplier || 'Belirtilmemiş'}</strong>
                  </div>
                </div>
                <div className="col-12">
                  <div className="mb-3">
                    <small className="text-muted d-block">Tedarikçi Kodu</small>
                    <strong>{item.supplierCode || 'Belirtilmemiş'}</strong>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="mb-3">
                    <small className="text-muted d-block">Fiyat</small>
                    <strong className="text-success">
                      {item.price 
                        ? item.price.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })
                        : 'Belirtilmemiş'}
                    </strong>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="mb-3">
                    <small className="text-muted d-block">Birim</small>
                    <strong>{item.unit || 'Belirtilmemiş'}</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tarihler */}
        <div className="col-md-6 mb-4">
          <div className="card h-100">
            <div className="card-header bg-light">
              <h5 className="card-title mb-0">
                <i className="bi bi-clock-history me-2"></i>
                Tarih Bilgileri
              </h5>
            </div>
            <div className="card-body">
              <div className="row g-3">
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