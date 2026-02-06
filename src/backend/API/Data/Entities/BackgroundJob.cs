using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace API.Data.Entities
{
    /// <summary>
    /// Hangfire Job'larının yönetimi için kayıtlar
    /// </summary>
    [Table("BackgroundJobs")]
    public class BackgroundJob
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }

        /// <summary>
        /// Job adı/açıklaması
        /// </summary>
        [Required]
        [StringLength(200)]
        public string JobName { get; set; } = string.Empty;

        /// <summary>
        /// Job'un unique identifier'ı (örn: logo-invoice-approval)
        /// </summary>
        [Required]
        [StringLength(100)]
        public string JobKey { get; set; } = string.Empty;

        /// <summary>
        /// Job tipi: Recurring (Tekrarlayan), Scheduled (Zamanlanmış), FireAndForget (Bir kez)
        /// </summary>
        [Required]
        [StringLength(50)]
        public string JobType { get; set; } = "Recurring";

        /// <summary>
        /// Cron expression (Recurring joblar için)
        /// Örnek: "0 */2 * * *" (Her 2 saatte bir)
        /// </summary>
        [StringLength(100)]
        public string? CronExpression { get; set; }

        /// <summary>
        /// Job aktif mi?
        /// </summary>
        public bool IsActive { get; set; } = true;

        /// <summary>
        /// Son çalıştırma zamanı
        /// </summary>
        public DateTime? LastRunTime { get; set; }

        /// <summary>
        /// Bir sonraki çalıştırma zamanı
        /// </summary>
        public DateTime? NextRunTime { get; set; }

        /// <summary>
        /// Son çalıştırma durumu: Success, Failed, Running
        /// </summary>
        [StringLength(50)]
        public string? LastRunStatus { get; set; }

        /// <summary>
        /// Son çalıştırma sonucu mesajı
        /// </summary>
        [StringLength(1000)]
        public string? LastRunMessage { get; set; }

        /// <summary>
        /// Toplam çalıştırma sayısı
        /// </summary>
        public int TotalRunCount { get; set; } = 0;

        /// <summary>
        /// Başarılı çalıştırma sayısı
        /// </summary>
        public int SuccessCount { get; set; } = 0;

        /// <summary>
        /// Başarısız çalıştırma sayısı
        /// </summary>
        public int FailureCount { get; set; } = 0;

        /// <summary>
        /// Job açıklaması
        /// </summary>
        [StringLength(500)]
        public string? Description { get; set; }

        /// <summary>
        /// Kayıt oluşturma tarihi
        /// </summary>
        public DateTime CreatedAt { get; set; } = DateTime.Now;

        /// <summary>
        /// Son güncelleme tarihi
        /// </summary>
        public DateTime UpdatedAt { get; set; } = DateTime.Now;

        /// <summary>
        /// Oluşturan kullanıcı ID
        /// </summary>
        public int? CreatedBy { get; set; }
    }
}