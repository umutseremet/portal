// ===== src/frontend/src/pages/VisitorsPage.js - GÜNCEL HALİ =====

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

  // ✅ DÜZELTME: Sadece stats yükle, visitors hook tarafından otomatik yükleniyor
  useEffect(() => {
    console.log('VisitorsPage: Loading stats only');
    loadStats(); // Sadece stats yükle
    // loadVisitors(); // ❌ KALDIR: Hook içinde zaten yükleniyor
  }, [loadStats]); // ✅ loadVisitors'ı kaldır

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

  // Handle save visitor (create or update)
  const handleSaveVisitor = async (visitorData) => {
    try {
      if (editingVisitor) {
        await updateVisitor(editingVisitor.id, visitorData);
        console.log('Visitor updated successfully');
      } else {
        await createVisitor(visitorData);
        console.log('Visitor created successfully');
      }
      handleCloseModal();
    } catch (error) {
      console.error('Failed to save visitor:', error);
      // Error is handled in the hook
    }
  };

  // Handle delete visitor
  const handleDeleteVisitor = async (visitor) => {
    if (window.confirm(`${visitor.visitor} ziyaretçisini silmek istediğinizden emin misiniz?`)) {
      try {
        await deleteVisitor(visitor.id);
        console.log('Visitor deleted successfully');
      } catch (error) {
        console.error('Failed to delete visitor:', error);
        // Error is handled in the hook
      }
    }
  };

  return (
    <div className="dashboard-page">
      <div className="container-fluid">
        {/* ✅ DÜZELTME: Dashboard sayfası ile aynı header styling */}
        <div className="row mb-4">
          <div className="col-12">
            <div className="page-header">
              <h2 className="page-title mb-2">Ziyaretçiler</h2>
              <p className="page-subtitle text-muted">
                Tüm ziyaretçi kayıtlarını görüntüleyin ve yönetin
              </p>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="row mb-4">
            <div className="col-12">
              <div className="alert alert-danger alert-dismissible fade show">
                <i className="bi bi-exclamation-triangle-fill me-2"></i>
                {error}
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

        {/* ✅ DÜZELTME: Dashboard ile aynı Stats Cards Layout */}
        {stats && (
          <div className="row g-4 mb-4">
            <StatsCard 
              title="Toplam Ziyaretçi"
              value={stats.totalVisitors || 0}
              icon="bi-people-fill"
              color="success"
              loading={statsLoading}
            />
            <StatsCard 
              title="Bugün"
              value={stats.todayVisitors || 0}
              icon="bi-calendar-event"
              color="danger"
              loading={statsLoading}
            />
            <StatsCard 
              title="Bu Hafta"
              value={stats.thisWeekVisitors || 0}
              icon="bi-graph-up"
              color="info"
              loading={statsLoading}
            />
            <StatsCard 
              title="Bu Ay"
              value={stats.thisMonthVisitors || 0}
              icon="bi-trending-up"
              color="warning"
              loading={statsLoading}
            />
          </div>
        )}

        {/* Bulk Actions */}
        {selectedCount > 0 && (
          <div className="row mb-4">
            <div className="col-12">
              <div className="alert alert-info d-flex justify-content-between align-items-center">
                <span>
                  <i className="bi bi-info-circle-fill me-2"></i>
                  {selectedCount} ziyaretçi seçili
                </span>
                <div className="d-flex gap-2">
                  <button 
                    className="btn btn-sm btn-outline-secondary"
                    onClick={clearSelection}
                  >
                    <i className="bi bi-x-circle me-1"></i>
                    Seçimi Temizle
                  </button>
                  <button 
                    className="btn btn-sm btn-outline-danger"
                    onClick={handleBulkDelete}
                  >
                    <i className="bi bi-trash me-1"></i>
                    Seçilenleri Sil
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main Content - VisitorsList Component */}
        <div className="row g-4 mb-4">
          <div className="col-12">
            <div className="card h-100">
              <div className="card-body">
                {/* ✅ DÜZELTME: Tüm prop'ları doğru şekilde geç */}
                <VisitorsList
                  visitors={visitors}
                  loading={loading}
                  error={error}
                  isEmpty={isEmpty}
                  hasFilters={hasFilters}
                  filters={filters}
                  pagination={pagination}
                  selectedVisitors={selectedVisitors}
                  selectedCount={selectedCount}
                  isAllSelected={isAllSelected}
                  filterSummary={filterSummary}
                  
                  // Actions
                  onSort={handleSort}
                  onPageChange={handlePageChange}
                  onFilterChange={handleFilterChange}
                  onResetFilters={handleResetFilters}
                  onQuickDateFilter={handleQuickDateFilter}
                  onNewVisitor={handleNewVisitor}
                  onEditVisitor={handleEditVisitor}
                  onViewVisitor={handleViewVisitor}
                  onDeleteVisitor={handleDeleteVisitor}
                  onExport={handleExport}
                  onBulkDelete={handleBulkDelete}
                  onSelectVisitor={selectVisitor}
                  onSelectAll={selectAllVisitors}
                  onClearSelection={clearSelection}
                  onClearError={clearError}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Modals would go here */}
        {showNewVisitorModal && (
          <div>
            {/* New/Edit Visitor Modal */}
            {/* Implementation depends on your modal component */}
          </div>
        )}

        {viewingVisitor && (
          <div>
            {/* View Visitor Modal */}
            {/* Implementation depends on your modal component */}
          </div>
        )}
      </div>
    </div>
  );
};

export default VisitorsPage;