using System.ComponentModel.DataAnnotations;
using System.Runtime.CompilerServices;

namespace API.Models
{
    // ItemGroup Models
    public class CreateItemGroupRequest
    {
        [Required(ErrorMessage = "Grup adı zorunludur")]
        [MaxLength(100, ErrorMessage = "Grup adı en fazla 100 karakter olabilir")]
        public string Name { get; set; } = string.Empty;
    }

    public class UpdateItemGroupRequest
    {
        [Required(ErrorMessage = "Grup adı zorunludur")]
        [MaxLength(100, ErrorMessage = "Grup adı en fazla 100 karakter olabilir")]
        public string Name { get; set; } = string.Empty;

        public bool? Cancelled { get; set; }
    }

    public class GetItemGroupsRequest
    {
        public string? Name { get; set; }
        public bool? IncludeCancelled { get; set; } = false;
        public int Page { get; set; } = 1;
        public int PageSize { get; set; } = 10;
        public string? SortBy { get; set; } = "Name";
        public string? SortOrder { get; set; } = "asc";
    }

    public class ItemGroupResponse
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public bool? Cancelled { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
        public int ItemCount { get; set; }
        public string FormattedCreatedAt => CreatedAt.ToString("dd.MM.yyyy HH:mm");
    }

    public class GetItemGroupsResponse
    {
        public List<ItemGroupResponse> ItemGroups { get; set; } = new();
        public int TotalCount { get; set; }
        public int Page { get; set; }
        public int PageSize { get; set; }
        public int TotalPages { get; set; }
        public bool HasNextPage { get; set; }
        public bool HasPreviousPage { get; set; }
    }

    // Item Models
    public class CreateItemRequest
    {
        [Required(ErrorMessage = "Numara zorunludur")]
        public int Number { get; set; }

        [Required(ErrorMessage = "Kod zorunludur")]
        [MaxLength(50, ErrorMessage = "Kod en fazla 50 karakter olabilir")]
        public string Code { get; set; } = string.Empty;

        [Required(ErrorMessage = "İsim zorunludur")]
        [MaxLength(500, ErrorMessage = "İsim en fazla 500 karakter olabilir")]
        public string Name { get; set; } = string.Empty;

        [MaxLength(50, ErrorMessage = "Doküman numarası en fazla 50 karakter olabilir")]
        public string DocNumber { get; set; } = string.Empty;

        [Required(ErrorMessage = "Grup ID zorunludur")]
        public int GroupId { get; set; }

        public double? X { get; set; }
        public double? Y { get; set; }
        public double? Z { get; set; }

        [MaxLength(500, ErrorMessage = "Resim URL'i en fazla 500 karakter olabilir")]
        public string? ImageUrl { get; set; }

        public string? SupplierCode { get; set; } = string.Empty;
        public double? Price { get; set; }
        public string? Supplier { get; set; }
        public string? Unit { get; set; }
    }

    public class UpdateItemRequest
    {
        [Required(ErrorMessage = "Numara zorunludur")]
        public int Number { get; set; }

        [Required(ErrorMessage = "Kod zorunludur")]
        [MaxLength(50, ErrorMessage = "Kod en fazla 50 karakter olabilir")]
        public string Code { get; set; } = string.Empty;

        [Required(ErrorMessage = "İsim zorunludur")]
        [MaxLength(500, ErrorMessage = "İsim en fazla 500 karakter olabilir")]
        public string Name { get; set; } = string.Empty;

        [MaxLength(50, ErrorMessage = "Doküman numarası en fazla 50 karakter olabilir")]
        public string DocNumber { get; set; } = string.Empty;

        [Required(ErrorMessage = "Grup ID zorunludur")]
        public int GroupId { get; set; }

        public double? X { get; set; }
        public double? Y { get; set; }
        public double? Z { get; set; }

        [MaxLength(500, ErrorMessage = "Resim URL'i en fazla 500 karakter olabilir")]
        public string? ImageUrl { get; set; }

        public bool? Cancelled { get; set; }

        public string? SupplierCode { get; set; } = string.Empty;
        public double? Price { get; set; }
        public string? Supplier { get; set; }
        public string? Unit { get; set; }
    }

    public class GetItemsRequest
    {
        public int? GroupId { get; set; }
        public string? Code { get; set; }
        public int? Number { get; set; }
        public bool? IncludeCancelled { get; set; } = false;
        public int Page { get; set; } = 1;
        public int PageSize { get; set; } = 10;
        public string? SortBy { get; set; } = "Number";
        public string? SortOrder { get; set; } = "asc";
        public string DocNumber { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public bool? TechnicalDrawingCompleted { get; set; } // ✅ YENİ
    }

    public class ItemResponse
    {
        public int Id { get; set; }
        public int Number { get; set; }
        public string Code { get; set; } = string.Empty;
        public int GroupId { get; set; }
        public string GroupName { get; set; } = string.Empty;

        public string DocNumber { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;

        public double? X { get; set; }
        public double? Y { get; set; }
        public double? Z { get; set; }
        public string? ImageUrl { get; set; }
        public bool? Cancelled { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }

        public string FormattedCreatedAt => CreatedAt.ToString("dd.MM.yyyy HH:mm");
        public string Dimensions => $"{X ?? 0}x{Y ?? 0}x{Z ?? 0}";

        public string? SupplierCode { get; set; } = string.Empty;
        public double? Price { get; set; }
        public string? Supplier { get; set; }
        public string? Unit { get; set; }

        /// <summary>
        /// Teknik resim çalışması tamamlandı mı? (Read-only)
        /// Bu alan sadece gösterim için kullanılır, güncellenemez
        /// </summary>
        public bool TechnicalDrawingCompleted { get; set; }
    }

    public class GetItemsResponse
    {
        public List<ItemResponse> Items { get; set; } = new();
        public int TotalCount { get; set; }
        public int Page { get; set; }
        public int PageSize { get; set; }
        public int TotalPages { get; set; }
        public bool HasNextPage { get; set; }
        public bool HasPreviousPage { get; set; }
    }

    // Common Response Models
    public class CreateItemGroupResponse
    {
        public bool Success { get; set; }
        public int Id { get; set; }
        public string Message { get; set; } = string.Empty;
        public ItemGroupResponse? ItemGroup { get; set; }
    }

    public class UpdateItemGroupResponse
    {
        public bool Success { get; set; }
        public string Message { get; set; } = string.Empty;
        public ItemGroupResponse? ItemGroup { get; set; }
    }

    public class CreateItemResponse
    {
        public bool Success { get; set; }
        public int Id { get; set; }
        public string Message { get; set; } = string.Empty;
        public ItemResponse? Item { get; set; }
    }

    public class UpdateItemResponse
    {
        public bool Success { get; set; }
        public string Message { get; set; } = string.Empty;
        public ItemResponse? Item { get; set; }
    }

    public class DeleteResponse
    {
        public bool Success { get; set; }
        public string Message { get; set; } = string.Empty;
    }
}