// src/frontend/src/pages/VehicleFuelPurchasesPage.js

import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import apiService from '../services/api';

const VehicleFuelPurchasesPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const vehicleData = location.state?.vehicle;

  const [fuelPurchases, setFuelPurchases] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 25,
    totalCount: 0,
    totalPages: 0
  });

  // Yakıt alım verilerini yükle
  useEffect(() => {
    if (vehicleData?.id) {
      loadFuelPurchases();
    }
  }, [vehicleData, pagination.page]);

  const loadFuelPurchases = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiService.getVehicleFuelPurchases(vehicleData.id, {
        page: pagination.page,
        pageSize: pagination.pageSize
      });

      console.log('Fuel purchases response:', response);

      setFuelPurchases(response.data || []);
      setPagination({
        page: response.page || 1,
        pageSize: response.pageSize || 25,
        totalCount: response.totalCount || 0,
        totalPages: response.totalPages || 0
      });
    } catch (err) {
      console.error('Error loading fuel purchases:', err);
      setError(err.message || 'Yakıt alım verileri yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      return new Date(dateString).toLocaleDateString('tr-TR');
    } catch {
      return '-';
    }
  };

  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return '-';
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY'
    }).format(amount);
  };

  const formatNumber = (num) => {
    if (!num && num !== 0) return '-';
    return new Intl.NumberFormat('tr-TR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(num);
  };

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const handleBack = () => {
    navigate(-1);
  };

  if (!vehicleData) {
    return (
      <div className="container-fluid py-4">
        <div className="alert alert-warning">
          <i className="bi bi-exclamation-triangle me-2"></i>
          Araç bilgisi bulunamadı. Lütfen araç listesinden tekrar seçin.
        </div>
        <button className="btn btn-secondary" onClick={handleBack}>
          <i className="bi bi-arrow-left me-2"></i>
          Geri Dön
        </button>
      </div>
    );
  }

  return (
    <div className="container-fluid py-4">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="mb-2">
            <i className="bi bi-fuel-pump-fill text-danger me-2"></i>
            Yakıt Alım Bilgileri
          </h2>
          <div className="text-muted">
            <strong>{vehicleData.brand} {vehicleData.model}</strong>
            <span className="mx-2">•</span>
            <span className="badge bg-primary">{vehicleData.licensePlate}</span>
          </div>
        </div>
        <button className="btn btn-secondary" onClick={handleBack}>
          <i className="bi bi-arrow-left me-2"></i>
          Geri Dön
        </button>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="alert alert-danger alert-dismissible fade show" role="alert">
          <i className="bi bi-exclamation-triangle me-2"></i>
          {error}
          <button type="button" className="btn-close" onClick={() => setError(null)}></button>
        </div>
      )}

      {/* Statistics Cards */}
      <div className="row g-3 mb-4">
        <div className="col-md-3">
          <div className="card bg-primary bg-opacity-10 border-primary">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="text-muted mb-1">Toplam Alım</h6>
                  <h3 className="mb-0">{pagination.totalCount}</h3>
                </div>
                <i className="bi bi-fuel-pump fs-1 text-primary opacity-50"></i>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card bg-success bg-opacity-10 border-success">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="text-muted mb-1">Toplam Litre</h6>
                  <h3 className="mb-0">
                    {formatNumber(
                      fuelPurchases.reduce((sum, p) => sum + (p.quantity || 0), 0)
                    )}
                  </h3>
                </div>
                <i className="bi bi-droplet-fill fs-1 text-success opacity-50"></i>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card bg-warning bg-opacity-10 border-warning">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="text-muted mb-1">Toplam Tutar</h6>
                  <h3 className="mb-0">
                    {formatCurrency(
                      fuelPurchases.reduce((sum, p) => sum + (p.netAmount || 0), 0)
                    )}
                  </h3>
                </div>
                <i className="bi bi-cash-stack fs-1 text-warning opacity-50"></i>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card bg-info bg-opacity-10 border-info">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="text-muted mb-1">Ortalama Fiyat</h6>
                  <h3 className="mb-0">
                    {formatCurrency(
                      fuelPurchases.length > 0
                        ? fuelPurchases.reduce((sum, p) => sum + (p.unitPrice || 0), 0) / fuelPurchases.length
                        : 0
                    )}
                  </h3>
                </div>
                <i className="bi bi-graph-up fs-1 text-info opacity-50"></i>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Card */}
      <div className="card shadow-sm">
        <div className="card-header bg-light">
          <h5 className="mb-0">
            <i className="bi bi-list-ul me-2"></i>
            Yakıt Alım Listesi
          </h5>
        </div>
        <div className="card-body p-0">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-danger" role="status">
                <span className="visually-hidden">Yükleniyor...</span>
              </div>
              <p className="text-muted mt-2">Yakıt alım verileri yükleniyor...</p>
            </div>
          ) : fuelPurchases.length === 0 ? (
            <div className="text-center py-5">
              <i className="bi bi-inbox fs-1 text-muted mb-3"></i>
              <p className="text-muted">Bu araç için yakıt alım kaydı bulunamadı.</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover table-striped mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Tarih</th>
                    <th>İstasyon</th>
                    <th>Şehir</th>
                    <th>Yakıt Türü</th>
                    <th className="text-end">Miktar (L)</th>
                    <th className="text-end">Birim Fiyat</th>
                    <th className="text-end">Toplam Tutar</th>
                    <th className="text-end">KM</th>
                    <th>Fatura No</th>
                  </tr>
                </thead>
                <tbody>
                  {fuelPurchases.map((purchase) => (
                    <tr key={purchase.id}>
                      <td>
                        <span className="badge bg-secondary">
                          {formatDate(purchase.purchaseDate)}
                        </span>
                      </td>
                      <td>
                        <strong>{purchase.station}</strong>
                        {purchase.stationCode && (
                          <small className="text-muted d-block">
                            {purchase.stationCode}
                          </small>
                        )}
                      </td>
                      <td>{purchase.city}</td>
                      <td>
                        <span className="badge bg-info">
                          {purchase.fuelType}
                        </span>
                      </td>
                      <td className="text-end">
                        <strong>{formatNumber(purchase.quantity)}</strong>
                      </td>
                      <td className="text-end">
                        {formatCurrency(purchase.unitPrice)}
                      </td>
                      <td className="text-end">
                        <strong className="text-success">
                          {formatCurrency(purchase.netAmount)}
                        </strong>
                      </td>
                      <td className="text-end">
                        {purchase.mileage ? (
                          <span className="badge bg-dark">
                            {formatNumber(purchase.mileage)}
                          </span>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td>
                        <small className="text-muted">
                          {purchase.invoiceNumber || '-'}
                        </small>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination */}
        {!loading && fuelPurchases.length > 0 && pagination.totalPages > 1 && (
          <div className="card-footer bg-light">
            <div className="d-flex justify-content-between align-items-center">
              <div className="text-muted">
                Toplam <strong>{pagination.totalCount}</strong> kayıt
                (Sayfa <strong>{pagination.page}</strong> / <strong>{pagination.totalPages}</strong>)
              </div>
              <nav>
                <ul className="pagination pagination-sm mb-0">
                  <li className={`page-item ${pagination.page === 1 ? 'disabled' : ''}`}>
                    <button
                      className="page-link"
                      onClick={() => handlePageChange(pagination.page - 1)}
                      disabled={pagination.page === 1}
                    >
                      <i className="bi bi-chevron-left"></i>
                    </button>
                  </li>
                  
                  {[...Array(pagination.totalPages)].map((_, index) => {
                    const pageNum = index + 1;
                    // Show first, last, current, and adjacent pages
                    if (
                      pageNum === 1 ||
                      pageNum === pagination.totalPages ||
                      (pageNum >= pagination.page - 1 && pageNum <= pagination.page + 1)
                    ) {
                      return (
                        <li
                          key={pageNum}
                          className={`page-item ${pagination.page === pageNum ? 'active' : ''}`}
                        >
                          <button
                            className="page-link"
                            onClick={() => handlePageChange(pageNum)}
                          >
                            {pageNum}
                          </button>
                        </li>
                      );
                    } else if (
                      pageNum === pagination.page - 2 ||
                      pageNum === pagination.page + 2
                    ) {
                      return (
                        <li key={pageNum} className="page-item disabled">
                          <span className="page-link">...</span>
                        </li>
                      );
                    }
                    return null;
                  })}
                  
                  <li className={`page-item ${pagination.page === pagination.totalPages ? 'disabled' : ''}`}>
                    <button
                      className="page-link"
                      onClick={() => handlePageChange(pagination.page + 1)}
                      disabled={pagination.page === pagination.totalPages}
                    >
                      <i className="bi bi-chevron-right"></i>
                    </button>
                  </li>
                </ul>
              </nav>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VehicleFuelPurchasesPage;