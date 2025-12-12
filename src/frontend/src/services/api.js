// ===== 1. src/frontend/src/services/api.js (Temizlenmiş) =====

import { API_ENDPOINTS } from '../utils/constants';

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

  // src/frontend/src/services/api.js içine eklenecek metodlar

  // ===== TECHNICAL DRAWING PREPARATION ENDPOINTS =====

  /**
   * Get BOM works for technical drawing preparation
   * Backend: GET /api/TechnicalDrawingPreparation/works
   */
  async getTechnicalDrawingWorks() {
    console.log('📦 API getTechnicalDrawingWorks call');

    try {
      // ✅ Kullanıcı credentials'larını localStorage'dan al
      const userStr = localStorage.getItem('user');
      let redmineUsername = '';
      let redminePassword = '';

      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          redmineUsername = user.login || user.username || user.email || '';
          redminePassword = user.password || '';
        } catch (e) {
          console.warn('User bilgisi parse edilemedi:', e);
        }
      }

      // ✅ Query parameter olarak credentials gönder
      const queryParams = new URLSearchParams();
      if (redmineUsername) queryParams.append('redmineUsername', redmineUsername);
      if (redminePassword) queryParams.append('redminePassword', redminePassword);

      const url = `/TechnicalDrawingPreparation/works${queryParams.toString() ? '?' + queryParams.toString() : ''}`;

      const response = await this.get(url);
      console.log('✅ API getTechnicalDrawingWorks response:', response);
      return response;
    } catch (error) {
      console.error('❌ API getTechnicalDrawingWorks error:', error);
      throw error;
    }
  }

  /**
   * Get item groups for a BOM work
   * Backend: GET /api/TechnicalDrawingPreparation/work/{workId}/item-groups
   */
  async getTechnicalDrawingItemGroups(workId) {
    if (!workId) {
      throw new Error('Work ID is required');
    }

    console.log('📦 API getTechnicalDrawingItemGroups call:', { workId });

    try {
      const response = await this.get(`/TechnicalDrawingPreparation/work/${workId}/item-groups`);
      console.log('✅ API getTechnicalDrawingItemGroups response:', response);
      return response;
    } catch (error) {
      console.error('❌ API getTechnicalDrawingItemGroups error:', error);
      throw error;
    }
  }

  /**
   * Get items for technical drawing preparation
   * Backend: POST /api/TechnicalDrawingPreparation/items
   */
  async getTechnicalDrawingItems(params) {
    if (!params.workId || !params.itemGroupIds || params.itemGroupIds.length === 0) {
      throw new Error('Work ID and item group IDs are required');
    }

    console.log('📦 API getTechnicalDrawingItems call:', params);

    try {
      const requestBody = {
        workId: params.workId,
        itemGroupIds: params.itemGroupIds
      };

      const response = await this.post('/TechnicalDrawingPreparation/items', requestBody);
      console.log('✅ API getTechnicalDrawingItems response:', response);
      return response;
    } catch (error) {
      console.error('❌ API getTechnicalDrawingItems error:', error);
      throw error;
    }
  }

  /**
   * Download technical drawings as ZIP
   * Backend: POST /api/TechnicalDrawingPreparation/download-zip
   * Note: This is handled directly in the component using fetch for blob download
   */

  // Generic API call method
  async apiCall(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;

    console.log(`🔄 API Call: ${options.method || 'GET'} ${url}`);

    const defaultOptions = {
      method: 'GET',
      headers: this.getHeaders(options.includeAuth !== false),
      ...options
    };

    // ✅ BURAYA LOG EKLE
    console.log('📦 options.body TYPE:', typeof options.body);
    console.log('📦 options.body VALUE:', options.body);

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

          // window.location.href = '/login';  // ✅ BU SATIRI EKLE

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
    try {
      console.log('🚀 vehicleService.createVehicle - Input:', vehicleData);

      // Validation
      if (!vehicleData.licensePlate?.trim()) {
        throw new Error('Plaka zorunludur');
      }
      if (!vehicleData.brand?.trim()) {
        throw new Error('Marka zorunludur');
      }
      if (!vehicleData.model?.trim()) {
        throw new Error('Model zorunludur');
      }

      // Boş değerleri temizle
      const cleanedData = {};
      Object.keys(vehicleData).forEach(key => {
        const value = vehicleData[key];
        if (value !== null && value !== undefined && value !== '') {
          cleanedData[key] = value;
        }
      });

      // camelCase → PascalCase
      const pascalData = {};
      Object.keys(cleanedData).forEach(key => {
        const pascalKey = key.charAt(0).toUpperCase() + key.slice(1);
        pascalData[pascalKey] = cleanedData[key];
      });

      console.log('📤 Sending to backend:', pascalData);

      // ✅ DIREKT FETCH KULLAN - apiService'i bypass et
      const url = `${apiService.baseURL}/Vehicles`;
      const token = localStorage.getItem('authToken');

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(pascalData)
      });

      console.log('📡 Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      console.log('✅ Create vehicle result:', result);

      return result;
    } catch (error) {
      console.error('❌ vehicleService.createVehicle error:', error);
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


  // ===== BOM API METODLARI - GERÇEK BACKEND ENDPOINT'LERİNE GÖRE =====
  // Bu metodları api.js dosyanızın SONUNA (export satırından önce) ekleyin

  /**
   * Get all BOM works with pagination and search
   * Backend: POST /api/BomWorks/list
   */
  /**
 * Get all BOM works with pagination and search
 * Backend: POST /api/BomWorks/list
 */
  async getBOMWorks(params = {}) {
    console.log('📦 API getBOMWorks call:', params);

    try {
      // ✅ Kullanıcı credentials'larını localStorage'dan al
      const userStr = localStorage.getItem('user');
      let redmineUsername = '';
      let redminePassword = '';

      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          redmineUsername = user.login || user.username || user.email || '';
          redminePassword = user.password || '';
        } catch (e) {
          console.warn('User bilgisi parse edilemedi:', e);
        }
      }

      // ✅ Backend POST /api/BomWorks/list bekliyor + credentials
      const requestBody = {
        page: params.page || 1,
        pageSize: params.pageSize || 10,
        searchTerm: params.searchTerm || null,
        redmineUsername,
        redminePassword
      };

      console.log('📦 API getBOMWorks with credentials:', {
        ...requestBody,
        redminePassword: redminePassword ? '***' : 'empty'
      });

      const response = await this.post('/BomWorks/list', requestBody);
      console.log('📦 API getBOMWorks raw response:', response);

      // Backend response format mapping
      const mappedResponse = {
        works: response.works || response.Works || response.data || response.Data || [],
        totalCount: response.totalCount || response.TotalCount || 0,
        page: response.page || response.Page || 1,
        pageSize: response.pageSize || response.PageSize || 10,
        totalPages: response.totalPages || response.TotalPages || 0,
        hasNextPage: response.hasNextPage || response.HasNextPage || false,
        hasPreviousPage: response.hasPreviousPage || response.HasPreviousPage || false
      };

      console.log('✅ API getBOMWorks mapped response:', mappedResponse);
      return mappedResponse;
    } catch (error) {
      console.error('❌ API getBOMWorks error:', error);
      throw error;
    }
  }
  /**
   * Get a single BOM work by ID
   * Backend: GET /api/BomWorks/{id}
   */
  /**
 * Get a single BOM work by ID
 * Backend: GET /api/BomWorks/{id}
 */
  async getBOMWork(id) {
    if (!id) {
      throw new Error('BOM work ID is required');
    }

    console.log('📦 API getBOMWork call:', { id });

    try {
      // ✅ Kullanıcı credentials'larını localStorage'dan al
      const userStr = localStorage.getItem('user');
      let redmineUsername = '';
      let redminePassword = '';

      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          redmineUsername = user.login || user.username || user.email || '';
          redminePassword = user.password || '';
        } catch (e) {
          console.warn('User bilgisi parse edilemedi:', e);
        }
      }

      // ✅ Query parameter olarak credentials gönder
      const queryParams = new URLSearchParams();
      if (redmineUsername) queryParams.append('redmineUsername', redmineUsername);
      if (redminePassword) queryParams.append('redminePassword', redminePassword);

      const url = `/BomWorks/${id}${queryParams.toString() ? '?' + queryParams.toString() : ''}`;

      console.log('📦 API getBOMWork URL:', url.replace(redminePassword, '***'));

      const response = await this.get(url);
      console.log('✅ API getBOMWork response:', response);
      return response;
    } catch (error) {
      console.error('❌ API getBOMWork error:', error);
      throw error;
    }
  }

  /**
 * Get files for an item
 * Backend: POST /api/ItemFiles/list
 */
  async getItemFiles(itemId) {
    if (!itemId) {
      throw new Error('Item ID is required');
    }

    console.log('📦 API getItemFiles call:', { itemId });

    try {
      const requestBody = {
        itemId: itemId
      };

      const response = await this.post('/ItemFiles/list', requestBody);
      console.log('📦 API getItemFiles raw response:', response);

      const files = response.files || response.Files || response.data || response.Data || [];

      console.log('✅ API getItemFiles mapped:', files);
      return files;
    } catch (error) {
      console.error('❌ API getItemFiles error:', error);
      throw error;
    }
  }

  /**
   * Upload file to an item
   * Backend: POST /api/ItemFiles/upload
   * Form Data: itemId + file
   */
  async uploadItemFile(itemId, file) {
    if (!itemId) {
      throw new Error('Item ID is required');
    }

    if (!file) {
      throw new Error('File is required');
    }

    // Allowed extensions
    const allowedExtensions = ['.esp', '.nc', '.pdf', '.x_t', '.xlsx', '.xls'];
    const fileName = file.name.toLowerCase();
    const isAllowed = allowedExtensions.some(ext => fileName.endsWith(ext));

    if (!isAllowed) {
      throw new Error(`Only these file types are allowed: ${allowedExtensions.join(', ')}`);
    }

    console.log(`📦 uploadItemFile: itemId=${itemId}, file=${file.name}`);

    const formData = new FormData();
    formData.append('itemId', itemId);
    formData.append('file', file);

    const url = `${this.baseURL}/ItemFiles/upload`;

    console.log(`📦 POST ${url}`);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.getAuthToken()}`
        },
        body: formData
      });

      console.log(`📡 Response: ${response.status}`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ Error ${response.status}:`, errorText);

        if (response.status === 401) {
          localStorage.removeItem('authToken');
          localStorage.removeItem('user');
          throw new Error('Oturum süresi doldu');
        }

        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ Upload success:', data);
      return data;
    } catch (error) {
      console.error('❌ Upload failed:', error);
      throw error;
    }
  }

  /**
   * Delete an item file
   * Backend: DELETE /api/ItemFiles/{id}
   */
  async deleteItemFile(fileId) {
    if (!fileId) {
      throw new Error('File ID is required');
    }

    console.log(`📦 deleteItemFile: fileId=${fileId}`);

    try {
      const response = await this.delete(`/ItemFiles/${fileId}`);
      console.log('✅ Delete success:', response);
      return response;
    } catch (error) {
      console.error('❌ Delete failed:', error);
      throw error;
    }
  }
  /**
   * Create a new BOM work
   * Backend: POST /api/BomWorks
   */

  getCurrentUserCredentials() {
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        return {
          username: user.login || user.username || user.email,
          password: user.password || '' // Login sırasında kaydedilmiş olmalı
        };
      }
    } catch (error) {
      console.error('Error getting user credentials:', error);
    }
    return { username: '', password: '' };
  }

  // src/frontend/src/services/api.js dosyasına eklenecek metodlar:

  // ===== DATA CAM PREPARATION ENDPOINTS =====

  /**
   * Get items pending technical drawing work
   * Backend: POST /api/DataCamPreparation/list
   */
  async getDataCamItems(params = {}) {
    console.log('📦 API getDataCamItems call:', params);

    try {
      const requestBody = {
        searchTerm: params.searchTerm || null,
        page: params.page || 1,
        pageSize: params.pageSize || 20,
        sortBy: params.sortBy || 'CreatedAt',
        sortOrder: params.sortOrder || 'asc'
      };

      const response = await this.post('/DataCamPreparation/list', requestBody);
      console.log('✅ API getDataCamItems response:', response);

      // Map response to camelCase
      return {
        items: response.items || response.Items || [],
        totalCount: response.totalCount || response.TotalCount || 0,
        page: response.page || response.Page || 1,
        pageSize: response.pageSize || response.PageSize || 20,
        totalPages: response.totalPages || response.TotalPages || 0,
        hasNextPage: response.hasNextPage || response.HasNextPage || false,
        hasPreviousPage: response.hasPreviousPage || response.HasPreviousPage || false
      };
    } catch (error) {
      console.error('❌ API getDataCamItems error:', error);
      throw error;
    }
  }

  /**
   * Get BOM locations for an item
   * Backend: GET /api/DataCamPreparation/item/{itemId}/bom-locations
   */
  async getItemBomLocations(itemId) {
    if (!itemId) {
      throw new Error('Item ID is required');
    }

    console.log('📦 API getItemBomLocations call:', { itemId });

    try {
      const response = await this.get(`/DataCamPreparation/item/${itemId}/bom-locations`);
      console.log('✅ API getItemBomLocations response:', response);
      return response;
    } catch (error) {
      console.error('❌ API getItemBomLocations error:', error);
      throw error;
    }
  }

  /**
   * Mark technical drawing as completed
   * Backend: POST /api/DataCamPreparation/mark-completed/{itemId}
   * ⚠️ Bu method sadece DataCam ekranından ürün kartı kaydedildiğinde çağrılmalıdır
   */
  async markTechnicalDrawingCompleted(itemId) {
    if (!itemId) {
      throw new Error('Item ID is required');
    }

    console.log('📦 API markTechnicalDrawingCompleted call:', { itemId });

    try {
      const response = await this.post(`/DataCamPreparation/mark-completed/${itemId}`, {});
      console.log('✅ API markTechnicalDrawingCompleted response:', response);

      return {
        success: response.success || response.Success || false,
        message: response.message || response.Message || '',
        itemId: response.itemId || response.ItemId || itemId,
        completedAt: response.completedAt || response.CompletedAt || new Date()
      };
    } catch (error) {
      console.error('❌ API markTechnicalDrawingCompleted error:', error);
      throw error;
    }
  }

  /**
   * Get DataCam statistics
   * Backend: GET /api/DataCamPreparation/stats
   */
  async getDataCamStats() {
    console.log('📦 API getDataCamStats call');

    try {
      const response = await this.get('/DataCamPreparation/stats');
      console.log('✅ API getDataCamStats response:', response);

      return {
        totalItems: response.totalItems || response.TotalItems || 0,
        completedItems: response.completedItems || response.CompletedItems || 0,
        pendingItems: response.pendingItems || response.PendingItems || 0,
        completionRate: response.completionRate || response.CompletionRate || 0,
        recentlyCompleted: response.recentlyCompleted || response.RecentlyCompleted || 0
      };
    } catch (error) {
      console.error('❌ API getDataCamStats error:', error);
      throw error;
    }
  }

  /**
 * Create a new BOM work
 * Backend: POST /api/BomWorks
 */
  async createBOMWork(workData) {
    if (!workData) {
      throw new Error('BOM work data is required');
    }

    if (!workData.projectId || !workData.projectName || !workData.workName) {
      throw new Error('ProjectId, ProjectName and WorkName are required');
    }

    console.log('📦 API createBOMWork call:', workData);

    try {
      // ✅ Kullanıcı credentials'larını localStorage'dan al
      const userStr = localStorage.getItem('user');
      let redmineUsername = '';
      let redminePassword = '';

      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          redmineUsername = user.login || user.username || user.email || '';
          redminePassword = user.password || '';
        } catch (e) {
          console.warn('User bilgisi parse edilemedi:', e);
        }
      }

      // ✅ Request body'ye credentials ekle
      const requestBody = {
        ...workData,
        redmineUsername,
        redminePassword
      };

      console.log('📦 API createBOMWork with credentials:', {
        ...requestBody,
        redminePassword: redminePassword ? '***' : 'empty'
      });

      const response = await this.post('/BomWorks', requestBody);
      console.log('✅ API createBOMWork response:', response);
      return response;
    } catch (error) {
      console.error('❌ API createBOMWork error:', error);
      throw error;
    }
  }

  /**
   * Update a BOM work
   * Backend: PUT /api/BomWorks/{id}
   */
  async updateBOMWork(id, workData) {
    if (!id) {
      throw new Error('BOM work ID is required');
    }

    if (!workData) {
      throw new Error('BOM work data is required');
    }

    console.log('📦 API updateBOMWork call:', { id, workData });

    try {
      const response = await this.put(`/BomWorks/${id}`, workData);
      console.log('✅ API updateBOMWork response:', response);
      return response;
    } catch (error) {
      console.error('❌ API updateBOMWork error:', error);
      throw error;
    }
  }

  /**
   * Delete a BOM work (soft delete)
   * Backend: DELETE /api/BomWorks/{id}
   */
  async deleteBOMWork(id) {
    if (!id) {
      throw new Error('BOM work ID is required');
    }

    console.log('📦 API deleteBOMWork call:', { id });

    try {
      const response = await this.delete(`/BomWorks/${id}`);
      console.log('✅ API deleteBOMWork response:', response);
      return response;
    } catch (error) {
      console.error('❌ API deleteBOMWork error:', error);
      throw error;
    }
  }

  /**
   * Permanently delete a BOM work
   * Backend: DELETE /api/BomWorks/{id}/permanent
   */
  async permanentDeleteBOMWork(id) {
    if (!id) {
      throw new Error('BOM work ID is required');
    }

    console.log('📦 API permanentDeleteBOMWork call:', { id });

    try {
      const response = await this.delete(`/BomWorks/${id}/permanent`);
      console.log('✅ API permanentDeleteBOMWork response:', response);
      return response;
    } catch (error) {
      console.error('❌ API permanentDeleteBOMWork error:', error);
      throw error;
    }
  }

  /**
   * Get BOM items list
   * Backend: POST /api/BomItems/list
   */
  async getBOMItems(params = {}) {
    console.log('📦 API getBOMItems call:', params);

    // ExcelId kontrolü - Backend'de required!
    if (!params.excelId) {
      throw new Error('ExcelId is required for getBOMItems');
    }

    try {

      const credentials = this.getCurrentUserCredentials();

      // ✅ Backend'in beklediği formatta request body
      const requestBody = {
        ExcelId: params.excelId,  // ✅ PascalCase ve required
        SearchTerm: params.searchTerm || null,
        redmineUsername: credentials.username,
        redminePassword: credentials.password,
        Page: params.page || 1,
        PageSize: params.pageSize || 50,
        SortBy: params.sortBy || "RowNumber",
        SortOrder: params.sortOrder || "asc"
      };

      console.log('📤 Sending request body:', requestBody);

      const response = await this.post('/BomItems/list', requestBody);
      console.log('📦 API getBOMItems raw response:', response);

      // ✅ TotalPages hesaplaması
      const pageSize = response.pageSize || response.PageSize || requestBody.PageSize;
      const totalCount = response.totalCount || response.TotalCount || 0;
      const totalPages = Math.ceil(totalCount / pageSize);

      // ✅ Response mapping
      const mappedResponse = {
        items: response.items || response.Items || [],
        totalCount: totalCount,
        page: response.page || response.Page || 1,
        pageSize: pageSize,
        totalPages: totalPages,
        excelFileName: response.excelFileName || response.ExcelFileName || ''
      };

      console.log('✅ API getBOMItems mapped response:', mappedResponse);
      console.log(`📊 Items: ${mappedResponse.items.length}, Total: ${totalCount}, Pages: ${totalPages}`);

      return mappedResponse;
    } catch (error) {
      console.error('❌ API getBOMItems error:', error);
      throw error;
    }
  }

  /**
   * Get a single BOM item by ID
   * Backend: GET /api/BomItems/{id}
   */
  async getBOMItem(id) {
    if (!id) {
      throw new Error('BOM item ID is required');
    }

    console.log('📦 API getBOMItem call:', { id });

    try {
      const response = await this.get(`/BomItems/${id}`);
      console.log('✅ API getBOMItem response:', response);
      return response;
    } catch (error) {
      console.error('❌ API getBOMItem error:', error);
      throw error;
    }
  }

  /**
   * Update a BOM item
   * Backend: PUT /api/BomItems/{id}
   */
  async updateBOMItem(id, itemData) {
    if (!id) {
      throw new Error('BOM item ID is required');
    }

    if (!itemData) {
      throw new Error('BOM item data is required');
    }

    console.log('📦 API updateBOMItem call:', { id, itemData });

    try {
      const response = await this.put(`/BomItems/${id}`, itemData);
      console.log('✅ API updateBOMItem response:', response);
      return response;
    } catch (error) {
      console.error('❌ API updateBOMItem error:', error);
      throw error;
    }
  }

  /**
   * Delete a BOM item
   * Backend: DELETE /api/BomItems/{id}
   */
  async deleteBOMItem(id) {
    if (!id) {
      throw new Error('BOM item ID is required');
    }

    console.log('📦 API deleteBOMItem call:', { id });

    try {
      const response = await this.delete(`/BomItems/${id}`);
      console.log('✅ API deleteBOMItem response:', response);
      return response;
    } catch (error) {
      console.error('❌ API deleteBOMItem error:', error);
      throw error;
    }
  }

  /**
   * Delete all BOM items from an Excel file
   * Backend: DELETE /api/BomItems/excel/{excelId}/all
   */
  async deleteAllBOMItemsFromExcel(excelId) {
    if (!excelId) {
      throw new Error('Excel ID is required');
    }

    console.log('📦 API deleteAllBOMItemsFromExcel call:', { excelId });

    try {
      const response = await this.delete(`/BomItems/excel/${excelId}/all`);
      console.log('✅ API deleteAllBOMItemsFromExcel response:', response);
      return response;
    } catch (error) {
      console.error('❌ API deleteAllBOMItemsFromExcel error:', error);
      throw error;
    }
  }

  /**
   * Get BOM item usage information
   * Backend: GET /api/BomItems/item/{itemId}/usage
   */
  async getBOMItemUsage(itemId) {
    if (!itemId) {
      throw new Error('Item ID is required');
    }

    console.log('📦 API getBOMItemUsage call:', { itemId });

    try {
      const response = await this.get(`/BomItems/item/${itemId}/usage`);
      console.log('✅ API getBOMItemUsage response:', response);
      return response;
    } catch (error) {
      console.error('❌ API getBOMItemUsage error:', error);
      throw error;
    }
  }

  // ===== YARDIMCI METODLAR (Excel dosyası varsa) =====
  /**
   * Get Excel files for a BOM work
   * Backend: POST /api/BomExcels/list
   */
  async getBOMExcels(workId) {
    if (!workId) {
      throw new Error('BOM work ID is required');
    }

    console.log('📦 API getBOMExcels call:', { workId });

    try {
      // Backend: POST /api/BomExcels/list
      const requestBody = {
        workId: workId,
        page: 1,
        pageSize: 100
      };

      const response = await this.post('/BomExcels/list', requestBody);
      console.log('📦 API getBOMExcels raw response:', response);

      // Response mapping
      const excels = response.excels || response.Excels || response.data || response.Data || [];

      console.log('✅ API getBOMExcels mapped:', excels);
      return excels;
    } catch (error) {
      console.error('❌ API getBOMExcels error:', error);
      throw error;
    }
  }

  /**
 * Upload Excel file to a BOM work
 * Backend: POST /api/BomExcels/upload
 * Form Data: workId + file
 */
  async uploadBOMExcel(workId, file) {
    if (!workId) {
      throw new Error('BOM work ID is required');
    }

    if (!file) {
      throw new Error('Excel file is required');
    }

    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      throw new Error('Only Excel files (.xlsx, .xls) are allowed');
    }

    console.log(`📦 uploadBOMExcel: workId=${workId}, file=${file.name}`);

    const formData = new FormData();
    formData.append('workId', workId);  // ← EKLENEN!
    formData.append('file', file);

    // ✅ DOĞRU URL
    const url = `${this.baseURL}/BomExcels/upload`;

    console.log(`📦 POST ${url}`);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.getAuthToken()}`
        },
        body: formData
      });

      console.log(`📡 Response: ${response.status}`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ Error ${response.status}:`, errorText);

        if (response.status === 401) {
          localStorage.removeItem('authToken');
          localStorage.removeItem('user');
          throw new Error('Oturum süresi doldu');
        }

        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ Upload success:', data);
      return data;
    } catch (error) {
      console.error('❌ Upload failed:', error);
      throw error;
    }
  }

  /**
 * Delete an Excel file
 * Backend: DELETE /api/BomExcels/{id}
 */
  async deleteBOMExcel(excelId) {
    if (!excelId) {
      throw new Error('Excel ID is required');
    }

    console.log('📦 API deleteBOMExcel call:', { excelId });

    try {
      const response = await this.delete(`/BomExcels/${excelId}`);
      console.log('✅ API deleteBOMExcel response:', response);
      return response;
    } catch (error) {
      console.error('❌ API deleteBOMExcel error:', error);
      throw error;
    }
  }


  /**
   * Reprocess an Excel file (parse again)
   * Backend: POST /api/BomExcels/{id}/reprocess
   */
  async reprocessBOMExcel(excelId) {
    if (!excelId) {
      throw new Error('Excel ID is required');
    }

    console.log('📦 API reprocessBOMExcel call:', { excelId });

    try {
      const response = await this.post(`/BomExcels/${excelId}/reprocess`, {});
      console.log('✅ API reprocessBOMExcel response:', response);
      return response;
    } catch (error) {
      console.error('❌ API reprocessBOMExcel error:', error);
      throw error;
    }
  }

  /**
   * Get items from an Excel file
   * Backend: POST /api/BomItems/list with excelId filter
   */
  async getBOMExcelItems(excelId, params = {}) {
    if (!excelId) {
      throw new Error('Excel ID is required');
    }

    console.log('📦 API getBOMExcelItems call:', { excelId, params });

    try {
      // ✅ Düzeltilmiş getBOMItems'ı çağır
      const response = await this.getBOMItems({
        excelId: excelId,  // ← Bu getBOMItems içinde ExcelId'ye dönüşecek
        page: params.page || 1,
        pageSize: params.pageSize || 50,
        searchTerm: params.searchTerm || null,
        sortBy: params.sortBy || "RowNumber",
        sortOrder: params.sortOrder || "asc"
      });

      console.log('✅ API getBOMExcelItems response:', response);
      return response;
    } catch (error) {
      console.error('❌ API getBOMExcelItems error:', error);
      throw error;
    }
  }

  // ===== BOM METODLARI SONU =====


  // ===== ITEM GROUPS ENDPOINTS =====

  async getItemGroups(params = {}) {
    const queryParams = new URLSearchParams();

    Object.keys(params).forEach(key => {
      if (params[key] !== null && params[key] !== undefined && params[key] !== '') {
        queryParams.append(key, params[key]);
      }
    });

    const endpoint = queryParams.toString()
      ? `/ItemGroups?${queryParams.toString()}` : '/ItemGroups';

    try {
      const response = await this.get(endpoint);

      const mappedResponse = {
        itemGroups: response.itemGroups || response.ItemGroups || [],
        totalCount: response.totalCount || response.TotalCount || 0,
        page: response.page || response.Page || 1,
        pageSize: response.pageSize || response.PageSize || 10,
        totalPages: response.totalPages || response.TotalPages || 0,
        hasNextPage: response.hasNextPage || response.HasNextPage || false,
        hasPreviousPage: response.hasPreviousPage || response.HasPreviousPage || false
      };

      return mappedResponse;
    } catch (error) {
      console.error('API getItemGroups error:', error);
      throw error;
    }
  }

  async getItemGroup(id) {
    if (!id) throw new Error('ItemGroup ID is required');
    return this.get(`/ItemGroups/${id}`);
  }

  async createItemGroup(itemGroupData) {
    if (!itemGroupData) throw new Error('ItemGroup data is required');
    return this.post('/ItemGroups', itemGroupData);
  }

  async updateItemGroup(id, itemGroupData) {
    if (!id) throw new Error('ItemGroup ID is required');
    if (!itemGroupData) throw new Error('ItemGroup data is required');
    return this.put(`/ItemGroups/${id}`, itemGroupData);
  }

  async deleteItemGroup(id) {
    if (!id) throw new Error('ItemGroup ID is required');
    return this.delete(`/ItemGroups/${id}`);
  }

  // ===== ITEMS ENDPOINTS =====

  async getItems(params = {}) {
    const queryParams = new URLSearchParams();

    Object.keys(params).forEach(key => {
      if (params[key] !== null && params[key] !== undefined && params[key] !== '') {
        queryParams.append(key, params[key]);
      }
    });

    const endpoint = queryParams.toString()
      ? `/Items?${queryParams.toString()}` : '/Items';

    try {
      const response = await this.get(endpoint);

      const mappedResponse = {
        items: response.items || response.Items || [],
        totalCount: response.totalCount || response.TotalCount || 0,
        page: response.page || response.Page || 1,
        pageSize: response.pageSize || response.PageSize || 10,
        totalPages: response.totalPages || response.TotalPages || 0,
        hasNextPage: response.hasNextPage || response.HasNextPage || false,
        hasPreviousPage: response.hasPreviousPage || response.HasPreviousPage || false
      };

      return mappedResponse;
    } catch (error) {
      console.error('API getItems error:', error);
      throw error;
    }
  }

  async getItem(id) {
    if (!id) throw new Error('Item ID is required');
    return this.get(`/Items/${id}`);
  }

  async createItem(itemData) {
    if (!itemData) throw new Error('Item data is required');
    return this.post('/Items', itemData);
  }

  async updateItem(id, itemData) {
    if (!id) throw new Error('Item ID is required');
    if (!itemData) throw new Error('Item data is required');
    return this.put(`/Items/${id}`, itemData);
  }

  async deleteItem(id) {
    if (!id) throw new Error('Item ID is required');
    return this.delete(`/Items/${id}`);
  }
  // src/frontend/src/services/api.js
  // API METODLARINA EKLENECEK KISIM

  /**
   * Get projects from Redmine
   * Backend: POST /api/Projects
   * NOT: Artık Redmine şifresi göndermeye gerek yok, backend JWT token'dan alacak
   */
  async getProjects(params = {}) {
    console.log('📦 API getProjects call:', params);

    try {
      const requestBody = {
        status: params.status || 1, // 1 = active projects
        name: params.name || null,
        limit: params.limit || 100,
        offset: params.offset || 0
        // ŞİFRE ARTIK GÖNDERİLMİYOR - Backend JWT token'dan alacak
      };

      const response = await this.post('/Projects', requestBody);
      console.log('📦 API getProjects raw response:', response);

      // Response'u frontend formatına çevir
      const projects = (response || []).map(project => ({
        id: project.id,
        name: project.name,
        identifier: project.identifier,
        description: project.description,
        status: project.status,
        isPublic: project.isPublic,
        createdOn: project.createdOn,
        updatedOn: project.updatedOn,
        parent: project.parent
      }));

      console.log('✅ API getProjects mapped response:', projects);
      return projects;
    } catch (error) {
      console.error('❌ API getProjects error:', error);
      throw error;
    }
  }

  /**
   * Get user projects from Redmine
   * Backend: POST /api/Projects/user/{userId}
   * NOT: Artık Redmine şifresi göndermeye gerek yok, backend JWT token'dan alacak
   */
  async getUserProjects(userId, params = {}) {
    if (!userId) {
      throw new Error('User ID is required');
    }

    console.log('📦 API getUserProjects call:', { userId, params });

    try {
      const requestBody = {};
      // ŞİFRE ARTIK GÖNDERİLMİYOR - Backend JWT token'dan alacak

      const response = await this.post(`/Projects/user/${userId}`, requestBody);
      console.log('📦 API getUserProjects raw response:', response);

      const projects = (response || []).map(project => ({
        id: project.id,
        name: project.name,
        identifier: project.identifier,
        description: project.description,
        status: project.status,
        isPublic: project.isPublic,
        createdOn: project.createdOn,
        updatedOn: project.updatedOn,
        parent: project.parent
      }));

      console.log('✅ API getUserProjects mapped response:', projects);
      return projects;
    } catch (error) {
      console.error('❌ API getUserProjects error:', error);
      throw error;
    }
  }

  // =============================================================================
  // API.JS'E EKLENECEK KOD - YETKİ YÖNETİMİ METODLARI (JWT TABANLI)
  // =============================================================================
  // NOT: Bu metodları api.js dosyasının sonuna (export'tan önce) ekleyin
  // ARTIK CREDENTİALS PARAMETRES İYOK - JWT TOKEN'DAN OTOMATIK ALINIYOR!
  // =============================================================================

  // ===== PERMISSION MANAGEMENT ENDPOINTS =====
  // JWT TOKEN'DAN CREDENTİALS ALINIYOR - BODY BOŞ VEYA SADECE GEREKLI DATA

  /**
   * Yetki yönetimi ana ekranı için tüm bilgileri getir
   * Backend JWT token'dan Redmine credentials'ı alıyor
   */
  async getPermissionManagement() {
    console.log('📦 API getPermissionManagement call (JWT-based)');


    const userStr = localStorage.getItem('user');
    let username = '';
    let password = '';

    console.log('umut');
    console.log(userStr);

    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        username = user.login || user.username || user.email || '';
        password = user.password || '';
      } catch (e) {
        console.warn('User bilgisi parse edilemedi:', e);
      }
    }

    // ✅ Backend POST /api/BomWorks/list bekliyor + credentials
    const requestBody = {
      username,
      password
    };

    try {
      // Body boş gönder - backend JWT'den alacak
      const response = await this.post('/Permissions/management', requestBody);
      console.log('📦 API getPermissionManagement response:', response);
      return response;
    } catch (error) {
      console.error('❌ API getPermissionManagement error:', error);
      throw error;
    }
  }

  /**
   * Kullanıcıları listele
   * Backend JWT token'dan Redmine credentials'ı alıyor
   */
  async getPermissionUsers() {
    console.log('📦 API getPermissionUsers call (JWT-based)');

    try {
      const response = await this.post('/Permissions/users', {});
      console.log('📦 API getPermissionUsers response:', response);
      return response;
    } catch (error) {
      console.error('❌ API getPermissionUsers error:', error);
      throw error;
    }
  }

  /**
   * Grupları listele
   * Backend JWT token'dan Redmine credentials'ı alıyor
   */
  async getPermissionGroups() {
    console.log('📦 API getPermissionGroups call (JWT-based)');

    try {
      const response = await this.post('/Permissions/groups', {});
      console.log('📦 API getPermissionGroups response:', response);
      return response;
    } catch (error) {
      console.error('❌ API getPermissionGroups error:', error);
      throw error;
    }
  }

  /**
   * Özel alanları getir
   * Backend JWT token'dan Redmine credentials'ı alıyor
   */
  async getPermissionCustomFields() {
    console.log('📦 API getPermissionCustomFields call (JWT-based)');

    try {
      const response = await this.post('/Permissions/custom-fields', {});
      console.log('📦 API getPermissionCustomFields response:', response);
      return response;
    } catch (error) {
      console.error('❌ API getPermissionCustomFields error:', error);
      throw error;
    }
  }

  /**
   * Kullanıcı yetki güncelle
   * Backend JWT token'dan Redmine credentials'ı alıyor
   * @param {number} userId - Kullanıcı ID
   * @param {object} data - {customFieldId, value}
   */
  async updateUserPermission(userId, data) {
    if (!userId) {
      throw new Error('User ID is required');
    }
    if (!data || data.customFieldId === undefined) {
      throw new Error('customFieldId is required');
    }

    console.log('📦 API updateUserPermission call (JWT-based):', { userId, customFieldId: data.customFieldId });

    try {
      const response = await this.put(`/Permissions/users/${userId}/permissions`, {
        customFieldId: data.customFieldId,
        value: data.value || ''
      });

      console.log('✅ API updateUserPermission response:', response);
      return response;
    } catch (error) {
      console.error('❌ API updateUserPermission error:', error);
      throw error;
    }
  }

  /**
   * Grup yetki güncelle
   * Backend JWT token'dan Redmine credentials'ı alıyor
   * @param {number} groupId - Grup ID
   * @param {object} data - {customFieldId, value}
   */
  async updateGroupPermission(groupId, data) {
    if (!groupId) {
      throw new Error('Group ID is required');
    }
    if (!data || data.customFieldId === undefined) {
      throw new Error('customFieldId is required');
    }

    console.log('📦 API updateGroupPermission call (JWT-based):', { groupId, customFieldId: data.customFieldId });

    try {
      const response = await this.put(`/Permissions/groups/${groupId}/permissions`, {
        customFieldId: data.customFieldId,
        value: data.value || ''
      });

      console.log('✅ API updateGroupPermission response:', response);
      return response;
    } catch (error) {
      console.error('❌ API updateGroupPermission error:', error);
      throw error;
    }
  }

  /**
   * Login sırasında kullanıcı yetkilerini getir
   * Backend JWT token'dan Redmine credentials'ı alıyor
   * @param {number} userId - Kullanıcı ID
   */
  async getUserLoginPermissions(userId) {
    if (!userId) {
      throw new Error('User ID is required');
    }

    console.log('📦 API getUserLoginPermissions call (JWT-based):', { userId });

    try {
      const response = await this.post('/Permissions/user-login-permissions', {
        userId: userId
      });

      console.log('✅ API getUserLoginPermissions response:', response);
      return response;
    } catch (error) {
      console.error('❌ API getUserLoginPermissions error:', error);
      throw error;
    }
  }


  // =============================================================================
  // YUKARIDAKI KODU api.js DOSYASININ SONUNA EKLEYIN
  // export default apiService; SATIRINDAN HEMEN ÖNCE
  // =============================================================================

  // ========================================
  // PURCHASE REQUESTS - SATINALMA TALEPLERİ
  // ========================================

  /**
   * Talep listesini getir
   */
  async getPurchaseRequests(params = {}) {
    try {
      const queryString = new URLSearchParams(
        Object.entries(params).filter(([_, v]) => v != null && v !== '')
      ).toString();

      const url = queryString
        ? `${API_ENDPOINTS.PURCHASE_REQUESTS.LIST}?${queryString}`
        : API_ENDPOINTS.PURCHASE_REQUESTS.LIST;

      return await this.get(url);
    } catch (error) {
      console.error('Error fetching purchase requests:', error);
      throw error;
    }
  }

  /**
   * Benim taleplerimi getir
   */
  async getMyPurchaseRequests(params = {}) {
    try {
      const queryString = new URLSearchParams(
        Object.entries(params).filter(([_, v]) => v != null && v !== '')
      ).toString();

      const url = queryString
        ? `${API_ENDPOINTS.PURCHASE_REQUESTS.MY_REQUESTS}?${queryString}`
        : API_ENDPOINTS.PURCHASE_REQUESTS.MY_REQUESTS;

      return await this.get(url);
    } catch (error) {
      console.error('Error fetching my purchase requests:', error);
      throw error;
    }
  }

  /**
   * Onay bekleyen talepleri getir (benim onayıma sunulan)
   */
  async getPendingMyApprovalRequests(params = {}) {
    try {
      const queryString = new URLSearchParams(
        Object.entries(params).filter(([_, v]) => v != null && v !== '')
      ).toString();

      const url = queryString
        ? `${API_ENDPOINTS.PURCHASE_REQUESTS.PENDING_MY_APPROVAL}?${queryString}`
        : API_ENDPOINTS.PURCHASE_REQUESTS.PENDING_MY_APPROVAL;

      return await this.get(url);
    } catch (error) {
      console.error('Error fetching pending approval requests:', error);
      throw error;
    }
  }

  /**
   * Talep detayını getir
   */
  async getPurchaseRequest(id) {
    try {
      return await this.get(`${API_ENDPOINTS.PURCHASE_REQUESTS.GET}/${id}`);
    } catch (error) {
      console.error(`Error fetching purchase request ${id}:`, error);
      throw error;
    }
  }

  /**
   * Yeni talep oluştur
   */
  async createPurchaseRequest(data) {
    try {
      return await this.post(API_ENDPOINTS.PURCHASE_REQUESTS.CREATE, data);
    } catch (error) {
      console.error('Error creating purchase request:', error);
      throw error;
    }
  }

  /**
   * Talep güncelle
   */
  async updatePurchaseRequest(id, data) {
    try {
      return await this.put(`${API_ENDPOINTS.PURCHASE_REQUESTS.UPDATE}/${id}`, data);
    } catch (error) {
      console.error(`Error updating purchase request ${id}:`, error);
      throw error;
    }
  }

  /**
   * Talep sil
   */
  async deletePurchaseRequest(id) {
    try {
      return await this.delete(`${API_ENDPOINTS.PURCHASE_REQUESTS.DELETE}/${id}`);
    } catch (error) {
      console.error(`Error deleting purchase request ${id}:`, error);
      throw error;
    }
  }

  /**
   * Talebi gönder (submit)
   */
  async submitPurchaseRequest(id, data = {}) {
    try {
      return await this.post(`${API_ENDPOINTS.PURCHASE_REQUESTS.SUBMIT}/${id}/submit`, data);
    } catch (error) {
      console.error(`Error submitting purchase request ${id}:`, error);
      throw error;
    }
  }

  /**
   * Talebi onayla
   */
  async approvePurchaseRequest(id, data) {
    try {
      return await this.post(`${API_ENDPOINTS.PURCHASE_REQUESTS.APPROVE}/${id}/approve`, data);
    } catch (error) {
      console.error(`Error approving purchase request ${id}:`, error);
      throw error;
    }
  }

  /**
   * Talebi reddet
   */
  async rejectPurchaseRequest(id, data) {
    try {
      return await this.post(`${API_ENDPOINTS.PURCHASE_REQUESTS.REJECT}/${id}/reject`, data);
    } catch (error) {
      console.error(`Error rejecting purchase request ${id}:`, error);
      throw error;
    }
  }

  /**
   * Talebi iptal et
   */
  async cancelPurchaseRequest(id, data) {
    try {
      return await this.post(`${API_ENDPOINTS.PURCHASE_REQUESTS.CANCEL}/${id}/cancel`, data);
    } catch (error) {
      console.error(`Error cancelling purchase request ${id}:`, error);
      throw error;
    }
  }

  /**
   * Talep istatistiklerini getir
   */
  async getPurchaseRequestStats() {
    try {
      return await this.get(API_ENDPOINTS.PURCHASE_REQUESTS.STATS);
    } catch (error) {
      console.error('Error fetching purchase request stats:', error);
      throw error;
    }
  }

  // ========================================
  // PURCHASE ORDERS - SATINALMA SİPARİŞLERİ
  // ========================================

  /**
   * Sipariş listesini getir
   */
  async getPurchaseOrders(params = {}) {
    try {
      const queryString = new URLSearchParams(
        Object.entries(params).filter(([_, v]) => v != null && v !== '')
      ).toString();

      const url = queryString
        ? `${API_ENDPOINTS.PURCHASE_ORDERS.LIST}?${queryString}`
        : API_ENDPOINTS.PURCHASE_ORDERS.LIST;

      return await this.get(url);
    } catch (error) {
      console.error('Error fetching purchase orders:', error);
      throw error;
    }
  }

  /**
   * Sipariş detayını getir
   */
  async getPurchaseOrder(id) {
    try {
      return await this.get(`${API_ENDPOINTS.PURCHASE_ORDERS.GET}/${id}`);
    } catch (error) {
      console.error(`Error fetching purchase order ${id}:`, error);
      throw error;
    }
  }

  /**
   * Yeni sipariş oluştur
   */
  async createPurchaseOrder(data) {
    try {
      return await this.post(API_ENDPOINTS.PURCHASE_ORDERS.CREATE, data);
    } catch (error) {
      console.error('Error creating purchase order:', error);
      throw error;
    }
  }

  /**
   * Taleplerden sipariş oluştur
   */
  async createPurchaseOrderFromRequests(data) {
    try {
      return await this.post(API_ENDPOINTS.PURCHASE_ORDERS.CREATE_FROM_REQUEST, data);
    } catch (error) {
      console.error('Error creating purchase order from requests:', error);
      throw error;
    }
  }

  /**
   * Sipariş güncelle
   */
  async updatePurchaseOrder(id, data) {
    try {
      return await this.put(`${API_ENDPOINTS.PURCHASE_ORDERS.UPDATE}/${id}`, data);
    } catch (error) {
      console.error(`Error updating purchase order ${id}:`, error);
      throw error;
    }
  }

  /**
   * Sipariş sil
   */
  async deletePurchaseOrder(id) {
    try {
      return await this.delete(`${API_ENDPOINTS.PURCHASE_ORDERS.DELETE}/${id}`);
    } catch (error) {
      console.error(`Error deleting purchase order ${id}:`, error);
      throw error;
    }
  }

  /**
   * Siparişi gönder (submit)
   */
  async submitPurchaseOrder(id, data = {}) {
    try {
      return await this.post(`${API_ENDPOINTS.PURCHASE_ORDERS.SUBMIT}/${id}/submit`, data);
    } catch (error) {
      console.error(`Error submitting purchase order ${id}:`, error);
      throw error;
    }
  }

  /**
   * Siparişi onayla
   */
  async approvePurchaseOrder(id, data) {
    try {
      return await this.post(`${API_ENDPOINTS.PURCHASE_ORDERS.APPROVE}/${id}/approve`, data);
    } catch (error) {
      console.error(`Error approving purchase order ${id}:`, error);
      throw error;
    }
  }

  /**
   * Siparişi onayla (confirm)
   */
  async confirmPurchaseOrder(id, data) {
    try {
      return await this.post(`${API_ENDPOINTS.PURCHASE_ORDERS.CONFIRM}/${id}/confirm`, data);
    } catch (error) {
      console.error(`Error confirming purchase order ${id}:`, error);
      throw error;
    }
  }

  /**
   * Siparişi iptal et
   */
  async cancelPurchaseOrder(id, data) {
    try {
      return await this.post(`${API_ENDPOINTS.PURCHASE_ORDERS.CANCEL}/${id}/cancel`, data);
    } catch (error) {
      console.error(`Error cancelling purchase order ${id}:`, error);
      throw error;
    }
  }

  /**
   * Teslimat güncelle
   */
  async updatePurchaseOrderDelivery(id, data) {
    try {
      return await this.post(`${API_ENDPOINTS.PURCHASE_ORDERS.UPDATE_DELIVERY}/${id}/update-delivery`, data);
    } catch (error) {
      console.error(`Error updating delivery for order ${id}:`, error);
      throw error;
    }
  }

  /**
   * Sipariş istatistiklerini getir
   */
  async getPurchaseOrderStats() {
    try {
      return await this.get(API_ENDPOINTS.PURCHASE_ORDERS.STATS);
    } catch (error) {
      console.error('Error fetching purchase order stats:', error);
      throw error;
    }
  }

  // ===== ARVENTO ENDPOINTS =====

  /**
   * Arvento araç durumunu getirir (GetVehicleStatus)
   * @param {Object} params - Query parametreleri
   * @param {string} params.language - Dil kodu (0: Türkçe, 1: İngilizce)
   */
  async getArventoVehicleStatus(params = {}) {
    try {
      console.log('📡 API getArventoVehicleStatus call with params:', params);

      const queryParams = new URLSearchParams();
      if (params.language) queryParams.append('language', params.language);

      const endpoint = queryParams.toString()
        ? `/Arvento/vehicle-status?${queryParams.toString()}`
        : '/Arvento/vehicle-status';

      const response = await this.get(endpoint);
      console.log('✅ Arvento vehicle status response:', response);

      return response;
    } catch (error) {
      console.error('❌ Error getting Arvento vehicle status:', error);
      throw error;
    }
  }

  /**
   * Arvento araç çalışma raporunu getirir (IgnitionBasedDeviceWorking)
   * @param {Object} params - Query parametreleri
   * @param {string} params.startDate - Başlangıç tarihi (ISO format)
   * @param {string} params.endDate - Bitiş tarihi (ISO format)
   * @param {string} params.node - Cihaz numarası (opsiyonel)
   * @param {string} params.group - Araç grubu (opsiyonel)
   * @param {string} params.locale - Yerel ayar (varsayılan: 'tr')
   * @param {string} params.language - Dil kodu (0: Türkçe, 1: İngilizce)
   */
  async getArventoWorkingReport(params = {}) {
    try {
      console.log('📊 API getArventoWorkingReport call with params:', params);

      const queryParams = new URLSearchParams();

      // Zorunlu parametreler
      if (params.startDate) queryParams.append('startDate', params.startDate);
      if (params.endDate) queryParams.append('endDate', params.endDate);

      // Opsiyonel parametreler
      if (params.node) queryParams.append('node', params.node);
      if (params.group) queryParams.append('group', params.group);
      if (params.locale) queryParams.append('locale', params.locale);
      if (params.language) queryParams.append('language', params.language);

      const endpoint = `/Arvento/working-report?${queryParams.toString()}`;

      const response = await this.get(endpoint);
      console.log('✅ Arvento working report response:', response);

      return response;
    } catch (error) {
      console.error('❌ Error getting Arvento working report:', error);
      throw error;
    }
  }

  /**
   * Arvento bağlantısını test eder
   */
  async testArventoConnection() {
    try {
      console.log('🔌 API testArventoConnection call');

      const response = await this.get('/Arvento/test-connection');
      console.log('✅ Arvento connection test response:', response);

      return response;
    } catch (error) {
      console.error('❌ Arvento connection test failed:', error);
      throw error;
    }
  }
}



// Create a single instance
const apiService = new ApiService();

// Export the instance
export default apiService;