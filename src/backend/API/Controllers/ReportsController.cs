using API.Models;
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
        child.tracker_id,
        -- Tasarım Sorumlusu (custom_field_id = 27)
        cv_tasarim_sorumlusu.value AS tasarim_sorumlusu_id
    FROM issues child
    JOIN issues parent ON child.parent_id = parent.id
    JOIN trackers t ON child.tracker_id = t.id
    JOIN custom_values cv ON cv.customized_id = parent.project_id and cv.custom_field_id = 3
    LEFT JOIN custom_values cv_tasarim_sorumlusu 
        ON cv_tasarim_sorumlusu.customized_id = parent.id 
        AND cv_tasarim_sorumlusu.custom_field_id = 27
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
        pi.tasarim_sorumlusu_id,
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
        pi.tasarim_sorumlusu_id,
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
        parent_id, project_code, project_name, issue_type, ara_is_id, tasarim_sorumlusu_id,
        alt_is_id AS issue_id, status_id
    FROM AltIsler
    WHERE alt_is_id IS NOT NULL

    UNION ALL

    -- Alt işi olmayan ara işler için kendi durumu
    SELECT
        parent_id, project_code, project_name, issue_type, ara_is_id, tasarim_sorumlusu_id,
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
        bd.tasarim_sorumlusu_id,
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
    GROUP BY bd.parent_id, bd.project_code, bd.project_name, bd.issue_type, bd.tasarim_sorumlusu_id
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
    
    -- Tasarım Sorumlusu bilgisi
    CASE 
        WHEN dh.tasarim_sorumlusu_id IS NOT NULL AND dh.tasarim_sorumlusu_id != '' 
        THEN ISNULL(u.firstname + ' ' + u.lastname, 'Atanmamış')
        ELSE 'Atanmamış'
    END AS tasarim_sorumlusu,

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
LEFT JOIN users u ON TRY_CAST(dh.tasarim_sorumlusu_id AS INT) = u.id
GROUP BY dh.project_code, dh.project_name, dh.parent_id, dh.tasarim_sorumlusu_id, u.firstname, u.lastname, ft.fat_tarih, st.sevkiyat_tarih
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

                                    // Tasarım Sorumlusu
                                    TasarimSorumlusu = reader.IsDBNull(reader.GetOrdinal("tasarim_sorumlusu"))
                                        ? "Atanmamış"
                                        : reader.GetString(reader.GetOrdinal("tasarim_sorumlusu")),

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

        // src/backend/API/Controllers/ReportsController.cs içine eklenecek yeni endpoint

        /// <summary>
        /// Proje bazlı anlık durum raporunu getirir
        /// </summary>
        [HttpPost("project-status")]
        public async Task<IActionResult> GetProjectStatusReport([FromBody] ProjectStatusReportRequest request)
        {
            try
            {
                _logger.LogInformation("Getting project status report");

                var connectionString = _configuration.GetConnectionString("DefaultConnection")
                    ?? throw new InvalidOperationException("Database connection string not configured");

                // Rapor tarihi belirleme
                var reportDate = string.IsNullOrEmpty(request.ReportDate)
                    ? DateTime.Today
                    : DateTime.Parse(request.ReportDate);

                // Hafta başlangıç ve bitiş tarihleri (Pazartesi-Pazar)
                var weekStart = reportDate.AddDays(-(int)reportDate.DayOfWeek + (reportDate.DayOfWeek == DayOfWeek.Sunday ? -6 : 1));
                var weekEnd = weekStart.AddDays(6);

                var projects = new List<ProjectStatusData>();

                using (var connection = new SqlConnection(connectionString))
                {
                    await connection.OpenAsync();

                    // Ana proje listesi sorgusu - Sadece Dashboard Gösterim işaretli projeler
                    // custom_field_id = 23 (Dashboard Gösterim) ve value = 1 (İşaretli)
                    var projectQuery = @"
                SELECT DISTINCT
                    i.id AS ParentIssueId,
                    p.id AS ProjectId,
                    p.name AS ProjectName,
                    cv_project_code.value AS ProjectCode
                FROM issues i
                INNER JOIN custom_values cv_dashboard ON cv_dashboard.customized_id = i.id 
                    AND cv_dashboard.custom_field_id = 23 
                    AND cv_dashboard.value = '1'
                INNER JOIN projects p ON i.project_id = p.id
                LEFT JOIN custom_values cv_project_code ON cv_project_code.customized_id = p.id 
                    AND cv_project_code.customized_type = 'Project'
                    AND cv_project_code.custom_field_id = 3
                WHERE i.id IS NOT NULL";

                    var projectParams = new List<SqlParameter>();

                    projectQuery += " ORDER BY p.id";

                    using (var projectCmd = new SqlCommand(projectQuery, connection))
                    {
                        projectCmd.Parameters.AddRange(projectParams.ToArray());

                        using (var reader = await projectCmd.ExecuteReaderAsync())
                        {
                            while (await reader.ReadAsync())
                            {
                                var parentIssueId = reader.GetInt32(reader.GetOrdinal("ParentIssueId"));
                                var projectId = reader.GetInt32(reader.GetOrdinal("ProjectId"));

                                var projectData = new ProjectStatusData
                                {
                                    ProjectId = projectId,
                                    ProjectCode = reader.IsDBNull(reader.GetOrdinal("ProjectCode")) ? "" : reader.GetString(reader.GetOrdinal("ProjectCode")),
                                    ProjectName = reader.IsDBNull(reader.GetOrdinal("ProjectName")) ? "" : reader.GetString(reader.GetOrdinal("ProjectName")),
                                    ParentIssueId = parentIssueId
                                };

                                projects.Add(projectData);
                            }
                        }
                    }

                    // Her proje için detay bilgileri çek
                    foreach (var project in projects)
                    {
                        // 1. Toplam iş sayısı ve tamamlanmış iş sayısı
                        var totalIssuesQuery = @"
                    WITH AllSubIssues AS (
                        SELECT id, status_id 
                        FROM issues 
                        WHERE parent_id = @parentIssueId
                        
                        UNION ALL
                        
                        SELECT child.id, child.status_id
                        FROM issues child
                        INNER JOIN issues parent ON child.parent_id = parent.id
                        WHERE parent.parent_id = @parentIssueId
                    )
                    SELECT 
                        COUNT(*) AS TotalIssues,
                        SUM(CASE WHEN s.is_closed = 1 THEN 1 ELSE 0 END) AS CompletedIssues
                    FROM AllSubIssues asi
                    LEFT JOIN issue_statuses s ON asi.status_id = s.id";

                        using (var cmd = new SqlCommand(totalIssuesQuery, connection))
                        {
                            cmd.Parameters.AddWithValue("@parentIssueId", project.ParentIssueId);

                            using (var reader = await cmd.ExecuteReaderAsync())
                            {
                                if (await reader.ReadAsync())
                                {
                                    project.TotalIssues = reader.GetInt32(reader.GetOrdinal("TotalIssues"));
                                    project.CompletedIssues = reader.IsDBNull(reader.GetOrdinal("CompletedIssues")) ? 0 : reader.GetInt32(reader.GetOrdinal("CompletedIssues"));
                                    project.CompletionPercentage = project.TotalIssues > 0
                                        ? Math.Round((decimal)project.CompletedIssues / project.TotalIssues * 100, 2)
                                        : 0;
                                }
                            }
                        }

                        // 2. Bugün için planlanmış işler (planned_start_date veya planned_end_date bugüne eşit)
                        var todayPlannedQuery = @"
                    WITH AllSubIssues AS (
                        SELECT id 
                        FROM issues 
                        WHERE parent_id = @parentIssueId
                        
                        UNION ALL
                        
                        SELECT child.id
                        FROM issues child
                        INNER JOIN issues parent ON child.parent_id = parent.id
                        WHERE parent.parent_id = @parentIssueId
                    )
                    SELECT COUNT(DISTINCT asi.id) AS PlannedToday
                    FROM AllSubIssues asi
                    LEFT JOIN custom_values cv_start ON cv_start.customized_id = asi.id 
                        AND cv_start.customized_type = 'Issue' 
                        AND cv_start.custom_field_id = 12
                    LEFT JOIN custom_values cv_end ON cv_end.customized_id = asi.id 
                        AND cv_end.customized_type = 'Issue' 
                        AND cv_end.custom_field_id = 4
                    WHERE (
                        CONVERT(date, cv_start.value) = @reportDate
                        OR CONVERT(date, cv_end.value) = @reportDate
                    )";

                        using (var cmd = new SqlCommand(todayPlannedQuery, connection))
                        {
                            cmd.Parameters.AddWithValue("@parentIssueId", project.ParentIssueId);
                            cmd.Parameters.AddWithValue("@reportDate", reportDate.Date);

                            var result = await cmd.ExecuteScalarAsync();
                            project.PlannedIssuesToday = result != DBNull.Value ? Convert.ToInt32(result) : 0;
                        }

                        // 3. Bu hafta için planlanmış işler
                        var weekPlannedQuery = @"
                    WITH AllSubIssues AS (
                        SELECT id 
                        FROM issues 
                        WHERE parent_id = @parentIssueId
                        
                        UNION ALL
                        
                        SELECT child.id
                        FROM issues child
                        INNER JOIN issues parent ON child.parent_id = parent.id
                        WHERE parent.parent_id = @parentIssueId
                    )
                    SELECT COUNT(DISTINCT asi.id) AS PlannedThisWeek
                    FROM AllSubIssues asi
                    LEFT JOIN custom_values cv_start ON cv_start.customized_id = asi.id 
                        AND cv_start.customized_type = 'Issue' 
                        AND cv_start.custom_field_id = 12
                    LEFT JOIN custom_values cv_end ON cv_end.customized_id = asi.id 
                        AND cv_end.customized_type = 'Issue' 
                        AND cv_end.custom_field_id = 4
                    WHERE (
                        CONVERT(date, cv_start.value) BETWEEN @weekStart AND @weekEnd
                        OR CONVERT(date, cv_end.value) BETWEEN @weekStart AND @weekEnd
                    )";

                        using (var cmd = new SqlCommand(weekPlannedQuery, connection))
                        {
                            cmd.Parameters.AddWithValue("@parentIssueId", project.ParentIssueId);
                            cmd.Parameters.AddWithValue("@weekStart", weekStart.Date);
                            cmd.Parameters.AddWithValue("@weekEnd", weekEnd.Date);

                            var result = await cmd.ExecuteScalarAsync();
                            project.PlannedIssuesThisWeek = result != DBNull.Value ? Convert.ToInt32(result) : 0;
                        }

                        // 4. Satınalma bilgileri (Tracker: Satınalma)
                        var purchaseQuery = @"
                    WITH AllSubIssues AS (
                        SELECT id, tracker_id 
                        FROM issues 
                        WHERE parent_id = @parentIssueId
                        
                        UNION ALL
                        
                        SELECT child.id, child.tracker_id
                        FROM issues child
                        INNER JOIN issues parent ON child.parent_id = parent.id
                        WHERE parent.parent_id = @parentIssueId
                    )
                    SELECT 
                        COUNT(DISTINCT asi.id) AS TotalPurchase,
                        COUNT(DISTINCT CASE 
                            WHEN cv_order.value IS NOT NULL AND cv_order.value != '' 
                            THEN asi.id 
                        END) AS WithOrderDate,
                        COUNT(DISTINCT CASE 
                            WHEN cv_deadline.value IS NOT NULL AND cv_deadline.value != '' 
                            THEN asi.id 
                        END) AS WithDeadlineDate
                    FROM AllSubIssues asi
                    INNER JOIN trackers t ON asi.tracker_id = t.id
                    LEFT JOIN custom_values cv_order ON cv_order.customized_id = asi.id 
                        AND cv_order.customized_type = 'Issue' 
                        AND cv_order.custom_field_id = 14
                    LEFT JOIN custom_values cv_deadline ON cv_deadline.customized_id = asi.id 
                        AND cv_deadline.customized_type = 'Issue' 
                        AND cv_deadline.custom_field_id = 49
                    WHERE t.name LIKE N'%Satınalma%'";

                        using (var cmd = new SqlCommand(purchaseQuery, connection))
                        {
                            cmd.Parameters.AddWithValue("@parentIssueId", project.ParentIssueId);

                            using (var reader = await cmd.ExecuteReaderAsync())
                            {
                                if (await reader.ReadAsync())
                                {
                                    project.Purchase.TotalPurchaseIssues = reader.GetInt32(reader.GetOrdinal("TotalPurchase"));
                                    project.Purchase.WithOrderDate = reader.GetInt32(reader.GetOrdinal("WithOrderDate"));
                                    project.Purchase.WithDeadlineDate = reader.GetInt32(reader.GetOrdinal("WithDeadlineDate"));
                                }
                            }
                        }

                        // 5. Üretim bilgileri (Tracker: Üretim, Montaj, Elektrik)
                        var productionQuery = @"
                    WITH AllSubIssues AS (
                        SELECT id, tracker_id 
                        FROM issues 
                        WHERE parent_id = @parentIssueId
                        
                        UNION ALL
                        
                        SELECT child.id, child.tracker_id
                        FROM issues child
                        INNER JOIN issues parent ON child.parent_id = parent.id
                        WHERE parent.parent_id = @parentIssueId
                    )
                    SELECT 
                        COUNT(DISTINCT asi.id) AS TotalProduction,
                        COUNT(DISTINCT CASE 
                            WHEN (cv_start.value IS NOT NULL AND cv_start.value != '') 
                                OR (cv_end.value IS NOT NULL AND cv_end.value != '') 
                            THEN asi.id 
                        END) AS WithPlannedDates,
                        COUNT(DISTINCT CASE 
                            WHEN (cv_rev_start.value IS NOT NULL AND cv_rev_start.value != '') 
                                OR (cv_rev_end.value IS NOT NULL AND cv_rev_end.value != '') 
                            THEN asi.id 
                        END) AS WithRevisedDates
                    FROM AllSubIssues asi
                    INNER JOIN trackers t ON asi.tracker_id = t.id
                    LEFT JOIN custom_values cv_start ON cv_start.customized_id = asi.id 
                        AND cv_start.customized_type = 'Issue' 
                        AND cv_start.custom_field_id = 12
                    LEFT JOIN custom_values cv_end ON cv_end.customized_id = asi.id 
                        AND cv_end.customized_type = 'Issue' 
                        AND cv_end.custom_field_id = 4
                    LEFT JOIN custom_values cv_rev_start ON cv_rev_start.customized_id = asi.id 
                        AND cv_rev_start.customized_type = 'Issue' 
                        AND cv_rev_start.custom_field_id = 50
                    LEFT JOIN custom_values cv_rev_end ON cv_rev_end.customized_id = asi.id 
                        AND cv_rev_end.customized_type = 'Issue' 
                        AND cv_rev_end.custom_field_id = 51
                    WHERE t.name IN (N'Üretim', N'Montaj', N'Elektrik')";

                        using (var cmd = new SqlCommand(productionQuery, connection))
                        {
                            cmd.Parameters.AddWithValue("@parentIssueId", project.ParentIssueId);

                            using (var reader = await cmd.ExecuteReaderAsync())
                            {
                                if (await reader.ReadAsync())
                                {
                                    project.Production.TotalProductionIssues = reader.GetInt32(reader.GetOrdinal("TotalProduction"));
                                    project.Production.WithPlannedDates = reader.GetInt32(reader.GetOrdinal("WithPlannedDates"));
                                    project.Production.WithRevisedDates = reader.GetInt32(reader.GetOrdinal("WithRevisedDates"));
                                }
                            }
                        }
                    }
                }

                var response = new ProjectStatusReportResponse
                {
                    ReportDate = reportDate,
                    WeekStart = weekStart,
                    WeekEnd = weekEnd,
                    Projects = projects
                };

                return Ok(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting project status report");
                return StatusCode(500, new { message = "Rapor oluşturulurken bir hata oluştu", error = ex.Message });
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
        public string TasarimSorumlusu { get; set; } = "Atanmamış";

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