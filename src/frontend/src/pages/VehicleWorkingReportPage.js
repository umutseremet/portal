// src/frontend/src/pages/VehicleWorkingReportPage.js
// ✅ MAINLAYOUT UYUMLU VERSİYON - Sol menü görünür

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import arventoService from '../services/arventoService';
import { useToast } from '../contexts/ToastContext';

const VehicleWorkingReportPage = () => {
  const navigate = useNavigate();
  const toast = useToast();

  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState([]);
  const [filters, setFilters] = useState({
    startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    deviceNumber: '',
    vehicleGroup: ''
  });

  // Get report
  const handleGetReport = async () => {
    try {
      setLoading(true);

      // Validate dates
      const start = new Date(filters.startDate);
      const end = new Date(filters.endDate);
      const diffDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));

      if (diffDays > 31) {
        toast.error('Tarih aralığı en fazla 31 gün olabilir');
        return;
      }

      if (start > end) {
        toast.error('Başlangıç tarihi bitiş tarihinden büyük olamaz');
        return;
      }

      const params = {
        startDate: filters.startDate,
        endDate: filters.endDate,
        language: '0' // 0=Turkish, 1=English
      };

      if (filters.deviceNumber) {
        params.node = filters.deviceNumber;
      }

      if (filters.vehicleGroup) {
        params.group = filters.vehicleGroup;
      }

      console.log('Fetching report with params:', params);

      const data = await arventoService.getWorkingReport(params);

      console.log('Report data received:', data);

      if (data && Array.isArray(data) && data.length > 0) {
        setReportData(data);
        toast.success(`${data.length} kayıt bulundu`);
      } else {
        setReportData([]);
        toast.info('Belirtilen kriterlere uygun kayıt bulunamadı');
      }
    } catch (error) {
      console.error('Report error:', error);
      toast.error('Rapor alınırken hata oluştu: ' + error.message);
      setReportData([]);
    } finally {
      setLoading(false);
    }
  };

  // Export to CSV
  const handleExportCSV = () => {
    if (!reportData || reportData.length === 0) {
      toast.warning('Dışa aktarılacak veri bulunamadı');
      return;
    }

    try {
      const headers = [
        'Kayıt No',
        'Plaka',
        'Sürücü',
        'Tarih',
        'Kontak Süresi',
        'Rölanti Süresi',
        'Hareket Süresi',
        'Durma Süresi',
        'Mesafe (km)',
        'Max Hız',
        'Ort Hız'
      ];

      const csvRows = [
        headers.join(','),
        ...reportData.map((item, index) => [
          index + 1,
          item.licensePlate || '-',
          item.driverName || '-',
          item.date || '-',
          item.ignitionTime || '-',
          item.idlingTime || '-',
          item.movementTime || '-',
          item.standstillTime || '-',
          item.distance || '-',
          item.maxSpeed || '-',
          item.averageSpeed || '-'
        ].map(field => `"${field}"`).join(','))
      ];

      const csvContent = '\uFEFF' + csvRows.join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);

      link.setAttribute('href', url);
      link.setAttribute('download', `arac-calisma-raporu-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success('Rapor CSV olarak indirildi');
    } catch (error) {
      console.error('CSV export error:', error);
      toast.error('CSV dışa aktarma sırasında hata oluştu');
    }
  };

  // Set last 7 days
  const handleLast7Days = () => {
    setFilters({
      ...filters,
      startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0]
    });
  };

  return (
    // ✅ MainLayout içinde açılacak - padding ve margin yok
    <div style={{ width: '100%', height: '100%' }}>
      {/* Page Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="h3 mb-1">
            <i className="bi bi-file-earmark-bar-graph me-2 text-danger"></i>
            Araç Çalışma Raporu (Arvento)
          </h2>
          <p className="text-muted mb-0">
            Araçların çalışma sürelerini ve detaylarını görüntüleyin
          </p>
        </div>
        <button 
          className="btn btn-outline-secondary"
          onClick={() => navigate('/vehicles')}
        >
          <i className="bi bi-arrow-left me-2"></i>
          Geri Dön
        </button>
      </div>

      {/* Filters Card */}
      <div className="card shadow-sm mb-4">
        <div className="card-header bg-light">
          <h5 className="mb-0">
            <i className="bi bi-funnel me-2"></i>
            Filtreler
          </h5>
        </div>
        <div className="card-body">
          <div className="row g-3">
            {/* Start Date */}
            <div className="col-md-3">
              <label className="form-label fw-medium">
                Başlangıç Tarihi <span className="text-danger">*</span>
              </label>
              <input
                type="date"
                className="form-control"
                value={filters.startDate}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                max={filters.endDate}
              />
            </div>

            {/* End Date */}
            <div className="col-md-3">
              <label className="form-label fw-medium">
                Bitiş Tarihi <span className="text-danger">*</span>
              </label>
              <input
                type="date"
                className="form-control"
                value={filters.endDate}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                min={filters.startDate}
                max={new Date().toISOString().split('T')[0]}
              />
            </div>

            {/* Device Number */}
            <div className="col-md-3">
              <label className="form-label fw-medium">
                Cihaz Numarası <small className="text-muted">(opsiyonel)</small>
              </label>
              <input
                type="text"
                className="form-control"
                placeholder="Cihaz numarası"
                value={filters.deviceNumber}
                onChange={(e) => setFilters({ ...filters, deviceNumber: e.target.value })}
              />
            </div>

            {/* Vehicle Group */}
            <div className="col-md-3">
              <label className="form-label fw-medium">
                Araç Grubu <small className="text-muted">(opsiyonel)</small>
              </label>
              <input
                type="text"
                className="form-control"
                placeholder="Araç grubu"
                value={filters.vehicleGroup}
                onChange={(e) => setFilters({ ...filters, vehicleGroup: e.target.value })}
              />
            </div>

            {/* Actions */}
            <div className="col-12">
              <div className="d-flex gap-2">
                <button
                  className="btn btn-danger"
                  onClick={handleGetReport}
                  disabled={loading}
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
                  onClick={handleLast7Days}
                  disabled={loading}
                >
                  <i className="bi bi-calendar-week me-2"></i>
                  Son 7 Gün
                </button>

                {reportData.length > 0 && (
                  <button
                    className="btn btn-success"
                    onClick={handleExportCSV}
                  >
                    <i className="bi bi-file-earmark-excel me-2"></i>
                    CSV İndir
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Info Alert */}
          <div className="alert alert-info mt-3 mb-0">
            <i className="bi bi-info-circle me-2"></i>
            <strong>Bilgi:</strong> Tarih aralığı en fazla 31 gün olabilir.
          </div>
        </div>
      </div>

      {/* Results Card */}
      {reportData.length > 0 && (
        <div className="card shadow-sm">
          <div className="card-header bg-light">
            <h5 className="mb-0">
              <i className="bi bi-table me-2"></i>
              Rapor Sonuçları ({reportData.length} kayıt)
            </h5>
          </div>
          <div className="card-body">
            <div className="table-responsive">
              <table className="table table-hover table-striped">
                <thead className="table-light">
                  <tr>
                    <th>No</th>
                    <th>Plaka</th>
                    <th>Sürücü</th>
                    <th>Tarih</th>
                    <th>Kontak Süresi</th>
                    <th>Rölanti Süresi</th>
                    <th>Hareket Süresi</th>
                    <th>Durma Süresi</th>
                    <th>Mesafe (km)</th>
                    <th>Max Hız</th>
                    <th>Ort Hız</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.map((item, index) => (
                    <tr key={index}>
                      <td>{index + 1}</td>
                      <td>
                        <span className="badge bg-primary">{item.licensePlate || '-'}</span>
                      </td>
                      <td>{item.driverName || '-'}</td>
                      <td>
                        <small>{item.date || '-'}</small>
                      </td>
                      <td>{item.ignitionTime || '-'}</td>
                      <td>{item.idlingTime || '-'}</td>
                      <td>{item.movementTime || '-'}</td>
                      <td>{item.standstillTime || '-'}</td>
                      <td>
                        <strong>{item.distance || '-'}</strong>
                      </td>
                      <td>
                        <span className="badge bg-danger">{item.maxSpeed || '-'}</span>
                      </td>
                      <td>
                        <span className="badge bg-success">{item.averageSpeed || '-'}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && reportData.length === 0 && (
        <div className="card shadow-sm">
          <div className="card-body text-center py-5">
            <i className="bi bi-file-earmark-bar-graph display-1 text-muted"></i>
            <p className="mt-3 text-muted">
              Henüz rapor alınmadı. Yukarıdaki filtrelerden tarih seçerek rapor alabilirsiniz.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default VehicleWorkingReportPage;