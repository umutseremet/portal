import apiService from './api';

class VisitorService {
  
  // Get visitors with filtering and pagination
  async getVisitors(params = {}) {
    try {
      const queryParams = new URLSearchParams();
      
      // Filtering parameters
      if (params.fromDate) queryParams.append('fromDate', params.fromDate);
      if (params.toDate) queryParams.append('toDate', params.toDate);
      if (params.company) queryParams.append('company', params.company);
      if (params.visitor) queryParams.append('visitor', params.visitor);
      
      // Pagination parameters
      if (params.page) queryParams.append('page', params.page.toString());
      if (params.pageSize) queryParams.append('pageSize', params.pageSize.toString());
      
      // Sorting parameters
      if (params.sortBy) queryParams.append('sortBy', params.sortBy);
      if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);

      const endpoint = queryParams.toString() 
        ? `/visitors?${queryParams.toString()}` 
        : '/visitors';

      return await apiService.get(endpoint);
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

      return await apiService.get(`/visitors/${id}`);
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

      return await apiService.post('/visitors', formattedData);
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

      return await apiService.put(`/visitors/${id}`, formattedData);
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

      return await apiService.delete(`/visitors/${id}`);
    } catch (error) {
      console.error('Error deleting visitor:', error);
      throw new Error(error.message || 'Ziyaretçi silinirken hata oluştu');
    }
  }

  // Get visitor statistics
  async getVisitorStats() {
    try {
      return await apiService.get('/visitors/stats');
    } catch (error) {
      console.error('Error fetching visitor stats:', error);
      throw new Error(error.message || 'Ziyaretçi istatistikleri alınırken hata oluştu');
    }
  }

  // Export visitors data
  async exportVisitors(params = {}) {
    try {
      const queryParams = new URLSearchParams();
      
      // Filtering parameters for export
      if (params.fromDate) queryParams.append('fromDate', params.fromDate);
      if (params.toDate) queryParams.append('toDate', params.toDate);
      if (params.company) queryParams.append('company', params.company);
      if (params.visitor) queryParams.append('visitor', params.visitor);

      const endpoint = queryParams.toString() 
        ? `/visitors/export?${queryParams.toString()}` 
        : '/visitors/export';

      return await apiService.get(endpoint);
    } catch (error) {
      console.error('Error exporting visitors:', error);
      throw new Error(error.message || 'Veriler dışa aktarılırken hata oluştu');
    }
  }

  // Utility: Format date to YYYY-MM-DD format
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

  // Utility: Format date for display (DD.MM.YYYY)
  formatDateForDisplay(date) {
    if (!date) return '';
    
    const d = new Date(date);
    if (isNaN(d)) return '';
    
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    
    return `${day}.${month}.${year}`;
  }

  // Utility: Get today's date in YYYY-MM-DD format
  getTodayDate() {
    return this.formatDate(new Date());
  }

  // Utility: Get date range (last N days)
  getDateRange(days) {
    const toDate = new Date();
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - days);
    
    return {
      fromDate: this.formatDate(fromDate),
      toDate: this.formatDate(toDate)
    };
  }

  // Utility: Validate visitor data
  validateVisitorData(data) {
    const errors = {};

    if (!data.date) {
      errors.date = 'Ziyaret tarihi zorunludur';
    }

    if (!data.company || data.company.trim().length === 0) {
      errors.company = 'Şirket adı zorunludur';
    } else if (data.company.length > 100) {
      errors.company = 'Şirket adı en fazla 100 karakter olabilir';
    }

    if (!data.visitor || data.visitor.trim().length === 0) {
      errors.visitor = 'Ziyaretçi adı zorunludur';
    } else if (data.visitor.length > 255) {
      errors.visitor = 'Ziyaretçi adı en fazla 255 karakter olabilir';
    }

    if (data.description && data.description.length > 500) {
      errors.description = 'Açıklama en fazla 500 karakter olabilir';
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }

  // Utility: Create CSV content from visitors data
  createCSVContent(visitors) {
    if (!Array.isArray(visitors) || visitors.length === 0) {
      return '';
    }

    // CSV headers
    const headers = ['ID', 'Tarih', 'Şirket', 'Ziyaretçi', 'Açıklama'];
    
    // CSV rows
    const rows = visitors.map(visitor => [
      visitor.id,
      this.formatDateForDisplay(visitor.date),
      visitor.company || '',
      visitor.visitor || '',
      visitor.description || ''
    ]);

    // Combine headers and rows
    const csvContent = [headers, ...rows]
      .map(row => row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    return csvContent;
  }

  // Utility: Download CSV file
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

  // Utility: Get filter summary text
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

  // Utility: Get quick date filters
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