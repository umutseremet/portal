// src/frontend/src/services/arventoService.js
// ✅ getVehicleMappings metodu eklendi

import api from './api';

const arventoService = {
  /**
   * ✅ YENİ: Araç plaka ve cihaz eşleşmelerini getirir
   * @param {Object} params - Query parametreleri
   * @returns {Promise<Array>} Araç eşleşmeleri listesi
   */
  async getVehicleMappings(params = {}) {
    try {
      const queryParams = new URLSearchParams({
        language: params.language || '0',
        ...params
      });

      console.log('📡 Getting vehicle mappings from Arvento');

      const response = await api.get(`/Arvento/vehicle-mappings?${queryParams}`);

      console.log('✅ Vehicle mappings response:', response.data);

      return response.data?.data || [];
    } catch (error) {
      console.error('❌ Error getting vehicle mappings:', error);
      throw new Error(error.response?.data?.message || 'Araç eşleşmeleri alınırken hata oluştu');
    }
  },

  /**
   * Araçların anlık konum bilgilerini getirir
   * @param {Object} params - Query parametreleri
   * @returns {Promise<Array>} Araç konum bilgileri
   */
  async getVehicleStatus(params = {}) {
    try {
      const queryParams = new URLSearchParams({
        language: params.language || '0',
        ...params
      });

      console.log('📡 Getting vehicle status from Arvento');

      const response = await api.get(`/Arvento/vehicle-status?${queryParams}`);

      console.log('✅ Vehicle status response:', response.data);

      return response.data?.data || [];
    } catch (error) {
      console.error('❌ Error getting vehicle status:', error);
      throw new Error(error.response?.data?.message || 'Araç konumları alınırken hata oluştu');
    }
  },

  /**
   * Araç çalışma raporunu getirir
   * @param {Object} params - Query parametreleri
   * @returns {Promise<Array>} Araç çalışma raporu
   */
  async getWorkingReport(params = {}) {
    try {
      const queryParams = new URLSearchParams({
        startDate: params.startDate,
        endDate: params.endDate,
        language: params.language || '0',
        locale: params.locale || 'tr',
        ...params
      });

      console.log('📡 Getting working report from Arvento');

      const response = await api.get(`/Arvento/working-report?${queryParams}`);

      console.log('✅ Working report response:', response.data);

      return response.data?.data || [];
    } catch (error) {
      console.error('❌ Error getting working report:', error);
      throw new Error(error.response?.data?.message || 'Çalışma raporu alınırken hata oluştu');
    }
  },

  /**
   * Arvento bağlantısını test eder
   * @returns {Promise<Object>} Test sonucu
   */
  async testConnection() {
    try {
      console.log('📡 Testing Arvento connection');

      const response = await api.get('/Arvento/test-connection');

      console.log('✅ Connection test response:', response.data);

      return response.data;
    } catch (error) {
      console.error('❌ Error testing connection:', error);
      throw new Error(error.response?.data?.message || 'Bağlantı testi başarısız');
    }
  }
};

export default arventoService;