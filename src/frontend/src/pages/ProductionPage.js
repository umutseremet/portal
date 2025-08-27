import React, { useState } from 'react';
import StatsCard from '../components/Dashboard/StatsCard';
import ProductionList from '../components/Production/ProductionList';

const ProductionPage = () => {
  const [activeFilter, setActiveFilter] = useState('all');

  const filters = [
    { id: 'all', label: 'Tümü', count: 568 },
    { id: 'active', label: 'Aktif', count: 234 },
    { id: 'completed', label: 'Tamamlanan', count: 342 },
    { id: 'cancelled', label: 'İptal', count: 12 }
  ];

  return (
    <div className="production-page">
      <div className="container-fluid">
        {/* Page Header */}
        <div className="row mb-4">
          <div className="col-12">
            <div className="d-flex justify-content-between align-items-start">
              <div className="page-header">
                <h2 className="page-title mb-2">Üretim Planlama</h2>
                <p className="page-subtitle text-muted">
                  Üretim süreçlerini planlayın ve yönetin
                </p>
              </div>
              <div className="page-actions">
                <button className="btn btn-outline-secondary me-2">
                  <i className="bi bi-download me-1"></i>
                  Dışa Aktar
                </button>
                <button className="btn btn-danger">
                  <i className="bi bi-plus-lg me-1"></i>
                  Yeni Sipariş
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="row g-4 mb-4">
          <StatsCard 
            title="Toplam Sipariş" 
            value="568" 
            subtitle="Based your preferences"
            icon="bi-box-seam"
            color="primary"
          />
          <StatsCard 
            title="Üretim Kapasitesi" 
            value="85%" 
            change="12%"
            trend="up"
            icon="bi-speedometer2"
            color="success"
          />
          <StatsCard 
            title="Tamamlanan" 
            value="342" 
            change="8%"
            trend="up"
            icon="bi-check-circle-fill"
            color="info"
          />
          <StatsCard 
            title="Bekleyen" 
            value="226" 
            change="Pending"
            icon="bi-hourglass-split"
            color="warning"
          />
        </div>

        {/* Production Orders Table */}
        <div className="row">
          <div className="col-12">
            <div className="card">
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-center mb-4">
                  <h5 className="card-title mb-0">Üretim Siparişleri</h5>
                  <div className="d-flex gap-2">
                    {/* Filter Buttons */}
                    <div className="btn-group btn-group-sm me-3" role="group">
                      {filters.map(filter => (
                        <button
                          key={filter.id}
                          type="button"
                          className={`btn ${activeFilter === filter.id ? 'btn-danger' : 'btn-outline-secondary'}`}
                          onClick={() => setActiveFilter(filter.id)}
                        >
                          {filter.label}
                          <span className="badge bg-light text-dark ms-1">{filter.count}</span>
                        </button>
                      ))}
                    </div>

                    {/* Export Button */}
                    <button className="btn btn-danger btn-sm">
                      <i className="bi bi-file-earmark-text me-1"></i>
                      Rapor Oluştur
                    </button>
                  </div>
                </div>

                {/* Search and Filter Bar */}
                <div className="row mb-3">
                  <div className="col-md-6">
                    <div className="input-group">
                      <span className="input-group-text">
                        <i className="bi bi-search"></i>
                      </span>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Sipariş ID, müşteri adı veya ürün ara..."
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="d-flex gap-2">
                      <select className="form-select">
                        <option value="">Tüm Lokasyonlar</option>
                        <option value="jakarta">Jakarta</option>
                        <option value="medan">Medan</option>
                        <option value="sydney">Sydney</option>
                      </select>
                      <select className="form-select">
                        <option value="">Tarih Aralığı</option>
                        <option value="today">Bugün</option>
                        <option value="week">Bu Hafta</option>
                        <option value="month">Bu Ay</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Production List Component */}
                <ProductionList activeFilter={activeFilter} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductionPage;