// src/frontend/src/components/common/DeleteConfirmModal.js
import React from 'react';

/**
 * Delete confirmation modal component
 * @param {Object} props - Component props
 * @param {boolean} props.show - Show/hide modal
 * @param {function} props.onHide - Function to call when modal is hidden
 * @param {function} props.onConfirm - Function to call when delete is confirmed
 * @param {string} props.title - Modal title
 * @param {string} props.message - Confirmation message
 * @param {string} props.itemName - Name of item being deleted
 * @param {boolean} props.loading - Loading state
 * @param {string} props.confirmText - Confirm button text
 * @param {string} props.cancelText - Cancel button text
 */
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

  const handleConfirm = () => {
    if (onConfirm && !loading) {
      onConfirm();
    }
  };

  const handleCancel = () => {
    if (onHide && !loading) {
      onHide();
    }
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      handleCancel();
    }
  };

  return (
    <div 
      className="modal fade show d-block" 
      tabIndex="-1" 
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
      onClick={handleBackdropClick}
    >
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
              onClick={handleCancel}
              disabled={loading}
              aria-label="Close"
            ></button>
          </div>
          
          <div className="modal-body">
            <div className="d-flex align-items-start">
              <div className="flex-shrink-0 me-3">
                <div className="rounded-circle bg-danger bg-opacity-10 p-2">
                  <i className="bi bi-trash text-danger fs-4"></i>
                </div>
              </div>
              
              <div className="flex-grow-1">
                <p className="mb-1">{message}</p>
                {itemName && (
                  <p className="mb-0">
                    <strong>Silinecek öğe:</strong> 
                    <span className="text-danger ms-1">{itemName}</span>
                  </p>
                )}
                <div className="mt-3 p-3 bg-warning bg-opacity-10 rounded">
                  <div className="d-flex align-items-center">
                    <i className="bi bi-exclamation-triangle-fill text-warning me-2"></i>
                    <small className="text-muted">
                      Bu işlem geri alınamaz. Silinen veriler kalıcı olarak kaybedilir.
                    </small>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="modal-footer">
            <button 
              type="button" 
              className="btn btn-secondary" 
              onClick={handleCancel}
              disabled={loading}
            >
              <i className="bi bi-x-circle me-1"></i>
              {cancelText}
            </button>
            
            <button 
              type="button" 
              className="btn btn-danger" 
              onClick={handleConfirm}
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Siliniyor...
                </>
              ) : (
                <>
                  <i className="bi bi-trash me-1"></i>
                  {confirmText}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmModal;