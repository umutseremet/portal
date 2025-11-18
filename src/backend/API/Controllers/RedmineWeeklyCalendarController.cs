// src/backend/API/Controllers/RedmineWeeklyCalendarController.cs
using API.Data;
using API.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using System.Data;

namespace API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
#if !DEBUG
    [Authorize]
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

        [HttpPost("GetWeeklyProductionCalendar")]
#if DEBUG
        [AllowAnonymous]
#endif
        public async Task<IActionResult> GetWeeklyProductionCalendar([FromBody] GetWeeklyProductionCalendarRequest request)
        {
            try
            {
                _logger.LogInformation("Getting weekly production calendar data");

                DateTime weekStart;
                if (string.IsNullOrEmpty(request.StartDate))
                {
                    weekStart = GetWeekStart(DateTime.Today);
                }
                else
                {
                    if (!DateTime.TryParse(request.StartDate, out weekStart))
                    {
                        return BadRequest(new ErrorResponse { Message = "Geçersiz tarih formatı." });
                    }
                    weekStart = GetWeekStart(weekStart);
                }

                var result = await GetWeeklyProductionDataAsync(weekStart, request.ParentIssueId, request.ProjectId, request.ProductionType);

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting weekly production calendar");
                return StatusCode(500, new ErrorResponse { Message = $"Hata: {ex.Message}" });
            }
        }

        [HttpPost("GetIssuesByDateAndType")]
#if DEBUG
        [AllowAnonymous]
