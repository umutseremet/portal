// src/frontend/src/utils/excelExport.js
// Frontend'de direkt Excel export işlemi için yardımcı fonksiyonlar

/**
 * Export vehicles to Excel using only frontend (no backend needed)
 * Uses XLSX library (SheetJS)
 */

/**
 * Export vehicles array to Excel file
 * @param {Array} vehicles - Araç listesi
 * @param {string} filename - Dosya adı (opsiyonel)
 */
export const exportVehiclesToExcel = (vehicles, filename = 'Araclar') => {
  // SheetJS/xlsx kütüphanesi import edilmelidir
  // npm install xlsx
  
  if (!vehicles || vehicles.length === 0) {
    alert('Dışa aktarılacak veri bulunamadı!');
    return;
  }

  try {
    // Excel satırları için data hazırla
    const excelData = vehicles.map(vehicle => ({
      'Plaka': vehicle.licensePlate || '',
      'Marka': vehicle.brand || '',
      'Model': vehicle.model || '',
      'Yıl': vehicle.year || '',
      'Renk': vehicle.color || '',
      'VIN': vehicle.vin || '',
      'Şirket': vehicle.companyName || '',
      'Sahiplik Tipi': getOwnershipTypeText(vehicle.ownershipType),
      'Atanan Kullanıcı': vehicle.assignedUserName || '',
      'Telefon': vehicle.assignedUserPhone || '',
      'Konum': vehicle.location || '',
      'Muayene Tarihi': formatDate(vehicle.inspectionDate),
      'Sigorta': vehicle.insurance || '',
      'Sigorta Bitiş': formatDate(vehicle.insuranceExpiryDate),
      'Son Servis': formatDate(vehicle.lastServiceDate),
      'Kilometre': vehicle.currentMileage || '',
      'Yakıt Tüketimi': vehicle.fuelConsumption || '',
      'Lastik Durumu': getTireConditionText(vehicle.tireCondition),
      'Notlar': vehicle.notes || '',
      'Kayıt Tarihi': formatDateTime(vehicle.createdAt),
      'Güncelleme': formatDateTime(vehicle.updatedAt)
    }));

    // XLSX kullanarak export et
    const XLSX = window.XLSX;
    if (!XLSX) {
      console.error('XLSX library not loaded');
      alert('Excel kütüphanesi yüklenmedi. Lütfen sayfayı yenileyin.');
      return;
    }

    // Worksheet oluştur
    const worksheet = XLSX.utils.json_to_sheet(excelData);

    // Kolon genişliklerini ayarla
    const columnWidths = [
      { wch: 12 }, // Plaka
      { wch: 15 }, // Marka
      { wch: 15 }, // Model
      { wch: 8 },  // Yıl
      { wch: 10 }, // Renk
      { wch: 20 }, // VIN
      { wch: 25 }, // Şirket
      { wch: 12 }, // Sahiplik
      { wch: 20 }, // Kullanıcı
      { wch: 15 }, // Telefon
      { wch: 15 }, // Konum
      { wch: 12 }, // Muayene
      { wch: 20 }, // Sigorta
      { wch: 12 }, // Sigorta Bitiş
      { wch: 12 }, // Son Servis
      { wch: 12 }, // Kilometre
      { wch: 12 }, // Yakıt Tüketimi
      { wch: 15 }, // Lastik
      { wch: 30 }, // Notlar
      { wch: 18 }, // Kayıt
      { wch: 18 }  // Güncelleme
    ];
    worksheet['!cols'] = columnWidths;

    // Workbook oluştur
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Araçlar');

    // Dosya adı oluştur
    const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const fullFilename = `${filename}_${timestamp}.xlsx`;

    // Excel dosyasını indir
    XLSX.writeFile(workbook, fullFilename);

    console.log(`✅ Excel export successful: ${fullFilename}`);
    return true;
  } catch (error) {
    console.error('❌ Excel export error:', error);
    alert('Excel dışa aktarma sırasında hata oluştu: ' + error.message);
    return false;
  }
};

/**
 * Export vehicles to CSV (lighter alternative)
 */
export const exportVehiclesToCSV = (vehicles, filename = 'Araclar') => {
  if (!vehicles || vehicles.length === 0) {
    alert('Dışa aktarılacak veri bulunamadı!');
    return;
  }

  try {
    // CSV başlık satırı
    const headers = [
      'Plaka', 'Marka', 'Model', 'Yıl', 'Renk', 'VIN', 'Şirket', 
      'Sahiplik Tipi', 'Atanan Kullanıcı', 'Telefon', 'Konum',
      'Muayene Tarihi', 'Sigorta', 'Sigorta Bitiş', 'Son Servis',
      'Kilometre', 'Yakıt Tüketimi', 'Lastik Durumu', 'Notlar',
      'Kayıt Tarihi', 'Güncelleme'
    ];

    // CSV data satırları
    const rows = vehicles.map(vehicle => [
      vehicle.licensePlate || '',
      vehicle.brand || '',
      vehicle.model || '',
      vehicle.year || '',
      vehicle.color || '',
      vehicle.vin || '',
      vehicle.companyName || '',
      getOwnershipTypeText(vehicle.ownershipType),
      vehicle.assignedUserName || '',
      vehicle.assignedUserPhone || '',
      vehicle.location || '',
      formatDate(vehicle.inspectionDate),
      vehicle.insurance || '',
      formatDate(vehicle.insuranceExpiryDate),
      formatDate(vehicle.lastServiceDate),
      vehicle.currentMileage || '',
      vehicle.fuelConsumption || '',
      getTireConditionText(vehicle.tireCondition),
      vehicle.notes || '',
      formatDateTime(vehicle.createdAt),
      formatDateTime(vehicle.updatedAt)
    ]);

    // CSV string oluştur
    const csvContent = [
      headers.map(h => `"${h}"`).join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    // BOM ekle (Excel Türkçe karakter desteği için)
    const BOM = '\uFEFF';
    const csvWithBOM = BOM + csvContent;

    // Blob oluştur ve indir
    const blob = new Blob([csvWithBOM], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}_${timestamp}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    console.log(`✅ CSV export successful`);
    return true;
  } catch (error) {
    console.error('❌ CSV export error:', error);
    alert('CSV dışa aktarma sırasında hata oluştu: ' + error.message);
    return false;
  }
};

// Helper functions
const getOwnershipTypeText = (type) => {
  const types = {
    'company': 'Şirket',
    'rental': 'Kiralık',
    'personal': 'Kişisel'
  };
  return types[type] || type || '';
};

const getTireConditionText = (condition) => {
  const conditions = {
    'excellent': 'Mükemmel',
    'good': 'İyi',
    'fair': 'Orta',
    'poor': 'Kötü',
    'needsReplacement': 'Değiştirilmeli'
  };
  return conditions[condition] || condition || '';
};

const formatDate = (dateString) => {
  if (!dateString) return '';
  try {
    return new Date(dateString).toLocaleDateString('tr-TR');
  } catch {
    return '';
  }
};

const formatDateTime = (dateString) => {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    return `${date.toLocaleDateString('tr-TR')} ${date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}`;
  } catch {
    return '';
  }
};

// Default export
export default {
  exportVehiclesToExcel,
  exportVehiclesToCSV
};