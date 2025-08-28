using API.Data;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using System.Text.Json;

var builder = WebApplication.CreateBuilder(args);

// Add services
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        // JSON property names camelCase olsun (totalCount instead of TotalCount)
        options.JsonSerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
        options.JsonSerializerOptions.WriteIndented = true; // Development için readable JSON
    });
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new Microsoft.OpenApi.Models.OpenApiInfo
    {
        Title = "Vervo Portal API",
        Version = "v1",
        Description = "Vervo Portal API - Ziyaretçi Yönetim Sistemi",
        Contact = new Microsoft.OpenApi.Models.OpenApiContact
        {
            Name = "Vervo Portal",
            Email = "admin@vervo.com"
        }
    });

    // JWT Authentication için Swagger konfigürasyonu
    c.AddSecurityDefinition("Bearer", new Microsoft.OpenApi.Models.OpenApiSecurityScheme
    {
        Description = "JWT Authorization header using the Bearer scheme. Example: \"Authorization: Bearer {token}\"",
        Name = "Authorization",
        In = Microsoft.OpenApi.Models.ParameterLocation.Header,
        Type = Microsoft.OpenApi.Models.SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });

    c.AddSecurityRequirement(new Microsoft.OpenApi.Models.OpenApiSecurityRequirement()
    {
        {
            new Microsoft.OpenApi.Models.OpenApiSecurityScheme
            {
                Reference = new Microsoft.OpenApi.Models.OpenApiReference
                {
                    Type = Microsoft.OpenApi.Models.ReferenceType.SecurityScheme,
                    Id = "Bearer"
                },
                Scheme = "oauth2",
                Name = "Bearer",
                In = Microsoft.OpenApi.Models.ParameterLocation.Header,
            },
            new List<string>()
        }
    });
});

// Add HttpClient for Redmine - MEVCUT
builder.Services.AddHttpClient<RedmineService>();

// Add Entity Framework Core - YENİ
builder.Services.AddDbContext<ApplicationDbContext>(options =>
{
    var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
    options.UseSqlServer(connectionString, sqlOptions =>
    {
        sqlOptions.CommandTimeout(30); // 30 saniye timeout
        sqlOptions.EnableRetryOnFailure(maxRetryCount: 3, maxRetryDelay: TimeSpan.FromSeconds(5), errorNumbersToAdd: null);
    });

    // Development ortamında detaylı logging
    if (builder.Environment.IsDevelopment())
    {
        options.EnableSensitiveDataLogging();
        options.EnableDetailedErrors();
    }
});

// Add JWT Authentication - MEVCUT
var jwtKey = builder.Configuration["JwtSettings:Secret"] ?? "YourSecretKeyThatIsAtLeast32CharactersLong123456789";
var key = Encoding.ASCII.GetBytes(jwtKey);

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(key),
            ValidateIssuer = false,
            ValidateAudience = false,
            ValidateLifetime = true,
            ClockSkew = TimeSpan.Zero
        };
    });

// Add CORS - MEVCUT (güncellenmiş)
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        // Development için tüm origin'leri allow et
        if (builder.Environment.IsDevelopment())
        {
            policy.AllowAnyOrigin()
                  .AllowAnyHeader()
                  .AllowAnyMethod();
        }
        else
        {
            // Production için sadece belirli origin'ler
            policy.WithOrigins(
                      "http://localhost:3000",
                      "http://127.0.0.1:5500",
                      "http://localhost:5500"
                  )
                  .AllowAnyHeader()
                  .AllowAnyMethod()
                  .AllowCredentials();
        }
    });
});

// Add Logging - YENİ
builder.Services.AddLogging(configure =>
{
    configure.AddConsole();
    configure.AddDebug();
    if (builder.Environment.IsDevelopment())
    {
        configure.SetMinimumLevel(LogLevel.Debug);
    }
    else
    {
        configure.SetMinimumLevel(LogLevel.Information);
    }
});

var app = builder.Build();

// Database Migration ve Seed - YENİ
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    try
    {
        var context = services.GetRequiredService<ApplicationDbContext>();
        var logger = services.GetRequiredService<ILogger<Program>>();

        logger.LogInformation("Checking database connection...");

        // Database'in mevcut olup olmadığını kontrol et
        if (context.Database.CanConnect())
        {
            logger.LogInformation("Database connection successful");

            // Migration'ları uygula (eğer varsa)
            var pendingMigrations = context.Database.GetPendingMigrations();
            if (pendingMigrations.Any())
            {
                logger.LogInformation("Applying pending migrations: {Migrations}", string.Join(", ", pendingMigrations));
                context.Database.Migrate();
                logger.LogInformation("Migrations applied successfully");
            }
            else
            {
                logger.LogInformation("No pending migrations found");
            }
        }
        else
        {
            logger.LogWarning("Cannot connect to database. Please check connection string.");
        }
    }
    catch (Exception ex)
    {
        var logger = services.GetRequiredService<ILogger<Program>>();
        logger.LogError(ex, "An error occurred while initializing the database");

        // Development ortamında hata fırlat, production'da devam et
        if (app.Environment.IsDevelopment())
        {
            throw;
        }
    }
}

// Configure pipeline - MEVCUT (güncellenmiş)
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "Vervo Portal API V1");
        c.RoutePrefix = "swagger"; // Swagger'ı /swagger'da aç
    });
}

app.UseHttpsRedirection();

// CORS middleware'i diğer middleware'lerden önce çalışmalı
app.UseCors("AllowFrontend");

app.UseAuthentication();
app.UseAuthorization();

// Request logging middleware - YENİ
app.Use(async (context, next) =>
{
    var logger = context.RequestServices.GetRequiredService<ILogger<Program>>();

    // Request başlangıcı
    var startTime = DateTime.UtcNow;
    logger.LogInformation("HTTP {Method} {Path} started at {StartTime}",
        context.Request.Method, context.Request.Path, startTime);

    await next();

    // Request bitişi
    var duration = DateTime.UtcNow - startTime;
    logger.LogInformation("HTTP {Method} {Path} completed in {Duration}ms with status {StatusCode}",
        context.Request.Method, context.Request.Path, duration.TotalMilliseconds, context.Response.StatusCode);
});

app.MapControllers();

// Health check endpoint - YENİ
app.MapGet("/", () => new {
    Status = "OK",
    Message = "Vervo Portal API is running",
    Version = "1.0.0",
    Environment = app.Environment.EnvironmentName,
    Timestamp = DateTime.UtcNow,
    SwaggerUrl = app.Environment.IsDevelopment() ? "/swagger" : null
});

app.MapGet("/health", () => new {
    Status = "Healthy",
    Timestamp = DateTime.UtcNow
});

// Configuration test endpoint - YENİ
app.MapGet("/config", (IConfiguration config) => new {
    RedmineBaseUrl = config["RedmineSettings:BaseUrl"] ?? config["Redmine:BaseUrl"],
    RedmineApiKey = !string.IsNullOrEmpty(config["RedmineSettings:ApiKey"]) ? "Configured" : "Not configured",
    ConnectionString = !string.IsNullOrEmpty(config.GetConnectionString("DefaultConnection")) ? "Configured" : "Not configured",
    Environment = app.Environment.EnvironmentName,
    JwtSecret = !string.IsNullOrEmpty(config["JwtSettings:Secret"]) ? "Configured" : "Not configured"
});

// Startup mesajı
app.Logger.LogInformation("🚀 Vervo Portal API starting...");
app.Logger.LogInformation("📝 Swagger UI available at: {SwaggerUrl}",
    app.Environment.IsDevelopment() ? "https://localhost:5154/swagger" : "Not available in production");

app.Run();