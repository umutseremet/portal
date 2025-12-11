// src/frontend/src/services/vehicleService.js

import apiService from './api';

class VehicleService {

  // Get vehicles with filtering and pagination
  async getVehicles(params = {}) {
    try {
      // Use the apiService.getVehicles method directly
      return await apiService.getVehicles(params);
    } catch (error) {
      console.error('Error fetching vehicles:', error);
      throw new Error(error.message || 'Araç listesi alınırken hata oluştu');
    }
  }

  // Get single vehicle by ID
  async getVehicle(id) {
    try {
      if (!id) {
        throw new Error('Araç ID\'si gerekli');
      }

      return await apiService.getVehicle(id);
    } catch (error) {
      console.error('Error fetching vehicle:', error);
      throw new Error(error.message || 'Araç alınırken hata oluştu');
    }
  }


  // src/frontend/src/services/vehicleService.js
  // ✅ DÜZELTİLMİŞ createVehicle metodu

  async createVehicle(vehicleData) {
    try {
      console.log('🚀 vehicleService.createVehicle called with:', vehicleData);

      // Validate required fields
      if (!vehicleData.licensePlate?.trim()) {
        throw new Error('Plaka zorunludur');
      }
      if (!vehicleData.brand?.trim()) {
        throw new Error('Marka zorunludur');
      }
      if (!vehicleData.model?.trim()) {
        throw new Error('Model zorunludur');
      }

      // Format data - Boş string'leri null'a çevir
      const formattedData = {
        licensePlate: vehicleData.licensePlate.toUpperCase().trim(),
        brand: vehicleData.brand.trim(),
        model: vehicleData.model.trim(),
        year: vehicleData.year || null,
        vin: vehicleData.vin?.trim() || null,
        companyName: vehicleData.companyName?.trim() || null,
        location: vehicleData.location?.trim() || null,
        assignedUserName: vehicleData.assignedUserName?.trim() || null,
        assignedUserPhone: vehicleData.assignedUserPhone?.trim() || null,
        currentMileage: vehicleData.currentMileage || null,
        fuelConsumption: vehicleData.fuelConsumption || null,
        tireCondition: vehicleData.tireCondition?.trim() || null,
        lastServiceDate: vehicleData.lastServiceDate || null,
        insurance: vehicleData.insurance?.trim() || null,
        insuranceExpiryDate: vehicleData.insuranceExpiryDate || null,
        inspectionDate: vehicleData.inspectionDate || null,
        ownershipType: vehicleData.ownershipType?.trim() || 'company',
        vehicleImageUrl: vehicleData.vehicleImageUrl?.trim() || null,
        registrationInfo: vehicleData.registrationInfo?.trim() || null
      };

      console.log('📦 Formatted data:', formattedData);

      // API call
      const response = await apiService.createVehicle(formattedData);

      console.log('✅ API response:', response);

      return response;
    } catch (error) {
      console.error('❌ vehicleService.createVehicle error:', error);
      console.error('❌ Error details:', {
        message: error.message,
        response: error.response,
        data: error.response?.data
      });

      throw new Error(error.message || 'Araç oluşturulurken hata oluştu');
    }
  }

  // Update existing vehicle
  async updateVehicle(id, vehicleData) {
    try {
      if (!id) {
        throw new Error('Araç ID\'si gerekli');
      }

      // Format data to ensure consistency
      const formattedData = {
        ...vehicleData
      };

      if (formattedData.licensePlate) {
        formattedData.licensePlate = formattedData.licensePlate.toUpperCase().trim();
      }

      return await apiService.updateVehicle(id, formattedData);
    } catch (error) {
      console.error('Error updating vehicle:', error);
      throw new Error(error.message || 'Araç güncellenirken hata oluştu');
    }
  }

  // Delete vehicle
  async deleteVehicle(id) {
    try {
      if (!id) {
        throw new Error('Araç ID\'si gerekli');
      }

      return await apiService.deleteVehicle(id);
    } catch (error) {
      console.error('Error deleting vehicle:', error);
      throw new Error(error.message || 'Araç silinirken hata oluştu');
    }
  }

