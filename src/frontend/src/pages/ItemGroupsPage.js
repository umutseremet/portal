// src/frontend/src/pages/ItemGroupsPage.js
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import ItemGroupsList from '../components/ItemGroups/ItemGroupsList';
import ItemGroupModal from '../components/ItemGroups/ItemGroupModal';
import apiService from '../services/api';
import '../assets/css/ItemGroups.css';

const ItemGroupsPage = () => {
  const navigate = useNavigate();
  
  // State
  const [itemGroups, setItemGroups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showNewItemGroupModal, setShowNewItemGroupModal] = useState(false);
  const [editingItemGroup, setEditingItemGroup] = useState(null);
  const [selectedItemGroups, setSelectedItemGroups] = useState([]);
  
  // Filters
  const [filters, setFilters] = useState({
    name: '',
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
      setLoading(true);
      setError(null);
      
      console.log('📥 Loading item groups with filters:', filters);
      const response = await apiService.getItemGroups(filters);
      console.log('✅ Item groups loaded:', response);
      
      setItemGroups(response.itemGroups || []);
      setPagination({
        currentPage: response.page || 1,
        totalPages: response.totalPages || 1,
        totalCount: response.totalCount || 0,
        pageSize: response.pageSize || 10,
        hasNextPage: response.hasNextPage || false,
        hasPreviousPage: response.hasPreviousPage || false
      });
    } catch (err) {
      console.error('❌ Error loading item groups:', err);
      setError(err.message || 'Ürün grupları yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadItemGroups();
  }, [loadItemGroups]);

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

  const handleItemGroupSelect = (id) => {
    setSelectedItemGroups(prev => 
      prev.includes(id) ? prev.filter(itemGroupId => itemGroupId !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedItemGroups.length === itemGroups.length) {
      setSelectedItemGroups([]);
    } else {
      setSelectedItemGroups(itemGroups.map(ig => ig.id));
    }
  };

  const handleClearSelection = () => {
    setSelectedItemGroups([]);
  };

  const handleViewItemGroup = (itemGroup) => {
    navigate('/definitions/items', { state: { groupId: itemGroup.id, groupName: itemGroup.name } });
  };

  const handleEditItemGroup = (itemGroup) => {
    setEditingItemGroup(itemGroup);
    setShowNewItemGroupModal(true);
  };

  const handleDeleteItemGroup = async (itemGroup) => {
    if (!window.confirm(`"${itemGroup.name}" grubunu silmek istediğinizden emin misiniz?`)) {
      return;
    }

    try {
      setLoading(true);
      await apiService.deleteItemGroup(itemGroup.id);
      await loadItemGroups();
      alert('Ürün grubu başarıyla silindi');
    } catch (err) {
      console.error('❌ Error deleting item group:', err);
      alert(err.message || 'Ürün grubu silinirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedItemGroups.length === 0) return;
    
    if (!window.confirm(`${selectedItemGroups.length} grubu silmek istediğinizden emin misiniz?`)) {
      return;
    }

    try {
      setLoading(true);
      await Promise.all(
        selectedItemGroups.map(id => apiService.deleteItemGroup(id))
      );
      setSelectedItemGroups([]);
      await loadItemGroups();
      alert('Seçili gruplar başarıyla silindi');
    } catch (err) {
      console.error('❌ Error bulk deleting:', err);
      alert(err.message || 'Gruplar silinirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveItemGroup = async (itemGroupData) => {
    try {
      setLoading(true);
      
      if (editingItemGroup) {
        await apiService.updateItemGroup(editingItemGroup.id, itemGroupData);
        alert('Ürün grubu başarıyla güncellendi');
      } else {
        await apiService.createItemGroup(itemGroupData);
        alert('Ürün grubu başarıyla oluşturuldu');
      }
      
      handleCloseModal();
      await loadItemGroups();
    } catch (err) {
      console.error('❌ Error saving item group:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const handleCloseModal = () => {
    setShowNewItemGroupModal(false);
    setEditingItemGroup(null);
  };

  const resetFilters = () => {
    setFilters({
      name: '',
      includeCancelled: false,
      page: 1,
      pageSize: 10,
      sortBy: 'Name',
      sortOrder: 'asc'
    });
  };

  const handleRefresh = () => {
    loadItemGroups();
  };

  // Computed values
  const hasFilters = filters.name || filters.includeCancelled;
  const isEmpty = !loading && itemGroups.length === 0;
  const selectedCount = selectedItemGroups.length;
  const isAllSelected = selectedItemGroups.length === itemGroups.length && itemGroups.length > 0;

  const filterSummary = hasFilters ? [
    filters.name && `Ad: "${filters.name}"`,
    filters.includeCancelled && 'İptal edilenler dahil'
  ].filter(Boolean).join(', ') : null;

  return (
    <div className="item-groups-page">
      <div className="container-fluid">
        <div className="content-wrapper">
          {/* Page Header */}
          <div className="page-header mb-4">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <h1>Ürün Grupları</h1>
                <p className="text-muted mb-0">
                  Ürün grubu tanımlarını yönetin
                </p>
              </div>
              <button 
                className="btn btn-primary"
                onClick={() => setShowNewItemGroupModal(true)}
                disabled={loading}
              >
                <i className="bi bi-plus-circle me-2"></i>
                Yeni Grup
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
                  <ItemGroupsList
                    itemGroups={itemGroups}
                    loading={loading}
                    pagination={pagination}
                    filters={filters}
                    sorting={{ field: filters.sortBy, direction: filters.sortOrder }}
                    selectedItemGroups={selectedItemGroups}
                    onPageChange={handlePageChange}
                    onFilterChange={handleFilterChange}
                    onSort={handleSort}
                    onSelectItemGroup={handleItemGroupSelect}
                    onSelectAll={handleSelectAll}
                    onClearSelection={handleClearSelection}
                    onViewItemGroup={handleViewItemGroup}
                    onEditItemGroup={handleEditItemGroup}
                    onDeleteItemGroup={handleDeleteItemGroup}
                    onBulkDelete={handleBulkDelete}
                    onNewItemGroup={() => setShowNewItemGroupModal(true)}
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

          {/* New/Edit Item Group Modal */}
          <ItemGroupModal
            show={showNewItemGroupModal}
            onHide={handleCloseModal}
            onSave={handleSaveItemGroup}
            itemGroup={editingItemGroup}
            loading={loading}
          />
        </div>
      </div>
    </div>
  );
};

export default ItemGroupsPage;