// src/backend/API/Models/RedmineWeeklyCalendarModels.cs
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

        /// <summary>
        /// Üretim tipi - Belirli bir üretim tipine göre filtreleme yapmak için (opsiyonel)
        /// Örnek: "Lazer", "Abkant", "Kaynak" vb.
        /// </summary>
        public string? ProductionType { get; set; }
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
        public List<GroupedProductionData> GroupedProductions { get; set; } = new();
    }

    /// <summary>
    /// Proje ve iş tipine göre gruplanmış üretim verisi
    /// </summary>
    public class GroupedProductionData
    {
        public int ProjectId { get; set; }
        public string ProjectCode { get; set; } = string.Empty;
        public string ProjectName { get; set; } = string.Empty;
        public string ProductionType { get; set; } = string.Empty;
        public int IssueCount { get; set; }
    }

    public class ProductionIssueData
    {
        public int IssueId { get; set; }
        public int ProjectId { get; set; }
        public string ProjectName { get; set; } = string.Empty;
        public string ProjectCode { get; set; } = string.Empty;
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

        public DateTime? RevisedPlannedStartDate { get; set; }
        public DateTime? RevisedPlannedEndDate { get; set; }
        public string? RevisedPlanDescription { get; set; }

        // Computed properties
        public DateTime? EffectiveStartDate => RevisedPlannedStartDate ?? PlannedStartDate;
        public DateTime? EffectiveEndDate => RevisedPlannedEndDate ?? PlannedEndDate;

        // ✅ YENİ: Kapanma tarihi
        public DateTime? ClosedOn { get; set; }

        // Computed Properties
        public bool IsCompleted => CompletionPercentage >= 100 || IsClosed;
        public string StatusText => IsCompleted ? "Tamamlandı" : "Devam Ediyor";

        /// <summary>
        /// Üretim tipi (Lazer, Abkant, Kaynak vb.) - TrackerName'den çıkarılır
        /// </summary>
        public string ProductionType => TrackerName.Replace("Üretim - ", "").Trim();

        /// <summary>
        /// İşin planlanan bitiş tarihine göre gecikip gecikmediğini kontrol eder
        /// </summary>
        public bool IsOverdue
        {
            get
            {
                if (!PlannedEndDate.HasValue) return false;

                // Eğer iş kapanmışsa, kapanma tarihini kontrol et
                if (IsClosed && ClosedOn.HasValue)
                {
                    return ClosedOn.Value.Date > PlannedEndDate.Value.Date;
                }

                // Eğer iş hala açıksa, bugünün tarihini kontrol et
                if (!IsClosed)
                {
                    return DateTime.Now.Date > PlannedEndDate.Value.Date;
                }

                return false;
            }
        }

        /// <summary>
        /// Gecikme gün sayısı
        /// </summary>
        public int OverdueDays
        {
            get
            {
                if (!IsOverdue || !PlannedEndDate.HasValue) return 0;

                DateTime comparisonDate = IsClosed && ClosedOn.HasValue
                    ? ClosedOn.Value.Date
                    : DateTime.Now.Date;

                return (comparisonDate - PlannedEndDate.Value.Date).Days;
            }
        }
    }

    /// <summary>
    /// Belirli bir tarih ve iş tipine göre detaylı iş listesi isteği
    /// </summary>
    public class GetIssuesByDateAndTypeRequest
    {
        /// <summary>
        /// Hedef tarih (yyyy-MM-dd formatında)
        /// </summary>
        [Required]
        [DataType(DataType.Date)]
        public string Date { get; set; } = string.Empty;

        /// <summary>
        /// Proje ID'si
        /// </summary>
        [Required]
        public int ProjectId { get; set; }

        /// <summary>
        /// Üretim tipi (Lazer, Abkant, Kaynak vb.)
        /// </summary>
        [Required]
        public string ProductionType { get; set; } = string.Empty;
    }

    /// <summary>
    /// Detaylı iş listesi yanıtı
    /// </summary>
    public class GetIssuesByDateAndTypeResponse
    {
        public DateTime Date { get; set; }
        public int ProjectId { get; set; }
        public string ProductionType { get; set; } = string.Empty;
        public List<ProductionIssueData> Issues { get; set; } = new();
        public int TotalCount { get; set; }
    }

    // src/backend/API/Models/RedmineWeeklyCalendarModels.cs dosyasına eklenecek

    /// <summary>
    /// İş tarih güncelleme isteği
    /// </summary>
    public class UpdateIssueDatesRequest
    {
        /// <summary>
        /// İş ID'si
        /// </summary>
        [Required]
        public int IssueId { get; set; }

        /// <summary>
        /// Yeni planlanan başlangıç tarihi (yyyy-MM-dd formatında)
        /// Null ise değiştirilmez
        /// </summary>
        [DataType(DataType.Date)]
        public string? PlannedStartDate { get; set; }

        /// <summary>
        /// Yeni planlanan bitiş tarihi (yyyy-MM-dd formatında)
        /// Null ise değiştirilmez
        /// </summary>
        [DataType(DataType.Date)]
        public string? PlannedEndDate { get; set; }

        /// <summary>
        /// Güncellemeyi yapan kullanıcı adı
        /// </summary>
        public string? UpdatedBy { get; set; }

        public string? RevisedPlannedStartDate { get; set; }
        public string? RevisedPlannedEndDate { get; set; }
        public string? RevisedPlanDescription { get; set; }
    }

    /// <summary>
    /// İş tarih güncelleme yanıtı
    /// </summary>
    public class UpdateIssueDatesResponse
    {
        public bool Success { get; set; }
        public string Message { get; set; } = string.Empty;
        public int IssueId { get; set; }
        public DateTime? OldPlannedStartDate { get; set; }
        public DateTime? OldPlannedEndDate { get; set; }
        public DateTime? NewPlannedStartDate { get; set; }
        public DateTime? NewPlannedEndDate { get; set; }
        public DateTime UpdatedAt { get; set; }
        public DateTime? OldRevisedPlannedStartDate { get; set; }
        public DateTime? OldRevisedPlannedEndDate { get; set; }
        public DateTime? NewRevisedPlannedStartDate { get; set; }
        public DateTime? NewRevisedPlannedEndDate { get; set; }
        public string? RevisedPlanDescription { get; set; }
    }

    // src/backend/API/Models/RedmineWeeklyCalendarModels.cs
    // ✅ YENİ MODEL: GetRevisedIssuesRequest

    public class GetRevisedIssuesRequest
    {
        /// <summary>
        /// Hafta başlangıç tarihi (YYYY-MM-DD)
        /// </summary>
        public string StartDate { get; set; } = string.Empty;

        /// <summary>
        /// Hafta bitiş tarihi (YYYY-MM-DD)
        /// </summary>
        public string EndDate { get; set; } = string.Empty;

        /// <summary>
        /// Tarih filtre tipi: "all", "planned_this_week", "revised_this_week", "custom_range"
        /// </summary>
        public string DateFilterType { get; set; } = "planned_this_week";

        /// <summary>
        /// Manuel tarih aralığı başlangıç (custom_range için)
        /// </summary>
        public string? CustomStartDate { get; set; }

        /// <summary>
        /// Manuel tarih aralığı bitiş (custom_range için)
        /// </summary>
        public string? CustomEndDate { get; set; }

        /// <summary>
        /// Proje ID filtresi (optional)
        /// </summary>
        public int? ProjectId { get; set; }

        /// <summary>
        /// Üretim tipi filtresi (optional) - örn: "Kesim", "Montaj"
        /// </summary>
        public string? ProductionType { get; set; }

        /// <summary>
        /// Durum adı filtresi (optional)
        /// </summary>
        public string? StatusName { get; set; }

        /// <summary>
        /// Arama terimi (optional) - İş No, Konu, Proje vb.
        /// </summary>
        public string? SearchTerm { get; set; }
    }
}