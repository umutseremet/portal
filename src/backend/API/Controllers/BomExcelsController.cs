using API.Data;
using API.Data.Entities;
using API.Models;
using API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
#if !DEBUG
    [Authorize]
#endif
    public class BomExcelsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<BomExcelsController> _logger;
        private readonly IWebHostEnvironment _environment;
        private readonly BomExcelParserService _parserService;
        private const long MaxFileSize = 10 * 1024 * 1024; // 10MB

        public BomExcelsController(
            ApplicationDbContext context,
            ILogger<BomExcelsController> logger,
            IWebHostEnvironment environment,
            BomExcelParserService parserService)
        {
            _context = context;
            _logger = logger;
            _environment = environment;
            _parserService = parserService;
        }

        /// <summary>
        /// Bir çalışmaya ait Excel dosyalarını listeler
        /// </summary>
        [HttpPost("list")]
        public async Task<ActionResult<GetBomExcelsResponse>> GetBomExcels([FromBody] GetBomExcelsRequest request)
        {
            try
            {
                var username = User.FindFirst("username")?.Value;
                _logger.LogInformation("Getting BOM excels for work {WorkId} by user: {Username}",
                    request.WorkId, username);

                var workExists = await _context.BomWorks.AnyAsync(w => w.Id == request.WorkId);
                if (!workExists)
                {
                    return NotFound(new ErrorResponse { Message = "BOM çalışması bulunamadı" });
                }

                var query = _context.BomExcels
                    .Where(e => e.WorkId == request.WorkId)
                    .OrderByDescending(e => e.UploadedAt);

                var totalCount = await query.CountAsync();

                var excels = await query
                    .Skip((request.Page - 1) * request.PageSize)
                    .Take(request.PageSize)
                    .Select(e => new BomExcelResponse
                    {
                        Id = e.Id,
                        WorkId = e.WorkId,
                        FileName = e.FileName,
                        FilePath = e.FilePath,
                        FileSize = e.FileSize,
                        RowCount = e.RowCount,
                        UploadedAt = e.UploadedAt,
                        UploadedBy = e.UploadedBy,
                        IsProcessed = e.IsProcessed,
                        ProcessingNotes = e.ProcessingNotes
                    })
                    .ToListAsync();

                return Ok(new GetBomExcelsResponse
                {
                    Excels = excels,
                    TotalCount = totalCount,
                    Page = request.Page,
                    PageSize = request.PageSize
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting BOM excels");
                return StatusCode(500, new ErrorResponse { Message = "Excel dosyaları alınırken hata oluştu" });
            }
        }

        /// <summary>
        /// Excel dosya detayını getirir
        /// </summary>
        [HttpGet("{id}")]
        public async Task<ActionResult<BomExcelResponse>> GetBomExcel(int id)
        {
            try
            {
                var username = User.FindFirst("username")?.Value;
                _logger.LogInformation("Getting BOM excel {Id} by user: {Username}", id, username);

                var excel = await _context.BomExcels.FirstOrDefaultAsync(e => e.Id == id);

                if (excel == null)
                {
                    return NotFound(new ErrorResponse { Message = "Excel dosyası bulunamadı" });
                }

                var response = new BomExcelResponse
                {
                    Id = excel.Id,
                    WorkId = excel.WorkId,
                    FileName = excel.FileName,
                    FilePath = excel.FilePath,
                    FileSize = excel.FileSize,
                    RowCount = excel.RowCount,
                    UploadedAt = excel.UploadedAt,
                    UploadedBy = excel.UploadedBy,
                    IsProcessed = excel.IsProcessed,
                    ProcessingNotes = excel.ProcessingNotes
                };

                return Ok(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting BOM excel {Id}", id);
                return StatusCode(500, new ErrorResponse { Message = "Excel dosyası alınırken hata oluştu" });
            }
        }

        /// <summary>
        /// Yeni Excel dosyası yükler ve otomatik parse eder
        /// </summary>
        [HttpPost("upload")]
        [RequestSizeLimit(MaxFileSize)]
        public async Task<ActionResult<BomExcelResponse>> UploadBomExcel([FromForm] int workId, [FromForm] IFormFile file)
        {
            try
            {
                var username = User.FindFirst("username")?.Value ?? "Unknown";
                _logger.LogInformation("Uploading BOM excel for work {WorkId} by user: {Username}",
                    workId, username);

                var work = await _context.BomWorks.FindAsync(workId);
                if (work == null)
                {
                    return NotFound(new ErrorResponse { Message = "BOM çalışması bulunamadı" });
                }

                // Dosya kontrolleri
                if (file == null || file.Length == 0)
                {
                    return BadRequest(new ErrorResponse { Message = "Dosya seçilmedi" });
                }

                if (file.Length > MaxFileSize)
                {
                    return BadRequest(new ErrorResponse { Message = "Dosya boyutu 10MB'dan büyük olamaz" });
                }

                var allowedExtensions = new[] { ".xlsx", ".xls" };
                var fileExtension = Path.GetExtension(file.FileName).ToLowerInvariant();
                if (!allowedExtensions.Contains(fileExtension))
                {
                    return BadRequest(new ErrorResponse { Message = "Sadece Excel dosyaları (.xlsx, .xls) yüklenebilir" });
                }

                // Dosyayı kaydet
                var uploadsFolder = Path.Combine(_environment.ContentRootPath, "Uploads", "BOM");
                Directory.CreateDirectory(uploadsFolder);

                var uniqueFileName = $"{Guid.NewGuid()}_{file.FileName}";
                var filePath = Path.Combine(uploadsFolder, uniqueFileName);

                using (var stream = new FileStream(filePath, FileMode.Create))
                {
                    await file.CopyToAsync(stream);
                }

                // Database kaydı
                var bomExcel = new BomExcel
                {
                    WorkId = workId,
                    FileName = file.FileName,
                    FilePath = filePath,
                    FileSize = file.Length,
                    RowCount = 0,
                    UploadedAt = DateTime.Now,
                    UploadedBy = username,
                    IsProcessed = false
                };

                _context.BomExcels.Add(bomExcel);
                await _context.SaveChangesAsync();


                // Excel'i otomatik parse et
                _logger.LogInformation("Starting automatic Excel parsing for {ExcelId}", bomExcel.Id);

                try
                {
                    var parseResult = await _parserService.ParseAndSaveExcelAsync(bomExcel.Id, filePath);

                    if (!parseResult.Success)
                    {
                        _logger.LogWarning("Excel parsing failed: {Error}", parseResult.ErrorMessage);
                        bomExcel.ProcessingNotes = $"Parse hatası: {parseResult.ErrorMessage}";
                        bomExcel.IsProcessed = false;
                    }
                    else
                    {
                        _logger.LogInformation("Excel parsed successfully. Items: {Count}", parseResult.ProcessedRows);
                        bomExcel.RowCount = parseResult.ProcessedRows;
                        bomExcel.IsProcessed = true;
                        bomExcel.ProcessingNotes = $"{parseResult.ProcessedRows} satır işlendi";
                    }

                    await _context.SaveChangesAsync();
                }
                catch (Exception parseEx)
                {
                    _logger.LogError(parseEx, "Parse exception for Excel {ExcelId}", bomExcel.Id);
                    bomExcel.ProcessingNotes = $"Parse hatası: {parseEx.Message}";
                    bomExcel.IsProcessed = false;
                    await _context.SaveChangesAsync();
                }

                var response = new BomExcelResponse
                {
                    Id = bomExcel.Id,
                    WorkId = bomExcel.WorkId,
                    FileName = bomExcel.FileName,
                    FilePath = bomExcel.FilePath,
                    FileSize = bomExcel.FileSize,
                    RowCount = bomExcel.RowCount,
                    UploadedAt = bomExcel.UploadedAt,
                    UploadedBy = bomExcel.UploadedBy,
                    IsProcessed = bomExcel.IsProcessed,
                    ProcessingNotes = bomExcel.ProcessingNotes
                };

                _logger.LogInformation("BOM excel uploaded and parsed successfully with ID: {Id}", bomExcel.Id);

                return CreatedAtAction(nameof(GetBomExcel), new { id = bomExcel.Id }, response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error uploading BOM excel");
                return StatusCode(500, new ErrorResponse { Message = "Excel dosyası yüklenirken hata oluştu" });
            }
        }

        /// <summary>
        /// Excel dosyasını manuel olarak yeniden parse eder
        /// </summary>
        [HttpPost("{id}/reprocess")]
        public async Task<ActionResult<ProcessExcelResponse>> ReprocessExcel(int id)
        {
            try
            {
                var username = User.FindFirst("username")?.Value;
                _logger.LogInformation("Reprocessing BOM excel {Id} by user: {Username}", id, username);

                var excel = await _context.BomExcels.FindAsync(id);

                if (excel == null)
                {
                    return NotFound(new ErrorResponse { Message = "Excel dosyası bulunamadı" });
                }

                if (!System.IO.File.Exists(excel.FilePath))
                {
                    return NotFound(new ErrorResponse { Message = "Fiziksel dosya bulunamadı" });
                }

                // Önce mevcut BomItem kayıtlarını sil
                var existingItems = await _context.BomItems
                    .Where(i => i.ExcelId == id)
                    .ToListAsync();

                _context.BomItems.RemoveRange(existingItems);
                await _context.SaveChangesAsync();

                // Excel'i yeniden parse et
                var parseResult = await _parserService.ParseAndSaveExcelAsync(id, excel.FilePath);

                var response = new ProcessExcelResponse
                {
                    Success = parseResult.Success,
                    Message = parseResult.ErrorMessage,
                    ProcessedRows = parseResult.ProcessedRows,
                    SkippedRows = parseResult.SkippedRows,
                    NewItemsCreated = parseResult.NewItemsCreated
                };

                return Ok(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error reprocessing BOM excel {Id}", id);
                return StatusCode(500, new ErrorResponse { Message = "Excel yeniden işlenirken hata oluştu" });
            }
        }

        /// <summary>
        /// Excel dosyasını siler
        /// </summary>
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteBomExcel(int id)
        {
            try
            {
                var username = User.FindFirst("username")?.Value;
                _logger.LogInformation("Deleting BOM excel {Id} by user: {Username}", id, username);

                var excel = await _context.BomExcels
                    .Include(e => e.BomItems)
                    .FirstOrDefaultAsync(e => e.Id == id);

                if (excel == null)
                {
                    return NotFound(new ErrorResponse { Message = "Excel dosyası bulunamadı" });
                }

                // Fiziksel dosyayı sil
                if (System.IO.File.Exists(excel.FilePath))
                {
                    System.IO.File.Delete(excel.FilePath);
                }

                // Database kaydını sil (BomItems cascade delete ile silinecek)
                _context.BomExcels.Remove(excel);
                await _context.SaveChangesAsync();

                _logger.LogInformation("BOM excel {Id} deleted successfully", id);

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting BOM excel {Id}", id);
                return StatusCode(500, new ErrorResponse { Message = "Excel dosyası silinirken hata oluştu" });
            }
        }

        /// <summary>
        /// Excel dosyasını indirir
        /// </summary>
        [HttpGet("{id}/download")]
        public async Task<IActionResult> DownloadBomExcel(int id)
        {
            try
            {
                var username = User.FindFirst("username")?.Value;
                _logger.LogInformation("Downloading BOM excel {Id} by user: {Username}", id, username);

                var excel = await _context.BomExcels.FindAsync(id);

                if (excel == null)
                {
                    return NotFound(new ErrorResponse { Message = "Excel dosyası bulunamadı" });
                }

                if (!System.IO.File.Exists(excel.FilePath))
                {
                    return NotFound(new ErrorResponse { Message = "Fiziksel dosya bulunamadı" });
                }

                var memory = new MemoryStream();
                using (var stream = new FileStream(excel.FilePath, FileMode.Open))
                {
                    await stream.CopyToAsync(memory);
                }
                memory.Position = 0;

                var contentType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
                return File(memory, contentType, excel.FileName);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error downloading BOM excel {Id}", id);
                return StatusCode(500, new ErrorResponse { Message = "Excel dosyası indirilirken hata oluştu" });
            }
        }
    }
}