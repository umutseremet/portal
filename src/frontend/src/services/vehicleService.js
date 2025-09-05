// src/frontend/src/services/vehicleService.js
import api from './api';

export const vehicleService = {
  /**
   * Get vehicles with pagination and filtering
   */
  async getVehicles(params = {}) {
    try {
      const queryParams = new URLSearchParams();
      
      // Pagination
      if (params.page) queryParams.append('page', params.page);
      if (params.pageSize) queryParams.append('pageSize', params.pageSize);
      
      // Sorting
      if (params.sortBy) queryParams.append('sortBy', params.sortBy);
      if (params.sortDirection) queryParams.append('sortDirection', params.sortDirection);
      
      // Filters
      if (params.search) queryParams.append('search', params.search);
      if (params.licensePlate) queryParams.append('licensePlate', params.licensePlate);
      if (params.brand) queryParams.append('brand', params.brand);
      if (params.companyName) queryParams.append('companyName', params.companyName);
      if (params.ownershipType) queryParams.append('ownershipType', params.ownershipType);
      if (params.yearFrom) queryParams.append('yearFrom', params.yearFrom);
      if (params.yearTo) queryParams.append('yearTo', params.yearTo);
      if (params.assignedUserName) queryParams.append('assignedUserName', params.assignedUserName);
      if (params.location) queryParams.append('location', params.location);
      
      // Service status filters
      if (params.inspectionDue) queryParams.append('inspectionDue', 'true');
      if (params.insuranceDue) queryParams.append('insuranceDue', 'true');
      if (params.serviceDue) queryParams.append('serviceDue', 'true');
      if (params.highMileage) queryParams.append('highMileage', 'true');
      
      const url = queryParams.toString() ? `vehicles?${queryParams}` : 'vehicles';
      const response = await api.get(url);
      
      return {
        data: response.data.data || response.data,
        totalCount: response.data.totalCount || response.data.length,
        totalPages: response.data.totalPages || 1,
        currentPage: response.data.currentPage || 1,
        pageSize: response.data.pageSize || 10
      };
    } catch (error) {
      console.error('Error fetching vehicles:', error);
      throw new Error('Araç verileri alınamadı');
    }
  },

  /**
   * Get vehicle by ID
   */
  async getVehicle(id) {
    try {
      const response = await api.get(`vehicles/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching vehicle:', error);
      throw new Error('Araç detayları alınamadı');
    }
  },

  /**
   * Get vehicle logs
   */
  async getVehicleLogs(id) {
    try {
      const response = await api.get(`vehicles/${id}/logs`);
      return response.data;
    } catch (error) {
      console.error('Error fetching vehicle logs:', error);
      throw new Error('Araç kayıtları alınamadı');
    }
  },

  /**
   * Create new vehicle
   */
  async createVehicle(vehicleData) {
    try {
      // Prepare form data for image upload
      const formData = new FormData();
      
      // Add vehicle data
      Object.keys(vehicleData).forEach(key => {
        if (key === 'vehicleImage' && vehicleData[key]) {
          formData.append('vehicleImage', vehicleData[key]);
        } else if (vehicleData[key] !== null && vehicleData[key] !== undefined) {
          formData.append(key, vehicleData[key]);
        }
      });

      const response = await api.post('vehicles', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
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
   */
  async updateVehicle(id, vehicleData) {
    try {
      // Prepare form data for image upload
      const formData = new FormData();
      
      // Add vehicle data
      Object.keys(vehicleData).forEach(key => {
        if (key === 'vehicleImage' && vehicleData[key]) {
          formData.append('vehicleImage', vehicleData[key]);
        } else if (vehicleData[key] !== null && vehicleData[key] !== undefined) {
          formData.append(key, vehicleData[key]);
        }
      });

      const response = await api.put(`vehicles/${id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
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
      
      const url = queryParams.toString() ? `vehicles/export?${queryParams}` : 'vehicles/export';
      
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