#endif
        public async Task<IActionResult> GetIssuesByDateAndType([FromBody] GetIssuesByDateAndTypeRequest request)
        {
            try
            {
                if (!DateTime.TryParse(request.Date, out DateTime targetDate))
                {
                    return BadRequest(new ErrorResponse { Message = "Geçersiz tarih formatı" });
                }

                var connectionString = _configuration.GetConnectionString("DefaultConnection")
                    ?? throw new InvalidOperationException("Connection string not found");

                var issues = new List<ProductionIssueData>();

                var sql = @"
                    SELECT 
                        i.id, i.project_id,
                        p.name AS project_name,
                        cv_proje_kodu.value AS proje_kodu,
                        i.subject,
                        t.name AS tracker_name,
                        i.done_ratio AS completion_percentage,
                        i.estimated_hours,
                        i.closed_on,
                        status.name AS status_name,
                        status.is_closed,
                        priority.name AS priority_name,
                        ISNULL(assigned_user.firstname + ' ' + assigned_user.lastname, 'Atanmamış') AS assigned_to,
                        cv_pbaslangic.value AS planlanan_baslangic,
                        cv_pbitis.value AS planlanan_bitis
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
                        WHERE (t.name LIKE N'Üretim -%' OR t.name = 'Montaj')
                            --AND t.name != 'Üretim'
                            AND i.project_id = @ProjectId
                            AND t.name LIKE @ProductionType
                            AND ISNULL(cv_pbaslangic.value,'') != ''
                            AND ISNULL(cv_pbitis.value,'') != ''
                            AND TRY_CAST(cv_pbaslangic.value AS DATE) <= @Date
                            AND (
                                TRY_CAST(cv_pbitis.value AS DATE) >= @Date
                                OR
                            (status.is_closed = 0 AND TRY_CAST(cv_pbitis.value AS DATE) < @Date AND @Date <= GETDATE())
                            OR
                            (status.is_closed = 1 AND i.closed_on IS NOT NULL AND 
                             TRY_CAST(cv_pbitis.value AS DATE) < CAST(i.closed_on AS DATE) AND
                             @Date <= CAST(i.closed_on AS DATE))
                        )
                    ORDER BY i.id";

                using (var connection = new SqlConnection(connectionString))
                {
                    await connection.OpenAsync();

                    using (var command = new SqlCommand(sql, connection))
                    {
                        command.Parameters.AddWithValue("@Date", targetDate.Date);
                        command.Parameters.AddWithValue("@ProjectId", request.ProjectId);
                        command.Parameters.AddWithValue("@ProductionType", $"%{request.ProductionType}%");

                        using (var reader = await command.ExecuteReaderAsync())
                        {
                            while (await reader.ReadAsync())
                            {
                                DateTime? plannedStart = null;
                                DateTime? plannedEnd = null;
                                DateTime? closedOn = null;

                                if (!reader.IsDBNull(reader.GetOrdinal("planlanan_baslangic")))
                                {
                                    var startValue = reader.GetString(reader.GetOrdinal("planlanan_baslangic"));
                                    DateTime.TryParse(startValue, out var tempStart);
                                    plannedStart = tempStart;
                                }

                                if (!reader.IsDBNull(reader.GetOrdinal("planlanan_bitis")))
                                {
                                    var endValue = reader.GetString(reader.GetOrdinal("planlanan_bitis"));
                                    DateTime.TryParse(endValue, out var tempEnd);
                                    plannedEnd = tempEnd;
                                }

                                if (!reader.IsDBNull(reader.GetOrdinal("closed_on")))
                                {
                                    closedOn = reader.GetDateTime(reader.GetOrdinal("closed_on"));
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
                                    PlannedEndDate = plannedEnd,
                                    ClosedOn = closedOn
                                });
                            }
                        }
                    }
                }

                return Ok(new GetIssuesByDateAndTypeResponse
                {
                    Date = targetDate,
                    ProjectId = request.ProjectId,
                    ProductionType = request.ProductionType,
                    Issues = issues,
                    TotalCount = issues.Count
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting issues by date and type");
                return StatusCode(500, new ErrorResponse { Message = $"Hata: {ex.Message}" });
            }
        }

        [HttpGet("GetIssuesByDate")]
#if DEBUG
        [AllowAnonymous]
#endif
        public async Task<IActionResult> GetIssuesByDate([FromQuery] string date)
        {
            try
            {
                if (string.IsNullOrEmpty(date) || !DateTime.TryParse(date, out DateTime targetDate))
                {
                    return BadRequest(new ErrorResponse { Message = "Geçersiz tarih" });
                }

                var connectionString = _configuration.GetConnectionString("DefaultConnection")
                    ?? throw new InvalidOperationException("Connection string not found");

                var issues = new List<ProductionIssueData>();

                var sql = @"
                    SELECT 
                        i.id, i.project_id,
                        p.name AS project_name,
                        cv_proje_kodu.value AS proje_kodu,
                        i.subject,
                        t.name AS tracker_name,
                        i.done_ratio AS completion_percentage,
                        i.estimated_hours,
                        i.closed_on,
                        status.name AS status_name,
                        status.is_closed,
                        priority.name AS priority_name,
                        ISNULL(assigned_user.firstname + ' ' + assigned_user.lastname, 'Atanmamış') AS assigned_to,
                        cv_pbaslangic.value AS planlanan_baslangic,
                        cv_pbitis.value AS planlanan_bitis
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
                    WHERE (t.name LIKE N'Üretim -%' OR t.name = 'Montaj')
                        --AND t.name != 'Üretim'
                        AND ISNULL(cv_pbaslangic.value,'') != ''
                        AND ISNULL(cv_pbitis.value,'') != ''
                        AND TRY_CAST(cv_pbaslangic.value AS DATE) <= @Date
                        AND (
                            TRY_CAST(cv_pbitis.value AS DATE) >= @Date
                            OR
                            (status.is_closed = 0 AND TRY_CAST(cv_pbitis.value AS DATE) < @Date AND @Date <= GETDATE())
                            OR
                            (status.is_closed = 1 AND i.closed_on IS NOT NULL AND 
                             TRY_CAST(cv_pbitis.value AS DATE) < CAST(i.closed_on AS DATE) AND
                             @Date <= CAST(i.closed_on AS DATE))
                        )
                    ORDER BY p.name, t.name, i.id";

                using (var connection = new SqlConnection(connectionString))
                {
                    await connection.OpenAsync();

                    using (var command = new SqlCommand(sql, connection))
                    {
                        command.Parameters.AddWithValue("@Date", targetDate.Date);

                        using (var reader = await command.ExecuteReaderAsync())
                        {
                            while (await reader.ReadAsync())
                            {
                                DateTime? plannedStart = null;
                                DateTime? plannedEnd = null;
                                DateTime? closedOn = null;

                                if (!reader.IsDBNull(reader.GetOrdinal("planlanan_baslangic")))
                                {
                                    var startValue = reader.GetString(reader.GetOrdinal("planlanan_baslangic"));
                                    DateTime.TryParse(startValue, out var tempStart);
                                    plannedStart = tempStart;
                                }

                                if (!reader.IsDBNull(reader.GetOrdinal("planlanan_bitis")))
                                {
                                    var endValue = reader.GetString(reader.GetOrdinal("planlanan_bitis"));
                                    DateTime.TryParse(endValue, out var tempEnd);
                                    plannedEnd = tempEnd;
                                }

                                if (!reader.IsDBNull(reader.GetOrdinal("closed_on")))
                                {
                                    closedOn = reader.GetDateTime(reader.GetOrdinal("closed_on"));
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
                                    PlannedEndDate = plannedEnd,
                                    ClosedOn = closedOn
                                });
                            }
                        }
                    }
                }

                return Ok(new
                {
                    Date = targetDate,
                    Issues = issues,
                    TotalCount = issues.Count
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting issues by date");
                return StatusCode(500, new ErrorResponse { Message = $"Hata: {ex.Message}" });
            }
        }

        // src/backend/API/Controllers/RedmineWeeklyCalendarController.cs
        // ✅ DÜZELTME: UpdateIssueDates endpoint'i - Timezone ve format sorunları çözüldü

        /// <summary>
        /// İşin planlanan tarihlerini günceller
        /// </summary>
        [HttpPost("UpdateIssueDates")]
#if DEBUG
        [AllowAnonymous]
#endif
        public async Task<IActionResult> UpdateIssueDates([FromBody] UpdateIssueDatesRequest request)
        {
            try
            {
                _logger.LogInformation("Updating issue dates for Issue #{IssueId}", request.IssueId);

                var connectionString = _configuration.GetConnectionString("DefaultConnection")
                    ?? throw new InvalidOperationException("Database connection string not configured");

                // Önce mevcut tarihleri al
                DateTime? oldStartDate = null;
                DateTime? oldEndDate = null;
                // Tarihleri güncelle
                DateTime? newStartDate = null;
                DateTime? newEndDate = null;
                using (var connection = new SqlConnection(connectionString))
                {
                    await connection.OpenAsync();

                    // Mevcut tarihleri oku
                    var selectQuery = @"
                SELECT 
                    cf_start.value as PlannedStartDate,
                    cf_end.value as PlannedEndDate
                FROM issues i
                LEFT JOIN custom_values cf_start ON cf_start.customized_id = i.id 
                    AND cf_start.customized_type = 'Issue' 
                    AND cf_start.custom_field_id = 12
                LEFT JOIN custom_values cf_end ON cf_end.customized_id = i.id 
                    AND cf_end.customized_type = 'Issue' 
                    AND cf_end.custom_field_id = 4
                WHERE i.id = @IssueId";

                    using (var selectCommand = new SqlCommand(selectQuery, connection))
                    {
                        selectCommand.Parameters.AddWithValue("@IssueId", request.IssueId);

                        using (var reader = await selectCommand.ExecuteReaderAsync())
                        {
                            if (await reader.ReadAsync())
                            {
                                // ✅ String olarak saklanan tarihleri parse et
                                if (!reader.IsDBNull(reader.GetOrdinal("PlannedStartDate")))
                                {
                                    var startValue = reader.GetString(reader.GetOrdinal("PlannedStartDate"));
                                    if (DateTime.TryParse(startValue, out DateTime tempStart))
                                    {
                                        oldStartDate = tempStart;
                                    }
                                }
                                if (!reader.IsDBNull(reader.GetOrdinal("PlannedEndDate")))
                                {
                                    var endValue = reader.GetString(reader.GetOrdinal("PlannedEndDate"));
                                    if (DateTime.TryParse(endValue, out DateTime tempEnd))
                                    {
                                        oldEndDate = tempEnd;
                                    }
                                }
                            }
                        }
                    }

                    

                    if (!string.IsNullOrEmpty(request.PlannedStartDate))
                    {
                        if (DateTime.TryParse(request.PlannedStartDate, out DateTime parsedStart))
                        {
                            newStartDate = parsedStart;

                            // ✅ Sadece tarihi kaydet (saat 00:00:00)
                            var dateOnlyString = newStartDate.Value.ToString("yyyy-MM-dd");

                            // custom_field_id = 8 (Planlanan Başlangıç)
                            var updateStartQuery = @"
                        MERGE INTO custom_values AS target
                        USING (SELECT @IssueId AS customized_id, 'Issue' AS customized_type, 12 AS custom_field_id) AS source
                        ON target.customized_id = source.customized_id 
                            AND target.customized_type = source.customized_type 
                            AND target.custom_field_id = source.custom_field_id
                        WHEN MATCHED THEN
                            UPDATE SET value = @NewDate
                        WHEN NOT MATCHED THEN
                            INSERT (customized_type, customized_id, custom_field_id, value)
                            VALUES ('Issue', @IssueId, 12, @NewDate);";

                            using (var updateCommand = new SqlCommand(updateStartQuery, connection))
                            {
                                updateCommand.Parameters.AddWithValue("@IssueId", request.IssueId);
                                updateCommand.Parameters.AddWithValue("@NewDate", dateOnlyString);
                                await updateCommand.ExecuteNonQueryAsync();
                            }
                        }
                    }

                    if (!string.IsNullOrEmpty(request.PlannedEndDate))
                    {
                        if (DateTime.TryParse(request.PlannedEndDate, out DateTime parsedEnd))
                        {
                            newEndDate = parsedEnd;

                            // ✅ Sadece tarihi kaydet (saat 00:00:00)
                            var dateOnlyString = newEndDate.Value.ToString("yyyy-MM-dd");

                            // custom_field_id = 9 (Planlanan Bitiş)
                            var updateEndQuery = @"
                        MERGE INTO custom_values AS target
                        USING (SELECT @IssueId AS customized_id, 'Issue' AS customized_type, 4 AS custom_field_id) AS source
                        ON target.customized_id = source.customized_id 
                            AND target.customized_type = source.customized_type 
                            AND target.custom_field_id = source.custom_field_id
                        WHEN MATCHED THEN
                            UPDATE SET value = @NewDate
                        WHEN NOT MATCHED THEN
                            INSERT (customized_type, customized_id, custom_field_id, value)
                            VALUES ('Issue', @IssueId, 4, @NewDate);";

                            using (var updateCommand = new SqlCommand(updateEndQuery, connection))
                            {
                                updateCommand.Parameters.AddWithValue("@IssueId", request.IssueId);
                                updateCommand.Parameters.AddWithValue("@NewDate", dateOnlyString);
                                await updateCommand.ExecuteNonQueryAsync();
                            }
                        }
                    }

                    // İşin güncelleme tarihini güncelle
                    var updateIssueQuery = @"UPDATE issues SET updated_on = GETDATE() WHERE id = @IssueId";
                    using (var updateIssueCommand = new SqlCommand(updateIssueQuery, connection))
                    {
                        updateIssueCommand.Parameters.AddWithValue("@IssueId", request.IssueId);
                        await updateIssueCommand.ExecuteNonQueryAsync();
                    }
                }

                _logger.LogInformation("Successfully updated dates for Issue #{IssueId}", request.IssueId);

                return Ok(new UpdateIssueDatesResponse
                {
                    Success = true,
                    Message = "Tarihler başarıyla güncellendi",
                    IssueId = request.IssueId,
                    OldPlannedStartDate = oldStartDate,
                    OldPlannedEndDate = oldEndDate,
                    NewPlannedStartDate = newStartDate ?? oldStartDate,
                    NewPlannedEndDate = newEndDate ?? oldEndDate,
                    UpdatedAt = DateTime.Now
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating issue dates for Issue #{IssueId}", request.IssueId);
                return StatusCode(500, new ErrorResponse
                {
                    Message = $"Tarihler güncellenirken hata oluştu: {ex.Message}"
                });
            }
        }
        #region Private Methods

        private async Task<WeeklyProductionCalendarResponse> GetWeeklyProductionDataAsync(
            DateTime weekStart,
            int? parentIssueId,
            int? projectId,
            string? productionType)
        {
            var response = new WeeklyProductionCalendarResponse
            {
                WeekStart = weekStart,
                WeekEnd = weekStart.AddDays(6),
                Days = new List<ProductionDayData>()
            };

            var connectionString = _configuration.GetConnectionString("DefaultConnection")
                ?? throw new InvalidOperationException("Connection string not found");

            using var connection = new SqlConnection(connectionString);
            await connection.OpenAsync();

            for (int day = 0; day < 7; day++)
            {
                var currentDate = weekStart.AddDays(day);

                var rawIssues = await GetProductionIssuesForDateAsync(
                    connection,
                    currentDate,
                    parentIssueId,
                    projectId,
                    productionType);

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

        private async Task<List<ProductionIssueData>> GetProductionIssuesForDateAsync(
            SqlConnection connection,
            DateTime date,
            int? parentIssueId,
            int? projectId,
            string? productionType)
        {
            var issues = new List<ProductionIssueData>();
            string sql;

            if (parentIssueId.HasValue)
            {
                sql = @"
                    WITH RecursiveIssues AS (
                        SELECT id, parent_id FROM issues WHERE id = @ParentIssueId
                        UNION ALL
                        SELECT i.id, i.parent_id FROM issues i
                        INNER JOIN RecursiveIssues ri ON i.parent_id = ri.id
                    )
                    SELECT 
                        i.id, i.project_id, i.subject,
                        i.done_ratio as completion_percentage,
                        i.estimated_hours,
                        i.closed_on,
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
                    INNER JOIN RecursiveIssues ri ON i.id = ri.id
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
                    WHERE (t.name LIKE N'Üretim -%' OR t.name = 'Montaj')
                       -- AND t.name != 'Üretim'
                        AND ISNULL(cv_pbaslangic.value,'') != ''
                        AND ISNULL(cv_pbitis.value,'') != ''
                        AND TRY_CAST(cv_pbaslangic.value AS DATE) <= @Date
                        AND (
                            TRY_CAST(cv_pbitis.value AS DATE) >= @Date
                            OR
                            (status.is_closed = 0 AND TRY_CAST(cv_pbitis.value AS DATE) < @Date AND @Date <= GETDATE())
                            OR
                            (status.is_closed = 1 AND i.closed_on IS NOT NULL AND 
                             TRY_CAST(cv_pbitis.value AS DATE) < CAST(i.closed_on AS DATE) AND
                             @Date <= CAST(i.closed_on AS DATE))
                        )";
            }
            else
            {
                sql = @"
                    SELECT 
                        i.id, i.project_id, i.subject,
                        i.done_ratio as completion_percentage,
                        i.estimated_hours,
                        i.closed_on,
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
                    WHERE (t.name LIKE N'Üretim -%' OR t.name = 'Montaj') 
                        --AND t.name != 'Üretim'
                        AND ISNULL(cv_pbaslangic.value,'') != ''
                        AND ISNULL(cv_pbitis.value,'') != ''
                        AND TRY_CAST(cv_pbaslangic.value AS DATE) <= @Date
                        AND (
                            TRY_CAST(cv_pbitis.value AS DATE) >= @Date
                            OR
                            (status.is_closed = 0 AND TRY_CAST(cv_pbitis.value AS DATE) < @Date AND @Date <= GETDATE())
                            OR
                            (status.is_closed = 1 AND i.closed_on IS NOT NULL AND 
                             TRY_CAST(cv_pbitis.value AS DATE) < CAST(i.closed_on AS DATE) AND
                             @Date <= CAST(i.closed_on AS DATE))
                        )";
            }

            if (projectId.HasValue)
            {
                sql += " AND i.project_id = @ProjectId";
            }

            if (!string.IsNullOrEmpty(productionType))
            {
                sql += " AND t.name = @ProductionType";
            }

            sql += " ORDER BY p.name, t.name, i.id";

            using (var command = new SqlCommand(sql, connection))
            {
                command.Parameters.AddWithValue("@Date", date.Date);
                if (parentIssueId.HasValue)
                    command.Parameters.AddWithValue("@ParentIssueId", parentIssueId.Value);
                if (projectId.HasValue)
                    command.Parameters.AddWithValue("@ProjectId", projectId.Value);
                if (!string.IsNullOrEmpty(productionType))
                    command.Parameters.AddWithValue("@ProductionType", productionType);

                using (var reader = await command.ExecuteReaderAsync())
                {
                    while (await reader.ReadAsync())
                    {
                        DateTime? plannedStart = null;
                        DateTime? plannedEnd = null;
                        DateTime? closedOn = null;

                        if (!reader.IsDBNull(reader.GetOrdinal("planlanan_baslangic")))
                        {
                            var startValue = reader.GetString(reader.GetOrdinal("planlanan_baslangic"));
                            DateTime.TryParse(startValue, out var tempStart);
                            plannedStart = tempStart;
                        }

                        if (!reader.IsDBNull(reader.GetOrdinal("planlanan_bitis")))
                        {
                            var endValue = reader.GetString(reader.GetOrdinal("planlanan_bitis"));
                            DateTime.TryParse(endValue, out var tempEnd);
                            plannedEnd = tempEnd;
                        }

                        if (!reader.IsDBNull(reader.GetOrdinal("closed_on")))
                        {
                            closedOn = reader.GetDateTime(reader.GetOrdinal("closed_on"));
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
                            PlannedEndDate = plannedEnd,
                            ClosedOn = closedOn
                        });
                    }
                }
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