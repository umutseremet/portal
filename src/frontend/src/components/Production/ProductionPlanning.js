import React, { useState, useEffect } from 'react';
import ProductionList from './ProductionList';

const ProductionPlanning = () => {
  const [activeFilter, setActiveFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [selectedDateRange, setSelectedDateRange] = useState('');
  const [showNewOrderModal, setShowNewOrderModal] = useState(false);

  const [stats, setStats] = useState({
    totalOrders: 568,
    productionCapacity: 85,
    completed: 342,
    pending: 226
  });

  const filters = [
    { id: 'all', label: 'Tümü', count: 568 },
    { id: 'active', label: 'Aktif', count: 234 },
    { id: 'completed', label: 'Tamamlanan', count: 342 },
    { id: 'cancelled', label: 'İptal', count: 12 }
  ];

  const locations = [
    { value: '', label: 'Tüm Lokasyonlar' },
    { value: 'jakarta', label: 'Jakarta, Indonesia' },
    { value: 'medan', label: 'Medan, Indonesia' },
    { value: 'sydney', label: 'Sydney, Australia' },
    { value: 'london', label: 'London, UK' },
    { value: 'penang', label: 'Penang, Malaysia' }
  ];

  const dateRanges = [
    { value: '', label: 'Tarih Aralığı' },
    { value: 'today', label: 'Bugün' },
    { value: 'week', label: 'Bu Hafta' },
    { value: 'month', label: 'Bu Ay' },
    { value: 'quarter', label: 'Bu Çeyrek' }
  ];

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => {
      setLoading(false);
    }, 800);

    return () => clearTimeout(timer);
  }, []);

  const handleFilterChange = (filterId) => {
    setActiveFilter(filterId);
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleExport = () => {
    // Simulate export functionality
    alert('Rapor dışa aktarılıyor...');
  };

  const handleNewOrder = () => {
    setShowNewOrderModal(true);
  };

  if (loading) {
    return (
      <div className="production-loading">
        <div className="container-fluid">
          <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
            <div className="text-center">
              <div className="spinner-border text-danger mb-3" style={{ width: '3rem', height: '3rem' }}>
                <span className="visually-hidden">Loading...</span>
              </div>
              <h5 className="text-muted">Üretim verileri yükleniyor...</h5>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="production-planning">
      <div className="container-fluid">
        {/* Page Header */}
        <div className="row mb-4">
          <div className="col-12">
            <div className="d-flex justify-content-between align-items-start flex-wrap">
              <div className="page-header mb-3 mb-md-0">
                <h2 className="page-title mb-2">Üretim Planlama</h2>
                <p className="page-subtitle text-muted">
                  Üretim süreçlerini planlayın ve yönetin
                </p>
              </div>
              <div className="page-actions d-flex gap-2">
                <button 
                  className="btn btn-outline-secondary"
                  onClick={handleExport}
                >
                  <i className="bi bi-download me-1"></i>
                  Dışa Aktar
                </button>
                <button 
                  className="btn btn-danger"
                  onClick={handleNewOrder}
                >
                  <i className="bi bi-plus-lg me-1"></i>
                  Yeni Sipariş
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="row g-4 mb-4">
          <div className="col-xl-3 col-lg-6 col-md-6">
            <div className="stats-card">
              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <p className="card-category text-muted">Toplam Sipariş</p>
                  <h3 className="card-title mb-0">{stats.totalOrders}</h3>
                  <p className="card-subtitle text-muted small">Based your preferences</p>
                </div>
                <div className="stats-icon bg-primary">
                  <i className="bi bi-box-seam text-white"></i>
                </div>
              </div>
            </div>
          </div>
          
          <div className="col-xl-3 col-lg-6 col-md-6">
            <div className="stats-card">
              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <p className="card-category text-muted">Üretim Kapasitesi</p>
                  <h3 className="card-title mb-0">{stats.productionCapacity}%</h3>
                  <p className="card-change text-success mb-0">
                    <i className="bi bi-arrow-up me-1"></i>12%
                  </p>
                </div>
                <div className="stats-icon bg-success">
                  <i className="bi bi-speedometer2 text-white"></i>
                </div>
              </div>
            </div>
          </div>

          <div className="col-xl-3 col-lg-6 col-md-6">
            <div className="stats-card">
              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <p className="card-category text-muted">Tamamlanan</p>
                  <h3 className="card-title mb-0">{stats.completed}</h3>
                  <p className="card-change text-success mb-0">
                    <i className="bi bi-arrow-up me-1"></i>8%
                  </p>
                </div>
                <div className="stats-icon bg-info">
                  <i className="bi bi-check-circle-fill text-white"></i>
                </div>
              </div>
            </div>
          </div>

          <div className="col-xl-3 col-lg-6 col-md-6">
            <div className="stats-card">
              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <p className="card-category text-muted">Bekleyen</p>
                  <h3 className="card-title mb-0">{stats.pending}</h3>
                  <p className="card-change text-warning mb-0">
                    <i className="bi bi-clock me-1"></i>Pending
                  </p>
                </div>
                <div className="stats-icon bg-warning">
                  <i className="bi bi-hourglass-split text-white"></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="row mb-4">
          <div className="col-12">
            <div className="card">
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h5 className="card-title mb-0">Üretim Siparişleri</h5>
                  <div className="d-flex gap-2">
                    {/* Filter Buttons */}
                    <div className="btn-group btn-group-sm" role="group">
                      {filters.map(filter => (
                        <button
                          key={filter.id}
                          type="button"
                          className={`btn ${activeFilter === filter.id ? 'btn-danger' : 'btn-outline-secondary'}`}
                          onClick={() => handleFilterChange(filter.id)}
                        >
                          {filter.label}
                          <span className={`badge ${activeFilter === filter.id ? 'bg-light text-dark' : 'bg-secondary'} ms-1`}>
                            {filter.count}
                          </span>
                        </button>
                      ))}
                    </div>

                    {/* Export Button */}
                    <button 
                      className="btn btn-danger btn-sm"
                      onClick={handleExport}
                    >
                      <i className="bi bi-file-earmark-text me-1"></i>
                      Rapor Oluştur
                    </button>
                  </div>
                </div>

                {/* Search and Filter Controls */}
                <div className="row g-3 mb-3">
                  <div className="col-md-4">
                    <div className="input-group">
                      <span className="input-group-text">
                        <i className="bi bi-search"></i>
                      </span>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Sipariş ID, müşteri adı veya ürün ara..."
                        value={searchTerm}
                        onChange={handleSearch}
                      />
                    </div>
                  </div>
                  <div className="col-md-3">
                    <select 
                      className="form-select"
                      value={selectedLocation}
                      onChange={(e) => setSelectedLocation(e.target.value)}
                    >
                      {locations.map(location => (
                        <option key={location.value} value={location.value}>
                          {location.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-md-3">
                    <select 
                      className="form-select"
                      value={selectedDateRange}
                      onChange={(e) => setSelectedDateRange(e.target.value)}
                    >
                      {dateRanges.map(range => (
                        <option key={range.value} value={range.value}>
                          {range.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-md-2">
                    <button className="btn btn-outline-secondary w-100">
                      <i className="bi bi-funnel me-1"></i>
                      Filtrele
                    </button>
                  </div>
                </div>

                {/* Production List Component */}
                <ProductionList 
                  activeFilter={activeFilter}
                  searchTerm={searchTerm}
                  selectedLocation={selectedLocation}
                  selectedDateRange={selectedDateRange}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Production Capacity Chart */}
        <div className="row">
          <div className="col-12">
            <div className="card">
              <div className="card-body">
                <h5 className="card-title mb-3">Üretim Kapasitesi Takibi</h5>
                <div className="row">
                  <div className="col-md-6">
                    <div className="capacity-item mb-3">
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <span>Makine Kapasitesi</span>
                        <span className="fw-bold">85%</span>
                      </div>
                      <div className="progress" style={{ height: '8px' }}>
                        <div className="progress-bar bg-success" style={{ width: '85%' }}></div>
                      </div>
                    </div>
                    
                    <div className="capacity-item mb-3">
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <span>İnsan Kaynağı</span>
                        <span className="fw-bold">72%</span>
                      </div>
                      <div className="progress" style={{ height: '8px' }}>
                        <div className="progress-bar bg-warning" style={{ width: '72%' }}></div>
                      </div>
                    </div>
                    
                    <div className="capacity-item">
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <span>Malzeme Stoğu</span>
                        <span className="fw-bold">93%</span>
                      </div>
                      <div className="progress" style={{ height: '8px' }}>
                        <div className="progress-bar bg-info" style={{ width: '93%' }}></div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="col-md-6">
                    <div className="alert alert-info">
                      <h6 className="alert-heading">
                        <i className="bi bi-info-circle me-2"></i>
                        Kapasite Durumu
                      </h6>
                      <p className="mb-2">
                        Mevcut kapasite kullanım oranı <strong>%85</strong> seviyesinde. 
                        Yeni siparişler için uygun zaman aralıkları mevcuttur.
                      </p>
                      <hr />
                      <p className="mb-0 small">
                        <strong>Öneri:</strong> Hafta sonu vardiyası planlanabilir.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* New Order Modal would go here */}
      {showNewOrderModal && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Yeni Sipariş Oluştur</h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => setShowNewOrderModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <p>Yeni sipariş formu buraya gelecek...</p>
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setShowNewOrderModal(false)}
                >
                  İptal
                </button>
                <button type="button" className="btn btn-danger">
                  Sipariş Oluştur
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductionPlanning;