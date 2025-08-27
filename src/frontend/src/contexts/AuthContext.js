import React, { createContext, useContext, useState, useEffect } from 'react';

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

  useEffect(() => {
    // Check if user is already logged in
    const token = localStorage.getItem('authToken');
    const savedUser = localStorage.getItem('user');
    
    if (token && savedUser) {
      setIsAuthenticated(true);
      setUser(JSON.parse(savedUser));
    }
    
    setLoading(false);
  }, []);

  const login = async (credentials) => {
    try {
      // Simulate API call
      if (credentials.email === 'admin@admin.com' && credentials.password === 'admin123') {
       const userData = {
  id: 1,
  name: 'Admin User',
  email: credentials.email,
  role: 'admin',
  avatar: 'https://ui-avatars.com/api/?name=Admin%20User&size=40&background=FF6B6B&color=ffffff&bold=true'
};
        
        const token = 'jwt-token-' + Date.now();
        
        localStorage.setItem('authToken', token);
        localStorage.setItem('user', JSON.stringify(userData));
        
        setIsAuthenticated(true);
        setUser(userData);
        
        return { success: true, user: userData };
      } else {
        return { success: false, error: 'Geçersiz email veya şifre' };
      }
    } catch (error) {
      return { success: false, error: 'Giriş sırasında bir hata oluştu' };
    }
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    setIsAuthenticated(false);
    setUser(null);
  };

  const value = {
    isAuthenticated,
    user,
    loading,
    login,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};