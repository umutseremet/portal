using API.Data;
using API.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Http.Features;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using System.Text.Json;

var builder = WebApplication.CreateBuilder(args);

// Add services
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
        options.JsonSerializerOptions.PropertyNameCaseInsensitive = true;
        options.JsonSerializerOptions.WriteIndented = true;
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

builder.Services.AddHttpClient();
builder.Services.AddHttpClient<RedmineService>();
builder.Services.AddScoped<IVehicleLogService, VehicleLogService>();
builder.Services.AddScoped<BomExcelParserService>();
builder.Services.AddScoped<PermissionService>();
builder.Services.AddScoped<ArventoService>();

builder.Services.Configure<FormOptions>(options =>
{
    options.MultipartBodyLengthLimit = 10 * 1024 * 1024; // 10MB
    options.ValueLengthLimit = int.MaxValue;
    options.MultipartHeadersLengthLimit = int.MaxValue;
});

builder.Services.AddDbContext<ApplicationDbContext>(options =>
{
    var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
    options.UseSqlServer(connectionString, sqlOptions =>
    {
        sqlOptions.CommandTimeout(30);
        sqlOptions.EnableRetryOnFailure(maxRetryCount: 3, maxRetryDelay: TimeSpan.FromSeconds(5), errorNumbersToAdd: null);
    });

    if (builder.Environment.IsDevelopment())
    {
        options.EnableSensitiveDataLogging();
        options.EnableDetailedErrors();
    }
});

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

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins(
                  "http://localhost:3000",
                  "http://localhost:3003",
                  "http://localhost:5500",
                  "http://127.0.0.1:5500",
                  "http://192.168.1.17",
                  "http://192.168.1.17:80",
                  "http://192.168.1.17:3000",
                  "http://192.168.1.17:3003",
                  "http://192.168.1.17:5500",
                  "https://192.168.1.17",
                  "https://192.168.1.17:3003"
              )
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials()
              .WithExposedHeaders("Content-Disposition")
              .SetIsOriginAllowedToAllowWildcardSubdomains();
    });
});

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

// Database Migration and Seed
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    try
    {
        var context = services.GetRequiredService<ApplicationDbContext>();
        var logger = services.GetRequiredService<ILogger<Program>>();

        logger.LogInformation("Checking database connection...");

        if (context.Database.CanConnect())
        {
            logger.LogInformation("Database connection successful");

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

        if (app.Environment.IsDevelopment())
        {
            throw;
        }
    }
}

// ============================================================================
// IIS-SPECIFIC SWAGGER CONFIGURATION
// ============================================================================

// IIS'de PathBase'i otomatik algıla
app.UsePathBase(new PathString("/PortalAPI"));

// Swagger - IIS için özel yapılandırma
app.UseSwagger(c =>
{
    c.RouteTemplate = "swagger/{documentName}/swagger.json";
    c.PreSerializeFilters.Add((swagger, httpReq) =>
    {
        var scheme = httpReq.Headers["X-Forwarded-Proto"].FirstOrDefault() ?? httpReq.Scheme;
        var host = httpReq.Headers["X-Forwarded-Host"].FirstOrDefault() ?? httpReq.Host.Value;
        var pathBase = "/PortalAPI";

        swagger.Servers = new List<Microsoft.OpenApi.Models.OpenApiServer>
        {
            new Microsoft.OpenApi.Models.OpenApiServer
            {
                Url = $"{scheme}://{host}{pathBase}"
            }
        };
    });
});

app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/PortalAPI/swagger/v1/swagger.json", "Vervo Portal API V1");
    c.RoutePrefix = "swagger";
});

// ============================================================================
// MIDDLEWARE PIPELINE
// ============================================================================

app.UseHttpsRedirection();
app.UseCors("AllowFrontend");

// Static files
var uploadsPath = Path.Combine(builder.Environment.ContentRootPath, "Uploads");
Directory.CreateDirectory(uploadsPath);

app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new Microsoft.Extensions.FileProviders.PhysicalFileProvider(uploadsPath),
    RequestPath = "/Uploads",
    OnPrepareResponse = ctx =>
    {
        ctx.Context.Response.Headers.Append("Cache-Control", "public,max-age=3600");
    }
});

var bomUploadsPath = Path.Combine(builder.Environment.ContentRootPath, "Uploads", "BOM");
Directory.CreateDirectory(bomUploadsPath);

app.UseAuthentication();
app.UseAuthorization();

// Request logging middleware
app.Use(async (context, next) =>
{
    var logger = context.RequestServices.GetRequiredService<ILogger<Program>>();

    var startTime = DateTime.Now;
    logger.LogInformation("HTTP {Method} {Path} started at {StartTime}",
        context.Request.Method, context.Request.Path, startTime);

    await next();

    var duration = DateTime.Now - startTime;
    logger.LogInformation("HTTP {Method} {Path} completed in {Duration}ms with status {StatusCode}",
        context.Request.Method, context.Request.Path, duration.TotalMilliseconds, context.Response.StatusCode);
});

app.MapControllers();

// Health check endpoints
app.MapGet("/", () => new
{
    Status = "OK",
    Message = "Vervo Portal API is running",
    Version = "1.0.0",
    Environment = app.Environment.EnvironmentName,
    Timestamp = DateTime.Now,
    SwaggerUrl = "/PortalAPI/swagger",
    Features = new[] { "Visitor Management", "Vehicle Management", "Redmine Integration", "JWT Authentication" }
});

app.MapGet("/health", () => new
{
    Status = "Healthy",
    Timestamp = DateTime.Now
});

app.MapGet("/config", (IConfiguration config) => new
{
    RedmineBaseUrl = config["RedmineSettings:BaseUrl"] ?? config["Redmine:BaseUrl"],
    RedmineApiKey = !string.IsNullOrEmpty(config["RedmineSettings:ApiKey"]) ? "Configured" : "Not configured",
    ConnectionString = !string.IsNullOrEmpty(config.GetConnectionString("DefaultConnection")) ? "Configured" : "Not configured",
    Environment = app.Environment.EnvironmentName,
    JwtSecret = !string.IsNullOrEmpty(config["JwtSettings:Secret"]) ? "Configured" : "Not configured",
    PathBase = "/PortalAPI"
});

app.MapGet("/api/test/vehicles", async (ApplicationDbContext context) =>
{
    try
    {
        var count = await context.Vehicles.CountAsync();
        return Results.Ok(new
        {
            Message = "Vehicle Management API is working",
            VehicleCount = count,
            Timestamp = DateTime.Now
        });
    }
    catch (Exception ex)
    {
        return Results.Problem($"Vehicle Management API test failed: {ex.Message}");
    }
}).RequireAuthorization();

app.Logger.LogInformation("🚀 Vervo Portal API starting on IIS...");
app.Logger.LogInformation("📝 Swagger UI available at: /PortalAPI/swagger");
app.Logger.LogInformation("🚗 Vehicle Management API endpoints: /PortalAPI/api/vehicles");

app.Run();