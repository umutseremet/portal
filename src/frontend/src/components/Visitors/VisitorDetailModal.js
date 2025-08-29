// src/frontend/src/components/Visitors/VisitorDetailModal.js
import { formatDate } from '../../utils/helpers';

const VisitorDetailModal = ({ 
  show, 
  onHide, 
  visitor = null,
  onEdit,
  onDelete 
}) => {
  
  if (!show || !visitor) return null;

  // Format date for display
  const formatDisplayDate = (dateStr) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('tr-TR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch (error) {
      return dateStr;
    }
  };

  // Get status badge based on date
  const getVisitStatus = () => {
    try {
      const visitDate = new Date(visitor.date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      visitDate.setHours(0, 0, 0, 0);

      if (visitDate.getTime() === today.getTime()) {
        return { text: 'Bugün', class: 'bg-success' };
      } else if (visitDate > today) {
        return { text: 'Gelecek', class: 'bg-info' };
      } else {
        const diffTime = Math.abs(today - visitDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 1) {
          return { text: 'Dün', class: 'bg-warning' };
        } else if (diffDays <= 7) {
          return { text: `${diffDays} gün önce`, class: 'bg-secondary' };
        } else {
          return { text: 'Geçmiş', class: 'bg-light text-dark' };
        }
      }
    } catch (error) {
      return { text: 'Bilinmiyor', class: 'bg-secondary' };
    }
  };

  const status = getVisitStatus();

  // Handle delete with confirmation
  const handleDelete = () => {
    if (window.confirm(`${visitor.visitorName || visitor.visitor} ziyaretçisini silmek istediğinizden emin misiniz?`)) {
      onDelete(visitor);
      onHide();
    }
  };

  // Handle edit
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
                  {visitor.visitorName || visitor.visitor}
                </h5>
                <div className="d-flex align-items-center gap-2">
                  <span className="text-muted small">
                    <i className="bi bi-building me-1"></i>
                    {visitor.company}
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
                  {formatDisplayDate(visitor.date)}
                </div>
              </div>

              <div className="col-md-6 mb-3">
                <label className="form-label small text-muted">Şirket</label>
                <div className="fw-medium">
                  <i className="bi bi-building me-2 text-primary"></i>
                  {visitor.company}
                </div>
              </div>

              <div className="col-md-6 mb-3">
                <label className="form-label small text-muted">Ziyaretçi Adı</label>
                <div className="fw-medium">
                  <i className="bi bi-person me-2 text-primary"></i>
                  {visitor.visitorName || visitor.visitor}
                </div>
              </div>

              {visitor.description && (
                <div className="col-12 mb-3">
                  <label className="form-label small text-muted">Açıklama / Ziyaret Amacı</label>
                  <div className="fw-medium border rounded p-3 bg-light">
                    <i className="bi bi-journal-text me-2 text-primary"></i>
                    {visitor.description}
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
                  <code className="text-muted"># {visitor.id}</code>
                </div>
              </div>

              {visitor.createdAt && (
                <div className="col-md-6 mb-3">
                  <label className="form-label small text-muted">Kayıt Tarihi</label>
                  <div className="fw-medium">
                    <i className="bi bi-calendar-plus me-2 text-success"></i>
                    {formatDisplayDate(visitor.createdAt)}
                  </div>
                </div>
              )}

              {visitor.updatedAt && visitor.updatedAt !== visitor.createdAt && (
                <div className="col-md-6 mb-3">
                  <label className="form-label small text-muted">Son Güncelleme</label>
                  <div className="fw-medium">
                    <i className="bi bi-calendar-check me-2 text-warning"></i>
                    {formatDisplayDate(visitor.updatedAt)}
                  </div>
                </div>
              )}
            </div>

            {/* Info Alert */}
            <div className="alert alert-info mt-4">
              <i className="bi bi-info-circle me-2"></i>
              <strong>Kayıt Özeti:</strong> Bu ziyaretçi kaydı 
              {formatDisplayDate(visitor.date)} tarihinde {visitor.company} şirketinden 
              {visitor.visitorName || visitor.visitor} için oluşturulmuştur.
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