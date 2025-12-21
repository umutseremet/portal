// src/frontend/src/pages/VehicleLocationMapPage.js
// ✅ ARAÇ LİSTESİ VE DETAYLARI GÜNCELLENMİŞ

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import arventoService from '../services/arventoService';
import { useToast } from '../contexts/ToastContext';

const VehicleLocationMapPage = () => {
  const navigate = useNavigate();
  const toast = useToast();

  const [loading, setLoading] = useState(false);
  const [vehicleMappings, setVehicleMappings] = useState([]); // ✅ Plaka-cihaz eşleşmeleri
  const [vehicleStatuses, setVehicleStatuses] = useState([]); // ✅ Konum bilgileri
  const [combinedVehicles, setCombinedVehicles] = useState([]); // ✅ Birleştirilmiş veri
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(false);
  const autoRefreshInterval = useRef(null);

  // ✅ Component mount olduğunda verileri yükle
  useEffect(() => {
    loadAllData();
    return () => {
      if (autoRefreshInterval.current) {
        clearInterval(autoRefreshInterval.current);
      }
    };
  }, []);

  // ✅ Auto refresh
  useEffect(() => {
    if (autoRefresh) {
      autoRefreshInterval.current = setInterval(() => {
        loadVehicleStatuses(true);
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

  // ✅ Tüm verileri yükle (mappings + statuses)
  const loadAllData = async () => {
    try {
      setLoading(true);

      console.log('📡 Loading all vehicle data...');

      // Paralel olarak her iki servisi de çağır
      const [mappings, statuses] = await Promise.all([
        arventoService.getVehicleMappings({ language: '0' }),
        arventoService.getVehicleStatus({ language: '0' })
      ]);

      console.log('✅ Mappings loaded:', mappings);
      console.log('✅ Statuses loaded:', statuses);

      setVehicleMappings(mappings);
      setVehicleStatuses(statuses);

      // ✅ Verileri birleştir
      combineVehicleData(mappings, statuses);

      toast.success(`${mappings.length} araç yüklendi`);
    } catch (error) {
      console.error('❌ Load all data error:', error);
      toast.error('Veriler yüklenirken hata oluştu: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Sadece konum bilgilerini yenile (auto-refresh için)
  const loadVehicleStatuses = async (silent = false) => {
    try {
      if (!silent) setLoading(true);

      const statuses = await arventoService.getVehicleStatus({ language: '0' });

      setVehicleStatuses(statuses);

      // Mevcut mappings ile birleştir
      combineVehicleData(vehicleMappings, statuses);

      if (!silent) {
        toast.success('Konum bilgileri güncellendi');
      }
    } catch (error) {
      console.error('❌ Load statuses error:', error);
      if (!silent) {
        toast.error('Konum bilgileri yüklenirken hata oluştu: ' + error.message);
      }
    } finally {
      if (!silent) setLoading(false);
    }
  };

  // ✅ Plaka-cihaz eşleşmelerini ve konum bilgilerini birleştir
  const combineVehicleData = (mappings, statuses) => {
    if (!mappings || !statuses) {
      setCombinedVehicles([]);
      return;
    }

    const combined = mappings.map(mapping => {
      // Cihaz numarasına göre konum bilgisini bul
      const status = statuses.find(s => s.deviceNo === mapping.deviceNo);

      return {
        // Mapping bilgileri
        recordNo: mapping.recordNo,
        deviceNo: mapping.deviceNo,
        licensePlate: mapping.licensePlate,
        vehicleGsmNo: mapping.vehicleGsmNo,
        notes: mapping.notes,
        load: mapping.load,
        vehicleType: mapping.vehicleType,
        vehicleBrand: mapping.vehicleBrand,
        vehicleCategory: mapping.vehicleCategory,
        vehicleModel: mapping.vehicleModel,
        createdBy: mapping.createdBy,
        createdDate: mapping.createdDate,

        // Status bilgileri (varsa)
        latitude: status?.latitude,
        longitude: status?.longitude,
        speed: status?.speed,
        address: status?.address,
        buildingRegion: status?.buildingRegion,
        lastUpdate: status?.dateTime,
        hasLocation: !!(status?.latitude && status?.longitude)
      };
    });

    console.log('✅ Combined vehicle data:', combined);

    setCombinedVehicles(combined);

    // İlk aracı otomatik seç (eğer konum bilgisi varsa)
    if (combined.length > 0 && !selectedVehicle) {
      const firstWithLocation = combined.find(v => v.hasLocation);
      if (firstWithLocation) {
        setSelectedVehicle(firstWithLocation);
      }
    }
  };

  // Handle vehicle selection
  const handleSelectVehicle = (vehicle) => {
    if (!vehicle.hasLocation) {
      toast.warning('Bu araç için konum bilgisi bulunamadı');
      return;
    }
    setSelectedVehicle(vehicle);
  };

  // Filter vehicles
  const filteredVehicles = combinedVehicles.filter(vehicle =>
    vehicle.deviceNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vehicle.licensePlate?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vehicle.vehicleBrand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vehicle.vehicleModel?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vehicle.address?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Open in Google Maps
  const handleOpenInGoogleMaps = () => {
    if (!selectedVehicle || !selectedVehicle.hasLocation) return;

    const url = `https://www.google.com/maps?q=${selectedVehicle.latitude},${selectedVehicle.longitude}`;
    window.open(url, '_blank');
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      return new Date(dateString).toLocaleString('tr-TR');
    } catch {
      return '-';
    }
  };

  return (
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
                  Araç Listesi ({combinedVehicles.length})
                </h5>
                <div className="d-flex gap-2">
                  <button
                    className="btn btn-sm btn-outline-secondary"
                    onClick={() => loadAllData()}
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
                    placeholder="Plaka, cihaz no, marka ara..."
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
                        selectedVehicle?.deviceNo === vehicle.deviceNo ? 'active' : ''
                      } ${!vehicle.hasLocation ? 'disabled' : ''}`}
                      onClick={() => handleSelectVehicle(vehicle)}
                      disabled={!vehicle.hasLocation}
                    >
                      <div className="d-flex w-100 justify-content-between align-items-start">
                        <div className="flex-grow-1">
                          {/* Plaka */}
                          <h6 className="mb-1">
                            <i className="bi bi-card-text me-2"></i>
                            <strong>{vehicle.licensePlate || 'Plaka Yok'}</strong>
                          </h6>

                          {/* Marka/Model */}
                          {(vehicle.vehicleBrand || vehicle.vehicleModel) && (
                            <p className="mb-1 small">
                              <i className="bi bi-truck me-1"></i>
                              {vehicle.vehicleBrand} {vehicle.vehicleModel}
                            </p>
                          )}

                          {/* Cihaz No */}
                          <p className="mb-1 small">
                            <i className="bi bi-cpu me-1"></i>
                            Cihaz: {vehicle.deviceNo}
                          </p>

                          {/* Hız (varsa) */}
                          {vehicle.hasLocation && (
                            <p className="mb-1 small">
                              <i className="bi bi-speedometer2 me-1"></i>
                              Hız: <strong>{vehicle.speed || 0} km/h</strong>
                            </p>
                          )}

                          {/* Konum durumu */}
                          {!vehicle.hasLocation && (
                            <p className="mb-0 small text-muted">
                              <i className="bi bi-exclamation-circle me-1"></i>
                              Konum bilgisi yok
                            </p>
                          )}
                        </div>

                        {selectedVehicle?.deviceNo === vehicle.deviceNo && (
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
                {selectedVehicle && selectedVehicle.hasLocation && (
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
              {selectedVehicle && selectedVehicle.hasLocation ? (
                <>
                  {/* Vehicle Info Card */}
                  <div className="p-3 bg-light border-bottom">
                    <div className="row g-2">
                      <div className="col-md-6">
                        <small className="text-muted d-block">Plaka:</small>
                        <strong>{selectedVehicle.licensePlate || '-'}</strong>
                      </div>
                      <div className="col-md-6">
                        <small className="text-muted d-block">Marka/Model:</small>
                        <strong>{selectedVehicle.vehicleBrand} {selectedVehicle.vehicleModel}</strong>
                      </div>
                      <div className="col-md-3">
                        <small className="text-muted d-block">Cihaz No:</small>
                        <strong>{selectedVehicle.deviceNo || '-'}</strong>
                      </div>
                      <div className="col-md-3">
                        <small className="text-muted d-block">Hız:</small>
                        <span className="badge bg-primary">{selectedVehicle.speed || 0} km/h</span>
                      </div>
                      <div className="col-md-6">
                        <small className="text-muted d-block">Son Güncelleme:</small>
                        <small>{formatDate(selectedVehicle.lastUpdate)}</small>
                      </div>
                      <div className="col-12">
                        <small className="text-muted d-block">Konum:</small>
                        <small>{selectedVehicle.latitude?.toFixed(6)}, {selectedVehicle.longitude?.toFixed(6)}</small>
                      </div>
                      {selectedVehicle.buildingRegion && (
                        <div className="col-12">
                          <small className="text-muted d-block">Bölge:</small>
                          <small>{selectedVehicle.buildingRegion}</small>
                        </div>
                      )}
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
                    src={`https://www.google.com/maps?q=${selectedVehicle.latitude},${selectedVehicle.longitude}&output=embed`}
                  ></iframe>
                </>
              ) : (
                <div className="d-flex align-items-center justify-content-center h-100">
                  <div className="text-center">
                    <i className="bi bi-map display-1 text-muted"></i>
                    <p className="mt-3 text-muted">
                      {selectedVehicle 
                        ? 'Bu araç için konum bilgisi bulunamadı' 
                        : 'Sol panelden bir araç seçerek konumunu görüntüleyin'}
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