// src/frontend/src/pages/DataCamPreparationPage.js
// GÜNCELLENME: Teknik Resim Hazırlama butonunu ekledik

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Archive } from 'lucide-react';
import apiService from '../services/api';
import LoadingSpinner from '../components/common/LoadingSpinner';

const DataCamPreparationPage = () => {
  const navigate = useNavigate();

  // States
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState(null);
  const [expandedRows, setExpandedRows] = useState({});

  // Pagination & Filtering
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(20);
  const [totalCount, setTotalCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('CreatedAt');
  const [sortOrder, setSortOrder] = useState('desc');

  // Load items on mount and when filters change
  useEffect(() => {
    loadItems();
  }, [currentPage, searchTerm, sortBy, sortOrder]);

  const loadItems = async () => {
    try {
      setLoading(true);
      const response = await apiService.getDataCamItems({
        page: currentPage,
        pageSize: pageSize,
        searchTerm: searchTerm,
        sortBy: sortBy,
        sortOrder: sortOrder
      });

      setItems(response.items || []);
      setTotalCount(response.totalCount || 0);

      // Calculate stats
      const total = response.totalCount || 0;
      const completed = (response.items || []).filter(item => item.technicalDrawingCompleted).length;
      const pending = total - completed;
      const completionRate = total > 0 ? ((completed / total) * 100).toFixed(1) : 0;

      setStats({
        totalItems: total,
        completedItems: completed,
        pendingItems: pending,
        completionRate: completionRate
      });
    } catch (error) {
      console.error('Error loading items:', error);
      showToast('Ürünler yüklenirken hata oluştu', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message, type = 'info') => {
    console.log(`[${type.toUpperCase()}] ${message}`);
  };

  // Search handler
  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    loadItems();
  };

  // Sort handler
  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
    setCurrentPage(1);
  };

  // Satır genişletme/daraltma
  const toggleRow = async (itemId) => {
    if (expandedRows[itemId]) {
      setExpandedRows(prev => ({ ...prev, [itemId]: null }));
    } else {
      try {
        const locations = await apiService.getItemBomLocations(itemId);
        setExpandedRows(prev => ({ ...prev, [itemId]: locations }));
      } catch (error) {
        console.error('BOM locations loading error:', error);
        showToast('BOM bilgileri yüklenirken hata oluştu', 'error');
      }
    }
  };

  // Ürün kartına git
  const handleItemClick = (itemId) => {
    // DataCam ekranından açıldığını belirtmek için state göndereceğiz
    navigate(`/definitions/items/${itemId}/edit`, { 
      state: { 
        fromDataCam: true,
        returnPath: '/production/data-cam'
      } 
    });
  };

  // ✅ YENİ: Teknik Resim Hazırlama sayfasına git
  const handleGoToTechnicalDrawingPreparation = () => {
    navigate('/production/technical-drawing-preparation');
  };

  // Pagination
  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  if (loading && items.length === 0) {
    return <LoadingSpinner message="Ürünler yükleniyor..." />;
  }

  return (
    <div className="container-fluid py-4">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="mb-1">Data / CAM Hazırlama</h2>
          <p className="text-muted mb-0">
            Teknik resim çalışması bekleyen ürünler
          </p>
        </div>

        {/* ✅ YENİ: Teknik Resim Hazırlama Butonu */}
        <button
          className="btn btn-primary"
          onClick={handleGoToTechnicalDrawingPreparation}
        >
          <Archive size={18} className="me-2" />
          Teknik Resim Hazırlama
        </button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="row g-3 mb-4">
          <div className="col-md-3">
            <div className="card bg-primary text-white">
              <div className="card-body">
                <h6 className="card-subtitle mb-2 opacity-75">Toplam Ürün</h6>
                <h2 className="card-title mb-0">{stats.totalItems}</h2>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card bg-success text-white">
              <div className="card-body">
                <h6 className="card-subtitle mb-2 opacity-75">Tamamlanan</h6>
                <h2 className="card-title mb-0">{stats.completedItems}</h2>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card bg-warning text-white">
              <div className="card-body">
                <h6 className="card-subtitle mb-2 opacity-75">Bekleyen</h6>
                <h2 className="card-title mb-0">{stats.pendingItems}</h2>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card bg-info text-white">
              <div className="card-body">
                <h6 className="card-subtitle mb-2 opacity-75">Tamamlanma Oranı</h6>
                <h2 className="card-title mb-0">{stats.completionRate}%</h2>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search & Filter */}
      <div className="card shadow-sm mb-4">
        <div className="card-body">
          <form onSubmit={handleSearch}>
            <div className="row g-3 align-items-end">
              <div className="col-md-10">
                <label className="form-label">Ürün Ara</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Ürün adı, kodu veya doküman numarası..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="col-md-2">
                <button type="submit" className="btn btn-primary w-100">
                  <i className="bi bi-search me-2"></i>
                  Ara
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Items Table */}
      <div className="card shadow-sm">
        <div className="card-body">
          <div className="table-responsive">
            <table className="table table-hover align-middle">
              <thead className="table-light">
                <tr>
                  <th style={{ width: '50px' }}></th>
                  <th style={{ width: '80px' }} onClick={() => handleSort('number')} className="cursor-pointer">
                    Ürün No {sortBy === 'number' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th style={{ width: '150px' }} onClick={() => handleSort('code')} className="cursor-pointer">
                    Ürün Kodu {sortBy === 'code' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th onClick={() => handleSort('name')} className="cursor-pointer">
                    Ürün Adı {sortBy === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th style={{ width: '150px' }}>Ürün Grubu</th>
                  <th style={{ width: '120px' }}>Boyutlar</th>
                  <th style={{ width: '150px' }} onClick={() => handleSort('createdat')} className="cursor-pointer">
                    Eklenme Tarihi {sortBy === 'createdat' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th style={{ width: '100px' }} className="text-center">İşlemler</th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="text-center py-4 text-muted">
                      {searchTerm ? 'Arama sonucu bulunamadı' : 'Teknik resim bekleyen ürün bulunmuyor'}
                    </td>
                  </tr>
                ) : (
                  items.map((item) => (
                    <React.Fragment key={item.itemId}>
                      <tr>
                        <td>
                          <button
                            className="btn btn-sm btn-link p-0"
                            onClick={() => toggleRow(item.itemId)}
                            title="BOM bilgilerini göster"
                          >
                            <i className={`bi ${expandedRows[item.itemId] ? 'bi-chevron-down' : 'bi-chevron-right'}`}></i>
                          </button>
                        </td>
                        <td>{item.itemNumber}</td>
                        <td>
                          <code className="text-primary">{item.itemCode}</code>
                        </td>
                        <td>{item.itemName}</td>
                        <td>
                          <span className="badge bg-secondary">{item.itemGroupName || '-'}</span>
                        </td>
                        <td className="small">
                          {item.x && item.y && item.z ? (
                            <span>{item.x} × {item.y} × {item.z}</span>
                          ) : (
                            <span className="text-muted">-</span>
                          )}
                        </td>
                        <td className="small">
                          {new Date(item.createdAt).toLocaleDateString('tr-TR')}
                        </td>
                        <td className="text-center">
                          <button
                            className="btn btn-sm btn-outline-primary"
                            onClick={() => handleItemClick(item.itemId)}
                            title="Ürün detayına git"
                          >
                            <i className="bi bi-arrow-right"></i>
                          </button>
                        </td>
                      </tr>

                      {/* Expanded Row - BOM Locations */}
                      {expandedRows[item.itemId] && (
                        <tr>
                          <td colSpan="8" className="bg-light">
                            <div className="p-3">
                              <h6 className="mb-2">BOM Konumları</h6>
                              {expandedRows[item.itemId].length === 0 ? (
                                <p className="text-muted mb-0">Bu ürün henüz bir BOM'da bulunmuyor</p>
                              ) : (
                                <ul className="list-unstyled mb-0">
                                  {expandedRows[item.itemId].map((location) => (
                                    <li key={location.bomItemId} className="mb-1">
                                      <i className="bi bi-file-earmark-spreadsheet me-2 text-success"></i>
                                      <strong>{location.bomWorkName}</strong>
                                      {' → '}
                                      <span className="text-muted">{location.bomExcelFileName}</span>
                                      {location.projectName && (
                                        <>
                                          {' '}
                                          <span className="badge bg-info">{location.projectName}</span>
                                        </>
                                      )}
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalCount > pageSize && (
            <div className="d-flex justify-content-between align-items-center mt-3">
              <div className="text-muted">
                Toplam {totalCount} ürün
              </div>
              <nav>
                <ul className="pagination pagination-sm mb-0">
                  <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                    <button
                      className="page-link"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      Önceki
                    </button>
                  </li>
                  <li className="page-item active">
                    <span className="page-link">{currentPage}</span>
                  </li>
                  <li className={`page-item ${currentPage * pageSize >= totalCount ? 'disabled' : ''}`}>
                    <button
                      className="page-link"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage * pageSize >= totalCount}
                    >
                      Sonraki
                    </button>
                  </li>
                </ul>
              </nav>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DataCamPreparationPage;