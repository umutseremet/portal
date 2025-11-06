using API.Data;
using API.Data.Entities;
using Microsoft.EntityFrameworkCore;
using OfficeOpenXml;
using OfficeOpenXml.Drawing;
using System.Drawing;

namespace API.Services
{
    public class BomExcelParserService
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<BomExcelParserService> _logger;
        private readonly IWebHostEnvironment _environment;

        public BomExcelParserService(
            ApplicationDbContext context,
            ILogger<BomExcelParserService> logger,
            IWebHostEnvironment environment)
        {
            _context = context;
            _logger = logger;
            _environment = environment;
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

                // ✅ RESİMLERİ İŞLE VE KAYDET
                var imageMap = await ProcessAndSaveImagesAsync(worksheet, excelId);

                // Kolon başlıklarını bul (2. satır)
                var headerRow = 2;
                var columns = FindColumnIndexes(worksheet, headerRow);

                // Veri satırlarını işle (3. satırdan başla)
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

                        // ✅ Bu satır için resim var mı kontrol et
                        var imageInfo = GetImageForRow(imageMap, row);

                        // Items tablosunda ürünü bul veya oluştur (resim bilgisi ile)
                        var item = await FindOrCreateItemAsync(rowData, imageInfo.ImagePath);

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
                excel.ProcessingNotes = $"{processedRows} satır işlendi, {skippedRows} satır atlandı. {imageMap.Count} resim kaydedildi.";

                await _context.SaveChangesAsync();

                result.Success = true;
                result.ProcessedRows = processedRows;
                result.SkippedRows = skippedRows;
                result.NewItemsCreated = result.NewItemsCreated;

                _logger.LogInformation("Excel {ExcelId} başarıyla işlendi: {Processed} satır, {Images} resim",
                    excelId, processedRows, imageMap.Count);

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
        /// Excel'deki resimleri işler ve kaydeder
        /// </summary>
        private async Task<Dictionary<int, (string ImagePath, int ImageRow, int ImageCol)>> ProcessAndSaveImagesAsync(
            ExcelWorksheet worksheet, int excelId)
        {
            var imageMap = new Dictionary<int, (string, int, int)>();

            if (worksheet.Drawings.Count == 0)
            {
                _logger.LogInformation("Excel'de resim bulunamadı");
                return imageMap;
            }

            // Resim klasörünü oluştur: Uploads/BOM/Images/{excelId}/
            var imageFolder = Path.Combine(_environment.ContentRootPath, "Uploads", "BOM", "Images", excelId.ToString());
            if (!Directory.Exists(imageFolder))
            {
                Directory.CreateDirectory(imageFolder);
                _logger.LogInformation("Resim klasörü oluşturuldu: {Folder}", imageFolder);
            }

            int imageIndex = 0;
            _logger.LogInformation("Excel'de toplam {Count} resim bulundu", worksheet.Drawings.Count);

            foreach (var drawing in worksheet.Drawings)
            {
                if (drawing is ExcelPicture picture)
                {
                    try
                    {
                        imageIndex++;
                        int imageRow = picture.From.Row + 1; // EPPlus sıfır indeksli, biz 1 indeksli
                        int imageCol = picture.From.Column + 1;

                        // Güvenli dosya adı oluştur
                        string fileName = $"image_{imageIndex:D3}_{SanitizeFileName(picture.Name ?? "unnamed")}.png";
                        string filePath = Path.Combine(imageFolder, fileName);

                        // Resmi kaydet
                        if (picture.Image?.ImageBytes != null)
                        {
                            File.WriteAllBytes(filePath, picture.Image.ImageBytes);
                            _logger.LogInformation("Resim kaydedildi: {FileName} (Pozisyon: R{Row}C{Col})",
                                fileName, imageRow, imageCol);

                            // Resmin hangi veri satırına ait olduğunu belirle
                            int dataRowForImage = FindDataRowForImage(worksheet, imageRow, imageCol);

                            if (dataRowForImage > 0)
                            {
                                // Web'den erişilebilir relative path oluştur
                                string relativePath = $"/Uploads/BOM/Images/{excelId}/{fileName}";
                                imageMap[dataRowForImage] = (relativePath, imageRow, imageCol);
                                _logger.LogInformation("Resim eşleştirildi: {FileName} -> Veri Satır: {DataRow}",
                                    fileName, dataRowForImage);
                            }
                            else
                            {
                                _logger.LogWarning("Resim {FileName} için veri satırı bulunamadı", fileName);
                            }
                        }
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "Resim {Index} kaydedilirken hata", imageIndex);
                    }
                }
            }

            _logger.LogInformation("Toplam {Count} resim başarıyla eşleştirildi", imageMap.Count);
            return imageMap;
        }

