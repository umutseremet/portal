// src/frontend/src/pages/ItemsPage.js
import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import ItemsList from '../components/Items/ItemsList';
import apiService from '../services/api';
import '../assets/css/Items.css';

export const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5154/api';

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

  // ✅ Detay sayfasına yönlendir
  const handleViewDetails = (item) => {
    navigate('/definitions/items/detail', { state: { item, itemGroups } });
  };

  // ✅ Düzenleme sayfasına yönlendir (MODAL YOK!)
  const handleEditItem = (item) => {
    navigate('/definitions/items/edit', { state: { item, itemGroups } });
  };

  // ✅ Yeni ürün sayfasına yönlendir (MODAL YOK!)
  const handleNewItem = () => {
    navigate('/definitions/items/new', { state: { itemGroups } });
  };

  const handleDeleteItem = async (itemId) => {
    const item = items.find(i => i.id === itemId);
    if (!item) return;

    if (!window.confirm(`"${item.name}" ürününü silmek istediğinizden emin misiniz?`)) {
      return;
    }

    try {
      setLoading(true);
      await apiService.deleteItem(itemId);
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
      for (const id of selectedItems) {
        await apiService.deleteItem(id);
      }
      await loadItems();
      setSelectedItems([]);
      alert(`${selectedItems.length} ürün başarıyla silindi`);
    } catch (err) {
      console.error('❌ Error deleting items:', err);
      alert(err.message || 'Ürünler silinirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleResetFilters = () => {
    setFilters({
      name: '',
      code: '',
      groupId: groupFilter || null,
      includeCancelled: false,
      page: 1,
      pageSize: 10,
      sortBy: 'Name',
      sortOrder: 'asc'
    });
  };

  const handleRefresh = () => {
    console.log('🔄 Refresh butonuna basıldı');
    loadItems();
  };

  const hasFilters = filters.name || filters.code || (filters.groupId && !groupFilter) || filters.includeCancelled;
  const isEmpty = !loading && items.length === 0;
  const selectedCount = selectedItems.length;
  const isAllSelected = items.length > 0 && selectedItems.length === items.length;

  const filterSummary = [
    filters.name && `İsim: "${filters.name}"`,
    filters.code && `Kod: "${filters.code}"`,
    filters.groupId && `Grup: "${itemGroups.find(g => g.id === filters.groupId)?.name}"`,
    filters.includeCancelled && 'İptal edilmiş dahil'
  ].filter(Boolean).join(', ');

  return (
    <div className="items-page">
      <div className="container-fluid">
        {/* Page Header */}
        <div className="row mb-4">
          <div className="col-12">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <h2 className="mb-2">
                  {groupName ? `${groupName} - Ürünler` : 'Ürünler'}
                </h2>
                <p className="text-muted mb-0">
                  {pagination.totalCount} ürün bulundu
                </p>
              </div>
              <button
                className="btn btn-primary"
                onClick={handleNewItem}
                disabled={loading}
              >
                <i className="bi bi-plus-lg me-2"></i>
                Yeni Ürün
              </button>
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
                  onClick={() => setError(null)}
                ></button>
              </div>
            </div>
          </div>
        )}

        {/* Items List */}
        <div className="row">
          <div className="col-12">
            <div className="card">
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
                  onViewItem={handleViewDetails}
                  onEditItem={handleEditItem}
                  onDeleteItem={handleDeleteItem}
                  onBulkDelete={handleBulkDelete}
                  onNewItem={handleNewItem}
                  onResetFilters={handleResetFilters}
                  onRefresh={handleRefresh}
                  hasFilters={hasFilters}
                  isEmpty={isEmpty}
                  selectedCount={selectedCount}
                  isAllSelected={isAllSelected}
                  filterSummary={filterSummary}
                  apiBaseUrl={API_BASE_URL}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ItemsPage;