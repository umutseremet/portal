using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace API.Data.Entities
{
    /// <summary>
    /// Her job çalıştırmasının detaylı log kaydı
    /// </summary>
    [Table("BackgroundJobExecutionLogs")]
    public class BackgroundJobExecutionLog
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }

        /// <summary>
        /// İlişkili job ID
        /// </summary>
        [Required]
        public int BackgroundJobId { get; set; }

        /// <summary>
        /// Job key (hızlı arama için)
        /// </summary>
        [Required]
        [StringLength(100)]
        public string JobKey { get; set; } = string.Empty;

        /// <summary>
        /// Job adı (hızlı arama için)
        /// </summary>
        [Required]
        [StringLength(200)]
        public string JobName { get; set; } = string.Empty;

        /// <summary>
        /// Başlangıç zamanı
        /// </summary>
        [Required]
        public DateTime StartTime { get; set; }

        /// <summary>
        /// Bitiş zamanı
        /// </summary>
        public DateTime? EndTime { get; set; }

        /// <summary>
        /// Çalışma süresi (saniye)
        /// </summary>
        public double? DurationSeconds { get; set; }

        /// <summary>
        /// Çalıştırma durumu: Success, Failed, PartialSuccess, Running
        /// </summary>
        [Required]
        [StringLength(50)]
        public string Status { get; set; } = "Running";

        /// <summary>
        /// Özet mesajı
        /// </summary>
        [StringLength(1000)]
        public string? Message { get; set; }

        /// <summary>
        /// Detaylı log mesajı
        /// </summary>
        public string? DetailedLog { get; set; }

        /// <summary>
        /// Hata mesajı (varsa)
        /// </summary>
        public string? ErrorMessage { get; set; }

        /// <summary>
        /// Stack trace (hata durumunda)
        /// </summary>
        public string? StackTrace { get; set; }

        /// <summary>
        /// İşlenen kayıt sayısı
        /// </summary>
        public int? ProcessedCount { get; set; }

        /// <summary>
        /// Başarılı kayıt sayısı
        /// </summary>
        public int? SuccessCount { get; set; }

        /// <summary>
        /// Başarısız kayıt sayısı
        /// </summary>
        public int? FailureCount { get; set; }

        /// <summary>
        /// Atlanan kayıt sayısı
        /// </summary>
        public int? SkippedCount { get; set; }

        /// <summary>
        /// Ek veri (JSON formatında)
        /// </summary>
        public string? AdditionalData { get; set; }

        /// <summary>
        /// Hangfire job ID (Hangfire'dan gelen)
        /// </summary>
        [StringLength(100)]
        public string? HangfireJobId { get; set; }

        /// <summary>
        /// Manuel mi otomatik mi çalıştırıldı
        /// </summary>
        public bool IsManualExecution { get; set; } = false;

        /// <summary>
        /// Manuel çalıştıran kullanıcı ID (varsa)
        /// </summary>
        public int? ExecutedBy { get; set; }

        /// <summary>
        /// Kayıt oluşturma tarihi
        /// </summary>
        public DateTime CreatedAt { get; set; } = DateTime.Now;

        // Navigation property
        [ForeignKey("BackgroundJobId")]
        public virtual BackgroundJob? BackgroundJob { get; set; }
    }
}