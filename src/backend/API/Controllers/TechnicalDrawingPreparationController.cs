using API.Data;
using API.Data.Entities;
using API.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.IO.Compression;

namespace API.Controllers
{
    [Authorize]
    [Route("api/[controller]")]
    [ApiController]
    public class TechnicalDrawingPreparationController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<TechnicalDrawingPreparationController> _logger;
        private readonly IWebHostEnvironment _environment;
        private readonly RedmineService _redmineService;

        public TechnicalDrawingPreparationController(
            ApplicationDbContext context,
            ILogger<TechnicalDrawingPreparationController> logger,
            IWebHostEnvironment environment,
            RedmineService redmineService)
        {
            _context = context;
            _logger = logger;
            _environment = environment;
            _redmineService = redmineService;
        }

        /// <summary>
        /// BOM çalışmalarını listele (Work dropdown için)
        /// </summary>
        [HttpGet("works")]
        public async Task<ActionResult<List<BomWorkForDrawingResponse>>> GetBomWorks(
            [FromQuery] string? redmineUsername = null,
            [FromQuery] string? redminePassword = null)
        {
            try
            {
                var works = await _context.BomWorks
                    .Where(w => w.IsActive)
                    .OrderByDescending(w => w.CreatedAt)
                    .ToListAsync();

                // Tüm unique project ID'leri topla
                var projectIds = works.Select(w => w.ProjectId).Distinct().ToList();

                // Proje adlarını Redmine'dan al
                var projectNames = new Dictionary<int, string>();
                foreach (var projectId in projectIds)
                {
                    var projectName = await GetProjectNameAsync(
                        projectId,
                        redmineUsername,
                        redminePassword);
                    projectNames[projectId] = projectName;
                }

                // Response oluştur
                var response = works.Select(w => new BomWorkForDrawingResponse
                {
                    Id = w.Id,
                    WorkName = w.WorkName,
                    ProjectId = w.ProjectId,
                    ProjectName = projectNames.ContainsKey(w.ProjectId)
                        ? projectNames[w.ProjectId]
                        : $"Proje {w.ProjectId}"
                }).ToList();

                return Ok(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting BOM works");
                return StatusCode(500, new ErrorResponse { Message = "Çalışmalar yüklenirken hata oluştu" });
            }
        }

        /// <summary>
        /// Seçilen çalışmaya ait ürün gruplarını listele
        /// </summary>
        [HttpGet("work/{workId}/item-groups")]
        public async Task<ActionResult<List<ItemGroupForDrawingResponse>>> GetItemGroupsForWork(int workId)
        {
            try
            {
                // Bu work'e ait BomItem'lardan unique ItemGroup'ları bul
                var itemGroups = await _context.BomItems
                    .Where(bi => bi.BomExcel.WorkId == workId)
                    .Include(bi => bi.Item)
                        .ThenInclude(i => i.ItemGroup)
                    .Where(bi => bi.Item.ItemGroup != null)
                    .Select(bi => bi.Item.ItemGroup)
                    .Distinct()
                    .OrderBy(ig => ig.Name)
                    .ToListAsync();

                // Unique group'ları response'a dönüştür
                var response = itemGroups
                    .GroupBy(ig => ig.Id)
                    .Select(g => new ItemGroupForDrawingResponse
                    {
                        Id = g.Key,
                        Name = g.First().Name
                    })
                    .OrderBy(ig => ig.Name)
                    .ToList();

                return Ok(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting item groups for work {WorkId}", workId);
                return StatusCode(500, new ErrorResponse { Message = "Ürün grupları yüklenirken hata oluştu" });
            }
        }

        /// <summary>
        /// Seçilen çalışma ve gruplara göre ürünleri listele
        /// </summary>
        [HttpPost("items")]
        public async Task<ActionResult<List<TechnicalDrawingItemResponse>>> GetItemsForDrawing(
            [FromBody] GetItemsForDrawingRequest request)
        {
            try
            {
                if (request.ItemGroupIds == null || !request.ItemGroupIds.Any())
                {
                    return BadRequest(new ErrorResponse { Message = "En az bir ürün grubu seçilmeli" });
                }

                var selectedGroupIds = request.ItemGroupIds.ToList();

                // ✅ Önce work'e ait tüm BomItem'ları al (SQL'de)
                var allBomItems = await _context.BomItems
                    .Where(bi => bi.BomExcel.WorkId == request.WorkId)
                    .Select(bi => new
                    {
                        ItemId = bi.ItemId,
                        ItemNumber = bi.Item.Number,
                        ItemCode = bi.Item.Code,
                        ItemName = bi.Item.Name,
                        ItemGroupId = bi.Item.GroupId,
                        ItemGroupName = bi.Item.ItemGroup != null ? bi.Item.ItemGroup.Name : null,
                        ExcelFileName = bi.BomExcel.FileName,
                        ExcelId = bi.BomExcel.Id,
                        TechnicalDrawingCompleted = bi.Item.TechnicalDrawingCompleted // ✅ Item'dan flag
                    })
                    .ToListAsync();

                // ✅ Sonra memory'de filtrele
                var itemsWithExcel = allBomItems
                    .Where(x => selectedGroupIds.Contains(x.ItemGroupId))
                    .ToList();

                if (!itemsWithExcel.Any())
                {
                    return Ok(new List<TechnicalDrawingItemResponse>());
                }

                // Unique item'ları al (aynı item birden fazla satırda olabilir)
                var uniqueItems = itemsWithExcel
                    .GroupBy(x => x.ItemId)
                    .Select(g => g.First()) // İlk bulunduğu Excel
                    .ToList();

                // ✅ File count hala gerekli ama sadece bilgi amaçlı
                var itemIds = uniqueItems.Select(x => x.ItemId).ToList();

                Dictionary<int, int> fileCounts = new Dictionary<int, int>();
                if (itemIds.Any())
                {
                    foreach (var itemId in itemIds)
                    {
                        var count = await _context.ItemFiles
                            .Where(f => f.ItemId == itemId)
                            .CountAsync();

                        if (count > 0)
                        {
                            fileCounts[itemId] = count;
                        }
                    }
                }

                var response = uniqueItems.Select(x => new TechnicalDrawingItemResponse
                {
                    ItemId = x.ItemId,
                    ItemNumber = x.ItemNumber,
                    ItemCode = x.ItemCode,
                    ItemName = x.ItemName,
                    ItemGroupId = x.ItemGroupId,
                    ItemGroupName = x.ItemGroupName,
                    ExcelFileName = x.ExcelFileName,
                    ExcelId = x.ExcelId,
                    HasTechnicalDrawing = x.TechnicalDrawingCompleted, // ✅ Flag kullan
                    FileCount = fileCounts.ContainsKey(x.ItemId) ? fileCounts[x.ItemId] : 0
                }).ToList();

                return Ok(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting items for drawing");
                return StatusCode(500, new ErrorResponse { Message = "Ürünler yüklenirken hata oluştu" });
            }
        }

        /// <summary>
        /// Seçilen çalışma ve gruplara göre tüm ürün dosyalarını ZIP olarak indir
        /// Klasör yapısı:
        /// - Çalışma Adı (tayas revizyon-1)
        ///   - Excel Dosya Adı (1000_grubu.xlsx)
        ///     - Ürün Klasörleri (ürün kodu)
        ///       - Ürün Dosyaları (xt, pdf, vs.)
        /// </summary>
        [HttpPost("download-zip")]
        public async Task<IActionResult> DownloadTechnicalDrawingsAsZip(
            [FromBody] DownloadTechnicalDrawingsRequest request)
        {
            try
            {
                if (request.ItemGroupIds == null || !request.ItemGroupIds.Any())
                {
                    return BadRequest(new ErrorResponse { Message = "En az bir ürün grubu seçilmeli" });
                }

                // Work bilgisini al
                var work = await _context.BomWorks.FindAsync(request.WorkId);
                if (work == null)
                {
                    return NotFound(new ErrorResponse { Message = "Çalışma bulunamadı" });
                }

                // ✅ FIX: ItemGroupIds'i önce local değişkene al
                var selectedGroupIds = request.ItemGroupIds.ToList();

                // ✅ FIX: Önce work'e ait tüm BomItem'ları al (SQL'de)
                var allBomItems = await _context.BomItems
                    .Where(bi => bi.BomExcel.WorkId == request.WorkId)
                    .Select(bi => new
                    {
                        ItemId = bi.ItemId,
                        ItemCode = bi.Item.Code,
                        ItemNumber = bi.Item.Number,
                        ItemGroupId = bi.Item.GroupId,
                        ExcelFileName = bi.BomExcel.FileName,
                        ExcelId = bi.BomExcel.Id,
                        TechnicalDrawingCompleted = bi.Item.TechnicalDrawingCompleted // ✅ Flag
                    })
                    .ToListAsync();

                // ✅ Sonra memory'de filtrele
                var itemsWithExcel = allBomItems
                    .Where(x => selectedGroupIds.Contains(x.ItemGroupId))
                    .ToList();

                if (!itemsWithExcel.Any())
                {
                    return NotFound(new ErrorResponse { Message = "Seçilen kriterlere uygun ürün bulunamadı" });
                }

                // ✅ Sadece TechnicalDrawingCompleted = true olanları al
                var itemsWithDrawing = itemsWithExcel
                    .Where(x => x.TechnicalDrawingCompleted)
                    .GroupBy(x => x.ItemId)
                    .Select(g => g.First())
                    .ToList();

                if (!itemsWithDrawing.Any())
                {
                    return NotFound(new ErrorResponse { Message = "Hiçbir ürüne ait teknik resim bulunamadı" });
                }

                // Dosyaları al
                var itemIds = itemsWithDrawing.Select(x => x.ItemId).ToList();
                var itemFilesLookup = new List<ItemFile>();

                foreach (var itemId in itemIds)
                {
                    var files = await _context.ItemFiles
                        .Where(f => f.ItemId == itemId)
                        .ToListAsync();

                    itemFilesLookup.AddRange(files);
                }

                // ZIP dosyası adı: WorkName_tarih.zip
                var timestamp = DateTime.Now.ToString("yyyy-MM-dd_HHmmss");
                var zipFileName = $"{SanitizeFileName(work.WorkName)}_{timestamp}.zip";

                // Memory stream oluştur
                using (var memoryStream = new MemoryStream())
                {
                    // ZIP arşivi oluştur
                    using (var archive = new ZipArchive(memoryStream, ZipArchiveMode.Create, true))
                    {
                        // Excel dosyalarına göre grupla
                        var itemsByExcel = itemsWithDrawing.GroupBy(x => new { x.ExcelId, x.ExcelFileName });

                        foreach (var excelGroup in itemsByExcel)
                        {
                            var excelFileName = excelGroup.Key.ExcelFileName;
                            var excelNameWithoutExt = Path.GetFileNameWithoutExtension(excelFileName);

                            // Excel klasörü adı
                            var excelFolder = $"{SanitizeFileName(work.WorkName)}/{SanitizeFileName(excelNameWithoutExt)}";

                            foreach (var itemData in excelGroup)
                            {
                                // Ürün klasörü adı: ürün kodu
                                var itemFolder = $"{excelFolder}/{SanitizeFileName(itemData.ItemCode ?? itemData.ItemNumber.ToString())}";

                                // Bu ürüne ait dosyaları al
                                var files = itemFilesLookup.Where(f => f.ItemId == itemData.ItemId).ToList();

                                foreach (var file in files)
                                {
                                    if (!System.IO.File.Exists(file.FilePath))
                                    {
                                        _logger.LogWarning("File not found: {FilePath}", file.FilePath);
                                        continue;
                                    }

                                    // ZIP entry yolu
                                    var entryName = $"{itemFolder}/{SanitizeFileName(file.FileName)}";

                                    // Dosyayı ZIP'e ekle
                                    var zipEntry = archive.CreateEntry(entryName, CompressionLevel.Fastest);

                                    using (var entryStream = zipEntry.Open())
                                    using (var fileStream = new FileStream(file.FilePath, FileMode.Open, FileAccess.Read))
                                    {
                                        await fileStream.CopyToAsync(entryStream);
                                    }
                                }
                            }
                        }
                    }

                    // Memory stream'i başa sar
                    memoryStream.Seek(0, SeekOrigin.Begin);

                    // ZIP dosyasını döndür
                    var fileBytes = memoryStream.ToArray();

                    _logger.LogInformation(
                        "ZIP created: {FileName} for WorkId={WorkId}, Groups={GroupCount}, Items={ItemCount}",
                        zipFileName, request.WorkId, request.ItemGroupIds.Count, itemsWithDrawing.Count);

                    // CORS headers
                    Response.Headers.Add("Access-Control-Allow-Origin", "*");
                    Response.Headers.Add("Access-Control-Allow-Methods", "POST");
                    Response.Headers.Add("Access-Control-Allow-Headers", "Authorization, Content-Type");

                    return File(fileBytes, "application/zip", zipFileName);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating technical drawings ZIP");
                return StatusCode(500, new ErrorResponse { Message = "ZIP dosyası oluşturulurken hata oluştu: " + ex.Message });
            }
        }

        /// <summary>
        /// Dosya adını temizle (geçersiz karakterleri kaldır)
        /// </summary>
        private string SanitizeFileName(string fileName)
        {
            if (string.IsNullOrWhiteSpace(fileName))
                return "Unnamed";

            var invalidChars = Path.GetInvalidFileNameChars();
            var sanitized = string.Join("_", fileName.Split(invalidChars, StringSplitOptions.RemoveEmptyEntries));
            return sanitized.Trim();
        }

        /// <summary>
        /// Redmine'dan proje adını getirir
        /// </summary>
        private async Task<string> GetProjectNameAsync(int projectId, string? redmineUsername = null, string? redminePassword = null)
        {
            try
            {
                // JWT token'dan kullanıcı bilgilerini al
                var jwtUsername = User.FindFirst("username")?.Value;

                // DEBUG modunda frontend'den, Production'da JWT'den al
#if DEBUG
                var username = redmineUsername ?? jwtUsername;
                var password = redminePassword ?? string.Empty;
#else
                var username = User.FindFirst("redmine_username")?.Value ?? jwtUsername;
                var password = User.FindFirst("redmine_password")?.Value ?? string.Empty;
#endif

                if (string.IsNullOrEmpty(username))
                {
                    _logger.LogWarning("Kullanıcı bilgileri bulunamadı, varsayılan proje adı kullanılıyor");
                    return $"Proje {projectId}";
                }

                _logger.LogInformation("Redmine'dan proje bilgisi alınıyor: ProjectId={ProjectId}, Username={Username}",
                    projectId, username);

                // Redmine'dan proje bilgisini al
                var project = await _redmineService.GetProjectByIdAsync(username, password, projectId);

                if (project != null && !string.IsNullOrEmpty(project.Name))
                {
                    _logger.LogInformation("Proje adı bulundu: {ProjectName}", project.Name);
                    return project.Name;
                }

                _logger.LogWarning("Proje {ProjectId} Redmine'da bulunamadı", projectId);
                return $"Proje {projectId}";
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Proje adı alınırken hata: ProjectId={ProjectId}", projectId);
                return $"Proje {projectId}";
            }
        }
    }
}