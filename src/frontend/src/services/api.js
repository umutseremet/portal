// API Base Configuration
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001/api';

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
      ...options
    };

    try {
      const response = await fetch(url, config);
      
      // Handle HTTP errors
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      // Return response data
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('API Request failed:', error);
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

  // Dashboard related endpoints
  async getDashboardStats() {
    return this.get('/dashboard/stats');
  }

  async getRecentEvents() {
    return this.get('/dashboard/events');
  }

  // Production related endpoints
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

  // User related endpoints
  async getCurrentUser() {
    return this.get('/user/profile');
  }

  async updateUserProfile(userData) {
    return this.put('/user/profile', userData);
  }
}

// Create and export a singleton instance
const apiService = new ApiService();
export default apiService;