# Vervo Portal - Backend API

.NET 8.0 Web API uygulaması. Entity Framework Core ve SQL Server kullanarak RESTful API servisleri sağlar.

> 📖 **Ana proje dokümantasyonu için [Ana README](../../README.md) dosyasına bakın.**

## 🚀 Hızlı Başlangıç

```bash
# Bağımlılıkları geri yükle
dotnet restore

# Veritabanını oluştur/güncelle
dotnet ef database update

# Development server'ı başlat
dotnet run

# Production build
dotnet build -c Release
```

**API Base URL:** `https://localhost:7123` (Development)

## 📁 Proje Yapısı

```
API/
├── Controllers/              # API Controller sınıfları
│   ├── AuthController.cs     # Authentication endpoints
│   ├── TimeEntriesController.cs # Redmine time entries
│   └── VisitorsController.cs # Ziyaretçi yönetimi
├── Data/                     # Entity Framework
│   ├── ApplicationDbContext.cs
│   └── Entities/            # Database entity sınıfları
├── Models/                   # Request/Response modelleri
│   ├── LoginModels.cs       # Auth modelleri
│   └── VisitorModels.cs     # Ziyaretçi modelleri
├── Services/                 # Business logic servisleri
│   └── RedmineService.cs    # Redmine API entegrasyonu
├── Properties/
│   └── launchSettings.json  # Launch configuration
├── appsettings.json         # Production config
├── appsettings.Development.json # Development config
├── Program.cs               # Uygulama giriş noktası
└── API.csproj              # Proje dosyası
```

## 🔧 Konfigürasyon

### appsettings.json

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=localhost;Database=VervoPortal;Trusted_Connection=true;"
  },
  "JwtSettings": {
    "Secret": "YourSecretKeyThatIsAtLeast32CharactersLong",
    "Issuer": "VervoPortalAPI",
    "Audience": "VervoPortalClient",
    "ExpiryMinutes": 60
  },
  "RedmineSettings": {
    "BaseUrl": "http://your-redmine-server:9292/",
    "ApiKey": "your-redmine-api-key",
    "TimeoutSeconds": 30,
    "MaxRetryAttempts": 3,
    "RetryDelaySeconds": 2,
    "UseHttps": false,
    "ValidateSslCertificate": false
  },
  "DatabaseSettings": {
    "CommandTimeoutSeconds": 30,
    "EnableRetryOnFailure": true,
    "MaxRetryCount": 3,
    "MaxRetryDelay": "00:00:05"
  }
}
```

### Development Konfigürasyonu

Development ortamında ek ayarlar:
- Detaylı logging
- CORS policy daha esnek
- JWT token süresi daha uzun (120 dakika)
- Database sensitive logging aktif

## 🗄️ Veritabanı

### Entity Framework Core

**Provider:** SQL Server  
**Migrations:** Code First yaklaşım

### Ana Tablolar

#### Visitors
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

### Migration Komutları

```bash
# Yeni migration oluştur
dotnet ef migrations add MigrationName

# Veritabanını güncelle
dotnet ef database update

# Migration listesi
dotnet ef migrations list

# Migration geri al
dotnet ef database update PreviousMigrationName

# Migration script oluştur
dotnet ef migrations script
```

## 🔌 API Endpoints

### 🔐 Authentication (`/api/Auth`)

| Method | Endpoint | Description | Body |
|--------|----------|-------------|------|
| `POST` | `/login` | Kullanıcı girişi | `{username, password}` |
| `POST` | `/register` | Kullanıcı kaydı | `{username, email, password}` |
| `GET` | `/test` | Konfigürasyon testi | - |

### ⏰ Time Entries (`/api/TimeEntries`)

| Method | Endpoint | Description | Body |
|--------|----------|-------------|------|
| `POST` | `/list` | Zaman kayıtları | `{username, password, userId?, projectId?, from?, to?, limit, offset}` |
| `POST` | `/recent` | Son aktiviteler | `{username, password, userId, days?, limit?}` |
| `POST` | `/project` | Proje zaman kayıtları | `{username, password, projectId, days?, limit?}` |

### 👥 Visitors (`/api/Visitors`)

| Method | Endpoint | Description | Query Parameters |
|--------|----------|-------------|------------------|
| `GET` | `/` | Ziyaretçi listesi | `fromDate?, toDate?, company?, visitor?, page, pageSize, sortBy?, sortOrder?` |
| `POST` | `/` | Yeni ziyaretçi | Body: `{date, company, visitor, description?}` |
| `GET` | `/{id}` | Ziyaretçi detayı | - |
| `PUT` | `/{id}` | Ziyaretçi güncelle | Body: `{date, company, visitor, description?}` |
| `DELETE` | `/{id}` | Ziyaretçi sil | - |
| `GET` | `/stats` | İstatistikler | `days?` |

### 🏥 Health Check

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/` | API durumu |
| `GET` | `/health` | Health check |
| `GET` | `/config` | Configuration durumu |

## 🔒 Güvenlik

### JWT Authentication
- **Secret Key:** Minimum 32 karakter
- **Expiry:** 60 dakika (Production), 120 dakika (Development)
- **Bearer Token:** `Authorization: Bearer <token>`

### CORS Policy
```csharp
// Development
AllowedOrigins: [
  "http://localhost:3000",
  "http://localhost:3001",
  "https://localhost:3000"
]

// Production
AllowedOrigins: ["https://your-frontend-domain.com"]
```

