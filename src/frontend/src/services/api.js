// ===== 1. src/frontend/src/services/api.js (Temizlenmiş) =====

class ApiService {
  constructor() {
    this.baseURL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5154/api';
    console.log('🌐 API Service initialized with baseURL:', this.baseURL);
  }

  // Helper method to get auth token
  getAuthToken() {
    return localStorage.getItem('authToken');
  }

  // Helper method to get auth headers
  getHeaders(includeAuth = true) {
    const headers = {
      'Content-Type': 'application/json',
    };

    if (includeAuth) {
      const token = this.getAuthToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    return headers;
  }

  // Check if token is expired
  isTokenExpired() {
    const token = this.getAuthToken();
    if (!token) return true;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      return payload.exp < currentTime;
    } catch (error) {
      console.error('Error checking token expiration:', error);
      return true;
    }
  }

  // Generic API call method
  async apiCall(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;

    console.log(`🔄 API Call: ${options.method || 'GET'} ${url}`);

    const defaultOptions = {
      method: 'GET',
      headers: this.getHeaders(options.includeAuth !== false),
      ...options
    };

    if (options.body && typeof options.body === 'object') {
      defaultOptions.body = JSON.stringify(options.body);
    }

    try {
      const response = await fetch(url, defaultOptions);

      console.log(`📡 API Response: ${response.status} ${response.statusText}`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ API Error ${response.status}:`, errorText);

        // Handle 401 specifically
        if (response.status === 401) {
          localStorage.removeItem('authToken');
          localStorage.removeItem('user');
          throw new Error('Oturum süresi doldu. Lütfen tekrar giriş yapın.');
        }

        throw new Error(`API Error: ${response.status} - ${errorText}`);
      }

      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const data = await response.json();
        console.log('📄 API Data:', data);
        return data;
      } else {
        const text = await response.text();
        console.log('📄 API Text:', text);
        return { success: true, data: text };
      }
    } catch (error) {
      console.error('🚨 API Call failed:', error);
      throw error;
    }
  }

  // HTTP Methods
  async get(endpoint, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const url = queryString ? `${endpoint}?${queryString}` : endpoint;
    return this.apiCall(url, { method: 'GET' });
  }

  async post(endpoint, body = {}) {
    return this.apiCall(endpoint, {
      method: 'POST',
      body: body
    });
  }

  async put(endpoint, body = {}) {
    return this.apiCall(endpoint, {
      method: 'PUT',
      body: body
    });
  }

  async delete(endpoint) {
    return this.apiCall(endpoint, { method: 'DELETE' });
  }

  // ===== VISITOR ENDPOINTS =====

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

      console.log('API getVisitors mapped response:', mappedResponse);
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

  // ===== AUTH ENDPOINTS - DÜZELTİLMİŞ =====

  async getVehicles(params = {}) {
    const queryParams = new URLSearchParams();

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

      console.log('✅ API getVehicles mapped response:', mappedResponse);
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

    Object.keys(filters).forEach(key => {
      if (filters[key] !== null && filters[key] !== undefined && filters[key] !== '') {
        queryParams.append(key, filters[key]);
      }
    });

    const endpoint = queryParams.toString() ?
      `/Vehicles/export?${queryParams.toString()}` : '/Vehicles/export';

    return this.get(endpoint);
  }

  async login(credentials) {
    try {
      console.log('🔐 API login call:', { username: credentials.email || credentials.username });

      // Backend'in beklediği format: {username, password}
      const loginData = {
        username: credentials.email || credentials.username,
        password: credentials.password
      };

      const response = await this.post('/Auth/login', loginData);
      console.log('🔐 API login response:', response);

      if (response.token) {
        localStorage.setItem('authToken', response.token);

        // User bilgisini de kaydet
        const user = response.user || {
          email: loginData.username,
          name: loginData.username,
          fullName: loginData.username
        };
        localStorage.setItem('user', JSON.stringify(user));

        return {
          success: true,
          token: response.token,
          user: user
        };
      } else {
        return {
          success: false,
          error: response.error || response.message || 'Giriş başarısız'
        };
      }
    } catch (error) {
      console.error('🚨 API login error:', error);
      return {
        success: false,
        error: error.message || 'Giriş sırasında bir hata oluştu'
      };
    }
  }

  async logout() {
    try {
      await this.post('/Auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
    }
  }

  async refreshToken() {
    try {
      const response = await this.post('/Auth/refresh');

      if (response.token) {
        localStorage.setItem('authToken', response.token);

        if (response.user) {
          localStorage.setItem('user', JSON.stringify(response.user));
        }

        return {
          success: true,
          token: response.token,
          user: response.user
        };
      } else {
        return {
          success: false,
          error: 'Token yenileme başarısız'
        };
      }
    } catch (error) {
      console.error('Token refresh error:', error);
      return {
        success: false,
        error: error.message || 'Token yenileme başarısız'
      };
    }
  }

  async register(userData) {
    try {
      const response = await this.post('/Auth/register', userData);

      if (response.token) {
        localStorage.setItem('authToken', response.token);
        localStorage.setItem('user', JSON.stringify(response.user));

        return {
          success: true,
          token: response.token,
          user: response.user
        };
      } else {
        return {
          success: false,
          error: response.error || 'Kayıt başarısız'
        };
      }
    } catch (error) {
      console.error('Register error:', error);
      return {
        success: false,
        error: error.message || 'Kayıt sırasında bir hata oluştu'
      };
    }
  }

  async forgotPassword(email) {
    try {
      const response = await this.post('/Auth/forgot-password', { email });
      return {
        success: true,
        message: response.message || 'Şifre sıfırlama e-postası gönderildi'
      };
    } catch (error) {
      console.error('Forgot password error:', error);
      return {
        success: false,
        error: error.message || 'Şifre sıfırlama başarısız'
      };
    }
  }
}

// Create a single instance
const apiService = new ApiService();

// Export the instance
export default apiService;