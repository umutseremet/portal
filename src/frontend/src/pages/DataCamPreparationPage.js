// src/frontend/src/pages/DataCamPreparationPage.js
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../contexts/ToastContext';
import api from '../services/api';
import LoadingSpinner from '../components/common/LoadingSpinner';

const DataCamPreparationPage = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();

  // State
  const [items, setItems] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(20);
  const [totalPages, setTotalPages] = useState(0);
  const [sortBy, setSortBy] = useState('CreatedAt');
  const [sortOrder, setSortOrder] = useState('asc');
  const [expandedRows, setExpandedRows] = useState({});

  // İstatistikleri yükle
  const loadStats = useCallback(async () => {
    try {
      const statsData = await api.getDataCamStats();
      setStats(statsData);
    } catch (error) {
      console.error('Stats loading error:', error);
      showToast('İstatistikler yüklenirken hata oluştu', 'error');
    }
  }, [showToast]);

  // Ürünleri yükle
  const loadItems = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.getDataCamItems({
        searchTerm,
        page: currentPage,
        pageSize,
        sortBy,
        sortOrder
      });

      setItems(response.items);
      setTotalPages(response.totalPages);
    } catch (error) {
      console.error('Items loading error:', error);
      showToast('Ürünler yüklenirken hata oluştu', 'error');
    } finally {
      setLoading(false);
    }
  }, [searchTerm, currentPage, pageSize, sortBy, sortOrder, showToast]);

  // İlk yükleme
  useEffect(() => {
    loadStats();
    loadItems();
  }, [loadStats, loadItems]);

  // Arama
  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  // Sıralama
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
        const locations = await api.getItemBomLocations(itemId);
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
                <h2 className="card-title mb-0">{stats.completionRate.toFixed(1)}%</h2>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="card mb-4">
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-6">
              <input
                type="text"
                className="form-control"
                placeholder="Ürün ara (kod, ad, doküman no)..."
                value={searchTerm}
                onChange={handleSearch}
              />
            </div>
            <div className="col-md-6 text-end">
              <span className="text-muted">
                Toplam {items.length} ürün gösteriliyor
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Items Table */}
      <div className="card">
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover mb-0">
              <thead className="table-light">
                <tr>
                  <th style={{ width: '50px' }}></th>
                  <th 
                    style={{ cursor: 'pointer', width: '100px' }}
                    onClick={() => handleSort('Number')}
                  >
                    No {sortBy === 'Number' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th 
                    style={{ cursor: 'pointer', width: '150px' }}
                    onClick={() => handleSort('Code')}
                  >
                    Kod {sortBy === 'Code' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th 
                    style={{ cursor: 'pointer' }}
                    onClick={() => handleSort('Name')}
                  >
                    Ürün Adı {sortBy === 'Name' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th style={{ width: '150px' }}>Doküman No</th>
                  <th style={{ width: '120px' }}>Grup</th>
                  <th style={{ width: '120px' }}>Boyutlar</th>
                  <th style={{ width: '180px' }}>Çalışma / Proje</th>
                  <th 
                    style={{ cursor: 'pointer', width: '150px' }}
                    onClick={() => handleSort('CreatedAt')}
                  >
                    Eklenme {sortBy === 'CreatedAt' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="text-center py-4 text-muted">
                      <i className="bi bi-inbox fs-1 d-block mb-2"></i>
                      Teknik resim çalışması bekleyen ürün bulunamadı
                    </td>
                  </tr>
                ) : (
                  items.map(item => (
                    <React.Fragment key={item.itemId}>
                      <tr 
                        style={{ cursor: 'pointer' }}
                        className={expandedRows[item.itemId] ? 'table-active' : ''}
                      >
                        <td>
                          {item.additionalBomCount > 0 && (
                            <button
                              className="btn btn-sm btn-link p-0"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleRow(item.itemId);
                              }}
                              title="Diğer BOM konumlarını göster"
                            >
                              <i className={`bi bi-chevron-${expandedRows[item.itemId] ? 'down' : 'right'}`}></i>
                            </button>
                          )}
                        </td>
                        <td onClick={() => handleItemClick(item.itemId)}>
                          {item.itemNumber}
                        </td>
                        <td onClick={() => handleItemClick(item.itemId)}>
                          <code className="text-primary">{item.itemCode}</code>
                        </td>
                        <td onClick={() => handleItemClick(item.itemId)}>
                          <strong>{item.itemName}</strong>
                        </td>
                        <td onClick={() => handleItemClick(item.itemId)}>
                          {item.itemDocNumber}
                        </td>
                        <td onClick={() => handleItemClick(item.itemId)}>
                          <span className="badge bg-secondary">
                            {item.itemGroupName || '-'}
                          </span>
                        </td>
                        <td onClick={() => handleItemClick(item.itemId)}>
                          <small className="text-muted">{item.dimensions}</small>
                        </td>
                        <td onClick={() => handleItemClick(item.itemId)}>
                          {item.bomWorkName ? (
                            <div>
                              <div><strong>{item.bomWorkName}</strong></div>
                              <small className="text-muted">{item.projectName}</small>
                              {item.additionalBomCount > 0 && (
                                <div>
                                  <small className="text-info">
                                    +{item.additionalBomCount} diğer BOM
                                  </small>
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-muted">-</span>
                          )}
                        </td>
                        <td onClick={() => handleItemClick(item.itemId)}>
                          <small className="text-muted">
                            {item.formattedCreatedAt}
                          </small>
                        </td>
                      </tr>

                      {/* Expanded Row - Diğer BOM Konumları */}
                      {expandedRows[item.itemId] && (
                        <tr className="table-secondary">
                          <td colSpan="9" className="p-0">
                            <div className="px-5 py-3">
                              <h6 className="mb-3">
                                <i className="bi bi-list-ul me-2"></i>
                                Bu ürünün bulunduğu tüm BOM'lar:
                              </h6>
                              <div className="list-group">
                                {expandedRows[item.itemId].map(location => (
                                  <div key={location.bomItemId} className="list-group-item">
                                    <div className="d-flex justify-content-between align-items-start">
                                      <div>
                                        <strong>{location.bomWorkName}</strong>
                                        <div className="small text-muted">
                                          {location.projectName}
                                        </div>
                                        <div className="small">
                                          Excel: {location.bomExcelFileName}
                                        </div>
                                      </div>
                                      <small className="text-muted">
                                        {location.formattedCreatedAt}
                                      </small>
                                    </div>
                                  </div>
                                ))}
                              </div>
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
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="card-footer">
            <nav>
              <ul className="pagination justify-content-center mb-0">
                <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                  <button
                    className="page-link"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    Önceki
                  </button>
                </li>
                
                {[...Array(totalPages)].map((_, index) => {
                  const pageNum = index + 1;
                  // Sadece mevcut sayfa etrafındaki 2 sayfa göster
                  if (
                    pageNum === 1 ||
                    pageNum === totalPages ||
                    (pageNum >= currentPage - 2 && pageNum <= currentPage + 2)
                  ) {
                    return (
                      <li
                        key={pageNum}
                        className={`page-item ${currentPage === pageNum ? 'active' : ''}`}
                      >
                        <button
                          className="page-link"
                          onClick={() => handlePageChange(pageNum)}
                        >
                          {pageNum}
                        </button>
                      </li>
                    );
                  } else if (
                    pageNum === currentPage - 3 ||
                    pageNum === currentPage + 3
                  ) {
                    return (
                      <li key={pageNum} className="page-item disabled">
                        <span className="page-link">...</span>
                      </li>
                    );
                  }
                  return null;
                })}

                <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                  <button
                    className="page-link"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
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
  );
};

export default DataCamPreparationPage;