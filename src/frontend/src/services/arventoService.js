// src/frontend/src/services/arventoService.js
// ✅ YENİ API ENDPOINT'LERİNE GÖRE GÜNCELLENMİŞ

import api from './api';

const arventoService = {
  /**
   * ✅ GÜNCELLEME: Araç plaka ve cihaz eşleşmelerini getirir
   * Backend Endpoint: GET /api/Arvento/vehicle-mappings
   * @param {Object} params - Query parametreleri
   * @param {string} params.language - Dil kodu (0: Türkçe, 1: İngilizce)
   * @returns {Promise<Array>} Araç eşleşmeleri listesi
   */
  async getVehicleMappings(params = {}) {
    try {
      const queryParams = new URLSearchParams({
        language: params.language || '0'
      });

      console.log('📡 Getting vehicle mappings from Arvento');

      const response = await api.get(`/Arvento/vehicle-mappings?${queryParams}`);

      console.log('✅ Vehicle mappings RAW response:', response);

      // ✅ Backend response formatı: { success, data, totalCount, message }
      if (response.success) {
        const data = response.data || [];
        console.log(`📊 Vehicle mappings data count: ${data.length}`);
        
        // İlk kaydı incele
        if (data.length > 0) {
          console.log('🔍 First mapping sample:', data[0]);
          console.log('  - nodeNo:', data[0].nodeNo);
          console.log('  - licensePlate:', data[0].licensePlate);
          console.log('  - deviceNo:', data[0].deviceNo);
        }
        
        return data;
      } else {
        throw new Error(response.message || 'Araç eşleşmeleri alınamadı');
      }
    } catch (error) {
      console.error('❌ Error getting vehicle mappings:', error);
      throw new Error(error.response?.data?.message || error.message || 'Araç eşleşmeleri alınırken hata oluştu');
    }
  },

  /**
   * ✅ GÜNCELLEME: Araçların anlık konum bilgilerini getirir
   * Backend Endpoint: GET /api/Arvento/vehicle-status
   * @param {Object} params - Query parametreleri
   * @param {string} params.language - Dil kodu (0: Türkçe, 1: İngilizce)
   * @returns {Promise<Array>} Araç konum bilgileri
   */
  async getVehicleStatus(params = {}) {
    try {
      const queryParams = new URLSearchParams({
        language: params.language || '0'
      });

      console.log('📡 Getting vehicle status from Arvento');

      const response = await api.get(`/Arvento/vehicle-status?${queryParams}`);

      console.log('✅ Vehicle status RAW response:', response);

      // ✅ Backend response formatı: { success, data, totalCount, message }
      if (response.success) {
        const data = response.data || [];
        console.log(`📊 Vehicle status data count: ${data.length}`);
        
        // İlk kaydı incele
        if (data.length > 0) {
          console.log('🔍 First status sample:', data[0]);
          console.log('  - nodeNo:', data[0].nodeNo);
          console.log('  - latitude:', data[0].latitude);
          console.log('  - longitude:', data[0].longitude);
        }
        
        return data;
      } else {
        throw new Error(response.message || 'Araç durumları alınamadı');
      }
    } catch (error) {
      console.error('❌ Error getting vehicle status:', error);
      throw new Error(error.response?.data?.message || error.message || 'Araç durumları alınırken hata oluştu');
    }
  },

  /**
   * ✅ GÜNCELLEME: Araç çalışma raporunu getirir
   * Backend Endpoint: GET /api/Arvento/working-report
   * @param {Object} params - Query parametreleri
   * @param {string} params.startDate - Başlangıç tarihi (ISO format)
   * @param {string} params.endDate - Bitiş tarihi (ISO format)
   * @param {string} params.node - Cihaz numarası (opsiyonel)
   * @param {string} params.group - Araç grubu (opsiyonel)
   * @param {string} params.locale - Yerel ayar (varsayılan: 'tr')
   * @param {string} params.language - Dil kodu (0: Türkçe, 1: İngilizce)
   * @returns {Promise<Array>} Araç çalışma raporları
   */
  async getWorkingReport(params = {}) {
    try {
      const queryParams = new URLSearchParams({
        startDate: params.startDate,
        endDate: params.endDate,
        language: params.language || '0',
        locale: params.locale || 'tr'
      });

      // Opsiyonel parametreler
      if (params.node) queryParams.append('node', params.node);
      if (params.group) queryParams.append('group', params.group);

      console.log('📡 Getting working report from Arvento with params:', Object.fromEntries(queryParams));

      const response = await api.get(`/Arvento/working-report?${queryParams}`);

      console.log('✅ Working report response:', response);

      // ✅ Backend response formatı: { success, data, totalCount, startDate, endDate, message }
      if (response.success) {
        return {
          data: response.data || [],
          startDate: response.startDate,
          endDate: response.endDate,
          totalCount: response.totalCount || 0
        };
      } else {
        throw new Error(response.message || 'Çalışma raporu alınamadı');
      }
    } catch (error) {
      console.error('❌ Error getting working report:', error);
      throw new Error(error.response?.data?.message || error.message || 'Çalışma raporu alınırken hata oluştu');
    }
  },

  /**
   * ✅ Arvento bağlantısını test eder
   * Backend Endpoint: GET /api/Arvento/test-connection
   * @returns {Promise<Object>} Test sonucu
   */
  async testConnection() {
    try {
      console.log('🔌 Testing Arvento connection');

      const response = await api.get('/Arvento/test-connection');

      console.log('✅ Connection test response:', response);

      return {
        success: response.success,
        message: response.message,
        vehicleCount: response.vehicleCount || 0
      };
    } catch (error) {
      console.error('❌ Arvento connection test failed:', error);
      throw new Error(error.response?.data?.message || error.message || 'Arvento bağlantı testi başarısız');
    }
  },

  /**
   * ✅ Araç eşleşmeleri ve durum bilgilerini birleştirir
   * İki API çağrısı yapar ve sonuçları merge eder
   * @param {string} language - Dil kodu (0: Türkçe, 1: İngilizce)
   * @returns {Promise<Array>} Birleştirilmiş araç verileri
   */
  async getCombinedVehicleData(language = '0') {
    try {
      console.log('📡 Getting combined vehicle data (mappings + status)');

      // Paralel olarak her iki servisi de çağır
      const [mappings, statuses] = await Promise.all([
        this.getVehicleMappings({ language }),
        this.getVehicleStatus({ language })
      ]);

      console.log('✅ Mappings count:', mappings.length);
      console.log('✅ Statuses count:', statuses.length);

      // ✅ NodeNo üzerinden eşleştir
      const combinedData = mappings.map(mapping => {
        const status = statuses.find(s => s.nodeNo === mapping.nodeNo);

        return {
          // Mapping verileri
          recordNo: mapping.recordNo,
          deviceNo: mapping.deviceNo,
          licensePlate: mapping.licensePlate,
          vehicleGsmNo: mapping.vehicleGsmNo,
          notes: mapping.notes,
          load: mapping.load,
          vehicleType: mapping.vehicleType,
          nodeNo: mapping.nodeNo,
          groupNo: mapping.groupNo,
          vehicleIcon: mapping.vehicleIcon,
          driverName: mapping.driverName,
          driverPhone: mapping.driverPhone,
          vehicleModel: mapping.vehicleModel,
          deviceType: mapping.deviceType,
          driverIdentificationNumber: mapping.driverIdentificationNumber,
          registrationDate: mapping.registrationDate,

          // ✅ Status verileri (varsa) - SADECE GERÇEKTEKİ FIELD'LAR
          latitude: status?.latitude || null,
          longitude: status?.longitude || null,
          speed: status?.speed || 0,
          address: status?.address || '',
          altitude: status?.altitude || 0,
          lastUpdateTime: status?.lastUpdateTime || null,
          region: status?.region || '',
          locationType: status?.locationType || '',
          district: status?.district || '',
          gpsQuality: status?.gpsQuality || 0,
          supportedDeviceCount: status?.supportedDeviceCount || 0,
          rssiSignalStrength: status?.rssiSignalStrength || 0,

          // Konum bilgisi var mı?
          hasLocation: !!(status?.latitude && status?.longitude)
        };
      });

      console.log('✅ Combined data count:', combinedData.length);

      return combinedData;
    } catch (error) {
      console.error('❌ Error getting combined vehicle data:', error);
      throw error;
    }
  }
};

export default arventoService;