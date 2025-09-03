// src/frontend/src/components/Visitors/VisitorDetailModal.js
import React from 'react';

const VisitorDetailModal = ({ visitor, show, onHide, onEdit, onDelete }) => {
  // ✅ GÜVENLIK KONTROLÜ: Visitor objesi var mı ve geçerli mi?
  if (!show || !visitor) return null;

  // ✅ FORMATTELENMİŞ DEĞERLER: String olarak döndür
  const formatDisplayDate = (dateValue) => {
    if (!dateValue) return 'Belirtilmemiş';
    try {
      return new Date(dateValue).toLocaleDateString('tr-TR');
    } catch (error) {
      return 'Geçersiz tarih';
    }
  };

  // ✅ GÜVENLİ RENDER HELPER: Obje yerine string döndür
  const safeRender = (value, defaultValue = 'Belirtilmemiş') => {
    if (value === null || value === undefined) return defaultValue;
    if (typeof value === 'object') return JSON.stringify(value); // Geçici çözüm
    return String(value);
  };

  // Visitor verilerini güvenli şekilde al
  const visitorName = visitor.visitorName || visitor.visitor || 'İsimsiz Ziyaretçi';
  const companyName = visitor.company || 'Bilinmeyen Şirket';
  const description = visitor.description || '';
  const visitDate = visitor.date;
  const createdAt = visitor.createdAt;
  const updatedAt = visitor.updatedAt;

  // Status helper
  const getVisitStatus = () => {
    if (!visitDate) return { text: 'Belirsiz', class: 'bg-secondary' };
    
    try {
      const today = new Date();
      const visit = new Date(visitDate);
      
      if (visit.toDateString() === today.toDateString()) {
        return { text: 'Bugün', class: 'bg-success' };
      } else if (visit > today) {
        return { text: 'Gelecek', class: 'bg-info' };
      } else {
        return { text: 'Tamamlandı', class: 'bg-primary' };
      }
    } catch (error) {
      return { text: 'Hata', class: 'bg-danger' };
    }
  };

  const status = getVisitStatus();

  const handleDelete = () => {
    if (window.confirm(`${visitorName} adlı ziyaretçiyi silmek istediğinizden emin misiniz?`)) {
      onDelete(visitor);
      onHide();
    }
  };

  const handleEdit = () => {
    onEdit(visitor);
    onHide();
  };

  return (
    <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-lg modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header bg-light">
            <div className="d-flex align-items-center">
              <div className="me-3">
                <div className="avatar-lg bg-primary text-white d-flex align-items-center justify-content-center rounded-circle">
                  <i className="bi bi-person-fill fs-4"></i>
                </div>
              </div>
              <div>
                <h5 className="modal-title mb-1">
                  {safeRender(visitorName)}
                </h5>
                <div className="d-flex align-items-center gap-2">
                  <span className="text-muted small">
                    <i className="bi bi-building me-1"></i>
                    {safeRender(companyName)}
                  </span>
                  <span className={`badge ${status.class} small`}>
                    {status.text}
                  </span>
                </div>
              </div>
            </div>
            <button 
              type="button" 
              className="btn-close" 
              onClick={onHide}
            ></button>
          </div>
          
          <div className="modal-body">
            {/* Ziyaret Bilgileri */}
            <div className="row mb-4">
              <div className="col-12">
                <h6 className="text-muted border-bottom pb-2 mb-3">
                  <i className="bi bi-info-circle me-1"></i>
                  Ziyaret Bilgileri
                </h6>
              </div>
              
              <div className="col-md-6 mb-3">
                <label className="form-label small text-muted">Tarih</label>
                <div className="fw-medium">
                  <i className="bi bi-calendar3 me-2 text-primary"></i>
                  {formatDisplayDate(visitDate)}
                </div>
              </div>

              <div className="col-md-6 mb-3">
                <label className="form-label small text-muted">Şirket</label>
                <div className="fw-medium">
                  <i className="bi bi-building me-2 text-primary"></i>
                  {safeRender(companyName)}
                </div>
              </div>

              <div className="col-md-6 mb-3">
                <label className="form-label small text-muted">Ziyaretçi Adı</label>
                <div className="fw-medium">
                  <i className="bi bi-person me-2 text-primary"></i>
                  {safeRender(visitorName)}
                </div>
              </div>

              {description && (
                <div className="col-12 mb-3">
                  <label className="form-label small text-muted">Açıklama / Ziyaret Amacı</label>
                  <div className="fw-medium border rounded p-3 bg-light">
                    <i className="bi bi-journal-text me-2 text-primary"></i>
                    {safeRender(description)}
                  </div>
                </div>
              )}
            </div>

            {/* Kayıt Bilgileri */}
            <div className="row">
              <div className="col-12">
                <h6 className="text-muted border-bottom pb-2 mb-3">
                  <i className="bi bi-info-square me-1"></i>
                  Kayıt Bilgileri
                </h6>
              </div>

              <div className="col-md-6 mb-3">
                <label className="form-label small text-muted">Kayıt ID</label>
                <div className="fw-medium">
                  <code className="text-muted"># {safeRender(visitor.id)}</code>
                </div>
              </div>

              {createdAt && (
                <div className="col-md-6 mb-3">
                  <label className="form-label small text-muted">Kayıt Tarihi</label>
                  <div className="fw-medium">
                    <i className="bi bi-calendar-plus me-2 text-success"></i>
                    {formatDisplayDate(createdAt)}
                  </div>
                </div>
              )}

              {updatedAt && updatedAt !== createdAt && (
                <div className="col-md-6 mb-3">
                  <label className="form-label small text-muted">Son Güncelleme</label>
                  <div className="fw-medium">
                    <i className="bi bi-calendar-check me-2 text-warning"></i>
                    {formatDisplayDate(updatedAt)}
                  </div>
                </div>
              )}
            </div>

            {/* Info Alert */}
            <div className="alert alert-info mt-4">
              <i className="bi bi-info-circle me-2"></i>
              <strong>Kayıt Özeti:</strong> Bu ziyaretçi kaydı 
              {' ' + formatDisplayDate(visitDate)} tarihinde {safeRender(companyName)} şirketinden 
              {' ' + safeRender(visitorName)} için oluşturulmuştur.
            </div>
          </div>

          <div className="modal-footer">
            <button 
              type="button" 
              className="btn btn-secondary"
              onClick={onHide}
            >
              <i className="bi bi-x me-1"></i>
              Kapat
            </button>
            <div className="d-flex gap-2">
              <button 
                type="button" 
                className="btn btn-outline-primary"
                onClick={handleEdit}
              >
                <i className="bi bi-pencil me-1"></i>
                Düzenle
              </button>
              <button 
                type="button" 
                className="btn btn-outline-danger"
                onClick={handleDelete}
              >
                <i className="bi bi-trash me-1"></i>
                Sil
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VisitorDetailModal;