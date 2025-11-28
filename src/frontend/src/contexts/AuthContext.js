// src/frontend/src/contexts/AuthContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import authService from '../services/authService';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      setLoading(true);

      // Check if user data exists in localStorage
      const token = localStorage.getItem('authToken');
      const savedUser = localStorage.getItem('user');

      if (token && savedUser) {
        // Check if token is expired
        if (authService.isTokenExpired()) {
          console.log('Token expired, attempting refresh...');
          const refreshResult = await authService.refreshToken();

          if (refreshResult.success) {
            setIsAuthenticated(true);
            setUser(JSON.parse(savedUser));
          } else {
            // Token refresh failed, clear auth data
            await logout();
          }
        } else {
          // Token is valid
          setIsAuthenticated(true);
          setUser(JSON.parse(savedUser));
        }
      }
    } catch (error) {
      console.error('Auth initialization error:', error);
      // Clear potentially corrupted auth data
      await logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (credentials) => {
    try {
      setLoading(true);
      setError(null);

      console.log('🔐 Attempting login with API...', {
        email: credentials.email,
        apiUrl: process.env.REACT_APP_API_BASE_URL
      });

      // Call the real API through authService
      const result = await authService.login(credentials);

      console.log('🔐 API Login result:', result);

      if (result.success) {
        clearAllFilters();
        
        // ✅ YENİ: Login sonrası kullanıcı yetkilerini çek
        try {
          console.log('🔑 Fetching user permissions for userId:', result.user.id);
          
          // apiService'i import et
          const apiService = (await import('../services/api')).default;
          const permissionsResult = await apiService.getUserLoginPermissions(result.user.id);
          
          console.log('🔑 Permissions API response:', permissionsResult);
          
          if (permissionsResult && permissionsResult.permissions) {
            // Kullanıcı bilgilerine yetkileri ekle
            const updatedUser = {
              ...result.user,
              permissions: permissionsResult.permissions,
              isAdmin: permissionsResult.isAdmin || false
            };
            
            // localStorage'ı güncelle
            localStorage.setItem('user', JSON.stringify(updatedUser));
            
            setUser(updatedUser);
            setIsAuthenticated(true);
            console.log('✅ Login successful with permissions:', {
              user: updatedUser.login || updatedUser.username,
              isAdmin: updatedUser.isAdmin,
              permissionCount: updatedUser.permissions.length
            });
            
            return { success: true, user: updatedUser };
          } else {
            // Yetkiler alınamadıysa da giriş başarılı
            console.warn('⚠️ Permissions not loaded, continuing with basic user info');
            setUser(result.user);
            setIsAuthenticated(true);
            return { success: true, user: result.user };
          }
        } catch (permError) {
          console.error('⚠️ Failed to load permissions, continuing with basic user info:', permError);
          setUser(result.user);
          setIsAuthenticated(true);
          return { success: true, user: result.user };
        }
      } else {
        console.log('❌ Login failed:', result.error);
        setError(result.error);
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error('🚨 Login error:', error);
      const errorMessage = 'Giriş sırasında beklenmeyen bir hata oluştu. API bağlantısını kontrol edin.';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    try {
      setLoading(true);
      setError(null);

      const result = await authService.register(userData);

      if (result.success) {
        setIsAuthenticated(true);
        setUser(result.user);
        return { success: true, user: result.user };
      } else {
        setError(result.error);
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error('🚨 Register error:', error);
      const errorMessage = 'Kayıt sırasında beklenmeyen bir hata oluştu.';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setLoading(true);
      console.log('👋 Logging out...');

      await authService.logout();
      console.log('✅ Logout successful');

      clearAllFilters();
    } catch (error) {
      console.error('🚨 Logout error:', error);
    } finally {
      setIsAuthenticated(false);
      setUser(null);
      setError(null);
      setLoading(false);
    }
  };

  // Clear all filter and page state data from localStorage
  const clearAllFilters = () => {
    const keysToRemove = Object.keys(localStorage).filter(key =>
      key.endsWith('Filters') ||
      key.endsWith('PageState') ||
      key.endsWith('Settings') ||
      key.includes('selectedItems') ||
      key.includes('sortBy') ||
      key.includes('sortOrder') ||
      key.includes('pageSize') ||
      key.includes('currentPage') ||
      key.includes('tdp_selectedWorkId') ||
      key.includes('tdp_selectedGroupIds')
    );

    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
      console.log('🧹 Cleared localStorage key:', key);
    });

    console.log(`🧹 Cleared ${keysToRemove.length} filter/state keys from localStorage`);
  };

  const refreshToken = async () => {
    try {
      console.log('🔄 Refreshing token...');
      const result = await authService.refreshToken();

      if (result.success) {
        console.log('✅ Token refresh successful');
        return true;
      } else {
        console.log('❌ Token refresh failed:', result.error);
        await logout();
        return false;
      }
    } catch (error) {
      console.error('🚨 Token refresh error:', error);
      await logout();
      return false;
    }
  };

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
    console.log('👤 User updated:', updatedUser);
  };

  const clearError = () => {
    setError(null);
  };

  // Debug info for development
  if (process.env.NODE_ENV === 'development') {
    console.log('🔧 Auth Context Debug:', {
      isAuthenticated,
      user: user?.username || user?.email || 'No user',
      loading,
      error,
      apiUrl: process.env.REACT_APP_API_BASE_URL
    });
  }

  const value = {
    // State
    isAuthenticated,
    user,
    loading,
    error,

    // Actions
    login,
    register,
    logout,
    refreshToken,
    updateUser,
    clearError,

    // Helpers
    isTokenExpired: authService.isTokenExpired,
    getToken: authService.getToken
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};