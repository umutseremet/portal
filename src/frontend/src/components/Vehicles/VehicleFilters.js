// src/frontend/src/components/Vehicles/VehicleFilters.js
import React, { useState } from 'react';

const VehicleFilters = ({
  filters = {},
  onFiltersChange,
  onClearFilters
}) => {
  const [localFilters, setLocalFilters] = useState(filters);

  /**
   * Handle filter input change
   */
  const handleInputChange = (field, value) => {
    const newFilters = {
      ...localFilters,
      [field]: value
    };
    setLocalFilters(newFilters);
    onFiltersChange(newFilters);
  };

  /**
   * Clear all filters
   */
  const handleClearAll = () => {
    const emptyFilters = {};
    setLocalFilters(emptyFilters);
    onClearFilters();
  };

  /**
   * Get active filter count
   */
  const getActiveFilterCount = () => {
    return Object.values(localFilters).filter(value => 
      value && value.toString().trim() !== ''
    ).length;
  };

  return (
    <div className="vehicle-filters">
      <div className="row g-3">
        {/* Search Filter */}
        <div className="col-md-4">
          <label htmlFor="search" className="form-label small fw-medium">
            <i className="bi bi-search me-1"></i>
            Genel Arama
          </label>
          <input
            type="text"
            id="search"
            className="form-control form-control-sm"
            placeholder="Plaka, marka, model ara..."
            value={localFilters.search || ''}
            onChange={(e) => handleInputChange('search', e.target.value)}
          />
          <div className="form-text">
            Plaka, marka, model veya VIN numarasında arama yapar
          </div>
        </div>

        {/* License Plate Filter */}
        <div className="col-md-4">
          <label htmlFor="licensePlate" className="form-label small fw-medium">
            <i className="bi bi-credit-card-2-front me-1"></i>
            Plaka
          </label>
          <input
            type="text"
            id="licensePlate"
            className="form-control form-control-sm"
            placeholder="34 ABC 123"
            value={localFilters.licensePlate || ''}
            onChange={(e) => handleInputChange('licensePlate', e.target.value)}
          />
        </div>

        {/* Brand Filter */}
        <div className="col-md-4">
          <label htmlFor="brand" className="form-label small fw-medium">
            <i className="bi bi-car-front me-1"></i>
            Marka
          </label>
          <select
            id="brand"
            className="form-select form-select-sm"
            value={localFilters.brand || ''}
            onChange={(e) => handleInputChange('brand', e.target.value)}
          >
            <option value="">Tüm Markalar</option>
            <option value="Toyota">Toyota</option>
            <option value="Volkswagen">Volkswagen</option>
            <option value="Ford">Ford</option>
            <option value="Mercedes-Benz">Mercedes-Benz</option>
            <option value="BMW">BMW</option>
            <option value="Audi">Audi</option>
            <option value="Hyundai">Hyundai</option>
            <option value="Kia">Kia</option>
            <option value="Nissan">Nissan</option>
            <option value="Honda">Honda</option>
            <option value="Opel">Opel</option>
            <option value="Peugeot">Peugeot</option>
            <option value="Renault">Renault</option>
            <option value="Fiat">Fiat</option>
            <option value="Skoda">Skoda</option>
            <option value="Seat">Seat</option>
            <option value="Citroen">Citroen</option>
            <option value="Mazda">Mazda</option>
            <option value="Mitsubishi">Mitsubishi</option>
            <option value="Subaru">Subaru</option>
            <option value="Isuzu">Isuzu</option>
            <option value="Iveco">Iveco</option>
            <option value="MAN">MAN</option>
            <option value="Scania">Scania</option>
            <option value="Volvo">Volvo</option>
            <option value="DAF">DAF</option>
            <option value="Diğer">Diğer</option>
          </select>
        </div>

        {/* Company Filter */}
        <div className="col-md-4">
          <label htmlFor="companyName" className="form-label small fw-medium">
            <i className="bi bi-building me-1"></i>
            Şirket
          </label>
          <input
            type="text"
            id="companyName"
            className="form-control form-control-sm"
            placeholder="Şirket adı"
            value={localFilters.companyName || ''}
            onChange={(e) => handleInputChange('companyName', e.target.value)}
          />
        </div>

        {/* Ownership Type Filter */}
        <div className="col-md-4">
          <label htmlFor="ownershipType" className="form-label small fw-medium">
            <i className="bi bi-person-check me-1"></i>
            Sahiplik Türü
          </label>
          <select
            id="ownershipType"
            className="form-select form-select-sm"
            value={localFilters.ownershipType || ''}
            onChange={(e) => handleInputChange('ownershipType', e.target.value)}
          >
            <option value="">Tümü</option>
            <option value="company">Şirket Aracı</option>
            <option value="rental">Kiralama</option>
          </select>
        </div>

        {/* Year Range Filter */}
        <div className="col-md-4">
          <label htmlFor="yearFrom" className="form-label small fw-medium">
            <i className="bi bi-calendar-range me-1"></i>
            Model Yılı
          </label>
          <div className="d-flex gap-2">
            <input
              type="number"
              id="yearFrom"
              className="form-control form-control-sm"
              placeholder="Başlangıç"
              min="1990"
              max={new Date().getFullYear() + 1}
              value={localFilters.yearFrom || ''}
              onChange={(e) => handleInputChange('yearFrom', e.target.value)}
            />
            <input
              type="number"
              id="yearTo"
              className="form-control form-control-sm"
              placeholder="Bitiş"
              min="1990"
              max={new Date().getFullYear() + 1}
              value={localFilters.yearTo || ''}
              onChange={(e) => handleInputChange('yearTo', e.target.value)}
            />
          </div>
        </div>

        {/* Assigned User Filter */}
        <div className="col-md-6">
          <label htmlFor="assignedUserName" className="form-label small fw-medium">
            <i className="bi bi-person me-1"></i>
            Atanan Kullanıcı
          </label>
          <input
            type="text"
            id="assignedUserName"
            className="form-control form-control-sm"
            placeholder="Kullanıcı adı"
            value={localFilters.assignedUserName || ''}
            onChange={(e) => handleInputChange('assignedUserName', e.target.value)}
          />
        </div>

        {/* Location Filter */}
        <div className="col-md-6">
          <label htmlFor="location" className="form-label small fw-medium">
            <i className="bi bi-geo-alt me-1"></i>
            Konum
          </label>
          <input
            type="text"
            id="location"
            className="form-control form-control-sm"
            placeholder="Şehir, ilçe"
            value={localFilters.location || ''}
            onChange={(e) => handleInputChange('location', e.target.value)}
          />
        </div>

        {/* Service Status Filters */}
        <div className="col-md-12">
          <label className="form-label small fw-medium">
            <i className="bi bi-tools me-1"></i>
            Servis Durumu
          </label>
          <div className="row g-2">
            <div className="col-md-3">
              <div className="form-check">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="inspectionDue"
                  checked={localFilters.inspectionDue || false}
                  onChange={(e) => handleInputChange('inspectionDue', e.target.checked)}
                />
                <label className="form-check-label small" htmlFor="inspectionDue">
                  Muayene Zamanı
                </label>
              </div>
            </div>
            
            <div className="col-md-3">
              <div className="form-check">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="insuranceDue"
                  checked={localFilters.insuranceDue || false}
                  onChange={(e) => handleInputChange('insuranceDue', e.target.checked)}
                />
                <label className="form-check-label small" htmlFor="insuranceDue">
                  Sigorta Bitiyor
                </label>
              </div>
            </div>
            
            <div className="col-md-3">
              <div className="form-check">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="serviceDue"
                  checked={localFilters.serviceDue || false}
                  onChange={(e) => handleInputChange('serviceDue', e.target.checked)}
                />
                <label className="form-check-label small" htmlFor="serviceDue">
                  Servis Zamanı
                </label>
              </div>
            </div>

            <div className="col-md-3">
              <div className="form-check">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="highMileage"
                  checked={localFilters.highMileage || false}
                  onChange={(e) => handleInputChange('highMileage', e.target.checked)}
                />
                <label className="form-check-label small" htmlFor="highMileage">
                  Yüksek Kilometre
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Actions */}
      <div className="d-flex justify-content-between align-items-center mt-4 pt-3 border-top">
        <div className="text-muted small">
          {getActiveFilterCount() > 0 && (
            <span>
              <i className="bi bi-funnel-fill me-1"></i>
              {getActiveFilterCount()} aktif filtre
            </span>
          )}
        </div>
        
        <div className="d-flex gap-2">
          {getActiveFilterCount() > 0 && (
            <button
              type="button"
              className="btn btn-outline-secondary btn-sm"
              onClick={handleClearAll}
            >
              <i className="bi bi-x-circle me-1"></i>
              Filtreleri Temizle
            </button>
          )}
          
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => {
              // Trigger a manual filter refresh if needed
              onFiltersChange(localFilters);
            }}
          >
            <i className="bi bi-search me-1"></i>
            Filtrele
          </button>
        </div>
      </div>
    </div>
  );
};

export default VehicleFilters;