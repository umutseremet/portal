using API.Data;
using API.Data.Entities;
using API.Models.BackgroundJobs;
using API.Services.BackgroundJobs;
using Hangfire;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

// Alias kullanarak isim çakışmasını çöz
using BackgroundJobEntity = API.Data.Entities.BackgroundJob;

namespace API.Controllers
{
    /// <summary>
    /// Arka Plan Görevleri (Hangfire Jobs) yönetimi
    /// Sadece admin kullanıcılar erişebilir
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
#if !DEBUG
    [Authorize]
#endif
    public class BackgroundJobsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<BackgroundJobsController> _logger;
        private readonly IRecurringJobManager _recurringJobManager;
        private readonly IBackgroundJobClient _backgroundJobClient;

        public BackgroundJobsController(
            ApplicationDbContext context,
            ILogger<BackgroundJobsController> logger,
            IRecurringJobManager recurringJobManager,
            IBackgroundJobClient backgroundJobClient)
        {
            _context = context;
            _logger = logger;
            _recurringJobManager = recurringJobManager;
            _backgroundJobClient = backgroundJobClient;
        }

        private int GetCurrentUserId()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return int.TryParse(userIdClaim, out var userId) ? userId : 0;
        }

        private bool IsAdmin()
        {
            // 1. Önce token'daki "admin" claim'ini kontrol et
            var adminClaim = User.FindFirst("admin")?.Value;

            if (!string.IsNullOrEmpty(adminClaim))
            {
                // "true" veya "True" ise admin
                bool isAdmin = adminClaim.Equals("true", StringComparison.OrdinalIgnoreCase);

                if (isAdmin)
                {
                    _logger.LogInformation("👑 User is ADMIN (from admin claim)");
                    return true;
                }
            }

            // 2. Alternatif: ClaimTypes.Role kontrolü (yedek)
            var roles = User.FindAll(ClaimTypes.Role).Select(c => c.Value).ToList();

            if (roles.Any())
            {
                _logger.LogInformation("User roles: {Roles}", string.Join(", ", roles));
                return roles.Contains("Admin") || roles.Contains("admin");
            }

            _logger.LogInformation("❌ User is NOT admin");
            return false;
        }

        /// <summary>
        /// Tüm job'ları listele
        /// GET: api/BackgroundJobs
        /// </summary>
        [HttpGet]
        public async Task<ActionResult<List<BackgroundJobDto>>> GetAllJobs()
        {
            try
            {
                if (!IsAdmin())
                {
                    return StatusCode(403, new { message = "Bu işlem için admin yetkisi gereklidir." });
                }

                var jobs = await _context.BackgroundJobs
                    .OrderBy(j => j.JobName)
                    .Select(j => new BackgroundJobDto
                    {
                        Id = j.Id,
                        JobName = j.JobName,
                        JobKey = j.JobKey,
                        JobType = j.JobType,
                        CronExpression = j.CronExpression,
                        IsActive = j.IsActive,
                        LastRunTime = j.LastRunTime,
                        NextRunTime = j.NextRunTime,
                        LastRunStatus = j.LastRunStatus,
                        LastRunMessage = j.LastRunMessage,
                        TotalRunCount = j.TotalRunCount,
                        SuccessCount = j.SuccessCount,
                        FailureCount = j.FailureCount,
                        Description = j.Description,
                        CreatedAt = j.CreatedAt,
                        UpdatedAt = j.UpdatedAt
                    })
                    .ToListAsync();

                return Ok(jobs);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Job listesi alınırken hata");
                return StatusCode(500, new { message = $"Hata: {ex.Message}" });
            }
        }

        /// <summary>
        /// Belirli bir job'un detaylarını getir
        /// GET: api/BackgroundJobs/{id}
        /// </summary>
        [HttpGet("{id}")]
        public async Task<ActionResult<BackgroundJobDto>> GetJob(int id)
        {
            try
            {
                if (!IsAdmin())
                {
                    return StatusCode(403, new { message = "Bu işlem için admin yetkisi gereklidir." });
                }

                var job = await _context.BackgroundJobs.FindAsync(id);

                if (job == null)
                {
                    return NotFound(new { message = "Job bulunamadı." });
                }

                var dto = new BackgroundJobDto
                {
                    Id = job.Id,
                    JobName = job.JobName,
                    JobKey = job.JobKey,
                    JobType = job.JobType,
                    CronExpression = job.CronExpression,
                    IsActive = job.IsActive,
                    LastRunTime = job.LastRunTime,
                    NextRunTime = job.NextRunTime,
                    LastRunStatus = job.LastRunStatus,
                    LastRunMessage = job.LastRunMessage,
                    TotalRunCount = job.TotalRunCount,
                    SuccessCount = job.SuccessCount,
                    FailureCount = job.FailureCount,
                    Description = job.Description,
                    CreatedAt = job.CreatedAt,
                    UpdatedAt = job.UpdatedAt
                };

                return Ok(dto);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Job detayı alınırken hata");
                return StatusCode(500, new { message = $"Hata: {ex.Message}" });
            }
        }

        /// <summary>
        /// Yeni job oluştur
        /// POST: api/BackgroundJobs
        /// </summary>
        [HttpPost]
        public async Task<ActionResult<BackgroundJobDto>> CreateJob([FromBody] CreateBackgroundJobRequest request)
        {
            try
            {
                if (!IsAdmin())
                {
                    return StatusCode(403, new { message = "Bu işlem için admin yetkisi gereklidir." });
                }

                // JobKey benzersiz olmalı
                var existing = await _context.BackgroundJobs
                    .FirstOrDefaultAsync(j => j.JobKey == request.JobKey);

                if (existing != null)
                {
                    return BadRequest(new { message = "Bu job key zaten kullanılıyor." });
                }

                var job = new BackgroundJobEntity
                {
                    JobName = request.JobName,
                    JobKey = request.JobKey,
                    JobType = request.JobType,
                    CronExpression = request.CronExpression,
                    IsActive = request.IsActive,
                    Description = request.Description,
                    CreatedBy = GetCurrentUserId(),
                    CreatedAt = DateTime.Now,
                    UpdatedAt = DateTime.Now
                };

                _context.BackgroundJobs.Add(job);
                await _context.SaveChangesAsync();

                // Eğer Recurring job ise Hangfire'a ekle
                if (job.JobType == "Recurring" && job.IsActive && !string.IsNullOrEmpty(job.CronExpression))
                {
                    RegisterJobInHangfire(job);
                }

                var dto = new BackgroundJobDto
                {
                    Id = job.Id,
                    JobName = job.JobName,
                    JobKey = job.JobKey,
                    JobType = job.JobType,
                    CronExpression = job.CronExpression,
                    IsActive = job.IsActive,
                    LastRunTime = job.LastRunTime,
                    NextRunTime = job.NextRunTime,
                    LastRunStatus = job.LastRunStatus,
                    LastRunMessage = job.LastRunMessage,
                    TotalRunCount = job.TotalRunCount,
                    SuccessCount = job.SuccessCount,
                    FailureCount = job.FailureCount,
                    Description = job.Description,
                    CreatedAt = job.CreatedAt,
                    UpdatedAt = job.UpdatedAt
                };

                return CreatedAtAction(nameof(GetJob), new { id = job.Id }, dto);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Job oluşturulurken hata");
                return StatusCode(500, new { message = $"Hata: {ex.Message}" });
            }
        }

        /// <summary>
        /// Job'u güncelle
        /// PUT: api/BackgroundJobs/{id}
        /// </summary>
        [HttpPut("{id}")]
        public async Task<ActionResult> UpdateJob(int id, [FromBody] UpdateBackgroundJobRequest request)
        {
            try
            {
                if (!IsAdmin())
                {
                    return StatusCode(403, new { message = "Bu işlem için admin yetkisi gereklidir." });
                }

                var job = await _context.BackgroundJobs.FindAsync(id);

                if (job == null)
                {
                    return NotFound(new { message = "Job bulunamadı." });
                }

                // Önceki durum
                var wasActive = job.IsActive;

                // Güncelle
                job.JobName = request.JobName;
                job.CronExpression = request.CronExpression;
                job.IsActive = request.IsActive;
                job.Description = request.Description;
                job.UpdatedAt = DateTime.Now;

                await _context.SaveChangesAsync();

                // Hangfire job'u güncelle
                if (job.JobType == "Recurring")
                {
                    if (job.IsActive && !string.IsNullOrEmpty(job.CronExpression))
                    {
                        RegisterJobInHangfire(job);
                    }
                    else if (wasActive && !job.IsActive)
                    {
                        // Job devre dışı bırakıldı, Hangfire'dan kaldır
                        _recurringJobManager.RemoveIfExists(job.JobKey);
                    }
                }

                return Ok(new { message = "Job başarıyla güncellendi." });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Job güncellenirken hata");
                return StatusCode(500, new { message = $"Hata: {ex.Message}" });
            }
        }

        /// <summary>
        /// Job'u sil
        /// DELETE: api/BackgroundJobs/{id}
        /// </summary>
        [HttpDelete("{id}")]
        public async Task<ActionResult> DeleteJob(int id)
        {
            try
            {
                if (!IsAdmin())
                {
                    return StatusCode(403, new { message = "Bu işlem için admin yetkisi gereklidir." });
                }

                var job = await _context.BackgroundJobs.FindAsync(id);

                if (job == null)
                {
                    return NotFound(new { message = "Job bulunamadı." });
                }

                // Hangfire'dan kaldır
                if (job.JobType == "Recurring")
                {
                    _recurringJobManager.RemoveIfExists(job.JobKey);
                }

                _context.BackgroundJobs.Remove(job);
                await _context.SaveChangesAsync();

                return Ok(new { message = "Job başarıyla silindi." });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Job silinirken hata");
                return StatusCode(500, new { message = $"Hata: {ex.Message}" });
            }
        }

        /// <summary>
        /// Job'u manuel olarak çalıştır
        /// POST: api/BackgroundJobs/{id}/run
        /// </summary>
        [HttpPost("{id}/run")]
        public async Task<ActionResult> RunJob(int id)
        {
            try
            {
                if (!IsAdmin())
                {
                    return StatusCode(403, new { message = "Bu işlem için admin yetkisi gereklidir." });
                }

                var job = await _context.BackgroundJobs.FindAsync(id);

                if (job == null)
                {
                    return NotFound(new { message = "Job bulunamadı." });
                }

                // Job'u çalıştır
                var jobId = TriggerJobManually(job.JobKey);

                _logger.LogInformation("Job manuel olarak çalıştırıldı: {JobKey}, HangfireJobId: {JobId}", job.JobKey, jobId);

                return Ok(new { message = "Job çalıştırıldı.", hangfireJobId = jobId });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Job çalıştırılırken hata");
                return StatusCode(500, new { message = $"Hata: {ex.Message}" });
            }
        }

        /// <summary>
        /// Job'u aktif/pasif yap
        /// POST: api/BackgroundJobs/{id}/toggle
        /// </summary>
        [HttpPost("{id}/toggle")]
        public async Task<ActionResult> ToggleJob(int id)
        {
            try
            {
                if (!IsAdmin())
                {
                    return StatusCode(403, new { message = "Bu işlem için admin yetkisi gereklidir." });
                }

                var job = await _context.BackgroundJobs.FindAsync(id);

                if (job == null)
                {
                    return NotFound(new { message = "Job bulunamadı." });
                }

                job.IsActive = !job.IsActive;
                job.UpdatedAt = DateTime.Now;

                await _context.SaveChangesAsync();

                // Hangfire'da güncelle
                if (job.JobType == "Recurring")
                {
                    if (job.IsActive && !string.IsNullOrEmpty(job.CronExpression))
                    {
                        RegisterJobInHangfire(job);
                    }
                    else
                    {
                        _recurringJobManager.RemoveIfExists(job.JobKey);
                    }
                }

                return Ok(new
                {
                    message = job.IsActive ? "Job aktif edildi." : "Job pasif edildi.",
                    isActive = job.IsActive
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Job toggle edilirken hata");
                return StatusCode(500, new { message = $"Hata: {ex.Message}" });
            }
        }

        /// <summary>
        /// Job'u Hangfire'a kaydet
        /// </summary>
        private void RegisterJobInHangfire(BackgroundJobEntity job)
        {
            if (string.IsNullOrEmpty(job.CronExpression))
                return;

            switch (job.JobKey)
            {
                case "logo-invoice-auto-approval":
                    _recurringJobManager.AddOrUpdate<LogoInvoiceAutoApprovalJob>(
                        job.JobKey,
                        x => x.ExecuteAsync(),
                        job.CronExpression,
                        TimeZoneInfo.Local);
                    break;

                // Diğer job'lar buraya eklenebilir
                default:
                    _logger.LogWarning("Bilinmeyen job key: {JobKey}", job.JobKey);
                    break;
            }
        }

        /// <summary>
        /// Job'u manuel olarak tetikle
        /// </summary>
        private string TriggerJobManually(string jobKey)
        {
            return jobKey switch
            {
                "logo-invoice-auto-approval" => _backgroundJobClient.Enqueue<LogoInvoiceAutoApprovalJob>(x => x.ExecuteAsync()),
                _ => throw new ArgumentException($"Bilinmeyen job key: {jobKey}")
            };
        }
     

    /// <summary>
/// Belirli bir job'un çalışma geçmişini getir
/// GET: api/BackgroundJobs/{id}/execution-logs
/// </summary>
[HttpGet("{id}/execution-logs")]
        public async Task<ActionResult<List<BackgroundJobExecutionLogDto>>> GetJobExecutionLogs(
    int id,
    [FromQuery] int page = 1,
    [FromQuery] int pageSize = 20)
        {
            try
            {
                if (!IsAdmin())
                {
                    return StatusCode(403, new { message = "Bu işlem için admin yetkisi gereklidir." });
                }

                var job = await _context.BackgroundJobs.FindAsync(id);
                if (job == null)
                {
                    return NotFound(new { message = "Job bulunamadı." });
                }

                var totalCount = await _context.BackgroundJobExecutionLogs
                    .Where(l => l.BackgroundJobId == id)
                    .CountAsync();

                var logs = await _context.BackgroundJobExecutionLogs
                    .Where(l => l.BackgroundJobId == id)
                    .OrderByDescending(l => l.StartTime)
                    .Skip((page - 1) * pageSize)
                    .Take(pageSize)
                    .Select(l => new BackgroundJobExecutionLogDto
                    {
                        Id = l.Id,
                        BackgroundJobId = l.BackgroundJobId,
                        JobKey = l.JobKey,
                        JobName = l.JobName,
                        StartTime = l.StartTime,
                        EndTime = l.EndTime,
                        DurationSeconds = l.DurationSeconds,
                        Status = l.Status,
                        Message = l.Message,
                        ProcessedCount = l.ProcessedCount,
                        SuccessCount = l.SuccessCount,
                        FailureCount = l.FailureCount,
                        SkippedCount = l.SkippedCount,
                        IsManualExecution = l.IsManualExecution,
                        ExecutedBy = l.ExecutedBy,
                        CreatedAt = l.CreatedAt
                    })
                    .ToListAsync();

                return Ok(new
                {
                    logs,
                    totalCount,
                    page,
                    pageSize,
                    totalPages = (int)Math.Ceiling(totalCount / (double)pageSize)
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Job execution logs alınırken hata");
                return StatusCode(500, new { message = $"Hata: {ex.Message}" });
            }
        }

        /// <summary>
        /// Belirli bir execution log'un detayını getir
        /// GET: api/BackgroundJobs/execution-logs/{logId}
        /// </summary>
        [HttpGet("execution-logs/{logId}")]
        public async Task<ActionResult<BackgroundJobExecutionLogDetailDto>> GetExecutionLogDetail(int logId)
        {
            try
            {
                if (!IsAdmin())
                {
                    return StatusCode(403, new { message = "Bu işlem için admin yetkisi gereklidir." });
                }

                var log = await _context.BackgroundJobExecutionLogs
                    .Include(l => l.BackgroundJob)
                    .FirstOrDefaultAsync(l => l.Id == logId);

                if (log == null)
                {
                    return NotFound(new { message = "Log kaydı bulunamadı." });
                }

                var dto = new BackgroundJobExecutionLogDetailDto
                {
                    Id = log.Id,
                    BackgroundJobId = log.BackgroundJobId,
                    JobKey = log.JobKey,
                    JobName = log.JobName,
                    StartTime = log.StartTime,
                    EndTime = log.EndTime,
                    DurationSeconds = log.DurationSeconds,
                    Status = log.Status,
                    Message = log.Message,
                    DetailedLog = log.DetailedLog,
                    ErrorMessage = log.ErrorMessage,
                    StackTrace = log.StackTrace,
                    ProcessedCount = log.ProcessedCount,
                    SuccessCount = log.SuccessCount,
                    FailureCount = log.FailureCount,
                    SkippedCount = log.SkippedCount,
                    AdditionalData = log.AdditionalData,
                    HangfireJobId = log.HangfireJobId,
                    IsManualExecution = log.IsManualExecution,
                    ExecutedBy = log.ExecutedBy,
                    CreatedAt = log.CreatedAt
                };

                return Ok(dto);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Execution log detayı alınırken hata");
                return StatusCode(500, new { message = $"Hata: {ex.Message}" });
            }
        }

        /// <summary>
        /// Tüm job'ların son çalışma loglarını getir (dashboard için)
        /// GET: api/BackgroundJobs/recent-executions
        /// </summary>
        [HttpGet("recent-executions")]
        public async Task<ActionResult<List<BackgroundJobExecutionLogDto>>> GetRecentExecutions([FromQuery] int count = 10)
        {
            try
            {
                if (!IsAdmin())
                {
                    return StatusCode(403, new { message = "Bu işlem için admin yetkisi gereklidir." });
                }

                var logs = await _context.BackgroundJobExecutionLogs
                    .OrderByDescending(l => l.StartTime)
                    .Take(count)
                    .Select(l => new BackgroundJobExecutionLogDto
                    {
                        Id = l.Id,
                        BackgroundJobId = l.BackgroundJobId,
                        JobKey = l.JobKey,
                        JobName = l.JobName,
                        StartTime = l.StartTime,
                        EndTime = l.EndTime,
                        DurationSeconds = l.DurationSeconds,
                        Status = l.Status,
                        Message = l.Message,
                        ProcessedCount = l.ProcessedCount,
                        SuccessCount = l.SuccessCount,
                        FailureCount = l.FailureCount,
                        SkippedCount = l.SkippedCount,
                        IsManualExecution = l.IsManualExecution,
                        ExecutedBy = l.ExecutedBy,
                        CreatedAt = l.CreatedAt
                    })
                    .ToListAsync();

                return Ok(logs);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Son çalışmalar alınırken hata");
                return StatusCode(500, new { message = $"Hata: {ex.Message}" });
            }
        }
    }
}