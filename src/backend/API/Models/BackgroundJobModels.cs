namespace API.Models.BackgroundJobs
{
    /// <summary>
    /// Background Job DTO
    /// </summary>
    public class BackgroundJobDto
    {
        public int Id { get; set; }
        public string JobName { get; set; } = string.Empty;
        public string JobKey { get; set; } = string.Empty;
        public string JobType { get; set; } = string.Empty;
        public string? CronExpression { get; set; }
        public bool IsActive { get; set; }
        public DateTime? LastRunTime { get; set; }
        public DateTime? NextRunTime { get; set; }
        public string? LastRunStatus { get; set; }
        public string? LastRunMessage { get; set; }
        public int TotalRunCount { get; set; }
        public int SuccessCount { get; set; }
        public int FailureCount { get; set; }
        public string? Description { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }

    /// <summary>
    /// Yeni job oluşturma request
    /// </summary>
    public class CreateBackgroundJobRequest
    {
        public string JobName { get; set; } = string.Empty;
        public string JobKey { get; set; } = string.Empty;
        public string JobType { get; set; } = "Recurring";
        public string? CronExpression { get; set; }
        public bool IsActive { get; set; } = true;
        public string? Description { get; set; }
    }

    /// <summary>
    /// Job güncelleme request
    /// </summary>
    public class UpdateBackgroundJobRequest
    {
        public string JobName { get; set; } = string.Empty;
        public string? CronExpression { get; set; }
        public bool IsActive { get; set; }
        public string? Description { get; set; }
    }

    /// <summary>
    /// Cron expression önerileri
    /// </summary>
    public class CronExpressionSuggestion
    {
        public string Expression { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
    }

    /// <summary>
    /// Yaygın kullanılan cron expression'lar
    /// </summary>
    public static class CommonCronExpressions
    {
        public static readonly List<CronExpressionSuggestion> Suggestions = new()
        {
            new() { Expression = "0 */1 * * *", Description = "Her saat başı" },
            new() { Expression = "0 */2 * * *", Description = "Her 2 saatte bir" },
            new() { Expression = "0 */3 * * *", Description = "Her 3 saatte bir" },
            new() { Expression = "0 */6 * * *", Description = "Her 6 saatte bir" },
            new() { Expression = "0 */12 * * *", Description = "Her 12 saatte bir" },
            new() { Expression = "0 0 * * *", Description = "Her gün gece yarısı" },
            new() { Expression = "0 8 * * *", Description = "Her gün saat 08:00" },
            new() { Expression = "0 12 * * *", Description = "Her gün öğlen 12:00" },
            new() { Expression = "0 18 * * *", Description = "Her gün akşam 18:00" },
            new() { Expression = "0 0 * * 1", Description = "Her Pazartesi gece yarısı" },
            new() { Expression = "0 0 1 * *", Description = "Her ayın 1'i" },
            new() { Expression = "*/5 * * * *", Description = "Her 5 dakikada bir" },
            new() { Expression = "*/15 * * * *", Description = "Her 15 dakikada bir" },
            new() { Expression = "*/30 * * * *", Description = "Her 30 dakikada bir" }
        };
    }

    /// <summary>
    /// Job execution log DTO (liste için)
    /// </summary>
    public class BackgroundJobExecutionLogDto
    {
        public int Id { get; set; }
        public int BackgroundJobId { get; set; }
        public string JobKey { get; set; } = string.Empty;
        public string JobName { get; set; } = string.Empty;
        public DateTime StartTime { get; set; }
        public DateTime? EndTime { get; set; }
        public double? DurationSeconds { get; set; }
        public string Status { get; set; } = string.Empty;
        public string? Message { get; set; }
        public int? ProcessedCount { get; set; }
        public int? SuccessCount { get; set; }
        public int? FailureCount { get; set; }
        public int? SkippedCount { get; set; }
        public bool IsManualExecution { get; set; }
        public int? ExecutedBy { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    /// <summary>
    /// Job execution log detay DTO
    /// </summary>
    public class BackgroundJobExecutionLogDetailDto
    {
        public int Id { get; set; }
        public int BackgroundJobId { get; set; }
        public string JobKey { get; set; } = string.Empty;
        public string JobName { get; set; } = string.Empty;
        public DateTime StartTime { get; set; }
        public DateTime? EndTime { get; set; }
        public double? DurationSeconds { get; set; }
        public string Status { get; set; } = string.Empty;
        public string? Message { get; set; }
        public string? DetailedLog { get; set; }
        public string? ErrorMessage { get; set; }
        public string? StackTrace { get; set; }
        public int? ProcessedCount { get; set; }
        public int? SuccessCount { get; set; }
        public int? FailureCount { get; set; }
        public int? SkippedCount { get; set; }
        public string? AdditionalData { get; set; }
        public string? HangfireJobId { get; set; }
        public bool IsManualExecution { get; set; }
        public int? ExecutedBy { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}