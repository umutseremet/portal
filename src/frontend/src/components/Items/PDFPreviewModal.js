// src/frontend/src/components/Items/PDFPreviewModal.js

import React, { useState } from 'react';
import { X, Download, AlertCircle } from 'lucide-react';

const PDFPreviewModal = ({ show, file, onClose }) => {
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  if (!show || !file) return null;

  // ✅ API URL'yi doğru şekilde oluştur
  const apiBaseUrl = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5154/api';
  const baseUrl = apiBaseUrl.replace('/api', '');
  
  // ✅ DÜZELTME: Preview endpoint kullan (iframe için inline görüntüleme)
  const previewUrl = `${baseUrl}/api/ItemFiles/preview/${file.id}`;
  
  // İndirme için download endpoint
  const downloadUrl = `${baseUrl}/api/ItemFiles/download/${file.id}`;

  console.log('📄 PDF Preview URL:', previewUrl);
  console.log('📥 Download URL:', downloadUrl);

  const handleIframeLoad = () => {
    setLoading(false);
    setError(false);
  };

  const handleIframeError = () => {
    setLoading(false);
    setError(true);
    console.error('PDF yükleme hatası:', file.fileName);
  };

  return (
    <>
      {/* Modal Backdrop */}
      <div 
        className="modal-backdrop fade show" 
        onClick={onClose}
        style={{ zIndex: 1050 }}
      ></div>

      {/* Modal */}
      <div 
        className="modal fade show d-block" 
        tabIndex="-1" 
        style={{ zIndex: 1055 }}
      >
        <div className="modal-dialog modal-xl modal-dialog-centered" style={{ maxWidth: '90vw', height: '90vh' }}>
          <div className="modal-content" style={{ height: '100%' }}>
            {/* Header */}
            <div className="modal-header bg-light">
              <h5 className="modal-title d-flex align-items-center">
                <i className="bi bi-file-pdf text-danger me-2" style={{ fontSize: '1.2rem' }}></i>
                <span style={{ fontSize: '0.95rem' }}>{file.fileName}</span>
                <span className="badge bg-secondary ms-2" style={{ fontSize: '0.7rem' }}>
                  {file.formattedSize}
                </span>
              </h5>
              <button 
                type="button" 
                className="btn-close" 
                onClick={onClose}
                aria-label="Close"
              ></button>
            </div>

            {/* Body */}
            <div className="modal-body p-0 position-relative" style={{ height: 'calc(100% - 120px)' }}>
              {loading && (
                <div className="position-absolute top-50 start-50 translate-middle">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Yükleniyor...</span>
                  </div>
                  <div className="text-muted mt-2">PDF yükleniyor...</div>
                </div>
              )}

              {error ? (
                <div className="d-flex flex-column align-items-center justify-content-center h-100">
                  <AlertCircle size={48} className="text-warning mb-3" />
                  <h5>PDF Önizlenemiyor</h5>
                  <p className="text-muted">Dosyayı indirerek görüntüleyebilirsiniz</p>
                  <a
                    href={downloadUrl}
                    className="btn btn-primary"
                    download
                  >
                    <Download size={16} className="me-2" />
                    Dosyayı İndir
                  </a>
                </div>
              ) : (
                <iframe
                  src={previewUrl}
                  style={{ 
                    width: '100%', 
                    height: '100%', 
                    border: 'none',
                    display: loading ? 'none' : 'block'
                  }}
                  title={file.fileName}
                  onLoad={handleIframeLoad}
                  onError={handleIframeError}
                />
              )}
            </div>

            {/* Footer */}
            <div className="modal-footer bg-light">
              <div className="text-muted small me-auto">
                <i className="bi bi-calendar3 me-1"></i>
                {file.formattedUploadDate}
                {file.uploadedBy && (
                  <span className="ms-3">
                    <i className="bi bi-person me-1"></i>
                    {file.uploadedBy}
                  </span>
                )}
              </div>
              <a
                href={downloadUrl}
                className="btn btn-success btn-sm"
                download
              >
                <Download size={16} className="me-2" />
                İndir
              </a>
              <button 
                type="button" 
                className="btn btn-secondary btn-sm" 
                onClick={onClose}
              >
                <X size={16} className="me-2" />
                Kapat
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default PDFPreviewModal;