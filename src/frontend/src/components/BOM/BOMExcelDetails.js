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
  const [filteredItems, setFilteredItems] = useState([]);
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
      setFilteredItems(response.items || []); // ✅ Filtered items'ı da başlat
      setTotalCount(response.totalCount || 0);
      setTotalPages(response.totalPages || 0);
      setCurrentPage(page);

      console.log('✅ Excel items loaded:', response.items?.length);
      console.log('📊 First item sample:', response.items?.[0]);
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
      setSearchTerm(''); // ✅ Arama terimini sıfırla
      fetchItems(1);
    }
  }, [selectedExcel?.id]);

  // ✅ Arama işlevi - frontend'de filtreleme
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredItems(items);
      return;
    }

    const searchLower = searchTerm.toLowerCase().trim();
    const filtered = items.filter(item => {
      // Parça no, doküman no, malzeme grubu, öğe no'da arama yap
      return (
        item.itemCode?.toLowerCase().includes(searchLower) ||
        item.itemDocNumber?.toLowerCase().includes(searchLower) ||
        item.itemGroupName?.toLowerCase().includes(searchLower) ||
        item.ogeNo?.toLowerCase().includes(searchLower)
      );
    });

    setFilteredItems(filtered);
  }, [searchTerm, items]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      fetchItems(newPage);
      setSearchTerm(''); // ✅ Sayfa değiştiğinde aramayı sıfırla
    }
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
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
    <div className="row mb-4">
      <div className="col-12">
        <div className="card">
          <div className="card-header d-flex justify-content-between align-items-center">
            <div className="d-flex align-items-center">
              <Eye size={20} className="text-success me-2" />
              <h5 className="card-title mb-0">
                Excel Detayları
              </h5>
            </div>
            {selectedExcel && (
              <div className="text-muted small">
                <i className="bi bi-file-earmark-spreadsheet me-1"></i>
                {selectedExcel.fileName} - {totalCount} kayıt
                {searchTerm && ` (${filteredItems.length} sonuç)`}
              </div>
            )}
          </div>

          {/* Search Bar */}
          <div className="card-body border-bottom">
            <div className="input-group">
              <span className="input-group-text bg-white">
                <Search size={16} className="text-muted" />
              </span>
              <input
                type="text"
                className="form-control"
                placeholder="Parça no, malzeme grubu, doküman no, öğe no ara..."
                value={searchTerm}
                onChange={handleSearch}
              />
              {searchTerm && (
                <button
                  className="btn btn-outline-secondary"
                  type="button"
                  onClick={() => setSearchTerm('')}
                  title="Aramayı temizle"
                >
                  <i className="bi bi-x-lg"></i>
                </button>
              )}
            </div>
            {searchTerm && (
              <div className="mt-2 text-muted small">
                <i className="bi bi-info-circle me-1"></i>
                {filteredItems.length} sonuç bulundu
              </div>
            )}
          </div>

          {/* Table */}
          <div className="card-body p-0" style={{ maxHeight: '600px', overflow: 'auto' }}>
            {loading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-danger" role="status">
                  <span className="visually-hidden">Yükleniyor...</span>
                </div>
                <p className="text-muted mt-2">Excel içeriği yükleniyor...</p>
              </div>
            ) : filteredItems.length > 0 ? (
              <div className="table-responsive">
                <table className="table table-hover table-sm mb-0 align-middle">
                  <thead className="table-light sticky-top">
                    <tr>
                      {/* ✅ DEĞİŞİKLİK: Öğe No kolonuna padding-left eklendi */}
                      <th style={{ width: '80px', paddingLeft: '1rem' }}>Öğe No</th>
                      <th style={{ width: '180px' }}>Parça No</th>
                      <th style={{ width: '120px' }}>Doküman No</th>
                      <th style={{ width: '150px' }}>Malzeme Grubu</th>
                      <th className="text-center" style={{ width: '80px' }}>Miktar</th>
                      <th className="text-center" style={{ width: '70px' }}>X Yönü</th>
                      <th className="text-center" style={{ width: '70px' }}>Y Yönü</th>
                      <th className="text-center" style={{ width: '70px' }}>Z Yönü</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredItems.map((item) => (
                      <tr key={item.id}>
                        {/* ✅ DEĞİŞİKLİK: Öğe No kolonuna padding-left eklendi */}
                        <td className="fw-medium" style={{ paddingLeft: '1rem' }}>
                          {item.ogeNo || item.rowNumber || '-'}
                        </td>

                        <td className="fw-medium text-primary">{item.itemCode || '-'}</td>

                        <td className="small">{item.itemDocNumber || '-'}</td>

                        <td className="small text-muted">{item.itemGroupName || '-'}</td>

                        <td className="text-center">{item.miktar || '-'}</td>

                        <td className="text-center text-muted small">{item.itemX || '-'}</td>
                        <td className="text-center text-muted small">{item.itemY || '-'}</td>
                        <td className="text-center text-muted small">{item.itemZ || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-5">
                <i className="bi bi-inbox fs-1 text-muted mb-3"></i>
                {searchTerm ? (
                  <>
                    <p className="text-muted">Arama sonucu bulunamadı.</p>
                    <button
                      className="btn btn-sm btn-outline-secondary"
                      onClick={() => setSearchTerm('')}
                    >
                      Aramayı Temizle
                    </button>
                  </>
                ) : (
                  <p className="text-muted">Bu Excel dosyasında kayıt bulunmuyor.</p>
                )}
              </div>
            )}
          </div>

          {/* Pagination Footer */}
          {!loading && items.length > 0 && totalPages > 1 && !searchTerm && (
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

                  {getPageNumbers().map((page, index) => (
                    <li
                      key={index}
                      className={`page-item ${page === currentPage ? 'active' : ''} ${page === '...' ? 'disabled' : ''}`}
                    >
                      {page === '...' ? (
                        <span className="page-link">...</span>
                      ) : (
                        <button
                          className="page-link"
                          onClick={() => handlePageChange(page)}
                        >
                          {page}
                        </button>
                      )}
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