// src/frontend/src/components/Auth/ProtectedRoute.js

import React from 'react';
import { Navigate } from 'react-router-dom';
import permissionService from '../../services/permissionService';

/**
 * Protected Route Component
 * Yetki kontrolü ile sayfa erişimini sınırlandırır
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

  // Yetki kontrolü geçti, children'ı render et
  return children;
};

export default ProtectedRoute;