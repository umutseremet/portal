// src/frontend/src/pages/LogoInvoiceApprovalPage.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import logoInvoiceService from '../services/logoInvoiceService';
import permissionService from '../services/permissionService';
import '../styles/logoInvoiceApproval.css';

const LogoInvoiceApprovalPage = () => {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 20;
  
  // Filtreler
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    invoiceNumber: '',
    status: ''
  });

  // ✅ Yetki kontrolleri
  const canSendForApproval = permissionService.canSendLogoInvoiceForApproval();
  const canApprove = permissionService.canApproveLogoInvoice();

  // Sayfa yüklendiğinde verileri çek ve yetki kontrolü yap
  useEffect(() => {
    // ✅ Hiç yetkisi yoksa dashboard'a yönlendir
    if (!permissionService.canAccessLogoInvoiceMenu()) {
      console.warn('🚫 User has no Logo Invoice permission, redirecting to dashboard');
      navigate('/dashboard');
      return;
    }
    
    loadInvoices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage]);

  const loadInvoices = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await logoInvoiceService.getInvoices({
        ...filters,
        page: currentPage,
        pageSize: pageSize
      });
      
      console.log('📦 API Response:', response);
      
      const invoiceList = response.invoices || response.Invoices || [];
      const total = response.totalCount || response.TotalCount || 0;
      
      setInvoices(invoiceList);
      setTotalCount(total);
      setTotalPages(Math.ceil(total / pageSize));
      
      console.log('📋 Invoice count:', invoiceList.length, 'Total:', total);
    } catch (err) {
      console.error('❌ Fatura listesi yüklenirken hata:', err);
      setError(err.response?.data?.message || 'Fatura listesi yüklenirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    loadInvoices();
  };

  const handleClearFilters = () => {
    setFilters({
      startDate: '',
      endDate: '',
      invoiceNumber: '',
      status: ''
    });
    setCurrentPage(1);
    setTimeout(() => loadInvoices(), 100);
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSendForApproval = async (logicalRef, invoiceNumber) => {
    if (!window.confirm(`${invoiceNumber} nolu fatura onaya gönderilecek. Onaylıyor musunuz?`)) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      
      await logoInvoiceService.sendForApproval(logicalRef);
      setSuccess(`${invoiceNumber} nolu fatura başarıyla onaya gönderildi.`);
      await loadInvoices();
    } catch (err) {
      console.error('Onaya gönderme hatası:', err);
      setError(err.response?.data?.message || 'Fatura onaya gönderilirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (logicalRef, invoiceNumber) => {
    if (!window.confirm(`${invoiceNumber} nolu fatura onaylanacak. Onaylıyor musunuz?`)) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      
      await logoInvoiceService.approveInvoice(logicalRef);
      setSuccess(`${invoiceNumber} nolu fatura başarıyla onaylandı.`);
      await loadInvoices();
    } catch (err) {
      console.error('Onaylama hatası:', err);
      setError(err.response?.data?.message || 'Fatura onaylanırken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const handleRevokeApproval = async (logicalRef, invoiceNumber, currentStatus) => {
    let confirmMessage = '';
    
    if (currentStatus === 'Approved') {
      confirmMessage = `${invoiceNumber} nolu faturanın ONAYI GERİ ALINACAK ve "Onay Bekliyor" durumuna dönecek. Onaylıyor musunuz?`;
    } else if (currentStatus === 'Pending') {
      confirmMessage = `${invoiceNumber} nolu faturanın ONAYA GÖNDERİLMESİ İPTAL EDİLECEK ve "Onaya Gönderilmedi" durumuna dönecek. Onaylıyor musunuz?`;
    }

    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      
      await logoInvoiceService.revokeApproval(logicalRef);
      
      if (currentStatus === 'Approved') {
        setSuccess(`${invoiceNumber} nolu faturanın onayı başarıyla geri alındı.`);
      } else {
        setSuccess(`${invoiceNumber} nolu faturanın onaya gönderilmesi başarıyla iptal edildi.`);
      }
      
      await loadInvoices();
    } catch (err) {
      console.error('Onay geri alma hatası:', err);
      setError(err.response?.data?.message || 'İşlem sırasında bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const handleExportToExcel = async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      
      await logoInvoiceService.exportToExcel(filters);
      setSuccess('Excel dosyası başarıyla indirildi.');
    } catch (err) {
      console.error('Excel export hatası:', err);
      setError('Excel dışa aktarma sırasında bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'NotSent':
        return <span className="badge bg-secondary">Onaya Gönderilmedi</span>;
      case 'Pending':
        return <span className="badge bg-warning text-dark">Onay Bekliyor</span>;
      case 'Approved':
        return <span className="badge bg-success">Onaylandı</span>;
      default:
        return <span className="badge bg-secondary">{status}</span>;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleString('tr-TR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="logo-invoice-approval-page">
      <div className="page-header mb-4">
        <h2>
          <i className="bi bi-receipt-cutoff me-2"></i>
          Logo Fatura Onay Yönetimi
        </h2>
        <p className="text-muted">
          Logo Connect sistemindeki faturaları görüntüleyebilir ve onay süreçlerini yönetebilirsiniz.
        </p>
      </div>

      {/* Filtreler */}
      <div className="card mb-4">
        <div className="card-body">
          <form onSubmit={handleSearch}>
            <div className="row g-3">
              <div className="col-md-3">
                <div className="mb-3">
                  <label className="form-label">Başlangıç Tarihi</label>
                  <input
                    type="date"
                    className="form-control"
                    value={filters.startDate}
                    onChange={(e) => handleFilterChange('startDate', e.target.value)}
                  />
                </div>
              </div>
              <div className="col-md-3">
                <div className="mb-3">
                  <label className="form-label">Bitiş Tarihi</label>
                  <input
                    type="date"
                    className="form-control"
                    value={filters.endDate}
                    onChange={(e) => handleFilterChange('endDate', e.target.value)}
                  />
                </div>
              </div>
              <div className="col-md-3">
                <div className="mb-3">
                  <label className="form-label">Fatura Numarası</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Fatura no ara..."
                    value={filters.invoiceNumber}
                    onChange={(e) => handleFilterChange('invoiceNumber', e.target.value)}
                  />
                </div>
              </div>
              <div className="col-md-3">
                <div className="mb-3">
                  <label className="form-label">Durum</label>
                  <select
                    className="form-select"
                    value={filters.status}
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                  >
                    <option value="">Tümü</option>
                    <option value="NotSent">Onaya Gönderilmedi</option>
                    <option value="Pending">Onay Bekliyor</option>
                    <option value="Approved">Onaylandı</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="row mt-2">
              <div className="col-12">
                <button type="submit" className="btn btn-primary me-2">
                  <i className="bi bi-search me-1"></i>
                  Ara
                </button>
                <button 
                  type="button" 
                  className="btn btn-outline-secondary me-2" 
                  onClick={handleClearFilters}
                >
                  <i className="bi bi-x-circle me-1"></i>
                  Temizle
                </button>
                <button 
                  type="button" 
                  className="btn btn-success" 
                  onClick={handleExportToExcel}
                  disabled={loading}
                >
                  <i className="bi bi-file-earmark-excel me-1"></i>
                  Excel'e Aktar
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Mesajlar */}
      {error && (
        <div className="alert alert-danger alert-dismissible fade show" role="alert">
          <i className="bi bi-exclamation-triangle-fill me-2"></i>
          {error}
          <button type="button" className="btn-close" onClick={() => setError(null)}></button>
        </div>
      )}
      {success && (
        <div className="alert alert-success alert-dismissible fade show" role="alert">
          <i className="bi bi-check-circle-fill me-2"></i>
          {success}
          <button type="button" className="btn-close" onClick={() => setSuccess(null)}></button>
        </div>
      )}

      {/* Fatura Listesi */}
      <div className="card">
        <div className="card-body">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Yükleniyor...</span>
              </div>
              <p className="mt-3 text-muted">Yükleniyor...</p>
            </div>
          ) : (
            <>
              {invoices.length === 0 ? (
                <div className="text-center py-5 text-muted">
                  <i className="bi bi-inbox display-4 d-block mb-3"></i>
                  <p>Gösterilecek fatura bulunamadı.</p>
                </div>
              ) : (
                <>
                  <div className="mb-3 d-flex justify-content-between align-items-center">
                    <div>
                      <strong>{totalCount}</strong> fatura bulundu
                      {totalPages > 1 && (
                        <span className="text-muted ms-2">
                          (Sayfa {currentPage} / {totalPages})
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="table-responsive">
                    <table className="table table-hover align-middle">
                      <thead>
                        <tr>
                          <th>Fatura No</th>
                          <th>Gönderen</th>
                          <th>Fatura Tarihi</th>
                          <th>Durum</th>
                          <th>Onaya Gönderilme</th>
                          <th>Onaylanma</th>
                          <th className="text-end">İşlemler</th>
                        </tr>
                      </thead>
                      <tbody>
                        {invoices.map((invoice) => (
                          <tr key={invoice.logicalRef}>
                            <td>
                              <strong>{invoice.invoiceNumber}</strong>
                            </td>
                            <td>
                              <small className="text-muted">
                                {invoice.senderTitle || '-'}
                              </small>
                            </td>
                            <td>{formatDate(invoice.invoiceDate)}</td>
                            <td>{getStatusBadge(invoice.status)}</td>
                            <td>
                              {invoice.sentForApprovalDate ? (
                                <small className="text-muted">
                                  {formatDateTime(invoice.sentForApprovalDate)}
                                </small>
                              ) : (
                                '-'
                              )}
                            </td>
                            <td>
                              {invoice.approvedDate ? (
                                <small className="text-muted">
                                  {formatDateTime(invoice.approvedDate)}
                                </small>
                              ) : (
                                '-'
                              )}
                            </td>
                            <td className="text-end">
                              {/* ✅ Onaya Gönder - Sadece yetkisi olanlar görsün */}
                              {invoice.status === 'NotSent' && canSendForApproval && (
                                <button
                                  className="btn btn-sm btn-outline-primary"
                                  onClick={() => handleSendForApproval(invoice.logicalRef, invoice.invoiceNumber)}
                                  disabled={loading}
                                >
                                  <i className="bi bi-send me-1"></i>
                                  Onaya Gönder
                                </button>
                              )}
                              
                              {/* ✅ Onayla/İptal - Sadece yetkisi olanlar görsün */}
                              {invoice.status === 'Pending' && canApprove && (
                                <div className="btn-group" role="group">
                                  <button
                                    className="btn btn-sm btn-success"
                                    onClick={() => handleApprove(invoice.logicalRef, invoice.invoiceNumber)}
                                    disabled={loading}
                                  >
                                    <i className="bi bi-check-circle me-1"></i>
                                    Onayla
                                  </button>
                                  <button
                                    className="btn btn-sm btn-outline-warning"
                                    onClick={() => handleRevokeApproval(invoice.logicalRef, invoice.invoiceNumber, invoice.status)}
                                    disabled={loading}
                                    title="Onaya gönderilmeyi iptal et"
                                  >
                                    <i className="bi bi-x-circle me-1"></i>
                                    İptal
                                  </button>
                                </div>
                              )}
                              
                              {/* ✅ Onaylanmış - Sadece onaylama yetkisi olanlar geri alabilir */}
                              {invoice.status === 'Approved' && (
                                <div className="btn-group" role="group">
                                  <span className="badge bg-success d-flex align-items-center px-3">
                                    <i className="bi bi-check-circle-fill me-1"></i>
                                    Onaylandı
                                  </span>
                                  {canApprove && (
                                    <button
                                      className="btn btn-sm btn-outline-danger"
                                      onClick={() => handleRevokeApproval(invoice.logicalRef, invoice.invoiceNumber, invoice.status)}
                                      disabled={loading}
                                      title="Onayı geri al"
                                    >
                                      <i className="bi bi-arrow-counterclockwise me-1"></i>
                                      Geri Al
                                    </button>
                                  )}
                                </div>
                              )}

                              {/* ✅ Yetkisi olmayan kullanıcılar için mesaj */}
                              {invoice.status === 'NotSent' && !canSendForApproval && (
                                <span className="text-muted small">
                                  <i className="bi bi-lock me-1"></i>
                                  Yetkiniz yok
                                </span>
                              )}
                              {invoice.status === 'Pending' && !canApprove && (
                                <span className="text-muted small">
                                  <i className="bi bi-lock me-1"></i>
                                  Yetkiniz yok
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </>
          )}
        </div>

        {/* Pagination */}
        {!loading && invoices.length > 0 && totalPages > 1 && (
          <div className="card-footer bg-white">
            <div className="d-flex justify-content-center">
              <nav>
                <ul className="pagination mb-0">
                  <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                    <button
                      className="page-link"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      <i className="bi bi-chevron-left"></i>
                    </button>
                  </li>

                  {[...Array(Math.min(5, totalPages))].map((_, idx) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = idx + 1;
                    } else if (currentPage <= 3) {
                      pageNum = idx + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + idx;
                    } else {
                      pageNum = currentPage - 2 + idx;
                    }

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
                  })}

                  <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                    <button
                      className="page-link"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      <i className="bi bi-chevron-right"></i>
                    </button>
                  </li>
                </ul>
              </nav>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LogoInvoiceApprovalPage;