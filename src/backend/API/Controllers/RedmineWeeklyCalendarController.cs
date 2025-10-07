using API.Data;
using API.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using System.Data;

namespace API.Controllers
{
    /// <summary>
    /// Redmine Weekly Calendar API Controller - Haftalık takvim görünümü için üretim işlerini yönetir
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
#if !DEBUG
    [Authorize] // Sadece Release modda JWT token gerekli
#endif
    public class RedmineWeeklyCalendarController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<RedmineWeeklyCalendarController> _logger;
        private readonly IConfiguration _configuration;

        public RedmineWeeklyCalendarController(
            ApplicationDbContext context,
            ILogger<RedmineWeeklyCalendarController> logger,
            IConfiguration configuration)
        {
            _context = context;
            _logger = logger;
            _configuration = configuration;
        }

        // 1. GetWeeklyProductionCalendar metodunu güncelle
        [HttpPost("GetWeeklyProductionCalendar")]
#if DEBUG
        [AllowAnonymous]
#endif
        public async Task<IActionResult> GetWeeklyProductionCalendar([FromBody] GetWeeklyProductionCalendarRequest request)
        {
            try
            {
                _logger.LogInformation("Getting weekly production calendar data for parent issue: {ParentIssueId}, StartDate: {StartDate}, ProjectId: {ProjectId}, ProductionType: {ProductionType}",
                    request.ParentIssueId, request.StartDate, request.ProjectId, request.ProductionType);

                DateTime weekStart;
                if (string.IsNullOrEmpty(request.StartDate))
                {
                    weekStart = GetWeekStart(DateTime.Today);
                }
                else
                {
                    if (!DateTime.TryParse(request.StartDate, out weekStart))
                    {
                        _logger.LogWarning("Invalid date format received: {StartDate}", request.StartDate);
                        return BadRequest(new ErrorResponse { Message = "Geçersiz tarih formatı. yyyy-MM-dd formatında gönderiniz." });
                    }
                    weekStart = GetWeekStart(weekStart);
                }

                // ProductionType parametresini de geç
                var result = await GetWeeklyProductionDataAsync(weekStart, request.ParentIssueId, request.ProjectId, request.ProductionType);

                _logger.LogInformation("Weekly production calendar data retrieved successfully for week starting: {WeekStart}", weekStart);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting weekly production calendar data");
                return StatusCode(500, new ErrorResponse { Message = $"Haftalık üretim takvimi verileri alınamadı: {ex.Message}" });
            }
        }

        #region Private Methods

        // 2. GetWeeklyProductionDataAsync metoduna productionType parametresini ekle
        private async Task<WeeklyProductionCalendarResponse> GetWeeklyProductionDataAsync(
            DateTime weekStart,
            int? parentIssueId,
            int? projectId,
            string? productionType)  // YENİ PARAMETRE
        {
            var response = new WeeklyProductionCalendarResponse
            {
                WeekStart = weekStart,
                WeekEnd = weekStart.AddDays(6),
                Days = new List<ProductionDayData>()
            };

            var connectionString = _configuration.GetConnectionString("DefaultConnection")
                ?? throw new InvalidOperationException("DefaultConnection string not found");

            using var connection = new SqlConnection(connectionString);
            await connection.OpenAsync();

            // 7 gün için veri çek
            for (int day = 0; day < 7; day++)
            {
                var currentDate = weekStart.AddDays(day);

                // Ham verileri çek - productionType'ı da geç
                var rawIssues = await GetProductionIssuesForDateAsync(
                    connection,
                    currentDate,
                    parentIssueId,
                    projectId,
                    productionType);  // YENİ PARAMETRE

                // Proje ve iş tipine göre grupla
                var groupedData = rawIssues
                    .GroupBy(issue => new
                    {
                        issue.ProjectId,
                        issue.ProjectCode,
                        issue.ProjectName,
                        ProductionType = issue.ProductionType
                    })
                    .Select(g => new GroupedProductionData
                    {
                        ProjectId = g.Key.ProjectId,
                        ProjectCode = g.Key.ProjectCode,
                        ProjectName = g.Key.ProjectName,
                        ProductionType = g.Key.ProductionType,
                        IssueCount = g.Count()
                    })
                    .OrderBy(g => g.ProjectCode)
                    .ThenBy(g => g.ProductionType)
                    .ToList();

                var dayData = new ProductionDayData
                {
                    Date = currentDate,
                    DayOfWeek = (int)currentDate.DayOfWeek,
                    DayName = GetTurkishDayName(currentDate.DayOfWeek),
                    GroupedProductions = groupedData
                };

                response.Days.Add(dayData);
            }

            return response;
        }

