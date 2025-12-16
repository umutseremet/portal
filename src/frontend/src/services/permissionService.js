// src/frontend/src/services/permissionService.js

/**
 * Permission Service
 * Kullanıcı yetkilerini kontrol eden merkezi servis
 */
class PermissionService {
  
  /**
   * Kullanıcının yetkilerini localStorage'dan al
   * @returns {Array} Kullanıcı yetkileri dizisi
   */
  getUserPermissions() {
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        return user.permissions || [];
      }
    } catch (error) {
      console.error('Error getting user permissions:', error);
    }
    return [];
  }

  /**
   * Kullanıcının admin olup olmadığını kontrol et
   * Redmine'da admin yetkisi kontrolü
   * @returns {boolean}
   */
  isAdmin() {
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        // Redmine'da admin yetkisi kontrolü
        return user.isAdmin === true || user.admin === true;
      }
    } catch (error) {
      console.error('Error checking admin status:', error);
    }
    return false;
  }

  /**
   * Kullanıcı bilgilerini al
   * @returns {Object|null}
   */
  getCurrentUser() {
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        return JSON.parse(userStr);
      }
    } catch (error) {
      console.error('Error getting current user:', error);
    }
    return null;
  }

  /**
   * Belirli bir yetkinin olup olmadığını kontrol et
   * Admin kullanıcılar tüm yetkilere sahiptir
   * @param {string} permissionKey - Kontrol edilecek yetki anahtarı (örn: 'yetki_kullanici_data_cam_hazirlama')
   * @returns {boolean}
   */
  hasPermission(permissionKey) {
    // Admin ise tüm yetkilere sahiptir
    if (this.isAdmin()) {
      console.log(`✅ Admin user has permission: ${permissionKey}`);
      return true;
    }

    const permissions = this.getUserPermissions();
    const hasPermission = permissions.some(p => {
      // Key'lerin eşleşmesini ve value'nun '1' olmasını kontrol et
      return p.key === permissionKey && p.value === '1';
    });

    if (hasPermission) {
      console.log(`✅ User has permission: ${permissionKey}`);
    } else {
      console.log(`❌ User does NOT have permission: ${permissionKey}`);
    }

    return hasPermission;
  }

  /**
   * Birden fazla yetkiden en az birinin olup olmadığını kontrol et (OR mantığı)
   * @param {string[]} permissionKeys - Kontrol edilecek yetki anahtarları
   * @returns {boolean}
   */
  hasAnyPermission(permissionKeys) {
    if (!Array.isArray(permissionKeys) || permissionKeys.length === 0) {
      return false;
    }

    // Admin ise tüm yetkilere sahiptir
    if (this.isAdmin()) {
      console.log(`✅ Admin user has any of permissions:`, permissionKeys);
      return true;
    }

    const hasAny = permissionKeys.some(key => this.hasPermission(key));
    
    if (hasAny) {
      console.log(`✅ User has at least one permission from:`, permissionKeys);
    } else {
      console.log(`❌ User does NOT have any permission from:`, permissionKeys);
    }

    return hasAny;
  }

  /**
   * Tüm yetkilerin olup olmadığını kontrol et (AND mantığı)
   * @param {string[]} permissionKeys - Kontrol edilecek yetki anahtarları
   * @returns {boolean}
   */
  hasAllPermissions(permissionKeys) {
    if (!Array.isArray(permissionKeys) || permissionKeys.length === 0) {
      return false;
    }

    // Admin ise tüm yetkilere sahiptir
    if (this.isAdmin()) {
      console.log(`✅ Admin user has all permissions:`, permissionKeys);
      return true;
    }

    const hasAll = permissionKeys.every(key => this.hasPermission(key));
    
    if (hasAll) {
      console.log(`✅ User has all permissions:`, permissionKeys);
    } else {
      console.log(`❌ User does NOT have all permissions:`, permissionKeys);
    }

    return hasAll;
  }

  /**
   * Yetki listesini konsola yazdır (debug amaçlı)
   */
  debugPermissions() {
    const user = this.getCurrentUser();
    const isAdmin = this.isAdmin();
    const permissions = this.getUserPermissions();

    console.group('🔐 Permission Debug Info');
    console.log('User:', user?.login || user?.username || 'Unknown');
    console.log('Is Admin:', isAdmin);
    console.log('Permissions:', permissions);
    console.groupEnd();
  }

  /**
   * Yetki anahtarlarının listesi (referans için)
   */
  static PERMISSIONS = {
    HAFTALIK_URETIM_RAPORU: 'yetki_kullanici_haftalik_uretim_raporu',
    DATA_CAM_HAZIRLAMA: 'yetki_kullanici_data_cam_hazirlama',
    URUN_GUNCELLE: 'yetki_kullanici_urun_guncelle',
    BOM_LISTESI_AKTARIM: 'yetki_kullanici_bom_listesi_aktarim',
    ARAC_BILGILERI: 'yetki_arac_bilgileri'
  };
}

// Singleton instance oluştur
const permissionService = new PermissionService();

// Export
export default permissionService;
export { PermissionService };