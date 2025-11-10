# Vervo Portal - Frontend

Bu klasör Vervo Portal'ın React frontend uygulamasını içerir.

> 📖 **Ana proje dokümantasyonu için [Ana README](../../README.md) dosyasına bakın.**

## 🚀 Hızlı Başlangıç

```bash
# Bağımlılıkları yükle
npm install

# Development server'ı başlat
npm start

# Production build
npm run build
```

## 📁 Frontend Yapısı

```
src/
├── components/
│   ├── Auth/                 # Authentication bileşenleri
│   ├── Dashboard/            # Dashboard bileşenleri
│   ├── Layout/               # Layout bileşenleri
│   └── Production/           # Üretim bileşenleri
├── contexts/                 # React Context API
├── hooks/                    # Custom React Hooks
├── pages/                    # Sayfa bileşenleri
├── services/                 # API servisleri
├── utils/                    # Yardımcı fonksiyonlar
├── App.js                    # Ana uygulama bileşeni
└── index.js                  # Giriş noktası
```

## 🎨 Styling

- **Framework:** Bootstrap 5.3.0
- **Icons:** Bootstrap Icons 1.10.0
- **Theme:** Acara Theme (Orange-Red Color Scheme)
- **CSS Files:** App.css, index.css

## 🔧 Available Scripts

```bash
npm start          # Development server (http://localhost:3000)
npm run build      # Production build
npm test           # Run tests
npm run lint       # ESLint check
npm run lint:fix   # ESLint auto-fix
npm run format     # Prettier format
npm run analyze    # Bundle analyzer
```

## 🌐 API Integration

Frontend, backend API ile şu base URL üzerinden iletişim kurar:
- **Development:** `http://localhost:5154/api`
- **Production:** Environment variable ile belirlenir

## 📱 Responsive Design

- **Mobile:** < 768px
- **Tablet:** 768px - 992px
- **Desktop:** > 992px

## 🔗 Faydalı Linkler

- [Ana Proje README](../../README.md)
- [Backend API Dokümantasyonu](../backend/API/)
- [React Documentation](https://reactjs.org/)
- [Bootstrap Documentation](https://getbootstrap.com/)