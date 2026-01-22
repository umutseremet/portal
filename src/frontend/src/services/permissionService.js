// src/frontend/src/services/permissionService.js

/**
 * Permission Service
 * Kullanıcı yetkilerini kontrol eden merkezi servis
 * ✅ Enumeration (çoktan seçmeli) yetki desteği eklendi
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
        const permissions = user.permissions || [];

        console.log('📋 getUserPermissions called:', {
          userFound: !!user,
          username: user.login || user.username,
          isAdmin: user.isAdmin,
          permissionsCount: permissions.length,
          permissionsSample: permissions.slice(0, 3)
        });

        return permissions;
      }
    } catch (error) {
      console.error('❌ Error getting user permissions:', error);
    }
    return [];
  }

  /**
   * Belirli bir yetkinin olup olmadığını kontrol et (geriye uyumluluk)
   * Admin kullanıcılar tüm yetkilere sahiptir
   * @param {string} permissionKey - Kontrol edilecek yetki anahtarı
   * @returns {boolean}
   */
  hasPermission(permissionKey) {
    // Admin ise tüm yetkilere sahiptir
    if (this.isAdmin()) {
      console.log(`✅ Admin user has permission: ${permissionKey}`);
      return true;
    }

    const permissions = this.getUserPermissions();
    const permission = permissions.find(p => p.key === permissionKey);
    
    if (!permission) {
      console.log(`❌ Permission key not found: ${permissionKey}`);
      return false;
    }

    // Eski sistem: value === '1' kontrolü (checkbox)
    // Yeni sistem: value !== '0' ve value !== '' ve value !== null kontrolü (enumeration)
    const hasPermission = permission.value === '1' || 
                         (permission.value && 
                          permission.value !== '0' && 
                          permission.value !== '');

    if (hasPermission) {
      console.log(`✅ User has permission: ${permissionKey}, value: ${permission.value}`);
    } else {
      console.log(`❌ User does NOT have permission: ${permissionKey}`);
    }

    return hasPermission;
  }

  /**
   * Belirli bir yetkinin enumeration değerini kontrol et
   * @param {string} permissionKey - Yetki anahtarı
   * @param {string[]} allowedValues - İzin verilen enumeration değerleri (id'ler)
   * @returns {boolean}
   */
  hasPermissionWithValue(permissionKey, allowedValues) {
    // Admin tüm yetkilere sahip
    if (this.isAdmin()) {
      console.log(`✅ Admin user has permission: ${permissionKey}`);
      return true;
    }

    const permissions = this.getUserPermissions();
    
    // Yetki anahtarını bul
    const permission = permissions.find(p => p.key === permissionKey);
    
    if (!permission) {
      console.log(`❌ Permission key not found: ${permissionKey}`);
      return false;
    }

    // Value'nun izin verilen değerlerden biri olup olmadığını kontrol et
    const hasValue = allowedValues.includes(permission.value);
    
    if (hasValue) {
      console.log(`✅ User has permission ${permissionKey} with value: ${permission.value}`);
    } else {
      console.log(`❌ User permission ${permissionKey} value ${permission.value} not in allowed: [${allowedValues.join(', ')}]`);
    }

    return hasValue;
  }

  /**
   * Logo Fatura Onay - Onaya Gönder yetkisi
   * Gerekli: "Ön Onaya Gönderim" (55) veya "Tam Yetki" (57)
   */
  canSendLogoInvoiceForApproval() {
    return this.hasPermissionWithValue(
      'yetki_kullanici_satinalma_logo_onay',
      ['55', '57'] // Ön Onaya Gönderim veya Tam Yetki
    );
  }

  /**
   * Logo Fatura Onay - Onayla yetkisi
   * Gerekli: "Onay" (56) veya "Tam Yetki" (57)
   */
  canApproveLogoInvoice() {
    return this.hasPermissionWithValue(
      'yetki_kullanici_satinalma_logo_onay',
      ['56', '57'] // Onay veya Tam Yetki
    );
  }

  /**
   * Logo Fatura Onay - Menü görünürlüğü
   * Herhangi bir yetki değeri varsa menü görünsün
   */
  canAccessLogoInvoiceMenu() {
    // Admin her zaman erişebilir
    if (this.isAdmin()) {
      return true;
    }

    const permissions = this.getUserPermissions();
    const permission = permissions.find(p => p.key === 'yetki_kullanici_satinalma_logo_onay');
    
    // Yetki varsa ve boş değilse menü görünsün
    const hasAccess = permission && 
                     permission.value && 
                     permission.value !== '0' && 
                     permission.value !== '';
    
    if (hasAccess) {
      console.log(`✅ User can access Logo Invoice menu with permission value: ${permission.value}`);
    } else {
      console.log(`❌ User cannot access Logo Invoice menu`);
    }
    
    return hasAccess;
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
   * Kullanıcının admin olup olmadığını kontrol et
   * Redmine'da admin yetkisi kontrolü
   * @returns {boolean}
   */
  isAdmin() {
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        const isAdmin = user.isAdmin === true || user.admin === true;

        if (isAdmin) {
          console.log('👑 User is ADMIN');
        }

        return isAdmin;
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
    ARAC_BILGILERI: 'yetki_kullanici_aracbilgileri',
    LOGO_FATURA_ONAY: 'yetki_kullanici_satinalma_logo_onay'
  };
}

// Singleton instance oluştur
const permissionService = new PermissionService();

// Export
export default permissionService;
export { PermissionService };