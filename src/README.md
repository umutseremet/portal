# Vervo Portal

Modern, tam özellikli admin panel uygulaması. React frontend ve .NET Core backend ile geliştirilmiştir.

![Vervo Portal](https://img.shields.io/badge/version-1.0.0-blue)
![React](https://img.shields.io/badge/React-18.2.0-blue)
![.NET](https://img.shields.io/badge/.NET-8.0-purple)
![Bootstrap](https://img.shields.io/badge/Bootstrap-5.3.0-purple)

## 🎯 Özellikler

### Frontend
- ✅ **Modern UI/UX** - Acara temasından esinlenen responsive tasarım
- ✅ **Authentication System** - JWT tabanlı güvenli giriş sistemi
- ✅ **Dashboard** - İstatistikler, grafikler ve genel bakış
- ✅ **Üretim Planlama** - Sipariş yönetimi ve üretim takibi
- ✅ **Ziyaretçi Yönetimi** - Visitor tracking ve reporting
- ✅ **React Router** - SPA (Single Page Application) yapısı
- ✅ **Context API** - Global state yönetimi
- ✅ **Custom Hooks** - Yeniden kullanılabilir logic

### Backend
- ✅ **RESTful API** - .NET 8.0 Web API
- ✅ **JWT Authentication** - Token tabanlı güvenlik
- ✅ **Entity Framework Core** - SQL Server veritabanı
- ✅ **Redmine Integration** - Redmine API entegrasyonu
- ✅ **Swagger Documentation** - API dokümantasyonu
- ✅ **CORS Support** - Cross-origin istekleri
- ✅ **Structured Logging** - Kapsamlı log yönetimi

## 🏗️ Proje Yapısı

```
vervo-portal/
├── src/
│   ├── frontend/                 # React Frontend
│   │   ├── public/
│   │   ├── src/
│   │   │   ├── components/       # React bileşenleri
│   │   │   │   ├── Auth/         # Authentication bileşenleri
│   │   │   │   ├── Dashboard/    # Dashboard bileşenleri
│   │   │   │   ├── Layout/       # Layout bileşenleri
│   │   │   │   └── Production/   # Üretim bileşenleri
│   │   │   ├── contexts/         # React Context API
│   │   │   ├── hooks/            # Custom React Hooks
│   │   │   ├── pages/            # Sayfa bileşenleri
│   │   │   ├── services/         # API servisleri
│   │   │   └── utils/            # Yardımcı fonksiyonlar
│   │   ├── package.json
│   │   └── README.md
│   └── backend/                  # .NET Core Backend
│       ├── API/
│       │   ├── Controllers/      # API Controller'ları
│       │   ├── Data/            # Entity Framework Context
│       │   ├── Models/          # Data modelleri
│       │   ├── Services/        # Business Logic servisleri
│       │   ├── Program.cs       # Uygulama giriş noktası
│       │   └── API.csproj
│       ├── backend.sln          # Solution dosyası
│       └── .gitignore
├── .gitignore
└── README.md
```

## 🚀 Kurulum

### Gereksinimler

**Frontend:**
- Node.js (v16 veya üzeri)
- npm veya yarn package manager

**Backend:**
- .NET 8.0 SDK
- SQL Server (LocalDB veya Full)
- Visual Studio 2022 / VS Code (önerilen)

### Kurulum Adımları

#### 1. Repository'yi Klonlayın
```bash
git clone <repository-url>
cd vervo-portal
```

#### 2. Backend Kurulumu
```bash
cd src/backend/API

# NuGet paketlerini geri yükle
dotnet restore

# Veritabanını oluştur (Migration)
dotnet ef database update

# Backend'i çalıştır
dotnet run
```

Backend varsayılan olarak `https://localhost:7123` portunda çalışacaktır.

#### 3. Frontend Kurulumu
```bash
cd src/frontend

# Bağımlılıkları yükle
npm install

# Frontend'i çalıştır
npm start
```

Frontend varsayılan olarak `http://localhost:3000` portunda çalışacaktır.

#### 4. Tarayıcıda Açın
```
Frontend: http://localhost:3000
Backend API: https://localhost:7123/swagger
```

## 🔐 Giriş Bilgileri

**Demo hesabı:**
- **Email:** admin@admin.com
- **Şifre:** admin123

## 🎨 Tema ve Tasarım

### Renk Şeması (Acara Theme)
- **Primary Color:** #FF6B6B (Coral Red)
- **Secondary Color:** #FF8E53 (Orange)
- **Success Color:** #28a745 (Green)
- **Warning Color:** #ffc107 (Yellow)
- **Info Color:** #17a2b8 (Teal)
- **Danger Color:** #dc3545 (Red)

### Responsive Breakpoints
- **Mobile:** < 768px
- **Tablet:** 768px - 992px  
- **Desktop:** > 992px

## 🛠️ Kullanılan Teknolojiler

### Frontend Stack
| Teknoloji | Versiyon | Açıklama |
|-----------|----------|----------|
| React | 18.2.0 | UI Library |
| React Router DOM | 6.8.1 | Routing |
| Bootstrap | 5.3.0 | CSS Framework |
| Bootstrap Icons | 1.10.0 | Icon Set |
| Context API | - | State Management |

### Backend Stack  
| Teknoloji | Versiyon | Açıklama |
|-----------|----------|----------|
| .NET Core | 8.0 | Web API Framework |
| Entity Framework Core | 8.0.1 | ORM |
| SQL Server | - | Database |
| JWT Bearer | 8.0.1 | Authentication |
| Swashbuckle | 6.5.0 | API Documentation |

## 📊 API Endpoints

### Authentication
```
POST /api/Auth/login          # Kullanıcı girişi
POST /api/Auth/register       # Kullanıcı kaydı
POST /api/Auth/refresh        # Token yenileme
```

### Time Entries (Redmine Integration)
```
POST /api/TimeEntries/list           # Zaman kayıtları listesi
POST /api/TimeEntries/recent         # Son aktiviteler
POST /api/TimeEntries/project        # Proje zaman kayıtları
```

### Visitors Management
```
GET    /api/Visitors                 # Ziyaretçi listesi (filtreleme ile)
POST   /api/Visitors                 # Yeni ziyaretçi ekleme
GET    /api/Visitors/{id}            # Ziyaretçi detayı
PUT    /api/Visitors/{id}            # Ziyaretçi güncelleme
DELETE /api/Visitors/{id}            # Ziyaretçi silme
GET    /api/Visitors/stats           # Ziyaretçi istatistikleri
```

### API Dokümantasyonu
Swagger UI: `https://localhost:7123/swagger`

## 🗄️ Veritabanı

### Visitors Tablosu
```sql
CREATE TABLE Visitors (
    Id int IDENTITY(1,1) PRIMARY KEY,
    Date datetime2 NOT NULL,
    Company nvarchar(100) NOT NULL,
    VisitorName nvarchar(255) NOT NULL,
    Description nvarchar(500) NULL,
    CreatedAt datetime2 NOT NULL DEFAULT GETDATE(),
    UpdatedAt datetime2 NULL
);
```

### Entity Framework Migrations
```bash
# Yeni migration oluştur
dotnet ef migrations add MigrationName

# Veritabanını güncelle
dotnet ef database update

# Migration geri al
dotnet ef database update PreviousMigrationName
```

## 🔒 Güvenlik

### Frontend Güvenlik
- **Route Protection:** Giriş yapmayan kullanıcılar korumalı sayfalara erişemez
- **Token Storage:** JWT token'lar localStorage'da güvenli şekilde saklanır
- **Auto Logout:** Token süresi dolduğunda otomatik çıkış
- **CSRF Protection:** Form güvenliği

### Backend Güvenlik
- **JWT Authentication:** Token tabanlı kimlik doğrulama
- **CORS Policy:** Cross-origin istekleri kontrolü
- **Input Validation:** Model validation ile girdi kontrolleri
- **Error Handling:** Güvenli hata mesajları
- **HTTPS:** SSL/TLS şifreleme

## 📈 Performans

### Frontend Optimizasyonları
- **Lazy Loading:** Component bazlı kod bölünmesi
- **Memoization:** Gereksiz re-render'ları önleme
- **Bundle Optimization:** Webpack optimize edilmiş build
- **Image Optimization:** Optimized asset loading

### Backend Optimizasyonları
- **Async/Await:** Non-blocking operations
- **Entity Framework:** Efficient queries
- **Caching:** Response caching strategies
- **Connection Pooling:** Database connection optimization

## 🧪 Test

### Frontend Tests
```bash
# Test çalıştırma
npm test

# Coverage raporu
npm test -- --coverage

# Test watch mode
npm test -- --watch
```

### Backend Tests
```bash
# Unit testler çalıştır
dotnet test

# Coverage raporu ile
dotnet test --collect:"XPlat Code Coverage"
```

## 🚢 Production Deployment

### Frontend Build
```bash
# Production build
npm run build

# Build dosyalarını analiz et
npm run analyze

# Build dosyalarını servis et
npx serve -s build
```

### Backend Deployment
```bash
# Release build
dotnet build -c Release

# Publish
dotnet publish -c Release -o ./publish

# IIS deployment (örnek)
# Build dosyalarını IIS wwwroot'a kopyala
```

### Environment Variables
```bash
# Frontend (.env)
REACT_APP_API_URL=https://your-api.com/api
REACT_APP_VERSION=1.0.0

# Backend (appsettings.json)
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=...;Database=...;"
  },
  "JwtSettings": {
    "Secret": "your-secret-key",
    "Issuer": "VervoPortal",
    "Audience": "VervoPortalUsers",
    "ExpirationInMinutes": 60
  },
  "RedmineSettings": {
    "BaseUrl": "https://your-redmine.com",
    "ApiKey": "your-api-key"
  }
}
```

## 🌐 Tarayıcı Desteği

- **Chrome** (son 2 versiyon)
- **Firefox** (son 2 versiyon)
- **Safari** (son 2 versiyon)
- **Edge** (son 2 versiyon)

## 📋 TODO Listesi

### Frontend
- [ ] Dark mode desteği
- [ ] Multi-language support (i18n)
- [ ] Real-time notifications (SignalR)
- [ ] Advanced filtering ve search
- [ ] Export functionality (Excel, PDF)
- [ ] PWA desteği
- [ ] Unit test coverage artırma

### Backend
- [ ] Redis cache implementation
- [ ] Background jobs (Hangfire)
- [ ] API rate limiting
- [ ] Health checks
- [ ] Docker containerization
- [ ] Microservices architecture
- [ ] GraphQL endpoint'leri

## 🐛 Bilinen Sorunlar

1. **IE11 Desteği:** Modern JavaScript features kullanıldığı için IE11 desteklenmiyor
2. **Mobile Safari:** iOS Safari'de bazı CSS flexbox sorunları olabilir
3. **CORS Development:** Development'ta CORS policy ayarları gerekebilir

## 🤝 Katkıda Bulunma

1. **Fork yapın** (`git fork`)
2. **Feature branch oluşturun** (`git checkout -b feature/AmazingFeature`)
3. **Değişiklikleri commit edin** (`git commit -m 'Add some AmazingFeature'`)
4. **Branch'i push edin** (`git push origin feature/AmazingFeature`)
5. **Pull Request açın**

### Coding Standards
- **Frontend:** ESLint + Prettier configuration
- **Backend:** Microsoft .NET coding standards
- **Git:** Conventional commits format

## 📝 Lisans

Bu proje MIT lisansı ile lisanslanmıştır. Detaylar için [LICENSE](LICENSE) dosyasına bakın.

## 📞 İletişim ve Destek

- **Email:** admin@vervo.com
- **Proje URL:** https://github.com/your-username/vervo-portal
- **Issues:** https://github.com/your-username/vervo-portal/issues

## 🙏 Teşekkürler

Bu projeyi mümkün kılan harika açık kaynak projelerine teşekkürler:

- [React](https://reactjs.org/) - Facebook Open Source
- [Bootstrap](https://getbootstrap.com/) - Twitter Bootstrap Team  
- [.NET Core](https://docs.microsoft.com/en-us/dotnet/) - Microsoft
- [Entity Framework Core](https://docs.microsoft.com/en-us/ef/) - Microsoft
- [Acara Theme](https://acara-tau.vercel.app/) - Design Inspiration

---

**Made with ❤️ by Vervo Team**