        // 3. GetProductionIssuesForDateAsync metoduna productionType parametresini ekle ve SQL'e ekle
        private async Task<List<ProductionIssueData>> GetProductionIssuesForDateAsync(
            SqlConnection connection,
            DateTime date,
            int? parentIssueId,
            int? projectId,
            string? productionType)  // YENİ PARAMETRE
        {
            var issues = new List<ProductionIssueData>();
            string sql;

            if (parentIssueId.HasValue)
            {
                // ... (mevcut SQL - WITH RECURSIVE kısmı aynı kalacak)
                sql = @"
            WITH RecursiveIssues AS (
                -- Ana iş
                SELECT id, parent_id
                FROM issues
                WHERE id = @ParentIssueId
                
                UNION ALL
                
                -- Alt işler (recursive)
                SELECT i.id, i.parent_id
                FROM issues i
                INNER JOIN RecursiveIssues ri ON i.parent_id = ri.id
            )
            SELECT 
                i.id,
                i.project_id,
                i.subject,
                i.done_ratio as completion_percentage,
                i.estimated_hours,
                t.name as tracker_name,
                p.name as project_name,
                status.name as status_name,
                status.is_closed,
                priority.name as priority_name,
                ISNULL(assigned_user.firstname + ' ' + assigned_user.lastname, 'Atanmamış') as assigned_to,
                cv_pbaslangic.value AS planlanan_baslangic,
                cv_pbitis.value AS planlanan_bitis,
                cv_proje_kodu.value AS proje_kodu
            FROM issues i
            JOIN trackers t ON i.tracker_id = t.id
            LEFT JOIN projects p ON i.project_id = p.id
            LEFT JOIN issue_statuses status ON i.status_id = status.id
            LEFT JOIN enumerations priority ON i.priority_id = priority.id AND priority.type = 'IssuePriority'
            LEFT JOIN users assigned_user ON i.assigned_to_id = assigned_user.id
            LEFT JOIN custom_values cv_pbaslangic 
                ON cv_pbaslangic.customized_id = i.id 
                AND cv_pbaslangic.customized_type = 'Issue'
                AND cv_pbaslangic.custom_field_id = 12
            LEFT JOIN custom_values cv_pbitis 
                ON cv_pbitis.customized_id = i.id 
                AND cv_pbitis.customized_type = 'Issue'
                AND cv_pbitis.custom_field_id = 4
            LEFT JOIN custom_values cv_proje_kodu 
                ON cv_proje_kodu.customized_id = p.id 
                AND cv_proje_kodu.customized_type = 'Project'
                AND cv_proje_kodu.custom_field_id = 3
            WHERE i.id IN (SELECT id FROM RecursiveIssues)
                AND t.name LIKE N'Üretim -%'
                AND cv_pbaslangic.value IS NOT NULL
                AND cv_pbitis.value IS NOT NULL
                AND TRY_CAST(cv_pbaslangic.value AS DATE) <= @Date
                AND TRY_CAST(cv_pbitis.value AS DATE) >= @Date";
            }
            else
            {
                // ParentIssueId yoksa tüm üretim işlerini getir
                sql = @"
            SELECT 
                i.id,
                i.project_id,
                i.subject,
                i.done_ratio as completion_percentage,
                i.estimated_hours,
                t.name as tracker_name,
                p.name as project_name,
                status.name as status_name,
                status.is_closed,
                priority.name as priority_name,
                ISNULL(assigned_user.firstname + ' ' + assigned_user.lastname, 'Atanmamış') as assigned_to,
                cv_pbaslangic.value AS planlanan_baslangic,
                cv_pbitis.value AS planlanan_bitis,
                cv_proje_kodu.value AS proje_kodu
            FROM issues i
            JOIN trackers t ON i.tracker_id = t.id
            LEFT JOIN projects p ON i.project_id = p.id
            LEFT JOIN issue_statuses status ON i.status_id = status.id
            LEFT JOIN enumerations priority ON i.priority_id = priority.id AND priority.type = 'IssuePriority'
            LEFT JOIN users assigned_user ON i.assigned_to_id = assigned_user.id
            LEFT JOIN custom_values cv_pbaslangic 
                ON cv_pbaslangic.customized_id = i.id 
                AND cv_pbaslangic.customized_type = 'Issue'
                AND cv_pbaslangic.custom_field_id = 12
            LEFT JOIN custom_values cv_pbitis 
                ON cv_pbitis.customized_id = i.id 
                AND cv_pbitis.customized_type = 'Issue'
                AND cv_pbitis.custom_field_id = 4
            LEFT JOIN custom_values cv_proje_kodu 
                ON cv_proje_kodu.customized_id = p.id 
                AND cv_proje_kodu.customized_type = 'Project'
                AND cv_proje_kodu.custom_field_id = 3
            WHERE t.name LIKE N'Üretim -%'
                AND cv_pbaslangic.value IS NOT NULL
                AND cv_pbitis.value IS NOT NULL
                AND TRY_CAST(cv_pbaslangic.value AS DATE) <= @Date
                AND TRY_CAST(cv_pbitis.value AS DATE) >= @Date";
            }

            // Proje filtresi varsa ekle
            if (projectId.HasValue)
            {
                sql += " AND i.project_id = @ProjectId";
            }

            // YENİ: ProductionType filtresi varsa ekle
            if (!string.IsNullOrEmpty(productionType))
            {
                sql += " AND t.name = @ProductionTypeName";
            }

            sql += " ORDER BY p.name, t.name, i.subject";

            using var command = new SqlCommand(sql, connection);

            if (parentIssueId.HasValue)
            {
                command.Parameters.AddWithValue("@ParentIssueId", parentIssueId.Value);
            }

            command.Parameters.AddWithValue("@Date", date.Date);

            if (projectId.HasValue)
            {
                command.Parameters.AddWithValue("@ProjectId", projectId.Value);
            }

            // YENİ: ProductionType parametresi ekle
            if (!string.IsNullOrEmpty(productionType))
            {
                // "Lazer" -> "Üretim - Lazer" formatına çevir
                command.Parameters.AddWithValue("@ProductionTypeName", $"Üretim - {productionType}");
            }

            using var reader = await command.ExecuteReaderAsync();
            while (await reader.ReadAsync())
            {
                // ... (geri kalan kod aynı kalacak - issue nesnesi oluşturma kısmı)
                DateTime? plannedStart = null;
                DateTime? plannedEnd = null;

                var plannedStartStr = reader.IsDBNull(reader.GetOrdinal("planlanan_baslangic"))
                    ? null : reader.GetString(reader.GetOrdinal("planlanan_baslangic"));
                var plannedEndStr = reader.IsDBNull(reader.GetOrdinal("planlanan_bitis"))
                    ? null : reader.GetString(reader.GetOrdinal("planlanan_bitis"));

                if (!string.IsNullOrEmpty(plannedStartStr) && DateTime.TryParse(plannedStartStr, out var startDate))
                {
                    plannedStart = startDate;
                }

                if (!string.IsNullOrEmpty(plannedEndStr) && DateTime.TryParse(plannedEndStr, out var endDate))
                {
                    plannedEnd = endDate;
                }

                issues.Add(new ProductionIssueData
                {
                    IssueId = reader.GetInt32(reader.GetOrdinal("id")),
                    ProjectId = reader.GetInt32(reader.GetOrdinal("project_id")),
                    ProjectName = reader.IsDBNull(reader.GetOrdinal("project_name"))
                        ? string.Empty : reader.GetString(reader.GetOrdinal("project_name")),
                    ProjectCode = reader.IsDBNull(reader.GetOrdinal("proje_kodu"))
                        ? string.Empty : reader.GetString(reader.GetOrdinal("proje_kodu")),
                    Subject = reader.IsDBNull(reader.GetOrdinal("subject"))
                        ? string.Empty : reader.GetString(reader.GetOrdinal("subject")),
                    TrackerName = reader.IsDBNull(reader.GetOrdinal("tracker_name"))
                        ? string.Empty : reader.GetString(reader.GetOrdinal("tracker_name")),
                    CompletionPercentage = reader.GetInt32(reader.GetOrdinal("completion_percentage")),
                    EstimatedHours = reader.IsDBNull(reader.GetOrdinal("estimated_hours"))
                        ? null : reader.GetDecimal(reader.GetOrdinal("estimated_hours")),
                    StatusName = reader.IsDBNull(reader.GetOrdinal("status_name"))
                        ? string.Empty : reader.GetString(reader.GetOrdinal("status_name")),
                    IsClosed = reader.GetBoolean(reader.GetOrdinal("is_closed")),
                    PriorityName = reader.IsDBNull(reader.GetOrdinal("priority_name"))
                        ? "Normal" : reader.GetString(reader.GetOrdinal("priority_name")),
                    AssignedTo = reader.IsDBNull(reader.GetOrdinal("assigned_to"))
                        ? "Atanmamış" : reader.GetString(reader.GetOrdinal("assigned_to")),
                    PlannedStartDate = plannedStart,
                    PlannedEndDate = plannedEnd
                });
            }

            return issues;
        }
        private static DateTime GetWeekStart(DateTime date)
        {
            var diff = (7 + (date.DayOfWeek - DayOfWeek.Monday)) % 7;
            return date.AddDays(-1 * diff).Date;
        }

        private static string GetTurkishDayName(DayOfWeek dayOfWeek)
        {
            return dayOfWeek switch
            {
                DayOfWeek.Monday => "Pazartesi",
                DayOfWeek.Tuesday => "Salı",
                DayOfWeek.Wednesday => "Çarşamba",
                DayOfWeek.Thursday => "Perşembe",
                DayOfWeek.Friday => "Cuma",
                DayOfWeek.Saturday => "Cumartesi",
                DayOfWeek.Sunday => "Pazar",
                _ => "Bilinmiyor"
            };
        }

        #endregion
    }
}