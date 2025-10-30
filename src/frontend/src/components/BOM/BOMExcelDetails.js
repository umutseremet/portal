// src/frontend/src/components/BOM/BOMExcelDetails.js

import React, { useState, useEffect } from 'react';
import { Eye, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import apiService from '../../services/api';

const BOMExcelDetails = ({ selectedExcel, workId }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const pageSize = 50;

  // Excel içeriğini yükle
  const fetchItems = async (page = 1) => {
    if (!selectedExcel?.id) return;

    try {
      setLoading(true);
      const response = await apiService.getBOMExcelItems(selectedExcel.id, {
        page: page,
        pageSize: pageSize
      });

      setItems(response.items || []);
      setTotalCount(response.totalCount || 0);
      setTotalPages(response.totalPages || 0);
      setCurrentPage(page);
      
      console.log('✅ Excel items loaded:', response.items?.length);
    } catch (err) {
      console.error('❌ Error loading excel items:', err);
      alert('Excel içeriği yüklenirken hata oluştu: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // İlk yüklemede ve excel değiştiğinde içeriği getir
  useEffect(() => {
    if (selectedExcel?.id) {
      setCurrentPage(1);
      fetchItems(1);
    }
  }, [selectedExcel?.id]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      fetchItems(newPage);
    }
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    // TODO: Backend'de arama implementasyonu olduğunda kullanılabilir
  };

  // Pagination için sayfa numaralarını oluştur
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      }
    }

    return pages;
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      return date.toLocaleString('tr-TR');
    } catch {
      return dateString;
    }
  };

  return (
    <div className="row">
      <div className="col-12">
        <div className="card">
          <div className="card-header d-flex justify-content-between align-items-center">
            <div className="d-flex align-items-center">
              <Eye size={20} className="text-success me-2" />
              <div>
                <h5 className="card-title mb-0">Excel Detayları</h5>
                <p className="card-text text-muted small mb-0">
                  {selectedExcel.fileName} - {totalCount} kayıt
                </p>
              </div>
            </div>
            
            <div className="position-relative" style={{ width: '280px' }}>
              <Search 
                size={16} 
                style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#6c757d',
                  zIndex: 1
                }}
              />
              <input
                type="text"
                placeholder="Parça no, malzeme ara..."
                value={searchTerm}
                onChange={handleSearch}
                className="form-control form-control-sm"
                style={{ paddingLeft: '40px' }}
                disabled={loading}
              />
            </div>
          </div>

          <div className="card-body p-0">
            {loading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-danger" role="status">
                  <span className="visually-hidden">Yükleniyor...</span>
                </div>
                <p className="text-muted mt-2">Excel içeriği yükleniyor...</p>
              </div>
            ) : items.length > 0 ? (
              <div className="table-responsive">
                <table className="table table-hover table-sm mb-0 align-middle">
                  <thead className="table-light sticky-top">
                    <tr>
                      <th style={{ width: '60px' }}>Öğe No</th>
                      <th style={{ width: '80px' }}>Parça No</th>
                      <th>Doküman No</th>
                      <th>Malzeme</th>
                      <th className="text-center" style={{ width: '70px' }}>Mikt. 1</th>
                      <th className="text-center" style={{ width: '70px' }}>Mikt. 2</th>
                      <th className="text-center" style={{ width: '70px' }}>X Yönü</th>
                      <th className="text-center" style={{ width: '70px' }}>Y Yönü</th>
                      <th className="text-center" style={{ width: '70px' }}>Z Yönü</th>
                      <th>Eski Kod</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item) => (
                      <tr key={item.id}>
                        <td className="fw-medium">{item.ogeNo}</td>
                        <td className="fw-medium text-primary">{item.parcaNo}</td>
                        <td className="small">{item.dokumanNo || '-'}</td>
                        <td className="small">{item.malzeme || '-'}</td>
                        <td className="text-center">{item.miktar1 || '-'}</td>
                        <td className="text-center">{item.miktar2 || '-'}</td>
                        <td className="text-center text-muted small">{item.xYonu || '-'}</td>
                        <td className="text-center text-muted small">{item.yYonu || '-'}</td>
                        <td className="text-center text-muted small">{item.zYonu || '-'}</td>
                        <td className="text-muted small">{item.eskiKod || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-5">
                <p className="text-muted">Bu Excel dosyasında kayıt bulunmuyor.</p>
              </div>
            )}
          </div>

          {/* Pagination Footer */}
          {!loading && items.length > 0 && totalPages > 1 && (
            <div className="card-footer d-flex justify-content-between align-items-center">
              <div className="text-muted small">
                {((currentPage - 1) * pageSize) + 1}-{Math.min(currentPage * pageSize, totalCount)} arası gösteriliyor (toplam {totalCount} kayıt)
              </div>
              <nav>
                <ul className="pagination pagination-sm mb-0">
                  <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                    <button 
                      className="page-link" 
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft size={14} />
                    </button>
                  </li>
                  
                  {getPageNumbers().map((page, idx) => (
                    <li 
                      key={idx} 
                      className={`page-item ${page === currentPage ? 'active' : ''} ${page === '...' ? 'disabled' : ''}`}
                    >
                      <button 
                        className="page-link" 
                        onClick={() => page !== '...' && handlePageChange(page)}
                        disabled={page === '...'}
                      >
                        {page}
                      </button>
                    </li>
                  ))}
                  
                  <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                    <button 
                      className="page-link" 
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      <ChevronRight size={14} />
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

export default BOMExcelDetails;