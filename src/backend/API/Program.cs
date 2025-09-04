using API.Data;
using API.Services; // NEW - Import for VehicleLogService
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
        Description = "Vervo Portal API - Visitor Management System and Vehicle Tracking",
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

// Add HttpClient for Redmine - EXISTING
builder.Services.AddHttpClient<RedmineService>();

// NEW - Add VehicleLogService for Vehicle Management functionality
builder.Services.AddScoped<IVehicleLogService, VehicleLogService>();

// Add Entity Framework Core - EXISTING (enhanced)
builder.Services.AddDbContext<ApplicationDbContext>(options =>
{
    var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
    options.UseSqlServer(connectionString, sqlOptions =>
    {
        sqlOptions.CommandTimeout(30); // 30 second timeout
        sqlOptions.EnableRetryOnFailure(maxRetryCount: 3, maxRetryDelay: TimeSpan.FromSeconds(5), errorNumbersToAdd: null);
    });

    // Detailed logging in development environment
    if (builder.Environment.IsDevelopment())
    {
        options.EnableSensitiveDataLogging();
        options.EnableDetailedErrors();
    }
});

// Add JWT Authentication - EXISTING
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

// Add CORS - EXISTING (enhanced)
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        // Allow all origins in development
        if (builder.Environment.IsDevelopment())
        {
            policy.AllowAnyOrigin()
                  .AllowAnyHeader()
                  .AllowAnyMethod();
        }
        else
        {
            // Only specific origins in production
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

// Add Logging - EXISTING
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

// Database Migration and Seed - EXISTING (enhanced for Vehicle Management)
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    try
    {
        var context = services.GetRequiredService<ApplicationDbContext>();
        var logger = services.GetRequiredService<ILogger<Program>>();

        logger.LogInformation("Checking database connection...");

        // Check if database exists
        if (context.Database.CanConnect())
        {
            logger.LogInformation("Database connection successful");

            // Apply migrations if any
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

            // NEW - Verify Vehicle Management tables exist
            try
            {
                var vehicleCount = await context.Vehicles.CountAsync();
                var logCount = await context.VehicleLogs.CountAsync();
                logger.LogInformation("Vehicle Management tables verified - Vehicles: {VehicleCount}, Logs: {LogCount}", vehicleCount, logCount);
            }
            catch (Exception ex)
            {
                logger.LogWarning(ex, "Vehicle Management tables not found - migration may be needed");
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

        // Throw error in development, continue in production
        if (app.Environment.IsDevelopment())
        {
            throw;
        }
    }
}

// Configure pipeline - EXISTING
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "Vervo Portal API V1");
        c.RoutePrefix = "swagger"; // Open Swagger at /swagger
    });
}

app.UseHttpsRedirection();

// CORS middleware should run before other middlewares
app.UseCors("AllowFrontend");

app.UseAuthentication();
app.UseAuthorization();

// Request logging middleware - EXISTING
app.Use(async (context, next) =>
{
    var logger = context.RequestServices.GetRequiredService<ILogger<Program>>();

    // Request start
    var startTime = DateTime.UtcNow;
    logger.LogInformation("HTTP {Method} {Path} started at {StartTime}",
        context.Request.Method, context.Request.Path, startTime);

    await next();

    // Request end
    var duration = DateTime.UtcNow - startTime;
    logger.LogInformation("HTTP {Method} {Path} completed in {Duration}ms with status {StatusCode}",
        context.Request.Method, context.Request.Path, duration.TotalMilliseconds, context.Response.StatusCode);
});

app.MapControllers();

// Health check endpoint - EXISTING (enhanced)
app.MapGet("/", () => new {
    Status = "OK",
    Message = "Vervo Portal API is running",
    Version = "1.0.0",
    Environment = app.Environment.EnvironmentName,
    Timestamp = DateTime.UtcNow,
    SwaggerUrl = app.Environment.IsDevelopment() ? "/swagger" : null,
    Features = new[] { "Visitor Management", "Vehicle Management", "Redmine Integration", "JWT Authentication" }
});

app.MapGet("/health", () => new {
    Status = "Healthy",
    Timestamp = DateTime.UtcNow
});

// Configuration test endpoint - EXISTING
app.MapGet("/config", (IConfiguration config) => new {
    RedmineBaseUrl = config["RedmineSettings:BaseUrl"] ?? config["Redmine:BaseUrl"],
    RedmineApiKey = !string.IsNullOrEmpty(config["RedmineSettings:ApiKey"]) ? "Configured" : "Not configured",
    ConnectionString = !string.IsNullOrEmpty(config.GetConnectionString("DefaultConnection")) ? "Configured" : "Not configured",
    Environment = app.Environment.EnvironmentName,
    JwtSecret = !string.IsNullOrEmpty(config["JwtSettings:Secret"]) ? "Configured" : "Not configured"
});

// NEW - Vehicle Management API endpoints quick test
app.MapGet("/api/test/vehicles", async (ApplicationDbContext context) => 
{
    try 
    {
        var count = await context.Vehicles.CountAsync();
        return Results.Ok(new { 
            Message = "Vehicle Management API is working", 
            VehicleCount = count,
            Timestamp = DateTime.UtcNow 
        });
    }
    catch (Exception ex)
    {
        return Results.Problem($"Vehicle Management API test failed: {ex.Message}");
    }
}).RequireAuthorization();

// Startup message - EXISTING (enhanced)
app.Logger.LogInformation("🚀 Vervo Portal API starting...");
app.Logger.LogInformation("📝 Swagger UI available at: {SwaggerUrl}",
    app.Environment.IsDevelopment() ? "https://localhost:5154/swagger" : "Not available in production");
app.Logger.LogInformation("🚗 Vehicle Management API endpoints: /api/vehicles");

app.Run();