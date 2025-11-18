using API.Data;
using API.Data.Entities;
using API.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;

namespace API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ItemFilesController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<ItemFilesController> _logger;
        private readonly IWebHostEnvironment _environment;
        private const long MaxFileSize = 10 * 1024 * 1024; // 10MB

        public ItemFilesController(
            ApplicationDbContext context,
            ILogger<ItemFilesController> logger,
            IWebHostEnvironment environment)
        {
            _context = context;
            _logger = logger;
            _environment = environment;
        }

        /// <summary>
        /// Ürün dosyalarını listele
        /// </summary>
        [HttpPost("list")]
        public async Task<ActionResult<GetItemFilesResponse>> GetItemFiles([FromBody] GetItemFilesRequest request)
        {
            try
            {
                var files = await _context.ItemFiles
                    .Where(f => f.ItemId == request.ItemId)
                    .OrderByDescending(f => f.UploadedAt)
                    .Select(f => new ItemFileResponse
                    {
                        Id = f.Id,
                        ItemId = f.ItemId,
                        FileName = f.FileName,
                        FilePath = f.FilePath,
                        FileSize = f.FileSize,
                        FileExtension = f.FileExtension,
                        FileType = f.FileType,
                        UploadedBy = f.UploadedBy,
                        UploadedAt = f.UploadedAt,
                        Description = f.Description
                    })
                    .ToListAsync();

                return Ok(new GetItemFilesResponse
                {
                    Files = files,
                    TotalCount = files.Count
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error loading item files for ItemId: {ItemId}", request.ItemId);
                return StatusCode(500, new { Message = "Dosyalar yüklenirken hata oluştu" });
            }
        }

        /// <summary>
        /// Ürüne dosya yükle
        /// </summary>
        [HttpPost("upload")]
        public async Task<ActionResult<UploadItemFileResponse>> UploadFile([FromForm] int itemId, [FromForm] IFormFile file)
        {
            try
            {
                var username = User.Identity?.IsAuthenticated == true
                    ? User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue(ClaimTypes.Email)
                    : "Unknown";

                _logger.LogInformation("Uploading file for Item {ItemId} by user: {Username}", itemId, username);

                // Ürün kontrolü
                var item = await _context.Items.FindAsync(itemId);
                if (item == null)
                {
                    return NotFound(new { Message = "Ürün bulunamadı" });
                }

                // Dosya kontrolleri
                if (file == null || file.Length == 0)
                {
                    return BadRequest(new { Message = "Dosya seçilmedi" });
                }

                if (file.Length > MaxFileSize)
                {
                    return BadRequest(new { Message = "Dosya boyutu 10MB'dan büyük olamaz" });
                }

                // İzin verilen uzantılar (resimdeki dosyalar)
                var allowedExtensions = new[] { ".esp", ".nc", ".pdf", ".x_t", ".xlsx", ".xls" };
                var fileExtension = Path.GetExtension(file.FileName).ToLowerInvariant();

                if (!allowedExtensions.Contains(fileExtension))
                {
                    return BadRequest(new { Message = $"Bu dosya türü desteklenmiyor. İzin verilen: {string.Join(", ", allowedExtensions)}" });
                }

                // Dosya türünü belirle
                var fileType = GetFileType(fileExtension);

                // Dosyayı kaydet
                var uploadsFolder = Path.Combine(_environment.ContentRootPath, "Uploads", "Items", itemId.ToString());
                Directory.CreateDirectory(uploadsFolder);

                var uniqueFileName = $"{Guid.NewGuid()}_{file.FileName}";
                var filePath = Path.Combine(uploadsFolder, uniqueFileName);

                using (var stream = new FileStream(filePath, FileMode.Create))
                {
                    await file.CopyToAsync(stream);
                }

                // Database kaydı
                var itemFile = new ItemFile
                {
                    ItemId = itemId,
                    FileName = file.FileName,
                    FilePath = filePath,
                    FileSize = file.Length,
                    FileExtension = fileExtension,
                    FileType = fileType,
                    UploadedAt = DateTime.Now,
                    UploadedBy = username
                };

                _context.ItemFiles.Add(itemFile);
                await _context.SaveChangesAsync();

                _logger.LogInformation("File uploaded successfully: {FileId} - {FileName}", itemFile.Id, file.FileName);

                return Ok(new UploadItemFileResponse
                {
                    Success = true,
                    Message = "Dosya başarıyla yüklendi",
                    File = new ItemFileResponse
                    {
                        Id = itemFile.Id,
                        ItemId = itemFile.ItemId,
                        FileName = itemFile.FileName,
                        FilePath = itemFile.FilePath,
                        FileSize = itemFile.FileSize,
                        FileExtension = itemFile.FileExtension,
                        FileType = itemFile.FileType,
                        UploadedBy = itemFile.UploadedBy,
                        UploadedAt = itemFile.UploadedAt,
                        Description = itemFile.Description
                    }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error uploading file for Item {ItemId}", itemId);
                return StatusCode(500, new { Message = "Dosya yüklenirken hata oluştu: " + ex.Message });
            }
        }

        /// <summary>
        /// Dosya indir
        /// </summary>
        [HttpGet("download/{id}")]
        public async Task<IActionResult> DownloadFile(int id)
        {
            try
            {
                var itemFile = await _context.ItemFiles.FindAsync(id);
                if (itemFile == null)
                {
                    return NotFound(new { Message = "Dosya bulunamadı" });
                }

                if (!System.IO.File.Exists(itemFile.FilePath))
                {
                    return NotFound(new { Message = "Fiziksel dosya bulunamadı" });
                }

                var fileBytes = await System.IO.File.ReadAllBytesAsync(itemFile.FilePath);

                // CORS headers ekle
                Response.Headers.Add("Access-Control-Allow-Origin", "*");
                Response.Headers.Add("Access-Control-Allow-Methods", "GET");
                Response.Headers.Add("Access-Control-Allow-Headers", "Authorization, Content-Type");

                var contentType = GetContentType(itemFile.FileExtension);

                // PDF ise inline, diğerleri attachment
                if (itemFile.FileExtension.ToLower() == ".pdf")
                {
                    return File(fileBytes, contentType, itemFile.FileName, true); // inline
                }
                else
                {
                    return File(fileBytes, contentType, itemFile.FileName); // attachment
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error downloading file: {FileId}", id);
                return StatusCode(500, new { Message = "Dosya indirilirken hata oluştu" });
            }
        }

        /// <summary>
        /// PDF preview için dosya stream (CORS sorunu düzeltildi)
        /// </summary>
        [HttpGet("preview/{id}")]
        public async Task<IActionResult> PreviewFile(int id)
        {
            try
            {
                var itemFile = await _context.ItemFiles.FindAsync(id);
                if (itemFile == null)
                {
                    return NotFound(new { Message = "Dosya bulunamadı" });
                }

                // Sadece PDF dosyaları preview edilebilir
                if (itemFile.FileExtension.ToLower() != ".pdf")
                {
                    return BadRequest(new { Message = "Sadece PDF dosyaları önizlenebilir" });
                }

                if (!System.IO.File.Exists(itemFile.FilePath))
                {
                    return NotFound(new { Message = "Fiziksel dosya bulunamadı" });
                }

                var fileBytes = await System.IO.File.ReadAllBytesAsync(itemFile.FilePath);

                // CORS headers ekle (Frontend'den iframe ile erişim için)
                Response.Headers.Add("Access-Control-Allow-Origin", "*");
                Response.Headers.Add("Access-Control-Allow-Methods", "GET");
                Response.Headers.Add("Access-Control-Allow-Headers", "Authorization, Content-Type");

                // ✅ DOĞRU KOD
                Response.Headers.Add("Content-Disposition", "inline; filename=\"" + itemFile.FileName + "\"");
                return File(fileBytes, "application/pdf");  // filename parametresi YOK
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error previewing file: {FileId}", id);
                return StatusCode(500, new { Message = "Dosya önizlenirken hata oluştu" });
            }
        }

        // ✅ ItemFilesController.cs - ZIP İndirme Endpoint'i Eklendi
        // Mevcut dosyanıza bu metodu ekleyin

        /// <summary>
        /// Ürüne ait tüm dosyaları ZIP olarak indir
        /// </summary>
        [HttpGet("download-zip/{itemId}")]
        public async Task<IActionResult> DownloadAllAsZip(int itemId)
        {
            try
            {
                // Ürünü bul
                var item = await _context.Items.FindAsync(itemId);
                if (item == null)
                {
                    return NotFound(new { Message = "Ürün bulunamadı" });
                }

                // Ürüne ait dosyaları al
                var itemFiles = await _context.ItemFiles
                    .Where(f => f.ItemId == itemId)
                    .OrderBy(f => f.FileName)
                    .ToListAsync();

                if (itemFiles.Count == 0)
                {
                    return NotFound(new { Message = "Bu ürüne ait dosya bulunamadı" });
                }

                // ZIP dosyası adı: ürünKodu_tarih.zip
                var productCode = item.Code
                                     ?? item.Number.ToString()
                                     ?? itemId.ToString();
                var timestamp = DateTime.Now.ToString("yyyy-MM-dd");
                var zipFileName = $"{productCode}_{timestamp}.zip";

                // Memory stream oluştur
                using (var memoryStream = new MemoryStream())
                {
                    // ZIP arşivi oluştur
                    using (var archive = new System.IO.Compression.ZipArchive(memoryStream, System.IO.Compression.ZipArchiveMode.Create, true))
                    {
                        foreach (var itemFile in itemFiles)
                        {
                            if (!System.IO.File.Exists(itemFile.FilePath))
                            {
                                _logger.LogWarning("File not found in filesystem: {FilePath}", itemFile.FilePath);
                                continue;
                            }

                            // Dosyayı ZIP'e ekle
                            var zipEntry = archive.CreateEntry(itemFile.FileName, System.IO.Compression.CompressionLevel.Fastest);

                            using (var entryStream = zipEntry.Open())
                            using (var fileStream = new FileStream(itemFile.FilePath, FileMode.Open, FileAccess.Read))
                            {
                                await fileStream.CopyToAsync(entryStream);
                            }
                        }
                    }

                    // Memory stream'i başa sar
                    memoryStream.Seek(0, SeekOrigin.Begin);

                    // ZIP dosyasını döndür
                    var fileBytes = memoryStream.ToArray();

                    _logger.LogInformation("ZIP archive created: {FileName} with {FileCount} files", zipFileName, itemFiles.Count);

                    // CORS headers
                    Response.Headers.Add("Access-Control-Allow-Origin", "*");
                    Response.Headers.Add("Access-Control-Allow-Methods", "GET");
                    Response.Headers.Add("Access-Control-Allow-Headers", "Authorization, Content-Type");

                    return File(fileBytes, "application/zip", zipFileName);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating ZIP archive for item: {ItemId}", itemId);
                return StatusCode(500, new { Message = "ZIP dosyası oluşturulurken hata oluştu: " + ex.Message });
            }
        }

        /// <summary>
        /// Dosya sil
        /// </summary>
        [HttpDelete("{id}")]
        public async Task<ActionResult<DeleteItemFileResponse>> DeleteFile(int id)
        {
            try
            {
                var itemFile = await _context.ItemFiles.FindAsync(id);
                if (itemFile == null)
                {
                    return NotFound(new { Message = "Dosya bulunamadı" });
                }

                // Fiziksel dosyayı sil
                if (System.IO.File.Exists(itemFile.FilePath))
                {
                    System.IO.File.Delete(itemFile.FilePath);
                }

                // Database kaydını sil
                _context.ItemFiles.Remove(itemFile);
                await _context.SaveChangesAsync();

                _logger.LogInformation("File deleted: {FileId} - {FileName}", id, itemFile.FileName);

                return Ok(new DeleteItemFileResponse
                {
                    Success = true,
                    Message = "Dosya başarıyla silindi"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting file: {FileId}", id);
                return StatusCode(500, new { Message = "Dosya silinirken hata oluştu" });
            }
        }

        // Helper methods
        private string GetFileType(string extension)
        {
            return extension.ToLower() switch
            {
                ".esp" => "ESP Dosyası",
                ".nc" => "NC Dosyası",
                ".pdf" => "PDF Doküman",
                ".x_t" => "X_T Dosyası",
                ".xlsx" or ".xls" => "Excel Dosyası",
                _ => "Diğer"
            };
        }

        private string GetContentType(string extension)
        {
            return extension.ToLower() switch
            {
                ".pdf" => "application/pdf",
                ".xlsx" => "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                ".xls" => "application/vnd.ms-excel",
                ".esp" => "application/octet-stream",
                ".nc" => "application/octet-stream",
                ".x_t" => "application/octet-stream",
                _ => "application/octet-stream"
            };
        }
    }
}