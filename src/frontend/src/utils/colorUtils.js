// src/frontend/src/utils/colorUtils.js

/**
 * Proje bazlı renk paleti
 */
const PROJECT_COLORS = [ 
  '#3498db', // Mavi
  '#2ecc71', // Yeşil
  '#f39c12', // Turuncu
  '#9b59b6', // Mor
  '#1abc9c', // Turkuaz
  '#e67e22', // Koyu Turuncu
  '#34495e', // Koyu Gri
  '#16a085', // Koyu Turkuaz
  '#27ae60', // Koyu Yeşil
  '#2980b9', // Koyu Mavi
  '#8e44ad', // Koyu Mor
  '#f1c40f', // Sarı
  '#95a5a6', // Açık Gri
  '#d35400', // Koyu Portakal
  '#7f8c8d', // Orta Gri
  '#2c3e50', // Lacivert
];

/**
 * Proje ID'sine göre tutarlı renk atar
 */
export const getProjectColor = (projectId) => {
  if (!projectId) return PROJECT_COLORS[0];
  
  // ProjectId'yi sayıya çevir ve color array'inde index olarak kullan
  const colorIndex = projectId % PROJECT_COLORS.length;
  return PROJECT_COLORS[colorIndex];
};

/**
 * Proje koduna göre tutarlı renk atar (alternatif metod)
 */
export const getProjectColorByCode = (projectCode) => {
  if (!projectCode) return PROJECT_COLORS[0];
  
  // String'i hash'e çevir
  let hash = 0;
  for (let i = 0; i < projectCode.length; i++) {
    hash = projectCode.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  const colorIndex = Math.abs(hash) % PROJECT_COLORS.length;
  return PROJECT_COLORS[colorIndex];
};

/**
 * Rengin açık versiyonunu döndürür (arka plan için)
 */
export const getLightColor = (hexColor, opacity = 0.15) => {
  // Hex rengi RGBA'ya çevir
  const r = parseInt(hexColor.slice(1, 3), 16);
  const g = parseInt(hexColor.slice(3, 5), 16);
  const b = parseInt(hexColor.slice(5, 7), 16);
  
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

/**
 * Tüm projeler için renk mapping'i oluşturur
 */
export const createProjectColorMap = (projects) => {
  const colorMap = {};
  
  projects.forEach(project => {
    if (project.projectId) {
      colorMap[project.projectId] = getProjectColor(project.projectId);
    }
  });
  
  return colorMap;
};

export default {
  getProjectColor,
  getProjectColorByCode,
  getLightColor,
  createProjectColorMap
};