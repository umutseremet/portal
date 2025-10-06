using System.ComponentModel.DataAnnotations;

namespace API.Models
{
    // Request Models
    public class GetWeeklyProductionCalendarRequest
    {
        /// <summary>
        /// Ana iş ID'si - Tüm alt işler bu ID altında toplanacak
        /// </summary>
        public int? ParentIssueId { get; set; }

        /// <summary>
        /// Hafta başlangıç tarihi (yyyy-MM-dd formatında). Boş bırakılırsa bugünün haftası kullanılır.
        /// </summary>
        [DataType(DataType.Date)]
        public string? StartDate { get; set; }

        /// <summary>
        /// Proje ID'si - Belirli bir projeye göre filtreleme yapmak için (opsiyonel)
        /// </summary>
        public int? ProjectId { get; set; }
    }

    // Response Models
    public class WeeklyProductionCalendarResponse
    {
        public DateTime WeekStart { get; set; }
        public DateTime WeekEnd { get; set; }
        public List<ProductionDayData> Days { get; set; } = new();
    }

    public class ProductionDayData
    {
        public DateTime Date { get; set; }
        public int DayOfWeek { get; set; }
        public string DayName { get; set; } = string.Empty;
        public List<ProductionIssueData> ProductionIssues { get; set; } = new();
    }

    public class ProductionIssueData
    {
        public int IssueId { get; set; }
        public int ProjectId { get; set; }
        public string ProjectName { get; set; } = string.Empty;
        public string Subject { get; set; } = string.Empty;
        public string TrackerName { get; set; } = string.Empty;
        public int CompletionPercentage { get; set; }
        public decimal? EstimatedHours { get; set; }
        public string StatusName { get; set; } = string.Empty;
        public bool IsClosed { get; set; }
        public string PriorityName { get; set; } = string.Empty;
        public string AssignedTo { get; set; } = string.Empty;
        public DateTime? PlannedStartDate { get; set; }
        public DateTime? PlannedEndDate { get; set; }

        // Computed Properties
        public bool IsCompleted => CompletionPercentage >= 100 || IsClosed;
        public string StatusText => IsCompleted ? "Tamamlandı" : "Devam Ediyor";

        /// <summary>
        /// Üretim tipi (Lazer, Abkant, Kaynak vb.) - TrackerName'den çıkarılır
        /// </summary>
        public string ProductionType => TrackerName.Replace("Üretim - ", "").Trim();
    }
}