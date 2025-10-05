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
    /// Redmine Weekly Calendar API Controller - Haftalık takvim görünümü için proje operasyon verilerini yönetir
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

        /// <summary>
        /// Haftalık takvim görünümü için proje operasyon verilerini getirir
        /// </summary>
        /// <param name="request">Haftalık takvim isteği</param>
        /// <returns>Haftalık takvim verisi</returns>
        [HttpPost("GetWeeklyProjectOperations")]
#if DEBUG
        [AllowAnonymous] // Development'ta herkese açık
#endif
        public async Task<IActionResult> GetWeeklyProjectOperations([FromBody] GetWeeklyProjectOperationsRequest request)
        {
            try
            {
                _logger.LogInformation("Getting weekly calendar data for date: {StartDate}", request.StartDate);

                // JWT token'dan kullanıcı bilgilerini al (Production'da)
                var jwtUsername = User.FindFirst("username")?.Value;

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

                var result = await GetWeeklyCalendarDataAsync(weekStart);

                _logger.LogInformation("Weekly calendar data retrieved successfully for week starting: {WeekStart}", weekStart);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting weekly calendar data");
                return StatusCode(500, new ErrorResponse { Message = $"Haftalık takvim verileri alınamadı: {ex.Message}" });
            }
        }

        /// <summary>
        /// Aktif projelerin genel listesini getirir
        /// </summary>
        /// <returns>Proje listesi</returns>
        [HttpGet("GetActiveProjectsList")]
#if DEBUG
        [AllowAnonymous] // Development'ta herkese açık