### Input Validation
- Model validation attributes
- Required field kontrolü
- String uzunluk limitleri
- Data annotation validations

## 📊 Logging

### Log Levels (Development)
- **Debug:** Controller actions, database queries
- **Information:** HTTP requests, authentication
- **Warning:** Non-critical errors
- **Error:** Exceptions, critical errors

### Log Outputs
- **Console:** Development
- **File:** Production (opsiyonel)
- **Database:** Critical errors (opsiyonel)

### Example Log Entry
```
2024-01-15 10:30:45 [INF] HTTP POST /api/Auth/login started
2024-01-15 10:30:45 [INF] User logged in successfully: admin@admin.com
2024-01-15 10:30:45 [INF] HTTP POST /api/Auth/login completed in 245ms with status 200
```

## 🧪 Testing

### Manual Testing
```bash
# Swagger UI
https://localhost:7123/swagger

# Health check
curl https://localhost:7123/health

# Configuration test
curl https://localhost:7123/config
```

### API Test Examples

#### Authentication Test
```bash
curl -X POST https://localhost:7123/api/Auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin@admin.com",
    "password": "admin123"
  }'
```

#### Protected Endpoint Test
```bash
curl -X GET https://localhost:7123/api/Visitors \
  -H "Authorization: Bearer <your-jwt-token>" \
  -H "Content-Type: application/json"
```

## 🚢 Deployment

### IIS Deployment
```bash
# Publish
dotnet publish -c Release -o ./publish

# IIS'e kopyala
xcopy /E /Y .\publish\* C:\inetpub\wwwroot\vervo-api\
```

### Docker Deployment (Opsiyonel)
```dockerfile
FROM mcr.microsoft.com/dotnet/aspnet:8.0
WORKDIR /app
COPY ./publish .
EXPOSE 80
ENTRYPOINT ["dotnet", "API.dll"]
```

### Environment Variables
```bash
# Connection String
export ConnectionStrings__DefaultConnection="Server=...;Database=...;"

# JWT Settings
export JwtSettings__Secret="YourProductionSecretKey"

# Redmine Settings  
export RedmineSettings__BaseUrl="https://your-redmine.com"
export RedmineSettings__ApiKey="your-api-key"
```

## 📈 Performance

### Database Optimizations
- **Connection Pooling:** Entity Framework default
- **Command Timeout:** 30 seconds
- **Retry Policy:** Max 3 attempts
- **Async Operations:** All database calls

### API Optimizations
- **Pagination:** Visitors endpoint
- **Filtering:** Query parameters
- **Caching:** Response caching (opsiyonel)
- **Compression:** Response compression

## 🔧 Troubleshooting

### Common Issues

#### 1. Database Connection Error
```
SqlException: A network-related or instance-specific error occurred
```
**Solution:** 
- SQL Server running kontrolü
- Connection string doğrulaması
- Network connectivity testi

#### 2. JWT Token Error
```
401 Unauthorized
```
**Solution:**
- Token expiry kontrolü
- Secret key konfigürasyonu
- Authorization header format

#### 3. Redmine Connection Error
```
HttpRequestException: No connection could be made
```
**Solution:**
- Redmine BaseUrl kontrolü
- Network erişimi testi
- Credentials doğrulaması

### Debug Komutları

```bash
# Database connection test
dotnet ef database update --verbose

# Configuration test
curl https://localhost:7123/config

# Health check
curl https://localhost:7123/health

# Logs monitoring
tail -f logs/app-{date}.log
```

## 📦 Dependencies

### NuGet Packages
```xml
<PackageReference Include="Microsoft.AspNetCore.Authentication.JwtBearer" Version="8.0.1" />
<PackageReference Include="Microsoft.AspNetCore.OpenApi" Version="8.0.1" />
<PackageReference Include="Swashbuckle.AspNetCore" Version="6.5.0" />
<PackageReference Include="System.IdentityModel.Tokens.Jwt" Version="7.1.2" />
<PackageReference Include="Microsoft.EntityFrameworkCore" Version="8.0.1" />
<PackageReference Include="Microsoft.EntityFrameworkCore.SqlServer" Version="8.0.1" />
<PackageReference Include="Microsoft.EntityFrameworkCore.Design" Version="8.0.1" />
<PackageReference Include="Microsoft.EntityFrameworkCore.Tools" Version="8.0.1" />
```

### Framework
- **.NET:** 8.0
- **ASP.NET Core:** 8.0
- **Entity Framework Core:** 8.0.1

## 🔗 Faydalı Linkler

- [Ana Proje README](../../README.md)
- [Frontend Uygulaması](../frontend/)
- [.NET 8 Documentation](https://docs.microsoft.com/en-us/dotnet/core/whats-new/dotnet-8)
- [Entity Framework Core Documentation](https://docs.microsoft.com/en-us/ef/core/)
- [ASP.NET Core Web API](https://docs.microsoft.com/en-us/aspnet/core/web-api/)
- [Swagger/OpenAPI](https://swagger.io/specification/)

## 🚀 Next Steps

### Planned Features
- [ ] Redis caching implementation
- [ ] Background jobs (Hangfire)
- [ ] SignalR real-time updates
- [ ] API versioning
- [ ] Rate limiting
- [ ] Health checks dashboard
- [ ] Microservices migration

### Performance Improvements
- [ ] Response compression
- [ ] Output caching
- [ ] Database query optimization
- [ ] Async/await patterns
- [ ] Memory usage optimization

---

**Backend API Documentation v1.0.0**