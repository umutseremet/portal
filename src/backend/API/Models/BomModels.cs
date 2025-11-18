using System.ComponentModel.DataAnnotations;

namespace API.Models
{
    // ==================== BOM WORK MODELS ====================

    public class CreateBomWorkRequest
    {
        [Required]
        public int ProjectId { get; set; }

        [Required]
        public string ProjectName { get; set; } = string.Empty;

        [Required]
        public string WorkName { get; set; } = string.Empty;

        public string? Description { get; set; }

        // ✅ Geçici - sadece development için
        public string? RedmineUsername { get; set; }

        public string? RedminePassword { get; set; }
    }

    public class UpdateBomWorkRequest
    {
        [Required(ErrorMessage = "Çalışma adı gerekli")]
        [StringLength(200, ErrorMessage = "Çalışma adı en fazla 200 karakter olabilir")]
        public string WorkName { get; set; } = string.Empty;

        [StringLength(500, ErrorMessage = "Açıklama en fazla 500 karakter olabilir")]
        public string? Description { get; set; }
    }

    public class BomWorkResponse
    {
        public int Id { get; set; }
        public int ProjectId { get; set; }
        public string ProjectName { get; set; } = string.Empty;
        public string WorkName { get; set; } = string.Empty;
        public string? Description { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
        public string CreatedBy { get; set; } = string.Empty;
        public bool IsActive { get; set; }
        public int ExcelCount { get; set; }
        public int TotalRows { get; set; }
    }

    public class GetBomWorksRequest
    {
        public int? ProjectId { get; set; }
        public string? SearchTerm { get; set; }
        public bool IncludeInactive { get; set; } = false;
        public int Page { get; set; } = 1;
        public int PageSize { get; set; } = 10;
        public string? SortBy { get; set; } = "CreatedAt";
        public string? SortOrder { get; set; } = "desc";
        public string? RedmineUsername { get; set; }
        public string? RedminePassword { get; set; }
    }

    public class GetBomWorksResponse
    {
        public List<BomWorkResponse> Works { get; set; } = new();
        public int TotalCount { get; set; }
        public int Page { get; set; }
        public int PageSize { get; set; }
    }

    // ==================== BOM EXCEL MODELS ====================

    public class BomExcelResponse
    {
        public int Id { get; set; }
        public int WorkId { get; set; }
        public string FileName { get; set; } = string.Empty;
        public string FilePath { get; set; } = string.Empty;
        public long FileSize { get; set; }
        public int RowCount { get; set; }
        public DateTime UploadedAt { get; set; }
        public string UploadedBy { get; set; } = string.Empty;
        public bool IsProcessed { get; set; }
        public string? ProcessingNotes { get; set; }
    }

    public class GetBomExcelsRequest
    {
        [Required]
        public int WorkId { get; set; }

        public int Page { get; set; } = 1;
        public int PageSize { get; set; } = 10;
    }

    public class GetBomExcelsResponse
    {
        public List<BomExcelResponse> Excels { get; set; } = new();
        public int TotalCount { get; set; }
        public int Page { get; set; }
        public int PageSize { get; set; }
    }

    // ==================== BOM ITEM MODELS (REVISED) ====================

    /// <summary>
    /// BomItem response - Items tablosundan ürün bilgilerini include eder
    /// </summary>
    public class BomItemResponse
    {
        public int Id { get; set; }
        public int ExcelId { get; set; }

        // Item referansı
        public int ItemId { get; set; }

        // Items tablosundan gelen bilgiler
        public int ItemNumber { get; set; }

        public string ItemCode { get; set; } = string.Empty;
        public string ItemName { get; set; } = string.Empty;
        public string ItemDocNumber { get; set; } = string.Empty;
        public double? ItemX { get; set; }
        public double? ItemY { get; set; }
        public double? ItemZ { get; set; }
        public string? ItemGroupName { get; set; }

        // Excel'e özel alanlar
        public string? OgeNo { get; set; }

        public int? Miktar { get; set; }
        public int RowNumber { get; set; }
        public string? Notes { get; set; }
        public DateTime CreatedAt { get; set; }

        public string? ItemImageUrl { get; set; }
    }

    public class GetBomItemsRequest
    {
        [Required]
        public int ExcelId { get; set; }

        public string? SearchTerm { get; set; }
        public int Page { get; set; } = 1;
        public int PageSize { get; set; } = 20;
        public string? SortBy { get; set; } = "RowNumber";
        public string? SortOrder { get; set; } = "asc";
    }

    public class GetBomItemsResponse
    {
        public List<BomItemResponse> Items { get; set; } = new();
        public int TotalCount { get; set; }
        public int Page { get; set; }
        public int PageSize { get; set; }
        public string ExcelFileName { get; set; } = string.Empty;
    }

    public class UpdateBomItemRequest
    {
        public int? Miktar { get; set; }

        [StringLength(50)]
        public string? OgeNo { get; set; }

        [StringLength(500)]
        public string? Notes { get; set; }
    }

    // ==================== EXCEL PARSE MODELS ====================

    public class ProcessExcelRequest
    {
        [Required]
        public int ExcelId { get; set; }
    }

    public class ProcessExcelResponse
    {
        public bool Success { get; set; }
        public string? Message { get; set; }
        public int ProcessedRows { get; set; }
        public int SkippedRows { get; set; }
        public int NewItemsCreated { get; set; }
    }

    // ==================== COMMON MODELS ====================

    public class BomProjectResponse
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Identifier { get; set; }
    }
}