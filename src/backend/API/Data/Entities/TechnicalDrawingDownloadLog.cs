// src/backend/API/Data/Entities/TechnicalDrawingDownloadLog.cs

using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace API.Data.Entities
{
    /// <summary>
    /// Teknik resim ZIP indirme logları
    /// </summary>
    [Table("TechnicalDrawingDownloadLogs")]
    public class TechnicalDrawingDownloadLog
    {
        [Key]
        public int Id { get; set; }

        /// <summary>
        /// BOM Çalışması ID
        /// </summary>
        [Required]
        public int WorkId { get; set; }

        /// <summary>
        /// Çalışma Adı (snapshot)
        /// </summary>
        [Required]
        [MaxLength(200)]
        public string WorkName { get; set; } = string.Empty;

        /// <summary>
        /// Proje ID
        /// </summary>
        public int? ProjectId { get; set; }

        /// <summary>
        /// ZIP dosya adı
        /// </summary>
        [Required]
        [MaxLength(500)]
        public string ZipFileName { get; set; } = string.Empty;

        /// <summary>
        /// ZIP dosya boyutu (bytes)
        /// </summary>
        public long ZipFileSize { get; set; }

        /// <summary>
        /// Kaç item indirildi
        /// </summary>
        public int ItemCount { get; set; }

        /// <summary>
        /// Kaç dosya ZIP'e eklendi
        /// </summary>
        public int FileCount { get; set; }

        /// <summary>
        /// Seçilen grup ID'leri (JSON array olarak)
        /// </summary>
        [MaxLength(1000)]
        public string? SelectedGroupIds { get; set; }

        /// <summary>
        /// İndiren kullanıcı
        /// </summary>
        [Required]
        [MaxLength(100)]
        public string DownloadedBy { get; set; } = string.Empty;

        /// <summary>
        /// İndirme tarihi
        /// </summary>
        public DateTime DownloadedAt { get; set; } = DateTime.Now;

        /// <summary>
        /// Kullanıcının IP adresi
        /// </summary>
        [MaxLength(50)]
        public string? IpAddress { get; set; }

        /// <summary>
        /// İşlem süresi (milisaniye)
        /// </summary>
        public int? ProcessingTimeMs { get; set; }

        // Navigation Property
        [ForeignKey("WorkId")]
        public virtual BomWork? BomWork { get; set; }
    }
}