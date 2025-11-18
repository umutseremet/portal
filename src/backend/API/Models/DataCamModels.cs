using System.ComponentModel.DataAnnotations;

namespace API.Models
{
    // ==================== DATA CAM PREPARATION MODELS ====================

    public class GetDataCamItemsRequest
    {
        public string? SearchTerm { get; set; }
        public int Page { get; set; } = 1;
        public int PageSize { get; set; } = 20;
        public string? SortBy { get; set; } = "CreatedAt";
        public string? SortOrder { get; set; } = "asc"; // asc veya desc
    }

    public class DataCamItemResponse
    {
        // Ürün bilgileri
        public int ItemId { get; set; }
        public int ItemNumber { get; set; }
        public string ItemCode { get; set; } = string.Empty;
        public string ItemName { get; set; } = string.Empty;
        public string ItemDocNumber { get; set; } = string.Empty;
        public string? ItemGroupName { get; set; }
        public double? X { get; set; }
        public double? Y { get; set; }
        public double? Z { get; set; }
        public string? ImageUrl { get; set; }
        public DateTime CreatedAt { get; set; }

        // İlk BOM bilgileri (ürünün ilk eklendiği yer)
        public int? BomWorkId { get; set; }
        public string? BomWorkName { get; set; }
        public int? BomExcelId { get; set; }
        public string? BomExcelFileName { get; set; }
        public int? ProjectId { get; set; }
        public string? ProjectName { get; set; }

        // Ek bilgi
        public int AdditionalBomCount { get; set; } // Diğer BOM'larda kaç kez daha geçiyor

        // Computed properties
        public string Dimensions => $"{X ?? 0} x {Y ?? 0} x {Z ?? 0}";
        public string FormattedCreatedAt => CreatedAt.ToString("dd.MM.yyyy HH:mm");
    }

    public class GetDataCamItemsResponse
    {
        public List<DataCamItemResponse> Items { get; set; } = new();
        public int TotalCount { get; set; }
        public int Page { get; set; }
        public int PageSize { get; set; }
        public int TotalPages { get; set; }
        public bool HasNextPage { get; set; }
        public bool HasPreviousPage { get; set; }
    }

    public class BomLocationResponse
    {
        public int BomItemId { get; set; }
        public int BomWorkId { get; set; }
        public string BomWorkName { get; set; } = string.Empty;
        public int BomExcelId { get; set; }
        public string BomExcelFileName { get; set; } = string.Empty;
        public int ProjectId { get; set; }
        public string ProjectName { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public string FormattedCreatedAt => CreatedAt.ToString("dd.MM.yyyy HH:mm");
    }

    public class MarkCompletedResponse
    {
        public bool Success { get; set; }
        public string Message { get; set; } = string.Empty;
        public int ItemId { get; set; }
        public DateTime CompletedAt { get; set; }
    }

    public class DataCamStatsResponse
    {
        public int TotalItems { get; set; }
        public int CompletedItems { get; set; }
        public int PendingItems { get; set; }
        public double CompletionRate { get; set; }
        public int RecentlyCompleted { get; set; } // Son 7 gün
    }

    public class ErrorResponse
    {
        public string Message { get; set; } = string.Empty;
    }
}