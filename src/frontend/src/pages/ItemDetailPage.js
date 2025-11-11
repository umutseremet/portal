// src/frontend/src/pages/ItemDetailPage.js
// READ-ONLY - Pagination ve ZIP indirme ile

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Download, Archive } from 'lucide-react';
import apiService from '../services/api';
import ItemDetail from '../components/Items/ItemDetail';
import PDFPreviewModal from '../components/Items/PDFPreviewModal';

const ItemDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [itemGroups, setItemGroups] = useState(location.state?.itemGroups || []);

  const [item, setItem] = useState(location.state?.item || null);
  const [loading, setLoading] = useState(false);
  
  // File states
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [filesLoading, setFilesLoading] = useState(false);
  const [previewFile, setPreviewFile] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [downloadingZip, setDownloadingZip] = useState(false);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const filesPerPage = 5;

  // Load item data
  useEffect(() => {
    if (item) {
      // Item already in state
    } else if (id) {
      fetchItem();
    }
  }, [id]);

  // Load files
  useEffect(() => {
    if (id) {
      fetchFiles();
    }
  }, [id]);

   // ✅ Item Groups'u API'den çek
  const fetchItemGroups = async () => {
    try {
      const response = await apiService.getItemGroups({
        page: 1,
        pageSize: 100,
        includeCancelled: false
      });
      setItemGroups(response.itemGroups || []);
    } catch (err) {
      console.error('Error loading item groups:', err);
    }
  };

  const fetchItem = async () => {
    try {
      setLoading(true);
      const data = await apiService.getItem(id);
      setItem(data);
    } catch (err) {
      console.error('Error loading item:', err);
      alert('Ürün bilgisi yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const fetchFiles = async () => {
    if (!id) return;

    try {
      setFilesLoading(true);
      const files = await apiService.getItemFiles(parseInt(id));
      const filesArray = Array.isArray(files) ? files : [];
      
      const mappedFiles = filesArray.map(file => ({
        ...file,
        isPdf: file.fileExtension?.toLowerCase() === '.pdf',
        formattedSize: formatFileSize(file.fileSize),
        formattedUploadDate: formatDate(file.uploadedAt)
      }));
      
      setUploadedFiles(mappedFiles);
    } catch (err) {
      console.error('Error loading files:', err);
    } finally {
      setFilesLoading(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('tr-TR');
  };

  const handleEdit = () => {
    navigate(`/definitions/items/edit/${id}`, { state: { item, itemGroups } });
  };

  const handleDelete = async () => {
    if (!window.confirm('Bu ürünü silmek istediğinizden emin misiniz?')) {
      return;
    }

    try {
      setLoading(true);
      await apiService.deleteItem(id);
      alert('Ürün başarıyla silindi');
      navigate('/definitions/items');
    } catch (err) {
      console.error('Error deleting item:', err);
      alert('Ürün silinirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate('/definitions/items');
  };

  const handlePreviewFile = (fileId) => {
    const file = uploadedFiles.find(f => f.id === fileId);
    if (file) {
      setPreviewFile(file);
      setShowPreview(true);
    }
  };

  // ✅ YENİ: ZIP olarak tüm dosyaları indir
  const handleDownloadAllAsZip = async () => {
    if (uploadedFiles.length === 0) {
      alert('İndirilecek dosya yok');
      return;
    }

    try {
      setDownloadingZip(true);

      // Dosya adı: ürünKodu_tarih.zip
      const productCode = item.code || item.number || item.id;
      const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      const zipFileName = `${productCode}_${timestamp}.zip`;

      // API endpoint
      const apiBaseUrl = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5154/api';
      const downloadUrl = `${apiBaseUrl}/ItemFiles/download-zip/${id}`;

      console.log('📦 Downloading ZIP:', downloadUrl);

      // Fetch ile indir
      const response = await fetch(downloadUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      // Blob olarak al
      const blob = await response.blob();

      // İndir
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = zipFileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      console.log('✅ ZIP downloaded:', zipFileName);
    } catch (err) {
      console.error('❌ ZIP download error:', err);
      alert('ZIP dosyası oluşturulurken hata oluştu: ' + err.message);
    } finally {
      setDownloadingZip(false);
    }
  };

  // Pagination
  const totalPages = Math.ceil(uploadedFiles.length / filesPerPage);
  const startIndex = (currentPage - 1) * filesPerPage;
  const endIndex = startIndex + filesPerPage;
  const currentFiles = uploadedFiles.slice(startIndex, endIndex);

  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // Show loading state
  if (loading && !item) {
    return (
      <div className="container-fluid py-4">
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Yükleniyor...</span>
          </div>
          <div className="mt-2 text-muted">Ürün bilgisi yükleniyor...</div>
        </div>
      </div>
    );
  }

  // Show error state
  if (!item && !loading) {
    return (
      <div className="container-fluid py-4">
        <div className="alert alert-warning">
          <i className="bi bi-exclamation-triangle me-2"></i>
          Ürün bulunamadı. Lütfen ürün listesinden tekrar seçin.
        </div>
        <button className="btn btn-secondary" onClick={handleBack}>
          <i className="bi bi-arrow-left me-2"></i>
          Ürün Listesine Dön
        </button>
      </div>
    );
  }

  return (
    <div className="container-fluid py-4">
      {/* Header */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="d-flex justify-content-between align-items-center">
            <div className="d-flex align-items-center">
              <button 
                className="btn btn-outline-secondary me-3"
                onClick={handleBack}
                disabled={loading}
              >
                <i className="bi bi-arrow-left me-2"></i>
                Geri
              </button>
              <div>
                <h2 className="mb-1">
                  <i className="bi bi-box me-2"></i>
                  Ürün Detayı
                </h2>
                <p className="text-muted mb-0">
                  {item.name} - #{item.code || item.number}
                </p>
              </div>
            </div>
            <div>
              <button 
                className="btn btn-primary me-2"
                onClick={handleEdit}
                disabled={loading}
              >
                <i className="bi bi-pencil me-2"></i>
                Düzenle
              </button>
              <button 
                className="btn btn-outline-danger"
                onClick={handleDelete}
                disabled={loading}
              >
                <i className="bi bi-trash me-2"></i>
                Sil
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="row">
        {/* Item Details */}
        <div className={`col-12 ${uploadedFiles.length > 0 ? 'col-lg-7' : 'col-lg-12'}`}>
          <div className="card shadow-sm">
            <div className="card-body">
              <ItemDetail
                item={item}
                loading={loading}
                itemGroups={itemGroups}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            </div>
          </div>
        </div>

        {/* Files Section - READ ONLY with PAGINATION */}
        {uploadedFiles.length > 0 && (
          <div className="col-12 col-lg-5">
            <div className="card shadow-sm">
              <div className="card-header bg-white d-flex justify-content-between align-items-center">
                <h6 className="mb-0">
                  <i className="bi bi-file-earmark me-2"></i>
                  Dosyalar ({uploadedFiles.length})
                </h6>
                {/* ✅ ZIP İndirme Butonu */}
                <button
                  className="btn btn-sm btn-outline-success"
                  onClick={handleDownloadAllAsZip}
                  disabled={downloadingZip || filesLoading}
                  title="Tüm dosyaları ZIP olarak indir"
                >
                  {downloadingZip ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-1"></span>
                      ZIP...
                    </>
                  ) : (
                    <>
                      <Archive size={14} className="me-1" />
                      ZIP İndir
                    </>
                  )}
                </button>
              </div>
              <div className="card-body">
                {filesLoading ? (
                  <div className="text-center py-3">
                    <div className="spinner-border spinner-border-sm" role="status">
                      <span className="visually-hidden">Yükleniyor...</span>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* File List */}
                    <div className="list-group list-group-flush">
                      {currentFiles.map(file => (
                        <div key={file.id} className="list-group-item px-0 py-2">
                          <div className="d-flex justify-content-between align-items-center">
                            <div className="d-flex align-items-center flex-grow-1">
                              <i 
                                className={`bi ${file.isPdf ? 'bi-file-pdf text-danger' : 'bi-file-earmark'} me-2`} 
                                style={{ fontSize: '1.5rem' }}
                              ></i>
                              <div className="flex-grow-1">
                                <div className="fw-medium" style={{ fontSize: '0.875rem' }}>
                                  {file.fileName}
                                </div>
                                <small className="text-muted">
                                  {file.formattedSize} • {file.formattedUploadDate}
                                </small>
                              </div>
                            </div>
                            <div className="btn-group btn-group-sm">
                              {file.isPdf && (
                                <button
                                  className="btn btn-outline-primary"
                                  onClick={() => handlePreviewFile(file.id)}
                                  title="Önizle"
                                >
                                  <i className="bi bi-eye"></i>
                                </button>
                              )}
                              <a
                                href={`${(process.env.REACT_APP_API_BASE_URL || 'http://localhost:5154/api').replace('/api', '')}/api/ItemFiles/download/${file.id}`}
                                className="btn btn-outline-success"
                                download
                                title="İndir"
                              >
                                <i className="bi bi-download"></i>
                              </a>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* ✅ Pagination */}
                    {totalPages > 1 && (
                      <div className="d-flex justify-content-between align-items-center mt-3 pt-2 border-top">
                        <span className="text-muted" style={{ fontSize: '0.8rem' }}>
                          Sayfa {currentPage} / {totalPages}
                        </span>
                        <div className="btn-group btn-group-sm">
                          <button
                            className="btn btn-outline-secondary"
                            onClick={() => goToPage(currentPage - 1)}
                            disabled={currentPage === 1}
                          >
                            <ChevronLeft size={16} />
                          </button>
                          <button
                            className="btn btn-outline-secondary"
                            onClick={() => goToPage(currentPage + 1)}
                            disabled={currentPage === totalPages}
                          >
                            <ChevronRight size={16} />
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* PDF Preview Modal */}
      <PDFPreviewModal
        show={showPreview}
        file={previewFile}
        onClose={() => {
          setShowPreview(false);
          setPreviewFile(null);
        }}
      />
    </div>
  );
};

export default ItemDetailPage;