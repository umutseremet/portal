// src/backend/API/Models/ProjectStatusReportModels.cs
using System.ComponentModel.DataAnnotations;

namespace API.Models
{
    /// <summary>
    /// Proje durum raporu isteği
    /// </summary>
    public class ProjectStatusReportRequest
    {
        /// <summary>
        /// Rapor tarihi (opsiyonel, default: bugün)
        /// </summary>
        [DataType(DataType.Date)]
        public string? ReportDate { get; set; }
    }

    /// <summary>
    /// Proje durum raporu yanıtı
    /// </summary>
    public class ProjectStatusReportResponse
    {
        public DateTime ReportDate { get; set; }
        public DateTime WeekStart { get; set; }
        public DateTime WeekEnd { get; set; }
        public List<ProjectStatusData> Projects { get; set; } = new();
    }

    /// <summary>
    /// Proje bazlı durum verisi
    /// </summary>
    public class ProjectStatusData
    {
        public int ProjectId { get; set; }
        public string ProjectCode { get; set; } = string.Empty;
        public string ProjectName { get; set; } = string.Empty;
        public int ParentIssueId { get; set; }

        // Tamamlanma bilgisi
        public int TotalIssues { get; set; }
        public int CompletedIssues { get; set; }
        public decimal CompletionPercentage { get; set; }

        // Bugünkü planlanmış işler
        public int PlannedIssuesToday { get; set; }

        // Bu haftanın planlanmış işleri
        public int PlannedIssuesThisWeek { get; set; }

        // Satınalma bilgileri
        public PurchaseStatusData Purchase { get; set; } = new();

        // Üretim bilgileri (Üretim, Montaj, Elektrik)
        public ProductionStatusData Production { get; set; } = new();
    }

    /// <summary>
    /// Satınalma durum bilgileri
    /// </summary>
    public class PurchaseStatusData
    {
        public int TotalPurchaseIssues { get; set; }
        public int WithOrderDate { get; set; }
        public int WithDeadlineDate { get; set; }
    }

    /// <summary>
    /// Üretim durum bilgileri
    /// </summary>
    public class ProductionStatusData
    {
        public int TotalProductionIssues { get; set; }
        public int WithPlannedDates { get; set; }
        public int WithRevisedDates { get; set; }
    }
}