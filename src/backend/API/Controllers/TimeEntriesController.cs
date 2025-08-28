using Microsoft.AspNetCore.Mvc;

[ApiController]
[Route("api/[controller]")]
public class TimeEntriesController : ControllerBase
{
    private readonly RedmineService _redmineService;
    private readonly ILogger<TimeEntriesController> _logger;

    public TimeEntriesController(RedmineService redmineService, ILogger<TimeEntriesController> logger)
    {
        _redmineService = redmineService;
        _logger = logger;
    }

    [HttpPost("list")]
    public async Task<IActionResult> GetTimeEntries([FromBody] TimeEntriesRequest request)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(new ErrorResponse { Message = "Geçersiz istek parametreleri" });
            }

            _logger.LogInformation("Time entries request for user: {Username}", request.Username);

            var result = await _redmineService.GetTimeEntriesAsync(
                request.Username,
                request.Password,
                request.UserId,
                request.ProjectId,
                request.From,
                request.To,
                request.Limit,
                request.Offset
            );

            if (result == null)
            {
                _logger.LogWarning("Time entries request failed for user: {Username}", request.Username);
                return Unauthorized(new ErrorResponse { Message = "Zaman kayıtları alınamadı" });
            }

            _logger.LogInformation("Time entries retrieved successfully for user: {Username}", request.Username);

            return Ok(new TimeEntriesResponse
            {
                TimeEntries = result.TimeEntries,
                TotalCount = result.TimeEntries?.Count ?? 0, // Düzeltildi
                Offset = request.Offset,
                Limit = request.Limit,
                HasMore = false // Basit implementation
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Time entries error for user: {Username}", request.Username);
            return StatusCode(500, new ErrorResponse { Message = "Sunucu hatası oluştu" });
        }
    }

    [HttpPost("recent")]
    public async Task<IActionResult> GetRecentActivities([FromBody] RecentActivitiesRequest request)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(new ErrorResponse { Message = "Geçersiz istek parametreleri" });
            }

            _logger.LogInformation("Recent activities request for user: {Username}", request.Username);

            var result = await _redmineService.GetRecentActivitiesAsync(
                request.Username,
                request.Password,
                request.UserId,
                request.Days,
                request.Limit
            );

            if (result == null)
            {
                _logger.LogWarning("Recent activities request failed for user: {Username}", request.Username);
                return Unauthorized(new ErrorResponse { Message = "Son faaliyetler alınamadı" });
            }

            _logger.LogInformation("Recent activities retrieved successfully for user: {Username}", request.Username);

            return Ok(new RecentActivitiesResponse
            {
                Activities = result.TimeEntries,
                TotalCount = result.TimeEntries?.Count ?? 0, // Düzeltildi
                UserId = request.UserId,
                DaysRange = request.Days,
                FromDate = DateTime.Now.AddDays(-request.Days).ToString("yyyy-MM-dd")
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Recent activities error for user: {Username}", request.Username);
            return StatusCode(500, new ErrorResponse { Message = "Sunucu hatası oluştu" });
        }
    }

    [HttpPost("project")]
    public async Task<IActionResult> GetProjectTimeEntries([FromBody] ProjectTimeEntriesRequest request)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(new ErrorResponse { Message = "Geçersiz istek parametreleri" });
            }

            _logger.LogInformation("Project time entries request for user: {Username}, project: {ProjectId}", 
                request.Username, request.ProjectId);

            var result = await _redmineService.GetProjectTimeEntriesAsync(
                request.Username,
                request.Password,
                request.ProjectId,
                request.Days,
                request.Limit
            );

            if (result == null)
            {
                _logger.LogWarning("Project time entries request failed for user: {Username}", request.Username);
                return Unauthorized(new ErrorResponse { Message = "Proje zaman kayıtları alınamadı" });
            }

            _logger.LogInformation("Project time entries retrieved successfully for user: {Username}", request.Username);

            return Ok(new ProjectTimeEntriesResponse
            {
                TimeEntries = result.TimeEntries,
                TotalCount = result.TimeEntries?.Count ?? 0, // Düzeltildi  
                ProjectId = request.ProjectId,
                DaysRange = request.Days,
                FromDate = DateTime.Now.AddDays(-request.Days).ToString("yyyy-MM-dd")
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Project time entries error for user: {Username}", request.Username);
            return StatusCode(500, new ErrorResponse { Message = "Sunucu hatası oluştu" });
        }
    }
}