using API.Data;
using API.Data.Entities;
using API.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
#if !DEBUG
    [Authorize] // Sadece Release modda JWT token gerekli
#endif
    public class BomWorksController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<BomWorksController> _logger;
        private readonly RedmineService _redmineService; // ← EKLE

        public BomWorksController(
        ApplicationDbContext context,
        ILogger<BomWorksController> logger,
        RedmineService redmineService) // ← EKLE
        {
            _context = context;
            _logger = logger;
            _redmineService = redmineService; // ← EKLE
        }

        [HttpPost("list")]
        public async Task<ActionResult<GetBomWorksResponse>> GetBomWorks([FromBody] GetBomWorksRequest request)
        {
            try
            {
                var username = User.FindFirst("username")?.Value;
                _logger.LogInformation("Getting BOM works for user: {Username}", username);

                var query = _context.BomWorks.Where(s=> s.IsActive)
                    .Include(w => w.BomExcels)
                    .ThenInclude(e => e.BomItems)
                    .AsQueryable();

                // Search filter
                if (!string.IsNullOrWhiteSpace(request.SearchTerm))
                {
                    query = query.Where(w =>  
                        w.WorkName.Contains(request.SearchTerm) ||
                        w.Description.Contains(request.SearchTerm)  
                        );
                }

                var totalCount = await query.CountAsync();

                // Sorting
                query = (request.SortBy?.ToLower()) switch
                {
                    "workname" => request.SortOrder?.ToLower() == "desc"
                        ? query.OrderByDescending(w => w.WorkName)
                        : query.OrderBy(w => w.WorkName),
                    "projectid" => request.SortOrder?.ToLower() == "desc"
                        ? query.OrderByDescending(w => w.ProjectId)
                        : query.OrderBy(w => w.ProjectId),
                    _ => request.SortOrder?.ToLower() == "desc"
                        ? query.OrderByDescending(w => w.CreatedAt)
                        : query.OrderBy(w => w.CreatedAt)
                };

                // Pagination
                var works = await query
                    .Skip((request.Page - 1) * request.PageSize)
                    .Take(request.PageSize)
                    .ToListAsync();

                // ✅ Tüm unique project ID'leri topla
                var projectIds = works.Select(w => w.ProjectId).Distinct().ToList();

                // ✅ Proje adlarını cache'e al (tek seferde)
                var projectNames = new Dictionary<int, string>();
                foreach (var projectId in projectIds)
                {
                    var projectName = await GetProjectNameAsync(
                        projectId,
                        request.RedmineUsername,
                        request.RedminePassword);
                    projectNames[projectId] = projectName;
                }

                // ✅ Response oluştur
                var response = works.Select(w => new BomWorkResponse
                {
                    Id = w.Id,
                    ProjectId = w.ProjectId,
                    ProjectName = projectNames.ContainsKey(w.ProjectId)
                        ? projectNames[w.ProjectId]
                        : $"Proje {w.ProjectId}",
                    WorkName = w.WorkName,
                    Description = w.Description,
                    CreatedAt = w.CreatedAt,
                    UpdatedAt = w.UpdatedAt,
                    CreatedBy = w.CreatedBy,
                    IsActive = w.IsActive,
                    ExcelCount = w.BomExcels.Count,
                    TotalRows = w.BomExcels.Sum(e => e.RowCount)
                }).ToList();

                _logger.LogInformation("Found {Count} BOM works", response.Count);

                return Ok(new GetBomWorksResponse
                {
                    Works = response,
                    TotalCount = totalCount,
                    Page = request.Page,
                    PageSize = request.PageSize
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting BOM works");
                return StatusCode(500, new ErrorResponse { Message = "BOM çalışmaları alınırken hata oluştu" });
            }
        }
        [HttpGet("{id}")]
        public async Task<ActionResult<BomWorkResponse>> GetBomWork(
                     int id,
                     [FromQuery] string? redmineUsername = null,
                     [FromQuery] string? redminePassword = null)
        {
            try
            {
                var username = User.FindFirst("username")?.Value;
                _logger.LogInformation("Getting BOM work {Id} for user: {Username}", id, username);

                var work = await _context.BomWorks
                    .Include(w => w.BomExcels)
                    .ThenInclude(e => e.BomItems)
                    .FirstOrDefaultAsync(w => w.Id == id);

                if (work == null)
                {
                    return NotFound(new ErrorResponse { Message = "BOM çalışması bulunamadı" });
                }

                // ✅ Query parameter'dan gelen credentials ile proje adını al
                var projectName = await GetProjectNameAsync(
                    work.ProjectId,
                    redmineUsername,
                    redminePassword);

                var response = new BomWorkResponse
                {
                    Id = work.Id,
                    ProjectId = work.ProjectId,
                    ProjectName = projectName, // ✅ DEĞİŞTİ
                    WorkName = work.WorkName,
                    Description = work.Description,
                    CreatedAt = work.CreatedAt,
                    UpdatedAt = work.UpdatedAt,
                    CreatedBy = work.CreatedBy,
                    IsActive = work.IsActive,
                    ExcelCount = work.BomExcels.Count,
                    TotalRows = work.BomExcels.Sum(e => e.RowCount)
                };

                return Ok(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting BOM work {Id}", id);
                return StatusCode(500, new ErrorResponse { Message = "BOM çalışması alınırken hata oluştu" });
            }
        }

        [HttpPost]
        public async Task<ActionResult<BomWorkResponse>> CreateBomWork([FromBody] CreateBomWorkRequest request)
        {
            try
            {
                var username = User.FindFirst("username")?.Value ?? "Unknown";
                _logger.LogInformation("Creating BOM work for project {ProjectId} by user: {Username}",
                    request.ProjectId, username);

                var work = new BomWork
                {
                    ProjectId = request.ProjectId,
                    ProjectName = request.ProjectName, // ✅ EKLE: Frontend'den gelen proje adı
                    WorkName = request.WorkName,
                    Description = request.Description,
                    CreatedBy = username,
                    CreatedAt = DateTime.Now,
                    IsActive = true
                };

                _context.BomWorks.Add(work);
                await _context.SaveChangesAsync();

                var response = new BomWorkResponse
                {
                    Id = work.Id,
                    ProjectId = work.ProjectId,
                    ProjectName = work.ProjectName ?? $"Project #{work.ProjectId}", // ✅ Response'a ekle
                    WorkName = work.WorkName,
                    Description = work.Description,
                    CreatedAt = work.CreatedAt,
                    UpdatedAt = work.UpdatedAt,
                    CreatedBy = work.CreatedBy,
                    IsActive = work.IsActive,
                    ExcelCount = 0,
                    TotalRows = 0
                };

                _logger.LogInformation("BOM work created with ID: {Id}", work.Id);
                return CreatedAtAction(nameof(GetBomWork), new { id = work.Id }, response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating BOM work");
                return StatusCode(500, new ErrorResponse { Message = "BOM çalışması oluşturulurken hata oluştu" });
            }
        }

        /// <summary>
        /// BOM çalışmasını günceller
        /// </summary>
        [HttpPut("{id}")]
        public async Task<ActionResult<BomWorkResponse>> UpdateBomWork(int id, [FromBody] UpdateBomWorkRequest request)
        {
            try
            {
                var username = User.FindFirst("username")?.Value;
                _logger.LogInformation("Updating BOM work {Id} by user: {Username}", id, username);

                var work = await _context.BomWorks
                    .Include(w => w.BomExcels)
                    .ThenInclude(e => e.BomItems)
                    .FirstOrDefaultAsync(w => w.Id == id);

                if (work == null)
                {
                    return NotFound(new ErrorResponse { Message = "BOM çalışması bulunamadı" });
                }

                work.WorkName = request.WorkName;
                work.Description = request.Description;
                work.UpdatedAt = DateTime.Now;

                await _context.SaveChangesAsync();

                var response = new BomWorkResponse
                {
                    Id = work.Id,
                    ProjectId = work.ProjectId,
                    ProjectName = await GetProjectNameAsync(work.ProjectId),
                    WorkName = work.WorkName,
                    Description = work.Description,
                    CreatedAt = work.CreatedAt,
                    UpdatedAt = work.UpdatedAt,
                    CreatedBy = work.CreatedBy,
                    IsActive = work.IsActive,
                    ExcelCount = work.BomExcels.Count,
                    TotalRows = work.BomExcels.Sum(e => e.RowCount)
                };

                _logger.LogInformation("BOM work {Id} updated successfully", id);

                return Ok(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating BOM work {Id}", id);
                return StatusCode(500, new ErrorResponse { Message = "BOM çalışması güncellenirken hata oluştu" });
            }
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

                // ProjectsController gibi: DEBUG modunda frontend'den, Production'da JWT'den al
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
        /// <summary>
        /// BOM çalışmasını siler (soft delete)
        /// </summary>
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteBomWork(int id)
        {
            try
            {
                var username = User.FindFirst("username")?.Value;
                _logger.LogInformation("Deleting BOM work {Id} by user: {Username}", id, username);

                var work = await _context.BomWorks.FindAsync(id);

                if (work == null)
                {
                    return NotFound(new ErrorResponse { Message = "BOM çalışması bulunamadı" });
                }

                // Soft delete
                work.IsActive = false;
                work.UpdatedAt = DateTime.Now;

                await _context.SaveChangesAsync();

                _logger.LogInformation("BOM work {Id} deleted successfully", id);

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting BOM work {Id}", id);
                return StatusCode(500, new ErrorResponse { Message = "BOM çalışması silinirken hata oluştu" });
            }
        }

        /// <summary>
        /// BOM çalışmasını tamamen siler (hard delete)
        /// </summary>
        [HttpDelete("{id}/permanent")]
        public async Task<IActionResult> PermanentDeleteBomWork(int id)
        {
            try
            {
                var username = User.FindFirst("username")?.Value;
                _logger.LogInformation("Permanently deleting BOM work {Id} by user: {Username}", id, username);

                var work = await _context.BomWorks
                    .Include(w => w.BomExcels)
                    .ThenInclude(e => e.BomItems)
                    .FirstOrDefaultAsync(w => w.Id == id);

                if (work == null)
                {
                    return NotFound(new ErrorResponse { Message = "BOM çalışması bulunamadı" });
                }

                _context.BomWorks.Remove(work);
                await _context.SaveChangesAsync();

                _logger.LogInformation("BOM work {Id} permanently deleted", id);

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error permanently deleting BOM work {Id}", id);
                return StatusCode(500, new ErrorResponse { Message = "BOM çalışması silinirken hata oluştu" });
            }
        }
    }
}