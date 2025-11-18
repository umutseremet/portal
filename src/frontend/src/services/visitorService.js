import apiService from './api';

class VisitorService {
  
  // Get visitors with filtering and pagination
  async getVisitors(params = {}) {
    try {
      // Use the apiService.getVisitors method directly
      return await apiService.getVisitors(params);
    } catch (error) {
      console.error('Error fetching visitors:', error);
      throw new Error(error.message || 'Ziyaretçiler alınırken hata oluştu');
    }
  }

  // Get single visitor by ID
  async getVisitor(id) {
    try {
      if (!id) {
        throw new Error('Ziyaretçi ID\'si gerekli');
      }

      return await apiService.getVisitor(id);
    } catch (error) {
      console.error('Error fetching visitor:', error);
      throw new Error(error.message || 'Ziyaretçi alınırken hata oluştu');
    }
  }

  // Create new visitor
  async createVisitor(visitorData) {
    try {
      // Validate required fields
      if (!visitorData.date || !visitorData.company || !visitorData.visitor) {
        throw new Error('Tarih, şirket adı ve ziyaretçi adı zorunlu alanlar');
      }

      // Format date to ensure consistency
      const formattedData = {
        ...visitorData,
        date: this.formatDate(visitorData.date)
      };

      return await apiService.createVisitor(formattedData);
    } catch (error) {
      console.error('Error creating visitor:', error);
      throw new Error(error.message || 'Ziyaretçi oluşturulurken hata oluştu');
    }
  }

  // Update existing visitor
  async updateVisitor(id, visitorData) {
    try {
      if (!id) {
        throw new Error('Ziyaretçi ID\'si gerekli');
      }

      // Validate required fields
      if (!visitorData.date || !visitorData.company || !visitorData.visitor) {
        throw new Error('Tarih, şirket adı ve ziyaretçi adı zorunlu alanlar');
      }

      // Format date to ensure consistency
      const formattedData = {
        ...visitorData,
        date: this.formatDate(visitorData.date)
      };

      return await apiService.updateVisitor(id, formattedData);
    } catch (error) {
      console.error('Error updating visitor:', error);
      throw new Error(error.message || 'Ziyaretçi güncellenirken hata oluştu');
    }
  }

  // Delete visitor
  async deleteVisitor(id) {
    try {
      if (!id) {
        throw new Error('Ziyaretçi ID\'si gerekli');
      }

      return await apiService.deleteVisitor(id);
    } catch (error) {
      console.error('Error deleting visitor:', error);
      throw new Error(error.message || 'Ziyaretçi silinirken hata oluştu');
    }
  }

  // Get visitor statistics
  async getVisitorStats() {
    try {
      return await apiService.getVisitorStats();
    } catch (error) {
      console.error('Error fetching visitor stats:', error);
      throw new Error(error.message || 'Ziyaretçi istatistikleri alınırken hata oluştu');
    }
  }

  // Export visitors data
  async exportVisitors(params = {}) {
    try {
      return await apiService.exportVisitors(params);
    } catch (error) {
      console.error('Error exporting visitors:', error);
      throw new Error(error.message || 'Veriler dışa aktarılırken hata oluştu');
    }
  }

  // ===== UTILITY METHODS =====

  // Format date to YYYY-MM-DD format
  formatDate(date) {
    if (!date) return null;
    
    if (typeof date === 'string') {
      // If already in correct format, return as is
      if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return date;
      }
      date = new Date(date);
    }
    
    if (date instanceof Date && !isNaN(date)) {
      return date.toISOString().split('T')[0];
    }
    
    return null;
  }

  // Format date for display (DD.MM.YYYY)
  formatDateForDisplay(date) {
    if (!date) return '';
    
    const d = new Date(date);
    if (isNaN(d)) return '';
    
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    
    return `${day}.${month}.${year}`;
  }

  // Get today's date in YYYY-MM-DD format
  getTodayDate() {
    return this.formatDate(new Date());
  }

  // Get date range (last N days)
  getDateRange(days) {
    const toDate = new Date();
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - days);
    
    return {
      fromDate: this.formatDate(fromDate),
      toDate: this.formatDate(toDate)
    };
  }

  // Create CSV content from visitors array
  createCSVContent(visitors) {
    if (!visitors || visitors.length === 0) return null;

    const headers = ['Tarih', 'Şirket', 'Ziyaretçi', 'Açıklama'];
    const csvRows = [headers.join(';')];

    visitors.forEach(visitor => {
      const row = [
        this.formatDateForDisplay(visitor.date) || '',
        visitor.company || '',
        visitor.visitor || '',
        visitor.description ? `"${visitor.description.replace(/"/g, '""')}"` : ''
      ];
      csvRows.push(row.join(';'));
    });

    return csvRows.join('\n');
  }

  // Download CSV file
  downloadCSV(visitors, filename = 'ziyaretciler.csv') {
    const csvContent = this.createCSVContent(visitors);
    if (!csvContent) {
      throw new Error('İndirilecek veri bulunamadı');
    }

    // Create blob and download
    const blob = new Blob(['\uFEFF' + csvContent], { 
      type: 'text/csv;charset=utf-8;' 
    });
    
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  }

  // Get filter summary text
  getFilterSummary(filters) {
    const parts = [];

    if (filters.fromDate && filters.toDate) {
      parts.push(`${this.formatDateForDisplay(filters.fromDate)} - ${this.formatDateForDisplay(filters.toDate)}`);
    } else if (filters.fromDate) {
      parts.push(`${this.formatDateForDisplay(filters.fromDate)} tarihinden itibaren`);
    } else if (filters.toDate) {
      parts.push(`${this.formatDateForDisplay(filters.toDate)} tarihine kadar`);
    }

    if (filters.company) {
      parts.push(`Şirket: ${filters.company}`);
    }

    if (filters.visitor) {
      parts.push(`Ziyaretçi: ${filters.visitor}`);
    }

    return parts.length > 0 ? parts.join(' • ') : 'Tüm kayıtlar';
  }

  // Get quick date filters
  getQuickDateFilters() {
    const today = new Date();
    const filters = [];

    // Bugün
    filters.push({
      label: 'Bugün',
      fromDate: this.formatDate(today),
      toDate: this.formatDate(today)
    });

    // Bu hafta
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    filters.push({
      label: 'Bu Hafta',
      fromDate: this.formatDate(startOfWeek),
      toDate: this.formatDate(today)
    });

    // Bu ay
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    filters.push({
      label: 'Bu Ay',
      fromDate: this.formatDate(startOfMonth),
      toDate: this.formatDate(today)
    });

    // Son 7 gün
    const last7Days = new Date(today);
    last7Days.setDate(today.getDate() - 7);
    filters.push({
      label: 'Son 7 Gün',
      fromDate: this.formatDate(last7Days),
      toDate: this.formatDate(today)
    });

    // Son 30 gün
    const last30Days = new Date(today);
    last30Days.setDate(today.getDate() - 30);
    filters.push({
      label: 'Son 30 Gün',
      fromDate: this.formatDate(last30Days),
      toDate: this.formatDate(today)
    });

    return filters;
  }
}

// Create and export a singleton instance
const visitorService = new VisitorService();
export default visitorService;