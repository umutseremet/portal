using API.Data;
using API.Data.Entities;
using API.Models;
using API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Security.Claims;
using System.Text.Json;

namespace API.Controllers
{
    /// <summary>
    /// Vehicle management API Controller
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
#if !DEBUG
    [Authorize] // Sadece Release modda JWT token gerekli
#endif
    public class VehiclesController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IVehicleLogService _logService;
        private readonly ILogger<VehiclesController> _logger;
        private readonly IWebHostEnvironment _environment;

        public VehiclesController(ApplicationDbContext context, IVehicleLogService logService, ILogger<VehiclesController> logger, IWebHostEnvironment environment)
        {
            _context = context;
            _logService = logService;
            _logger = logger;
            _environment = environment;
        }

        /// <summary>
        /// Gets client IP address
        /// </summary>
        private string GetClientIpAddress()
        {
            var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString();
            if (string.IsNullOrEmpty(ipAddress) || ipAddress == "::1")
                ipAddress = "127.0.0.1";
            return ipAddress ?? "Unknown";
        }

        // src/backend/API/Controllers/VehiclesController.cs
        // Araç resmi yükleme ve silme endpoint'leri EKLEME

        // ✅ Mevcut VehiclesController'a EKLENECEK metodlar:

        /// <summary>
        /// Araç resmi yükle
        /// </summary>
        [HttpPost("{id}/image")]
        public async Task<ActionResult> UploadVehicleImage(int id, [FromForm] IFormFile vehicleImage)
        {
            try
            {
                var username = User.Identity?.IsAuthenticated == true
                    ? User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue(ClaimTypes.Email)
                    : "Unknown";

                _logger.LogInformation("Uploading image for Vehicle {VehicleId} by user: {Username}", id, username);

                // Araç kontrolü
                var vehicle = await _context.Vehicles.FindAsync(id);
                if (vehicle == null)
                {
                    return NotFound(new { Message = "Araç bulunamadı" });
                }

                // Dosya kontrolleri
                if (vehicleImage == null || vehicleImage.Length == 0)
                {
                    return BadRequest(new { Message = "Resim dosyası seçilmedi" });
                }

                // Maksimum 5MB
                const long MaxImageSize = 5 * 1024 * 1024;
                if (vehicleImage.Length > MaxImageSize)
                {
                    return BadRequest(new { Message = "Resim boyutu 5MB'dan büyük olamaz" });
                }

                // İzin verilen resim uzantıları
                var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".gif", ".webp" };
                var fileExtension = Path.GetExtension(vehicleImage.FileName).ToLowerInvariant();

                if (!allowedExtensions.Contains(fileExtension))
                {
                    return BadRequest(new { Message = $"Bu resim türü desteklenmiyor. İzin verilen: {string.Join(", ", allowedExtensions)}" });
                }

                // Eski resmi sil (varsa)
                if (!string.IsNullOrEmpty(vehicle.VehicleImageUrl))
                {
                    var oldImagePath = Path.Combine(_environment.ContentRootPath, vehicle.VehicleImageUrl.TrimStart('/'));
                    if (System.IO.File.Exists(oldImagePath))
                    {
                        try
                        {
                            System.IO.File.Delete(oldImagePath);
                            _logger.LogInformation("Old vehicle image deleted: {ImagePath}", oldImagePath);
                        }
                        catch (Exception ex)
                        {
                            _logger.LogWarning(ex, "Could not delete old vehicle image: {ImagePath}", oldImagePath);
                        }
                    }
                }

                // ✅ Araç ID bazlı klasör yapısı - ItemFiles ile AYNI MANTIK
                var vehicleFolder = Path.Combine(_environment.ContentRootPath, "Uploads", "Vehicles", id.ToString());

                // Klasör yoksa oluştur
                if (!Directory.Exists(vehicleFolder))
                {
                    Directory.CreateDirectory(vehicleFolder);
                    _logger.LogInformation("Vehicle folder created: {Folder}", vehicleFolder);
                }

                // Dosya adı: vehicle_123.jpg
                var fileName = $"vehicle_{id}{fileExtension}";
                var filePath = Path.Combine(vehicleFolder, fileName);

                // Resmi kaydet
                using (var stream = new FileStream(filePath, FileMode.Create))
                {
                    await vehicleImage.CopyToAsync(stream);
                }

                _logger.LogInformation("Vehicle image saved: {FileName}", fileName);

                // Database'de URL'yi güncelle
                var relativePath = $"/Uploads/Vehicles/{id}/{fileName}";
                vehicle.VehicleImageUrl = relativePath;
                vehicle.UpdatedAt = DateTime.Now;

                await _context.SaveChangesAsync();

                return Ok(new
                {
                    Success = true,
                    Message = "Araç resmi başarıyla yüklendi",
                    ImageUrl = relativePath,
                    Vehicle = new
                    {
                        vehicle.Id,
                        vehicle.LicensePlate,
                        vehicle.Brand,
                        vehicle.Model,
                        VehicleImageUrl = vehicle.VehicleImageUrl
                    }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error uploading image for Vehicle {VehicleId}", id);
                return StatusCode(500, new { Message = "Resim yüklenirken hata oluştu: " + ex.Message });
            }
        }

        /// <summary>
        /// Araç resmini sil
        /// </summary>
        [HttpDelete("{id}/image")]
        public async Task<ActionResult> DeleteVehicleImage(int id)
        {
            try
            {
                var vehicle = await _context.Vehicles.FindAsync(id);
                if (vehicle == null)
                {
                    return NotFound(new { Message = "Araç bulunamadı" });
                }

                if (string.IsNullOrEmpty(vehicle.VehicleImageUrl))
                {
                    return BadRequest(new { Message = "Araç resmi bulunamadı" });
                }

                // Fiziksel dosyayı sil
                var imagePath = Path.Combine(_environment.ContentRootPath, vehicle.VehicleImageUrl.TrimStart('/'));
                if (System.IO.File.Exists(imagePath))
                {
                    try
                    {
                        System.IO.File.Delete(imagePath);
                        _logger.LogInformation("Vehicle image deleted: {ImagePath}", imagePath);
                    }
                    catch (Exception ex)
                    {
                        _logger.LogWarning(ex, "Could not delete vehicle image file: {ImagePath}", imagePath);
                    }
                }

                // Database'den URL'yi kaldır
                vehicle.VehicleImageUrl = null;
                vehicle.UpdatedAt = DateTime.Now;

                await _context.SaveChangesAsync();

                return Ok(new
                {
                    Success = true,
                    Message = "Araç resmi başarıyla silindi"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting image for Vehicle {VehicleId}", id);
                return StatusCode(500, new { Message = "Resim silinirken hata oluştu: " + ex.Message });
            }
        }

        // src/backend/API/Controllers/VehiclesController.cs
        // ✅ GetVehicles METODU GÜNCELLENMİŞ - FİLTRELEME, SIRALAMA ve PAGINATION

        /// <summary>
        /// Lists all vehicles with filtering, sorting and pagination
        /// GET: api/vehicles
        /// </summary>
        [HttpGet]
        public async Task<ActionResult<object>> GetVehicles(
            [FromQuery] string? search,
            [FromQuery] string? licensePlate,
            [FromQuery] string? brand,
            [FromQuery] string? model,
            [FromQuery] string? companyName,
            [FromQuery] string? ownershipType,
            [FromQuery] string? sortBy = "createdAt",
            [FromQuery] string? sortOrder = "desc",
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10)
        {
            try
            {
                _logger.LogInformation("GetVehicles called with filters - Search: {Search}, LicensePlate: {LicensePlate}, Brand: {Brand}, Model: {Model}, Page: {Page}, PageSize: {PageSize}",
                    search, licensePlate, brand, model, page, pageSize);

                var query = _context.Vehicles.AsQueryable();

                // ✅ GENEL ARAMA FİLTRESİ
                if (!string.IsNullOrWhiteSpace(search))
                {
                    var searchTerm = search.Trim().ToUpper();
                    query = query.Where(v =>
                        v.LicensePlate.ToUpper().Contains(searchTerm) ||
                        v.Brand.ToUpper().Contains(searchTerm) ||
                        v.Model.ToUpper().Contains(searchTerm) ||
                        (v.VIN != null && v.VIN.ToUpper().Contains(searchTerm))
                    );
                    _logger.LogInformation("Applied search filter: {SearchTerm}", searchTerm);
                }

                // ✅ PLAKA FİLTRESİ
                if (!string.IsNullOrWhiteSpace(licensePlate))
                {
                    var plateTerm = licensePlate.Trim().ToUpper();
                    query = query.Where(v => v.LicensePlate.ToUpper().Contains(plateTerm));
                    _logger.LogInformation("Applied license plate filter: {LicensePlate}", plateTerm);
                }

                // ✅ MARKA FİLTRESİ
                if (!string.IsNullOrWhiteSpace(brand))
                {
                    var brandTerm = brand.Trim().ToUpper();
                    query = query.Where(v => v.Brand.ToUpper().Contains(brandTerm));
                    _logger.LogInformation("Applied brand filter: {Brand}", brandTerm);
                }

                // ✅ MODEL FİLTRESİ
                if (!string.IsNullOrWhiteSpace(model))
                {
                    var modelTerm = model.Trim().ToUpper();
                    query = query.Where(v => v.Model.ToUpper().Contains(modelTerm));
                    _logger.LogInformation("Applied model filter: {Model}", modelTerm);
                }

                // ✅ ŞİRKET FİLTRESİ
                if (!string.IsNullOrWhiteSpace(companyName))
                {
                    var companyTerm = companyName.Trim().ToUpper();
                    query = query.Where(v => v.CompanyName != null && v.CompanyName.ToUpper().Contains(companyName.ToUpper()));
                    _logger.LogInformation("Applied company filter: {CompanyName}", companyTerm);
                }

                // ✅ SAHİPLİK TÜRÜ FİLTRESİ
                if (!string.IsNullOrWhiteSpace(ownershipType))
                {
                    query = query.Where(v => v.OwnershipType != null && v.OwnershipType.ToLower() == ownershipType.ToLower());
                    _logger.LogInformation("Applied ownership type filter: {OwnershipType}", ownershipType);
                }

                // ✅ TOPLAM KAYIT SAYISI (Filtreleme sonrası)
                var totalCount = await query.CountAsync();
                _logger.LogInformation("Total vehicles after filtering: {TotalCount}", totalCount);

                // ✅ SIRALAMA
                query = sortBy?.ToLower() switch
                {
                    "licenseplate" => sortOrder?.ToLower() == "asc"
                        ? query.OrderBy(v => v.LicensePlate)
                        : query.OrderByDescending(v => v.LicensePlate),
                    "brand" => sortOrder?.ToLower() == "asc"
                        ? query.OrderBy(v => v.Brand)
                        : query.OrderByDescending(v => v.Brand),
                    "model" => sortOrder?.ToLower() == "asc"
                        ? query.OrderBy(v => v.Model)
                        : query.OrderByDescending(v => v.Model),
                    "year" => sortOrder?.ToLower() == "asc"
                        ? query.OrderBy(v => v.Year)
                        : query.OrderByDescending(v => v.Year),
                    "companyname" => sortOrder?.ToLower() == "asc"
                        ? query.OrderBy(v => v.CompanyName)
                        : query.OrderByDescending(v => v.CompanyName),
                    "currentmileage" => sortOrder?.ToLower() == "asc"
                        ? query.OrderBy(v => v.CurrentMileage)
                        : query.OrderByDescending(v => v.CurrentMileage),
                    "updatedat" => sortOrder?.ToLower() == "asc"
                        ? query.OrderBy(v => v.UpdatedAt)
                        : query.OrderByDescending(v => v.UpdatedAt),
                    _ => sortOrder?.ToLower() == "asc"
                        ? query.OrderBy(v => v.CreatedAt)
                        : query.OrderByDescending(v => v.CreatedAt)
                };

                // ✅ PAGINATION
                var vehicles = await query
                    .Skip((page - 1) * pageSize)
                    .Take(pageSize)
                    .Select(v => new VehicleListResponseDto
                    {
                        Id = v.Id,
                        LicensePlate = v.LicensePlate,
                        Brand = v.Brand,
                        Model = v.Model,
                        Year = v.Year,
                        CompanyName = v.CompanyName,
                        AssignedUserName = v.AssignedUserName,
                        AssignedUserPhone = v.AssignedUserPhone,
                        Location = v.Location,
                        InspectionDate = v.InspectionDate,
                        InsuranceExpiryDate = v.InsuranceExpiryDate,
                        LastServiceDate = v.LastServiceDate,
                        CurrentMileage = v.CurrentMileage,
                        TireCondition = v.TireCondition,
                        CreatedAt = v.CreatedAt,
                        UpdatedAt = v.UpdatedAt,
                        OwnershipType = v.OwnershipType,
                        Insurance = v.Insurance,
                        VIN = v.VIN,
                        FuelConsumption = v.FuelConsumption,
                        VehicleImageUrl = v.VehicleImageUrl
                    })
                    .ToListAsync();

                // ✅ PAGINATION METADATA
                var totalPages = (int)Math.Ceiling(totalCount / (double)pageSize);
                var hasNextPage = page < totalPages;
                var hasPreviousPage = page > 1;

                _logger.LogInformation("{Count} vehicles returned for page {Page}/{TotalPages}",
                    vehicles.Count, page, totalPages);

                // ✅ RESPONSE
                return Ok(new
                {
                    Data = vehicles,
                    TotalCount = totalCount,
                    TotalPages = totalPages,
                    CurrentPage = page,
                    PageSize = pageSize,
                    HasNextPage = hasNextPage,
                    HasPreviousPage = hasPreviousPage
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving vehicles");
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        /// <summary>
        /// Gets a specific vehicle
        /// GET: api/vehicles/5
        /// </summary>
        [HttpGet("{id}")]
        public async Task<ActionResult<Vehicle>> GetVehicle(int id)
        {
            try
            {
                var vehicle = await _context.Vehicles.FindAsync(id);

                if (vehicle == null)
                {
                    _logger.LogWarning("Vehicle not found. ID: {Id}", id);
                    return NotFound(new { message = $"Vehicle with ID {id} not found." });
                }

                _logger.LogInformation("Vehicle details retrieved. ID: {Id}, LicensePlate: {LicensePlate}", id, vehicle.LicensePlate);
                return Ok(vehicle);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving vehicle {Id}", id);
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        /// <summary>
        /// Gets vehicle log history
        /// GET: api/vehicles/5/logs
        /// </summary>
        [HttpGet("{id}/logs")]
        public async Task<ActionResult<IEnumerable<VehicleLog>>> GetVehicleLogs(int id)
        {
            try
            {
                // First check if vehicle exists
                var vehicleExists = await _context.Vehicles.AnyAsync(v => v.Id == id);
                if (!vehicleExists)
                {
                    return NotFound(new { message = $"Vehicle with ID {id} not found." });
                }

                var logs = await _logService.GetVehicleLogsAsync(id);

                _logger.LogInformation("Retrieved {Count} log entries for vehicle {Id}", logs.Count, id);
                return Ok(logs);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving vehicle {Id} logs", id);
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }


        // src/backend/API/Controllers/VehiclesController.cs
        // ✅ CreateVehicle metodu - NULL-SAFE VERSION

        [HttpPost]
        public async Task<ActionResult<Vehicle>> CreateVehicle([FromBody] VehicleCreateDto vehicleDto)
        {
            try
            {
                _logger.LogInformation("CreateVehicle called with data: {@VehicleDto}", vehicleDto);

                if (!ModelState.IsValid)
                {
                    _logger.LogWarning("ModelState invalid: {@ModelState}", ModelState);
                    return BadRequest(ModelState);
                }

                // Check for duplicate license plate
                var existingVehicle = await _context.Vehicles
                    .FirstOrDefaultAsync(v => v.LicensePlate.ToUpper() == vehicleDto.LicensePlate.ToUpper());

                if (existingVehicle != null)
                {
                    _logger.LogWarning("Duplicate license plate: {LicensePlate}", vehicleDto.LicensePlate);
                    return Conflict(new { message = $"A vehicle with license plate ({vehicleDto.LicensePlate}) already exists." });
                }

                // ✅ NULL-SAFE: Nullable alanlar için ?. operatörü ve ?? kullan
                var vehicle = new Vehicle
                {
                    // Zorunlu alanlar
                    LicensePlate = vehicleDto.LicensePlate.ToUpper().Trim(),
                    Brand = vehicleDto.Brand.Trim(),
                    Model = vehicleDto.Model.Trim(),

                    // Opsiyonel alanlar - NULL-SAFE
                    Year = vehicleDto.Year,
                    VIN = vehicleDto.VIN?.Trim(),
                    CompanyName = vehicleDto.CompanyName?.Trim(),
                    InspectionDate = vehicleDto.InspectionDate,
                    Insurance = vehicleDto.Insurance?.Trim(),
                    InsuranceExpiryDate = vehicleDto.InsuranceExpiryDate,
                    LastServiceDate = vehicleDto.LastServiceDate,
                    CurrentMileage = vehicleDto.CurrentMileage,
                    FuelConsumption = vehicleDto.FuelConsumption,
                    TireCondition = vehicleDto.TireCondition?.Trim(),
                    RegistrationInfo = vehicleDto.RegistrationInfo?.Trim(),
                    OwnershipType = vehicleDto.OwnershipType?.Trim() ?? "company",
                    AssignedUserName = vehicleDto.AssignedUserName?.Trim(),
                    AssignedUserPhone = vehicleDto.AssignedUserPhone?.Trim(),
                    Location = vehicleDto.Location?.Trim(),
                    VehicleImageUrl = vehicleDto.VehicleImageUrl?.Trim(),
                    CreatedAt = DateTime.Now
                };

                _context.Vehicles.Add(vehicle);
                await _context.SaveChangesAsync();

                _logger.LogInformation("Vehicle created successfully. Id: {VehicleId}, LicensePlate: {LicensePlate}",
                    vehicle.Id, vehicle.LicensePlate);

                // Log entry
                try
                {
                    await _logService.LogOperationAsync(
                        vehicle.Id,
                        "Vehicle Creation",
                        $"New vehicle added: {vehicle.LicensePlate} - {vehicle.Brand} {vehicle.Model}",
                        null,
                        new { vehicle.LicensePlate, vehicle.Brand, vehicle.Model },
                        User.Identity?.Name ?? "System",
                        GetClientIpAddress()
                    );
                }
                catch (Exception logEx)
                {
                    // Log hataları araç oluşturmayı engellemez
                    _logger.LogError(logEx, "Error logging vehicle creation");
                }

                return CreatedAtAction(nameof(GetVehicle), new { id = vehicle.Id }, vehicle);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating vehicle. Data: {@VehicleDto}", vehicleDto);
                return StatusCode(500, new
                {
                    message = "Internal server error",
                    error = ex.Message,
                    innerError = ex.InnerException?.Message
                });
            }
        }

        /// <summary>
        /// Updates vehicle information completely
        /// PUT: api/vehicles/5
        /// </summary>
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateVehicle(int id, [FromBody] Vehicle vehicle)
        {
            if (id != vehicle.Id)
            {
                return BadRequest(new { message = "ID mismatch" });
            }

            try
            {
                var existingVehicle = await _context.Vehicles.FindAsync(id);
                if (existingVehicle == null)
                {
                    return NotFound(new { message = $"Vehicle with ID {id} not found." });
                }

                // Store old values for logging
                var oldValues = new
                {
                    existingVehicle.LicensePlate,
                    existingVehicle.Brand,
                    existingVehicle.Model,
                    existingVehicle.Year,
                    existingVehicle.VIN,
                    existingVehicle.CompanyName,
                    existingVehicle.InspectionDate,
                    existingVehicle.Insurance,
                    existingVehicle.InsuranceExpiryDate,
                    existingVehicle.LastServiceDate,
                    existingVehicle.CurrentMileage,
                    existingVehicle.FuelConsumption,
                    existingVehicle.TireCondition,
                    existingVehicle.RegistrationInfo,
                    existingVehicle.OwnershipType,
                    existingVehicle.AssignedUserName,
                    existingVehicle.AssignedUserPhone,
                    existingVehicle.Location,
                    existingVehicle.VehicleImageUrl
                };

                // Update
                existingVehicle.LicensePlate = vehicle.LicensePlate?.ToUpper().Trim() ?? existingVehicle.LicensePlate;
                existingVehicle.Brand = vehicle.Brand?.Trim() ?? existingVehicle.Brand;
                existingVehicle.Model = vehicle.Model?.Trim() ?? existingVehicle.Model;
                existingVehicle.Year = vehicle.Year;
                existingVehicle.VIN = vehicle.VIN?.Trim() ?? existingVehicle.VIN;
                existingVehicle.CompanyName = vehicle.CompanyName?.Trim() ?? existingVehicle.CompanyName;
                existingVehicle.InspectionDate = vehicle.InspectionDate;
                existingVehicle.Insurance = vehicle.Insurance?.Trim() ?? existingVehicle.Insurance;
                existingVehicle.InsuranceExpiryDate = vehicle.InsuranceExpiryDate;
                existingVehicle.LastServiceDate = vehicle.LastServiceDate;
                existingVehicle.CurrentMileage = vehicle.CurrentMileage;
                existingVehicle.FuelConsumption = vehicle.FuelConsumption;
                existingVehicle.TireCondition = vehicle.TireCondition?.Trim() ?? existingVehicle.TireCondition;
                existingVehicle.RegistrationInfo = vehicle.RegistrationInfo?.Trim() ?? existingVehicle.RegistrationInfo;
                existingVehicle.OwnershipType = vehicle.OwnershipType?.Trim() ?? existingVehicle.OwnershipType;
                existingVehicle.AssignedUserName = vehicle.AssignedUserName?.Trim() ?? existingVehicle.AssignedUserName;
                existingVehicle.AssignedUserPhone = vehicle.AssignedUserPhone?.Trim() ?? existingVehicle.AssignedUserPhone;
                existingVehicle.Location = vehicle.Location?.Trim() ?? existingVehicle.Location;
                existingVehicle.VehicleImageUrl = vehicle.VehicleImageUrl?.Trim();
                existingVehicle.UpdatedAt = DateTime.Now;

                await _context.SaveChangesAsync();

                // Store new values for logging
                var newValues = new
                {
                    existingVehicle.LicensePlate,
                    existingVehicle.Brand,
                    existingVehicle.Model,
                    existingVehicle.Year,
                    existingVehicle.VIN,
                    existingVehicle.CompanyName,
                    existingVehicle.InspectionDate,
                    existingVehicle.Insurance,
                    existingVehicle.InsuranceExpiryDate,
                    existingVehicle.LastServiceDate,
                    existingVehicle.CurrentMileage,
                    existingVehicle.FuelConsumption,
                    existingVehicle.TireCondition,
                    existingVehicle.RegistrationInfo,
                    existingVehicle.OwnershipType,
                    existingVehicle.AssignedUserName,
                    existingVehicle.AssignedUserPhone,
                    existingVehicle.Location,
                    existingVehicle.VehicleImageUrl
                };

                // Log entry
                await _logService.LogOperationAsync(
                    id,
                    "Complete Update",
                    $"Vehicle {existingVehicle.LicensePlate} completely updated.",
                    oldValues,
                    newValues,
                    User.Identity?.Name ?? "System",
                    GetClientIpAddress()
                );

                _logger.LogInformation("Vehicle updated. ID: {Id}, LicensePlate: {LicensePlate}", id, existingVehicle.LicensePlate);
                return Ok(existingVehicle);
            }
            catch (DbUpdateConcurrencyException ex)
            {
                _logger.LogError(ex, "Concurrency error while updating vehicle {Id}", id);
                return Conflict(new { message = "Vehicle has been updated by another user. Please refresh the page." });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating vehicle {Id}", id);
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        /// <summary>
        /// Updates user information
        /// PATCH: api/vehicles/5/user-info
        /// </summary>
        [HttpPatch("{id}/user-info")]
        public async Task<IActionResult> UpdateUserInfo(int id, [FromBody] UserInfoUpdateDto userDto)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                var vehicle = await _context.Vehicles.FindAsync(id);
                if (vehicle == null)
                {
                    return NotFound(new { message = $"Vehicle with ID {id} not found." });
                }

                // Store old values
                var oldValues = new
                {
                    vehicle.AssignedUserName,
                    vehicle.AssignedUserPhone
                };

                // Update only user information
                vehicle.AssignedUserName = userDto.AssignedUserName.Trim();
                vehicle.AssignedUserPhone = userDto.AssignedUserPhone.Trim();
                vehicle.UpdatedAt = DateTime.Now;

                await _context.SaveChangesAsync();

                // Store new values
                var newValues = new
                {
                    userDto.AssignedUserName,
                    userDto.AssignedUserPhone
                };

                // Log entry
                await _logService.LogOperationAsync(
                    id,
                    "User Information Update",
                    $"Vehicle {vehicle.LicensePlate} user information updated.",
                    oldValues,
                    newValues,
                    User.Identity?.Name ?? "System",
                    GetClientIpAddress()
                );

                _logger.LogInformation("Vehicle {Id} user information updated", id);
                return Ok(new { message = "User information updated successfully", vehicle });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating vehicle {Id} user information", id);
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        /// <summary>
        /// Updates vehicle information
        /// PATCH: api/vehicles/5/vehicle-info
        /// </summary>
        [HttpPatch("{id}/vehicle-info")]
        public async Task<IActionResult> UpdateVehicleInfo(int id, [FromBody] VehicleInfoUpdateDto vehicleDto)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                var vehicle = await _context.Vehicles.FindAsync(id);
                if (vehicle == null)
                {
                    return NotFound(new { message = $"Vehicle with ID {id} not found." });
                }

                // Store old values
                var oldValues = new
                {
                    vehicle.LicensePlate,
                    vehicle.Brand,
                    vehicle.Model,
                    vehicle.Year,
                    vehicle.VIN,
                    vehicle.CompanyName,
                    vehicle.InspectionDate,
                    vehicle.Insurance,
                    vehicle.InsuranceExpiryDate,
                    vehicle.LastServiceDate,
                    vehicle.CurrentMileage,
                    vehicle.FuelConsumption,
                    vehicle.TireCondition,
                    vehicle.RegistrationInfo,
                    vehicle.OwnershipType,
                    vehicle.Location,
                    vehicle.VehicleImageUrl
                };

                // Update vehicle information
                vehicle.LicensePlate = vehicleDto.LicensePlate.ToUpper().Trim();
                vehicle.Brand = vehicleDto.Brand.Trim();
                vehicle.Model = vehicleDto.Model.Trim();
                vehicle.Year = vehicleDto.Year;
                vehicle.VIN = vehicleDto.VIN.Trim();
                vehicle.CompanyName = vehicleDto.CompanyName.Trim();
                vehicle.InspectionDate = vehicleDto.InspectionDate;
                vehicle.Insurance = vehicleDto.Insurance.Trim();
                vehicle.InsuranceExpiryDate = vehicleDto.InsuranceExpiryDate;
                vehicle.LastServiceDate = vehicleDto.LastServiceDate;
                vehicle.CurrentMileage = vehicleDto.CurrentMileage;
                vehicle.FuelConsumption = vehicleDto.FuelConsumption;
                vehicle.TireCondition = vehicleDto.TireCondition.Trim();
                vehicle.RegistrationInfo = vehicleDto.RegistrationInfo.Trim();
                vehicle.OwnershipType = vehicleDto.OwnershipType.Trim();
                vehicle.Location = vehicleDto.Location.Trim();
                vehicle.VehicleImageUrl = vehicleDto.VehicleImageUrl?.Trim();
                vehicle.UpdatedAt = DateTime.Now;

                await _context.SaveChangesAsync();

                // Store new values
                var newValues = new
                {
                    vehicle.LicensePlate,
                    vehicle.Brand,
                    vehicle.Model,
                    vehicle.Year,
                    vehicle.VIN,
                    vehicle.CompanyName,
                    vehicle.InspectionDate,
                    vehicle.Insurance,
                    vehicle.InsuranceExpiryDate,
                    vehicle.LastServiceDate,
                    vehicle.CurrentMileage,
                    vehicle.FuelConsumption,
                    vehicle.TireCondition,
                    vehicle.RegistrationInfo,
                    vehicle.OwnershipType,
                    vehicle.Location,
                    vehicle.VehicleImageUrl
                };

                // Log entry
                await _logService.LogOperationAsync(
                    id,
                    "Vehicle Information Update",
                    $"Vehicle {vehicle.LicensePlate} information updated.",
                    oldValues,
                    newValues,
                    User.Identity?.Name ?? "System",
                    GetClientIpAddress()
                );

                _logger.LogInformation("Vehicle {Id} information updated", id);
                return Ok(new { message = "Vehicle information updated successfully", vehicle });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating vehicle {Id} information", id);
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        /// <summary>
        /// Deletes a vehicle
        /// DELETE: api/vehicles/5
        /// </summary>
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteVehicle(int id)
        {
            try
            {
                var vehicle = await _context.Vehicles.FindAsync(id);
                if (vehicle == null)
                {
                    return NotFound(new { message = $"Vehicle with ID {id} not found." });
                }

                // Store vehicle information before deletion (for logging)
                var deletedVehicle = new
                {
                    vehicle.LicensePlate,
                    vehicle.Brand,
                    vehicle.Model,
                    vehicle.AssignedUserName
                };

                _context.Vehicles.Remove(vehicle);
                await _context.SaveChangesAsync();

                // Log entry
                await _logService.LogOperationAsync(
                    id,
                    "Vehicle Deletion",
                    $"Vehicle deleted: {vehicle.LicensePlate} - {vehicle.Brand} {vehicle.Model}",
                    deletedVehicle,
                    null,
                    User.Identity?.Name ?? "System",
                    GetClientIpAddress()
                );

                _logger.LogInformation("Vehicle deleted. ID: {Id}, LicensePlate: {LicensePlate}", id, vehicle.LicensePlate);
                return Ok(new { message = "Vehicle deleted successfully", deletedVehicle });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting vehicle {Id}", id);
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }
    }
}