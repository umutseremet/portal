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


        [HttpPost("download-zip")]
        public async Task<IActionResult> DownloadTechnicalDrawingsAsZip(
    [FromBody] DownloadTechnicalDrawingsRequest request)
        {
            var stopwatch = System.Diagnostics.Stopwatch.StartNew(); // ✅ İşlem süresini ölç

            try
            {
                if (request.ItemGroupIds == null || !request.ItemGroupIds.Any())
                {
                    return BadRequest(new ErrorResponse { Message = "En az bir ürün grubu seçilmeli" });
                }

                // ✅ Kullanıcı bilgilerini al
                var username = User.FindFirst("username")?.Value ?? "System";
                var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString();

                // Work bilgisini al
                var work = await _context.BomWorks.FindAsync(request.WorkId);
                if (work == null)
                {
                    return NotFound(new ErrorResponse { Message = "Çalışma bulunamadı" });
                }

                if (string.IsNullOrWhiteSpace(work.WorkName))
                {
                    return BadRequest(new ErrorResponse { Message = "Çalışma adı geçersiz" });
                }

                var selectedGroupIds = request.ItemGroupIds.ToList();

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
                        TechnicalDrawingCompleted = bi.Item.TechnicalDrawingCompleted
                    })
                    .ToListAsync();

                var itemsWithExcel = allBomItems
                    .Where(x => selectedGroupIds.Contains(x.ItemGroupId))
                    .ToList();

                if (!itemsWithExcel.Any())
                {
                    return NotFound(new ErrorResponse { Message = "Seçilen kriterlere uygun ürün bulunamadı" });
                }

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

                if (!itemFilesLookup.Any())
                {
                    return NotFound(new ErrorResponse { Message = "Seçilen ürünlere ait dosya bulunamadı" });
                }

                // ✅ ZIP dosyası adı - Tarih ve saat dahil
                var timestamp = DateTime.Now.ToString("yyyyMMdd_HHmmss");
                var zipFileName = $"{SanitizeFileName(work.WorkName)}_{timestamp}.zip";

                byte[] fileBytes;
                int addedFileCount = 0;

                // Memory stream oluştur
                using (var memoryStream = new MemoryStream())
                {
                    // ZIP arşivi oluştur
                    using (var archive = new ZipArchive(memoryStream, ZipArchiveMode.Create, true))
                    {
                        var itemsByExcel = itemsWithDrawing.GroupBy(x => new { x.ExcelId, x.ExcelFileName });

                        foreach (var excelGroup in itemsByExcel)
                        {
                            var excelFileName = excelGroup.Key.ExcelFileName;

                            if (string.IsNullOrWhiteSpace(excelFileName))
                            {
                                _logger.LogWarning("Empty excel filename for ExcelId={ExcelId}", excelGroup.Key.ExcelId);
                                continue;
                            }

                            var excelNameWithoutExt = Path.GetFileNameWithoutExtension(excelFileName);

                            if (string.IsNullOrWhiteSpace(excelNameWithoutExt))
                            {
                                excelNameWithoutExt = $"Excel_{excelGroup.Key.ExcelId}";
                            }

                            // "-" karakterine kadar al
                            if (excelNameWithoutExt.Contains('-'))
                            {
                                var dashIndex = excelNameWithoutExt.IndexOf('-');
                                var prefix = excelNameWithoutExt.Substring(0, dashIndex).Trim();

                                if (!string.IsNullOrWhiteSpace(prefix))
                                {
                                    excelNameWithoutExt = prefix;
                                }
                            }

                            var excelFolder = SanitizeFileName(excelNameWithoutExt);

                            if (string.IsNullOrWhiteSpace(excelFolder))
                            {
                                excelFolder = $"Excel_{excelGroup.Key.ExcelId}";
                            }

                            foreach (var itemData in excelGroup)
                            {
                                var itemCode = itemData.ItemCode ?? itemData.ItemNumber.ToString();

                                if (string.IsNullOrWhiteSpace(itemCode))
                                {
                                    itemCode = $"Item_{itemData.ItemId}";
                                }

                                var itemFolderName = SanitizeFileName(itemCode);

                                if (string.IsNullOrWhiteSpace(itemFolderName))
                                {
                                    itemFolderName = $"Item_{itemData.ItemId}";
                                }

                                var itemFolder = $"{excelFolder}/{itemFolderName}";

                                var files = itemFilesLookup.Where(f => f.ItemId == itemData.ItemId).ToList();

                                foreach (var file in files)
                                {
                                    if (string.IsNullOrWhiteSpace(file.FileName))
                                    {
                                        continue;
                                    }

                                    if (!System.IO.File.Exists(file.FilePath))
                                    {
                                        _logger.LogWarning("File not found: {FilePath}", file.FilePath);
                                        continue;
                                    }

                                    var sanitizedFileName = SanitizeFileName(file.FileName);

                                    if (string.IsNullOrWhiteSpace(sanitizedFileName))
                                    {
                                        sanitizedFileName = $"File_{file.Id}{Path.GetExtension(file.FileName)}";
                                    }

                                    var entryName = $"{itemFolder}/{sanitizedFileName}";

                                    try
                                    {
                                        var zipEntry = archive.CreateEntry(entryName, CompressionLevel.Fastest);

                                        using (var entryStream = zipEntry.Open())
                                        using (var fileStream = new FileStream(file.FilePath, FileMode.Open, FileAccess.Read))
                                        {
                                            await fileStream.CopyToAsync(entryStream);
                                            addedFileCount++;
                                        }
                                    }
                                    catch (Exception ex)
                                    {
                                        _logger.LogError(ex, "Error adding file to ZIP: {FileName}", file.FileName);
                                    }
                                }
                            }
                        }
                    }

                    if (addedFileCount == 0)
                    {
                        return NotFound(new ErrorResponse { Message = "ZIP'e hiçbir dosya eklenemedi" });
                    }

                    memoryStream.Seek(0, SeekOrigin.Begin);
                    fileBytes = memoryStream.ToArray();

                    if (fileBytes.Length == 0)
                    {
                        return StatusCode(500, new ErrorResponse { Message = "Oluşturulan ZIP dosyası boş" });
                    }
                }

                stopwatch.Stop();

                // ✅ LOG KAYDI OLUŞTUR
                var downloadLog = new TechnicalDrawingDownloadLog
                {
                    WorkId = request.WorkId,
                    WorkName = work.WorkName,
                    ProjectId = work.ProjectId,
                    ZipFileName = zipFileName,
                    ZipFileSize = fileBytes.Length,
                    ItemCount = itemsWithDrawing.Count,
                    FileCount = addedFileCount,
                    SelectedGroupIds = System.Text.Json.JsonSerializer.Serialize(request.ItemGroupIds),
                    DownloadedBy = username,
                    DownloadedAt = DateTime.Now,
                    IpAddress = ipAddress,
                    ProcessingTimeMs = (int)stopwatch.ElapsedMilliseconds
                };

                _context.TechnicalDrawingDownloadLogs.Add(downloadLog);
                await _context.SaveChangesAsync();

                _logger.LogInformation(
                    "ZIP download logged: LogId={LogId}, FileName={FileName}, Size={SizeKB}KB, Files={FileCount}, User={User}, Time={TimeMs}ms",
                    downloadLog.Id, zipFileName, fileBytes.Length / 1024, addedFileCount, username, stopwatch.ElapsedMilliseconds);

                // CORS headers
                Response.Headers.Add("Access-Control-Allow-Origin", "*");
                Response.Headers.Add("Access-Control-Expose-Headers", "Content-Disposition");

                return File(fileBytes, "application/zip", zipFileName);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating technical drawings ZIP");
                return StatusCode(500, new ErrorResponse { Message = "ZIP dosyası oluşturulurken hata oluştu: " + ex.Message });
            }
        }

        // TechnicalDrawingPreparationController.cs - Log görüntüleme metodları

        /// <summary>
        /// ZIP indirme loglarını listele
        /// </summary>
        [HttpGet("download-logs")]
        public async Task<ActionResult<GetDownloadLogsResponse>> GetDownloadLogs(
            [FromQuery] int? workId = null,
            [FromQuery] string? username = null,
            [FromQuery] DateTime? startDate = null,
            [FromQuery] DateTime? endDate = null,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 50)
        {
            try
            {
                var query = _context.TechnicalDrawingDownloadLogs
                    .Include(l => l.BomWork)
                    .AsQueryable();

                // Filtreler
                if (workId.HasValue)
                {
                    query = query.Where(l => l.WorkId == workId.Value);
                }

                if (!string.IsNullOrWhiteSpace(username))
                {
                    query = query.Where(l => l.DownloadedBy.Contains(username));
                }

                if (startDate.HasValue)
                {
                    query = query.Where(l => l.DownloadedAt >= startDate.Value);
                }

                if (endDate.HasValue)
                {
                    query = query.Where(l => l.DownloadedAt <= endDate.Value);
                }

                var totalCount = await query.CountAsync();

                var logs = await query
                    .OrderByDescending(l => l.DownloadedAt)
                    .Skip((page - 1) * pageSize)
                    .Take(pageSize)
                    .Select(l => new DownloadLogResponse
                    {
                        Id = l.Id,
                        WorkId = l.WorkId,
                        WorkName = l.WorkName,
                        ProjectId = l.ProjectId,
                        ZipFileName = l.ZipFileName,
                        ZipFileSize = l.ZipFileSize,
                        ZipFileSizeMB = Math.Round((double)l.ZipFileSize / 1024 / 1024, 2),
                        ItemCount = l.ItemCount,
                        FileCount = l.FileCount,
                        SelectedGroupIds = l.SelectedGroupIds,
                        DownloadedBy = l.DownloadedBy,
                        DownloadedAt = l.DownloadedAt,
                        IpAddress = l.IpAddress,
                        ProcessingTimeMs = l.ProcessingTimeMs
                    })
                    .ToListAsync();

                return Ok(new GetDownloadLogsResponse
                {
                    Logs = logs,
                    TotalCount = totalCount,
                    Page = page,
                    PageSize = pageSize,
                    TotalPages = (int)Math.Ceiling(totalCount / (double)pageSize)
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting download logs");
                return StatusCode(500, new ErrorResponse { Message = "Loglar yüklenirken hata oluştu" });
            }
        }

        /// <summary>
        /// Bir çalışma için indirme istatistikleri
        /// </summary>
        [HttpGet("download-stats/{workId}")]
        public async Task<ActionResult<DownloadStatsResponse>> GetDownloadStats(int workId)
        {
            try
            {
                var logs = await _context.TechnicalDrawingDownloadLogs
                    .Where(l => l.WorkId == workId)
                    .ToListAsync();

                if (!logs.Any())
                {
                    return Ok(new DownloadStatsResponse
                    {
                        TotalDownloads = 0,
                        TotalSizeMB = 0,
                        TotalFiles = 0,
                        AverageProcessingTimeMs = 0,
                        LastDownloadDate = null,
                        TopDownloaders = new List<TopDownloaderInfo>()
                    });
                }

                var stats = new DownloadStatsResponse
                {
                    TotalDownloads = logs.Count,
                    TotalSizeMB = Math.Round(logs.Sum(l => l.ZipFileSize) / 1024.0 / 1024.0, 2),
                    TotalFiles = logs.Sum(l => l.FileCount),
                    AverageProcessingTimeMs = (int)logs.Average(l => l.ProcessingTimeMs ?? 0),
                    LastDownloadDate = logs.Max(l => l.DownloadedAt),
                    TopDownloaders = logs
                        .GroupBy(l => l.DownloadedBy)
                        .Select(g => new TopDownloaderInfo
                        {
                            Username = g.Key,
                            DownloadCount = g.Count(),
                            TotalSizeMB = Math.Round(g.Sum(l => l.ZipFileSize) / 1024.0 / 1024.0, 2)
                        })
                        .OrderByDescending(x => x.DownloadCount)
                        .Take(5)
                        .ToList()
                };

                return Ok(stats);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting download stats for WorkId={WorkId}", workId);
                return StatusCode(500, new ErrorResponse { Message = "İstatistikler yüklenirken hata oluştu" });
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