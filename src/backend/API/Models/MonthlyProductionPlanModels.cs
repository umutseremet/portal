// ============================================================
// src/backend/API/Models/MonthlyProductionPlanModels.cs
// YENİ DOSYA - Aylık Üretim Planı V2 modelleri
// ============================================================

using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace API.Models
{
    // ─── DATABASE ENTITIES ────────────────────────────────────────────────────

    /// <summary>
    /// Aylık üretim planı girişi - bir güne ait proje/tip kombinasyonu
    /// </summary>
    public class MonthlyProductionPlanEntry
    {
        public int Id { get; set; }

        [Required]
        public DateTime PlanDate { get; set; }

        [Required]
        public int ProjectId { get; set; }

        [Required]
        [MaxLength(50)]
        public string ProjectCode { get; set; } = string.Empty;

        [Required]
        [MaxLength(255)]
        public string ProjectName { get; set; } = string.Empty;

        /// <summary>
        /// "Üretim" veya "Montaj"
        /// </summary>
        [Required]
        [MaxLength(20)]
        public string PlanType { get; set; } = string.Empty;

        /// <summary>
        /// HEX renk kodu (ör: #3b82f6)
        /// </summary>
        [MaxLength(10)]
        public string Color { get; set; } = "#3b82f6";

        [MaxLength(100)]
        public string? CreatedBy { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.Now;
        public DateTime? UpdatedAt { get; set; }

        // Navigation
        public List<MonthlyProductionPlanIssue> PlanIssues { get; set; } = new();
    }

    /// <summary>
    /// Plan girişine bağlı Redmine issue listesi
    /// </summary>
    public class MonthlyProductionPlanIssue
    {
        public int Id { get; set; }

        [Required]
        public int PlanEntryId { get; set; }

        [Required]
        public int RedmineIssueId { get; set; }

        // Navigation
        [ForeignKey("PlanEntryId")]
        public MonthlyProductionPlanEntry? PlanEntry { get; set; }
    }

    // ─── REQUEST MODELS ───────────────────────────────────────────────────────

    /// <summary>
    /// Belirli ay için plan verisi çekme
    /// </summary>
    public class GetMonthlyPlanRequest
    {
        [Required]
        public int Year { get; set; }

        [Required]
        [Range(1, 12)]
        public int Month { get; set; }
    }

    /// <summary>
    /// Plan kaydetme/güncelleme
    /// </summary>
    public class SaveMonthlyPlanEntryRequest
    {
        /// <summary>
        /// Null ise yeni kayıt, değer varsa güncelleme
        /// </summary>
        public int? Id { get; set; }

        [Required]
        [DataType(DataType.Date)]
        public string PlanDate { get; set; } = string.Empty;

        [Required]
        public int ProjectId { get; set; }

        [Required]
        public string ProjectCode { get; set; } = string.Empty;

        [Required]
        public string ProjectName { get; set; } = string.Empty;

        /// <summary>
        /// "Üretim" veya "Montaj"
        /// </summary>
        [Required]
        public string PlanType { get; set; } = string.Empty;

        public string Color { get; set; } = "#3b82f6";

        /// <summary>
        /// Plana eklenecek/güncellenecek Redmine issue ID listesi
        /// </summary>
        [Required]
        public List<int> IssueIds { get; set; } = new();
    }

    /// <summary>
    /// Plan silme
    /// </summary>
    public class DeleteMonthlyPlanEntryRequest
    {
        [Required]
        public int Id { get; set; }
    }

    /// <summary>
    /// Proje bazlı issue listesi çekme (plan ekleme modalı için)
    /// </summary>
    public class GetProjectIssuesForPlanningRequest
    {
        [Required]
        public int ProjectId { get; set; }

        /// <summary>
        /// "Üretim" veya "Montaj"
        /// </summary>
        [Required]
        public string PlanType { get; set; } = string.Empty;
    }

    // ─── RESPONSE MODELS ──────────────────────────────────────────────────────

    public class MonthlyPlanResponse
    {
        public int Year { get; set; }
        public int Month { get; set; }
        public List<MonthlyPlanEntryResponse> Entries { get; set; } = new();
    }

    public class MonthlyPlanEntryResponse
    {
        public int Id { get; set; }
        public string PlanDate { get; set; } = string.Empty;
        public int ProjectId { get; set; }
        public string ProjectCode { get; set; } = string.Empty;
        public string ProjectName { get; set; } = string.Empty;
        public string PlanType { get; set; } = string.Empty;
        public string Color { get; set; } = string.Empty;
        public List<int> IssueIds { get; set; } = new();
    }

    /// <summary>
    /// Planlama modalında gösterilecek Redmine issue özeti
    /// </summary>
    public class PlanningIssueItem
    {
        public int IssueId { get; set; }
        public string Subject { get; set; } = string.Empty;
        public string TrackerName { get; set; } = string.Empty;
        public string StatusName { get; set; } = string.Empty;
        public string? PlannedStartDate { get; set; }
        public string? PlannedEndDate { get; set; }
        public string? RevisedStartDate { get; set; }
        public string? RevisedEndDate { get; set; }
    }

    /// <summary>
    /// Planlama için proje listesi item'ı (proje kodu dahil)
    /// </summary>
    public class PlanningProjectItem
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string ProjectCode { get; set; } = string.Empty;
        public string Identifier { get; set; } = string.Empty;
    }
}