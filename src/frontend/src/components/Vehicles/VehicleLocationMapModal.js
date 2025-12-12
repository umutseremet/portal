// src/frontend/src/components/Vehicles/VehicleLocationMapModal.js

import React, { useState, useEffect, useRef } from 'react';
import arventoService from '../../services/arventoService';

const VehicleLocationMapModal = ({ isOpen, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [vehicles, setVehicles] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(false);
  const refreshIntervalRef = useRef(null);

  // Araç listesini getir
  const fetchVehicles = async () => {
    try {
      setLoading(true);
      setError('');

      const result = await arventoService.getVehicleStatus();

      if (result.success) {
        setVehicles(result.data);
        
        // İlk araç seçili olsun
        if (result.data.length > 0 && !selectedVehicle) {
          setSelectedVehicle(result.data[0]);
        }
      } else {
        setError(result.message || 'Araç konumları alınırken hata oluştu');
      }
    } catch (err) {
      console.error('Error fetching vehicles:', err);
      setError(err.message || 'Araç konumları alınırken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  // İlk yüklemede araçları getir
  useEffect(() => {
    if (isOpen) {
      fetchVehicles();
    }
  }, [isOpen]);

  // Otomatik yenileme
  useEffect(() => {
    if (autoRefresh && isOpen) {
      // Her 30 saniyede bir yenile
      refreshIntervalRef.current = setInterval(() => {
        fetchVehicles();
      }, 30000);
    }

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [autoRefresh, isOpen]);

  // Araç seç
  const handleSelectVehicle = (vehicle) => {
    setSelectedVehicle(vehicle);
  };

  // Arama filtresi
  const filteredVehicles = vehicles.filter(vehicle => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      (vehicle.deviceNo && vehicle.deviceNo.toLowerCase().includes(searchLower)) ||
      (vehicle.address && vehicle.address.toLowerCase().includes(searchLower))
    );
  });

  // Modal kapatıldığında temizlik
  const handleClose = () => {
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current);
    }
    setVehicles([]);
    setSelectedVehicle(null);
    setSearchTerm('');
    setAutoRefresh(false);
    setError('');
    onClose();
  };

  // Haritada göster
  const openInGoogleMaps = (latitude, longitude) => {
    if (latitude && longitude) {
      window.open(`https://www.google.com/maps?q=${latitude},${longitude}`, '_blank');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-xl modal-dialog-scrollable">
        <div className="modal-content">
          {/* Modal Header */}
          <div className="modal-header bg-danger text-white">
            <h5 className="modal-title">
              <i className="bi bi-geo-alt me-2"></i>
              Araç Konumları (Arvento)
            </h5>
            <button
              type="button"
              className="btn-close btn-close-white"
              onClick={handleClose}
            ></button>
          </div>

          {/* Modal Body */}
          <div className="modal-body p-0">
            <div className="row g-0" style={{ height: '70vh' }}>
              {/* Sol Panel - Araç Listesi */}
              <div className="col-md-4 border-end">
                <div className="p-3">
                  {/* Arama ve Yenileme */}
                  <div className="mb-3">
                    <div className="input-group mb-2">
                      <span className="input-group-text">
                        <i className="bi bi-search"></i>
                      </span>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Cihaz No veya Adres ara..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                    <div className="d-flex gap-2">
                      <button
                        className="btn btn-sm btn-danger flex-fill"
                        onClick={fetchVehicles}
                        disabled={loading}
                      >
                        {loading ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-1"></span>
                            Yükleniyor...
                          </>
                        ) : (
                          <>
                            <i className="bi bi-arrow-clockwise me-1"></i>
                            Yenile
                          </>
                        )}
                      </button>
                      <div className="form-check form-switch d-flex align-items-center">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id="autoRefresh"
                          checked={autoRefresh}
                          onChange={(e) => setAutoRefresh(e.target.checked)}
                        />
                        <label className="form-check-label ms-2" htmlFor="autoRefresh" style={{ fontSize: '0.85rem' }}>
                          Otomatik Yenile
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Hata Mesajı */}
                  {error && (
                    <div className="alert alert-warning alert-sm" role="alert">
                      <small>{error}</small>
                    </div>
                  )}

                  {/* Araç Sayısı */}
                  <div className="mb-2">
                    <small className="text-muted">
                      {filteredVehicles.length} araç listeleniyor
                    </small>
                  </div>

                  {/* Araç Listesi */}
                  <div style={{ maxHeight: 'calc(70vh - 180px)', overflowY: 'auto' }}>
                    {filteredVehicles.length === 0 ? (
                      <div className="text-center py-4">
                        <i className="bi bi-inbox display-4 text-muted"></i>
                        <p className="text-muted mt-2">
                          {searchTerm ? 'Araç bulunamadı' : 'Henüz araç yok'}
                        </p>
                      </div>
                    ) : (
                      <div className="list-group">
                        {filteredVehicles.map((vehicle, index) => (
                          <button
                            key={index}
                            type="button"
                            className={`list-group-item list-group-item-action ${
                              selectedVehicle?.deviceNo === vehicle.deviceNo ? 'active' : ''
                            }`}
                            onClick={() => handleSelectVehicle(vehicle)}
                          >
                            <div className="d-flex w-100 justify-content-between">
                              <h6 className="mb-1">
                                <i className="bi bi-truck me-2"></i>
                                Cihaz: {vehicle.deviceNo || 'N/A'}
                              </h6>
                              {vehicle.speed !== null && (
                                <small>
                                  <i className="bi bi-speedometer2 me-1"></i>
                                  {Math.round(vehicle.speed)} km/h
                                </small>
                              )}
                            </div>
                            <p className="mb-1">
                              <small>
                                <i className="bi bi-geo-alt me-1"></i>
                                {vehicle.address || 'Adres bilgisi yok'}
                              </small>
                            </p>
                            {vehicle.dateTime && (
                              <small className="text-muted">
                                <i className="bi bi-clock me-1"></i>
                                {new Date(vehicle.dateTime).toLocaleString('tr-TR')}
                              </small>
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Sağ Panel - Harita Alanı */}
              <div className="col-md-8">
                {selectedVehicle ? (
                  <div className="p-3 h-100 d-flex flex-column">
                    {/* Seçili Araç Bilgileri */}
                    <div className="card mb-3">
                      <div className="card-body">
                        <h6 className="card-title mb-3">
                          <i className="bi bi-info-circle me-2"></i>
                          Araç Detayları
                        </h6>
                        <div className="row">
                          <div className="col-md-6">
                            <p className="mb-2">
                              <strong>Cihaz No:</strong> {selectedVehicle.deviceNo || '-'}
                            </p>
                            <p className="mb-2">
                              <strong>Hız:</strong> {selectedVehicle.speed ? `${Math.round(selectedVehicle.speed)} km/h` : '-'}
                            </p>
                            <p className="mb-0">
                              <strong>Tarih/Saat:</strong>{' '}
                              {selectedVehicle.dateTime
                                ? new Date(selectedVehicle.dateTime).toLocaleString('tr-TR')
                                : '-'}
                            </p>
                          </div>
                          <div className="col-md-6">
                            <p className="mb-2">
                              <strong>Enlem:</strong> {selectedVehicle.latitude?.toFixed(6) || '-'}
                            </p>
                            <p className="mb-2">
                              <strong>Boylam:</strong> {selectedVehicle.longitude?.toFixed(6) || '-'}
                            </p>
                            <p className="mb-0">
                              <strong>Bölge:</strong> {selectedVehicle.buildingRegion || '-'}
                            </p>
                          </div>
                        </div>
                        <hr />
                        <p className="mb-0">
                          <strong>Adres:</strong> {selectedVehicle.address || 'Adres bilgisi yok'}
                        </p>
                      </div>
                    </div>

                    {/* Harita İframe veya Placeholder */}
                    <div className="flex-fill border rounded overflow-hidden">
                      {selectedVehicle.latitude && selectedVehicle.longitude ? (
                        <iframe
                          title="Araç Konumu"
                          src={`https://www.google.com/maps?q=${selectedVehicle.latitude},${selectedVehicle.longitude}&output=embed`}
                          width="100%"
                          height="100%"
                          style={{ border: 0 }}
                          allowFullScreen=""
                          loading="lazy"
                          referrerPolicy="no-referrer-when-downgrade"
                        ></iframe>
                      ) : (
                        <div className="d-flex align-items-center justify-content-center h-100 bg-light">
                          <div className="text-center">
                            <i className="bi bi-map display-1 text-muted"></i>
                            <p className="text-muted mt-3">Konum bilgisi mevcut değil</p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Haritada Aç Butonu */}
                    {selectedVehicle.latitude && selectedVehicle.longitude && (
                      <div className="mt-3 text-end">
                        <button
                          className="btn btn-success"
                          onClick={() =>
                            openInGoogleMaps(selectedVehicle.latitude, selectedVehicle.longitude)
                          }
                        >
                          <i className="bi bi-box-arrow-up-right me-2"></i>
                          Google Maps'te Aç
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="d-flex align-items-center justify-content-center h-100">
                    <div className="text-center">
                      <i className="bi bi-cursor display-1 text-muted"></i>
                      <p className="text-muted mt-3">Haritada görmek için bir araç seçin</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
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

export default VehicleLocationMapModal;