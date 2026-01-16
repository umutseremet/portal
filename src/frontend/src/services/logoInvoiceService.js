// src/frontend/src/services/logoInvoiceService.js
import api from './api';

const logoInvoiceService = {
  /**
   * Logo Connect faturalarını listele
   * @param {Object} filters - Filtreler (startDate, endDate, invoiceNumber, status)
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

    const response = await api.get(`/LogoInvoiceApprovals?${params.toString()}`);
    // api.get zaten response.data döndürüyor, bir kez daha .data yapmaya gerek yok
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
  }

};

export default logoInvoiceService;