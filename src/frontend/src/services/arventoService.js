// src/frontend/src/services/arventoService.js

import apiService from './api';

class ArventoService {
  
  /**
   * Araçların son konum bilgilerini getirir
   * @param {string} language - Dil kodu (0: Türkçe, 1: İngilizce)
   */
  async getVehicleStatus(language = '0') {
    try {
      console.log('🚗 ArventoService: Getting vehicle status');
      
      const response = await apiService.get('/Arvento/vehicle-status', { language });
      
      console.log('✅ Vehicle status response:', response);
      
      return {
        success: true,
        data: response.data || [],
        totalCount: response.totalCount || 0,
        message: response.message
      };
    } catch (error) {
      console.error('❌ Error getting vehicle status:', error);
      throw new Error(error.message || 'Araç durumu alınırken hata oluştu');
    }
  }

  /**
   * Araç çalışma raporunu getirir
   * @param {Object} params - Filtre parametreleri
   * @param {Date} params.startDate - Başlangıç tarihi
   * @param {Date} params.endDate - Bitiş tarihi
   * @param {string} params.node - Cihaz numarası (opsiyonel)
   * @param {string} params.group - Araç grubu (opsiyonel)
   * @param {string} params.locale - Yerel ayar (varsayılan: 'tr')
   * @param {string} params.language - Dil kodu (0: Türkçe, 1: İngilizce)
   */
  async getWorkingReport(params) {
    try {
      console.log('📊 ArventoService: Getting working report', params);
      
      // Tarih validasyonu
      if (!params.startDate || !params.endDate) {
        throw new Error('Başlangıç ve bitiş tarihleri zorunludur');
      }

      // Tarihleri ISO formatına çevir
      const formattedParams = {
        startDate: this.formatDate(params.startDate),
        endDate: this.formatDate(params.endDate),
        node: params.node || '',
        group: params.group || '',
        locale: params.locale || 'tr',
        language: params.language || '0'
      };

      const response = await apiService.get('/Arvento/working-report', formattedParams);
      
      console.log('✅ Working report response:', response);
      
      return {
        success: true,
        data: response.data || [],
        totalCount: response.totalCount || 0,
        startDate: response.startDate,
        endDate: response.endDate,
        message: response.message
      };
    } catch (error) {
      console.error('❌ Error getting working report:', error);
      throw new Error(error.message || 'Araç çalışma raporu alınırken hata oluştu');
    }
  }

  /**
   * Arvento bağlantısını test eder
   */
  async testConnection() {
    try {
      console.log('🔌 ArventoService: Testing connection');
      
      const response = await apiService.get('/Arvento/test-connection');
      
      console.log('✅ Connection test response:', response);
      
      return {
        success: response.success,
        message: response.message,
        vehicleCount: response.vehicleCount
      };
    } catch (error) {
      console.error('❌ Connection test failed:', error);
      throw new Error(error.message || 'Bağlantı testi başarısız');
    }
  }

  /**
   * Tarihi ISO string formatına çevirir
   * @param {Date|string} date 
   */
  formatDate(date) {
    if (!date) return '';
    
    const d = new Date(date);
    return d.toISOString();
  }

  /**
   * Süreyi saat:dakika:saniye formatına çevirir
   * @param {string} timeString - Örnek: "02:30:15" 
   */
  formatTimeString(timeString) {
    if (!timeString) return '00:00:00';
    return timeString;
  }

  /**
   * Koordinatları Google Maps linki olarak döndürür
   * @param {number} latitude 
   * @param {number} longitude 
   */
  getMapLink(latitude, longitude) {
    if (!latitude || !longitude) return null;
    return `https://www.google.com/maps?q=${latitude},${longitude}`;
  }
}

// Singleton instance oluştur
const arventoService = new ArventoService();

export default arventoService;