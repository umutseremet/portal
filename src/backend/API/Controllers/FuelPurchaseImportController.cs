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
                            .ToDictionaryAsync(v => v.LicensePlate.Replace(" ", "").ToUpper(), v => v);

                        // Get existing transaction numbers to avoid duplicates
                        var existingTransactionsList = await _context.VehicleFuelPurchases
                            .Select(f => f.TransactionNumber)
                            .ToListAsync();
                        var existingTransactions = new HashSet<string>(existingTransactionsList);

                        for (int row = 2; row <= rowCount; row++)
                        {
                            try
                            {
                                // ✅ GÜNCEL EXCEL KOLON İNDEKSLERİ (40 KOLONLU YENİ FORMAT)
                                // Plaka kolonunu normalize et (boşlukları kaldır)
                                var licensePlateRaw = worksheet.Cells[row, 19].Text.Trim(); // Kolon 19: Plaka
                                var licensePlate = licensePlateRaw.Replace(" ", "").ToUpper();

                                var transactionNumber = worksheet.Cells[row, 35].Text.Trim(); // Kolon 35: İşlem Numarası

                                // Skip if already exists
                                if (!string.IsNullOrEmpty(transactionNumber) && existingTransactions.Contains(transactionNumber))
                                {
                                    skippedCount++;
                                    warnings.Add($"Row {row}: Transaction {transactionNumber} already exists, skipped.");
                                    continue;
                                }

                                // Find vehicle by license plate
                                if (!vehicles.TryGetValue(licensePlate, out var vehicle))
                                {
                                    failCount++;
                                    errors.Add($"Row {row}: Vehicle with license plate '{licensePlateRaw}' not found.");
                                    continue;
                                }

                                // Parse dates with error handling
                                DateTime purchaseDate, period, invoiceDate, reflectionDate;

                                // Kolon 33: Tarih (Purchase Date)
                                if (!DateTime.TryParse(worksheet.Cells[row, 33].Text, out purchaseDate))
                                {
                                    failCount++;
                                    errors.Add($"Row {row}: Invalid purchase date format.");
                                    continue;
                                }

                                // Kolon 34: Dönem (Period)
                                if (!DateTime.TryParse(worksheet.Cells[row, 34].Text, out period))
                                {
                                    period = purchaseDate; // Default to purchase date
                                }

                                // Kolon 36: Fatura Tarihi (Invoice Date)
                                if (!DateTime.TryParse(worksheet.Cells[row, 36].Text, out invoiceDate))
                                {
                                    invoiceDate = purchaseDate; // Default to purchase date
                                }

                                // Kolon 38: Yansıma Tarihi (Reflection Date)
                                if (!DateTime.TryParse(worksheet.Cells[row, 38].Text, out reflectionDate))
                                {
                                    reflectionDate = purchaseDate; // Default to purchase date
                                }

                                // Parse numeric values with error handling
                                if (!long.TryParse(worksheet.Cells[row, 1].Text, out long purchaseId))
                                {
                                    purchaseId = 0;
                                }

                                // Kolon 24: Miktar (Quantity)
                                if (!decimal.TryParse(worksheet.Cells[row, 24].Text.Replace(",", "."),
                                    System.Globalization.NumberStyles.Any,
                                    System.Globalization.CultureInfo.InvariantCulture,
                                    out decimal quantity))
                                {
                                    failCount++;
                                    errors.Add($"Row {row}: Invalid quantity value.");
                                    continue;
                                }

                                // Kolon 26: Net Tutar (Net Amount)
                                if (!decimal.TryParse(worksheet.Cells[row, 26].Text.Replace(",", "."),
                                    System.Globalization.NumberStyles.Any,
                                    System.Globalization.CultureInfo.InvariantCulture,
                                    out decimal netAmount))
                                {
                                    netAmount = 0;
                                }

                                // Kolon 25: Brüt Tutar (Gross Amount)
                                if (!decimal.TryParse(worksheet.Cells[row, 25].Text.Replace(",", "."),
                                    System.Globalization.NumberStyles.Any,
                                    System.Globalization.CultureInfo.InvariantCulture,
                                    out decimal grossAmount))
                                {
                                    grossAmount = netAmount; // Fallback to net amount
                                }

                                // Kolon 27: İskonto (Discount)
                                if (!decimal.TryParse(worksheet.Cells[row, 27].Text.Replace(",", "."),
                                    System.Globalization.NumberStyles.Any,
                                    System.Globalization.CultureInfo.InvariantCulture,
                                    out decimal discount))
                                {
                                    discount = 0;
                                }

                                // Kolon 29: Birim Fiyatı (Unit Price)
                                if (!decimal.TryParse(worksheet.Cells[row, 29].Text.Replace(",", "."),
                                    System.Globalization.NumberStyles.Any,
                                    System.Globalization.CultureInfo.InvariantCulture,
                                    out decimal unitPrice))
                                {
                                    unitPrice = 0;
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
                                    DeviceGroups = worksheet.Cells[row, 15].Text.Trim(), // Kolon 15: Cihaz Grupları
                                    DeviceDescription = worksheet.Cells[row, 20].Text.Trim(), // Kolon 20: Cihaz Açıklaması
                                    LicensePlate = licensePlateRaw, // Orijinal formatı sakla
                                    FuelType = worksheet.Cells[row, 21].Text.Trim(), // Kolon 21: Tip
                                    SalesType = worksheet.Cells[row, 22].Text.Trim(), // Kolon 22: Satış Tipi
                                    UTTS = worksheet.Cells[row, 23].Text.Trim(), // Kolon 23: UTTS
                                    Quantity = quantity,
                                    GrossAmount = grossAmount,
                                    NetAmount = netAmount,
                                    Discount = discount,
                                    DiscountType = worksheet.Cells[row, 28].Text.Trim(), // Kolon 28: İskonto Tipi
                                    UnitPrice = unitPrice,
                                    VATRate = worksheet.Cells[row, 30].Text.Trim(), // Kolon 30: KDV Oranı
                                    Mileage = int.TryParse(worksheet.Cells[row, 31].Text, out int mileage) ? mileage : 0, // Kolon 31: Kilometre
                                    Distributor = worksheet.Cells[row, 32].Text.Trim(), // Kolon 32: Distribütör
                                    PurchaseDate = purchaseDate,
                                    Period = period,
                                    TransactionNumber = transactionNumber,
                                    InvoiceDate = invoiceDate,
                                    InvoiceNumber = worksheet.Cells[row, 37].Text.Trim(), // Kolon 37: Fatura Numarası
                                    ReflectionDate = reflectionDate,
                                    SalesRepresentativeId = long.TryParse(worksheet.Cells[row, 39].Text, out long salesRepId) ? salesRepId : 0, // Kolon 39
                                    SalesRepresentative = worksheet.Cells[row, 40].Text.Trim(), // Kolon 40: Satış Temsilcisi
                                    CreatedAt = DateTime.Now
                                };

                                _context.VehicleFuelPurchases.Add(purchase);
                                if (!string.IsNullOrEmpty(transactionNumber))
                                {
                                    existingTransactions.Add(transactionNumber);
                                }
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

            if (!file.FileName.EndsWith(".xlsx") && !file.FileName.EndsWith(".xls"))
            {
                return BadRequest(new { message = "Only Excel files (.xlsx, .xls) are supported." });
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

                        // ✅ GÜNCEL BEKLENEN KOLONLAR (40 KOLONLU YENİ FORMAT)
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
                            { 10, "Terminal" },
                            { 11, "Giriş Kapısı" },
                            { 12, "Çıkış Kapısı" },
                            { 13, "Giriş Tarihi" },
                            { 14, "Çıkış Tarihi" },
                            { 15, "Cihaz Grupları" },
                            { 16, "Cihaz ID" },
                            { 17, "Cihaz Numarası" },
                            { 18, "Kart Numarası" },
                            { 19, "Plaka" },
                            { 20, "Cihaz Açıklaması" },
                            { 21, "Tip" },
                            { 22, "Satış Tipi" },
                            { 23, "UTTS" },
                            { 24, "Miktar" },
                            { 25, "Brüt Tutar" },
                            { 26, "Net Tutar" },
                            { 27, "İskonto" },
                            { 28, "İskonto Tipi" },
                            { 29, "Birim Fiyatı" },
                            { 30, "KDV Oranı" },
                            { 31, "Kilometre" },
                            { 32, "Distribütör" },
                            { 33, "Tarih" },
                            { 34, "Dönem" },
                            { 35, "İşlem Numarası" },
                            { 36, "Fatura Tarihi" },
                            { 37, "Fatura Numarası" },
                            { 38, "Yansıma Tarihi" },
                            { 39, "Satış Temsilcisi ID" },
                            { 40, "Satış Temsilcisi" }
                        };

                        var validationErrors = new List<string>();
                        var validationWarnings = new List<string>();

                        // Check column count
                        if (colCount < 40)
                        {
                            validationErrors.Add($"Expected 40 columns, found {colCount}. Please use the latest Excel format.");
                        }

                        // Validate header row
                        foreach (var expectedCol in expectedColumns)
                        {
                            if (expectedCol.Key <= colCount)
                            {
                                var headerValue = worksheet.Cells[1, expectedCol.Key].Text.Trim();
                                if (headerValue != expectedCol.Value)
                                {
                                    validationWarnings.Add(
                                        $"Column {expectedCol.Key}: Expected '{expectedCol.Value}', found '{headerValue}'");
                                }
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
                            var licensePlate = worksheet.Cells[row, 19].Text.Trim(); // Kolon 19: Plaka
                            if (!string.IsNullOrEmpty(licensePlate))
                            {
                                licensePlates.Add(licensePlate.Replace(" ", "").ToUpper());
                            }
                        }

                        // Check if vehicles exist
                        var existingVehicles = await _context.Vehicles
                            .Where(v => licensePlates.Contains(v.LicensePlate.Replace(" ", "").ToUpper()))
                            .Select(v => v.LicensePlate.Replace(" ", "").ToUpper())
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
            return Ok(new
            {
                templateVersion = "2.0",
                requiredColumns = 40,
                columns = new[]
                {
                    "ID", "Distributör ID", "Distribütör Kodu ID", "Kod", "Filo Kod Adı",
                    "Filo", "Şehir", "İstasyon", "İstasyon Kodu", "Terminal",
                    "Giriş Kapısı", "Çıkış Kapısı", "Giriş Tarihi", "Çıkış Tarihi", "Cihaz Grupları",
                    "Cihaz ID", "Cihaz Numarası", "Kart Numarası", "Plaka", "Cihaz Açıklaması",
                    "Tip", "Satış Tipi", "UTTS", "Miktar", "Brüt Tutar",
                    "Net Tutar", "İskonto", "İskonto Tipi", "Birim Fiyatı", "KDV Oranı",
                    "Kilometre", "Distribütör", "Tarih", "Dönem", "İşlem Numarası",
                    "Fatura Tarihi", "Fatura Numarası", "Yansıma Tarihi", "Satış Temsilcisi ID", "Satış Temsilcisi"
                },
                notes = new[]
                {
                    "Excel dosyasında 40 kolon olmalıdır",
                    "Plaka kolonu (19. kolon) zorunludur",
                    "Miktar, tutarlar ve tarihler doğru formatta olmalıdır",
                    "İşlem Numarası (35. kolon) tekrarlayan kayıtları önler"
                }
            });
        }
    }
}