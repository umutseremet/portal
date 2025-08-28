// ===== 1. src/frontend/src/pages/VisitorsPage.js (MUTLAKA GÜNCELLEYIN) =====

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

  // ⭐ KRITIK: İlk yüklemede hem stats hem de visitors'ı yükle
  useEffect(() => {
    console.log('VisitorsPage: Loading initial data');
    loadStats();
    loadVisitors(); // ⚡ BU EKSİKTİ!
  }, [loadStats, loadVisitors]);

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
    try {
      console.log('Setting quick date filter:', filterType);
      setQuickDateFilter(filterType);
    } catch (error) {
      console.error('Error setting quick date filter:', error);
    }
  };

  // Handle new visitor
  const handleNewVisitor = () => {
    setEditingVisitor(null);
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

  // Handle close modal
  const handleCloseModal = () => {
    setShowNewVisitorModal(false);
    setEditingVisitor(null);
    setViewingVisitor(null);
  };

  // Handle export
  const handleExport = () => {
    exportVisitors();
  };

  // Handle bulk delete
  const handleBulkDelete = async () => {
    if (window.confirm(`${selectedCount} ziyaretçiyi silmek istediğinizden emin misiniz?`)) {
      try {
        await deleteSelectedVisitors();
        console.log('Bulk delete completed');
      } catch (error) {
        console.error('Bulk delete failed:', error);
      }
    }
  };

  return (
    <div className="container-fluid py-4">
      {/* Page Header */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h2 className="mb-1">Ziyaretçiler</h2>
              <p className="text-muted mb-0">
                {filterSummary}
              </p>
            </div>
            <div className="d-flex gap-2">
              {hasFilters && (
                <button 
                  className="btn btn-outline-secondary"
                  onClick={handleResetFilters}
                >
                  <i className="bi bi-x-circle me-1"></i>
                  Filtreleri Temizle
                </button>
              )}
              <button 
                className="btn btn-outline-secondary"
                onClick={() => setShowFilters(!showFilters)}
              >
                <i className="bi bi-funnel me-1"></i>
                Filtrele
              </button>
              <button 
                className="btn btn-outline-secondary"
                onClick={handleExport}
                disabled={isEmpty}
              >
                <i className="bi bi-download me-1"></i>
                Excel
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
            <div className="alert alert-danger alert-dismissible fade show d-flex align-items-center" role="alert">
              <i className="bi bi-exclamation-triangle-fill me-2"></i>
              <div className="flex-grow-1">
                <strong>Hata!</strong> {error}
              </div>
              <button 
                type="button" 
                className="btn-close" 
                onClick={clearError}
                aria-label="Close"
              ></button>
            </div>
          </div>
        </div>
      )}

      {/* Statistics Cards */}
      {stats && (
        <div className="row mb-4">
          <div className="col-xl-3 col-md-6 mb-3">
            <StatsCard 
              title="Toplam Ziyaretçi"
              value={stats.totalVisitors || 0}
              icon="people"
              color="primary"
              loading={statsLoading}
            />
          </div>
          <div className="col-xl-3 col-md-6 mb-3">
            <StatsCard 
              title="Bugün"
              value={stats.todayVisitors || 0}
              icon="calendar-check"
              color="success"
              loading={statsLoading}
            />
          </div>
          <div className="col-xl-3 col-md-6 mb-3">
            <StatsCard 
              title="Bu Hafta"
              value={stats.thisWeekVisitors || 0}
              icon="calendar-week"
              color="info"
              loading={statsLoading}
            />
          </div>
          <div className="col-xl-3 col-md-6 mb-3">
            <StatsCard 
              title="Bu Ay"
              value={stats.thisMonthVisitors || 0}
              icon="calendar-month"
              color="warning"
              loading={statsLoading}
            />
          </div>
        </div>
      )}

      {/* Quick Date Filters */}
      <div className="row mb-3">
        <div className="col-12">
          <div className="d-flex gap-2 flex-wrap">
            <span className="text-muted small align-self-center me-2">Hızlı filtreler:</span>
            {['Bugün', 'Bu Hafta', 'Bu Ay', 'Son 7 Gün', 'Son 30 Gün'].map(filterType => (
              <button
                key={filterType}
                className="btn btn-sm btn-outline-secondary"
                onClick={() => handleQuickDateFilter(filterType)}
              >
                {filterType}
              </button>
            ))}
          </div>
        </div>
      </div>

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

      {/* Modal placeholder */}
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