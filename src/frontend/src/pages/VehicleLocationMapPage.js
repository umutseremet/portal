// src/frontend/src/pages/VehicleLocationMapPage.js
// ✅ TARİH FORMATI VE LİSTE DÜZENİ GÜNCELLENMİŞ

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import arventoService from '../services/arventoService';
import { useToast } from '../contexts/ToastContext';

const VehicleLocationMapPage = () => {
  const navigate = useNavigate();
  const toast = useToast();

  const [loading, setLoading] = useState(false);
  const [vehicleMappings, setVehicleMappings] = useState([]);
  const [vehicleStatuses, setVehicleStatuses] = useState([]);
  const [combinedVehicles, setCombinedVehicles] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(false);
  const autoRefreshInterval = useRef(null);

  useEffect(() => {
    loadAllData();
    return () => {
      if (autoRefreshInterval.current) {
        clearInterval(autoRefreshInterval.current);
      }
    };
  }, []);

  useEffect(() => {
    if (autoRefresh) {
      autoRefreshInterval.current = setInterval(() => {
        loadVehicleStatuses(true);
      }, 30000);
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

  const loadAllData = async () => {
    try {
      setLoading(true);
      console.log('📡 Loading all vehicle data...');

      const [mappings, statuses] = await Promise.all([
        arventoService.getVehicleMappings({ language: '0' }),
        arventoService.getVehicleStatus({ language: '0' })
      ]);

      console.log('✅ Mappings loaded:', mappings);
      console.log('✅ Statuses loaded:', statuses);

      setVehicleMappings(mappings);
      setVehicleStatuses(statuses);
      combineVehicleData(mappings, statuses);

      toast.success(`${mappings.length} araç yüklendi`);
    } catch (error) {
      console.error('❌ Load all data error:', error);
      toast.error('Veriler yüklenirken hata oluştu: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const loadVehicleStatuses = async (silent = false) => {
    try {
      if (!silent) setLoading(true);

      const statuses = await arventoService.getVehicleStatus({ language: '0' });
      setVehicleStatuses(statuses);
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

  const combineVehicleData = (mappings, statuses) => {
    if (!mappings || !statuses) {
      setCombinedVehicles([]);
      return;
    }

    console.log('🔍 Combining data - Mappings:', mappings.length, 'Statuses:', statuses.length);
    
    // İlk samples
    if (mappings.length > 0) {
      console.log('📋 First mapping - deviceNo:', mappings[0].deviceNo, 'nodeNo:', mappings[0].nodeNo);
    }
    if (statuses.length > 0) {
      console.log('📍 First status - deviceNo:', statuses[0].deviceNo, 'nodeNo:', statuses[0].nodeNo);
    }

    const combined = mappings.map(mapping => {
      // ✅ DeviceNo üzerinden eşleştir (Cihaz_x0020_No field'ı)
      const status = statuses.find(s => 
        s.deviceNo && mapping.deviceNo && 
        s.deviceNo.toString() === mapping.deviceNo.toString()
      );

      // ✅ DEBUG: Eşleşme kontrolü
      if (!status) {
        console.log('❌ No status found for deviceNo:', mapping.deviceNo, 'Plate:', mapping.licensePlate);
      } else {
        console.log('✅ Match found! deviceNo:', mapping.deviceNo, 'Lat:', status.latitude, 'Lng:', status.longitude);
      }

      const hasLocation = !!(status?.latitude && status?.longitude);

      return {
        // Mapping bilgileri
        recordNo: mapping.recordNo,
        deviceNo: mapping.deviceNo,
        licensePlate: mapping.licensePlate,
        vehicleGsmNo: mapping.vehicleGsmNo,
        notes: mapping.notes,
        load: mapping.load,
        vehicleType: mapping.vehicleType,
        nodeNo: mapping.nodeNo,
        groupNo: mapping.groupNo,
        vehicleIcon: mapping.vehicleIcon,
        driverName: mapping.driverName,
        driverPhone: mapping.driverPhone,
        vehicleModel: mapping.vehicleModel,
        deviceType: mapping.deviceType,
        
        // ✅ Status bilgileri (varsa) - SADECE GERÇEKTEKİ FIELD'LAR
        latitude: status?.latitude,
        longitude: status?.longitude,
        speed: status?.speed,
        address: status?.address,
        altitude: status?.altitude,
        lastUpdateTime: status?.lastUpdateTime,
        region: status?.region,
        locationType: status?.locationType,
        district: status?.district,
        gpsQuality: status?.gpsQuality,
        supportedDeviceCount: status?.supportedDeviceCount,
        rssiSignalStrength: status?.rssiSignalStrength,
        
        hasLocation: hasLocation
      };
    });

    console.log('✅ Combined vehicle data:', combined);
    console.log('📊 Vehicles with location:', combined.filter(v => v.hasLocation).length);
    console.log('📊 Vehicles without location:', combined.filter(v => !v.hasLocation).length);

    setCombinedVehicles(combined);

    if (combined.length > 0 && !selectedVehicle) {
      const firstWithLocation = combined.find(v => v.hasLocation);
      if (firstWithLocation) {
        console.log('🎯 Auto-selecting first vehicle with location:', firstWithLocation.licensePlate);
        setSelectedVehicle(firstWithLocation);
      } else {
        console.warn('⚠️ No vehicles with location found!');
      }
    }
  };

  const handleSelectVehicle = (vehicle) => {
    console.log('🎯 Vehicle selected:', vehicle.licensePlate, 'hasLocation:', vehicle.hasLocation);
    
    // Konum bilgisi kontrolü
    if (!vehicle.hasLocation || !vehicle.latitude || !vehicle.longitude) {
      console.warn('⚠️ Vehicle has no valid location:', vehicle);
      toast.warning(`${vehicle.licensePlate || 'Bu araç'} için konum bilgisi bulunamadı`);
      return;
    }
    
    console.log('✅ Setting selected vehicle:', vehicle.licensePlate);
    setSelectedVehicle(vehicle);
  };

  const filteredVehicles = combinedVehicles.filter(vehicle =>
    vehicle.deviceNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vehicle.licensePlate?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vehicle.vehicleModel?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vehicle.address?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenInGoogleMaps = () => {
    if (!selectedVehicle || !selectedVehicle.hasLocation) return;
    const url = `https://www.google.com/maps?q=${selectedVehicle.latitude},${selectedVehicle.longitude}`;
    window.open(url, '_blank');
  };

  // ✅ DÜZELTME: Tarih formatı - hem ISO hem Türkçe DateTime formatını destekle
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    
    try {
      // ISO formatı veya Türkçe DateTime formatı
      const date = new Date(dateString);
      
      // Geçerli tarih mi kontrol et
      if (isNaN(date.getTime())) {
        console.warn('Invalid date:', dateString);
        return '-';
      }
      
      // Türkçe format: "21.12.2025 18:41:58"
      return date.toLocaleString('tr-TR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    } catch (error) {
      console.error('Date formatting error:', error, 'Date:', dateString);
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
        {/* ✅ Left Panel - Vehicle List - YÜKSEKLİK ARTIRILDI */}
        <div className="col-md-4">
          <div className="card shadow-sm" style={{ height: '750px' }}>
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

            {/* ✅ DÜZELTME: Search Box SABİT - sticky position */}
            <div className="card-body p-0" style={{ display: 'flex', flexDirection: 'column', height: 'calc(100% - 60px)' }}>
              {/* Search Box - Sticky */}
              <div className="p-3 border-bottom bg-white" style={{ position: 'sticky', top: 0, zIndex: 10 }}>
                <div className="input-group input-group-sm">
                  <span className="input-group-text">
                    <i className="bi bi-search"></i>
                  </span>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Plaka, cihaz no, model ara..."
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

              {/* Scrollable List Area */}
              <div style={{ flex: 1, overflowY: 'auto' }}>
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
                    {filteredVehicles.map((vehicle, index) => {
                      const isSelected = selectedVehicle?.deviceNo === vehicle.deviceNo;
                      const hasValidLocation = vehicle.hasLocation && vehicle.latitude && vehicle.longitude;
                      
                      return (
                        <button
                          key={`${vehicle.deviceNo}-${index}`}
                          type="button"
                          className={`list-group-item list-group-item-action ${
                            isSelected ? 'active' : ''
                          } ${!hasValidLocation ? 'list-group-item-secondary' : ''}`}
                          onClick={() => handleSelectVehicle(vehicle)}
                          style={{ 
                            cursor: hasValidLocation ? 'pointer' : 'not-allowed',
                            opacity: hasValidLocation ? 1 : 0.6
                          }}
                        >
                          <div className="d-flex w-100 justify-content-between align-items-start">
                            <div className="flex-grow-1">
                              {/* Plaka */}
                              <h6 className="mb-1">
                                <i className="bi bi-card-text me-2"></i>
                                <strong>{vehicle.licensePlate || 'Plaka Yok'}</strong>
                                {hasValidLocation && (
                                  <span className="badge bg-success ms-2" style={{ fontSize: '0.7rem' }}>
                                    <i className="bi bi-geo-alt-fill"></i> Aktif
                                  </span>
                                )}
                              </h6>

                              {/* Model */}
                              {vehicle.vehicleModel && (
                                <p className="mb-1 small">
                                  <i className="bi bi-truck me-1"></i>
                                  {vehicle.vehicleModel}
                                </p>
                              )}

                              {/* Cihaz No */}
                              <p className="mb-1 small">
                                <i className="bi bi-cpu me-1"></i>
                                Cihaz: {vehicle.deviceNo}
                              </p>

                              {/* Hız (varsa) */}
                              {hasValidLocation && (
                                <p className="mb-1 small">
                                  <i className="bi bi-speedometer2 me-1"></i>
                                  Hız: <strong>{vehicle.speed || 0} km/h</strong>
                                </p>
                              )}

                              {/* Konum durumu */}
                              {!hasValidLocation && (
                                <p className="mb-0 small text-muted">
                                  <i className="bi bi-exclamation-circle me-1"></i>
                                  Konum bilgisi yok
                                </p>
                              )}
                            </div>

                            {isSelected && (
                              <i className="bi bi-check-circle-fill"></i>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Empty State */}
                {!loading && filteredVehicles.length === 0 && (
                  <div className="text-center py-5">
                    <i className="bi bi-geo-alt display-1 text-muted"></i>
                    <p className="mt-3 text-muted">
                      {searchTerm ? 'Arama sonucu bulunamadı' : 'Araç bulunamadı'}
                    </p>
                  </div>
                )}

                {/* Error State */}
                {!loading && combinedVehicles.length === 0 && !searchTerm && (
                  <div className="text-center py-5">
                    <i className="bi bi-exclamation-triangle display-1 text-warning"></i>
                    <p className="mt-3 text-muted">
                      Arvento'dan araç verisi alınamadı
                    </p>
                    <button 
                      className="btn btn-primary btn-sm"
                      onClick={() => loadAllData()}
                    >
                      <i className="bi bi-arrow-clockwise me-2"></i>
                      Tekrar Dene
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ✅ Right Panel - Map - YÜKSEKLİK ARTIRILDI */}
        <div className="col-md-8">
          <div className="card shadow-sm" style={{ height: '750px' }}>
            <div className="card-header bg-light">
              <h5 className="mb-0">
                <i className="bi bi-map me-2"></i>
                {selectedVehicle ? `${selectedVehicle.licensePlate} - Konum Bilgisi` : 'Araç Konumu'}
              </h5>
            </div>

            <div className="card-body p-0" style={{ height: 'calc(100% - 60px)' }}>
              {selectedVehicle && selectedVehicle.hasLocation ? (
                <>
                  {/* Vehicle Details */}
                  <div className="p-3 bg-light border-bottom">
                    <div className="row g-3">
                      <div className="col-md-4">
                        <small className="text-muted d-block">Plaka:</small>
                        <strong>{selectedVehicle.licensePlate || '-'}</strong>
                      </div>
                      <div className="col-md-4">
                        <small className="text-muted d-block">Hız:</small>
                        <span className="badge bg-primary">{selectedVehicle.speed || 0} km/h</span>
                      </div>
                      <div className="col-md-4">
                        <small className="text-muted d-block">Yükseklik:</small>
                        <span className="badge bg-info">{selectedVehicle.altitude || 0} m</span>
                      </div>
                      
                      {/* Son Güncelleme Tarihi */}
                      <div className="col-md-6">
                        <small className="text-muted d-block">Son Güncelleme:</small>
                        <small><strong>{formatDate(selectedVehicle.lastUpdateTime)}</strong></small>
                      </div>
                      
                      <div className="col-md-6">
                        <small className="text-muted d-block">Konum:</small>
                        <small>{selectedVehicle.latitude?.toFixed(6)}, {selectedVehicle.longitude?.toFixed(6)}</small>
                      </div>
                      
                      {/* İl / İlçe */}
                      {(selectedVehicle.locationType || selectedVehicle.district) && (
                        <div className="col-md-6">
                          <small className="text-muted d-block">İl / İlçe:</small>
                          <small>{selectedVehicle.locationType} / {selectedVehicle.district}</small>
                        </div>
                      )}
                      
                      {/* GPS Kalitesi */}
                      {selectedVehicle.gpsQuality > 0 && (
                        <div className="col-md-6">
                          <small className="text-muted d-block">GPS Uydu Sayısı:</small>
                          <small>{selectedVehicle.gpsQuality}</small>
                        </div>
                      )}
                      
                      {/* Bölge */}
                      {selectedVehicle.region && (
                        <div className="col-12">
                          <small className="text-muted d-block">Bölge:</small>
                          <small>{selectedVehicle.region}</small>
                        </div>
                      )}
                      
                      {/* Adres */}
                      {selectedVehicle.address && (
                        <div className="col-12">
                          <small className="text-muted d-block">Adres:</small>
                          <small>{selectedVehicle.address}</small>
                        </div>
                      )}
                      
                      <div className="col-12">
                        <button 
                          className="btn btn-sm btn-outline-primary w-100"
                          onClick={handleOpenInGoogleMaps}
                        >
                          <i className="bi bi-geo-alt me-2"></i>
                          Google Maps'te Aç
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Google Maps Iframe */}
                  <iframe
                    title="Google Maps"
                    width="100%"
                    height="100%"
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