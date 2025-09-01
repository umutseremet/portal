# Vervo Portal

Modern ve responsive admin panel uygulaması. React ve Bootstrap kullanılarak geliştirilmiştir.

## 🎯 Özellikler

- ✅ **Modern UI/UX** - Acara temasından esinlenen turuncu-kırmızı renk şeması
- ✅ **Responsive Design** - Mobil ve desktop uyumlu
- ✅ **Authentication System** - Güvenli giriş sistemi
- ✅ **Dashboard** - İstatistikler, grafikler ve genel bakış
- ✅ **Üretim Planlama** - Sipariş yönetimi ve üretim takibi
- ✅ **React Router** - SPA (Single Page Application) yapısı
- ✅ **Bootstrap 5** - Modern CSS framework
- ✅ **Context API** - Global state yönetimi
- ✅ **Custom Hooks** - Yeniden kullanılabilir logic
- ✅ **Hamburger Menu** - Mobil uyumlu navigasyon

## 🚀 Kurulum

### Gereksinimler

- Node.js (v16 veya üzeri)
- npm veya yarn package manager

### Adımlar

1. **Projeyi klonlayın**
   ```bash
   git clone <repository-url>
   cd admin-panel
   ```

2. **Bağımlılıkları yükleyin**
   ```bash
   npm install
   # veya
   yarn install
   ```

3. **Uygulamayı başlatın**
   ```bash
   npm start
   # veya
   yarn start
   ```

4. **Tarayıcıda açın**
   ```
   http://localhost:3000
   ```

## 🔐 Giriş Bilgileri

**Demo hesabı:**
- **Email:** admin@admin.com
- **Şifre:** admin123

## 📁 Proje Yapısı

```
src/
├── components/
│   ├── Auth/
│   │   ├── Login.js              # Giriş ekranı
│   │   └── ProtectedRoute.js     # Route koruması
│   ├── Dashboard/
│   │   ├── Chart.js              # Grafik bileşenleri
│   │   ├── Dashboard.js          # Ana dashboard bileşeni
│   │   ├── RecentEvents.js       # Son etkinlikler listesi
│   │   └── StatsCard.js          # İstatistik kartları
│   ├── Layout/
│   │   ├── Footer.js             # Footer bileşeni
│   │   ├── Header.js             # Header bileşeni
│   │   ├── Layout.js             # Ana layout wrapper
│   │   └── Sidebar.js            # Yan menü
│   └── Production/
│       ├── ProductionList.js     # Üretim listesi
│       └── ProductionPlanning.js # Üretim planlama
├── contexts/
│   ├── AuthContext.js            # Authentication context
│   └── ThemeContext.js           # Theme context
├── hooks/
│   ├── useAuth.js                # Auth hook
│   └── useLocalStorage.js        # LocalStorage hook
├── pages/
│   ├── DashboardPage.js          # Dashboard sayfası
│   └── ProductionPage.js         # Üretim sayfası
├── services/
│   ├── api.js                    # API service
│   └── authService.js            # Auth service
├── utils/
│   ├── constants.js              # Sabitler
│   └── helpers.js                # Yardımcı fonksiyonlar
├── App.css                       # Ana CSS dosyası
├── App.js                        # Ana component
├── index.css                     # Global CSS
└── index.js                      # Giriş noktası
```

## 🎨 Tema ve Renk Şeması

Proje Acara temasından esinlenmiştir:

- **Primary Color:** #FF6B6B (Coral Red)
- **Secondary Color:** #FF8E53 (Orange)
- **Success Color:** #28a745 (Green)
- **Warning Color:** #ffc107 (Yellow)
- **Info Color:** #17a2b8 (Teal)
- **Danger Color:** #dc3545 (Red)

## 📱 Responsive Breakpoints

- **Mobile:** < 768px
- **Tablet:** 768px - 992px
- **Desktop:** > 992px

## 🛠️ Kullanılan Teknolojiler

- **React** (v18.2.0) - UI library
- **React Router DOM** (v6.8.1) - Routing
- **Bootstrap** (v5.3.0) - CSS framework
- **Bootstrap Icons** (v1.10.0) - Icon set
- **Context API** - State management

## 📊 Sayfa Yapısı

### 🏠 Dashboard (/dashboard)
- Genel istatistikler (Sales, Events, Revenue, Growth)
- Best Selling donut chart
- Sales Revenue line chart
- Hızlı işlem butonları
- Son etkinlikler tablosu

### 🏭 Üretim Planlama (/production)
- Üretim istatistikleri
- Sipariş filtreleme ve arama
- Üretim siparişleri tablosu
- Kapasite takip grafikleri
- Yeni sipariş oluşturma

## 🔒 Güvenlik

- **Route Protection:** Giriş yapmayan kullanıcılar korumalı sayfalara erişemez
- **Token Based Auth:** JWT token simülasyonu
- **Auto Logout:** Oturum süresi yönetimi
- **CSRF Protection:** Form güvenliği

## 📈 Performance

- **Lazy Loading:** Component bazlı kod bölünmesi
- **Memoization:** Gereksiz re-render'ları önleme
- **Image Optimization:** Optimized image loading
- **Bundle Analysis:** webpack-bundle-analyzer ile analiz

## 🧪 Test

```bash
# Test çalıştırma
npm test

# Coverage raporu
npm test -- --coverage
```

## 🚢 Production Build

```bash
# Production build
npm run build

# Build dosyalarını servis etme
npm run analyze
```

## 🌐 Tarayıcı Desteği

- Chrome (son 2 versiyon)
- Firefox (son 2 versiyon)
- Safari (son 2 versiyon)
- Edge (son 2 versiyon)

## 📋 TODO

- [ ] Dark mode desteği
- [ ] Multi-language support (i18n)
- [ ] Real-time notifications
- [ ] Advanced filtering
- [ ] Export functionality
- [ ] Unit tests yazılması
- [ ] API entegrasyonu
- [ ] PWA desteği

## 🤝 Katkıda Bulunma

1. Fork yapın
2. Feature branch oluşturun (`git checkout -b feature/AmazingFeature`)
3. Commit yapın (`git commit -m 'Add some AmazingFeature'`)
4. Push yapın (`git push origin feature/AmazingFeature`)
5. Pull Request açın

## 📝 License

Bu proje MIT lisansı ile lisanslanmıştır. Detaylar için `LICENSE` dosyasına bakın.

## 📞 İletişim

- **Email:** developer@example.com
- **Website:** https://example.com
- **LinkedIn:** https://linkedin.com/in/developer

## 🙏 Teşekkürler

- [React](https://reactjs.org/) team
- [Bootstrap](https://getbootstrap.com/) team
- [Acara Theme](https://acara-tau.vercel.app/) inspiration

---

Made with ❤️ by [Your Name]