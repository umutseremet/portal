// src/frontend/src/services/vehicleService.js

import api from './api';

/**
 * Vehicle service for API operations
 */
const vehicleServiceMethods = {
  /**
   * Get all vehicles with pagination and filters
   * @param {Object} params - Query parameters
   */
  async getVehicles(params = {}) {
    try {
      const response = await api.get('vehicles', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching vehicles:', error);
      throw new Error('Araç listesi alınamadı');
    }
  },

  /**
   * Get single vehicle by ID
   * @param {string|number} id - Vehicle ID
   */
  async getVehicle(id) {
    try {
      const response = await api.get(`vehicles/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching vehicle:', error);
      
      if (error.response?.status === 404) {
        throw new Error('Araç bulunamadı');
      }
      
      throw new Error('Araç bilgileri alınamadı');
    }
  },

  /**
   * Create new vehicle
   * @param {Object} vehicleData - Vehicle data
   */
  async createVehicle(vehicleData) {
    try {
      const response = await api.post('vehicles', vehicleData);
      return response.data;
    } catch (error) {
      console.error('Error creating vehicle:', error);
      
      if (error.response?.status === 409) {
        throw new Error('Bu plaka numarası zaten kayıtlı');
      } else if (error.response?.status === 400) {
        throw new Error('Girilen bilgiler geçersiz');
      }
      
      throw new Error('Araç oluşturulamadı');
    }
  },

  /**
   * Update vehicle
   * @param {string|number} id - Vehicle ID
   * @param {Object} vehicleData - Updated vehicle data
   */
  async updateVehicle(id, vehicleData) {
    try {
      const response = await api.put(`vehicles/${id}`, vehicleData);
      return response.data;
    } catch (error) {
      console.error('Error updating vehicle:', error);
      
      if (error.response?.status === 404) {
        throw new Error('Araç bulunamadı');
      } else if (error.response?.status === 409) {
        throw new Error('Bu plaka numarası başka bir araçta kayıtlı');
      } else if (error.response?.status === 400) {
        throw new Error('Girilen bilgiler geçersiz');
      }
      
      throw new Error('Araç güncellenemedi');
    }
  },

  /**
   * Delete vehicle
   */
  async deleteVehicle(id) {
    try {
      await api.delete(`vehicles/${id}`);
    } catch (error) {
      console.error('Error deleting vehicle:', error);
      
      if (error.response?.status === 404) {
        throw new Error('Araç bulunamadı');
      }
      
      throw new Error('Araç silinemedi');
    }
  },

  /**
   * Delete multiple vehicles
   */
  async deleteMultipleVehicles(vehicleIds) {
    try {
      const promises = vehicleIds.map(id => this.deleteVehicle(id));
      await Promise.all(promises);
    } catch (error) {
      console.error('Error bulk deleting vehicles:', error);
      throw new Error('Araçlar silinemedi');
    }
  },

  /**
   * Get vehicle statistics
   */
  async getVehicleStats() {
    try {
      const response = await api.get('vehicles/stats');
      return response.data;
    } catch (error) {
      console.error('Error fetching vehicle stats:', error);
      throw new Error('Araç istatistikleri alınamadı');
    }
  },

  /**
   * Export vehicles to Excel
   */
  async exportVehicles(params = {}) {
    try {
      const queryParams = new URLSearchParams();
      
      // Add filter params
      Object.keys(params).forEach(key => {
        if (params[key]) {
          queryParams.append(key, params[key]);
        }
      });
      
      const url = queryParams.toString() ? 
        `vehicles/export?${queryParams}` : 'vehicles/export';
      
      const response = await api.get(url, {
        responseType: 'blob',
      });
      
      // Create download link
      const blob = new Blob([response.data], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `araclar_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
      
    } catch (error) {
      console.error('Error exporting vehicles:', error);
      throw new Error('Araç listesi dışa aktarılamadı');
    }
  },

  /**
   * Upload vehicle image
   */
  async uploadVehicleImage(vehicleId, imageFile) {
    try {
      const formData = new FormData();
      formData.append('vehicleImage', imageFile);

      const response = await api.post(`vehicles/${vehicleId}/image`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      return response.data;
    } catch (error) {
      console.error('Error uploading vehicle image:', error);
      throw new Error('Araç resmi yüklenemedi');
    }
  },

  /**
   * Delete vehicle image
   */
  async deleteVehicleImage(vehicleId) {
    try {
      await api.delete(`vehicles/${vehicleId}/image`);
    } catch (error) {
      console.error('Error deleting vehicle image:', error);
      throw new Error('Araç resmi silinemedi');
    }
  }
};

// Named export
export const vehicleService = vehicleServiceMethods;

// Default export
export default vehicleServiceMethods;