#endif
        public async Task<IActionResult> GetActiveProjectsList()
        {
            try
            {
                _logger.LogInformation("Getting active projects list");

                var result = await GetActiveProjectsDataAsync();

                _logger.LogInformation("Active projects retrieved successfully. Count: {Count}", result.Count);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting active projects data");
                return StatusCode(500, new ErrorResponse { Message = $"Aktif proje verileri alınamadı: {ex.Message}" });
            }
        }

        #region Private Methods

        private async Task<WeeklyCalendarResponse> GetWeeklyCalendarDataAsync(DateTime weekStart)
        {
            var response = new WeeklyCalendarResponse
            {
                WeekStart = weekStart,
                WeekEnd = weekStart.AddDays(6),
                Days = new List<DayData>()
            };

            var connectionString = _configuration.GetConnectionString("DefaultConnection")
                ?? throw new InvalidOperationException("RedmineDB connection string not found");

            using var connection = new SqlConnection(connectionString);
            await connection.OpenAsync();

            // 7 gün için veri çek
            for (int day = 0; day < 7; day++)
            {
                var currentDate = weekStart.AddDays(day);
                var dayData = new DayData
                {
                    Date = currentDate,
                    DayOfWeek = (int)currentDate.DayOfWeek,
                    DayName = GetTurkishDayName(currentDate.DayOfWeek),
                    Operations = await GetOperationsForDateAsync(connection, currentDate)
                };

                response.Days.Add(dayData);
            }

            return response;
        }

        private async Task<List<OperationData>> GetOperationsForDateAsync(SqlConnection connection, DateTime date)
        {
            var operations = new List<OperationData>();

            var sql = @"
                WITH ProjectOperations AS (
                    SELECT 
                        parent_issue.id as parent_issue_id,
                        parent_issue.subject as project_name,
                        child_issue.id as operation_id,
                        child_issue.subject as operation_name,
                        child_issue.start_date as operation_start_date,
                        child_issue.due_date as operation_due_date,
                        child_issue.done_ratio as completion_percentage,
                        child_issue.estimated_hours as estimated_hours,
                        status.name as status_name,
                        status.is_closed as is_completed,
                        priority.name as priority_name,
                        ISNULL(assigned_user.firstname + ' ' + assigned_user.lastname, 'Atanmamış') as assigned_to,
                        ISNULL(cv_project_code.value, 'PRJ-' + CAST(parent_issue.id AS VARCHAR)) as project_code,
                        
                        -- Operasyon tipini belirle (subject'ten)
                        CASE 
                            WHEN LOWER(child_issue.subject) LIKE '%data%hazır%' THEN 'data'
                            WHEN LOWER(child_issue.subject) LIKE '%lazer%' THEN 'lazer'
                            WHEN LOWER(child_issue.subject) LIKE '%abkant%' THEN 'abkant'
                            WHEN LOWER(child_issue.subject) LIKE '%kaynak%' THEN 'kaynak'
                            WHEN LOWER(child_issue.subject) LIKE '%zımpar%' OR LOWER(child_issue.subject) LIKE '%zimpar%' THEN 'zimparalar'
                            WHEN LOWER(child_issue.subject) LIKE '%boyahane%' OR LOWER(child_issue.subject) LIKE '%boya%' THEN 'boyahane'
                            WHEN LOWER(child_issue.subject) LIKE '%freze%' THEN 'freze'
                            WHEN LOWER(child_issue.subject) LIKE '%kaplama%' THEN 'kaplama'
                            WHEN LOWER(child_issue.subject) LIKE '%torna%' THEN 'torna'
                            WHEN LOWER(child_issue.subject) LIKE '%montaj%' THEN 'montaj'
                            WHEN LOWER(child_issue.subject) LIKE '%elektrik%' THEN 'elektrik'
                            WHEN LOWER(child_issue.subject) LIKE '%program%' THEN 'program'
                            WHEN LOWER(child_issue.subject) LIKE '%deneme%' OR LOWER(child_issue.subject) LIKE '%test%' THEN 'deneme'
                            WHEN LOWER(child_issue.subject) LIKE '%nakliye%' OR LOWER(child_issue.subject) LIKE '%sevkiyat%' THEN 'nakliye'
                            ELSE 'diger'
                        END as operation_type
                        
                    FROM issues parent_issue
                    INNER JOIN issues child_issue ON child_issue.parent_id = parent_issue.id
                    LEFT JOIN issue_statuses status ON child_issue.status_id = status.id
                    LEFT JOIN enumerations priority ON child_issue.priority_id = priority.id AND priority.type = 'IssuePriority'
                    LEFT JOIN users assigned_user ON child_issue.assigned_to_id = assigned_user.id
                    LEFT JOIN custom_values cv_project_code ON cv_project_code.customized_id = parent_issue.id 
                        AND cv_project_code.customized_type = 'Issue'
                        AND cv_project_code.custom_field_id = (
                            SELECT TOP 1 id FROM custom_fields 
                            WHERE (LOWER(name) LIKE '%proje%kod%' OR LOWER(name) LIKE '%project%code%') 
                            AND type = 'IssueCustomField'
                        )
                    
                    WHERE 
                        parent_issue.parent_id IS NULL  -- Ana projeler
                        AND child_issue.start_date IS NOT NULL
                        AND child_issue.due_date IS NOT NULL
                        AND child_issue.start_date <= @Date
                        AND child_issue.due_date >= @Date
                        AND (status.is_closed = 0 OR child_issue.done_ratio < 100) -- Sadece devam edenler
                )
                
                SELECT 
                    parent_issue_id,
                    project_code,
                    project_name,
                    operation_id,
                    operation_name,
                    operation_type,
                    operation_start_date,
                    operation_due_date,
                    completion_percentage,
                    estimated_hours,
                    status_name,
                    is_completed,
                    priority_name,
                    assigned_to
                FROM ProjectOperations
                ORDER BY project_code, operation_start_date";

            using var command = new SqlCommand(sql, connection);
            command.Parameters.AddWithValue("@Date", date.Date);

            using var reader = await command.ExecuteReaderAsync();
            while (await reader.ReadAsync())
            {
                operations.Add(new OperationData
                {
                    ProjectId = reader.GetFieldValue<int>("parent_issue_id"),
                    ProjectCode = reader.GetFieldValue<string>("project_code") ?? string.Empty,
                    ProjectName = reader.GetFieldValue<string>("project_name") ?? string.Empty,
                    OperationId = reader.GetFieldValue<int>("operation_id"),
                    OperationName = reader.GetFieldValue<string>("operation_name") ?? string.Empty,
                    OperationType = reader.GetFieldValue<string>("operation_type") ?? string.Empty,
                    StartDate = reader.GetFieldValue<DateTime>("operation_start_date"),
                    EndDate = reader.GetFieldValue<DateTime>("operation_due_date"),
                    CompletionPercentage = reader.GetFieldValue<int>("completion_percentage"),
                    EstimatedHours = reader.IsDBNull(reader.GetOrdinal("estimated_hours")) ?
                        null : reader.GetFieldValue<decimal>("estimated_hours"),
                    StatusName = reader.GetFieldValue<string>("status_name") ?? string.Empty,
                    IsCompleted = reader.GetFieldValue<bool>("is_completed"),
                    PriorityName = reader.GetFieldValue<string>("priority_name") ?? "Normal",
                    AssignedTo = reader.GetFieldValue<string>("assigned_to") ?? string.Empty
                });
            }

            return operations;
        }

        private async Task<List<ActiveProjectSummary>> GetActiveProjectsDataAsync()
        {
            var projects = new List<ActiveProjectSummary>();

            var connectionString = _configuration.GetConnectionString("DefaultConnection")
                ?? throw new InvalidOperationException("RedmineDB connection string not found");

            using var connection = new SqlConnection(connectionString);
            await connection.OpenAsync();

            var sql = @"
                WITH ProjectSummary AS (
                    SELECT 
                        parent_issue.id as project_id,
                        parent_issue.subject as project_name,
                        ISNULL(cv_project_code.value, 'PRJ-' + CAST(parent_issue.id AS VARCHAR)) as project_code,
                        MIN(child_issue.start_date) as project_start_date,
                        MAX(child_issue.due_date) as project_end_date,
                        COUNT(child_issue.id) as total_operations,
                        COUNT(CASE WHEN status.is_closed = 1 OR child_issue.done_ratio = 100 THEN 1 END) as completed_operations,
                        AVG(CAST(child_issue.done_ratio AS FLOAT)) as avg_completion,
                        COUNT(CASE WHEN child_issue.start_date <= GETDATE() AND child_issue.due_date >= GETDATE() 
                                   AND (status.is_closed = 0 AND child_issue.done_ratio < 100) THEN 1 END) as active_operations_count
                        
                    FROM issues parent_issue
                    INNER JOIN issues child_issue ON child_issue.parent_id = parent_issue.id
                    LEFT JOIN issue_statuses status ON child_issue.status_id = status.id
                    LEFT JOIN custom_values cv_project_code ON cv_project_code.customized_id = parent_issue.id 
                        AND cv_project_code.customized_type = 'Issue'
                        AND cv_project_code.custom_field_id = (
                            SELECT TOP 1 id FROM custom_fields 
                            WHERE (LOWER(name) LIKE '%proje%kod%' OR LOWER(name) LIKE '%project%code%') 
                            AND type = 'IssueCustomField'
                        )
                    
                    WHERE 
                        parent_issue.parent_id IS NULL
                        AND child_issue.start_date IS NOT NULL
                        AND child_issue.due_date IS NOT NULL
                        AND child_issue.due_date >= DATEADD(WEEK, -2, GETDATE()) -- Son 2 haftadan itibaren
                        
                    GROUP BY parent_issue.id, parent_issue.subject, cv_project_code.value
                    HAVING COUNT(child_issue.id) > 0
                )
                
                SELECT 
                    project_id,
                    project_code,
                    project_name,
                    project_start_date,
                    project_end_date,
                    total_operations,
                    completed_operations,
                    ROUND(avg_completion, 0) as avg_completion,
                    active_operations_count
                FROM ProjectSummary
                WHERE active_operations_count > 0 OR avg_completion < 100
                ORDER BY project_start_date DESC";

            using var command = new SqlCommand(sql, connection);
            using var reader = await command.ExecuteReaderAsync();

            while (await reader.ReadAsync())
            {
                projects.Add(new ActiveProjectSummary
                {
                    ProjectId = reader.GetFieldValue<int>("project_id"),
                    ProjectCode = reader.GetFieldValue<string>("project_code") ?? string.Empty,
                    ProjectName = reader.GetFieldValue<string>("project_name") ?? string.Empty,
                    StartDate = reader.GetFieldValue<DateTime>("project_start_date"),
                    EndDate = reader.GetFieldValue<DateTime>("project_end_date"),
                    TotalOperations = reader.GetFieldValue<int>("total_operations"),
                    CompletedOperations = reader.GetFieldValue<int>("completed_operations"),
                    CompletionPercentage = Convert.ToInt32(reader.GetFieldValue<double>("avg_completion")),
                    ActiveOperationsCount = reader.GetFieldValue<int>("active_operations_count")
                });
            }

            return projects;
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