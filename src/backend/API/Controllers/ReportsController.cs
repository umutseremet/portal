using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using OfficeOpenXml;
using OfficeOpenXml.Style;

namespace API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
#if DEBUG
    [AllowAnonymous]
#else
    [Authorize]
#endif
    public class ReportsController : ControllerBase
    {
        private readonly IConfiguration _configuration;
        private readonly ILogger<ReportsController> _logger;

        public ReportsController(IConfiguration configuration, ILogger<ReportsController> logger)
        {
            _configuration = configuration;
            _logger = logger;
        }

        /// <summary>
        /// Redmine'daki açık işleri filtreli olarak listeler
        /// </summary>
        [HttpPost("open-issues")]
        public async Task<IActionResult> GetOpenIssues([FromBody] OpenIssuesRequest request)
        {
            try
            {
                _logger.LogInformation("Getting open issues with filters");

                var connectionString = _configuration.GetConnectionString("DefaultConnection")
                    ?? throw new InvalidOperationException("Database connection string not configured");

                var issues = new List<OpenIssueDto>();
                var totalCount = 0;

                using (var connection = new SqlConnection(connectionString))
                {
                    await connection.OpenAsync();

                    // Build dynamic WHERE clause
                    var whereClauses = new List<string> { "i.id IS NOT NULL" };
                    var parameters = new List<SqlParameter>();

                    // Açık işler (is_closed = 0) - Sadece açık statüdeki işler
                    whereClauses.Add("(s.is_closed = 0)");

                    // Assigned To filter (multiple values)
                    if (request.AssignedToIds != null && request.AssignedToIds.Any())
                    {
                        var assignedParams = string.Join(",", request.AssignedToIds.Select((id, idx) => $"@assigned{idx}"));
                        whereClauses.Add($"i.assigned_to_id IN ({assignedParams})");
                        for (int idx = 0; idx < request.AssignedToIds.Count; idx++)
                        {
                            parameters.Add(new SqlParameter($"@assigned{idx}", request.AssignedToIds[idx]));
                        }
                    }

                    // Issue Type filter (multiple values)
                    if (request.TrackerIds != null && request.TrackerIds.Any())
                    {
                        var trackerParams = string.Join(",", request.TrackerIds.Select((id, idx) => $"@tracker{idx}"));
                        whereClauses.Add($"i.tracker_id IN ({trackerParams})");
                        for (int idx = 0; idx < request.TrackerIds.Count; idx++)
                        {
                            parameters.Add(new SqlParameter($"@tracker{idx}", request.TrackerIds[idx]));
                        }
                    }

                    // Project filter (multiple values)
                    if (request.ProjectIds != null && request.ProjectIds.Any())
                    {
                        var projectParams = string.Join(",", request.ProjectIds.Select((id, idx) => $"@project{idx}"));
                        whereClauses.Add($"i.project_id IN ({projectParams})");
                        for (int idx = 0; idx < request.ProjectIds.Count; idx++)
                        {
                            parameters.Add(new SqlParameter($"@project{idx}", request.ProjectIds[idx]));
                        }
                    }

                    // Created Date filter (with time)
                    if (!string.IsNullOrEmpty(request.CreatedAfter))
                    {
                        whereClauses.Add("i.created_on >= @createdAfter");
                        parameters.Add(new SqlParameter("@createdAfter", DateTime.Parse(request.CreatedAfter)));
                    }

                    if (!string.IsNullOrEmpty(request.CreatedBefore))
                    {
                        whereClauses.Add("i.created_on <= @createdBefore");
                        parameters.Add(new SqlParameter("@createdBefore", DateTime.Parse(request.CreatedBefore)));
                    }

                    // Search term
                    if (!string.IsNullOrEmpty(request.SearchTerm))
                    {
                        whereClauses.Add("(i.subject LIKE @search OR CAST(i.id AS NVARCHAR) LIKE @search)");
                        parameters.Add(new SqlParameter("@search", $"%{request.SearchTerm}%"));
                    }

                    // Empty Date Filter (new)
                    if (!string.IsNullOrEmpty(request.EmptyDateFilter))
                    {
                        switch (request.EmptyDateFilter)
                        {
                            case "empty-order-date":
                                // Sipariş tarihi (custom_field_id = 14) boş olanlar
                                whereClauses.Add(@"NOT EXISTS (
                                    SELECT 1 FROM custom_values cv 
                                    WHERE cv.customized_type = 'Issue' 
                                    AND cv.customized_id = i.id 
                                    AND cv.custom_field_id = 14 
                                    AND cv.value IS NOT NULL 
                                    AND cv.value != ''
                                )");
                                break;

                            case "empty-deadline-date":
                                // Termin tarihi (custom_field_id = 49) boş olanlar
                                whereClauses.Add(@"NOT EXISTS (
                                    SELECT 1 FROM custom_values cv 
                                    WHERE cv.customized_type = 'Issue' 
                                    AND cv.customized_id = i.id 
                                    AND cv.custom_field_id = 49 
                                    AND cv.value IS NOT NULL 
                                    AND cv.value != ''
                                )");
                                break;

                            case "empty-planning-dates":
                                // Planlama tarihleri (custom_field_id = 12 veya 4) boş olanlar
                                whereClauses.Add(@"(
                                    NOT EXISTS (
                                        SELECT 1 FROM custom_values cv 
                                        WHERE cv.customized_type = 'Issue' 
                                        AND cv.customized_id = i.id 
                                        AND cv.custom_field_id = 12 
                                        AND cv.value IS NOT NULL 
                                        AND cv.value != ''
                                    ) OR NOT EXISTS (
                                        SELECT 1 FROM custom_values cv 
                                        WHERE cv.customized_type = 'Issue' 
                                        AND cv.customized_id = i.id 
                                        AND cv.custom_field_id = 4 
                                        AND cv.value IS NOT NULL 
                                        AND cv.value != ''
                                    )
                                )");
                                break;
                        }
                    }

                    var whereClause = string.Join(" AND ", whereClauses);

                    // Count query
                    var countQuery = $@"
                        SELECT COUNT(*)
                        FROM issues i
                        LEFT JOIN issue_statuses s ON i.status_id = s.id
                        WHERE {whereClause}";

                    using (var countCmd = new SqlCommand(countQuery, connection))
                    {
                        countCmd.Parameters.AddRange(parameters.ToArray());
                        totalCount = (int)await countCmd.ExecuteScalarAsync();
                    }

                    // Data query with pagination
                    var offset = (request.Page - 1) * request.PageSize;
                    var dataQuery = $@"
                        SELECT 
                            i.id AS IssueId,
                            i.subject AS Subject,
                            t.name AS TrackerName,
                            COALESCE(u_assigned.firstname + ' ' + u_assigned.lastname, 'Atanmamış') AS AssignedTo,
                            COALESCE(u_author.firstname + ' ' + u_author.lastname, 'Bilinmiyor') AS CreatedBy,
                            i.created_on AS CreatedOn,
                            i.start_date AS StartDate,
                            i.due_date AS DueDate,
                            
                            -- Sipariş Tarihi (custom_field_id = 14)
                            (SELECT cv.value 
                             FROM custom_values cv
                             WHERE cv.customized_type = 'Issue' 
                               AND cv.customized_id = i.id 
                               AND cv.custom_field_id = 14) AS OrderDate,
                            
                            -- Termin Tarihi (custom_field_id = 49)
                            (SELECT cv.value 
                             FROM custom_values cv
                             WHERE cv.customized_type = 'Issue' 
                               AND cv.customized_id = i.id 
                               AND cv.custom_field_id = 49) AS DeadlineDate,
                            
                            -- Planlanan Başlangıç (custom_field_id = 12)
                            (SELECT cv.value 
                             FROM custom_values cv
                             WHERE cv.customized_type = 'Issue' 
                               AND cv.customized_id = i.id 
                               AND cv.custom_field_id = 12) AS PlannedStartDate,
                            
                            -- Planlanan Bitiş (custom_field_id = 4)
                            (SELECT cv.value 
                             FROM custom_values cv
                             WHERE cv.customized_type = 'Issue' 
                               AND cv.customized_id = i.id 
                               AND cv.custom_field_id = 4) AS PlannedEndDate,
                            
                            p.name AS ProjectName,
                            s.name AS StatusName
                        FROM issues i
                        LEFT JOIN trackers t ON i.tracker_id = t.id and t.id not in (27, 35)
                        LEFT JOIN users u_assigned ON i.assigned_to_id = u_assigned.id
                        LEFT JOIN users u_author ON i.author_id = u_author.id
                        LEFT JOIN projects p ON i.project_id = p.id
                        LEFT JOIN issue_statuses s ON i.status_id = s.id
                        WHERE {whereClause}
                        ORDER BY i.created_on DESC
                        OFFSET @offset ROWS
                        FETCH NEXT @pageSize ROWS ONLY";

                    using (var dataCmd = new SqlCommand(dataQuery, connection))
                    {
                        dataCmd.Parameters.AddRange(parameters.Select(p => new SqlParameter(p.ParameterName, p.Value)).ToArray());
                        dataCmd.Parameters.AddWithValue("@offset", offset);
                        dataCmd.Parameters.AddWithValue("@pageSize", request.PageSize);

                        using (var reader = await dataCmd.ExecuteReaderAsync())
                        {
                            while (await reader.ReadAsync())
                            {
                                DateTime? plannedStart = null;
                                DateTime? plannedEnd = null;
                                DateTime? orderDate = null;
                                DateTime? deadlineDate = null;

                                // Parse order date
                                if (!reader.IsDBNull(reader.GetOrdinal("OrderDate")))
                                {
                                    var orderDateStr = reader.GetString(reader.GetOrdinal("OrderDate"));
                                    if (DateTime.TryParse(orderDateStr, out DateTime odDate))
                                        orderDate = odDate;
                                }

                                // Parse deadline date
                                if (!reader.IsDBNull(reader.GetOrdinal("DeadlineDate")))
                                {
                                    var deadlineDateStr = reader.GetString(reader.GetOrdinal("DeadlineDate"));
                                    if (DateTime.TryParse(deadlineDateStr, out DateTime ddDate))
                                        deadlineDate = ddDate;
                                }

                                // Parse planned dates
                                if (!reader.IsDBNull(reader.GetOrdinal("PlannedStartDate")))
                                {
                                    var plannedStartStr = reader.GetString(reader.GetOrdinal("PlannedStartDate"));
                                    if (DateTime.TryParse(plannedStartStr, out DateTime psDate))
                                        plannedStart = psDate;
                                }

                                if (!reader.IsDBNull(reader.GetOrdinal("PlannedEndDate")))
                                {
                                    var plannedEndStr = reader.GetString(reader.GetOrdinal("PlannedEndDate"));
                                    if (DateTime.TryParse(plannedEndStr, out DateTime peDate))
                                        plannedEnd = peDate;
                                }

                                issues.Add(new OpenIssueDto
                                {
                                    IssueId = reader.GetInt32(reader.GetOrdinal("IssueId")),
                                    Subject = reader.GetString(reader.GetOrdinal("Subject")),
                                    TrackerName = reader.IsDBNull(reader.GetOrdinal("TrackerName"))
                                        ? "" : reader.GetString(reader.GetOrdinal("TrackerName")),
                                    AssignedTo = reader.GetString(reader.GetOrdinal("AssignedTo")),
                                    CreatedBy = reader.GetString(reader.GetOrdinal("CreatedBy")),
                                    CreatedOn = reader.GetDateTime(reader.GetOrdinal("CreatedOn")),
                                    StartDate = reader.IsDBNull(reader.GetOrdinal("StartDate"))
                                        ? (DateTime?)null : reader.GetDateTime(reader.GetOrdinal("StartDate")),
                                    DueDate = reader.IsDBNull(reader.GetOrdinal("DueDate"))
                                        ? (DateTime?)null : reader.GetDateTime(reader.GetOrdinal("DueDate")),
                                    OrderDate = orderDate,
                                    DeadlineDate = deadlineDate,
                                    PlannedStartDate = plannedStart,
                                    PlannedEndDate = plannedEnd,
                                    ProjectName = reader.IsDBNull(reader.GetOrdinal("ProjectName"))
                                        ? "" : reader.GetString(reader.GetOrdinal("ProjectName")),
                                    StatusName = reader.IsDBNull(reader.GetOrdinal("StatusName"))
                                        ? "" : reader.GetString(reader.GetOrdinal("StatusName"))
                                });
                            }
                        }
                    }
                }

                _logger.LogInformation("Found {Count} open issues, total: {Total}", issues.Count, totalCount);

                return Ok(new OpenIssuesResponse
                {
                    Issues = issues,
                    TotalCount = totalCount,
                    Page = request.Page,
                    PageSize = request.PageSize,
                    TotalPages = (int)Math.Ceiling((double)totalCount / request.PageSize)
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting open issues");
                return StatusCode(500, new ErrorResponse { Message = $"Hata: {ex.Message}" });
            }
        }


        /// <summary>
        /// Proje analiz raporunu getirir (Gantt benzeri görünüm)
        /// </summary>
        [HttpGet("project-analytics")]
        public async Task<IActionResult> GetProjectAnalytics()
        {
            try
            {
                _logger.LogInformation("Getting project analytics report");

                var connectionString = _configuration.GetConnectionString("DefaultConnection")
                    ?? throw new InvalidOperationException("Database connection string not configured");

                var projects = new List<ProjectAnalyticsDto>();

                using (var connection = new SqlConnection(connectionString))
                {
                    await connection.OpenAsync();

                    var query = @"
WITH ProjeIsler AS (
    -- Ana projeler ve ara işleri
    SELECT
        parent.id AS parent_id,
        cv.value AS project_code,
        parent.subject AS project_name,
        child.id AS ara_is_id,
        t.name AS issue_type,
        child.subject,
        child.tracker_id
    FROM issues child
    JOIN issues parent ON child.parent_id = parent.id
    JOIN trackers t ON child.tracker_id = t.id
    JOIN custom_values cv ON cv.customized_id = parent.project_id and cv.custom_field_id = 3
    WHERE child.parent_id IN (
        SELECT i.id FROM issues i
        INNER JOIN custom_values cv1 ON cv1.customized_id = i.id
        WHERE cv1.custom_field_id = 23 AND cv1.value = 1
    )
),

-- Ara işlerin alt işleri (sadece 1 seviye)
AltIsler AS (
    SELECT
        pi.parent_id,
        pi.project_code,
        pi.project_name,
        pi.issue_type,
        pi.ara_is_id,
        alt.id AS alt_is_id,
        alt.status_id
    FROM ProjeIsler pi
    LEFT JOIN issues alt ON alt.parent_id = pi.ara_is_id
),

-- Alt işi olmayan ara işlerin kendi durumu
AraIsDurumlari AS (
    SELECT
        pi.parent_id,
        pi.project_code,
        pi.project_name,
        pi.issue_type,
        pi.ara_is_id,
        pi.ara_is_id AS issue_id,
        (SELECT status_id FROM issues WHERE id = pi.ara_is_id) AS status_id
    FROM ProjeIsler pi
    WHERE pi.tracker_id IN (16,31,32) -- FAT, SAT, Sevkiyat (genelde alt işi olmayan)
      AND NOT EXISTS (SELECT 1 FROM issues WHERE parent_id = pi.ara_is_id)
),

-- Birleşik durum tablosu
BirlesikDurum AS (
    -- Alt işi olan ara işler için alt işlerin durumu
    SELECT
        parent_id, project_code, project_name, issue_type, ara_is_id,
        alt_is_id AS issue_id, status_id
    FROM AltIsler
    WHERE alt_is_id IS NOT NULL

    UNION ALL

    -- Alt işi olmayan ara işler için kendi durumu
    SELECT
        parent_id, project_code, project_name, issue_type, ara_is_id,
        issue_id, status_id
    FROM AraIsDurumlari
),

-- Durum hesaplamaları
DurumHesaplamalari AS (
    SELECT
        bd.parent_id,
        bd.project_code,
        bd.project_name,
        bd.issue_type,
        -- Tamamlanan yüzde
        CASE
            WHEN COUNT(bd.issue_id) = 0 THEN '0.00'
            ELSE FORMAT(100.0 * SUM(CASE WHEN ist.is_closed = 1 THEN 1 ELSE 0 END) / COUNT(bd.issue_id), 'N2')
        END AS completed_percent,
        -- Çalışılıyor yüzde
        CASE
            WHEN COUNT(bd.issue_id) = 0 THEN '0.00'
            ELSE FORMAT(100.0 * SUM(CASE WHEN ist.is_closed = 0 AND ist.id = 3 THEN 1 ELSE 0 END) / COUNT(bd.issue_id), 'N2')
        END AS in_progress_percent
    FROM BirlesikDurum bd
    LEFT JOIN issue_statuses ist ON bd.status_id = ist.id
    GROUP BY bd.parent_id, bd.project_code, bd.project_name, bd.issue_type
),

-- Tarih bilgileri
FATTarihleri AS (
    SELECT
        pi.parent_id,
        FORMAT(CONVERT(date, cv.value), 'dd.MM.yyyy') + ' 00:00:00' AS fat_tarih
    FROM ProjeIsler pi
    JOIN custom_values cv ON cv.customized_id = pi.ara_is_id
    WHERE cv.custom_field_id = 4 AND pi.issue_type = 'SSH - FAT'
),

SevkiyatTarihleri AS (
    SELECT
        pi.parent_id,
        FORMAT(CONVERT(date, cv.value), 'dd.MM.yyyy') + ' 00:00:00' AS sevkiyat_tarih
    FROM ProjeIsler pi
    JOIN custom_values cv ON cv.customized_id = pi.ara_is_id
    WHERE cv.custom_field_id = 4 AND pi.issue_type = 'SSH - Sevkiyat'
)

-- Final sonuç
SELECT
    dh.project_code,
    dh.project_name,
    dh.parent_id AS issue_id,

    -- Tamamlanan kolonları
    ISNULL(MAX(CASE WHEN dh.issue_type = N'Tasarım' THEN dh.completed_percent END), '0.00') AS tamamlanan_tasarim,
    ISNULL(MAX(CASE WHEN dh.issue_type = N'Satınalma' THEN dh.completed_percent END), '0.00') AS tamamlanan_satinalma,
    ISNULL(MAX(CASE WHEN dh.issue_type = N'Üretim' THEN dh.completed_percent END), '0.00') AS tamamlanan_uretim,
    ISNULL(MAX(CASE WHEN dh.issue_type = N'Montaj' THEN dh.completed_percent END), '0.00') AS tamamlanan_montaj,
    ISNULL(MAX(CASE WHEN dh.issue_type = N'Elektrik' THEN dh.completed_percent END), '0.00') AS tamamlanan_elektrik,
    ISNULL(MAX(CASE WHEN dh.issue_type = N'SSH - FAT' THEN dh.completed_percent END), '0.00') AS tamamlanan_fat,
    ISNULL(MAX(CASE WHEN dh.issue_type = N'SSH - SAT' THEN dh.completed_percent END), '0.00') AS tamamlanan_sat,
    ISNULL(MAX(CASE WHEN dh.issue_type = N'SSH - Sevkiyat' THEN dh.completed_percent END), '0.00') AS tamamlanan_sevkiyat,

    -- Çalışılıyor kolonları
    ISNULL(MAX(CASE WHEN dh.issue_type = N'Satınalma' THEN dh.in_progress_percent END), '0.00') AS calisiliyor_satinalma,
    ISNULL(MAX(CASE WHEN dh.issue_type = N'Üretim' THEN dh.in_progress_percent END), '0.00') AS calisiliyor_uretim,
    ISNULL(MAX(CASE WHEN dh.issue_type = N'Montaj' THEN dh.in_progress_percent END), '0.00') AS calisiliyor_montaj,
    ISNULL(MAX(CASE WHEN dh.issue_type = N'Elektrik' THEN dh.in_progress_percent END), '0.00') AS calisiliyor_elektrik,
    ISNULL(MAX(CASE WHEN dh.issue_type = N'SSH - FAT' THEN dh.in_progress_percent END), '0.00') AS calisiliyor_fat,
    ISNULL(MAX(CASE WHEN dh.issue_type = N'SSH - SAT' THEN dh.in_progress_percent END), '0.00') AS calisiliyor_sat,
    ISNULL(MAX(CASE WHEN dh.issue_type = N'SSH - Sevkiyat' THEN dh.in_progress_percent END), '0.00') AS calisiliyor_sevkiyat,

    -- Tarih bilgileri
    ft.fat_tarih as FAT_Planlanan_Tarih, 
    st.sevkiyat_tarih as Sevkiyat_Planlanan_Tarih

FROM DurumHesaplamalari dh
LEFT JOIN FATTarihleri ft ON ft.parent_id = dh.parent_id
LEFT JOIN SevkiyatTarihleri st ON st.parent_id = dh.parent_id
GROUP BY dh.project_code, dh.project_name, dh.parent_id, ft.fat_tarih, st.sevkiyat_tarih
ORDER BY dh.project_code";

                    using (var command = new SqlCommand(query, connection))
                    {
                        using (var reader = await command.ExecuteReaderAsync())
                        {
                            while (await reader.ReadAsync())
                            {
                                projects.Add(new ProjectAnalyticsDto
                                {
                                    ProjectCode = reader.GetString(reader.GetOrdinal("project_code")),
                                    ProjectName = reader.IsDBNull(reader.GetOrdinal("project_name")) ? "" : reader.GetString(reader.GetOrdinal("project_name")),
                                    IssueId = reader.GetInt32(reader.GetOrdinal("issue_id")),
                                    TamamlananTasarim = reader.GetString(reader.GetOrdinal("tamamlanan_tasarim")),
                                    TamamlananSatinalma = reader.GetString(reader.GetOrdinal("tamamlanan_satinalma")),
                                    TamamlananUretim = reader.GetString(reader.GetOrdinal("tamamlanan_uretim")),
                                    TamamlananMontaj = reader.GetString(reader.GetOrdinal("tamamlanan_montaj")),
                                    TamamlananElektrik = reader.GetString(reader.GetOrdinal("tamamlanan_elektrik")),
                                    TamamlananFat = reader.GetString(reader.GetOrdinal("tamamlanan_fat")),
                                    TamamlananSat = reader.GetString(reader.GetOrdinal("tamamlanan_sat")),
                                    TamamlananSevkiyat = reader.GetString(reader.GetOrdinal("tamamlanan_sevkiyat")),
                                    CalisiliyorSatinalma = reader.GetString(reader.GetOrdinal("calisiliyor_satinalma")),
                                    CalisiliyorUretim = reader.GetString(reader.GetOrdinal("calisiliyor_uretim")),
                                    CalisiliyorMontaj = reader.GetString(reader.GetOrdinal("calisiliyor_montaj")),
                                    CalisiliyorElektrik = reader.GetString(reader.GetOrdinal("calisiliyor_elektrik")),
                                    CalisiliyorFat = reader.GetString(reader.GetOrdinal("calisiliyor_fat")),
                                    CalisiliyorSat = reader.GetString(reader.GetOrdinal("calisiliyor_sat")),
                                    CalisiliyorSevkiyat = reader.GetString(reader.GetOrdinal("calisiliyor_sevkiyat")),
                                    FatTarih = reader.IsDBNull(reader.GetOrdinal("FAT_Planlanan_Tarih")) ? null : reader.GetString(reader.GetOrdinal("FAT_Planlanan_Tarih")),
                                    SevkiyatTarih = reader.IsDBNull(reader.GetOrdinal("Sevkiyat_Planlanan_Tarih")) ? null : reader.GetString(reader.GetOrdinal("Sevkiyat_Planlanan_Tarih"))
                                });
                            }
                        }
                    }
                }

                _logger.LogInformation("Found {Count} projects for analytics", projects.Count);

                return Ok(projects);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting project analytics");
                return StatusCode(500, new ErrorResponse { Message = $"Hata: {ex.Message}" });
            }
        }

        /// <summary>
        /// Kullanıcı listesini getirir (Atanan dropdown için)
        /// </summary>
        [HttpGet("users")]
        public async Task<IActionResult> GetUsers()
        {
            try
            {
                var connectionString = _configuration.GetConnectionString("DefaultConnection")
                    ?? throw new InvalidOperationException("Database connection string not configured");

                var users = new List<UserDto>();

                using (var connection = new SqlConnection(connectionString))
                {
                    await connection.OpenAsync();

                    var query = @"
                        SELECT 
                            id AS Id,
                            firstname + ' ' + lastname AS FullName
                        FROM users
                        WHERE status = 1 and type = 'User'
                        ORDER BY firstname, lastname";

                    using (var cmd = new SqlCommand(query, connection))
                    using (var reader = await cmd.ExecuteReaderAsync())
                    {
                        while (await reader.ReadAsync())
                        {
                            users.Add(new UserDto
                            {
                                Id = reader.GetInt32(0),
                                FullName = reader.GetString(1)
                            });
                        }
                    }
                }

                return Ok(users);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting users");
                return StatusCode(500, new ErrorResponse { Message = $"Hata: {ex.Message}" });
            }
        }

        /// <summary>
        /// İş tipi listesini getirir (Tracker dropdown için)
        /// </summary>
        [HttpGet("trackers")]
        public async Task<IActionResult> GetTrackers()
        {
            try
            {
                var connectionString = _configuration.GetConnectionString("DefaultConnection")
                    ?? throw new InvalidOperationException("Database connection string not configured");

                var trackers = new List<TrackerDto>();

                using (var connection = new SqlConnection(connectionString))
                {
                    await connection.OpenAsync();

                    var query = @"
                        SELECT 
                            id AS Id,
                            name AS Name
                        FROM trackers where id not in (27, 35)
                        ORDER BY position";

                    using (var cmd = new SqlCommand(query, connection))
                    using (var reader = await cmd.ExecuteReaderAsync())
                    {
                        while (await reader.ReadAsync())
                        {
                            trackers.Add(new TrackerDto
                            {
                                Id = reader.GetInt32(0),
                                Name = reader.GetString(1)
                            });
                        }
                    }
                }

                return Ok(trackers);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting trackers");
                return StatusCode(500, new ErrorResponse { Message = $"Hata: {ex.Message}" });
            }
        }

        /// <summary>
        /// Proje listesini getirir (Proje dropdown için)
        /// </summary>
        [HttpGet("projects")]
        public async Task<IActionResult> GetProjects()
        {
            try
            {
                var connectionString = _configuration.GetConnectionString("DefaultConnection")
                    ?? throw new InvalidOperationException("Database connection string not configured");

                var projects = new List<ProjectDto>();

                using (var connection = new SqlConnection(connectionString))
                {
                    await connection.OpenAsync();

                    var query = @"
                        SELECT 
                            id AS Id,
                            name AS Name
                        FROM projects
                        WHERE status = 1
                        ORDER BY name";

                    using (var cmd = new SqlCommand(query, connection))
                    using (var reader = await cmd.ExecuteReaderAsync())
                    {
                        while (await reader.ReadAsync())
                        {
                            projects.Add(new ProjectDto
                            {
                                Id = reader.GetInt32(0),
                                Name = reader.GetString(1)
                            });
                        }
                    }
                }

                return Ok(projects);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting projects");
                return StatusCode(500, new ErrorResponse { Message = $"Hata: {ex.Message}" });
            }
        }

        /// <summary>
        /// Açık işler raporunu Excel (XLSX) olarak indirir
        /// </summary>
        [HttpPost("open-issues/export")]
        public async Task<IActionResult> ExportOpenIssuesToExcel([FromBody] OpenIssuesRequest request)
        {
            try
            {
                _logger.LogInformation("Exporting open issues to Excel (XLSX)");

                // Set EPPlus license context
                ExcelPackage.LicenseContext = LicenseContext.NonCommercial;

                var connectionString = _configuration.GetConnectionString("DefaultConnection")
                    ?? throw new InvalidOperationException("Database connection string not configured");

                var issues = new List<OpenIssueDto>();

                using (var connection = new SqlConnection(connectionString))
                {
                    await connection.OpenAsync();

                    var whereClauses = new List<string> { "i.id IS NOT NULL" };
                    var parameters = new List<SqlParameter>();
                    whereClauses.Add("(s.is_closed = 0)");

                    if (request.AssignedToIds != null && request.AssignedToIds.Any())
                    {
                        var assignedParams = string.Join(",", request.AssignedToIds.Select((id, idx) => $"@assigned{idx}"));
                        whereClauses.Add($"i.assigned_to_id IN ({assignedParams})");
                        for (int idx = 0; idx < request.AssignedToIds.Count; idx++)
                            parameters.Add(new SqlParameter($"@assigned{idx}", request.AssignedToIds[idx]));
                    }

                    if (request.TrackerIds != null && request.TrackerIds.Any())
                    {
                        var trackerParams = string.Join(",", request.TrackerIds.Select((id, idx) => $"@tracker{idx}"));
                        whereClauses.Add($"i.tracker_id IN ({trackerParams})");
                        for (int idx = 0; idx < request.TrackerIds.Count; idx++)
                            parameters.Add(new SqlParameter($"@tracker{idx}", request.TrackerIds[idx]));
                    }

                    if (request.ProjectIds != null && request.ProjectIds.Any())
                    {
                        var projectParams = string.Join(",", request.ProjectIds.Select((id, idx) => $"@project{idx}"));
                        whereClauses.Add($"i.project_id IN ({projectParams})");
                        for (int idx = 0; idx < request.ProjectIds.Count; idx++)
                            parameters.Add(new SqlParameter($"@project{idx}", request.ProjectIds[idx]));
                    }

                    if (!string.IsNullOrEmpty(request.CreatedAfter))
                    {
                        whereClauses.Add("i.created_on >= @createdAfter");
                        parameters.Add(new SqlParameter("@createdAfter", DateTime.Parse(request.CreatedAfter)));
                    }

                    if (!string.IsNullOrEmpty(request.CreatedBefore))
                    {
                        whereClauses.Add("i.created_on <= @createdBefore");
                        parameters.Add(new SqlParameter("@createdBefore", DateTime.Parse(request.CreatedBefore)));
                    }

                    if (!string.IsNullOrEmpty(request.SearchTerm))
                    {
                        whereClauses.Add("(i.subject LIKE @search OR CAST(i.id AS NVARCHAR) LIKE @search)");
                        parameters.Add(new SqlParameter("@search", $"%{request.SearchTerm}%"));
                    }

                    if (!string.IsNullOrEmpty(request.EmptyDateFilter))
                    {
                        switch (request.EmptyDateFilter)
                        {
                            case "empty-order-date":
                                whereClauses.Add(@"NOT EXISTS (SELECT 1 FROM custom_values cv WHERE cv.customized_type = 'Issue' AND cv.customized_id = i.id AND cv.custom_field_id = 14 AND cv.value IS NOT NULL AND cv.value != '')");
                                break;
                            case "empty-deadline-date":
                                whereClauses.Add(@"NOT EXISTS (SELECT 1 FROM custom_values cv WHERE cv.customized_type = 'Issue' AND cv.customized_id = i.id AND cv.custom_field_id = 49 AND cv.value IS NOT NULL AND cv.value != '')");
                                break;
                            case "empty-planning-dates":
                                whereClauses.Add(@"(NOT EXISTS (SELECT 1 FROM custom_values cv WHERE cv.customized_type = 'Issue' AND cv.customized_id = i.id AND cv.custom_field_id = 12 AND cv.value IS NOT NULL AND cv.value != '') OR NOT EXISTS (SELECT 1 FROM custom_values cv WHERE cv.customized_type = 'Issue' AND cv.customized_id = i.id AND cv.custom_field_id = 4 AND cv.value IS NOT NULL AND cv.value != ''))");
                                break;
                        }
                    }

                    var whereClause = string.Join(" AND ", whereClauses);

                    var dataQuery = $@"
                        SELECT i.id AS IssueId, i.subject AS Subject, t.name AS TrackerName,
                            COALESCE(u_assigned.firstname + ' ' + u_assigned.lastname, 'Atanmamış') AS AssignedTo,
                            COALESCE(u_author.firstname + ' ' + u_author.lastname, 'Bilinmiyor') AS CreatedBy,
                            i.created_on AS CreatedOn,
                            (SELECT cv.value FROM custom_values cv WHERE cv.customized_type = 'Issue' AND cv.customized_id = i.id AND cv.custom_field_id = 14) AS OrderDate,
                            (SELECT cv.value FROM custom_values cv WHERE cv.customized_type = 'Issue' AND cv.customized_id = i.id AND cv.custom_field_id = 49) AS DeadlineDate,
                            (SELECT cv.value FROM custom_values cv WHERE cv.customized_type = 'Issue' AND cv.customized_id = i.id AND cv.custom_field_id = 12) AS PlannedStartDate,
                            (SELECT cv.value FROM custom_values cv WHERE cv.customized_type = 'Issue' AND cv.customized_id = i.id AND cv.custom_field_id = 4) AS PlannedEndDate,
                            p.name AS ProjectName, s.name AS StatusName
                        FROM issues i
                        LEFT JOIN trackers t ON i.tracker_id = t.id
                        LEFT JOIN users u_assigned ON i.assigned_to_id = u_assigned.id
                        LEFT JOIN users u_author ON i.author_id = u_author.id
                        LEFT JOIN projects p ON i.project_id = p.id
                        LEFT JOIN issue_statuses s ON i.status_id = s.id
                        WHERE {whereClause}
                        ORDER BY i.created_on DESC";

                    using (var dataCmd = new SqlCommand(dataQuery, connection))
                    {
                        dataCmd.Parameters.AddRange(parameters.Select(p => new SqlParameter(p.ParameterName, p.Value)).ToArray());

                        using (var reader = await dataCmd.ExecuteReaderAsync())
                        {
                            while (await reader.ReadAsync())
                            {
                                DateTime? plannedStart = null, plannedEnd = null, orderDate = null, deadlineDate = null;

                                if (!reader.IsDBNull(reader.GetOrdinal("OrderDate")) && DateTime.TryParse(reader.GetString(reader.GetOrdinal("OrderDate")), out DateTime od))
                                    orderDate = od;
                                if (!reader.IsDBNull(reader.GetOrdinal("DeadlineDate")) && DateTime.TryParse(reader.GetString(reader.GetOrdinal("DeadlineDate")), out DateTime dd))
                                    deadlineDate = dd;
                                if (!reader.IsDBNull(reader.GetOrdinal("PlannedStartDate")) && DateTime.TryParse(reader.GetString(reader.GetOrdinal("PlannedStartDate")), out DateTime ps))
                                    plannedStart = ps;
                                if (!reader.IsDBNull(reader.GetOrdinal("PlannedEndDate")) && DateTime.TryParse(reader.GetString(reader.GetOrdinal("PlannedEndDate")), out DateTime pe))
                                    plannedEnd = pe;

                                issues.Add(new OpenIssueDto
                                {
                                    IssueId = reader.GetInt32(reader.GetOrdinal("IssueId")),
                                    Subject = reader.GetString(reader.GetOrdinal("Subject")),
                                    TrackerName = reader.IsDBNull(reader.GetOrdinal("TrackerName")) ? "" : reader.GetString(reader.GetOrdinal("TrackerName")),
                                    AssignedTo = reader.GetString(reader.GetOrdinal("AssignedTo")),
                                    CreatedBy = reader.GetString(reader.GetOrdinal("CreatedBy")),
                                    CreatedOn = reader.GetDateTime(reader.GetOrdinal("CreatedOn")),
                                    OrderDate = orderDate,
                                    DeadlineDate = deadlineDate,
                                    PlannedStartDate = plannedStart,
                                    PlannedEndDate = plannedEnd,
                                    ProjectName = reader.IsDBNull(reader.GetOrdinal("ProjectName")) ? "" : reader.GetString(reader.GetOrdinal("ProjectName")),
                                    StatusName = reader.IsDBNull(reader.GetOrdinal("StatusName")) ? "" : reader.GetString(reader.GetOrdinal("StatusName"))
                                });
                            }
                        }
                    }
                }

                // Create Excel file using EPPlus
                using (var package = new ExcelPackage())
                {
                    var worksheet = package.Workbook.Worksheets.Add("Açık İşler");

                    // Header row
                    var headers = new[] { "İş No", "İş Açıklaması", "Proje", "İş Tipi", "Durum", "Atanan", "Oluşturan", "Oluşturma Tarihi", "Sipariş Tarihi", "Termin Tarihi", "Planlanan Başlangıç", "Planlanan Bitiş" };
                    for (int col = 0; col < headers.Length; col++)
                    {
                        worksheet.Cells[1, col + 1].Value = headers[col];
                        worksheet.Cells[1, col + 1].Style.Font.Bold = true;
                        worksheet.Cells[1, col + 1].Style.Fill.PatternType = ExcelFillStyle.Solid;
                        worksheet.Cells[1, col + 1].Style.Fill.BackgroundColor.SetColor(System.Drawing.Color.LightGray);
                        worksheet.Cells[1, col + 1].Style.Border.BorderAround(ExcelBorderStyle.Thin);
                    }

                    // Data rows
                    int row = 2;
                    foreach (var issue in issues)
                    {
                        worksheet.Cells[row, 1].Value = issue.IssueId;
                        worksheet.Cells[row, 2].Value = issue.Subject;
                        worksheet.Cells[row, 3].Value = issue.ProjectName;
                        worksheet.Cells[row, 4].Value = issue.TrackerName;
                        worksheet.Cells[row, 5].Value = issue.StatusName;
                        worksheet.Cells[row, 6].Value = issue.AssignedTo;
                        worksheet.Cells[row, 7].Value = issue.CreatedBy;
                        worksheet.Cells[row, 8].Value = issue.CreatedOn.ToString("dd.MM.yyyy HH:mm");
                        worksheet.Cells[row, 9].Value = issue.OrderDate?.ToString("dd.MM.yyyy") ?? "";
                        worksheet.Cells[row, 10].Value = issue.DeadlineDate?.ToString("dd.MM.yyyy") ?? "";
                        worksheet.Cells[row, 11].Value = issue.PlannedStartDate?.ToString("dd.MM.yyyy") ?? "";
                        worksheet.Cells[row, 12].Value = issue.PlannedEndDate?.ToString("dd.MM.yyyy") ?? "";

                        // Highlight empty critical dates in red
                        if (!issue.OrderDate.HasValue)
                        {
                            worksheet.Cells[row, 9].Style.Fill.PatternType = ExcelFillStyle.Solid;
                            worksheet.Cells[row, 9].Style.Fill.BackgroundColor.SetColor(System.Drawing.Color.LightCoral);
                        }
                        if (!issue.DeadlineDate.HasValue)
                        {
                            worksheet.Cells[row, 10].Style.Fill.PatternType = ExcelFillStyle.Solid;
                            worksheet.Cells[row, 10].Style.Fill.BackgroundColor.SetColor(System.Drawing.Color.LightCoral);
                        }

                        row++;
                    }

                    // Auto-fit columns
                    worksheet.Cells[worksheet.Dimension.Address].AutoFitColumns();
                    for (int col = 1; col <= headers.Length; col++)
                    {
                        if (worksheet.Column(col).Width < 15)
                            worksheet.Column(col).Width = 15;
                    }

                    var fileName = $"Acik_Isler_Raporu_{DateTime.Now:yyyyMMdd_HHmmss}.xlsx";
                    var fileBytes = package.GetAsByteArray();

                    _logger.LogInformation("Excel export completed: {Count} issues", issues.Count);

                    return File(fileBytes, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", fileName);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error exporting open issues to Excel");
                return StatusCode(500, new ErrorResponse { Message = $"Hata: {ex.Message}" });
            }
        }
    }

    // Request/Response Models
    public class OpenIssuesRequest
    {
        public List<int>? AssignedToIds { get; set; }
        public List<int>? TrackerIds { get; set; }
        public List<int>? ProjectIds { get; set; }
        public string? CreatedAfter { get; set; }
        public string? CreatedBefore { get; set; }
        public string? SearchTerm { get; set; }
        public string? EmptyDateFilter { get; set; }
        public int Page { get; set; } = 1;
        public int PageSize { get; set; } = 20;
    }

    public class OpenIssuesResponse
    {
        public List<OpenIssueDto> Issues { get; set; } = new();
        public int TotalCount { get; set; }
        public int Page { get; set; }
        public int PageSize { get; set; }
        public int TotalPages { get; set; }
    }

    public class OpenIssueDto
    {
        public int IssueId { get; set; }
        public string Subject { get; set; } = string.Empty;
        public string TrackerName { get; set; } = string.Empty;
        public string AssignedTo { get; set; } = string.Empty;
        public string CreatedBy { get; set; } = string.Empty;
        public DateTime CreatedOn { get; set; }
        public DateTime? StartDate { get; set; }
        public DateTime? DueDate { get; set; }
        public DateTime? OrderDate { get; set; }
        public DateTime? DeadlineDate { get; set; }
        public DateTime? PlannedStartDate { get; set; }
        public DateTime? PlannedEndDate { get; set; }
        public string ProjectName { get; set; } = string.Empty;
        public string StatusName { get; set; } = string.Empty;
    }

    public class UserDto
    {
        public int Id { get; set; }
        public string FullName { get; set; } = string.Empty;
    }

    public class TrackerDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
    }

    public class ProjectDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
    }

    public class ErrorResponse
    {
        public string Message { get; set; } = string.Empty;
    }

    /// <summary>
    /// Proje analiz raporu için DTO
    /// </summary>
    public class ProjectAnalyticsDto
    {
        public string ProjectCode { get; set; } = string.Empty;
        public string ProjectName { get; set; } = string.Empty;
        public int IssueId { get; set; }

        // Tamamlanan yüzdeler
        public string TamamlananTasarim { get; set; } = "0.00";
        public string TamamlananSatinalma { get; set; } = "0.00";
        public string TamamlananUretim { get; set; } = "0.00";
        public string TamamlananMontaj { get; set; } = "0.00";
        public string TamamlananElektrik { get; set; } = "0.00";
        public string TamamlananFat { get; set; } = "0.00";
        public string TamamlananSat { get; set; } = "0.00";
        public string TamamlananSevkiyat { get; set; } = "0.00";

        // Çalışılıyor yüzdeler
        public string CalisiliyorSatinalma { get; set; } = "0.00";
        public string CalisiliyorUretim { get; set; } = "0.00";
        public string CalisiliyorMontaj { get; set; } = "0.00";
        public string CalisiliyorElektrik { get; set; } = "0.00";
        public string CalisiliyorFat { get; set; } = "0.00";
        public string CalisiliyorSat { get; set; } = "0.00";
        public string CalisiliyorSevkiyat { get; set; } = "0.00";

        // Tarih bilgileri
        public string? FatTarih { get; set; }
        public string? SevkiyatTarih { get; set; }
    }
}