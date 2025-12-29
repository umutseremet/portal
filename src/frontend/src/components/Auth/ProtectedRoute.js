// src/frontend/src/components/Auth/ProtectedRoute.js

import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import permissionService from '../../services/permissionService';

/**
 * Protected Route Component
 * ✅ 1. ÖNCE login kontrolü yapar
 * ✅ 2. SONRA yetki kontrolü yapar
 * 
 * Kullanım:
 * <ProtectedRoute permission="yetki_kullanici_data_cam_hazirlama">
 *   <YourComponent />
 * </ProtectedRoute>
 * 
 * veya
 * 
 * <ProtectedRoute requireAdmin={true}>
 *   <AdminOnlyComponent />
 * </ProtectedRoute>
 */
const ProtectedRoute = ({ 
  children, 
  permission = null, 
  permissions = null, // Birden fazla yetki için (OR mantığı)
  requireAll = false, // true ise tüm yetkiler gerekli (AND mantığı)
  requireAdmin = false,
  redirectTo = '/dashboard' 
}) => {
  
  const { isAuthenticated, loading } = useAuth();

  // ============================================================================
  // 1️⃣ AUTHENTICATION CHECK - EN ÖNEMLİ KONTROL
  // ============================================================================
  
  // Loading durumunda bekle
  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Yükleniyor...</span>
        </div>
      </div>
    );
  }

  // Login olmamışsa LOGIN sayfasına yönlendir
  if (!isAuthenticated) {
    console.warn('🚫 Access denied: User not authenticated - redirecting to login');
    return <Navigate to="/login" replace />;
  }

  // ============================================================================
  // 2️⃣ AUTHORIZATION CHECK - Yetki Kontrolü
  // ============================================================================
  
  // Admin kontrolü
  if (requireAdmin && !permissionService.isAdmin()) {
    console.warn('🚫 Access denied: Admin permission required');
    return <Navigate to={redirectTo} replace />;
  }

  // Tekil yetki kontrolü
  if (permission && !permissionService.hasPermission(permission)) {
    console.warn(`🚫 Access denied: Missing permission ${permission}`);
    return <Navigate to={redirectTo} replace />;
  }

  // Çoklu yetki kontrolü
  if (permissions && Array.isArray(permissions) && permissions.length > 0) {
    let hasAccess = false;

    if (requireAll) {
      // Tüm yetkiler gerekli (AND mantığı)
      hasAccess = permissionService.hasAllPermissions(permissions);
    } else {
      // En az bir yetki yeterli (OR mantığı)
      hasAccess = permissionService.hasAnyPermission(permissions);
    }

    if (!hasAccess) {
      const logic = requireAll ? 'all of' : 'any of';
      console.warn(`🚫 Access denied: Missing ${logic} permissions:`, permissions);
      return <Navigate to={redirectTo} replace />;
    }
  }

  // ============================================================================
  // 3️⃣ SUCCESS - Hem login hem yetki kontrolü geçti
  // ============================================================================
  return children;
};

export default ProtectedRoute;