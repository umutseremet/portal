import apiService from './api';

class AuthService {
  // Login user
  async login(credentials) {
    try {
      // For demo purposes, we'll simulate an API call
      // In a real app, this would make an actual API request
      if (credentials.email === 'admin@admin.com' && credentials.password === 'admin123') {
        const userData = {
          id: 1,
          name: 'Admin User',
          email: credentials.email,
          role: 'admin',
          avatar: 'https://ui-avatars.com/api/?name=Admin%20User&size=40&background=FF6B6B&color=ffffff&bold=true',
          permissions: ['read', 'write', 'delete'],
          lastLogin: new Date().toISOString()
        };
        
        const token = 'jwt-token-' + Date.now();
        
        // Store auth data
        localStorage.setItem('authToken', token);
        localStorage.setItem('user', JSON.stringify(userData));
        
        return {
          success: true,
          user: userData,
          token: token
        };
      } else {
        return {
          success: false,
          error: 'Geçersiz email veya şifre'
        };
      }
    } catch (error) {
      return {
        success: false,
        error: 'Giriş sırasında bir hata oluştu'
      };
    }
  }

  // Register user
  async register(userData) {
    try {
      // Simulate API call
      const response = await apiService.post('/auth/register', userData);
      return {
        success: true,
        user: response.user,
        token: response.token
      };
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
      // Clear local storage
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      
      // Optionally call API to invalidate token
      // await apiService.post('/auth/logout');
      
      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      // Still clear local storage even if API call fails
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      return { success: true };
    }
  }

  // Refresh auth token
  async refreshToken() {
    try {
      const response = await apiService.post('/auth/refresh');
      
      if (response.token) {
        localStorage.setItem('authToken', response.token);
        return {
          success: true,
          token: response.token
        };
      }
      
      throw new Error('No token received');
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
      await apiService.post('/auth/forgot-password', { email });
      return {
        success: true,
        message: 'Şifre sıfırlama bağlantısı email adresinize gönderildi'
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
      await apiService.post('/auth/reset-password', {
        token,
        password: newPassword
      });
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
      await apiService.put('/auth/change-password', {
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

      const response = await apiService.post('/auth/verify');
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
}

// Create and export a singleton instance
const authService = new AuthService();
export default authService;