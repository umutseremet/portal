// src/frontend/src/components/BOM/BOMExcelDetails.js

import React, { useState, useEffect } from 'react';
import { Eye, Search, ChevronLeft, ChevronRight, Image as ImageIcon } from 'lucide-react';
import apiService from '../../services/api';

export const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5154/api';

const BOMExcelDetails = ({ selectedExcel, workId }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredItems, setFilteredItems] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
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
      setFilteredItems(response.items || []);
      setTotalCount(response.totalCount || 0);
      setTotalPages(response.totalPages || 0);
      setCurrentPage(page);

      console.log('✅ Excel items loaded:', response.items?.length);
      console.log('📊 Items with images:', response.items?.filter(i => i.itemImageUrl)?.length);
    } catch (err) {
      console.error('❌ Error loading excel items:', err);
      alert('Excel içeriği yüklenirken hata oluştu: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedExcel?.id) {
      setCurrentPage(1);
      setSearchTerm('');
      fetchItems(1);
    }
  }, [selectedExcel?.id]);

  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredItems(items);
      return;
    }

    const searchLower = searchTerm.toLowerCase().trim();
    const filtered = items.filter(item => {
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
      setSearchTerm('');
    }
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleImageClick = (imageUrl, itemCode) => {
    setSelectedImage({ url: imageUrl, code: itemCode });
  };

  const closeImageModal = () => {
    setSelectedImage(null);
  };

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= Math.min(4, totalPages); i++) {
          pages.push(i);
        }
        if (totalPages > 4) {
          pages.push('...');
          pages.push(totalPages);
        }
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) {
          if (i > 1) pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push('...');
        pages.push(currentPage - 1);
        pages.push(currentPage);
        pages.push(currentPage + 1);
        pages.push('...');
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

  if (!selectedExcel) {
    return (
      <div className="card mt-4">
        <div className="card-body text-center py-5">
          <i className="bi bi-file-earmark-excel fs-1 text-muted mb-3"></i>
          <p className="text-muted mb-0">Detayları görüntülemek için bir Excel dosyası seçin</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="card mt-4">
        <div className="card-header bg-white border-bottom">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h5 className="mb-1">
                <i className="bi bi-table me-2 text-success"></i>
                Excel İçeriği
              </h5>
              <p className="text-muted small mb-0">
                {selectedExcel.fileName} - {totalCount} kayıt
              </p>
            </div>

            <div className="position-relative" style={{ width: '300px' }}>
              <Search 
                size={16} 
                className="position-absolute text-muted" 
                style={{ left: '12px', top: '50%', transform: 'translateY(-50%)' }} 
              />
              <input
                type="text"
                className="form-control form-control-sm ps-5"
                placeholder="Parça no, malzeme, öğe no ile ara..."
                value={searchTerm}
                onChange={handleSearch}
                disabled={loading}
              />
              {searchTerm && (
                <button
                  className="btn btn-sm position-absolute"
                  style={{ right: '8px', top: '50%', transform: 'translateY(-50%)', padding: '0.25rem 0.5rem' }}
                  onClick={() => setSearchTerm('')}
                >
                  <i className="bi bi-x"></i>
                </button>
              )}
            </div>
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
          ) : filteredItems.length > 0 ? (
            <div className="table-responsive">
              <table className="table table-hover table-sm mb-0 align-middle">
                <thead className="table-light sticky-top">
                  <tr>
                    <th style={{ width: '60px' }} className="text-center">Resim</th>
                    <th style={{ width: '80px' }}>Öğe No</th>
                    <th style={{ width: '180px' }}>Parça No</th>
                    <th style={{ width: '120px' }}>Doküman No</th>
                    <th style={{ width: '150px' }}>Malzeme Grubu</th>
                    <th className="text-center" style={{ width: '80px' }}>Miktar</th>
                    <th className="text-center" style={{ width: '70px' }}>X</th>
                    <th className="text-center" style={{ width: '70px' }}>Y</th>
                    <th className="text-center" style={{ width: '70px' }}>Z</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.map((item) => (
                    <tr key={item.id}>
                      <td className="text-center">
                        {item.itemImageUrl ? (
                          <button
                            className="btn btn-link p-0"
                            onClick={() => handleImageClick(API_BASE_URL + item.itemImageUrl, item.itemCode)}
                            title="Resmi görüntüle"
                          >
                            <ImageIcon size={20} className="text-primary" />
                          </button>
                        ) : (
                          <span className="text-muted">
                            <ImageIcon size={20} className="opacity-25" />
                          </span>
                        )}
                      </td>

                      <td className="fw-medium">
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
                  <p className="text-muted mb-0">"{searchTerm}" için sonuç bulunamadı</p>
                  <button 
                    className="btn btn-link btn-sm mt-2" 
                    onClick={() => setSearchTerm('')}
                  >
                    Aramayı temizle
                  </button>
                </>
              ) : (
                <p className="text-muted mb-0">Bu Excel'de kayıt bulunmuyor</p>
              )}
            </div>
          )}
        </div>

        {!loading && totalPages > 1 && !searchTerm && (
          <div className="card-footer bg-white border-top">
            <div className="d-flex justify-content-between align-items-center">
              <div className="text-muted small">
                Sayfa {currentPage} / {totalPages} (Toplam: {totalCount} kayıt)
              </div>

              <nav>
                <ul className="pagination pagination-sm mb-0">
                  <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                    <button 
                      className="page-link" 
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft size={16} />
                    </button>
                  </li>

                  {getPageNumbers().map((pageNum, index) => (
                    <li 
                      key={index} 
                      className={`page-item ${pageNum === currentPage ? 'active' : ''} ${pageNum === '...' ? 'disabled' : ''}`}
                    >
                      {pageNum === '...' ? (
                        <span className="page-link">...</span>
                      ) : (
                        <button 
                          className="page-link" 
                          onClick={() => handlePageChange(pageNum)}
                        >
                          {pageNum}
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
                      <ChevronRight size={16} />
                    </button>
                  </li>
                </ul>
              </nav>
            </div>
          </div>
        )}
      </div>

      {/* Resim Önizleme Modal */}
      {selectedImage && (
        <>
          <div 
            className="modal-backdrop fade show" 
            style={{ zIndex: 1040 }}
            onClick={closeImageModal}
          ></div>

          <div 
            className="modal fade show d-block" 
            tabIndex="-1" 
            style={{ zIndex: 1050 }}
            onClick={closeImageModal}
          >
            <div 
              className="modal-dialog modal-lg modal-dialog-centered"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">
                    <ImageIcon size={20} className="me-2" />
                    {selectedImage.code}
                  </h5>
                  <button 
                    type="button" 
                    className="btn-close" 
                    onClick={closeImageModal}
                  ></button>
                </div>
                <div className="modal-body text-center p-4">
                  <img 
                    src={selectedImage.url} 
                    alt={selectedImage.code}
                    className="img-fluid rounded shadow"
                    style={{ maxHeight: '70vh', objectFit: 'contain' }}
                    onError={(e) => {
                      e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect fill="%23f0f0f0" width="200" height="200"/%3E%3Ctext fill="%23999" x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle"%3EResim yüklenemedi%3C/text%3E%3C/svg%3E';
                    }}
                  />
                </div>
                <div className="modal-footer">
                  <a 
                    href={selectedImage.url} 
                    download={`${selectedImage.code}.png`}
                    className="btn btn-primary"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <i className="bi bi-download me-2"></i>
                    İndir
                  </a>
                  <button 
                    type="button" 
                    className="btn btn-secondary" 
                    onClick={closeImageModal}
                  >
                    Kapat
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default BOMExcelDetails;