using API.Data;
using API.Data.Entities;
using API.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Globalization;
using Microsoft.AspNetCore.Authorization;

namespace API.Controllers
{


    [Route("api/[controller]")]
    [ApiController]
#if !DEBUG
    [Authorize]
#endif
    public class VehicleFuelPurchasesController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<VehicleFuelPurchasesController> _logger;

        public VehicleFuelPurchasesController(
            ApplicationDbContext context,
            ILogger<VehicleFuelPurchasesController> logger)
        {
            _context = context;
            _logger = logger;
        }

        /// <summary>
        /// Gets all fuel purchases with filtering, sorting and pagination
        /// GET: api/vehiclefuelpurchases
        /// </summary>
        [HttpGet]
        public async Task<ActionResult<object>> GetFuelPurchases([FromQuery] VehicleFuelPurchaseListRequest request)
        {
            try
            {
                var query = _context.VehicleFuelPurchases.Include(f => f.Vehicle).AsQueryable();

                // Apply filters
                if (request.VehicleId.HasValue)
                {
                    query = query.Where(f => f.VehicleId == request.VehicleId.Value);
                }

                if (!string.IsNullOrEmpty(request.LicensePlate))
                {
                    var plate = request.LicensePlate.ToUpper().Trim();
                    query = query.Where(f => f.LicensePlate.Contains(plate));
                }

                if (request.FromDate.HasValue)
                {
                    query = query.Where(f => f.PurchaseDate >= request.FromDate.Value);
                }

                if (request.ToDate.HasValue)
                {
                    query = query.Where(f => f.PurchaseDate <= request.ToDate.Value);
                }

                if (!string.IsNullOrEmpty(request.FuelType))
                {
                    query = query.Where(f => f.FuelType.Contains(request.FuelType));
                }

                if (!string.IsNullOrEmpty(request.Station))
                {
                    query = query.Where(f => f.Station.Contains(request.Station));
                }

                if (!string.IsNullOrEmpty(request.City))
                {
                    query = query.Where(f => f.City.Contains(request.City));
                }

                // Get total count before pagination
                var totalCount = await query.CountAsync();

                // Apply sorting
                query = request.SortBy?.ToLower() switch
                {
                    "purchasedate" => request.SortOrder?.ToLower() == "asc" ? query.OrderBy(f => f.PurchaseDate) : query.OrderByDescending(f => f.PurchaseDate),
                    "quantity" => request.SortOrder?.ToLower() == "asc" ? query.OrderBy(f => f.Quantity) : query.OrderByDescending(f => f.Quantity),
                    "netamount" => request.SortOrder?.ToLower() == "asc" ? query.OrderBy(f => f.NetAmount) : query.OrderByDescending(f => f.NetAmount),
                    "station" => request.SortOrder?.ToLower() == "asc" ? query.OrderBy(f => f.Station) : query.OrderByDescending(f => f.Station),
                    _ => query.OrderByDescending(f => f.PurchaseDate)
                };

                // Apply pagination
                var purchases = await query
                    .Skip((request.Page - 1) * request.PageSize)
                    .Take(request.PageSize)
                    .Select(f => new VehicleFuelPurchaseResponseDto
                    {
                        Id = f.Id,
                        VehicleId = f.VehicleId,
                        VehicleLicensePlate = f.Vehicle != null ? f.Vehicle.LicensePlate : "",
                        VehicleBrand = f.Vehicle != null ? f.Vehicle.Brand : "",
                        VehicleModel = f.Vehicle != null ? f.Vehicle.Model : "",
                        PurchaseId = f.PurchaseId,
                        Code = f.Code,
                        FleetCodeName = f.FleetCodeName,
                        Fleet = f.Fleet,
                        City = f.City,
                        Station = f.Station,
                        StationCode = f.StationCode,
                        DeviceGroups = f.DeviceGroups,
                        LicensePlate = f.LicensePlate,
                        FuelType = f.FuelType,
                        SalesType = f.SalesType,
                        UTTS = f.UTTS,
                        Quantity = f.Quantity,
                        GrossAmount = f.GrossAmount,
                        NetAmount = f.NetAmount,
                        Discount = f.Discount,
                        DiscountType = f.DiscountType,
                        UnitPrice = f.UnitPrice,
                        VATRate = f.VATRate,
                        Mileage = f.Mileage,
                        Distributor = f.Distributor,
                        PurchaseDate = f.PurchaseDate,
                        Period = f.Period,
                        TransactionNumber = f.TransactionNumber,
                        InvoiceDate = f.InvoiceDate,
                        InvoiceNumber = f.InvoiceNumber,
                        ReflectionDate = f.ReflectionDate,
                        SalesRepresentativeId = f.SalesRepresentativeId,
                        SalesRepresentative = f.SalesRepresentative,
                        CreatedAt = f.CreatedAt,
                        UpdatedAt = f.UpdatedAt,
                        DeviceDescription = f.DeviceDescription,
                    })
                    .ToListAsync();

                var totalPages = (int)Math.Ceiling(totalCount / (double)request.PageSize);

                _logger.LogInformation("Retrieved {Count} fuel purchases (Page {Page}/{TotalPages})", purchases.Count, request.Page, totalPages);

                return Ok(new
                {
                    data = purchases,
                    totalCount,
                    page = request.Page,
                    pageSize = request.PageSize,
                    totalPages,
                    hasNextPage = request.Page < totalPages,
                    hasPreviousPage = request.Page > 1
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving fuel purchases");
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        /// <summary>
        /// Gets a specific fuel purchase by id
        /// GET: api/vehiclefuelpurchases/5
        /// </summary>
        [HttpGet("{id}")]
        public async Task<ActionResult<VehicleFuelPurchaseResponseDto>> GetFuelPurchase(int id)
        {
            try
            {
                var purchase = await _context.VehicleFuelPurchases
                    .Include(f => f.Vehicle)
                    .Where(f => f.Id == id)
                    .Select(f => new VehicleFuelPurchaseResponseDto
                    {
                        Id = f.Id,
                        VehicleId = f.VehicleId,
                        VehicleLicensePlate = f.Vehicle != null ? f.Vehicle.LicensePlate : "",
                        VehicleBrand = f.Vehicle != null ? f.Vehicle.Brand : "",
                        VehicleModel = f.Vehicle != null ? f.Vehicle.Model : "",
                        PurchaseId = f.PurchaseId,
                        Code = f.Code,
                        FleetCodeName = f.FleetCodeName,
                        Fleet = f.Fleet,
                        City = f.City,
                        Station = f.Station,
                        StationCode = f.StationCode,
                        DeviceGroups = f.DeviceGroups,
                        DeviceDescription = f.DeviceDescription,
                        LicensePlate = f.LicensePlate,
                        FuelType = f.FuelType,
                        SalesType = f.SalesType,
                        UTTS = f.UTTS,
                        Quantity = f.Quantity,
                        GrossAmount = f.GrossAmount,
                        NetAmount = f.NetAmount,
                        Discount = f.Discount,
                        DiscountType = f.DiscountType,
                        UnitPrice = f.UnitPrice,
                        VATRate = f.VATRate,
                        Mileage = f.Mileage,
                        Distributor = f.Distributor,
                        PurchaseDate = f.PurchaseDate,
                        Period = f.Period,
                        TransactionNumber = f.TransactionNumber,
                        InvoiceDate = f.InvoiceDate,
                        InvoiceNumber = f.InvoiceNumber,
                        ReflectionDate = f.ReflectionDate,
                        SalesRepresentativeId = f.SalesRepresentativeId,
                        SalesRepresentative = f.SalesRepresentative,
                        CreatedAt = f.CreatedAt,
                        UpdatedAt = f.UpdatedAt
                    })
                    .FirstOrDefaultAsync();

                if (purchase == null)
                {
                    _logger.LogWarning("Fuel purchase not found. ID: {Id}", id);
                    return NotFound(new { message = $"Fuel purchase with ID {id} not found." });
                }

                _logger.LogInformation("Fuel purchase details retrieved. ID: {Id}", id);
                return Ok(purchase);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving fuel purchase {Id}", id);
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        /// <summary>
        /// Gets fuel purchases for a specific vehicle
        /// GET: api/vehiclefuelpurchases/vehicle/5
        /// </summary>
        [HttpGet("vehicle/{vehicleId}")]
        public async Task<ActionResult<object>> GetVehicleFuelPurchases(int vehicleId, [FromQuery] int page = 1, [FromQuery] int pageSize = 25)
        {
            try
            {
                var vehicleExists = await _context.Vehicles.AnyAsync(v => v.Id == vehicleId);
                if (!vehicleExists)
                {
                    return NotFound(new { message = $"Vehicle with ID {vehicleId} not found." });
                }

                var query = _context.VehicleFuelPurchases
                    .Include(f => f.Vehicle)
                    .Where(f => f.VehicleId == vehicleId)
                    .OrderByDescending(f => f.PurchaseDate);

                var totalCount = await query.CountAsync();
                var totalPages = (int)Math.Ceiling(totalCount / (double)pageSize);

                var purchases = await query
                    .Skip((page - 1) * pageSize)
                    .Take(pageSize)
                    .Select(f => new VehicleFuelPurchaseResponseDto
                    {
                        Id = f.Id,
                        VehicleId = f.VehicleId,
                        VehicleLicensePlate = f.Vehicle != null ? f.Vehicle.LicensePlate : "",
                        VehicleBrand = f.Vehicle != null ? f.Vehicle.Brand : "",
                        VehicleModel = f.Vehicle != null ? f.Vehicle.Model : "",
                        PurchaseId = f.PurchaseId,
                        LicensePlate = f.LicensePlate,
                        FuelType = f.FuelType,
                        Station = f.Station,
                        City = f.City,
                        Quantity = f.Quantity,
                        NetAmount = f.NetAmount,
                        UnitPrice = f.UnitPrice,
                        Mileage = f.Mileage,
                        PurchaseDate = f.PurchaseDate,
                        TransactionNumber = f.TransactionNumber,
                        InvoiceNumber = f.InvoiceNumber,
                        Distributor = f.Distributor,
                        Code = f.Code,
                        FleetCodeName = f.FleetCodeName,
                        Fleet = f.Fleet,
                        StationCode = f.StationCode,
                        DeviceGroups = f.DeviceGroups,
                        DeviceDescription = f.DeviceDescription,
                        SalesType = f.SalesType,
                        UTTS = f.UTTS,
                        GrossAmount = f.GrossAmount,
                        Discount = f.Discount,
                        DiscountType = f.DiscountType,
                        VATRate = f.VATRate,
                        Period = f.Period,
                        InvoiceDate = f.InvoiceDate,
                        ReflectionDate = f.ReflectionDate,
                        SalesRepresentativeId = f.SalesRepresentativeId,
                        SalesRepresentative = f.SalesRepresentative,
                        CreatedAt = f.CreatedAt,
                        UpdatedAt = f.UpdatedAt
                    })
                    .ToListAsync();

                _logger.LogInformation("Retrieved {Count} fuel purchases for vehicle {VehicleId}", purchases.Count, vehicleId);

                return Ok(new
                {
                    data = purchases,
                    totalCount,
                    page,
                    pageSize,
                    totalPages,
                    vehicleId
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving fuel purchases for vehicle {VehicleId}", vehicleId);
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        /// <summary>
        /// Creates a new fuel purchase
        /// POST: api/vehiclefuelpurchases
        /// </summary>
        [HttpPost]
        public async Task<ActionResult<VehicleFuelPurchaseResponseDto>> CreateFuelPurchase([FromBody] VehicleFuelPurchaseCreateDto dto)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                // Find vehicle by license plate
                var vehicle = await _context.Vehicles.FirstOrDefaultAsync(v => v.LicensePlate.ToUpper() == dto.LicensePlate.ToUpper().Trim());

                if (vehicle == null)
                {
                    return NotFound(new { message = $"Vehicle with license plate {dto.LicensePlate} not found.", licensePlate = dto.LicensePlate });
                }

                // Check for duplicate transaction number
                var existingPurchase = await _context.VehicleFuelPurchases.FirstOrDefaultAsync(f => f.TransactionNumber == dto.TransactionNumber);

                if (existingPurchase != null)
                {
                    return Conflict(new { message = $"A fuel purchase with transaction number {dto.TransactionNumber} already exists.", existingId = existingPurchase.Id });
                }

                var purchase = new VehicleFuelPurchase
                {
                    VehicleId = vehicle.Id,
                    PurchaseId = dto.PurchaseId,
                    DistributorId = dto.DistributorId,
                    DistributorCodeId = dto.DistributorCodeId,
                    Code = dto.Code.Trim(),
                    FleetCodeName = dto.FleetCodeName.Trim(),
                    Fleet = dto.Fleet.Trim(),
                    City = dto.City.Trim(),
                    Station = dto.Station.Trim(),
                    StationCode = dto.StationCode.Trim(),
                    DeviceGroups = dto.DeviceGroups?.Trim(),
                    LicensePlate = dto.LicensePlate.ToUpper().Trim(),
                    FuelType = dto.FuelType.Trim(),
                    SalesType = dto.SalesType.Trim(),
                    UTTS = dto.UTTS.Trim(),
                    Quantity = dto.Quantity,
                    GrossAmount = dto.GrossAmount,
                    NetAmount = dto.NetAmount,
                    Discount = dto.Discount,
                    DiscountType = dto.DiscountType.Trim(),
                    UnitPrice = dto.UnitPrice,
                    VATRate = dto.VATRate.Trim(),
                    Mileage = dto.Mileage,
                    Distributor = dto.Distributor.Trim(),
                    PurchaseDate = dto.PurchaseDate,
                    Period = dto.Period,
                    TransactionNumber = dto.TransactionNumber.Trim(),
                    InvoiceDate = dto.InvoiceDate,
                    InvoiceNumber = dto.InvoiceNumber.Trim(),
                    ReflectionDate = dto.ReflectionDate,
                    SalesRepresentativeId = dto.SalesRepresentativeId,
                    SalesRepresentative = dto.SalesRepresentative.Trim(),
                    CreatedAt = DateTime.Now,
                    DeviceDescription = dto.DeviceDescription
                };

                _context.VehicleFuelPurchases.Add(purchase);
                await _context.SaveChangesAsync();

                _logger.LogInformation("New fuel purchase created. ID: {Id}, Vehicle: {LicensePlate}, Transaction: {TransactionNumber}", purchase.Id, purchase.LicensePlate, purchase.TransactionNumber);

                var response = new VehicleFuelPurchaseResponseDto
                {
                    Id = purchase.Id,
                    VehicleId = purchase.VehicleId,
                    VehicleLicensePlate = vehicle.LicensePlate,
                    VehicleBrand = vehicle.Brand,
                    VehicleModel = vehicle.Model,
                    PurchaseId = purchase.PurchaseId,
                    Code = purchase.Code,
                    FleetCodeName = purchase.FleetCodeName,
                    Fleet = purchase.Fleet,
                    City = purchase.City,
                    Station = purchase.Station,
                    StationCode = purchase.StationCode,
                    DeviceGroups = purchase.DeviceGroups,
                    LicensePlate = purchase.LicensePlate,
                    FuelType = purchase.FuelType,
                    SalesType = purchase.SalesType,
                    UTTS = purchase.UTTS,
                    Quantity = purchase.Quantity,
                    GrossAmount = purchase.GrossAmount,
                    NetAmount = purchase.NetAmount,
                    Discount = purchase.Discount,
                    DiscountType = purchase.DiscountType,
                    UnitPrice = purchase.UnitPrice,
                    VATRate = purchase.VATRate,
                    Mileage = purchase.Mileage,
                    Distributor = purchase.Distributor,
                    PurchaseDate = purchase.PurchaseDate,
                    Period = purchase.Period,
                    TransactionNumber = purchase.TransactionNumber,
                    InvoiceDate = purchase.InvoiceDate,
                    InvoiceNumber = purchase.InvoiceNumber,
                    ReflectionDate = purchase.ReflectionDate,
                    SalesRepresentativeId = purchase.SalesRepresentativeId,
                    SalesRepresentative = purchase.SalesRepresentative,
                    CreatedAt = purchase.CreatedAt
                };

                return CreatedAtAction(nameof(GetFuelPurchase), new { id = purchase.Id }, response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating fuel purchase");
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        /// <summary>
        /// Updates an existing fuel purchase
        /// PUT: api/vehiclefuelpurchases/5
        /// </summary>
        [HttpPut("{id}")]
        public async Task<ActionResult> UpdateFuelPurchase(int id, [FromBody] VehicleFuelPurchaseUpdateDto dto)
        {
            try
            {
                var purchase = await _context.VehicleFuelPurchases.FindAsync(id);

                if (purchase == null)
                {
                    return NotFound(new { message = $"Fuel purchase with ID {id} not found." });
                }

                // Update only provided fields
                if (dto.Quantity.HasValue) purchase.Quantity = dto.Quantity.Value;
                if (dto.GrossAmount.HasValue) purchase.GrossAmount = dto.GrossAmount.Value;
                if (dto.NetAmount.HasValue) purchase.NetAmount = dto.NetAmount.Value;
                if (dto.Discount.HasValue) purchase.Discount = dto.Discount.Value;
                if (!string.IsNullOrEmpty(dto.DiscountType)) purchase.DiscountType = dto.DiscountType.Trim();
                if (dto.UnitPrice.HasValue) purchase.UnitPrice = dto.UnitPrice.Value;
                if (!string.IsNullOrEmpty(dto.VATRate)) purchase.VATRate = dto.VATRate.Trim();
                if (dto.Mileage.HasValue) purchase.Mileage = dto.Mileage.Value;
                if (dto.PurchaseDate.HasValue) purchase.PurchaseDate = dto.PurchaseDate.Value;
                if (!string.IsNullOrEmpty(dto.TransactionNumber)) purchase.TransactionNumber = dto.TransactionNumber.Trim();
                if (dto.InvoiceDate.HasValue) purchase.InvoiceDate = dto.InvoiceDate.Value;
                if (!string.IsNullOrEmpty(dto.InvoiceNumber)) purchase.InvoiceNumber = dto.InvoiceNumber.Trim();
                if (!string.IsNullOrEmpty(dto.SalesRepresentative)) purchase.SalesRepresentative = dto.SalesRepresentative.Trim();

                purchase.UpdatedAt = DateTime.Now;

                await _context.SaveChangesAsync();

                _logger.LogInformation("Fuel purchase updated. ID: {Id}", id);
                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating fuel purchase {Id}", id);
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        /// <summary>
        /// Deletes a fuel purchase
        /// DELETE: api/vehiclefuelpurchases/5
        /// </summary>
        [HttpDelete("{id}")]
        public async Task<ActionResult> DeleteFuelPurchase(int id)
        {
            try
            {
                var purchase = await _context.VehicleFuelPurchases.FindAsync(id);

                if (purchase == null)
                {
                    return NotFound(new { message = $"Fuel purchase with ID {id} not found." });
                }

                _context.VehicleFuelPurchases.Remove(purchase);
                await _context.SaveChangesAsync();

                _logger.LogInformation("Fuel purchase deleted. ID: {Id}", id);
                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting fuel purchase {Id}", id);
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        /// <summary>
        /// Gets fuel purchase statistics
        /// GET: api/vehiclefuelpurchases/stats
        /// </summary>
        [HttpGet("stats")]
        public async Task<ActionResult<VehicleFuelPurchaseStatsDto>> GetStatistics([FromQuery] int? vehicleId = null, [FromQuery] DateTime? fromDate = null, [FromQuery] DateTime? toDate = null)
        {
            try
            {
                var query = _context.VehicleFuelPurchases.AsQueryable();

                if (vehicleId.HasValue)
                {
                    query = query.Where(f => f.VehicleId == vehicleId.Value);
                }

                if (fromDate.HasValue)
                {
                    query = query.Where(f => f.PurchaseDate >= fromDate.Value);
                }

                if (toDate.HasValue)
                {
                    query = query.Where(f => f.PurchaseDate <= toDate.Value);
                }

                var purchases = await query.ToListAsync();

                if (!purchases.Any())
                {
                    return Ok(new VehicleFuelPurchaseStatsDto());
                }

                var fuelTypeStats = purchases
                    .GroupBy(f => f.FuelType)
                    .Select(g => new FuelTypeStatDto
                    {
                        FuelType = g.Key,
                        Count = g.Count(),
                        TotalQuantity = g.Sum(f => f.Quantity),
                        TotalAmount = g.Sum(f => f.NetAmount)
                    })
                    .OrderByDescending(s => s.TotalAmount)
                    .ToList();

                var monthlyStats = purchases
                    .GroupBy(f => new { f.PurchaseDate.Year, f.PurchaseDate.Month })
                    .Select(g => new MonthlyStatDto
                    {
                        Year = g.Key.Year,
                        Month = g.Key.Month,
                        MonthName = CultureInfo.CurrentCulture.DateTimeFormat.GetMonthName(g.Key.Month),
                        Count = g.Count(),
                        TotalQuantity = g.Sum(f => f.Quantity),
                        TotalAmount = g.Sum(f => f.NetAmount)
                    })
                    .OrderBy(s => s.Year)
                    .ThenBy(s => s.Month)
                    .ToList();

                var stats = new VehicleFuelPurchaseStatsDto
                {
                    TotalPurchases = purchases.Count,
                    TotalQuantity = purchases.Sum(f => f.Quantity),
                    TotalGrossAmount = purchases.Sum(f => f.GrossAmount),
                    TotalNetAmount = purchases.Sum(f => f.NetAmount),
                    AverageUnitPrice = purchases.Average(f => f.UnitPrice),
                    AverageQuantityPerPurchase = purchases.Average(f => f.Quantity),
                    MostUsedFuelType = fuelTypeStats.FirstOrDefault()?.FuelType ?? "",
                    MostVisitedStation = purchases.GroupBy(f => f.Station).OrderByDescending(g => g.Count()).FirstOrDefault()?.Key ?? "",
                    FuelTypeStats = fuelTypeStats,
                    MonthlyStats = monthlyStats
                };

                _logger.LogInformation("Fuel purchase statistics retrieved");
                return Ok(stats);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving fuel purchase statistics");
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }
    }
}