  // Delete multiple vehicles
  async deleteMultipleVehicles(vehicleIds) {
    try {
      if (!vehicleIds || vehicleIds.length === 0) {
        throw new Error('Silinecek araç ID\'leri gerekli');
      }

      // Delete all vehicles in parallel
      const deletePromises = vehicleIds.map(id => this.deleteVehicle(id));
      await Promise.all(deletePromises);

      return { success: true, deletedCount: vehicleIds.length };
    } catch (error) {
      console.error('Error bulk deleting vehicles:', error);
      throw new Error(error.message || 'Araçlar silinirken hata oluştu');
    }
  }

  // Get vehicle statistics
  async getVehicleStats() {
    try {
      return await apiService.getVehicleStats();
    } catch (error) {
      console.error('Error fetching vehicle stats:', error);
      throw new Error(error.message || 'Araç istatistikleri alınırken hata oluştu');
    }
  }

  // Export vehicles to Excel
  async exportVehicles(params = {}) {
    try {
      return await apiService.exportVehicles(params);
    } catch (error) {
      console.error('Error exporting vehicles:', error);
      throw new Error(error.message || 'Araç listesi dışa aktarılırken hata oluştu');
    }
  }

  // Upload vehicle image
  async uploadVehicleImage(vehicleId, imageFile) {
    try {
      if (!vehicleId) {
        throw new Error('Araç ID\'si gerekli');
      }
      if (!imageFile) {
        throw new Error('Resim dosyası gerekli');
      }

      const formData = new FormData();
      formData.append('vehicleImage', imageFile);

      // Use fetch directly for file upload
      const response = await fetch(`${apiService.baseURL}/Vehicles/${vehicleId}/image`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiService.getAuthToken()}`
          // Don't set Content-Type for FormData, browser will set it automatically
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error uploading vehicle image:', error);
      throw new Error(error.message || 'Araç resmi yüklenirken hata oluştu');
    }
  }

  // Delete vehicle image
  async deleteVehicleImage(vehicleId) {
    try {
      if (!vehicleId) {
        throw new Error('Araç ID\'si gerekli');
      }

      return await apiService.delete(`/Vehicles/${vehicleId}/image`);
    } catch (error) {
      console.error('Error deleting vehicle image:', error);
      throw new Error(error.message || 'Araç resmi silinirken hata oluştu');
    }
  }

  // Format date to ensure consistency
  formatDate(date) {
    if (!date) return null;

    const dateObj = date instanceof Date ? date : new Date(date);
    return dateObj.toISOString().split('T')[0]; // YYYY-MM-DD format
  }

  // Validate vehicle data
  validateVehicleData(vehicleData) {
    const errors = [];

    if (!vehicleData.brand || vehicleData.brand.trim() === '') {
      errors.push('Marka gerekli');
    }

    if (!vehicleData.model || vehicleData.model.trim() === '') {
      errors.push('Model gerekli');
    }

    if (!vehicleData.licensePlate || vehicleData.licensePlate.trim() === '') {
      errors.push('Plaka gerekli');
    }

    // Basic license plate format validation (Turkish format)
    if (vehicleData.licensePlate) {
      const plateRegex = /^[0-9]{2}\s?[A-Z]{1,3}\s?[0-9]{1,4}$/i;
      if (!plateRegex.test(vehicleData.licensePlate.trim())) {
        errors.push('Geçerli bir plaka formatı giriniz (örn: 34 ABC 123)');
      }
    }

    if (vehicleData.year && (vehicleData.year < 1900 || vehicleData.year > new Date().getFullYear() + 1)) {
      errors.push('Geçerli bir model yılı giriniz');
    }

    if (vehicleData.mileage && vehicleData.mileage < 0) {
      errors.push('Kilometre negatif olamaz');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

// Create a single instance
const vehicleService = new VehicleService();

// Export both named and default
export { vehicleService };
export default vehicleService;