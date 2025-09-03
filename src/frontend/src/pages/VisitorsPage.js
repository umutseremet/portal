// src/frontend/src/pages/VisitorsPage.js
import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import VisitorsList from '../components/Visitors/VisitorsList';
import VisitorModal from '../components/Visitors/VisitorModal';
import VisitorDetailModal from '../components/Visitors/VisitorDetailModal';
import { useVisitors } from '../hooks/useVisitors';

const VisitorsPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Use the visitors hook
  const {
    // Data
    visitors,
    filters,
    pagination,
    selectedVisitors,

    // State
    loading,
    error,
    isEmpty,
    hasFilters,
    selectedCount,
    isAllSelected,
    filterSummary,

    // Actions
    loadVisitors,
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

  // Modal states
  const [showNewVisitorModal, setShowNewVisitorModal] = useState(false);
  const [editingVisitor, setEditingVisitor] = useState(null);
  const [viewingVisitor, setViewingVisitor] = useState(null);

  // Handle sort
  const handleSort = (column, order) => {
    try {
      console.log('Sorting by:', column, order);
      updateFilters({
        ...filters,
        sortBy: column,
        sortOrder: order
      });
    } catch (error) {
      console.error('Error sorting:', error);
    }
  };

  // Handle page change
  const handlePageChange = (page) => {
    try {
      console.log('Changing page to:', page);
      goToPage(page);
    } catch (error) {
      console.error('Error changing page:', error);
    }
  };

  // Handle filter change
  const handleFilterChange = (newFilters) => {
    try {
      console.log('Handling filter change:', newFilters);
      // Önce state'i güncelle, sonra load et
      updateFilters(newFilters);

      // Kısa delay ile filtreli yükleme
      setTimeout(() => {
        loadVisitors(1, true, newFilters);
      }, 100);
    } catch (error) {
      console.error('Error updating filters:', error);
    }
  };

  // Handle reset filters
  const handleResetFilters = () => {
    try {
      console.log('Resetting filters');
      // İlk önce filtreleri sıfırla
      resetFilters();
      // Sonra temiz filtrelerle tüm kayıtları yükle
      const defaultFilters = {
        fromDate: '',
        toDate: '',
        company: '',
        visitor: '',
        sortBy: 'date',
        sortOrder: 'desc'
      };
      // Kısa bir delay ile yeni filtrelerle yükle
      setTimeout(() => {
        loadVisitors(1, true, defaultFilters);
      }, 50);
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
    console.log('Closing modal');
    setShowNewVisitorModal(false);
    setEditingVisitor(null);
  };

  const handleCloseDetailModal = () => {
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
      console.log('Saving visitor:', { editingVisitor, visitorData });

      if (editingVisitor) {
        // Güncelleme
        const result = await updateVisitor(editingVisitor.id, visitorData);
        console.log('Update result:', result);

        if (result.success) {
          console.log('✅ Visitor updated successfully');
          
          // Modal'ı kapat
          handleCloseModal();
          
          // ✅ URL'deki stat parametrelerini temizle
          const currentSearchParams = new URLSearchParams(location.search);
          
          // Stat ile ilgili parametreleri kaldır
          const paramsToRemove = ['fromDate', 'toDate', 'company', 'visitor', 'sortBy', 'sortOrder', 'page'];
          paramsToRemove.forEach(param => {
            currentSearchParams.delete(param);
          });
          
          // Temizlenmiş URL ile navigate et
          const cleanedSearch = currentSearchParams.toString();
          const newPath = cleanedSearch ? `${location.pathname}?${cleanedSearch}` : location.pathname;
          
          navigate(newPath, { replace: true });
          
          // Filtreleri sıfırla
          resetFilters();
          
          // Filtreler temizlendikten sonra veriyi yeniden yükle
          const defaultFilters = {
            fromDate: '',
            toDate: '',
            company: '',
            visitor: '',
            sortBy: 'date',
            sortOrder: 'desc'
          };
          
          setTimeout(() => {
            loadVisitors(1, true, defaultFilters);
          }, 100);
          
          // Başarı mesajı göster (isteğe bağlı)
          // showSuccessMessage('Ziyaretçi başarıyla güncellendi');
        }
      } else {
        // Yeni kayıt
        const result = await createVisitor(visitorData);
        console.log('Create result:', result);

        if (result.success) {
          console.log('✅ Visitor created successfully');
          handleCloseModal();
          // showSuccessMessage('Ziyaretçi başarıyla oluşturuldu');
        }
      }
    } catch (error) {
      console.error('❌ Save visitor failed:', error);
      // Hata mesajını modal'da göster veya toast kullan
      // setModalError(error.message);
    }
  };

  // Handle delete visitor
  const handleDeleteVisitor = async (visitor) => {
    if (window.confirm(`${visitor.visitorName || visitor.visitor} ziyaretçisini silmek istediğinizden emin misiniz?`)) {
      try {
        await deleteVisitor(visitor.id);
        console.log('Visitor deleted successfully');
      } catch (error) {
        console.error('Failed to delete visitor:', error);
        // Error is handled in the hook
      }
    }
  };

  // Handle delete from detail modal
  const handleDeleteFromDetail = async (visitor) => {
    try {
      await deleteVisitor(visitor.id);
      console.log('Visitor deleted successfully from detail modal');
      handleCloseDetailModal(); // Close detail modal after delete
    } catch (error) {
      console.error('Failed to delete visitor from detail modal:', error);
    }
  };

  // Handle edit from detail modal
  const handleEditFromDetail = (visitor) => {
    setViewingVisitor(null); // Close detail modal
    setEditingVisitor(visitor);
    setShowNewVisitorModal(true); // Open edit modal
  };

  return (
    <div className="dashboard-page">
      <div className="container-fluid">
        {/* Page Header */}
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
              <div className="alert alert-danger alert-dismissible fade show" role="alert">
                <i className="bi bi-exclamation-triangle-fill me-2"></i>
                <strong>Hata!</strong> {error}
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={clearError}
                ></button>
              </div>
            </div>
          </div>
        )}

        {/* Visitors List */}
        <div className="row">
          <div className="col-12">
            <div className="card h-100">
              <div className="card-body">
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

        {/* New/Edit Visitor Modal */}
        <VisitorModal
          show={showNewVisitorModal}
          onHide={handleCloseModal}
          onSave={handleSaveVisitor}
          visitor={editingVisitor}
          loading={loading}
        />

        {/* View Visitor Detail Modal */}
        <VisitorDetailModal
          show={!!viewingVisitor}
          onHide={handleCloseDetailModal}
          visitor={viewingVisitor}
          onEdit={handleEditFromDetail}
          onDelete={handleDeleteFromDetail}
        />
      </div>
    </div>
  );
};

export default VisitorsPage;