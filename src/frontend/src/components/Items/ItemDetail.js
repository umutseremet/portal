// src/frontend/src/components/Items/ItemDetail.js
import React from 'react';

const ItemDetail = ({ item, itemGroups, loading, onEdit, onDelete }) => {
  if (!item) return null;

  const getGroupName = (groupId) => {
    const group = itemGroups?.find(g => g.id === groupId);
    return group?.name || 'Bilinmiyor';
  };

  return (
    <div className="item-detail">
      {/* Resim - Üstte gösterim */}
      {item.imageUrl && (
        <div className="detail-section mb-4">
          <h6 className="text-muted mb-3">Resim</h6>
          <img 
            src={item.imageUrl} 
            alt={item.name}
            className="img-thumbnail"
            style={{ maxWidth: '300px', maxHeight: '300px' }}
            onError={(e) => { e.target.style.display = 'none'; }}
          />
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
              <span className="ms-2">{item.code}</span>
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
            <div className="detail-item mb-2">
              <strong>Teknilk Resim:</strong>
              <span className="ms-2">
                {item.technicalDrawingCompleted ? (
                        <span className="badge bg-success" title="Teknik resim çalışması tamamlandı">
                          <i className="bi bi-check-circle me-1"></i>
                          TR Tamam
                        </span>
                      ) : (
                        <span className="badge bg-warning text-dark" title="Teknik resim çalışması bekliyor">
                          <i className="bi bi-clock me-1"></i>
                          TR Bekliyor
                        </span>
                      )}
              </span>
            </div>
          </div>
        </div>

        <div className="col-md-6">
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
        </div>
      </div>

      <div className="detail-section">
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

      <div className="mt-4 pt-3 border-top">
        <button 
          className="btn btn-primary me-2"
          onClick={() => onEdit?.(item)}
          disabled={loading}
        >
          <i className="bi bi-pencil me-2"></i>Düzenle
        </button>
        <button 
          className="btn btn-outline-danger" 
          onClick={() => onDelete?.(item)}
          disabled={loading}
        >
          <i className="bi bi-trash me-2"></i>Sil
        </button>
      </div>
    </div>
  );
};

export default ItemDetail;