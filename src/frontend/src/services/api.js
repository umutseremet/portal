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
  /**
 * Get weekly production calendar data
 * @param {Object} params - Request parameters
 * @param {number|null} params.parentIssueId - Parent issue ID for recursive search
 * @param {string|null} params.startDate - Week start date (yyyy-MM-dd format)
 * @param {number|null} params.projectId - Project ID for filtering
 * @returns {Promise<Object>} Weekly calendar response
 */
  async getWeeklyProductionCalendar(params = {}) {
    try {
      console.log('📅 API getWeeklyProductionCalendar request:', params);

      const requestBody = {
        parentIssueId: params.parentIssueId || null,
        startDate: params.startDate || null,
        projectId: params.projectId || null,
        productionType: params.productionType && params.productionType !== 'all' ? params.productionType : null  // YENİ
      };

      const response = await this.post('/RedmineWeeklyCalendar/GetWeeklyProductionCalendar', requestBody);

      console.log('📅 API getWeeklyProductionCalendar raw response:', response);

      // Response formatını düzenle (camelCase'e çevir) - GRUPLANMIŞ VERİ
      const mappedResponse = {
        weekStart: response.weekStart || response.WeekStart,
        weekEnd: response.weekEnd || response.WeekEnd,
        days: (response.days || response.Days || []).map(day => {
          let dateValue = day.date || day.Date;

          return {
            date: dateValue,
            dayOfWeek: day.dayOfWeek ?? day.DayOfWeek,
            dayName: day.dayName || day.DayName,
            groupedProductions: (day.groupedProductions || day.GroupedProductions || []).map(group => ({
              projectId: group.projectId ?? group.ProjectId,
              projectCode: group.projectCode || group.ProjectCode || '',
              projectName: group.projectName || group.ProjectName || '',
              productionType: group.productionType || group.ProductionType || '',
              issueCount: group.issueCount ?? group.IssueCount ?? 0
            }))
          };
        })
      };

      console.log('📅 Mapped response:', mappedResponse);
      return mappedResponse;
    } catch (error) {
      console.error('❌ getWeeklyProductionCalendar error:', error);
      throw error;
    }
  }

  // src/services/api.js içine eklenecek yeni method

  /**
   * Get issues by date and production type
   * @param {Object} params - Request parameters
   * @param {string} params.date - Target date (yyyy-MM-dd)
   * @param {number} params.projectId - Project ID
   * @param {string} params.productionType - Production type
   * @returns {Promise<Object>} Issues list response
   */
  async getIssuesByDateAndType(params = {}) {
    try {
      console.log('📋 API getIssuesByDateAndType request:', params);

      // ✅ Credentials GEREKMİYOR - SQL Server'dan veri çekiliyor
      const requestBody = {
        date: params.date,
        projectId: params.projectId,
        productionType: params.productionType
      };

      const response = await this.post('/RedmineWeeklyCalendar/GetIssuesByDateAndType', requestBody);

      console.log('📋 API getIssuesByDateAndType raw response:', response);

      // Response formatını düzenle (camelCase'e çevir)
      const mappedResponse = {
        date: response.date || response.Date,
        projectId: response.projectId || response.ProjectId,
        productionType: response.productionType || response.ProductionType,
        totalCount: response.totalCount || response.TotalCount || 0,
        issues: (response.issues || response.Issues || []).map(issue => ({
          issueId: issue.issueId || issue.IssueId,
          projectId: issue.projectId || issue.ProjectId,
          projectName: issue.projectName || issue.ProjectName || '',
          projectCode: issue.projectCode || issue.ProjectCode || '',
          subject: issue.subject || issue.Subject || '',
          trackerName: issue.trackerName || issue.TrackerName || '',
          completionPercentage: issue.completionPercentage ?? issue.CompletionPercentage ?? 0,
          estimatedHours: issue.estimatedHours ?? issue.EstimatedHours ?? null,
          statusName: issue.statusName || issue.StatusName || '',
          isClosed: issue.isClosed ?? issue.IsClosed ?? false,
          priorityName: issue.priorityName || issue.PriorityName || '',
          assignedTo: issue.assignedTo || issue.AssignedTo || '',
          plannedStartDate: issue.plannedStartDate || issue.PlannedStartDate,
          plannedEndDate: issue.plannedEndDate || issue.PlannedEndDate,
          productionType: issue.productionType || issue.ProductionType || '',
          closedOn: issue.closedOn || issue.ClosedOn,  // ✅ EKLENEN
        }))
      };

      console.log('📋 Mapped issues response:', mappedResponse);
      return mappedResponse;
    } catch (error) {
      console.error('❌ getIssuesByDateAndType error:', error);
      throw error;
    }
  }

  // src/services/api.js içine eklenecek yeni method
  // ApiService class'ının içine ekleyin

  /**
   * Get ALL issues by date (without type filter)
   * @param {string} date - Target date (yyyy-MM-dd)
   * @returns {Promise<Object>} Issues list response
   */
  async getIssuesByDate(date) {
    try {
      console.log('📋 API getIssuesByDate request:', date);

      const response = await this.get(`/RedmineWeeklyCalendar/GetIssuesByDate?date=${date}`);

      console.log('📋 API getIssuesByDate raw response:', response);

      // Response formatını düzenle (camelCase'e çevir)
      const mappedResponse = {
        date: response.date || response.Date,
        totalCount: response.totalCount || response.TotalCount || 0,
        issues: (response.issues || response.Issues || []).map(issue => ({
          issueId: issue.issueId || issue.IssueId,
          projectId: issue.projectId || issue.ProjectId,
          projectName: issue.projectName || issue.ProjectName || '',
          projectCode: issue.projectCode || issue.ProjectCode || '',
          subject: issue.subject || issue.Subject || '',
          trackerName: issue.trackerName || issue.TrackerName || '',
          completionPercentage: issue.completionPercentage ?? issue.CompletionPercentage ?? 0,
          estimatedHours: issue.estimatedHours ?? issue.EstimatedHours ?? null,
          statusName: issue.statusName || issue.StatusName || '',
          isClosed: issue.isClosed ?? issue.IsClosed ?? false,
          priorityName: issue.priorityName || issue.PriorityName || '',
          assignedTo: issue.assignedTo || issue.AssignedTo || '',
          plannedStartDate: issue.plannedStartDate || issue.PlannedStartDate,
          plannedEndDate: issue.plannedEndDate || issue.PlannedEndDate,
          closedOn: issue.closedOn || issue.ClosedOn,  // ✅ EKLENEN
          productionType: issue.productionType || issue.ProductionType ||
            (issue.trackerName || issue.TrackerName || '').replace('Üretim - ', '').trim()
        }))
      };

      console.log('📋 Mapped all issues response:', mappedResponse);
      return mappedResponse;
    } catch (error) {
      console.error('❌ getIssuesByDate error:', error);
      throw error;
    }
  }

  // ========================================
  // NOT: Bu fonksiyonu mevcut getIssuesByDateAndType fonksiyonundan sonra ekleyin
  // ========================================

  // ========================================
  // NOT: Bu fonksiyonu ApiService class'ının içine ekleyin
  // ve class'ın sonundaki export kısmına da ekleyin
  // ========================================

  // ===== EXPORT =====
  // Mevcut export satırınızın sonuna bu fonksiyonu ekleyin:
  // getWeeklyProductionCalendar: this.getWeeklyProductionCalendar.bind(this),


  // api.js dosyanıza eklenecek metodlar
  // Mevcut metodların SONUNA ekleyin

  // ===== FUEL PURCHASE ENDPOINTS =====

  /**
   * Validate Excel file before import
   * @param {File} file - Excel file to validate
   * @returns {Promise} Validation result
   */
  async validateFuelPurchaseExcel(file) {
    if (!file) {
      throw new Error('File is required');
    }

    const formData = new FormData();
    formData.append('file', file);

    const url = `${this.baseURL}/fuelpurchaseimport/validate`;

    console.log(`🔄 API Call: POST ${url}`);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.getAuthToken()}`
          // Content-Type automatically set by browser for FormData
        },
        body: formData
      });

      console.log(`📡 API Response: ${response.status} ${response.statusText}`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ API Error ${response.status}:`, errorText);

        if (response.status === 401) {
          localStorage.removeItem('authToken');
          localStorage.removeItem('user');
          throw new Error('Oturum süresi doldu. Lütfen tekrar giriş yapın.');
        }

        throw new Error(`API Error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('📄 Validation Data:', data);
      return data;
    } catch (error) {
      console.error('🚨 Validation failed:', error);
      throw error;
    }
  }

  /**
   * Import fuel purchases from Excel
   * @param {File} file - Excel file to import
   * @param {Function} onProgress - Progress callback (optional)
   * @returns {Promise} Import result
   */
  async importFuelPurchaseExcel(file, onProgress = null) {
    if (!file) {
      throw new Error('File is required');
    }

    const formData = new FormData();
    formData.append('file', file);

    const url = `${this.baseURL}/fuelpurchaseimport`;

    console.log(`🔄 API Call: POST ${url}`);

    try {
      // Use XMLHttpRequest for progress tracking
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        // Progress event
        if (onProgress) {
          xhr.upload.addEventListener('progress', (e) => {
            if (e.lengthComputable) {
              const percentComplete = Math.round((e.loaded * 100) / e.total);
              onProgress(percentComplete);
            }
          });
        }

        // Load event
        xhr.addEventListener('load', () => {
          console.log(`📡 API Response: ${xhr.status} ${xhr.statusText}`);

          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const data = JSON.parse(xhr.responseText);
              console.log('📄 Import Data:', data);
              resolve(data);
            } catch (e) {
              console.error('Error parsing response:', e);
              reject(new Error('Invalid response format'));
            }
          } else {
            console.error(`❌ API Error ${xhr.status}:`, xhr.responseText);

            if (xhr.status === 401) {
              localStorage.removeItem('authToken');
              localStorage.removeItem('user');
              reject(new Error('Oturum süresi doldu. Lütfen tekrar giriş yapın.'));
            } else {
              reject(new Error(`API Error: ${xhr.status} - ${xhr.responseText}`));
            }
          }
        });

        // Error event
        xhr.addEventListener('error', () => {
          console.error('🚨 Import failed: Network error');
          reject(new Error('Network error'));
        });

        // Abort event
        xhr.addEventListener('abort', () => {
          console.error('🚨 Import aborted');
          reject(new Error('Upload aborted'));
        });

        xhr.open('POST', url);
        xhr.setRequestHeader('Authorization', `Bearer ${this.getAuthToken()}`);
        xhr.send(formData);
      });
    } catch (error) {
      console.error('🚨 Import failed:', error);
      throw error;
    }
  }

  /**
   * Get fuel purchase template information
   * @returns {Promise} Template info
   */
  async getFuelPurchaseTemplate() {
    return this.get('/fuelpurchaseimport/template');
  }

  /**
   * Get all fuel purchases with filters
   * @param {Object} params - Query parameters
   * @returns {Promise} Fuel purchases list
   */
  async getFuelPurchases(params = {}) {
    const queryParams = new URLSearchParams();

    Object.keys(params).forEach(key => {
      if (params[key] !== null && params[key] !== undefined && params[key] !== '') {
        queryParams.append(key, params[key]);
      }
    });

    const endpoint = queryParams.toString()
      ? `/vehiclefuelpurchases?${queryParams.toString()}`
      : '/vehiclefuelpurchases';

    return this.get(endpoint);
  }

  /**
   * Get single fuel purchase by ID
   * @param {number} id - Fuel purchase ID
   * @returns {Promise} Fuel purchase details
   */
  async getFuelPurchase(id) {
    if (!id) {
      throw new Error('Fuel purchase ID is required');
    }
    return this.get(`/vehiclefuelpurchases/${id}`);
  }

  /**
   * Get fuel purchases for a specific vehicle
   * @param {number} vehicleId - Vehicle ID
   * @param {Object} params - Query parameters
   * @returns {Promise} Vehicle fuel purchases
   */
  async getVehicleFuelPurchases(vehicleId, params = {}) {
    if (!vehicleId) {
      throw new Error('Vehicle ID is required');
    }

    const queryParams = new URLSearchParams();

    Object.keys(params).forEach(key => {
      if (params[key] !== null && params[key] !== undefined && params[key] !== '') {
        queryParams.append(key, params[key]);
      }
    });

    const endpoint = queryParams.toString()
      ? `/vehiclefuelpurchases/vehicle/${vehicleId}?${queryParams.toString()}`
      : `/vehiclefuelpurchases/vehicle/${vehicleId}`;

    return this.get(endpoint);
  }

  /**
   * Get fuel purchase statistics
   * @param {Object} params - Query parameters (vehicleId, fromDate, toDate)
   * @returns {Promise} Statistics data
   */
  async getFuelPurchaseStats(params = {}) {
    const queryParams = new URLSearchParams();

    Object.keys(params).forEach(key => {
      if (params[key] !== null && params[key] !== undefined && params[key] !== '') {
        queryParams.append(key, params[key]);
      }
    });

    const endpoint = queryParams.toString()
      ? `/vehiclefuelpurchases/stats?${queryParams.toString()}`
      : '/vehiclefuelpurchases/stats';

    return this.get(endpoint);
  }

  /**
   * Create new fuel purchase
   * @param {Object} purchaseData - Fuel purchase data
   * @returns {Promise} Created fuel purchase
   */
  async createFuelPurchase(purchaseData) {
    if (!purchaseData) {
      throw new Error('Fuel purchase data is required');
    }
    return this.post('/vehiclefuelpurchases', purchaseData);
  }



  // src/frontend/src/services/api.js
  // ✅ Mevcut dosyanıza bu metodu EKLEYIN (ApiService class'ının içine)

  /**
   * Update issue dates (planned start and end dates)
   * @param {Object} data - Update request data
   * @param {number} data.issueId - Issue ID
   * @param {string} data.plannedStartDate - New planned start date (yyyy-MM-dd) or null
   * @param {string} data.plannedEndDate - New planned end date (yyyy-MM-dd) or null
   * @param {string} data.updatedBy - User making the update
   * @returns {Promise<Object>} Update response
   */
  async updateIssueDates(data) {
    try {
      console.log('📅 API updateIssueDates request:', data);

      // ✅ Tarihleri AYNEN gönder - herhangi bir dönüşüm yapma
      const requestBody = {
        issueId: data.issueId,
        plannedStartDate: data.plannedStartDate || null,
        plannedEndDate: data.plannedEndDate || null,
        updatedBy: data.updatedBy || 'System'
      };

      console.log('📤 Sending to backend:', requestBody);

      const response = await this.post('/RedmineWeeklyCalendar/UpdateIssueDates', requestBody);

      console.log('📅 API updateIssueDates response:', response);

      // Response formatını düzenle (camelCase'e çevir)
      const mappedResponse = {
        success: response.success ?? response.Success ?? false,
        message: response.message || response.Message || '',
        issueId: response.issueId || response.IssueId,
        oldPlannedStartDate: response.oldPlannedStartDate || response.OldPlannedStartDate,
        oldPlannedEndDate: response.oldPlannedEndDate || response.OldPlannedEndDate,
        newPlannedStartDate: response.newPlannedStartDate || response.NewPlannedStartDate,
        newPlannedEndDate: response.newPlannedEndDate || response.NewPlannedEndDate,
        updatedAt: response.updatedAt || response.UpdatedAt
      };

      console.log('✅ Mapped response:', mappedResponse);

      return mappedResponse;
    } catch (error) {
      console.error('❌ updateIssueDates error:', error);
      throw error;
    }
  }

  /**
   * Update fuel purchase
   * @param {number} id - Fuel purchase ID
   * @param {Object} purchaseData - Updated data
   * @returns {Promise} Updated fuel purchase
   */
  async updateFuelPurchase(id, purchaseData) {
    if (!id) {
      throw new Error('Fuel purchase ID is required');
    }
    if (!purchaseData) {
      throw new Error('Fuel purchase data is required');
    }
    return this.put(`/vehiclefuelpurchases/${id}`, purchaseData);
  }

  /**
   * Delete fuel purchase
   * @param {number} id - Fuel purchase ID
   * @returns {Promise} Delete result
   */
  async deleteFuelPurchase(id) {
    if (!id) {
      throw new Error('Fuel purchase ID is required');
    }
    return this.delete(`/vehiclefuelpurchases/${id}`);
  }
}

// Create a single instance
const apiService = new ApiService();

// Export the instance
export default apiService;