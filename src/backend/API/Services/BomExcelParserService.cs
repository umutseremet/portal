using API.Data;
using API.Data.Entities;
using Microsoft.EntityFrameworkCore;
using OfficeOpenXml;

namespace API.Services
{
    public class BomExcelParserService
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<BomExcelParserService> _logger;

        public BomExcelParserService(
            ApplicationDbContext context,
            ILogger<BomExcelParserService> logger)
        {
            _context = context;
            _logger = logger;
            ExcelPackage.LicenseContext = LicenseContext.NonCommercial;
        }

        /// <summary>
        /// Excel dosyasını parse eder ve Items + BomItems tablolarına kaydeder
        /// </summary>
        public async Task<ExcelParseResult> ParseAndSaveExcelAsync(int excelId, string filePath)
        {
            var result = new ExcelParseResult();

            try
            {
                var excel = await _context.BomExcels.FindAsync(excelId);
                if (excel == null)
                {
                    result.Success = false;
                    result.ErrorMessage = "Excel kaydı bulunamadı";
                    return result;
                }

                using var package = new ExcelPackage(new FileInfo(filePath));
                var worksheet = package.Workbook.Worksheets[0]; // İlk sayfa

                if (worksheet == null)
                {
                    result.Success = false;
                    result.ErrorMessage = "Excel sayfası bulunamadı";
                    return result;
                }

                // Kolon başlıklarını bul (1. satır)
                var headerRow = 2;
                var columns = FindColumnIndexes(worksheet, headerRow);

                // Veri satırlarını işle (2. satırdan başla)
                var rowCount = worksheet.Dimension?.Rows ?? 0;
                var processedRows = 0;
                var skippedRows = 0;

                for (int row = headerRow + 1; row <= rowCount; row++)
                {
                    try
                    {
                        // Satırı oku
                        var rowData = ReadRowData(worksheet, row, columns);

                        if (rowData == null || string.IsNullOrWhiteSpace(rowData.ParcaNo))
                        {
                            skippedRows++;
                            continue;
                        }

                        // Items tablosunda ürünü bul veya oluştur
                        var item = await FindOrCreateItemAsync(rowData);

                        // BomItem oluştur
                        var bomItem = new BomItem
                        {
                            ExcelId = excelId,
                            ItemId = item.Id,
                            OgeNo = rowData.OgeNo,
                            Miktar = rowData.Miktar,
                            RowNumber = row - headerRow, // Excel'deki gerçek satır numarası
                            Notes = rowData.Notes,
                            CreatedAt = DateTime.Now
                        };

                        _context.BomItems.Add(bomItem);
                        processedRows++;
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "Satır {Row} işlenirken hata: {Message}", row, ex.Message);
                        skippedRows++;
                    }
                }

                // Excel'in row count'unu güncelle
                excel.RowCount = processedRows;
                excel.IsProcessed = true;
                excel.ProcessingNotes = $"{processedRows} satır işlendi, {skippedRows} satır atlandı";

                await _context.SaveChangesAsync();

                result.Success = true;
                result.ProcessedRows = processedRows;
                result.SkippedRows = skippedRows;
                result.NewItemsCreated = result.NewItemsCreated;

                _logger.LogInformation("Excel {ExcelId} başarıyla işlendi: {Processed} satır",
                    excelId, processedRows);

                return result;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Excel {ExcelId} parse edilirken hata", excelId);
                result.Success = false;
                result.ErrorMessage = ex.Message;
                return result;
            }
        }

        /// <summary>
        /// Excel kolon indekslerini bulur
        /// </summary>
        private Dictionary<string, int> FindColumnIndexes(ExcelWorksheet worksheet, int headerRow)
        {
            var columns = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase);
            var colCount = worksheet.Dimension?.Columns ?? 0;

            for (int col = 1; col <= colCount; col++)
            {
                var header = worksheet.Cells[headerRow, col].Text?.Trim();
                if (string.IsNullOrEmpty(header)) continue;

                // Kolon eşleştirmeleri
                if (header.Contains("ÖĞE NO", StringComparison.OrdinalIgnoreCase))
                    columns["OgeNo"] = col;
                else if (header.Contains("PARÇA", StringComparison.OrdinalIgnoreCase))
                    columns["ParcaNo"] = col;
                else if (header.Contains("DOKUMAN", StringComparison.OrdinalIgnoreCase) ||
                         header.Contains("DokumanNumarasi", StringComparison.OrdinalIgnoreCase))
                    columns["DokumanNo"] = col;
                else if (header.Contains("MALZEME", StringComparison.OrdinalIgnoreCase))
                    columns["Malzeme"] = col;
                else if (header.Contains("MİKT", StringComparison.OrdinalIgnoreCase) && !columns.ContainsKey("Miktar"))
                    columns["Miktar"] = col;
                else if (header.Contains("X YÖNÜ", StringComparison.OrdinalIgnoreCase) ||
                         header.Contains("X Yönü", StringComparison.OrdinalIgnoreCase))
                    columns["XYonu"] = col;
                else if (header.Contains("Y YÖNÜ", StringComparison.OrdinalIgnoreCase) ||
                         header.Contains("Y Yönü", StringComparison.OrdinalIgnoreCase))
                    columns["YYonu"] = col;
                else if (header.Contains("Z YÖNÜ", StringComparison.OrdinalIgnoreCase) ||
                         header.Contains("Z Yönü", StringComparison.OrdinalIgnoreCase))
                    columns["ZYonu"] = col;
                else if (header.Contains("AÇIKLAMA", StringComparison.OrdinalIgnoreCase))
                    columns["Notes"] = col;
                else if (header.Contains("ESKİ KOD", StringComparison.OrdinalIgnoreCase))
                    columns["EskiKod"] = col;
            }

            return columns;
        }

        /// <summary>
        /// Excel satırından veriyi okur
        /// </summary>
        private ExcelRowData? ReadRowData(ExcelWorksheet worksheet, int row, Dictionary<string, int> columns)
        {
            var data = new ExcelRowData();

            if (columns.ContainsKey("OgeNo"))
                data.OgeNo = worksheet.Cells[row, columns["OgeNo"]].Text?.Trim();

            if (columns.ContainsKey("ParcaNo"))
                data.ParcaNo = worksheet.Cells[row, columns["ParcaNo"]].Text?.Trim();

            if (columns.ContainsKey("DokumanNo"))
                data.DokumanNo = worksheet.Cells[row, columns["DokumanNo"]].Text?.Trim();

            if (columns.ContainsKey("Malzeme"))
                data.Malzeme = worksheet.Cells[row, columns["Malzeme"]].Text?.Trim();

            if (columns.ContainsKey("Miktar"))
            {
                var miktarText = worksheet.Cells[row, columns["Miktar"]].Text?.Trim();
                if (int.TryParse(miktarText, out int miktar))
                    data.Miktar = miktar;
            }

            if (columns.ContainsKey("XYonu"))
            {
                var xText = worksheet.Cells[row, columns["XYonu"]].Text?.Trim();
                if (int.TryParse(xText, out int x))
                    data.X = x;
            }

            if (columns.ContainsKey("YYonu"))
            {
                var yText = worksheet.Cells[row, columns["YYonu"]].Text?.Trim();
                if (int.TryParse(yText, out int y))
                    data.Y = y;
            }

            if (columns.ContainsKey("ZYonu"))
            {
                var zText = worksheet.Cells[row, columns["ZYonu"]].Text?.Trim();
                if (int.TryParse(zText, out int z))
                    data.Z = z;
            }

            if (columns.ContainsKey("Notes"))
                data.Notes = worksheet.Cells[row, columns["Notes"]].Text?.Trim();

            if (columns.ContainsKey("EskiKod"))
                data.EskiKod = worksheet.Cells[row, columns["EskiKod"]].Text?.Trim();

            return data;
        }

        /// <summary>
        /// Items tablosunda ürünü bulur veya yeni oluşturur
        /// Aynı Code'a sahip ürün varsa onu döndürür, yoksa yeni ürün oluşturur
        /// </summary>
        private async Task<Item> FindOrCreateItemAsync(ExcelRowData rowData)
        {
            var code = rowData.ParcaNo?.Trim() ?? "";
            if (string.IsNullOrEmpty(code))
            {
                throw new Exception("Parça numarası boş olamaz");
            }

            // Önce Items tablosunda bu code ile ürün var mı kontrol et
            var existingItem = await _context.Items
                .FirstOrDefaultAsync(i => i.Code == code);

            if (existingItem != null)
            {
                _logger.LogDebug("Ürün bulundu: {Code}", code);
                return existingItem;
            }

            // Yoksa yeni ürün oluştur
            var maxNumber = await _context.Items.MaxAsync(i => (int?)i.Number) ?? 0;

            // ✅ DEĞİŞİKLİK: Excel'deki Malzeme kolonunu ItemGroup olarak kullan
            var groupName = rowData.Malzeme?.Trim();
            if (string.IsNullOrEmpty(groupName))
            {
                groupName = "Tanımsız Grup";
            }

            // ✅ DEĞİŞİKLİK: İlgili grubu bul veya oluştur
            var itemGroup = await _context.ItemGroups
                .FirstOrDefaultAsync(g => g.Name == groupName);

            if (itemGroup == null)
            {
                itemGroup = new ItemGroup
                {
                    Name = groupName,
                    CreatedAt = DateTime.Now
                };
                _context.ItemGroups.Add(itemGroup);
                await _context.SaveChangesAsync();
                _logger.LogInformation("Yeni ürün grubu oluşturuldu: {GroupName}", groupName);
            }

            var newItem = new Item
            {
                Number = maxNumber + 1,
                Code = code,
                Name = groupName, // Malzeme adını ürün adı olarak kullan
                DocNumber = rowData.DokumanNo ?? "",
                GroupId = itemGroup.Id, // ✅ Artık dinamik grup ID kullanılıyor
                X = rowData.X,
                Y = rowData.Y,
                Z = rowData.Z,
                CreatedAt = DateTime.Now,
                Cancelled = false,
                SupplierCode = rowData.EskiKod ?? "",
                Price = 0,
                Supplier = "",
                Unit = "Adet"
            };

            _context.Items.Add(newItem);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Yeni ürün oluşturuldu: {Code} - {Name} (Grup: {Group})",
                code, newItem.Name, groupName);

            return newItem;
        }
    }

    /// <summary>
    /// Excel satır verisi
    /// </summary>
    public class ExcelRowData
    {
        public string? OgeNo { get; set; }
        public string? ParcaNo { get; set; }
        public string? DokumanNo { get; set; }
        public string? Malzeme { get; set; }
        public int? Miktar { get; set; }
        public int? X { get; set; }
        public int? Y { get; set; }
        public int? Z { get; set; }
        public string? Notes { get; set; }
        public string? EskiKod { get; set; }
    }

    /// <summary>
    /// Excel parse sonucu
    /// </summary>
    public class ExcelParseResult
    {
        public bool Success { get; set; }
        public string? ErrorMessage { get; set; }
        public int ProcessedRows { get; set; }
        public int SkippedRows { get; set; }
        public int NewItemsCreated { get; set; }
    }
}