// src/frontend/src/pages/VehicleLocationMapPage.js
// ✅ MAINLAYOUT UYUMLU VERSİYON - Sol menü görünür

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import arventoService from '../services/arventoService';
import { useToast } from '../contexts/ToastContext';

const VehicleLocationMapPage = () => {
  const navigate = useNavigate();
  const toast = useToast();

  const [loading, setLoading] = useState(false);
  const [vehicles, setVehicles] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(false);
  const autoRefreshInterval = useRef(null);

  // Load vehicles on mount
  useEffect(() => {
    loadVehicles();
    return () => {
      if (autoRefreshInterval.current) {
        clearInterval(autoRefreshInterval.current);
      }
    };
  }, []);

  // Auto refresh
  useEffect(() => {
    if (autoRefresh) {
      autoRefreshInterval.current = setInterval(() => {
        loadVehicles(true);
      }, 30000); // 30 seconds
    } else {
      if (autoRefreshInterval.current) {
        clearInterval(autoRefreshInterval.current);
        autoRefreshInterval.current = null;
      }
    }

    return () => {
      if (autoRefreshInterval.current) {
        clearInterval(autoRefreshInterval.current);
      }
    };
  }, [autoRefresh]);

  // Load vehicles
  const loadVehicles = async (silent = false) => {
    try {
      if (!silent) setLoading(true);

      const data = await arventoService.getVehicleStatus({ language: '0' });

      if (data && Array.isArray(data) && data.length > 0) {
        setVehicles(data);
        if (!silent) {
          toast.success(`${data.length} araç yüklendi`);
        }
        
        // Auto-select first vehicle if none selected
        if (!selectedVehicle && data.length > 0) {
          setSelectedVehicle(data[0]);
        }
      } else {
        setVehicles([]);
        if (!silent) {
          toast.info('Araç bulunamadı');
        }
      }
    } catch (error) {
      console.error('Load vehicles error:', error);
      if (!silent) {
        toast.error('Araçlar yüklenirken hata oluştu: ' + error.message);
      }
    } finally {
      if (!silent) setLoading(false);
    }
  };

  // Handle vehicle selection
  const handleSelectVehicle = (vehicle) => {
    setSelectedVehicle(vehicle);
  };

  // Filter vehicles
  const filteredVehicles = vehicles.filter(vehicle =>
    vehicle.deviceNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vehicle.address?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Open in Google Maps
  const handleOpenInGoogleMaps = () => {
    if (!selectedVehicle) return;

    const url = `https://www.google.com/maps?q=${selectedVehicle.latitude},${selectedVehicle.longitude}`;
    window.open(url, '_blank');
  };

  return (
    // ✅ MainLayout içinde açılacak - padding ve margin yok
    <div style={{ width: '100%', height: '100%' }}>
      {/* Page Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="h3 mb-1">
            <i className="bi bi-geo-alt me-2 text-success"></i>
            Anlık Araç Konumları (Arvento)
          </h2>
          <p className="text-muted mb-0">
            Araçların anlık konumlarını harita üzerinde görüntüleyin
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

      {/* Main Content */}
      <div className="row">
        {/* Left Panel - Vehicle List */}
        <div className="col-md-4">
          <div className="card shadow-sm" style={{ height: '600px' }}>
            <div className="card-header bg-light">
              <div className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0">
                  <i className="bi bi-list-ul me-2"></i>
                  Araç Listesi ({vehicles.length})
                </h5>
                <div className="d-flex gap-2">
                  <button
                    className="btn btn-sm btn-outline-secondary"
                    onClick={() => loadVehicles()}
                    disabled={loading}
                    title="Yenile"
                  >
                    <i className="bi bi-arrow-clockwise"></i>
                  </button>
                  <button
                    className={`btn btn-sm ${autoRefresh ? 'btn-success' : 'btn-outline-secondary'}`}
                    onClick={() => setAutoRefresh(!autoRefresh)}
                    title="Otomatik Yenileme (30sn)"
                  >
                    <i className="bi bi-arrow-repeat"></i>
                  </button>
                </div>
              </div>
            </div>

            <div className="card-body p-0" style={{ overflowY: 'auto', height: 'calc(100% - 60px)' }}>
              {/* Search Box */}
              <div className="p-3 border-bottom">
                <div className="input-group input-group-sm">
                  <span className="input-group-text">
                    <i className="bi bi-search"></i>
                  </span>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Cihaz no veya adres ara..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  {searchTerm && (
                    <button
                      className="btn btn-outline-secondary"
                      onClick={() => setSearchTerm('')}
                    >
                      <i className="bi bi-x"></i>
                    </button>
                  )}
                </div>
              </div>

              {/* Loading State */}
              {loading && (
                <div className="text-center py-4">
                  <div className="spinner-border text-success" role="status">
                    <span className="visually-hidden">Yükleniyor...</span>
                  </div>
                  <p className="text-muted mt-2 mb-0">Araçlar yükleniyor...</p>
                </div>
              )}

              {/* Vehicle List */}
              {!loading && filteredVehicles.length > 0 && (
                <div className="list-group list-group-flush">
                  {filteredVehicles.map((vehicle, index) => (
                    <button
                      key={index}
                      className={`list-group-item list-group-item-action ${
                        selectedVehicle?.deviceNumber === vehicle.deviceNumber ? 'active' : ''
                      }`}
                      onClick={() => handleSelectVehicle(vehicle)}
                    >
                      <div className="d-flex w-100 justify-content-between align-items-start">
                        <div className="flex-grow-1">
                          <h6 className="mb-1">
                            <i className="bi bi-geo-alt-fill me-2"></i>
                            Cihaz: {vehicle.deviceNumber || 'Bilinmiyor'}
                          </h6>
                          <p className="mb-1 small">
                            <i className="bi bi-speedometer2 me-1"></i>
                            Hız: <strong>{vehicle.speed || 0} km/h</strong>
                          </p>
                          <p className="mb-0 small text-muted" style={{ fontSize: '0.75rem' }}>
                            {vehicle.address || 'Adres bilgisi yok'}
                          </p>
                        </div>
                        {selectedVehicle?.deviceNumber === vehicle.deviceNumber && (
                          <i className="bi bi-check-circle-fill text-white"></i>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Empty State */}
              {!loading && filteredVehicles.length === 0 && (
                <div className="text-center py-5">
                  <i className="bi bi-geo-alt display-1 text-muted"></i>
                  <p className="mt-3 text-muted">
                    {searchTerm ? 'Arama kriterine uygun araç bulunamadı' : 'Araç bulunamadı'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Panel - Map */}
        <div className="col-md-8">
          <div className="card shadow-sm" style={{ height: '600px' }}>
            <div className="card-header bg-light">
              <div className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0">
                  <i className="bi bi-map me-2"></i>
                  Harita Görünümü
                </h5>
                {selectedVehicle && (
                  <button
                    className="btn btn-sm btn-success"
                    onClick={handleOpenInGoogleMaps}
                  >
                    <i className="bi bi-box-arrow-up-right me-2"></i>
                    Google Maps'te Aç
                  </button>
                )}
              </div>
            </div>

            <div className="card-body p-0">
              {selectedVehicle ? (
                <>
                  {/* Vehicle Info Card */}
                  <div className="p-3 bg-light border-bottom">
                    <div className="row g-2">
                      <div className="col-md-3">
                        <small className="text-muted d-block">Cihaz No:</small>
                        <strong>{selectedVehicle.deviceNumber || '-'}</strong>
                      </div>
                      <div className="col-md-3">
                        <small className="text-muted d-block">Hız:</small>
                        <span className="badge bg-primary">{selectedVehicle.speed || 0} km/h</span>
                      </div>
                      <div className="col-md-6">
                        <small className="text-muted d-block">Konum:</small>
                        <small>{selectedVehicle.latitude}, {selectedVehicle.longitude}</small>
                      </div>
                      <div className="col-12">
                        <small className="text-muted d-block">Bölge:</small>
                        <small>{selectedVehicle.region || '-'}</small>
                      </div>
                      <div className="col-12">
                        <small className="text-muted d-block">Adres:</small>
                        <small>{selectedVehicle.address || 'Adres bilgisi yok'}</small>
                      </div>
                    </div>
                  </div>

                  {/* Google Maps Iframe */}
                  <iframe
                    title="Google Maps"
                    width="100%"
                    height="450px"
                    style={{ border: 0 }}
                    loading="lazy"
                    allowFullScreen
                    src={`https://www.google.com/maps/embed/v1/place?key=AIzaSyD5pYrH4P0KhN9JhVZNlWq8X8kQ8gM8Y8Y&q=${selectedVehicle.latitude},${selectedVehicle.longitude}&zoom=15`}
                  ></iframe>
                </>
              ) : (
                <div className="d-flex align-items-center justify-content-center h-100">
                  <div className="text-center">
                    <i className="bi bi-map display-1 text-muted"></i>
                    <p className="mt-3 text-muted">
                      Sol panelden bir araç seçerek konumunu görüntüleyin
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Info Alert */}
      {autoRefresh && (
        <div className="alert alert-success mt-3 d-flex align-items-center">
          <i className="bi bi-info-circle me-2"></i>
          <div>
            <strong>Otomatik Yenileme Aktif:</strong> Araç konumları her 30 saniyede bir otomatik olarak güncelleniyor.
          </div>
        </div>
      )}
    </div>
  );
};

export default VehicleLocationMapPage;