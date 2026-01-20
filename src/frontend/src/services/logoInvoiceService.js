// src/frontend/src/services/logoInvoiceService.js
import api from './api';

const logoInvoiceService = {
  /**
   * Logo Connect faturalarını listele
   * @param {Object} filters - Filtreler (startDate, endDate, invoiceNumber, status, page, pageSize)
   */
  async getInvoices(filters = {}) {
    const params = new URLSearchParams();
    
    if (filters.startDate) {
      params.append('startDate', filters.startDate);
    }
    if (filters.endDate) {
      params.append('endDate', filters.endDate);
    }
    if (filters.invoiceNumber) {
      params.append('invoiceNumber', filters.invoiceNumber);
    }
    if (filters.status) {
      params.append('status', filters.status);
    }
    if (filters.page) {
      params.append('page', filters.page);
    }
    if (filters.pageSize) {
      params.append('pageSize', filters.pageSize);
    }

    const response = await api.get(`/LogoInvoiceApprovals?${params.toString()}`);
    return response;
  },

  /**
   * Faturayı onaya gönder
   * @param {number} logicalRef - Logo LOGICALREF
   * @param {string} notes - Notlar (opsiyonel)
   */
  async sendForApproval(logicalRef, notes = '') {
    const response = await api.post('/LogoInvoiceApprovals/send-for-approval', {
      logicalRef,
      notes
    });
    return response;
  },

  /**
   * Faturayı onayla
   * @param {number} logicalRef - Logo LOGICALREF
   * @param {string} notes - Notlar (opsiyonel)
   */
  async approveInvoice(logicalRef, notes = '') {
    const response = await api.post('/LogoInvoiceApprovals/approve', {
      logicalRef,
      notes
    });
    return response;
  },

  /**
   * Fatura onayını geri al
   * @param {number} logicalRef - Logo LOGICALREF
   * @param {string} notes - Notlar (opsiyonel)
   */
  async revokeApproval(logicalRef, notes = '') {
    const response = await api.post('/LogoInvoiceApprovals/revoke', {
      logicalRef,
      notes
    });
    return response;
  },

  /**
   * Faturaları Excel'e aktar
   * @param {Object} filters - Filtreler
   */
  async exportToExcel(filters = {}) {
    console.log('📦 Exporting invoices to Excel:', filters);

    try {
      const requestBody = {
        startDate: filters.startDate || null,
        endDate: filters.endDate || null,
        invoiceNumber: filters.invoiceNumber || null,
        status: filters.status || null
      };

      const token = localStorage.getItem('token');
      
      // api.js'deki baseURL'i kullan
      const baseURL = window.location.hostname === 'localhost' 
        ? 'http://localhost:5154/api'
        : '/api';

      const response = await fetch(`${baseURL}/LogoInvoiceApprovals/export`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Export failed: ${response.status} - ${errorText}`);
      }

      // Dosya adını al
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = 'Logo_Faturalar.xlsx';

      if (contentDisposition) {
        // filename="Logo_Faturalar_20260119_143052.xlsx" formatından dosya adını çıkar
        const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1].replace(/['"]/g, '');
        }
      }

      // Dosyayı indir
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      console.log('✅ Excel export successful:', filename);
      return true;
    } catch (error) {
      console.error('❌ exportToExcel error:', error);
      throw error;
    }
  }
};

export default logoInvoiceService;