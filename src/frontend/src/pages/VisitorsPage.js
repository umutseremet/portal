import React, { useState, useEffect } from 'react';
import { useVisitors } from '../hooks/useVisitors';
import VisitorsList from '../components/Visitors/VisitorsList';
import StatsCard from '../components/Dashboard/StatsCard';

const VisitorsPage = () => {
  const {
    visitors,
    stats,
    filters,
    pagination,
    selectedVisitors,
    loading,
    statsLoading,
    error,
    isEmpty,
    hasFilters,
    selectedCount,
    isAllSelected,
    filterSummary,
    loadVisitors,
    loadStats,
    createVisitor,
    updateVisitor,
    deleteVisitor,
    exportVisitors,
    updateFilters,
    resetFilters,
    setQuickDateFilter,
    goToPage,
    selectVisitor,
    selectAllVisitors,
    clearSelection,
    deleteSelectedVisitors,
    clearError
  } = useVisitors();

  const [showNewVisitorModal, setShowNewVisitorModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [editingVisitor, setEditingVisitor] = useState(null);
  const [viewingVisitor, setViewingVisitor] = useState(null);

  // Load initial data
  useEffect(() => {
    console.log('VisitorsPage: Loading initial data');
    loadStats();
  }, [loadStats]);

  // Debug visitors data
  useEffect(() => {
    console.log('VisitorsPage: Visitors data changed:', {
      visitorsCount: visitors?.length || 0,
      visitors: visitors,
      loading,
      error,
      isEmpty,
      pagination
    });
  }, [visitors, loading, error, isEmpty, pagination]);

  // Handle sort
  const handleSort = (column, order) => {
    updateFilters({ sortBy: column, sortOrder: order });
  };

  // Handle page change
  const handlePageChange = (page) => {
    goToPage(page);
  };

  // Handle filter change
  const handleFilterChange = (newFilters) => {
    try {
      console.log('Handling filter change:', newFilters);
      updateFilters(newFilters);
    } catch (error) {
      console.error('Error updating filters:', error);
      // setError('Filtre güncellenirken hata oluştu');
    }
  };

  // Handle reset filters
  const handleResetFilters = () => {
    try {
      console.log('Resetting filters');
      resetFilters();
    } catch (error) {
      console.error('Error resetting filters:', error);
    }
  };

  // Handle quick date filter
  const handleQuickDateFilter = (filterType) => {
    setQuickDateFilter(filterType);
  };

  // Handle export
  const handleExport = async () => {
    try {
      await exportVisitors();
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  // Handle new visitor
  const handleNewVisitor = () => {
    setShowNewVisitorModal(true);
  };

  // Handle edit visitor
  const handleEditVisitor = (visitor) => {
    setEditingVisitor(visitor);
    setShowNewVisitorModal(true);
  };

  // Handle view visitor
  const handleViewVisitor = (visitor) => {
    setViewingVisitor(visitor);
  };

  // Handle save visitor (create or update)
  const handleSaveVisitor = async (visitorData) => {
    try {
      if (editingVisitor) {
        await updateVisitor(editingVisitor.id, visitorData);
      } else {
        await createVisitor(visitorData);
      }
      setShowNewVisitorModal(false);
      setEditingVisitor(null);
    } catch (error) {
      console.error('Save failed:', error);
      throw error; // Re-throw to show error in form
    }
  };

  // Handle close modal
  const handleCloseModal = () => {
    setShowNewVisitorModal(false);
    setEditingVisitor(null);
    setViewingVisitor(null);
  };

  // Handle bulk delete
  const handleBulkDelete = async () => {
    if (window.confirm(`${selectedCount} ziyaretçi kaydını silmek istediğinizden emin misiniz?`)) {
      try {
        await deleteSelectedVisitors();
      } catch (error) {
        console.error('Bulk delete failed:', error);
      }
    }
  };

  return (
    <div className="visitors-page">
      <div className="container-fluid">
        {/* Page Header */}
        <div className="row mb-4">
          <div className="col-12">
            <div className="d-flex justify-content-between align-items-start flex-wrap">
              <div className="page-header mb-3 mb-md-0">
                <h2 className="page-title mb-2">Ziyaretçiler</h2>
                <p className="page-subtitle text-muted">
                  Ziyaretçi kayıtlarını görüntüleyin ve yönetin
                </p>
              </div>
              <div className="page-actions d-flex gap-2">
                <button 
                  className="btn btn-outline-secondary"
                  onClick={() => setShowFilters(!showFilters)}
                >
                  <i className="bi bi-funnel me-1"></i>
                  Filtreler {hasFilters && <span className="badge bg-danger ms-1">!</span>}
                </button>
                <button 
                  className="btn btn-outline-secondary"
                  onClick={handleExport}
                  disabled={loading}
                >
                  <i className="bi bi-download me-1"></i>
                  Dışa Aktar
                </button>
                <button 
                  className="btn btn-danger"
                  onClick={handleNewVisitor}
                >
                  <i className="bi bi-plus-lg me-1"></i>
                  Yeni Ziyaretçi
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="row mb-4">
            <div className="col-12">
              <div className="alert alert-danger d-flex align-items-center" role="alert">
                <i className="bi bi-exclamation-triangle-fill me-2"></i>
                <div className="flex-grow-1">{error}</div>
                <button
                  type="button"
                  className="btn-close"
                  onClick={clearError}
                ></button>
              </div>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="row g-4 mb-4">
          <StatsCard 
            title="Toplam Ziyaretçi" 
            value={stats?.totalVisitors?.toString() || '0'}
            subtitle="Tüm kayıtlar"
            icon="bi-people-fill"
            color="primary"
            loading={statsLoading}
          />
          <StatsCard 
            title="Bu Ay" 
            value={stats?.thisMonthVisitors?.toString() || '0'}
            change={`${stats?.thisWeekVisitors || 0} bu hafta`}
            icon="bi-calendar-month"
            color="success"
            loading={statsLoading}
          />
          <StatsCard 
            title="Bugün" 
            value={stats?.todayVisitors?.toString() || '0'}
            subtitle="Günün ziyaretçileri"
            icon="bi-calendar-check"
            color="info"
            loading={statsLoading}
          />
          <StatsCard 
            title="Bu Hafta" 
            value={stats?.thisWeekVisitors?.toString() || '0'}
            subtitle="Son 7 gün"
            icon="bi-calendar-week"
            color="warning"
            loading={statsLoading}
          />
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="row mb-4">
            <div className="col-12">
              <div className="card">
                <div className="card-body">
                  <div className="row g-3">
                    {/* Date Range */}
                    <div className="col-md-3">
                      <label className="form-label small fw-semibold">Başlangıç Tarihi</label>
                      <input
                        type="date"
                        className="form-control"
                        value={filters.fromDate || ''}
                        onChange={(e) => handleFilterChange({ fromDate: e.target.value })}
                      />
                    </div>
                    <div className="col-md-3">
                      <label className="form-label small fw-semibold">Bitiş Tarihi</label>
                      <input
                        type="date"
                        className="form-control"
                        value={filters.toDate || ''}
                        onChange={(e) => handleFilterChange({ toDate: e.target.value })}
                      />
                    </div>
                    
                    {/* Company Filter */}
                    <div className="col-md-3">
                      <label className="form-label small fw-semibold">Şirket</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Şirket adı ara..."
                        value={filters.company || ''}
                        onChange={(e) => handleFilterChange({ company: e.target.value })}
                      />
                    </div>
                    
                    {/* Visitor Filter */}
                    <div className="col-md-3">
                      <label className="form-label small fw-semibold">Ziyaretçi</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Ziyaretçi adı ara..."
                        value={filters.visitor || ''}
                        onChange={(e) => handleFilterChange({ visitor: e.target.value })}
                      />
                    </div>
                  </div>
                  
                  {/* Quick Date Filters */}
                  <div className="row mt-3">
                    <div className="col-12">
                      <div className="d-flex justify-content-between align-items-center">
                        <div className="d-flex gap-2 flex-wrap">
                          <small className="text-muted align-self-center me-2">Hızlı filtreler:</small>
                          {['Bugün', 'Bu Hafta', 'Bu Ay', 'Son 7 Gün', 'Son 30 Gün'].map(filter => (
                            <button
                              key={filter}
                              type="button"
                              className="btn btn-sm btn-outline-secondary"
                              onClick={() => handleQuickDateFilter(filter)}
                            >
                              {filter}
                            </button>
                          ))}
                        </div>
                        
                        <div className="d-flex gap-2">
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-danger"
                            onClick={handleResetFilters}
                            disabled={!hasFilters || loading}
                          >
                            <i className="bi bi-x-circle me-1"></i>
                            Temizle
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Filter Summary */}
                  {hasFilters && (
                    <div className="mt-3 pt-3 border-top">
                      <small className="text-muted">
                        <strong>Aktif filtreler:</strong> {filterSummary}
                      </small>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Bulk Actions */}
        {selectedCount > 0 && (
          <div className="row mb-3">
            <div className="col-12">
              <div className="alert alert-info d-flex align-items-center justify-content-between">
                <div>
                  <i className="bi bi-check2-square me-2"></i>
                  <strong>{selectedCount}</strong> ziyaretçi seçildi
                </div>
                <div className="d-flex gap-2">
                  <button
                    className="btn btn-sm btn-outline-danger"
                    onClick={handleBulkDelete}
                  >
                    <i className="bi bi-trash me-1"></i>
                    Seçilenleri Sil
                  </button>
                  <button
                    className="btn btn-sm btn-outline-secondary"
                    onClick={clearSelection}
                  >
                    <i className="bi bi-x me-1"></i>
                    Seçimi Temizle
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Visitors List */}
        <div className="row">
          <div className="col-12">
            <div className="card">
              <div className="card-body">
                <VisitorsList
                  visitors={visitors}
                  loading={loading}
                  onEdit={handleEditVisitor}
                  onDelete={deleteVisitor}
                  onView={handleViewVisitor}
                  pagination={pagination}
                  onPageChange={handlePageChange}
                  onSort={handleSort}
                  sortBy={filters.sortBy}
                  sortOrder={filters.sortOrder}
                  selectedVisitors={selectedVisitors}
                  onSelectVisitor={selectVisitor}
                  onSelectAll={selectAllVisitors}
                  isAllSelected={isAllSelected}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modals would go here - VisitorForm, VisitorDetail etc. */}
      {showNewVisitorModal && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  {editingVisitor ? 'Ziyaretçi Düzenle' : 'Yeni Ziyaretçi Ekle'}
                </h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={handleCloseModal}
                ></button>
              </div>
              <div className="modal-body">
                {/* VisitorForm component would go here */}
                <p>Ziyaretçi formu buraya gelecek...</p>
                <p>Düzenlenen ziyaretçi: {editingVisitor ? JSON.stringify(editingVisitor, null, 2) : 'Yeni kayıt'}</p>
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={handleCloseModal}
                >
                  İptal
                </button>
                <button type="button" className="btn btn-danger">
                  {editingVisitor ? 'Güncelle' : 'Kaydet'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VisitorsPage;