using System.ComponentModel.DataAnnotations;

namespace API.Models
{
    // Request Models

    public class CreateVisitorRequest
    {
        [Required(ErrorMessage = "Ziyaret tarihi zorunludur")]
        public DateTime Date { get; set; }

        [Required(ErrorMessage = "Şirket adı zorunludur")]
        [MaxLength(100, ErrorMessage = "Şirket adı en fazla 100 karakter olabilir")]
        public string Company { get; set; } = string.Empty;

        [Required(ErrorMessage = "Ziyaretçi adı zorunludur")]
        [MaxLength(255, ErrorMessage = "Ziyaretçi adı en fazla 255 karakter olabilir")]
        public string Visitor { get; set; } = string.Empty;

        [MaxLength(500, ErrorMessage = "Açıklama en fazla 500 karakter olabilir")]
        public string? Description { get; set; }
    }

    public class UpdateVisitorRequest
    {
        [Required(ErrorMessage = "Ziyaret tarihi zorunludur")]
        public DateTime Date { get; set; }

        [Required(ErrorMessage = "Şirket adı zorunludur")]
        [MaxLength(100, ErrorMessage = "Şirket adı en fazla 100 karakter olabilir")]
        public string Company { get; set; } = string.Empty;

        [Required(ErrorMessage = "Ziyaretçi adı zorunludur")]
        [MaxLength(255, ErrorMessage = "Ziyaretçi adı en fazla 255 karakter olabilir")]
        public string Visitor { get; set; } = string.Empty;

        [MaxLength(500, ErrorMessage = "Açıklama en fazla 500 karakter olabilir")]
        public string? Description { get; set; }
    }

    public class UpdateVisitorPostRequest
    {
        [Required]
        public int Id { get; set; }

        [Required]
        public DateTime Date { get; set; }

        [Required]
        [MaxLength(100)]
        public string Company { get; set; } = string.Empty;

        [Required]
        [MaxLength(255)]
        public string Visitor { get; set; } = string.Empty;

        [MaxLength(500)]
        public string? Description { get; set; }
    }

    public class GetVisitorsRequest
    {
        public DateTime? FromDate { get; set; }
        public DateTime? ToDate { get; set; }
        public string? Company { get; set; }
        public string? Visitor { get; set; }
        public int Page { get; set; } = 1;
        public int PageSize { get; set; } = 10;
        public string? SortBy { get; set; } = "Date";
        public string? SortOrder { get; set; } = "desc";
    }

    // Response Models

    public class VisitorResponse
    {
        public int Id { get; set; }
        public DateTime? Date { get; set; }
        public string? Company { get; set; }
        public string? Visitor { get; set; } // Frontend "visitor" bekliyor
        public string? Description { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }

        // Formatted properties for display
        public string FormattedDate => Date?.ToString("dd.MM.yyyy") ?? "";
        public string ShortDescription => Description?.Length > 100
            ? Description.Substring(0, 100) + "..."
            : Description ?? "";
    }

    public class GetVisitorsResponse
    {
        public List<VisitorResponse> Visitors { get; set; } = new();
        public int TotalCount { get; set; }
        public int Page { get; set; }
        public int PageSize { get; set; }
        public int TotalPages { get; set; }
        public bool HasNextPage { get; set; }
        public bool HasPreviousPage { get; set; }
    }

    public class CreateVisitorResponse
    {
        public bool Success { get; set; }
        public int Id { get; set; }
        public string Message { get; set; } = string.Empty;
        public VisitorResponse? Visitor { get; set; }
    }

    public class UpdateVisitorResponse
    {
        public bool Success { get; set; }
        public string Message { get; set; } = string.Empty;
        public VisitorResponse? Visitor { get; set; }
    }

    public class DeleteVisitorResponse
    {
        public bool Success { get; set; }
        public string Message { get; set; } = string.Empty;
    }

    // Statistics Models (Dashboard için)

    public class VisitorStatsResponse
    {
        public int TotalVisitors { get; set; }
        public int ThisMonthVisitors { get; set; }
        public int ThisWeekVisitors { get; set; }
        public int TodayVisitors { get; set; }
        public List<VisitorsByDateResponse> VisitorsByDate { get; set; } = new();
        public List<VisitorsByCompanyResponse> TopCompanies { get; set; } = new();
    }

    public class VisitorsByDateResponse
    {
        public DateTime Date { get; set; }
        public int Count { get; set; }
        public string FormattedDate => Date.ToString("dd.MM.yyyy");
    }

    public class VisitorsByCompanyResponse
    {
        public string Company { get; set; } = string.Empty;
        public int Count { get; set; }
        public DateTime LastVisit { get; set; }
        public string FormattedLastVisit => LastVisit.ToString("dd.MM.yyyy");
    }
}