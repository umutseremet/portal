// API Base Configuration
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5154/api';

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
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
      ...(token && { 'Authorization': `Bearer ${token}` })
    };
  }

  // Generic request method
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: this.getHeaders(),
      timeout: 10000, // 10 second timeout
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
      } else if (error.message.includes('timeout')) {
        throw new Error('API isteği zaman aşımına uğradı.');
      }
      
      throw error;
    }
  }

  // GET request
  async get(endpoint) {
    return this.request(endpoint, {
      method: 'GET'
    });
  }

  // POST request
  async post(endpoint, data) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  // PUT request
  async put(endpoint, data) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  // DELETE request
  async delete(endpoint) {
    return this.request(endpoint, {
      method: 'DELETE'
    });
  }

  // Auth related endpoints - MEVCUT
  async login(credentials) {
    return this.post('/Auth/login', {
      username: credentials.email, // API expects username field
      password: credentials.password
    });
  }

  async register(userData) {
    return this.post('/Auth/register', userData);
  }

  async refreshToken() {
    return this.post('/Auth/refresh-token');
  }

  async logout() {
    return this.post('/Auth/logout');
  }

  // Dashboard related endpoints - MEVCUT
  async getDashboardStats() {
    return this.get('/dashboard/stats');
  }

  async getRecentEvents() {
    return this.get('/dashboard/events');
  }

  // Production related endpoints - MEVCUT
  async getProductionOrders(filters = {}) {
    const queryParams = new URLSearchParams(filters).toString();
    const endpoint = queryParams ? `/production/orders?${queryParams}` : '/production/orders';
    return this.get(endpoint);
  }

  async getProductionOrder(id) {
    return this.get(`/production/orders/${id}`);
  }

  async createProductionOrder(orderData) {
    return this.post('/production/orders', orderData);
  }

  async updateProductionOrder(id, orderData) {
    return this.put(`/production/orders/${id}`, orderData);
  }

  async deleteProductionOrder(id) {
    return this.delete(`/production/orders/${id}`);
  }

  // Visitor related endpoints - YENİ
  async getVisitors(filters = {}) {
    const queryParams = new URLSearchParams();
    
    // Add filter parameters
    Object.keys(filters).forEach(key => {
      if (filters[key] !== null && filters[key] !== undefined && filters[key] !== '') {
        queryParams.append(key, filters[key]);
      }
    });

    const endpoint = queryParams.toString() ? `/Visitors?${queryParams.toString()}` : '/Visitors';
    console.log('API getVisitors endpoint:', `${this.baseURL}${endpoint}`);
    
    try {
      const response = await this.get(endpoint);
      console.log('API getVisitors raw response:', response);
      
      // API response format mapping
      // Backend döndüğü format (camelCase with JsonNamingPolicy): 
      // { visitors: [...], totalCount: 6, page: 1, ... }
      // Frontend'in beklediği format:
      // { visitors: [...], totalCount: 6, page: 1, ... }
      
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

    const endpoint = queryParams.toString() ? `/Visitors/export?${queryParams.toString()}` : '/Visitors/export';
    return this.get(endpoint);
  }

  // TimeEntries related endpoints - MEVCUT
  async getTimeEntries(requestData) {
    return this.post('/TimeEntries/list', requestData);
  }

  async getRecentActivities(requestData) {
    return this.post('/TimeEntries/recent', requestData);
  }

  async getProjectTimeEntries(requestData) {
    return this.post('/TimeEntries/project', requestData);
  }

  // User related endpoints - MEVCUT
  async getCurrentUser() {
    return this.get('/user/profile');
  }

  async updateUserProfile(userData) {
    return this.put('/user/profile', userData);
  }

  // Utility methods - YENİ
  
  // Check API health
  async checkApiHealth() {
    try {
      // Simple endpoint to check if API is running
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

  // Set custom headers (for special requests)
  setCustomHeaders(headers) {
    this.customHeaders = { ...this.customHeaders, ...headers };
  }

  // Clear custom headers
  clearCustomHeaders() {
    this.customHeaders = {};
  }

  // Build URL with query parameters
  buildUrl(endpoint, params = {}) {
    const url = new URL(endpoint, this.baseURL);
    Object.keys(params).forEach(key => {
      if (params[key] !== null && params[key] !== undefined && params[key] !== '') {
        url.searchParams.append(key, params[key]);
      }
    });
    return url.toString();
  }

  // Handle file upload (for future use)
  async uploadFile(endpoint, formData) {
    const token = this.getAuthToken();
    const headers = {};
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    // Don't set Content-Type for FormData, let browser set it with boundary

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

  // Download file (for future use)
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