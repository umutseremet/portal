// src/components/common/ConfirmModal.js
// Genel amaçlı onay modal'ı (silme, güncelleme, vb. için)

import React from 'react';

const ConfirmModal = ({
  show = false,
  onHide,
  onConfirm,
  title = 'Onay',
  message = 'Bu işlemi yapmak istediğinizden emin misiniz?',
  description = '', // Ek açıklama
  confirmText = 'Onayla',
  cancelText = 'İptal',
  confirmButtonClass = 'btn-primary', // btn-danger, btn-warning, btn-success
  icon = 'bi-question-circle', // Bootstrap icon class
  iconColor = 'text-primary', // text-danger, text-warning, text-success
  loading = false
}) => {
  if (!show) return null;

  const handleConfirm = () => {
    if (!loading) {
      onConfirm();
    }
  };

  const handleCancel = () => {
    if (!loading) {
      onHide();
    }
  };

  return (
    <>
      {/* Modal Backdrop */}
      <div 
        className="modal-backdrop fade show" 
        onClick={handleCancel}
        style={{ zIndex: 1040 }}
      ></div>

      {/* Modal */}
      <div 
        className="modal fade show d-block" 
        tabIndex="-1"
        style={{ zIndex: 1050 }}
      >
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title d-flex align-items-center">
                <i className={`bi ${icon} ${iconColor} me-2 fs-5`}></i>
                {title}
              </h5>
              <button 
                type="button" 
                className="btn-close" 
                onClick={handleCancel}
                disabled={loading}
                aria-label="Kapat"
              ></button>
            </div>
            
            <div className="modal-body">
              <p className="mb-2">{message}</p>
              {description && (
                <p className="text-muted small mb-0">{description}</p>
              )}
            </div>
            
            <div className="modal-footer">
              <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={handleCancel}
                disabled={loading}
              >
                {cancelText}
              </button>
              <button 
                type="button" 
                className={`btn ${confirmButtonClass}`}
                onClick={handleConfirm}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2"></span>
                    İşlem yapılıyor...
                  </>
                ) : (
                  confirmText
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ConfirmModal;