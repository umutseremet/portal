// src/frontend/src/services/api.js
// VEHICLES API'İ İÇİN DÜZELTİLMİŞ VERSİYON

import axios from 'axios';

class ApiService {
  constructor() {
    this.baseURL = process.env.REACT_APP_API_URL || 'http://localhost:5154/api';
    
    // Create axios instance
    this.api = axios.create({
      baseURL: this.baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    // Request interceptor
    this.api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('authToken') || localStorage.getItem('vervo_auth_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        console.log('🚀 API Request:', {
          method: config.method?.toUpperCase(),
          url: `${config.baseURL}${config.url}`,
          params: config.params,
          data: config.data
        });
        return config;
      },
      (error) => {
        console.error('❌ Request interceptor error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.api.interceptors.response.use(
      (response) => {
        console.log('✅ API Response:', {
          status: response.status,
          url: response.config.url,
          data: response.data
        });
        return response;
      },
      (error) => {
        console.error('❌ Response interceptor error:', {
          status: error.response?.status,
          url: error.config?.url,
          message: error.message,
          data: error.response?.data
        });

        if (error.response?.status === 401) {
          localStorage.removeItem('authToken');
          localStorage.removeItem('vervo_auth_token');
          localStorage.removeItem('user');
          localStorage.removeItem('vervo_user_data');
          window.location.href = '/login';
        }

        return Promise.reject(error);
      }
    );
  }

  // Generic methods
  async get(endpoint, params = {}) {
    try {
      const response = await this.api.get(endpoint, { params });
      return response.data;
    } catch (error) {
      this.handleError('GET', endpoint, error);
      throw error;
    }
  }

  async post(endpoint, data = {}) {
    try {
      const response = await this.api.post(endpoint, data);
      return response.data;
    } catch (error) {
      this.handleError('POST', endpoint, error);
      throw error;
    }
  }

  async put(endpoint, data = {}) {
    try {
      const response = await this.api.put(endpoint, data);
      return response.data;
    } catch (error) {
      this.handleError('PUT', endpoint, error);
      throw error;
    }
  }

  async delete(endpoint) {
    try {
      const response = await this.api.delete(endpoint);
      return response.data;
    } catch (error) {
      this.handleError('DELETE', endpoint, error);
      throw error;
    }
  }

  handleError(method, endpoint, error) {
    const errorInfo = {
      method,
      endpoint,
      status: error.response?.status,
      message: error.message,
      data: error.response?.data
    };
    console.error(`❌ ${method} ${endpoint} failed:`, errorInfo);
  }

  // ===== VEHICLES ENDPOINTS - DÜZELTİLMİŞ VERSİYON =====

  async getVehicles(params = {}) {
    const queryParams = new URLSearchParams();

    // Add filter parameters
    Object.keys(params).forEach(key => {
      if (params[key] !== null && params[key] !== undefined && params[key] !== '') {
        queryParams.append(key, params[key]);
      }
    });

    const endpoint = queryParams.toString()
      ? `/Vehicles?${queryParams.toString()}` : '/Vehicles';

    console.log('🚗 API getVehicles endpoint:', `${this.baseURL}${endpoint}`);

    try {
      const response = await this.get(endpoint);
      console.log('🚗 API getVehicles raw response:', response);

      // ÖNEMLİ: Backend response formatını kontrol et ve düzelt
      let mappedResponse;

      if (Array.isArray(response)) {
        // Backend direkt Array dönüyorsa (şu anki durum)
        console.log('📋 Backend returned direct array, mapping to expected format');
        mappedResponse = {
          data: response,
          totalCount: response.length,
          page: 1,
          pageSize: response.length,
          totalPages: 1,
          hasNextPage: false,
          hasPreviousPage: false
        };
      } else if (response && typeof response === 'object') {
        // Backend object dönüyorsa
        mappedResponse = {
          data: response.data || response.Data || response.vehicles || response.Vehicles || response.items || [],
          totalCount: response.totalCount || response.TotalCount || response.total || 0,
          page: response.page || response.Page || 1,
          pageSize: response.pageSize || response.PageSize || 10,
          totalPages: response.totalPages || response.TotalPages || 0,
          hasNextPage: response.hasNextPage || response.HasNextPage || false,
          hasPreviousPage: response.hasPreviousPage || response.HasPreviousPage || false
        };
      } else {
        // Beklenmeyen format
        console.warn('⚠️ Unexpected response format, returning empty result');
        mappedResponse = {
          data: [],
          totalCount: 0,
          page: 1,
          pageSize: 10,
          totalPages: 0,
          hasNextPage: false,
          hasPreviousPage: false
        };
      }

      console.log('✅ API getVehicles mapped response:', {
        ...mappedResponse,
        vehiclesCount: mappedResponse.data?.length,
        firstVehicle: mappedResponse.data?.[0],
        sampleVehicles: mappedResponse.data?.slice(0, 2)
      });

      return mappedResponse;
    } catch (error) {
      console.error('❌ API getVehicles error:', error);
      throw error;
    }
  }

  async getVehicle(id) {
    if (!id) {
      throw new Error('Vehicle ID is required');
    }
    return this.get(`/Vehicles/${id}`);
  }

  async createVehicle(vehicleData) {
    if (!vehicleData) {
      throw new Error('Vehicle data is required');
    }
    return this.post('/Vehicles', vehicleData);
  }

  async updateVehicle(id, vehicleData) {
    if (!id) {
      throw new Error('Vehicle ID is required');
    }
    if (!vehicleData) {
      throw new Error('Vehicle data is required');
    }

    console.log('🔄 API updateVehicle call:', { id, vehicleData });

    try {
      const response = await this.put(`/Vehicles/${id}`, vehicleData);
      console.log('✅ API updateVehicle raw response:', response);

      return response;
    } catch (error) {
      console.error('❌ API updateVehicle error:', error);
      throw error;
    }
  }

  async deleteVehicle(id) {
    if (!id) {
      throw new Error('Vehicle ID is required');
    }
    return this.delete(`/Vehicles/${id}`);
  }

  async getVehicleStats() {
    return this.get('/Vehicles/stats');
  }

  async exportVehicles(filters = {}) {
    const queryParams = new URLSearchParams();

    // Add filter parameters
    Object.keys(filters).forEach(key => {
      if (filters[key] !== null && filters[key] !== undefined && filters[key] !== '') {
        queryParams.append(key, filters[key]);
      }
    });

    const endpoint = queryParams.toString() ?
      `/Vehicles/export?${queryParams.toString()}` : '/Vehicles/export';

    return this.get(endpoint);
  }

  // ===== VISITORS ENDPOINTS - ORİJİNAL FORMAT GERİ YÜKLENDİ =====

  async getVisitors(params = {}) {
    const queryParams = new URLSearchParams();

    Object.keys(params).forEach(key => {
      if (params[key] !== null && params[key] !== undefined && params[key] !== '') {
        queryParams.append(key, params[key]);
      }
    });

    const endpoint = queryParams.toString()
      ? `/Visitors?${queryParams.toString()}` : '/Visitors';

    console.log('API getVisitors endpoint:', `${this.baseURL}${endpoint}`);

    try {
      const response = await this.get(endpoint);
      console.log('API getVisitors raw response:', response);

      // Backend response format mapping for visitors - ORİJİNAL FORMAT
      const mappedResponse = {
        visitors: response.visitors || response.Visitors || [],
        totalCount: response.totalCount || response.TotalCount || 0,
        page: response.page || response.Page || 1,
        pageSize: response.pageSize || response.PageSize || 10,
        totalPages: response.totalPages || response.TotalPages || 0,
        hasNextPage: response.hasNextPage || response.HasNextPage || false,
        hasPreviousPage: response.hasPreviousPage || response.HasPreviousPage || false
      };

      console.log('API getVisitors mapped response:', {
        ...mappedResponse,
        visitorsCount: mappedResponse.visitors?.length,
        firstVisitor: mappedResponse.visitors?.[0]
      });

      return mappedResponse;
    } catch (error) {
      console.error('API getVisitors error:', error);
      throw error;
    }
  }

  async getVisitor(id) {
    if (!id) {
      throw new Error('Visitor ID is required');
    }
    return this.get(`/Visitors/${id}`);
  }

  async createVisitor(visitorData) {
    if (!visitorData) {
      throw new Error('Visitor data is required');
    }
    return this.post('/Visitors', visitorData);
  }

  async updateVisitor(id, visitorData) {
    if (!id) {
      throw new Error('Visitor ID is required');
    }
    if (!visitorData) {
      throw new Error('Visitor data is required');
    }

    console.log('API updateVisitor call:', { id, visitorData });

    try {
      const response = await this.put(`/Visitors/${id}`, visitorData);
      console.log('API updateVisitor raw response:', response);

      return response;
    } catch (error) {
      console.error('API updateVisitor error:', error);
      throw error;
    }
  }

  async deleteVisitor(id) {
    if (!id) {
      throw new Error('Visitor ID is required');
    }
    return this.delete(`/Visitors/${id}`);
  }

  async getVisitorStats() {
    return this.get('/Visitors/stats');
  }

  async exportVisitors(filters = {}) {
    const queryParams = new URLSearchParams();

    Object.keys(filters).forEach(key => {
      if (filters[key] !== null && filters[key] !== undefined && filters[key] !== '') {
        queryParams.append(key, filters[key]);
      }
    });

    const endpoint = queryParams.toString() ?
      `/Visitors/export?${queryParams.toString()}` : '/Visitors/export';

    return this.get(endpoint);
  }

  // ===== AUTH ENDPOINTS =====

  async login(credentials) {
    try {
      const response = await this.post('/auth/login', credentials);
      
      if (response.token) {
        localStorage.setItem('authToken', response.token);
        localStorage.setItem('user', JSON.stringify(response.user));
      }
      
      return response;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  async logout() {
    try {
      await this.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
    }
  }

  async refreshToken() {
    try {
      const response = await this.post('/auth/refresh');
      
      if (response.token) {
        localStorage.setItem('authToken', response.token);
      }
      
      return response;
    } catch (error) {
      console.error('Token refresh error:', error);
      throw error;
    }
  }
}

// Create a single instance
const apiService = new ApiService();

// Export the instance
export default apiService;