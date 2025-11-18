// src/components/common/DeleteConfirmModal.js
import React from 'react';

const DeleteConfirmModal = ({
  show = false,
  onHide,
  onConfirm,
  title = 'Silme Onayı',
  message = 'Bu öğeyi silmek istediğinizden emin misiniz?',
  itemName = '',
  loading = false,
  confirmText = 'Sil',
  cancelText = 'İptal'
}) => {
  if (!show) return null;

  return (
    <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">
              <i className="bi bi-exclamation-triangle text-danger me-2"></i>
              {title}
            </h5>
            <button 
              type="button" 
              className="btn-close" 
              onClick={onHide}
              disabled={loading}
            ></button>
          </div>
          
          <div className="modal-body">
            <p>{message}</p>
            {itemName && (
              <p><strong>Silinecek öğe:</strong> <span className="text-danger">{itemName}</span></p>
            )}
          </div>
          
          <div className="modal-footer">
            <button 
              type="button" 
              className="btn btn-secondary" 
              onClick={onHide}
              disabled={loading}
            >
              {cancelText}
            </button>
            <button 
              type="button" 
              className="btn btn-danger" 
              onClick={onConfirm}
              disabled={loading}
            >
              {loading ? 'Siliniyor...' : confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmModal;
