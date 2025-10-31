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

        public BomWorksController(
            ApplicationDbContext context,
            ILogger<BomWorksController> logger)
        {
            _context = context;
            _logger = logger;
        }

        /// <summary>
        /// BOM çalışmalarını listeler
        /// </summary>
        [HttpPost("list")]
        public async Task<ActionResult<GetBomWorksResponse>> GetBomWorks([FromBody] GetBomWorksRequest request)
        {
            try
            {
                var username = User.FindFirst("username")?.Value;
                _logger.LogInformation("Getting BOM works for user: {Username}", username);

                var query = _context.BomWorks
                    .Include(w => w.BomExcels)
                    .ThenInclude(e => e.BomItems)
                    .AsQueryable();

                // Filtreleme
                if (request.ProjectId.HasValue)
                {
                    query = query.Where(w => w.ProjectId == request.ProjectId.Value);
                }

                if (!string.IsNullOrEmpty(request.SearchTerm))
                {
                    query = query.Where(w => w.WorkName.Contains(request.SearchTerm));
                }

                if (!request.IncludeInactive)
                {
                    query = query.Where(w => w.IsActive);
                }

                // Toplam kayıt sayısı
                var totalCount = await query.CountAsync();

                // Sıralama
                query = request.SortBy?.ToLower() switch
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

                // Sayfalama
                var works = await query
                    .Skip((request.Page - 1) * request.PageSize)
                    .Take(request.PageSize)
                    .Select(w => new BomWorkResponse
                    {
                        Id = w.Id,
                        ProjectId = w.ProjectId,
                        ProjectName = $"Proje {w.ProjectId}", // TODO: Redmine'dan proje adı çekilebilir
                        WorkName = w.WorkName,
                        Description = w.Description,
                        CreatedAt = w.CreatedAt,
                        UpdatedAt = w.UpdatedAt,
                        CreatedBy = w.CreatedBy,
                        IsActive = w.IsActive,
                        ExcelCount = w.BomExcels.Count,
                        TotalRows = w.BomExcels.Sum(e => e.RowCount)
                    })
                    .ToListAsync();

                _logger.LogInformation("Found {Count} BOM works", works.Count);

                return Ok(new GetBomWorksResponse
                {
                    Works = works,
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

        /// <summary>
        /// BOM çalışma detayını getirir
        /// </summary>
        [HttpGet("{id}")]
        public async Task<ActionResult<BomWorkResponse>> GetBomWork(int id)
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

                var response = new BomWorkResponse
                {
                    Id = work.Id,
                    ProjectId = work.ProjectId,
                    ProjectName = $"Proje {work.ProjectId}", // TODO: Redmine'dan proje adı çekilebilir
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

        /// <summary>
        /// Yeni BOM çalışması oluşturur
        /// </summary>
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
                    ProjectName = $"Proje {work.ProjectId}", // TODO: Redmine'dan proje adı çekilebilir
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
                    ProjectName = $"Proje {work.ProjectId}",
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