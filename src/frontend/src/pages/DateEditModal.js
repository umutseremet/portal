// src/frontend/src/components/WeeklyCalendar/DateEditModal.js

import React, { useState, useEffect } from 'react';

const DateEditModal = ({ 
  show, 
  onHide, 
  issue, 
  onSave 
}) => {
  const [formData, setFormData] = useState({
    plannedStartDate: '',
    plannedEndDate: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (issue) {
      setFormData({
        plannedStartDate: issue.plannedStartDate 
          ? new Date(issue.plannedStartDate).toISOString().split('T')[0]
          : '',
        plannedEndDate: issue.plannedEndDate 
          ? new Date(issue.plannedEndDate).toISOString().split('T')[0]
          : ''
      });
    }
  }, [issue]);

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validasyon
    if (formData.plannedStartDate && formData.plannedEndDate) {
      if (new Date(formData.plannedStartDate) > new Date(formData.plannedEndDate)) {
        setError('Başlangıç tarihi, bitiş tarihinden sonra olamaz');
        return;
      }
    }

    setLoading(true);
    setError('');

    try {
      await onSave(formData);
      onHide();
    } catch (err) {
      setError(err.message || 'Tarihler güncellenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  if (!show || !issue) return null;

  return (
    <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header bg-primary text-white">
            <h5 className="modal-title">
              <i className="bi bi-calendar-event me-2"></i>
              Tarih Düzenle
            </h5>
            <button 
              type="button" 
              className="btn-close btn-close-white" 
              onClick={onHide}
              disabled={loading}
            ></button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              {/* İş Bilgisi */}
              <div className="alert alert-info">
                <div className="d-flex align-items-center">
                  <i className="bi bi-info-circle me-2"></i>
                  <div>
                    <strong>İş #{issue.issueId}:</strong> {issue.subject}
                    <div className="small text-muted mt-1">
                      {issue.projectName} - {issue.trackerName}
                    </div>
                  </div>
                </div>
              </div>

              {error && (
                <div className="alert alert-danger">
                  <i className="bi bi-exclamation-triangle me-2"></i>
                  {error}
                </div>
              )}

              {/* Planlanan Başlangıç Tarihi */}
              <div className="mb-3">
                <label htmlFor="plannedStartDate" className="form-label">
                  <i className="bi bi-calendar-check me-2"></i>
                  Planlanan Başlangıç Tarihi
                </label>
                <input
                  type="date"
                  id="plannedStartDate"
                  className="form-control"
                  value={formData.plannedStartDate}
                  onChange={(e) => handleChange('plannedStartDate', e.target.value)}
                  disabled={loading}
                />
                {issue.plannedStartDate && (
                  <div className="form-text">
                    Mevcut: {new Date(issue.plannedStartDate).toLocaleDateString('tr-TR')}
                  </div>
                )}
              </div>

              {/* Planlanan Bitiş Tarihi */}
              <div className="mb-3">
                <label htmlFor="plannedEndDate" className="form-label">
                  <i className="bi bi-calendar-x me-2"></i>
                  Planlanan Bitiş Tarihi
                </label>
                <input
                  type="date"
                  id="plannedEndDate"
                  className="form-control"
                  value={formData.plannedEndDate}
                  onChange={(e) => handleChange('plannedEndDate', e.target.value)}
                  disabled={loading}
                />
                {issue.plannedEndDate && (
                  <div className="form-text">
                    Mevcut: {new Date(issue.plannedEndDate).toLocaleDateString('tr-TR')}
                  </div>
                )}
              </div>

              {/* Bilgilendirme */}
              <div className="alert alert-warning">
                <i className="bi bi-info-circle me-2"></i>
                <small>
                  Sadece değiştirmek istediğiniz tarihi güncelleyebilirsiniz. 
                  Boş bırakılan tarihler değiştirilmeyecektir.
                </small>
              </div>
            </div>

            <div className="modal-footer">
              <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={onHide}
                disabled={loading}
              >
                <i className="bi bi-x-circle me-2"></i>
                İptal
              </button>
              <button 
                type="submit" 
                className="btn btn-primary"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2"></span>
                    Güncelleniyor...
                  </>
                ) : (
                  <>
                    <i className="bi bi-check-circle me-2"></i>
                    Kaydet
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default DateEditModal;