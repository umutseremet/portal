// src/frontend/src/components/Vehicles/FuelPurchaseImportModal.js
// ✅ GÜNCELLENMIŞ VERSİYON - 40 kolonlu Excel formatı için uyarılar eklendi

import React, { useState, useRef } from 'react';
import apiService from '../../services/api';

const FuelPurchaseImportModal = ({ show, onHide, onSuccess }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [validationResult, setValidationResult] = useState(null);
  const [importing, setImporting] = useState(false);
  const [validating, setValidating] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [step, setStep] = useState('select'); // select, validate, import, complete
  const fileInputRef = useRef(null);

  // Reset modal state
  const resetModal = () => {
    setSelectedFile(null);
    setValidationResult(null);
    setImporting(false);
    setValidating(false);
    setImportResult(null);
    setUploadProgress(0);
    setStep('select');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Handle modal close
  const handleClose = () => {
    resetModal();
    onHide();
  };

  // Handle file selection
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check file type
      if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
        alert('Lütfen sadece Excel dosyası (.xlsx, .xls) seçin');
        return;
      }

      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert('Dosya boyutu çok büyük (max 10MB)');
        return;
      }

      setSelectedFile(file);
      setValidationResult(null);
      setImportResult(null);
      setStep('validate');
    }
  };

  // Handle validation
  const handleValidate = async () => {
    if (!selectedFile) return;

    setValidating(true);
    setValidationResult(null);

    try {
      const result = await apiService.validateFuelPurchaseExcel(selectedFile);

      if (result) {
        setValidationResult(result);
        
        if (result.isValid) {
          setStep('import');
        }
      }
    } catch (error) {
      console.error('Validation error:', error);
      alert(error.message || 'Doğrulama sırasında hata oluştu');
    } finally {
      setValidating(false);
    }
  };

  // Handle import
  const handleImport = async () => {
    if (!selectedFile) return;

    setImporting(true);
    setUploadProgress(0);
    setImportResult(null);

    try {
      const result = await apiService.importFuelPurchaseExcel(selectedFile, (progress) => {
        setUploadProgress(progress);
      });

      if (result) {
        setImportResult(result);
        setStep('complete');
        
        // Call success callback after a short delay
        setTimeout(() => {
          if (onSuccess) {
            onSuccess(result);
          }
        }, 1500);
      }
    } catch (error) {
      console.error('Import error:', error);
      alert(error.message || 'İçe aktarma sırasında hata oluştu');
      setStep('validate');
    } finally {
      setImporting(false);
      setUploadProgress(0);
    }
  };

  // Render validation warnings/errors
  const renderValidationMessages = () => {
    if (!validationResult) return null;

    return (
      <div className="mt-3">
        {/* Errors */}
        {validationResult.errors && validationResult.errors.length > 0 && (
          <div className="alert alert-danger">
            <div className="d-flex align-items-start mb-2">
              <i className="bi bi-exclamation-triangle-fill me-2 mt-1"></i>
              <div className="flex-grow-1">
                <strong>Doğrulama Hataları ({validationResult.errors.length})</strong>
              </div>
            </div>
            <ul className="mb-0">
              {validationResult.errors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Warnings */}
        {validationResult.warnings && validationResult.warnings.length > 0 && (
          <div className="alert alert-warning">
            <div className="d-flex align-items-start mb-2">
              <i className="bi bi-exclamation-circle-fill me-2 mt-1"></i>
              <div className="flex-grow-1">
                <strong>Uyarılar ({validationResult.warnings.length})</strong>
              </div>
            </div>
            <ul className="mb-0">
              {validationResult.warnings.map((warning, index) => (
                <li key={index}>{warning}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Success - Ready to import */}
        {validationResult.isValid && (
          <div className="alert alert-success">
            <div className="d-flex align-items-center">
              <i className="bi bi-check-circle-fill me-2 fs-5"></i>
              <div>
                <strong>Doğrulama Başarılı!</strong>
                <div className="small mt-1">
                  {validationResult.totalRows} satır içe aktarılmaya hazır
                  {validationResult.existingVehiclesCount > 0 && 
                    ` (${validationResult.existingVehiclesCount} araç sistemde kayıtlı)`}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Render import results
  const renderImportResults = () => {
    if (!importResult) return null;

    return (
      <div className="alert alert-info">
        <h6 className="alert-heading">
          <i className="bi bi-check-circle me-2"></i>
          İçe Aktarma Tamamlandı
        </h6>
        <div className="row g-2 mt-2">
          <div className="col-4">
            <div className="small text-muted">Başarılı</div>
            <div className="fs-5 fw-bold text-success">{importResult.successCount}</div>
          </div>
          <div className="col-4">
            <div className="small text-muted">Atlanan</div>
            <div className="fs-5 fw-bold text-warning">{importResult.skippedCount}</div>
          </div>
          <div className="col-4">
            <div className="small text-muted">Başarısız</div>
            <div className="fs-5 fw-bold text-danger">{importResult.failCount}</div>
          </div>
        </div>

        {/* Import Errors */}
        {importResult.errors && importResult.errors.length > 0 && (
          <div className="mt-3">
            <details>
              <summary className="fw-medium text-danger" style={{ cursor: 'pointer' }}>
                Hatalar ({importResult.errors.length})
              </summary>
              <ul className="mt-2 mb-0 small">
                {importResult.errors.slice(0, 20).map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
                {importResult.errors.length > 20 && (
                  <li className="text-muted">... ve {importResult.errors.length - 20} hata daha</li>
                )}
              </ul>
            </details>
          </div>
        )}

        {/* Import Warnings */}
        {importResult.warnings && importResult.warnings.length > 0 && (
          <div className="mt-3">
            <details>
              <summary className="fw-medium text-warning" style={{ cursor: 'pointer' }}>
                Uyarılar ({importResult.warnings.length})
              </summary>
              <ul className="mt-2 mb-0 small">
                {importResult.warnings.slice(0, 10).map((warning, index) => (
                  <li key={index}>{warning}</li>
                ))}
                {importResult.warnings.length > 10 && (
                  <li className="text-muted">... ve {importResult.warnings.length - 10} uyarı daha</li>
                )}
              </ul>
            </details>
          </div>
        )}
      </div>
    );
  };

  if (!show) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="modal-backdrop fade show" 
        style={{ zIndex: 1040 }}
      ></div>

      {/* Modal */}
      <div 
        className="modal fade show d-block" 
        tabIndex="-1" 
        style={{ zIndex: 1050 }}
        onClick={(e) => e.target.className.includes('modal') && handleClose()}
      >
        <div className="modal-dialog modal-lg modal-dialog-centered" onClick={(e) => e.stopPropagation()}>
          <div className="modal-content">
            {/* Header */}
            <div className="modal-header">
              <h5 className="modal-title">
                <i className="bi bi-file-earmark-excel me-2 text-success"></i>
                Excel'den Yakıt Alımları İçe Aktar
              </h5>
              <button 
                type="button" 
                className="btn-close" 
                onClick={handleClose}
                disabled={importing || validating}
              ></button>
            </div>

            {/* Body */}
            <div className="modal-body">
              {/* Step Indicator */}
              <div className="d-flex justify-content-between mb-4">
                <div className={`text-center flex-fill ${step === 'select' ? 'text-danger' : step !== 'select' ? 'text-success' : 'text-muted'}`}>
                  <div className={`rounded-circle d-inline-flex align-items-center justify-content-center mb-2
                    ${step === 'select' ? 'bg-danger text-white' : step !== 'select' ? 'bg-success text-white' : 'bg-light'}`}
                    style={{ width: '40px', height: '40px' }}>
                    <i className="bi bi-file-earmark-arrow-up"></i>
                  </div>
                  <div className="small fw-medium">1. Dosya Seç</div>
                </div>
                <div className="align-self-center" style={{ width: '50px', height: '2px', backgroundColor: step !== 'select' ? '#198754' : '#dee2e6', marginTop: '-20px' }}></div>
                <div className={`text-center flex-fill ${step === 'validate' || step === 'import' || step === 'complete' ? 'text-danger' : 'text-muted'}`}>
                  <div className={`rounded-circle d-inline-flex align-items-center justify-content-center mb-2
                    ${step === 'validate' || step === 'import' || step === 'complete' ? step === 'validate' ? 'bg-danger text-white' : 'bg-success text-white' : 'bg-light'}`}
                    style={{ width: '40px', height: '40px' }}>
                    <i className="bi bi-check-circle"></i>
                  </div>
                  <div className="small fw-medium">2. Doğrula</div>
                </div>
                <div className="align-self-center" style={{ width: '50px', height: '2px', backgroundColor: step === 'import' || step === 'complete' ? '#198754' : '#dee2e6', marginTop: '-20px' }}></div>
                <div className={`text-center flex-fill ${step === 'import' || step === 'complete' ? 'text-danger' : 'text-muted'}`}>
                  <div className={`rounded-circle d-inline-flex align-items-center justify-content-center mb-2
                    ${step === 'import' || step === 'complete' ? step === 'import' ? 'bg-danger text-white' : 'bg-success text-white' : 'bg-light'}`}
                    style={{ width: '40px', height: '40px' }}>
                    <i className="bi bi-cloud-upload"></i>
                  </div>
                  <div className="small fw-medium">3. İçe Aktar</div>
                </div>
              </div>

              {/* ✅ YENİ: Excel Format Bilgisi */}
              <div className="alert alert-info mb-4">
                <div className="d-flex">
                  <i className="bi bi-info-circle me-2 mt-1"></i>
                  <div className="small">
                    <strong>Excel Formatı Gereksinimleri:</strong>
                    <ul className="mb-0 mt-1">
                      <li>Excel dosyasında <strong>40 kolon</strong> olmalıdır</li>
                      <li>Shell yakıt alım raporunu doğrudan kullanabilirsiniz</li>
                      <li>Plaka kolonu (19. kolon) zorunludur ve araçlar sistemde kayıtlı olmalıdır</li>
                      <li>Miktar, tutarlar ve tarihler doğru formatta olmalıdır</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* File Selection */}
              <div className="mb-4">
                <label className="form-label fw-medium">Excel Dosyası</label>
                <div className="input-group">
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="form-control"
                    accept=".xlsx,.xls"
                    onChange={handleFileSelect}
                    disabled={importing || validating || step === 'complete'}
                  />
                  {selectedFile && (
                    <button 
                      className="btn btn-outline-secondary" 
                      type="button"
                      onClick={() => {
                        setSelectedFile(null);
                        setValidationResult(null);
                        setStep('select');
                        if (fileInputRef.current) {
                          fileInputRef.current.value = '';
                        }
                      }}
                      disabled={importing || validating || step === 'complete'}
                    >
                      <i className="bi bi-x-lg"></i>
                    </button>
                  )}
                </div>
                {selectedFile && (
                  <div className="mt-2 text-muted small">
                    <i className="bi bi-file-earmark-excel text-success me-2"></i>
                    {selectedFile.name} ({(selectedFile.size / 1024).toFixed(2)} KB)
                  </div>
                )}
              </div>

              {/* Validation Info */}
              {validationResult && step !== 'complete' && (
                <div className="card mb-4">
                  <div className="card-body">
                    <h6 className="card-title">
                      <i className="bi bi-info-circle me-2"></i>
                      Dosya Bilgileri
                    </h6>
                    <div className="row g-3">
                      <div className="col-6">
                        <div className="small text-muted">Toplam Satır</div>
                        <div className="fw-bold">{validationResult.totalRows}</div>
                      </div>
                      <div className="col-6">
                        <div className="small text-muted">Toplam Kolon</div>
                        <div className="fw-bold">
                          {validationResult.totalColumns}
                          {validationResult.totalColumns !== 40 && (
                            <span className="badge bg-warning text-dark ms-2">
                              40 bekleniyor
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="col-6">
                        <div className="small text-muted">Mevcut Araçlar</div>
                        <div className="fw-bold text-success">{validationResult.existingVehiclesCount}</div>
                      </div>
                      <div className="col-6">
                        <div className="small text-muted">Eksik Araçlar</div>
                        <div className="fw-bold text-danger">{validationResult.missingVehiclesCount}</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Validation Messages */}
              {renderValidationMessages()}

              {/* Import Progress */}
              {importing && uploadProgress > 0 && (
                <div className="mb-3">
                  <div className="d-flex justify-content-between mb-2">
                    <span className="small text-muted">Yükleniyor...</span>
                    <span className="small fw-medium">{uploadProgress}%</span>
                  </div>
                  <div className="progress" style={{ height: '8px' }}>
                    <div 
                      className="progress-bar progress-bar-striped progress-bar-animated bg-success" 
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                </div>
              )}

              {/* Import Results */}
              {step === 'complete' && renderImportResults()}
            </div>

            {/* Footer */}
            <div className="modal-footer">
              <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={handleClose}
                disabled={importing || validating}
              >
                {step === 'complete' ? 'Kapat' : 'İptal'}
              </button>

              {step === 'validate' && selectedFile && !validating && (
                <button 
                  type="button" 
                  className="btn btn-primary" 
                  onClick={handleValidate}
                  disabled={!selectedFile}
                >
                  <i className="bi bi-check-circle me-2"></i>
                  Doğrula
                </button>
              )}

              {validating && (
                <button type="button" className="btn btn-primary" disabled>
                  <span className="spinner-border spinner-border-sm me-2"></span>
                  Doğrulanıyor...
                </button>
              )}

              {step === 'import' && validationResult && validationResult.isValid && !importing && (
                <button 
                  type="button" 
                  className="btn btn-success" 
                  onClick={handleImport}
                >
                  <i className="bi bi-cloud-upload me-2"></i>
                  İçe Aktar
                </button>
              )}

              {importing && (
                <button type="button" className="btn btn-success" disabled>
                  <span className="spinner-border spinner-border-sm me-2"></span>
                  İçe Aktarılıyor...
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default FuelPurchaseImportModal;