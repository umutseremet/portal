// ===== 2. src/frontend/src/services/authService.js (Temizlenmiş) =====

import apiService from './api';

class AuthService {
  // Login user
  async login(credentials) {
    try {
      console.log('AuthService: Login attempt', { email: credentials.email });
      
      // Make API call through apiService
      const response = await apiService.login(credentials);
      
      if (response.success && response.token && response.user) {
        // Store auth data
        localStorage.setItem('authToken', response.token);
        localStorage.setItem('user', JSON.stringify(response.user));
        
        console.log('AuthService: Login successful', response.user);
        
        return {
          success: true,
          user: response.user,
          token: response.token
        };
      } else {
        return {
          success: false,
          error: response.error || 'Giriş bilgileri doğrulanamadı'
        };
      }
    } catch (error) {
      console.error('AuthService: Login error', error);
      return {
        success: false,
        error: error.message || 'Giriş sırasında bir hata oluştu'
      };
    }
  }

  // Register user
  async register(userData) {
    try {
      const response = await apiService.register(userData);
      
      if (response.success && response.token && response.user) {
        localStorage.setItem('authToken', response.token);
        localStorage.setItem('user', JSON.stringify(response.user));
        
        return {
          success: true,
          user: response.user,
          token: response.token
        };
      } else {
        return {
          success: false,
          error: 'Kayıt işlemi tamamlanamadı'
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Kayıt sırasında bir hata oluştu'
      };
    }
  }

  // Logout user
  async logout() {
    try {
      await apiService.logout();
      
      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      // Clear local storage even if API call fails
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      return { success: true };
    }
  }

  // Refresh token
  async refreshToken() {
    try {
      const result = await apiService.refreshToken();
      
      if (result.success) {
        localStorage.setItem('authToken', result.token);
        localStorage.setItem('user', JSON.stringify(result.user));
      }
      
      return result;
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Token yenileme başarısız'
      };
    }
  }

  // Forgot password
  async forgotPassword(email) {
    try {
      await apiService.forgotPassword(email);
      return {
        success: true,
        message: 'Şifre sıfırlama e-postası gönderildi'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Şifre sıfırlama isteği gönderilemedi'
      };
    }
  }

  // Reset password
  async resetPassword(token, newPassword) {
    try {
      await apiService.resetPassword(token, newPassword);
      return {
        success: true,
        message: 'Şifreniz başarıyla güncellendi'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Şifre sıfırlama başarısız'
      };
    }
  }

  // Change password
  async changePassword(currentPassword, newPassword) {
    try {
      await apiService.put('/Auth/change-password', {
        currentPassword,
        newPassword
      });
      return {
        success: true,
        message: 'Şifreniz başarıyla değiştirildi'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Şifre değiştirme başarısız'
      };
    }
  }

  // Verify token
  async verifyToken() {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        return { success: false, error: 'Token bulunamadı' };
      }

      const response = await apiService.verifyToken();
      return response;
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Token doğrulama başarısız'
      };
    }
  }

  // Get current user from localStorage
  getCurrentUser() {
    try {
      const userStr = localStorage.getItem('user');
      return userStr ? JSON.parse(userStr) : null;
    } catch (error) {
      console.error('Error parsing user data:', error);
      return null;
    }
  }

  // Check if user is authenticated
  isAuthenticated() {
    const token = localStorage.getItem('authToken');
    const user = this.getCurrentUser();
    return !!(token && user);
  }

  // Get auth token
  getToken() {
    return localStorage.getItem('authToken');
  }

  // Check if token is expired (basic check)
  isTokenExpired() {
    try {
      const token = this.getToken();
      if (!token) return true;

      // For mock tokens, just check if they exist
      if (token.includes('mock-jwt-token')) {
        return false; // Mock tokens don't expire for development
      }

      // Basic JWT token expiry check for real tokens
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      
      return payload.exp < currentTime;
    } catch (error) {
      console.error('Error checking token expiry:', error);
      return true;
    }
  }
}

// Create and export a singleton instance
const authService = new AuthService();
export default authService;