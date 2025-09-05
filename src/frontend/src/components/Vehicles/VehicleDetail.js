// src/frontend/src/components/Vehicles/VehicleDetail.js
import React, { useState, useEffect } from 'react';
import { vehicleService } from '../../services/vehicleService';
import { showAlert } from '../utils/alertUtils';

const VehicleDetail = ({
  vehicle,
  onBack,
  onEdit,
  onDelete
}) => {
  const [vehicleLogs, setVehicleLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('info');

  useEffect(() => {
    if (vehicle?.id && activeTab === 'logs') {
      loadVehicleLogs();
    }
  }, [vehicle?.id, activeTab]);

  /**
   * Load vehicle logs
   */
  const loadVehicleLogs = async () => {
    setLoading(true);
    try {
      const logs = await vehicleService.getVehicleLogs(vehicle.id);
      setVehicleLogs(logs);
    } catch (error) {
      console.error('Error loading vehicle logs:', error);
      showAlert('Araç kayıtları yüklenirken hata oluştu.', 'error');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Format date
   */
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  /**
   * Format date with time
   */
  const formatDateTime = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  /**
   * Get ownership type badge
   */
  const getOwnershipTypeBadge = (ownershipType) => {
    switch (ownershipType?.toLowerCase()) {
      case 'company':
        return <span className="badge bg-primary">Şirket Aracı</span>;
      case 'rental':
        return <span className="badge bg-warning">Kiralama</span>;
      default:
        return <span className="badge bg-secondary">{ownershipType || '-'}</span>;
    }
  };

  /**
   * Get service alert badges
   */
  const getServiceAlerts = () => {
    const alerts = [];
    const today = new Date();
    
    // Insurance check
    if (vehicle.insuranceExpiryDate) {
      const insuranceDate = new Date(vehicle.insuranceExpiryDate);
      const daysDiff = Math.ceil((insuranceDate - today) / (1000 * 60 * 60 * 24));
      
      if (daysDiff < 0) {
        alerts.push({ type: 'danger', text: 'Sigorta süresi dolmuş', icon: 'bi-exclamation-triangle' });
      } else if (daysDiff <= 30) {
        alerts.push({ type: 'warning', text: `Sigorta ${daysDiff} gün sonra bitiyor`, icon: 'bi-clock' });
      }
    }
    
    // Inspection check
    if (vehicle.inspectionDate) {
      const inspectionDate = new Date(vehicle.inspectionDate);
      inspectionDate.setFullYear(inspectionDate.getFullYear() + 1); // Add 1 year
      const daysDiff = Math.ceil((inspectionDate - today) / (1000 * 60 * 60 * 24));
      
      if (daysDiff < 0) {
        alerts.push({ type: 'danger', text: 'Muayene süresi dolmuş', icon: 'bi-exclamation-triangle' });
      } else if (daysDiff <= 30) {
        alerts.push({ type: 'warning', text: `Muayene ${daysDiff} gün sonra`, icon: 'bi-clock' });
      }
    }
    
    return alerts;
  };

  if (!vehicle) {
    return (
      <div className="text-center py-5">
        <i className="bi bi-car-front display-4 text-muted mb-3"></i>
        <h5 className="text-muted">Araç bulunamadı</h5>
      </div>
    );
  }

  const serviceAlerts = getServiceAlerts();

  return (
    <div className="vehicle-detail">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div className="d-flex align-items-center">
          <button
            className="btn btn-outline-secondary me-3"
            onClick={onBack}
          >
            <i className="bi bi-arrow-left me-1"></i>
            Geri
          </button>
          <div>
            <h1 className="h3 text-gray-800 mb-0">
              {vehicle.brand} {vehicle.model}
            </h1>
            <p className="text-muted mb-0">
              <strong>{vehicle.licensePlate}</strong> • {vehicle.year}
            </p>
          </div>
        </div>
        <div className="d-flex gap-2">
          <button
            className="btn btn-outline-primary"
            onClick={() => onEdit(vehicle)}
          >
            <i className="bi bi-pencil me-1"></i>
            Düzenle
          </button>
          <button
            className="btn btn-outline-danger"
            onClick={() => onDelete(vehicle)}
          >
            <i className="bi bi-trash me-1"></i>
            Sil
          </button>
        </div>
      </div>

      {/* Service Alerts */}
      {serviceAlerts.length > 0 && (
        <div className="row mb-4">
          <div className="col-12">
            {serviceAlerts.map((alert, index) => (
              <div key={index} className={`alert alert-${alert.type} d-flex align-items-center`}>
                <i className={`${alert.icon} me-2`}></i>
                {alert.text}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Vehicle Image */}
      {vehicle.vehicleImageUrl && (
        <div className="row mb-4">
          <div className="col-12">
            <div className="card">
              <div className="card-body text-center">
                <img 
                  src={vehicle.vehicleImageUrl} 
                  alt={`${vehicle.brand} ${vehicle.model}`}
                  className="img-fluid rounded"
                  style={{ maxHeight: '400px', objectFit: 'cover' }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="card">
        <div className="card-header">
          <ul className="nav nav-tabs card-header-tabs">
            <li className="nav-item">
              <button
                className={`nav-link ${activeTab === 'info' ? 'active' : ''}`}
                onClick={() => setActiveTab('info')}
              >
                <i className="bi bi-info-circle me-2"></i>
                Genel Bilgiler
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link ${activeTab === 'technical' ? 'active' : ''}`}
                onClick={() => setActiveTab('technical')}
              >
                <i className="bi bi-gear me-2"></i>
                Teknik Bilgiler
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link ${activeTab === 'documents' ? 'active' : ''}`}
                onClick={() => setActiveTab('documents')}
              >
                <i className="bi bi-file-earmark-text me-2"></i>
                Belgeler
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link ${activeTab === 'logs' ? 'active' : ''}`}
                onClick={() => setActiveTab('logs')}
              >
                <i className="bi bi-clock-history me-2"></i>
                Kayıtlar
              </button>
            </li>
          </ul>
        </div>

        <div className="card-body">
          {/* General Info Tab */}
          {activeTab === 'info' && (
            <div className="row">
              <div className="col-md-6">
                <h5 className="mb-3">Araç Bilgileri</h5>
                <table className="table table-borderless">
                  <tbody>
                    <tr>
                      <td className="fw-medium">Plaka:</td>
                      <td><strong className="text-primary">{vehicle.licensePlate}</strong></td>
                    </tr>
                    <tr>
                      <td className="fw-medium">Marka:</td>
                      <td>{vehicle.brand}</td>
                    </tr>
                    <tr>
                      <td className="fw-medium">Model:</td>
                      <td>{vehicle.model}</td>
                    </tr>
                    <tr>
                      <td className="fw-medium">Yıl:</td>
                      <td>{vehicle.year}</td>
                    </tr>
                    <tr>
                      <td className="fw-medium">VIN:</td>
                      <td><code>{vehicle.vin}</code></td>
                    </tr>
                    <tr>
                      <td className="fw-medium">Sahiplik:</td>
                      <td>{getOwnershipTypeBadge(vehicle.ownershipType)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              
              <div className="col-md-6">
                <h5 className="mb-3">Kullanıcı Bilgileri</h5>
                <table className="table table-borderless">
                  <tbody>
                    <tr>
                      <td className="fw-medium">Şirket:</td>
                      <td>{vehicle.companyName || '-'}</td>
                    </tr>
                    <tr>
                      <td className="fw-medium">Atanan Kullanıcı:</td>
                      <td>{vehicle.assignedUserName || '-'}</td>
                    </tr>
                    <tr>
                      <td className="fw-medium">Telefon:</td>
                      <td>{vehicle.assignedUserPhone || '-'}</td>
                    </tr>
                    <tr>
                      <td className="fw-medium">Konum:</td>
                      <td>
                        <i className="bi bi-geo-alt text-muted me-1"></i>
                        {vehicle.location || '-'}
                      </td>
                    </tr>
                    <tr>
                      <td className="fw-medium">Kayıt Tarihi:</td>
                      <td>{formatDateTime(vehicle.createdAt)}</td>
                    </tr>
                    <tr>
                      <td className="fw-medium">Son Güncelleme:</td>
                      <td>{formatDateTime(vehicle.updatedAt)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Technical Info Tab */}
          {activeTab === 'technical' && (
            <div className="row">
              <div className="col-md-6">
                <h5 className="mb-3">Performans Bilgileri</h5>
                <table className="table table-borderless">
                  <tbody>
                    <tr>
                      <td className="fw-medium">Mevcut Kilometre:</td>
                      <td>
                        <span className="badge bg-info fs-6">
                          {vehicle.currentMileage?.toLocaleString('tr-TR')} km
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <td className="fw-medium">Yakıt Tüketimi:</td>
                      <td>
                        {vehicle.fuelConsumption ? `${vehicle.fuelConsumption} lt/100km` : '-'}
                      </td>
                    </tr>
                    <tr>
                      <td className="fw-medium">Lastik Durumu:</td>
                      <td>
                        {vehicle.tireCondition && (
                          <span className={`badge ${
                            vehicle.tireCondition.toLowerCase() === 'iyi' ? 'bg-success' :
                            vehicle.tireCondition.toLowerCase() === 'orta' ? 'bg-warning' : 'bg-danger'
                          }`}>
                            {vehicle.tireCondition}
                          </span>
                        )}
                      </td>
                    </tr>
                    <tr>
                      <td className="fw-medium">Son Servis:</td>
                      <td>{formatDate(vehicle.lastServiceDate)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              
              <div className="col-md-6">
                <h5 className="mb-3">Ruhsat Bilgileri</h5>
                <table className="table table-borderless">
                  <tbody>
                    <tr>
                      <td className="fw-medium">Ruhsat Bilgisi:</td>
                      <td>{vehicle.registrationInfo || '-'}</td>
                    </tr>
                    <tr>
                      <td className="fw-medium">Muayene Tarihi:</td>
                      <td>{formatDate(vehicle.inspectionDate)}</td>
                    </tr>
                    <tr>
                      <td className="fw-medium">Sigorta Şirketi:</td>
                      <td>{vehicle.insurance || '-'}</td>
                    </tr>
                    <tr>
                      <td className="fw-medium">Sigorta Bitiş:</td>
                      <td>
                        {formatDate(vehicle.insuranceExpiryDate)}
                        {vehicle.insuranceExpiryDate && (
                          <div className="mt-1">
                            {(() => {
                              const today = new Date();
                              const expiryDate = new Date(vehicle.insuranceExpiryDate);
                              const daysDiff = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
                              
                              if (daysDiff < 0) {
                                return <small className="text-danger">Süresi dolmuş</small>;
                              } else if (daysDiff <= 30) {
                                return <small className="text-warning">{daysDiff} gün kaldı</small>;
                              } else {
                                return <small className="text-success">{daysDiff} gün kaldı</small>;
                              }
                            })()}
                          </div>
                        )}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Documents Tab */}
          {activeTab === 'documents' && (
            <div className="text-center py-5">
              <i className="bi bi-file-earmark-text display-4 text-muted mb-3"></i>
              <h5 className="text-muted mb-2">Belge Yönetimi</h5>
              <p className="text-muted mb-3">
                Araç belgelerini yükleme ve yönetme özelliği yakında eklenecek
              </p>
              <div className="d-flex justify-content-center gap-2">
                <button className="btn btn-outline-primary" disabled>
                  <i className="bi bi-cloud-upload me-1"></i>
                  Belge Yükle
                </button>
                <button className="btn btn-outline-secondary" disabled>
                  <i className="bi bi-folder me-1"></i>
                  Belgeleri Görüntüle
                </button>
              </div>
            </div>
          )}

          {/* Logs Tab */}
          {activeTab === 'logs' && (
            <div>
              <h5 className="mb-3">Araç Kayıtları</h5>
              
              {loading ? (
                <div className="text-center py-4">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Yükleniyor...</span>
                  </div>
                </div>
              ) : vehicleLogs.length > 0 ? (
                <div className="timeline">
                  {vehicleLogs.map((log, index) => (
                    <div key={log.id || index} className="timeline-item">
                      <div className="timeline-marker bg-primary"></div>
                      <div className="timeline-content">
                        <div className="d-flex justify-content-between align-items-start">
                          <div>
                            <h6 className="mb-1">{log.operationType}</h6>
                            <p className="mb-1 text-muted small">{log.description}</p>
                          </div>
                          <small className="text-muted">{formatDateTime(log.operationDate)}</small>
                        </div>
                        <div className="d-flex justify-content-between text-muted small">
                          <span>{log.userName}</span>
                          <span>{log.ipAddress}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4">
                  <i className="bi bi-clock-history display-4 text-muted mb-3"></i>
                  <h5 className="text-muted mb-2">Kayıt bulunamadı</h5>
                  <p className="text-muted">
                    Bu araç için henüz herhangi bir işlem kaydı bulunmuyor
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VehicleDetail;