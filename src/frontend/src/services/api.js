// ===== 1. src/frontend/src/services/api.js (Auth methods eklendi) =====

// API Base Configuration
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5154/api';

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
    this.customHeaders = {};
  }

  // Get auth token from localStorage
  getAuthToken() {
    return localStorage.getItem('authToken');
  }

  // Build headers with auth token
  getHeaders() {
    const token = this.getAuthToken();
    return {
      'Content-Type': 'application/json',
      ...this.customHeaders,
      ...(token && { 'Authorization': `Bearer ${token}` })
    };
  }

  // Generic request method
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: this.getHeaders(),
      ...options
    };

    try {
      console.log(`API Request: ${config.method || 'GET'} ${url}`);
      
      const response = await fetch(url, config);
      
      // Handle HTTP errors
      if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`;
        
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch (jsonError) {
          console.warn('Could not parse error response as JSON');
        }
        
        throw new Error(errorMessage);
      }

      // Return response data
      const data = await response.json();
      console.log(`API Response: ${config.method || 'GET'} ${url} - Success`);
      return data;
      
    } catch (error) {
      console.error(`API Request failed: ${config.method || 'GET'} ${url}`, error);
      
      // Handle different types of errors
      if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
        throw new Error('API sunucusuna bağlanılamıyor. Backend sunucusunun çalıştığından emin olun.');
      } else if (error.message.includes('ERR_CONNECTION_REFUSED')) {
        throw new Error('Bağlantı reddedildi. API sunucusu çalışmıyor olabilir.');
      }
      
      throw error;
    }
  }

  // HTTP Methods
  async get(endpoint) {
    return this.request(endpoint, { method: 'GET' });
  }

  async post(endpoint, data) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async put(endpoint, data) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  async delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  }

  // ===== AUTHENTICATION ENDPOINTS =====

  async login(credentials) {
    try {
      console.log('API: Login attempt', { email: credentials.email });
      
      // For development, use mock authentication
      // if (process.env.NODE_ENV === 'development') {
      //   // Mock authentication for development
      //   const mockResponse = {
      //     success: true,
      //     token: 'mock-jwt-token-' + Date.now(),
      //     user: {
      //       id: 1,
      //       email: credentials.email,
      //       username: credentials.email.split('@')[0],
      //       firstName: 'Admin',
      //       lastName: 'User',
      //       role: 'admin'
      //     }
      //   };
        
      //   // Simulate network delay
      //   await new Promise(resolve => setTimeout(resolve, 500));
        
      //   console.log('API: Mock login successful', mockResponse);
      //   return mockResponse;
      // }

      // Production authentication
      const response = await this.post('/Auth/login', {
        email: credentials.email,
        password: credentials.password
      });

      return {
        success: true,
        token: response.token,
        user: response.user
      };

    } catch (error) {
      console.error('API: Login failed', error);
      throw new Error(error.message || 'Giriş işlemi başarısız');
    }
  }

  async register(userData) {
    try {
      const response = await this.post('/Auth/register', userData);
      return {
        success: true,
        token: response.token,
        user: response.user
      };
    } catch (error) {
      console.error('API: Registration failed', error);
      throw new Error(error.message || 'Kayıt işlemi başarısız');
    }
  }

  async logout() {
    try {
      // If there's a logout endpoint on your backend
      // await this.post('/Auth/logout');
      
      // Clear local storage
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      
      console.log('API: Logout successful');
      return { success: true };
    } catch (error) {
      console.error('API: Logout error', error);
      // Still clear local storage even if API call fails
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      return { success: true };
    }
  }

  async refreshToken() {
    try {
      const response = await this.post('/Auth/refresh');
      return {
        success: true,
        token: response.token,
        user: response.user
      };
    } catch (error) {
      console.error('API: Token refresh failed', error);
      return {
        success: false,
        error: error.message || 'Token yenileme başarısız'
      };
    }
  }

  async forgotPassword(email) {
    try {
      await this.post('/Auth/forgot-password', { email });
      return { success: true };
    } catch (error) {
      throw new Error(error.message || 'Şifre sıfırlama isteği gönderilemedi');
    }
  }

  async resetPassword(token, newPassword) {
    try {
      await this.post('/Auth/reset-password', {
        token,
        password: newPassword
      });
      return { success: true };
    } catch (error) {
      throw new Error(error.message || 'Şifre sıfırlama başarısız');
    }
  }

  async verifyToken() {
    try {
      const response = await this.post('/Auth/verify');
      return {
        success: true,
        user: response.user
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Token doğrulama başarısız'
      };
    }
  }

  // ===== VISITORS ENDPOINTS =====

  async getVisitors(params = {}) {
    const queryParams = new URLSearchParams();
    
    // Add filter parameters
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
      
      // Backend response format mapping
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
    return this.put(`/Visitors/${id}`, visitorData);
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
    
    // Add filter parameters
    Object.keys(filters).forEach(key => {
      if (filters[key] !== null && filters[key] !== undefined && filters[key] !== '') {
        queryParams.append(key, filters[key]);
      }
    });

    const endpoint = queryParams.toString() ?
      `/Visitors/export?${queryParams.toString()}` : '/Visitors/export';
    return this.get(endpoint);
  }

  // ===== OTHER ENDPOINTS =====

  // TimeEntries related endpoints
  async getTimeEntries(requestData) {
    return this.post('/TimeEntries/list', requestData);
  }

  async getRecentActivities(requestData) {
    return this.post('/TimeEntries/recent', requestData);
  }

  async getProjectTimeEntries(requestData) {
    return this.post('/TimeEntries/project', requestData);
  }

  // User related endpoints
  async getCurrentUser() {
    return this.get('/user/profile');
  }

  async updateUserProfile(userData) {
    return this.put('/user/profile', userData);
  }

  // ===== UTILITY METHODS =====

  // Check API health
  async checkApiHealth() {
    try {
      const response = await fetch(`${this.baseURL}/health`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      return response.ok;
    } catch (error) {
      console.error('API Health check failed:', error);
      return false;
    }
  }

  // Get API base URL
  getApiBaseUrl() {
    return this.baseURL;
  }

  // Set custom headers
  setCustomHeaders(headers) {
    this.customHeaders = { ...this.customHeaders, ...headers };
  }

  // Clear custom headers
  clearCustomHeaders() {
    this.customHeaders = {};
  }

  // Handle file upload
  async uploadFile(endpoint, formData) {
    const token = this.getAuthToken();
    const headers = {};
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method: 'POST',
        headers,
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('File upload failed:', error);
      throw error;
    }
  }

  // Download file
  async downloadFile(endpoint, filename = 'download') {
    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method: 'GET',
        headers: this.getHeaders()
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      return true;
    } catch (error) {
      console.error('File download failed:', error);
      throw error;
    }
  }
}

// Create and export a singleton instance
const apiService = new ApiService();
export default apiService;  