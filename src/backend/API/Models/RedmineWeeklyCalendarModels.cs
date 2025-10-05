using System.ComponentModel.DataAnnotations;

namespace API.Models
{
    // Request Models
    public class GetWeeklyProjectOperationsRequest
    {
        /// <summary>
        /// Hafta başlangıç tarihi (yyyy-MM-dd formatında). Boş bırakılırsa bugünün haftası kullanılır.
        /// </summary>
        [DataType(DataType.Date)]
        public string? StartDate { get; set; }
    }

    // Response Models
    public class WeeklyCalendarResponse
    {
        public DateTime WeekStart { get; set; }
        public DateTime WeekEnd { get; set; }
        public List<DayData> Days { get; set; } = new();
    }

    public class DayData
    {
        public DateTime Date { get; set; }
        public int DayOfWeek { get; set; }
        public string DayName { get; set; } = string.Empty;
        public List<OperationData> Operations { get; set; } = new();
    }

    public class OperationData
    {
        public int ProjectId { get; set; }
        public string ProjectCode { get; set; } = string.Empty;
        public string ProjectName { get; set; } = string.Empty;
        public int OperationId { get; set; }
        public string OperationName { get; set; } = string.Empty;
        public string OperationType { get; set; } = string.Empty;
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public int CompletionPercentage { get; set; }
        public decimal? EstimatedHours { get; set; }
        public string StatusName { get; set; } = string.Empty;
        public bool IsCompleted { get; set; }
        public string PriorityName { get; set; } = string.Empty;
        public string AssignedTo { get; set; } = string.Empty;
    }

    public class ActiveProjectSummary
    {
        public int ProjectId { get; set; }
        public string ProjectCode { get; set; } = string.Empty;
        public string ProjectName { get; set; } = string.Empty;
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public int TotalOperations { get; set; }
        public int CompletedOperations { get; set; }
        public int CompletionPercentage { get; set; }
        public int ActiveOperationsCount { get; set; }

        // Computed Properties
        public int RemainingOperations => TotalOperations - CompletedOperations;
        public bool IsCompleted => CompletionPercentage >= 100;
        public bool IsActive => ActiveOperationsCount > 0;
        public string StatusText => IsCompleted ? "Tamamlandı" :
                                   IsActive ? "Devam Ediyor" : "Beklemede";
    }
}