// src/frontend/src/components/Vehicles/VehicleWorkingReportModal.js

import React, { useState } from 'react';
import arventoService from '../../services/arventoService';

const VehicleWorkingReportModal = ({ isOpen, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [reports, setReports] = useState([]);
  
  // Filtre state'leri
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [deviceNo, setDeviceNo] = useState('');
  const [vehicleGroup, setVehicleGroup] = useState('');

  // Bugünün tarihini YYYY-MM-DD formatında al
  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  // Son 7 günün başlangıç tarihini al
  const getLastWeekDate = () => {
    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);
    return lastWeek.toISOString().split('T')[0];
  };

  // Rapor getir
  const handleFetchReport = async () => {
    try {
      setLoading(true);
      setError('');

      if (!startDate || !endDate) {
        setError('Lütfen başlangıç ve bitiş tarihlerini seçiniz');
        return;
      }

      const params = {
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        node: deviceNo || undefined,
        group: vehicleGroup || undefined
      };

      const result = await arventoService.getWorkingReport(params);

      if (result.success) {
        setReports(result.data);
        if (result.data.length === 0) {
          setError('Seçilen kriterlere uygun rapor bulunamadı');
        }
      } else {
        setError(result.message || 'Rapor alınırken hata oluştu');
      }
    } catch (err) {
      console.error('Error fetching report:', err);
      setError(err.message || 'Rapor alınırken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  // Export to Excel
  const handleExportToExcel = () => {
    if (reports.length === 0) {
      alert('Dışa aktarılacak veri yok');
      return;
    }

    // CSV formatında veri hazırla
    const headers = [
      'Kayıt No',
      'Cihaz No',
      'Plaka',
      'Sürücü',
      'Tarih',
      'Kontak Açık Kalma Süresi',
      'Rölanti Süresi',
      'Hareket Süresi',
      'Duraklama Süresi',
      'Mesafe (km)',
      'Maksimum Hız',
      'Ortalama Hız'
    ];

    const rows = reports.map(report => [
      report.recordNo || '',
      report.deviceNo || '',
      report.licensePlate || '',
      report.driver || '',
      report.date || '',
      report.ignitionOnTime || '',
      report.idlingTime || '',
      report.movingTime || '',
      report.standStillTime || '',
      report.distance || '',
      report.maxSpeed || '',
      report.averageSpeed || ''
    ]);

    let csvContent = '\uFEFF'; // UTF-8 BOM
    csvContent += headers.join(';') + '\n';
    csvContent += rows.map(row => row.join(';')).join('\n');

    // Download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `arac_calisma_raporu_${new Date().getTime()}.csv`;
    link.click();
  };

  // Modal kapatıldığında state'leri temizle
  const handleClose = () => {
    setReports([]);
    setError('');
    setStartDate('');
    setEndDate('');
    setDeviceNo('');
    setVehicleGroup('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-xl modal-dialog-scrollable">
        <div className="modal-content">
          {/* Modal Header */}
          <div className="modal-header bg-danger text-white">
            <h5 className="modal-title">
              <i className="bi bi-file-earmark-bar-graph me-2"></i>
              Araç Çalışma Raporu (Arvento)
            </h5>
            <button
              type="button"
              className="btn-close btn-close-white"
              onClick={handleClose}
            ></button>
          </div>

          {/* Modal Body */}
          <div className="modal-body">
            {/* Filtre Bölümü */}
            <div className="card mb-3">
              <div className="card-body">
                <h6 className="card-title mb-3">
                  <i className="bi bi-funnel me-2"></i>
                  Filtreleme Kriterleri
                </h6>
                <div className="row g-3">
                  <div className="col-md-3">
                    <label className="form-label">Başlangıç Tarihi *</label>
                    <input
                      type="date"
                      className="form-control"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      max={getTodayDate()}
                    />
                  </div>
                  <div className="col-md-3">
                    <label className="form-label">Bitiş Tarihi *</label>
                    <input
                      type="date"
                      className="form-control"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      max={getTodayDate()}
                    />
                  </div>
                  <div className="col-md-3">
                    <label className="form-label">Cihaz No (Opsiyonel)</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Örn: 12345"
                      value={deviceNo}
                      onChange={(e) => setDeviceNo(e.target.value)}
                    />
                  </div>
                  <div className="col-md-3">
                    <label className="form-label">Araç Grubu (Opsiyonel)</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Grup adı"
                      value={vehicleGroup}
                      onChange={(e) => setVehicleGroup(e.target.value)}
                    />
                  </div>
                </div>

                <div className="d-flex gap-2 mt-3">
                  <button
                    className="btn btn-danger"
                    onClick={handleFetchReport}
                    disabled={loading || !startDate || !endDate}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2"></span>
                        Yükleniyor...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-search me-2"></i>
                        Rapor Getir
                      </>
                    )}
                  </button>

                  <button
                    className="btn btn-outline-secondary"
                    onClick={() => {
                      setStartDate(getLastWeekDate());
                      setEndDate(getTodayDate());
                    }}
                  >
                    <i className="bi bi-calendar-week me-2"></i>
                    Son 7 Gün
                  </button>

                  {reports.length > 0 && (
                    <button
                      className="btn btn-success ms-auto"
                      onClick={handleExportToExcel}
                    >
                      <i className="bi bi-file-earmark-excel me-2"></i>
                      Excel'e Aktar
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Hata Mesajı */}
            {error && (
              <div className="alert alert-warning alert-dismissible fade show" role="alert">
                <i className="bi bi-exclamation-triangle me-2"></i>
                {error}
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setError('')}
                ></button>
              </div>
            )}

            {/* Rapor Tablosu */}
            {reports.length > 0 && (
              <div className="card">
                <div className="card-body">
                  <h6 className="card-title mb-3">
                    <i className="bi bi-table me-2"></i>
                    Rapor Sonuçları ({reports.length} kayıt)
                  </h6>
                  <div className="table-responsive">
                    <table className="table table-hover table-bordered">
                      <thead className="table-light">
                        <tr>
                          <th style={{ width: '60px' }}>No</th>
                          <th>Plaka</th>
                          <th>Sürücü</th>
                          <th>Tarih</th>
                          <th className="text-center">Kontak Açık</th>
                          <th className="text-center">Rölanti</th>
                          <th className="text-center">Hareket</th>
                          <th className="text-center">Duraklama</th>
                          <th className="text-end">Mesafe (km)</th>
                          <th className="text-end">Max Hız</th>
                          <th className="text-end">Ort. Hız</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reports.map((report, index) => (
                          <tr key={index}>
                            <td>{index + 1}</td>
                            <td>
                              <span className="badge bg-primary">{report.licensePlate || '-'}</span>
                            </td>
                            <td>{report.driver || '-'}</td>
                            <td>
                              <small>{report.date || '-'}</small>
                            </td>
                            <td className="text-center">
                              <small className="text-muted">{report.ignitionOnTime || '-'}</small>
                            </td>
                            <td className="text-center">
                              <small className="text-muted">{report.idlingTime || '-'}</small>
                            </td>
                            <td className="text-center">
                              <small className="text-muted">{report.movingTime || '-'}</small>
                            </td>
                            <td className="text-center">
                              <small className="text-muted">{report.standStillTime || '-'}</small>
                            </td>
                            <td className="text-end">
                              {report.distance ? report.distance.toFixed(2) : '-'}
                            </td>
                            <td className="text-end">
                              {report.maxSpeed ? report.maxSpeed.toFixed(0) : '-'}
                            </td>
                            <td className="text-end">
                              {report.averageSpeed ? report.averageSpeed.toFixed(0) : '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Boş Durum */}
            {!loading && reports.length === 0 && !error && (
              <div className="text-center py-5">
                <i className="bi bi-inbox display-1 text-muted"></i>
                <p className="mt-3 text-muted">
                  Rapor getirmek için yukarıdaki filtreleri doldurun ve "Rapor Getir" butonuna tıklayın
                </p>
              </div>
            )}
          </div>

          {/* Modal Footer */}
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={handleClose}>
              Kapat
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VehicleWorkingReportModal;