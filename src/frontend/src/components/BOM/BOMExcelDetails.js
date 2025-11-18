// src/frontend/src/components/BOM/BOMExcelDetails.js

import React, { useState, useEffect } from 'react';
import { Eye, Search, ChevronLeft, ChevronRight, Image as ImageIcon } from 'lucide-react';
import apiService from '../../services/api';

// ✅ API_BASE_URL'den /api kısmını kaldırıyoruz çünkü imageUrl direkt /Uploads ile başlıyor
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL
  ? process.env.REACT_APP_API_BASE_URL.replace('/api', '')
  : 'http://localhost:5154';

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
    // ✅ API_BASE_URL kullanarak tam URL oluştur
    const fullImageUrl = `${API_BASE_URL}${imageUrl}`;
    setSelectedImage({ url: fullImageUrl, code: itemCode });
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
      <div className="text-center py-5 text-muted">
        <Eye size={48} className="mb-3" />
        <p>Lütfen bir Excel dosyası seçin</p>
      </div>
    );
  }

  return (
    <>
      <div className="card shadow-sm">
        <div className="card-header bg-white border-bottom">
          <div className="row align-items-center">
            <div className="col-md-6">
              <h6 className="mb-0 fw-bold text-dark">
                <Eye size={20} className="me-2" />
                Excel İçeriği: {selectedExcel.fileName}
              </h6>
              <small className="text-muted">
                Toplam {totalCount} kayıt
              </small>
            </div>
            <div className="col-md-6">
              <div className="input-group input-group-sm">
                <span className="input-group-text bg-light border-end-0">
                  <Search size={16} />
                </span>
                <input
                  type="text"
                  className="form-control border-start-0"
                  placeholder="Parça No, Doküman No veya Öğe No ile ara..."
                  value={searchTerm}
                  onChange={handleSearch}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="card-body p-0" style={{ maxHeight: '600px', overflowY: 'auto' }}>
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
                    <th style={{ width: '80px' }} className="text-center">Resim</th>
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
                            className="btn btn-sm btn-outline-secondary border-0 p-1"
                            onClick={() => handleImageClick(item.itemImageUrl, item.itemCode)}
                            title="Resmi büyüt"
                          >
                            <img
                              src={`${API_BASE_URL}${item.itemImageUrl}`}
                              alt={item.itemCode}
                              style={{
                                width: '40px',
                                height: '40px',
                                objectFit: 'cover',
                                borderRadius: '4px'
                              }}
                              onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.parentElement.innerHTML = '<ImageIcon size={20} class="text-muted" />';
                              }}
                            />
                          </button>
                        ) : (
                          <ImageIcon size={20} className="text-muted" />
                        )}
                      </td>
                      <td>
                        <small className="text-muted">{item.ogeNo || '-'}</small>
                      </td>
                      <td>
                        <span className="badge bg-primary">{item.itemCode}</span>
                      </td>
                      <td>
                        <small>{item.itemDocNumber || '-'}</small>
                      </td>
                      <td>
                        <small className="text-secondary">{item.itemGroupName || '-'}</small>
                      </td>
                      <td className="text-center">
                        <span className="badge bg-success">{item.miktar || 0}</span>
                      </td>
                      <td className="text-center">
                        <small className="text-muted">{item.itemX || '-'}</small>
                      </td>
                      <td className="text-center">
                        <small className="text-muted">{item.itemY || '-'}</small>
                      </td>
                      <td className="text-center">
                        <small className="text-muted">{item.itemZ || '-'}</small>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-5 text-muted">
              <Search size={48} className="mb-3" />
              <p>
                {searchTerm ? 'Arama sonucu bulunamadı' : 'Bu Excel dosyasında henüz içerik yok'}
              </p>
            </div>
          )}
        </div>

        {totalPages > 1 && !searchTerm && (
          <div className="card-footer bg-white border-top">
            <div className="d-flex justify-content-between align-items-center">
              <small className="text-muted">
                Sayfa {currentPage} / {totalPages}
              </small>

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

                  {getPageNumbers().map((page, index) => (
                    page === '...' ? (
                      <li key={`ellipsis-${index}`} className="page-item disabled">
                        <span className="page-link">...</span>
                      </li>
                    ) : (
                      <li
                        key={page}
                        className={`page-item ${currentPage === page ? 'active' : ''}`}
                      >
                        <button
                          className="page-link"
                          onClick={() => handlePageChange(page)}
                        >
                          {page}
                        </button>
                      </li>
                    )
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

      {/* Resim Modal */}
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
              className="modal-dialog modal-xl modal-dialog-centered"
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