// src/frontend/src/pages/ItemsPage.js
import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import ItemsList from '../components/Items/ItemsList';
import ItemModal from '../components/Items/ItemModal';
import ItemDetail from '../components/Items/ItemDetail';
import apiService from '../services/api';
import '../assets/css/Items.css';

const ItemsPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const groupFilter = location.state?.groupId;
  const groupName = location.state?.groupName;
  
  // State
  const [items, setItems] = useState([]);
  const [itemGroups, setItemGroups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showNewItemModal, setShowNewItemModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [viewingItem, setViewingItem] = useState(null);
  const [selectedItems, setSelectedItems] = useState([]);
  
  // Filters
  const [filters, setFilters] = useState({
    name: '',
    code: '',
    groupId: groupFilter || null,
    includeCancelled: false,
    page: 1,
    pageSize: 10,
    sortBy: 'Name',
    sortOrder: 'asc'
  });

  // Pagination
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    pageSize: 10,
    hasNextPage: false,
    hasPreviousPage: false
  });

  // Load Item Groups
  const loadItemGroups = useCallback(async () => {
    try {
      const response = await apiService.getItemGroups({ pageSize: 1000, includeCancelled: false });
      setItemGroups(response.itemGroups || []);
    } catch (err) {
      console.error('❌ Error loading item groups:', err);
    }
  }, []);

  // Load Items
  const loadItems = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('📥 Loading items with filters:', filters);
      const response = await apiService.getItems(filters);
      console.log('✅ Items loaded:', response);
      
      setItems(response.items || []);
      setPagination({
        currentPage: response.page || 1,
        totalPages: response.totalPages || 1,
        totalCount: response.totalCount || 0,
        pageSize: response.pageSize || 10,
        hasNextPage: response.hasNextPage || false,
        hasPreviousPage: response.hasPreviousPage || false
      });
    } catch (err) {
      console.error('❌ Error loading items:', err);
      setError(err.message || 'Ürünler yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadItemGroups();
  }, [loadItemGroups]);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  // Handlers
  const handlePageChange = (newPage) => {
    setFilters(prev => ({ ...prev, page: newPage }));
  };

  const handleFilterChange = (newFilters) => {
    setFilters(prev => ({
      ...prev,
      ...newFilters,
      page: 1
    }));
  };

  const handleSort = (field) => {
    setFilters(prev => ({
      ...prev,
      sortBy: field,
      sortOrder: prev.sortBy === field && prev.sortOrder === 'asc' ? 'desc' : 'asc',
      page: 1
    }));
  };

  const handleItemSelect = (id) => {
    setSelectedItems(prev => 
      prev.includes(id) ? prev.filter(itemId => itemId !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedItems.length === items.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(items.map(i => i.id));
    }
  };

  const handleClearSelection = () => {
    setSelectedItems([]);
  };

  const handleViewItem = (item) => {
    setViewingItem(item);
    setShowDetailModal(true);
  };

  const handleEditItem = (item) => {
    setEditingItem(item);
    setShowNewItemModal(true);
  };

  const handleDeleteItem = async (item) => {
    if (!window.confirm(`"${item.name}" ürününü silmek istediğinizden emin misiniz?`)) {
      return;
    }

    try {
      setLoading(true);
      await apiService.deleteItem(item.id);
      await loadItems();
      alert('Ürün başarıyla silindi');
    } catch (err) {
      console.error('❌ Error deleting item:', err);
      alert(err.message || 'Ürün silinirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedItems.length === 0) return;
    
    if (!window.confirm(`${selectedItems.length} ürünü silmek istediğinizden emin misiniz?`)) {
      return;
    }

    try {
      setLoading(true);
      await Promise.all(
        selectedItems.map(id => apiService.deleteItem(id))
      );
      setSelectedItems([]);
      await loadItems();
      alert('Seçili ürünler başarıyla silindi');
    } catch (err) {
      console.error('❌ Error bulk deleting:', err);
      alert(err.message || 'Ürünler silinirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveItem = async (itemData) => {
    try {
      setLoading(true);
      
      if (editingItem) {
        await apiService.updateItem(editingItem.id, itemData);
        alert('Ürün başarıyla güncellendi');
      } else {
        await apiService.createItem(itemData);
        alert('Ürün başarıyla oluşturuldu');
      }
      
      handleCloseModal();
      await loadItems();
    } catch (err) {
      console.error('❌ Error saving item:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const handleCloseModal = () => {
    setShowNewItemModal(false);
    setShowDetailModal(false);
    setEditingItem(null);
    setViewingItem(null);
  };

  const resetFilters = () => {
    setFilters({
      name: '',
      code: '',
      groupId: null,
      includeCancelled: false,
      page: 1,
      pageSize: 10,
      sortBy: 'Name',
      sortOrder: 'asc'
    });
    // Clear location state
    navigate(location.pathname, { replace: true, state: {} });
  };

  const handleRefresh = () => {
    loadItems();
  };

  const handleBackToGroups = () => {
    navigate('/definitions/item-groups');
  };

  // Computed values
  const hasFilters = filters.name || filters.code || filters.groupId || filters.includeCancelled;
  const isEmpty = !loading && items.length === 0;
  const selectedCount = selectedItems.length;
  const isAllSelected = selectedItems.length === items.length && items.length > 0;

  const filterSummary = hasFilters ? [
    filters.name && `Ad: "${filters.name}"`,
    filters.code && `Kod: "${filters.code}"`,
    filters.groupId && `Grup: ${itemGroups.find(g => g.id === filters.groupId)?.name || 'Bilinmiyor'}`,
    filters.includeCancelled && 'İptal edilenler dahil'
  ].filter(Boolean).join(', ') : null;

  return (
    <div className="items-page">
      <div className="container-fluid">
        <div className="content-wrapper">
          {/* Page Header */}
          <div className="page-header mb-4">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <div className="d-flex align-items-center gap-2 mb-2">
                  {groupName && (
                    <button 
                      className="btn btn-sm btn-outline-secondary"
                      onClick={handleBackToGroups}
                    >
                      <i className="bi bi-arrow-left me-1"></i>
                      Geri
                    </button>
                  )}
                  <h1 className="mb-0">
                    {groupName ? `${groupName} - Ürünler` : 'Ürünler'}
                  </h1>
                </div>
                <p className="text-muted mb-0">
                  Ürün tanımlarını yönetin
                </p>
              </div>
              <button 
                className="btn btn-primary"
                onClick={() => setShowNewItemModal(true)}
                disabled={loading}
              >
                <i className="bi bi-plus-circle me-2"></i>
                Yeni Ürün
              </button>
            </div>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="alert alert-danger alert-dismissible fade show" role="alert">
              <i className="bi bi-exclamation-triangle me-2"></i>
              {error}
              <button 
                type="button" 
                className="btn-close" 
                onClick={() => setError(null)}
              ></button>
            </div>
          )}

          {/* Main Content */}
          <div className="row">
            <div className="col-12">
              <div className="card h-100">
                <div className="card-body">
                  <ItemsList
                    items={items}
                    itemGroups={itemGroups}
                    loading={loading}
                    pagination={pagination}
                    filters={filters}
                    sorting={{ field: filters.sortBy, direction: filters.sortOrder }}
                    selectedItems={selectedItems}
                    onPageChange={handlePageChange}
                    onFilterChange={handleFilterChange}
                    onSort={handleSort}
                    onSelectItem={handleItemSelect}
                    onSelectAll={handleSelectAll}
                    onClearSelection={handleClearSelection}
                    onViewItem={handleViewItem}
                    onEditItem={handleEditItem}
                    onDeleteItem={handleDeleteItem}
                    onBulkDelete={handleBulkDelete}
                    onNewItem={() => setShowNewItemModal(true)}
                    onResetFilters={resetFilters}
                    onRefresh={handleRefresh}
                    hasFilters={hasFilters}
                    isEmpty={isEmpty}
                    selectedCount={selectedCount}
                    isAllSelected={isAllSelected}
                    filterSummary={filterSummary}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* New/Edit Item Modal */}
          <ItemModal
            show={showNewItemModal}
            onHide={handleCloseModal}
            onSave={handleSaveItem}
            item={editingItem}
            itemGroups={itemGroups}
            loading={loading}
          />

          {/* Item Detail Modal */}
          {showDetailModal && viewingItem && (
            <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
              <div className="modal-dialog modal-lg modal-dialog-centered">
                <div className="modal-content">
                  <div className="modal-header">
                    <h5 className="modal-title">Ürün Detayı</h5>
                    <button type="button" className="btn-close" onClick={handleCloseModal}></button>
                  </div>
                  <div className="modal-body">
                    <ItemDetail
                      item={viewingItem}
                      itemGroups={itemGroups}
                      loading={loading}
                      onEdit={handleEditItem}
                      onDelete={handleDeleteItem}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ItemsPage;