using API.Data;
using API.Data.Entities;
using API.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
#if !DEBUG
    [Authorize] // Sadece Release modda JWT token gerekli
#endif
    public class VisitorsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<VisitorsController> _logger;

        public VisitorsController(ApplicationDbContext context, ILogger<VisitorsController> logger)
        {
            _context = context;
            _logger = logger;
        }

        /// <summary>
        /// Tüm ziyaretçileri filtreli olarak listeler
        /// </summary>
        [HttpGet]
#if DEBUG
        [AllowAnonymous] // Development'ta herkese açık
#endif
        public async Task<IActionResult> GetVisitors([FromQuery] GetVisitorsRequest request)
        {
            try
            {
                _logger.LogInformation("Getting visitors with filters: FromDate={FromDate}, ToDate={ToDate}, Company={Company}, Page={Page}",
                    request.FromDate, request.ToDate, request.Company, request.Page);

                var query = _context.Visitors.AsQueryable();

                // Tarih filtreleri
                if (request.FromDate.HasValue)
                {
                    query = query.Where(v => v.Date >= request.FromDate.Value.Date);
                }

                if (request.ToDate.HasValue)
                {
                    query = query.Where(v => v.Date <= request.ToDate.Value.Date);
                }

                // Şirket filtresi
                if (!string.IsNullOrEmpty(request.Company))
                {
                    query = query.Where(v => v.Company != null && v.Company.Contains(request.Company));
                }

                // Ziyaretçi adı filtresi
                if (!string.IsNullOrEmpty(request.Visitor))
                {
                    query = query.Where(v => v.VisitorName != null && v.VisitorName.Contains(request.Visitor));
                }

                // Toplam kayıt sayısı
                var totalCount = await query.CountAsync();

                // Sıralama
                switch (request.SortBy?.ToLower())
                {
                    case "company":
                        query = request.SortOrder?.ToLower() == "asc"
                            ? query.OrderBy(v => v.Company)
                            : query.OrderByDescending(v => v.Company);
                        break;
                    case "visitor":
                        query = request.SortOrder?.ToLower() == "asc"
                            ? query.OrderBy(v => v.VisitorName)
                            : query.OrderByDescending(v => v.VisitorName);
                        break;
                    case "date":
                    default:
                        query = request.SortOrder?.ToLower() == "asc"
                            ? query.OrderBy(v => v.Date)
                            : query.OrderByDescending(v => v.Date);
                        break;
                }

                // Sayfalama
                var visitors = await query
                    .Skip((request.Page - 1) * request.PageSize)
                    .Take(request.PageSize)
                    .ToListAsync();

                var totalPages = (int)Math.Ceiling(totalCount / (double)request.PageSize);

                var response = new GetVisitorsResponse
                {
                    Visitors = visitors.Select(v => new VisitorResponse
                    {
                        Id = v.Id,
                        Date = v.Date,
                        Company = v.Company,
                        Visitor = v.VisitorName, // Database'deki VisitorName field'ını frontend'in beklediği Visitor'a map et
                        Description = v.Description,
                        CreatedAt = v.CreatedAt,
                        UpdatedAt = v.UpdatedAt
                    }).ToList(),
                    TotalCount = totalCount,
                    Page = request.Page,
                    PageSize = request.PageSize,
                    TotalPages = totalPages,
                    HasNextPage = request.Page < totalPages,
                    HasPreviousPage = request.Page > 1
                };

                _logger.LogInformation("Retrieved {Count} visitors out of {Total} total, Page: {Page}/{TotalPages}. First visitor: {@FirstVisitor}",
                    visitors.Count, totalCount, request.Page, totalPages, visitors.FirstOrDefault());

                return Ok(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting visitors");
                return StatusCode(500, new ErrorResponse { Message = "Ziyaretçiler alınırken hata oluştu" });
            }
        }

        /// <summary>
        /// ID'ye göre tek ziyaretçi getirir
        /// </summary>
        [HttpGet("{id}")]
#if DEBUG
        [AllowAnonymous] // Development'ta herkese açık
#endif
        public async Task<IActionResult> GetVisitor(int id)
        {
            try
            {
                _logger.LogInformation("Getting visitor with ID: {Id}", id);

                var visitor = await _context.Visitors.FindAsync(id);

                if (visitor == null)
                {
                    _logger.LogWarning("Visitor not found with ID: {Id}", id);
                    return NotFound(new ErrorResponse { Message = "Ziyaretçi bulunamadı" });
                }

                var response = new VisitorResponse
                {
                    Id = visitor.Id,
                    Date = visitor.Date,
                    Company = visitor.Company,
                    Visitor = visitor.VisitorName,
                    Description = visitor.Description,
                    CreatedAt = visitor.CreatedAt,
                    UpdatedAt = visitor.UpdatedAt
                };

                _logger.LogInformation("Retrieved visitor: {Id} - {Company} - {Visitor}",
                    visitor.Id, visitor.Company, visitor.VisitorName);

                return Ok(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting visitor with ID: {Id}", id);
                return StatusCode(500, new ErrorResponse { Message = "Ziyaretçi alınırken hata oluştu" });
            }
        }

        /// <summary>
        /// Yeni ziyaretçi oluşturur
        /// </summary>
        [HttpPost]
        public async Task<IActionResult> CreateVisitor([FromBody] CreateVisitorRequest request)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                _logger.LogInformation("Creating new visitor: {Company} - {Visitor} - {Date}",
                    request.Company, request.Visitor, request.Date);

                var visitor = new Visitor
                {
                    Date = request.Date.Date, // Saat bilgisini temizle
                    Company = request.Company,
                    VisitorName = request.Visitor,
                    Description = request.Description
                };

                _context.Visitors.Add(visitor);
                await _context.SaveChangesAsync();

                var response = new CreateVisitorResponse
                {
                    Success = true,
                    Id = visitor.Id,
                    Message = "Ziyaretçi başarıyla oluşturuldu",
                    Visitor = new VisitorResponse
                    {
                        Id = visitor.Id,
                        Date = visitor.Date,
                        Company = visitor.Company,
                        Visitor = visitor.VisitorName,
                        Description = visitor.Description,
                        CreatedAt = visitor.CreatedAt,
                        UpdatedAt = visitor.UpdatedAt
                    }
                };

                _logger.LogInformation("Created visitor successfully with ID: {Id}", visitor.Id);

                return CreatedAtAction(nameof(GetVisitor), new { id = visitor.Id }, response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating visitor");
                return StatusCode(500, new ErrorResponse { Message = "Ziyaretçi oluşturulurken hata oluştu" });
            }
        }

        /// <summary>
        /// Ziyaretçi bilgilerini günceller
        /// </summary>
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateVisitor(int id, [FromBody] UpdateVisitorRequest request)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                _logger.LogInformation("Updating visitor with ID: {Id}", id);

                var visitor = await _context.Visitors.FindAsync(id);

                if (visitor == null)
                {
                    _logger.LogWarning("Visitor not found for update with ID: {Id}", id);
                    return NotFound(new ErrorResponse { Message = "Ziyaretçi bulunamadı" });
                }

                // Güncelleme
                visitor.Date = request.Date.Date;
                visitor.Company = request.Company;
                visitor.VisitorName = request.Visitor;
                visitor.Description = request.Description;

                await _context.SaveChangesAsync();

                var response = new UpdateVisitorResponse
                {
                    Success = true,
                    Message = "Ziyaretçi başarıyla güncellendi",
                    Visitor = new VisitorResponse
                    {
                        Id = visitor.Id,
                        Date = visitor.Date,
                        Company = visitor.Company,
                        Visitor = visitor.VisitorName,
                        Description = visitor.Description,
                        CreatedAt = visitor.CreatedAt,
                        UpdatedAt = visitor.UpdatedAt
                    }
                };

                _logger.LogInformation("Updated visitor successfully with ID: {Id}", visitor.Id);

                return Ok(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating visitor with ID: {Id}", id);
                return StatusCode(500, new ErrorResponse { Message = "Ziyaretçi güncellenirken hata oluştu" });
            }
        }

        /// <summary>
        /// Ziyaretçi siler
        /// </summary>
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteVisitor(int id)
        {
            try
            {
                _logger.LogInformation("Deleting visitor with ID: {Id}", id);

                var visitor = await _context.Visitors.FindAsync(id);

                if (visitor == null)
                {
                    _logger.LogWarning("Visitor not found for delete with ID: {Id}", id);
                    return NotFound(new ErrorResponse { Message = "Ziyaretçi bulunamadı" });
                }

                _context.Visitors.Remove(visitor);
                await _context.SaveChangesAsync();

                var response = new DeleteVisitorResponse
                {
                    Success = true,
                    Message = "Ziyaretçi başarıyla silindi"
                };

                _logger.LogInformation("Deleted visitor successfully with ID: {Id}", id);

                return Ok(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting visitor with ID: {Id}", id);
                return StatusCode(500, new ErrorResponse { Message = "Ziyaretçi silinirken hata oluştu" });
            }
        }

        /// <summary>
        /// Ziyaretçi istatistikleri (Dashboard için)
        /// </summary>
        [HttpGet("stats")]
#if DEBUG
        [AllowAnonymous] // Development'ta herkese açık
#endif
        public async Task<IActionResult> GetVisitorStats()
        {
            try
            {
                _logger.LogInformation("Getting visitor statistics");

                var now = DateTime.Now;
                var today = now.Date;
                var startOfWeek = today.AddDays(-(int)today.DayOfWeek);
                var startOfMonth = new DateTime(now.Year, now.Month, 1);

                var stats = new VisitorStatsResponse
                {
                    TotalVisitors = await _context.Visitors.CountAsync(),
                    TodayVisitors = await _context.Visitors.CountAsync(v => v.Date == today),
                    ThisWeekVisitors = await _context.Visitors.CountAsync(v => v.Date >= startOfWeek && v.Date <= today),
                    ThisMonthVisitors = await _context.Visitors.CountAsync(v => v.Date >= startOfMonth && v.Date <= today),
                };

                // Son 7 günün ziyaretçi sayıları
                var last7Days = await _context.Visitors
                    .Where(v => v.Date >= today.AddDays(-6) && v.Date <= today)
                    .GroupBy(v => v.Date)
                    .Select(g => new VisitorsByDateResponse
                    {
                        Date = g.Key ?? today,
                        Count = g.Count()
                    })
                    .OrderBy(x => x.Date)
                    .ToListAsync();

                stats.VisitorsByDate = last7Days;

                // En çok ziyaret eden şirketler (son 30 gün)
                var topCompanies = await _context.Visitors
                    .Where(v => v.Date >= today.AddDays(-30) && !string.IsNullOrEmpty(v.Company))
                    .GroupBy(v => v.Company)
                    .Select(g => new VisitorsByCompanyResponse
                    {
                        Company = g.Key ?? "",
                        Count = g.Count(),
                        LastVisit = g.Max(v => v.Date) ?? today
                    })
                    .OrderByDescending(x => x.Count)
                    .Take(5)
                    .ToListAsync();

                stats.TopCompanies = topCompanies;

                _logger.LogInformation("Retrieved visitor statistics: Total={Total}, Today={Today}, Week={Week}, Month={Month}",
                    stats.TotalVisitors, stats.TodayVisitors, stats.ThisWeekVisitors, stats.ThisMonthVisitors);

                return Ok(stats);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting visitor statistics");
                return StatusCode(500, new ErrorResponse { Message = "İstatistikler alınırken hata oluştu" });
            }
        }

        /// <summary>
        /// Ziyaretçi verilerini Excel'e aktarmak için basit endpoint
        /// </summary>
        [HttpGet("export")]
        public async Task<IActionResult> ExportVisitors([FromQuery] GetVisitorsRequest request)
        {
            try
            {
                _logger.LogInformation("Exporting visitors data");

                // Aynı filtreleme mantığını kullan ama sayfalama olmadan
                var query = _context.Visitors.AsQueryable();

                if (request.FromDate.HasValue)
                {
                    query = query.Where(v => v.Date >= request.FromDate.Value.Date);
                }

                if (request.ToDate.HasValue)
                {
                    query = query.Where(v => v.Date <= request.ToDate.Value.Date);
                }

                if (!string.IsNullOrEmpty(request.Company))
                {
                    query = query.Where(v => v.Company != null && v.Company.Contains(request.Company));
                }

                if (!string.IsNullOrEmpty(request.Visitor))
                {
                    query = query.Where(v => v.VisitorName != null && v.VisitorName.Contains(request.Visitor));
                }

                var visitors = await query
                    .OrderByDescending(v => v.Date)
                    .Select(v => new VisitorResponse
                    {
                        Id = v.Id,
                        Date = v.Date,
                        Company = v.Company,
                        Visitor = v.VisitorName,
                        Description = v.Description,
                        CreatedAt = v.CreatedAt,
                        UpdatedAt = v.UpdatedAt
                    })
                    .ToListAsync();

                _logger.LogInformation("Exported {Count} visitors", visitors.Count);

                return Ok(visitors);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error exporting visitors");
                return StatusCode(500, new ErrorResponse { Message = "Veriler aktarılırken hata oluştu" });
            }
        }

        /// <summary>
        /// Test endpoint - Development için database ve mapping testi
        /// </summary>
        [HttpGet("debug")]
        [AllowAnonymous]
        public async Task<IActionResult> GetDebugInfo()
        {
            try
            {
                var connectionStatus = _context.Database.CanConnect();
                var visitorCount = connectionStatus ? await _context.Visitors.CountAsync() : 0;
                var firstVisitor = connectionStatus ? await _context.Visitors.FirstOrDefaultAsync() : null;

                var mappedFirstVisitor = firstVisitor != null ? new VisitorResponse
                {
                    Id = firstVisitor.Id,
                    Date = firstVisitor.Date,
                    Company = firstVisitor.Company,
                    Visitor = firstVisitor.VisitorName, // Mapping kontrolü
                    Description = firstVisitor.Description,
                    CreatedAt = firstVisitor.CreatedAt,
                    UpdatedAt = firstVisitor.UpdatedAt
                } : null;

                return Ok(new
                {
                    DatabaseConnected = connectionStatus,
                    VisitorCount = visitorCount,
                    FirstVisitorRaw = firstVisitor,
                    FirstVisitorMapped = mappedFirstVisitor,
                    ConnectionString = _context.Database.GetConnectionString()?.Substring(0, 50) + "...",
                    TableName = "visitors"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Debug endpoint error");
                return Ok(new
                {
                    Error = ex.Message,
                    DatabaseConnected = false,
                    VisitorCount = 0
                });
            }
        }
    }
}