        /// <summary>
        /// Resmin hangi veri satırına ait olduğunu bulur
        /// </summary>
        private int FindDataRowForImage(ExcelWorksheet worksheet, int imageRow, int imageCol)
        {
            // A kolonundaki (imageCol == 1) resimler için en yakın veri satırını bul
            if (imageCol != 1) return 0; // Sadece A kolonundaki resimlerle ilgileniyoruz

            // Veri satırları 3'ten başlıyor (başlık 1-2. satırlar)
            int startDataRow = 3;
            int maxRows = worksheet.Dimension?.Rows ?? 0;

            // Resmin pozisyonuna en yakın VERİ DOLU satırı bul
            int closestDataRow = 0;
            int minDistance = int.MaxValue;

            for (int dataRow = startDataRow; dataRow <= maxRows; dataRow++)
            {
                // Bu satırda veri var mı kontrol et (B kolonu - Parça No)
                var parcaNo = worksheet.Cells[dataRow, 3].Value?.ToString()?.Trim(); // C kolonu - Parça Numarası

                // Boş satırları atla
                if (string.IsNullOrEmpty(parcaNo))
                    continue;

                // Bu veri satırının resim pozisyonuna olan mesafesini hesapla
                int distance = Math.Abs(dataRow - imageRow);

                if (distance < minDistance)
                {
                    minDistance = distance;
                    closestDataRow = dataRow;
                }

                // Eğer tam aynı satırdaysa, direkt döndür
                if (distance == 0)
                {
                    return dataRow;
                }

                // Eğer resim, veri satırından çok yukarıdaysa dur
                if (imageRow < dataRow && distance > 5)
                {
                    break;
                }
            }

            // En yakın mesafe 10'dan büyükse eşleştirme yapma
            return minDistance <= 10 ? closestDataRow : 0;
        }

        /// <summary>
        /// Satır için resim bilgisini döndürür
        /// </summary>
        private (string ImagePath, int Row, int Column) GetImageForRow(
            Dictionary<int, (string, int, int)> imageMap,
            int currentDataRow)
        {
            // Direkt bu satır için resim var mı kontrol et
            if (imageMap.ContainsKey(currentDataRow))
            {
                return imageMap[currentDataRow];
            }

            // Resim yok
            return (null, 0, 0);
        }

        /// <summary>
        /// Dosya adını güvenli hale getirir
        /// </summary>
        private string SanitizeFileName(string fileName)
        {
            // Dosya adında geçersiz karakterleri temizle
            char[] invalidChars = Path.GetInvalidFileNameChars();
            foreach (char c in invalidChars)
            {
                fileName = fileName.Replace(c, '_');
            }
            return fileName.Replace(" ", "_").Replace("-", "_");
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
                if (double.TryParse(xText, out double x))
                    data.X = x;
            }

            if (columns.ContainsKey("YYonu"))
            {
                var yText = worksheet.Cells[row, columns["YYonu"]].Text?.Trim();
                if (double.TryParse(yText, out double y))
                    data.Y = y;
            }

            if (columns.ContainsKey("ZYonu"))
            {
                var zText = worksheet.Cells[row, columns["ZYonu"]].Text?.Trim();
                if (double.TryParse(zText, out double z))
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
        private async Task<Item> FindOrCreateItemAsync(ExcelRowData rowData, string? imagePath)
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
                // ✅ Mevcut ürüne resim yoksa ve yeni resim varsa, güncelle
                if (string.IsNullOrEmpty(existingItem.ImageUrl) && !string.IsNullOrEmpty(imagePath))
                {
                    existingItem.ImageUrl = imagePath;
                    existingItem.UpdatedAt = DateTime.Now;
                    await _context.SaveChangesAsync();
                    _logger.LogInformation("Ürün resmi güncellendi: {Code} -> {Image}", code, imagePath);
                }

                _logger.LogDebug("Ürün bulundu: {Code}", code);
                return existingItem;
            }

            // Yoksa yeni ürün oluştur
            var maxNumber = await _context.Items.MaxAsync(i => (int?)i.Number) ?? 0;

            // Malzeme kolonunu ItemGroup olarak kullan
            var groupName = rowData.Malzeme?.Trim();
            if (string.IsNullOrEmpty(groupName))
            {
                groupName = "Tanımsız Grup";
            }

            // İlgili grubu bul veya oluştur
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
                Name = code, // Malzeme adını ürün adı olarak kullan
                DocNumber = rowData.DokumanNo ?? "",
                GroupId = itemGroup.Id,
                X = rowData.X,
                Y = rowData.Y,
                Z = rowData.Z,
                ImageUrl = imagePath, // ✅ Resim yolu eklendi
                CreatedAt = DateTime.Now,
                Cancelled = false,
                SupplierCode = rowData.EskiKod ?? "",
                Price = 0,
                Supplier = "",
                Unit = "Adet"
            };

            _context.Items.Add(newItem);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Yeni ürün oluşturuldu: {Code} - {Name} (Grup: {Group}) {Image}",
                code, newItem.Name, groupName, !string.IsNullOrEmpty(imagePath) ? $"[Resimli]" : "");

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
        public double? X { get; set; }
        public double? Y { get; set; }
        public double? Z { get; set; }
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