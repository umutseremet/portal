// ============================================================
// src/backend/API/Controllers/MonthlyProductionPlanController.cs
// YENİ DOSYA
// ============================================================

using API.Data;
using API.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Data.SqlClient;

namespace API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class MonthlyProductionPlanController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IConfiguration _configuration;
        private readonly ILogger<MonthlyProductionPlanController> _logger;

        public MonthlyProductionPlanController(
            ApplicationDbContext context,
            IConfiguration configuration,
            ILogger<MonthlyProductionPlanController> logger)
        {
            _context = context;
            _configuration = configuration;
            _logger = logger;
        }

        // ─────────────────────────────────────────────────────────────────────
        // GET: Aylık plan verisi
        // ─────────────────────────────────────────────────────────────────────

        /// <summary>
        /// Belirtilen ay için tüm plan girişlerini döner
        /// GET /api/MonthlyProductionPlan/GetMonthlyPlan?year=2025&month=2
        /// </summary>
        [HttpGet("GetMonthlyPlan")]
#if DEBUG
        [AllowAnonymous]
#endif
        public async Task<IActionResult> GetMonthlyPlan([FromQuery] int year, [FromQuery] int month)
        {
            try
            {
                if (year < 2020 || year > 2100 || month < 1 || month > 12)
                    return BadRequest(new ErrorResponse { Message = "Geçersiz yıl veya ay değeri" });

                var startDate = new DateTime(year, month, 1);
                var endDate = startDate.AddMonths(1).AddDays(-1);

                var entries = await _context.MonthlyProductionPlanEntries
                    .Include(e => e.PlanIssues)
                    .Where(e => e.PlanDate >= startDate && e.PlanDate <= endDate)
                    .OrderBy(e => e.PlanDate)
                    .ThenBy(e => e.ProjectCode)
                    .ToListAsync();

                var response = new MonthlyPlanResponse
                {
                    Year = year,
                    Month = month,
                    Entries = entries.Select(e => new MonthlyPlanEntryResponse
                    {
                        Id = e.Id,
                        PlanDate = e.PlanDate.ToString("yyyy-MM-dd"),
                        ProjectId = e.ProjectId,
                        ProjectCode = e.ProjectCode,
                        ProjectName = e.ProjectName,
                        PlanType = e.PlanType,
                        Color = e.Color,
                        IssueIds = e.PlanIssues.Select(i => i.RedmineIssueId).ToList()
                    }).ToList()
                };

                _logger.LogInformation("Monthly plan fetched: {Year}/{Month} - {Count} entries", year, month, entries.Count);
                return Ok(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting monthly plan for {Year}/{Month}", year, month);
                return StatusCode(500, new ErrorResponse { Message = $"Hata: {ex.Message}" });
            }
        }

        // ─────────────────────────────────────────────────────────────────────
        // POST: Plan girişi kaydet (yeni veya güncelle)
        // ─────────────────────────────────────────────────────────────────────

        /// <summary>
        /// Yeni plan girişi oluşturur veya mevcutu günceller.
        /// Aynı tarih/proje/tip kombinasyonu varsa issue listesi güncellenir.
        /// POST /api/MonthlyProductionPlan/SavePlanEntry
        /// </summary>
        [HttpPost("SavePlanEntry")]
#if DEBUG
        [AllowAnonymous]
#endif
        public async Task<IActionResult> SavePlanEntry([FromBody] SaveMonthlyPlanEntryRequest request)
        {
            try
            {
                if (!ModelState.IsValid)
                    return BadRequest(ModelState);

                if (!DateTime.TryParse(request.PlanDate, out DateTime planDate))
                    return BadRequest(new ErrorResponse { Message = "Geçersiz tarih formatı" });

                if (request.PlanType != "Üretim" && request.PlanType != "Montaj")
                    return BadRequest(new ErrorResponse { Message = "PlanType 'Üretim' veya 'Montaj' olmalıdır" });

                if (request.IssueIds == null || request.IssueIds.Count == 0)
                    return BadRequest(new ErrorResponse { Message = "En az bir iş seçilmelidir" });

                var username = User.FindFirst("username")?.Value ?? "system";

                // Mevcut kayıt var mı? (aynı tarih+proje+tip)
                var existing = await _context.MonthlyProductionPlanEntries
                    .Include(e => e.PlanIssues)
                    .FirstOrDefaultAsync(e =>
                        e.PlanDate.Date == planDate.Date &&
                        e.ProjectId == request.ProjectId &&
                        e.PlanType == request.PlanType);

                if (existing != null)
                {
                    // ─ Güncelle ─
                    existing.ProjectCode = request.ProjectCode;
                    existing.ProjectName = request.ProjectName;
                    existing.Color = request.Color;
                    existing.UpdatedAt = DateTime.Now;

                    // Issue listesini sıfırla ve yeniden ekle
                    _context.MonthlyProductionPlanIssues.RemoveRange(existing.PlanIssues);
                    foreach (var issueId in request.IssueIds.Distinct())
                    {
                        _context.MonthlyProductionPlanIssues.Add(new MonthlyProductionPlanIssue
                        {
                            PlanEntryId = existing.Id,
                            RedmineIssueId = issueId
                        });
                    }

                    await _context.SaveChangesAsync();
                    _logger.LogInformation("Plan entry updated: Id={Id}, Date={Date}, Project={Project}, Type={Type}",
                        existing.Id, planDate.ToString("yyyy-MM-dd"), request.ProjectCode, request.PlanType);

                    return Ok(new { Id = existing.Id, Message = "Plan güncellendi", IsNew = false });
                }
                else
                {
                    // ─ Yeni kayıt ─
                    var entry = new MonthlyProductionPlanEntry
                    {
                        PlanDate = planDate.Date,
                        ProjectId = request.ProjectId,
                        ProjectCode = request.ProjectCode,
                        ProjectName = request.ProjectName,
                        PlanType = request.PlanType,
                        Color = request.Color,
                        CreatedBy = username,
                        CreatedAt = DateTime.Now,
                        PlanIssues = request.IssueIds.Distinct().Select(issueId => new MonthlyProductionPlanIssue
                        {
                            RedmineIssueId = issueId
                        }).ToList()
                    };

                    _context.MonthlyProductionPlanEntries.Add(entry);
                    await _context.SaveChangesAsync();

                    _logger.LogInformation("Plan entry created: Id={Id}, Date={Date}, Project={Project}, Type={Type}",
                        entry.Id, planDate.ToString("yyyy-MM-dd"), request.ProjectCode, request.PlanType);

                    return Ok(new { Id = entry.Id, Message = "Plan eklendi", IsNew = true });
                }
            }
            catch (DbUpdateException dbEx)
            {
                _logger.LogError(dbEx, "DB error saving plan entry");
                return StatusCode(500, new ErrorResponse { Message = "Veritabanı hatası oluştu" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error saving plan entry");
                return StatusCode(500, new ErrorResponse { Message = $"Hata: {ex.Message}" });
            }
        }

        // ─────────────────────────────────────────────────────────────────────
        // DELETE: Plan girişi sil
        // ─────────────────────────────────────────────────────────────────────

        /// <summary>
        /// Plan girişini siler (issue'ları cascade ile silinir)
        /// DELETE /api/MonthlyProductionPlan/DeletePlanEntry/{id}
        /// </summary>
        [HttpDelete("DeletePlanEntry/{id}")]
#if DEBUG
        [AllowAnonymous]
#endif
        public async Task<IActionResult> DeletePlanEntry(int id)
        {
            try
            {
                var entry = await _context.MonthlyProductionPlanEntries
                    .Include(e => e.PlanIssues)
                    .FirstOrDefaultAsync(e => e.Id == id);

                if (entry == null)
                    return NotFound(new ErrorResponse { Message = $"Plan girişi bulunamadı: Id={id}" });

                _context.MonthlyProductionPlanEntries.Remove(entry);
                await _context.SaveChangesAsync();

                _logger.LogInformation("Plan entry deleted: Id={Id}", id);
                return Ok(new { Message = "Plan silindi" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting plan entry {Id}", id);
                return StatusCode(500, new ErrorResponse { Message = $"Hata: {ex.Message}" });
            }
        }

        // ─────────────────────────────────────────────────────────────────────
        // GET: Planlama için proje listesi (Redmine'dan, proje kodu dahil)
        // ─────────────────────────────────────────────────────────────────────

        /// <summary>
        /// Aktif projeleri proje kodu (custom_field_id=3) ile birlikte döner.
        /// Redmine DB'ye direct SQL ile bağlanır (hızlı arama için).
        /// GET /api/MonthlyProductionPlan/GetProjectsForPlanning
        /// </summary>
        [HttpGet("GetProjectsForPlanning")]
#if DEBUG
        [AllowAnonymous]
#endif
        public async Task<IActionResult> GetProjectsForPlanning([FromQuery] string? search = null)
        {
            try
            {
                var connectionString = _configuration.GetConnectionString("DefaultConnection")
                    ?? throw new InvalidOperationException("Database bağlantısı yapılandırılmamış");

                var sql = @"
                    SELECT 
                        p.id,
                        p.name,
                        p.identifier,
                        ISNULL(cv.value, '') AS project_code
                    FROM projects p
                    LEFT JOIN custom_values cv 
                        ON cv.customized_id = p.id 
                        AND cv.customized_type = 'Project'
                        AND cv.custom_field_id = 3
                    WHERE p.status = 1  -- Aktif projeler
                ";

                if (!string.IsNullOrWhiteSpace(search))
                {
                    sql += " AND (p.name LIKE @Search OR cv.value LIKE @Search)";
                }

                sql += " ORDER BY cv.value, p.name";

                var projects = new List<PlanningProjectItem>();

                using (var connection = new SqlConnection(connectionString))
                {
                    await connection.OpenAsync();
                    using (var command = new SqlCommand(sql, connection))
                    {
                        if (!string.IsNullOrWhiteSpace(search))
                        {
                            command.Parameters.AddWithValue("@Search", $"%{search}%");
                        }

                        using (var reader = await command.ExecuteReaderAsync())
                        {
                            while (await reader.ReadAsync())
                            {
                                projects.Add(new PlanningProjectItem
                                {
                                    Id = reader.GetInt32(reader.GetOrdinal("id")),
                                    Name = reader.GetString(reader.GetOrdinal("name")),
                                    Identifier = reader.GetString(reader.GetOrdinal("identifier")),
                                    ProjectCode = reader.IsDBNull(reader.GetOrdinal("project_code"))
                                        ? string.Empty
                                        : reader.GetString(reader.GetOrdinal("project_code"))
                                });
                            }
                        }
                    }
                }

                _logger.LogInformation("GetProjectsForPlanning: {Count} projects returned (search: {Search})", projects.Count, search ?? "none");
                return Ok(projects);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting projects for planning");
                return StatusCode(500, new ErrorResponse { Message = $"Hata: {ex.Message}" });
            }
        }

        // ─────────────────────────────────────────────────────────────────────
        // POST: Planlama modalı için issue listesi
        // ─────────────────────────────────────────────────────────────────────

        /// <summary>
        /// Seçilen proje + plan tipine (Üretim/Montaj) göre Redmine issue'larını döner.
        /// POST /api/MonthlyProductionPlan/GetProjectIssuesForPlanning
        /// </summary>
        [HttpPost("GetProjectIssuesForPlanning")]
#if DEBUG
        [AllowAnonymous]
#endif
        public async Task<IActionResult> GetProjectIssuesForPlanning([FromBody] GetProjectIssuesForPlanningRequest request)
        {
            try
            {
                if (!ModelState.IsValid)
                    return BadRequest(ModelState);

                if (request.PlanType != "Üretim" && request.PlanType != "Montaj")
                    return BadRequest(new ErrorResponse { Message = "PlanType 'Üretim' veya 'Montaj' olmalıdır" });

                var connectionString = _configuration.GetConnectionString("DefaultConnection")
                    ?? throw new InvalidOperationException("Database bağlantısı yapılandırılmamış");

                // Üretim = "Üretim -%" tracker'ları, Montaj = "Montaj" tracker'ı
                var trackerCondition = request.PlanType == "Montaj"
                    ? "t.name = N'Montaj'"
                    : "t.name LIKE N'Üretim -%'";

                var sql = $@"
                    SELECT 
                        i.id AS issue_id,
                        i.subject,
                        t.name AS tracker_name,
                        s.name AS status_name,
                        s.is_closed,
                        ISNULL(cv_pbaslangic.value, '') AS planned_start,
                        ISNULL(cv_pbitis.value, '')     AS planned_end,
                        ISNULL(cv_revize_baslangic.value, '') AS revised_start,
                        ISNULL(cv_revize_bitis.value, '')     AS revised_end
                    FROM issues i
                    INNER JOIN trackers t ON t.id = i.tracker_id
                    INNER JOIN issue_statuses s ON s.id = i.status_id
                    LEFT JOIN custom_values cv_pbaslangic
                        ON cv_pbaslangic.customized_id = i.id
                        AND cv_pbaslangic.customized_type = 'Issue'
                        AND cv_pbaslangic.custom_field_id = 12
                    LEFT JOIN custom_values cv_pbitis
                        ON cv_pbitis.customized_id = i.id
                        AND cv_pbitis.customized_type = 'Issue'
                        AND cv_pbitis.custom_field_id = 4
                    LEFT JOIN custom_values cv_revize_baslangic
                        ON cv_revize_baslangic.customized_id = i.id
                        AND cv_revize_baslangic.customized_type = 'Issue'
                        AND cv_revize_baslangic.custom_field_id = 20
                    LEFT JOIN custom_values cv_revize_bitis
                        ON cv_revize_bitis.customized_id = i.id
                        AND cv_revize_bitis.customized_type = 'Issue'
                        AND cv_revize_bitis.custom_field_id = 21
                    WHERE i.project_id = @ProjectId
                        AND {trackerCondition}
                    ORDER BY i.id DESC";

                var issues = new List<PlanningIssueItem>();

                using (var connection = new SqlConnection(connectionString))
                {
                    await connection.OpenAsync();
                    using (var command = new SqlCommand(sql, connection))
                    {
                        command.Parameters.AddWithValue("@ProjectId", request.ProjectId);

                        using (var reader = await command.ExecuteReaderAsync())
                        {
                            while (await reader.ReadAsync())
                            {
                                var plannedStart = reader.GetString(reader.GetOrdinal("planned_start"));
                                var plannedEnd = reader.GetString(reader.GetOrdinal("planned_end"));
                                var revisedStart = reader.GetString(reader.GetOrdinal("revised_start"));
                                var revisedEnd = reader.GetString(reader.GetOrdinal("revised_end"));

                                issues.Add(new PlanningIssueItem
                                {
                                    IssueId = reader.GetInt32(reader.GetOrdinal("issue_id")),
                                    Subject = reader.GetString(reader.GetOrdinal("subject")),
                                    TrackerName = reader.GetString(reader.GetOrdinal("tracker_name")),
                                    StatusName = reader.GetString(reader.GetOrdinal("status_name")),
                                    PlannedStartDate = string.IsNullOrEmpty(plannedStart) ? null : plannedStart,
                                    PlannedEndDate = string.IsNullOrEmpty(plannedEnd) ? null : plannedEnd,
                                    RevisedStartDate = string.IsNullOrEmpty(revisedStart) ? null : revisedStart,
                                    RevisedEndDate = string.IsNullOrEmpty(revisedEnd) ? null : revisedEnd,
                                });
                            }
                        }
                    }
                }

                _logger.LogInformation("GetProjectIssuesForPlanning: Project={ProjectId}, Type={Type}, Count={Count}",
                    request.ProjectId, request.PlanType, issues.Count);

                return Ok(new { ProjectId = request.ProjectId, PlanType = request.PlanType, Issues = issues, TotalCount = issues.Count });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting project issues for planning");
                return StatusCode(500, new ErrorResponse { Message = $"Hata: {ex.Message}" });
            }
        }
    }
}