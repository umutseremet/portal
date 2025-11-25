// src/frontend/src/components/Items/ItemDetailModal.js
import React from 'react';

const ItemDetailModal = ({ show, onHide, item, itemGroups, loading, onEdit, onDelete, apiBaseUrl = '' }) => {
  if (!show || !item) return null;

  const getGroupName = (groupId) => {
    const group = itemGroups?.find(g => g.id === groupId);
    return group?.name || 'Bilinmiyor';
  };

  return (
    <>
      <div 
        className="modal-backdrop fade show" 
        style={{ zIndex: 1040 }}
        onClick={onHide}
      ></div>

      <div 
        className="modal fade show d-block" 
        tabIndex="-1" 
        style={{ zIndex: 1050 }}
        onClick={onHide}
      >
        <div 
          className="modal-dialog modal-lg modal-dialog-scrollable"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">
                <i className="bi bi-box me-2"></i>
                Ürün Detayı
              </h5>
              <button 
                type="button" 
                className="btn-close" 
                onClick={onHide}
              ></button>
            </div>

            <div className="modal-body">
              <div className="item-detail">
                {/* Resim varsa en üstte göster */}
                {item.imageUrl && (
                  <div className="row mb-4">
                    <div className="col-12">
                      <div className="text-center">
                        <h6 className="text-muted mb-3">Ürün Resmi</h6>
                        <img 
                          src={apiBaseUrl + item.imageUrl} 
                          alt={item.name}
                          className="img-thumbnail"
                          style={{ 
                            maxWidth: '400px', 
                            maxHeight: '400px',
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

                <div className="row">
                  <div className="col-md-6">
                    <div className="detail-section mb-4">
                      <h6 className="text-muted mb-3">Temel Bilgiler</h6>
                      {/* <div className="detail-item mb-2">
                        <strong>Numara:</strong>
                        <span className="ms-2">{item.number}</span>
                      </div> */}
                      <div className="detail-item mb-2">
                        <strong>Kod:</strong>
                        <span className="ms-2 badge bg-light text-dark">{item.code}</span>
                      </div>
                      <div className="detail-item mb-2">
                        <strong>İsim:</strong>
                        <span className="ms-2">{item.name}</span>
                      </div>
                      <div className="detail-item mb-2">
                        <strong>Doküman No:</strong>
                        <span className="ms-2">{item.docNumber || '-'}</span>
                      </div>
                      <div className="detail-item mb-2">
                        <strong>Grup:</strong>
                        <span className="ms-2 badge bg-info text-dark">{getGroupName(item.groupId)}</span>
                      </div>
                      <div className="detail-item mb-2">
                        <strong>Durum:</strong>
                        <span className="ms-2">
                          {item.cancelled ? (
                            <span className="badge bg-danger">İptal Edilmiş</span>
                          ) : (
                            <span className="badge bg-success">Aktif</span>
                          )}
                        </span>
                      </div>
                    </div>

                    <div className="detail-section mb-4">
                      <h6 className="text-muted mb-3">Boyutlar</h6>
                      <div className="detail-item mb-2">
                        <strong>X:</strong>
                        <span className="ms-2">{item.x || '-'}</span>
                      </div>
                      <div className="detail-item mb-2">
                        <strong>Y:</strong>
                        <span className="ms-2">{item.y || '-'}</span>
                      </div>
                      <div className="detail-item mb-2">
                        <strong>Z:</strong>
                        <span className="ms-2">{item.z || '-'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="col-md-6">
                    <div className="detail-section mb-4">
                      <h6 className="text-muted mb-3">Tedarikçi Bilgileri</h6>
                      <div className="detail-item mb-2">
                        <strong>Tedarikçi:</strong>
                        <span className="ms-2">{item.supplier || '-'}</span>
                      </div>
                      <div className="detail-item mb-2">
                        <strong>Tedarikçi Kodu:</strong>
                        <span className="ms-2">{item.supplierCode || '-'}</span>
                      </div>
                      <div className="detail-item mb-2">
                        <strong>Fiyat:</strong>
                        <span className="ms-2">
                          {item.price ? item.price.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' }) : '-'}
                        </span>
                      </div>
                      <div className="detail-item mb-2">
                        <strong>Birim:</strong>
                        <span className="ms-2">{item.unit || '-'}</span>
                      </div>
                    </div>

                    <div className="detail-section mb-4">
                      <h6 className="text-muted mb-3">Tarihler</h6>
                      <div className="detail-item mb-2">
                        <strong>Oluşturma Tarihi:</strong>
                        <span className="ms-2">
                          {item.createdAt ? new Date(item.createdAt).toLocaleString('tr-TR') : '-'}
                        </span>
                      </div>
                      <div className="detail-item mb-2">
                        <strong>Güncelleme Tarihi:</strong>
                        <span className="ms-2">
                          {item.updatedAt ? new Date(item.updatedAt).toLocaleString('tr-TR') : '-'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button 
                className="btn btn-primary"
                onClick={() => onEdit?.(item)}
                disabled={loading}
              >
                <i className="bi bi-pencil me-2"></i>
                Düzenle
              </button>
              <button 
                className="btn btn-danger"
                onClick={() => onDelete?.(item.id)}
                disabled={loading}
              >
                <i className="bi bi-trash me-2"></i>
                Sil
              </button>
              <button 
                className="btn btn-secondary"
                onClick={onHide}
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ItemDetailModal;