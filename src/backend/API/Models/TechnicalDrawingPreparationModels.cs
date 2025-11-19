namespace API.Models
{
    // ==================== REQUEST/RESPONSE MODELS ====================

    public class BomWorkForDrawingResponse
    {
        public int Id { get; set; }
        public string WorkName { get; set; } = string.Empty;
        public int ProjectId { get; set; }
        public string? ProjectName { get; set; }
    }

    public class ItemGroupForDrawingResponse
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
    }

    public class GetItemsForDrawingRequest
    {
        public int WorkId { get; set; }
        public List<int> ItemGroupIds { get; set; } = new();
    }

    public class TechnicalDrawingItemResponse
    {
        public int ItemId { get; set; }
        public int ItemNumber { get; set; }
        public string ItemCode { get; set; } = string.Empty;
        public string ItemName { get; set; } = string.Empty;
        public int ItemGroupId { get; set; }
        public string? ItemGroupName { get; set; }
        public string? ExcelFileName { get; set; } // Excel dosya adı
        public int ExcelId { get; set; }
        public bool HasTechnicalDrawing { get; set; }
        public int FileCount { get; set; }
    }

    public class DownloadTechnicalDrawingsRequest
    {
        public int WorkId { get; set; }
        public List<int> ItemGroupIds { get; set; } = new();
    }
}