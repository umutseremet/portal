using API.Data;
using API.Data.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OfficeOpenXml;

namespace API.Controllers
{
#if !DEBUG
    [Authorize]
#endif
    [Route("api/[controller]")]
    [ApiController]
    public class FuelPurchaseImportController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<FuelPurchaseImportController> _logger;

        public FuelPurchaseImportController(
            ApplicationDbContext context,
            ILogger<FuelPurchaseImportController> logger)
        {
            _context = context;
            _logger = logger;
        }

        /// <summary>
        /// Import fuel purchases from Excel file
        /// POST: api/fuelpurchaseimport
        /// </summary>
        [HttpPost]
        public async Task<ActionResult<object>> ImportFromExcel(IFormFile file)
        {
            if (file == null || file.Length == 0)
            {
                return BadRequest(new { message = "Please upload a valid Excel file." });
            }

            if (!file.FileName.EndsWith(".xlsx") && !file.FileName.EndsWith(".xls"))
            {
                return BadRequest(new { message = "Only Excel files (.xlsx, .xls) are supported." });
            }

            try
            {
                // Set EPPlus license context
                ExcelPackage.LicenseContext = LicenseContext.NonCommercial;

                var successCount = 0;
                var failCount = 0;
                var skippedCount = 0;
                var errors = new List<string>();
                var warnings = new List<string>();

                using (var stream = new MemoryStream())
                {
                    await file.CopyToAsync(stream);
                    stream.Position = 0;

                    using (var package = new ExcelPackage(stream))
                    {
                        var worksheet = package.Workbook.Worksheets[0];
                        var rowCount = worksheet.Dimension?.Rows ?? 0;

                        if (rowCount <= 1)
                        {
                            return BadRequest(new { message = "Excel file is empty or has no data rows." });
                        }

                        _logger.LogInformation("Starting import of {RowCount} rows from Excel", rowCount - 1);

                        // Get all vehicles to cache license plate lookups
                        var vehicles = await _context.Vehicles
                            .ToDictionaryAsync(v => v.LicensePlate.ToUpper(), v => v);

                        // Get existing transaction numbers to avoid duplicates
                        var existingTransactionsList = await _context.VehicleFuelPurchases
                            .Select(f => f.TransactionNumber)
                            .ToListAsync();
                        var existingTransactions = new HashSet<string>(existingTransactionsList);

                        for (int row = 2; row <= rowCount; row++)
                        {
                            try
                            {
                                // Read Excel columns (adjust column indices based on your Excel structure)
                                var licensePlate = worksheet.Cells[row, 11].Text.Trim().ToUpper(); // Plaka column
                                var transactionNumber = worksheet.Cells[row, 27].Text.Trim(); // İşlem Numarası

                                // Skip if already exists
                                if (existingTransactions.Contains(transactionNumber))
                                {
                                    skippedCount++;
                                    warnings.Add($"Row {row}: Transaction {transactionNumber} already exists, skipped.");
                                    continue;
                                }

                                // Find vehicle by license plate
                                if (!vehicles.TryGetValue(licensePlate, out var vehicle))
                                {
                                    failCount++;
                                    errors.Add($"Row {row}: Vehicle with license plate '{licensePlate}' not found.");
                                    continue;
                                }

                                // Parse dates with error handling
                                DateTime purchaseDate, period, invoiceDate, reflectionDate;

                                if (!DateTime.TryParse(worksheet.Cells[row, 25].Text, out purchaseDate))
                                {
                                    failCount++;
                                    errors.Add($"Row {row}: Invalid purchase date format.");
                                    continue;
                                }

                                if (!DateTime.TryParse(worksheet.Cells[row, 26].Text, out period))
                                {
                                    period = purchaseDate; // Default to purchase date
                                }

                                if (!DateTime.TryParse(worksheet.Cells[row, 28].Text, out invoiceDate))
                                {
                                    invoiceDate = purchaseDate; // Default to purchase date
                                }

                                if (!DateTime.TryParse(worksheet.Cells[row, 30].Text, out reflectionDate))
                                {
                                    reflectionDate = purchaseDate; // Default to purchase date
                                }

                                // Parse numeric values with error handling
                                if (!long.TryParse(worksheet.Cells[row, 1].Text, out long purchaseId))
                                {
                                    purchaseId = 0;
                                }

                                if (!decimal.TryParse(worksheet.Cells[row, 16].Text, out decimal quantity))
                                {
                                    failCount++;
                                    errors.Add($"Row {row}: Invalid quantity value.");
                                    continue;
                                }

                                if (!decimal.TryParse(worksheet.Cells[row, 18].Text, out decimal netAmount))
                                {
                                    netAmount = 0;
                                }

                                // Create fuel purchase entity
                                var purchase = new VehicleFuelPurchase
                                {
                                    VehicleId = vehicle.Id,
                                    PurchaseId = purchaseId,
                                    DistributorId = long.TryParse(worksheet.Cells[row, 2].Text, out long distId) ? distId : 0,
                                    DistributorCodeId = long.TryParse(worksheet.Cells[row, 3].Text, out long distCodeId) ? distCodeId : 0,
                                    Code = worksheet.Cells[row, 4].Text.Trim(),
                                    FleetCodeName = worksheet.Cells[row, 5].Text.Trim(),
                                    Fleet = worksheet.Cells[row, 6].Text.Trim(),
                                    City = worksheet.Cells[row, 7].Text.Trim(),
                                    Station = worksheet.Cells[row, 8].Text.Trim(),
                                    StationCode = worksheet.Cells[row, 9].Text.Trim(),
                                    DeviceGroups = worksheet.Cells[row, 10].Text.Trim(),
                                    LicensePlate = licensePlate,
                                    FuelType = worksheet.Cells[row, 13].Text.Trim(),
                                    SalesType = worksheet.Cells[row, 14].Text.Trim(),
                                    UTTS = worksheet.Cells[row, 15].Text.Trim(),
                                    Quantity = quantity,
                                    GrossAmount = decimal.TryParse(worksheet.Cells[row, 17].Text, out decimal gross) ? gross : 0,
                                    NetAmount = netAmount,
                                    Discount = decimal.TryParse(worksheet.Cells[row, 19].Text, out decimal discount) ? discount : 0,
                                    DiscountType = worksheet.Cells[row, 20].Text.Trim(),
                                    UnitPrice = decimal.TryParse(worksheet.Cells[row, 21].Text, out decimal unitPrice) ? unitPrice : 0,
                                    VATRate = worksheet.Cells[row, 22].Text.Trim(),
                                    Mileage = int.TryParse(worksheet.Cells[row, 23].Text, out int mileage) ? mileage : 0,
                                    Distributor = worksheet.Cells[row, 24].Text.Trim(),
                                    PurchaseDate = purchaseDate,
                                    Period = period,
                                    TransactionNumber = transactionNumber,
                                    InvoiceDate = invoiceDate,
                                    InvoiceNumber = worksheet.Cells[row, 29].Text.Trim(),
                                    ReflectionDate = reflectionDate,
                                    SalesRepresentativeId = long.TryParse(worksheet.Cells[row, 31].Text, out long salesRepId) ? salesRepId : 0,
                                    SalesRepresentative = worksheet.Cells[row, 32].Text.Trim(),
                                    CreatedAt = DateTime.Now
                                };

                                _context.VehicleFuelPurchases.Add(purchase);
                                existingTransactions.Add(transactionNumber);
                                successCount++;

                                // Save in batches of 50 for better performance
                                if (successCount % 50 == 0)
                                {
                                    await _context.SaveChangesAsync();
                                    _logger.LogInformation("Saved batch of 50 records. Total: {Count}", successCount);
                                }
                            }
                            catch (Exception ex)
                            {
                                failCount++;
                                errors.Add($"Row {row}: {ex.Message}");
                                _logger.LogError(ex, "Error importing row {Row}", row);
                            }
                        }

                        // Save remaining records
                        if (successCount % 50 != 0)
                        {
                            await _context.SaveChangesAsync();
                        }

                        _logger.LogInformation(
                            "Import completed. Success: {Success}, Failed: {Failed}, Skipped: {Skipped}",
                            successCount, failCount, skippedCount);

                        return Ok(new
                        {
                            totalRows = rowCount - 1,
                            successCount,
                            failCount,
                            skippedCount,
                            errors = errors.Take(100).ToList(), // Limit errors to first 100
                            warnings = warnings.Take(50).ToList() // Limit warnings to first 50
                        });
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during Excel import");
                return StatusCode(500, new
                {
                    message = "Error importing Excel file",
                    error = ex.Message
                });
            }
        }

        /// <summary>
        /// Validate Excel file structure before import
        /// POST: api/fuelpurchaseimport/validate
        /// </summary>
        [HttpPost("validate")]
        public async Task<ActionResult<object>> ValidateExcelFile(IFormFile file)
        {
            if (file == null || file.Length == 0)
            {
                return BadRequest(new { message = "Please upload a valid Excel file." });
            }

            try
            {
                ExcelPackage.LicenseContext = LicenseContext.NonCommercial;

                using (var stream = new MemoryStream())
                {
                    await file.CopyToAsync(stream);
                    stream.Position = 0;

                    using (var package = new ExcelPackage(stream))
                    {
                        var worksheet = package.Workbook.Worksheets[0];
                        var rowCount = worksheet.Dimension?.Rows ?? 0;
                        var colCount = worksheet.Dimension?.Columns ?? 0;

                        // Expected columns
                        var expectedColumns = new Dictionary<int, string>
                        {
                            { 1, "ID" },
                            { 2, "Distributör ID" },
                            { 3, "Distribütör Kodu ID" },
                            { 4, "Kod" },
                            { 5, "Filo Kod Adı" },
                            { 6, "Filo" },
                            { 7, "Şehir" },
                            { 8, "İstasyon" },
                            { 9, "İstasyon Kodu" },
                            { 10, "Cihaz Grupları" },
                            { 11, "Plaka" },
                            {12, "Cihaz Açıklaması" },
                            { 13, "Tip" },
                            { 14, "Satış Tipi" },
                            { 15, "UTTS" },
                            { 16, "Miktar" },
                            { 17, "Brüt Tutar" },
                            { 18, "Net Tutar" },
                            { 19, "İskonto" },
                            { 20, "İskonto Tipi" },
                            { 21, "Birim Fiyatı" },
                            { 22, "KDV Oranı" },
                            { 23, "Kilometre" },
                            { 24, "Distribütör" },
                            { 25, "Tarih" },
                            { 26, "Dönem" },
                            { 27, "İşlem Numarası" },
                            { 28, "Fatura Tarihi" },
                            { 29, "Fatura Numarası" },
                            { 30, "Yansıma Tarihi" },
                            { 31, "Satış Temsilcisi ID" },
                            { 32, "Satış Temsilcisi" }
                        };

                        var validationErrors = new List<string>();
                        var validationWarnings = new List<string>();

                        // Check column count
                        if (colCount < 32)
                        {
                            validationErrors.Add($"Expected 32 columns, found {colCount}");
                        }

                        // Validate header row
                        foreach (var expectedCol in expectedColumns)
                        {
                            var headerValue = worksheet.Cells[1, expectedCol.Key].Text.Trim();
                            if (headerValue != expectedCol.Value)
                            {
                                validationWarnings.Add(
                                    $"Column {expectedCol.Key}: Expected '{expectedCol.Value}', found '{headerValue}'");
                            }
                        }

                        // Check for data rows
                        if (rowCount <= 1)
                        {
                            validationErrors.Add("No data rows found in Excel file");
                        }

                        // Sample a few rows for validation
                        var sampleSize = Math.Min(5, rowCount - 1);
                        var licensePlates = new HashSet<string>();

                        for (int row = 2; row <= Math.Min(2 + sampleSize, rowCount); row++)
                        {
                            var licensePlate = worksheet.Cells[row, 11].Text.Trim();
                            if (!string.IsNullOrEmpty(licensePlate))
                            {
                                licensePlates.Add(licensePlate.ToUpper());
                            }
                        }

                        // Check if vehicles exist
                        var existingVehicles = await _context.Vehicles
                            .Where(v => licensePlates.Contains(v.LicensePlate.ToUpper()))
                            .Select(v => v.LicensePlate.ToUpper())
                            .ToListAsync();

                        var missingVehicles = licensePlates.Except(existingVehicles).ToList();
                        if (missingVehicles.Any())
                        {
                            validationWarnings.Add(
                                $"Sample check: {missingVehicles.Count} vehicles not found in database: {string.Join(", ", missingVehicles.Take(5))}");
                        }

                        var isValid = !validationErrors.Any();

                        return Ok(new
                        {
                            isValid,
                            fileName = file.FileName,
                            fileSize = file.Length,
                            totalRows = rowCount - 1,
                            totalColumns = colCount,
                            errors = validationErrors,
                            warnings = validationWarnings,
                            sampleLicensePlates = licensePlates.Take(5).ToList(),
                            existingVehiclesCount = existingVehicles.Count,
                            missingVehiclesCount = missingVehicles.Count
                        });
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error validating Excel file");
                return StatusCode(500, new
                {
                    message = "Error validating Excel file",
                    error = ex.Message
                });
            }
        }

        /// <summary>
        /// Get import template information
        /// GET: api/fuelpurchaseimport/template
        /// </summary>
        [HttpGet("template")]
        public ActionResult<object> GetTemplateInfo()
        {
            var templateInfo = new
            {
                requiredColumns = new[]
                {
                    new { column = "A", name = "ID", type = "number", required = true },
                    new { column = "B", name = "Distributör ID", type = "number", required = true },
                    new { column = "C", name = "Distribütör Kodu ID", type = "number", required = true },
                    new { column = "D", name = "Kod", type = "text", required = true },
                    new { column = "E", name = "Filo Kod Adı", type = "text", required = true },
                    new { column = "F", name = "Filo", type = "text", required = true },
                    new { column = "G", name = "Şehir", type = "text", required = true },
                    new { column = "H", name = "İstasyon", type = "text", required = true },
                    new { column = "I", name = "İstasyon Kodu", type = "text", required = true },
                    new { column = "J", name = "Cihaz Grupları", type = "text", required = false },
                    new { column = "K", name = "Plaka", type = "text", required = true },
                    new { column = "L", name = "Tip", type = "text", required = true },
                    new { column = "M", name = "Satış Tipi", type = "text", required = true },
                    new { column = "N", name = "UTTS", type = "text", required = true },
                    new { column = "O", name = "Miktar", type = "decimal", required = true },
                    new { column = "P", name = "Brüt Tutar", type = "decimal", required = true },
                    new { column = "Q", name = "Net Tutar", type = "decimal", required = true },
                    new { column = "R", name = "İskonto", type = "decimal", required = true },
                    new { column = "S", name = "İskonto Tipi", type = "text", required = true },
                    new { column = "T", name = "Birim Fiyatı", type = "decimal", required = true },
                    new { column = "U", name = "KDV Oranı", type = "text", required = true },
                    new { column = "V", name = "Kilometre", type = "number", required = false },
                    new { column = "W", name = "Distribütör", type = "text", required = true },
                    new { column = "X", name = "Tarih", type = "datetime", required = true },
                    new { column = "Y", name = "Dönem", type = "datetime", required = true },
                    new { column = "Z", name = "İşlem Numarası", type = "text", required = true },
                    new { column = "AA", name = "Fatura Tarihi", type = "datetime", required = true },
                    new { column = "AB", name = "Fatura Numarası", type = "text", required = true },
                    new { column = "AC", name = "Yansıma Tarihi", type = "datetime", required = true },
                    new { column = "AD", name = "Satış Temsilcisi ID", type = "number", required = true },
                    new { column = "AE", name = "Satış Temsilcisi", type = "text", required = true }
                },
                importNotes = new[]
                {
                    "Plaka kolonu Vehicles tablosundaki LicensePlate ile eşleşmelidir",
                    "İşlem Numarası (Transaction Number) benzersiz olmalıdır",
                    "Tarih formatı: YYYY-MM-DD veya Excel date format",
                    "Decimal değerler nokta (.) ile ayrılmalıdır",
                    "Duplicate transaction numbers otomatik olarak atlanır"
                }
            };

            return Ok(templateInfo);
        }
    }
}