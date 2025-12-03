// src/backend/API/Models/PurchaseRequestModels.cs
namespace API.Models
{
    // ========================================
    // PURCHASE REQUEST MODELS
    // ========================================

    /// <summary>
    /// Talep listesi request
    /// </summary>
    public class GetPurchaseRequestsRequest
    {
        public string? RequestNumber { get; set; }
        public int? UserId { get; set; }
        public int? DepartmentId { get; set; }
        public string? Status { get; set; }
        public string? Priority { get; set; }
        public DateTime? FromDate { get; set; }
        public DateTime? ToDate { get; set; }
        public bool IncludeCancelled { get; set; } = false;

        // Pagination
        public int Page { get; set; } = 1;
        public int PageSize { get; set; } = 20;

        // Sorting
        public string? SortBy { get; set; } = "RequestDate";
        public string? SortOrder { get; set; } = "desc";
    }

    /// <summary>
    /// Talep listesi response
    /// </summary>
    public class GetPurchaseRequestsResponse
    {
        public List<PurchaseRequestListItemDto> Items { get; set; } = new();
        public int TotalCount { get; set; }
        public int Page { get; set; }
        public int PageSize { get; set; }
        public int TotalPages { get; set; }
    }

    /// <summary>
    /// Talep liste item DTO
    /// </summary>
    public class PurchaseRequestListItemDto
    {
        public int Id { get; set; }
        public string RequestNumber { get; set; } = string.Empty;
        public DateTime RequestDate { get; set; }
        public int UserId { get; set; }
        public string UserName { get; set; } = string.Empty;
        public int? DepartmentId { get; set; }
        public string? DepartmentName { get; set; }
        public string? Description { get; set; }
        public string Priority { get; set; } = string.Empty;
        public string RequestType { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public int DetailCount { get; set; } // Kaç kalem ürün var
        public decimal? TotalEstimatedAmount { get; set; } // Toplam tahmini tutar
        public DateTime? SubmittedDate { get; set; }
        public int? PurchaseOrderId { get; set; }
        public string? PurchaseOrderNumber { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    /// <summary>
    /// Talep detay response
    /// </summary>
    public class PurchaseRequestDetailResponse
    {
        // Header
        public int Id { get; set; }
        public string RequestNumber { get; set; } = string.Empty;
        public DateTime RequestDate { get; set; }
        public int UserId { get; set; }
        public string UserName { get; set; } = string.Empty;
        public int? DepartmentId { get; set; }
        public string? DepartmentName { get; set; }
        public string? Description { get; set; }
        public string Priority { get; set; } = string.Empty;
        public string RequestType { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;

        // Onay Bilgileri
        public DateTime? SubmittedDate { get; set; }
        public DateTime? ManagerApprovalDate { get; set; }
        public int? ManagerApprovedBy { get; set; }
        public string? ManagerApprovalNote { get; set; }
        public DateTime? PurchasingReviewDate { get; set; }
        public int? PurchasingReviewedBy { get; set; }
        public string? PurchasingReviewNote { get; set; }
        public DateTime? FinalApprovalDate { get; set; }
        public int? FinalApprovedBy { get; set; }
        public string? FinalApprovalNote { get; set; }
        public DateTime? RejectionDate { get; set; }
        public int? RejectedBy { get; set; }
        public string? RejectionReason { get; set; }

        // Sipariş Bağlantısı
        public int? PurchaseOrderId { get; set; }
        public string? PurchaseOrderNumber { get; set; }

        // İptal
        public DateTime? CancelledDate { get; set; }
        public int? CancelledBy { get; set; }
        public string? CancellationReason { get; set; }

        // Audit
        public int CreatedBy { get; set; }
        public DateTime CreatedAt { get; set; }
        public int? UpdatedBy { get; set; }
        public DateTime? UpdatedAt { get; set; }

        // Detaylar
        public List<PurchaseRequestDetailDto> Details { get; set; } = new();

        // Onay Geçmişi
        public List<ApprovalHistoryDto> ApprovalHistory { get; set; } = new();
    }

    /// <summary>
    /// Talep detay item DTO
    /// </summary>
    public class PurchaseRequestDetailDto
    {
        public int Id { get; set; }
        public int RequestId { get; set; }
        public int ItemId { get; set; }
        public string ItemCode { get; set; } = string.Empty;
        public string ItemName { get; set; } = string.Empty;
        public int? ItemGroupId { get; set; }
        public string? ItemGroupName { get; set; }
        public decimal Quantity { get; set; }
        public string? Unit { get; set; }
        public string? Description { get; set; }
        public DateTime? RequiredDate { get; set; }
        public decimal? EstimatedUnitPrice { get; set; }
        public decimal? EstimatedTotalPrice { get; set; }
        public string? Currency { get; set; }
        public int? PurchaseOrderDetailId { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
    }

    /// <summary>
    /// Onay geçmişi DTO
    /// </summary>
    public class ApprovalHistoryDto
    {
        public int Id { get; set; }
        public string StepName { get; set; } = string.Empty;
        public string Action { get; set; } = string.Empty;
        public int UserId { get; set; }
        public string UserName { get; set; } = string.Empty;
        public DateTime ActionDate { get; set; }
        public string? Notes { get; set; }
    }

    /// <summary>
    /// Yeni talep oluşturma request
    /// </summary>
    public class CreatePurchaseRequestRequest
    {
        public string? Description { get; set; }
        public string Priority { get; set; } = "Normal";
        public string RequestType { get; set; } = "Standard";
        public List<CreatePurchaseRequestDetailDto> Details { get; set; } = new();
    }

    /// <summary>
    /// Talep detay oluşturma DTO
    /// </summary>
    public class CreatePurchaseRequestDetailDto
    {
        public int ItemId { get; set; }
        public decimal Quantity { get; set; }
        public string? Unit { get; set; }
        public string? Description { get; set; }
        public DateTime? RequiredDate { get; set; }
        public decimal? EstimatedUnitPrice { get; set; }
    }

    /// <summary>
    /// Talep güncelleme request
    /// </summary>
    public class UpdatePurchaseRequestRequest
    {
        public string? Description { get; set; }
        public string? Priority { get; set; }
        public string? RequestType { get; set; }
        public List<UpdatePurchaseRequestDetailDto>? Details { get; set; }
    }

    /// <summary>
    /// Talep detay güncelleme DTO
    /// </summary>
    public class UpdatePurchaseRequestDetailDto
    {
        public int? Id { get; set; } // Null ise yeni detay
        public int ItemId { get; set; }
        public decimal Quantity { get; set; }
        public string? Unit { get; set; }
        public string? Description { get; set; }
        public DateTime? RequiredDate { get; set; }
        public decimal? EstimatedUnitPrice { get; set; }
    }

    /// <summary>
    /// Talep onay/red işlemi request
    /// </summary>
    public class ApproveRejectRequestRequest
    {
        public string Action { get; set; } = string.Empty; // Approve, Reject, Return
        public string? Notes { get; set; }
    }

    /// <summary>
    /// Dashboard istatistikleri için DTO
    /// </summary>
    public class PurchaseRequestStatsDto
    {
        public int TotalRequests { get; set; }
        public int PendingApproval { get; set; }
        public int Approved { get; set; }
        public int Rejected { get; set; }
        public int InProgress { get; set; }
        public int Completed { get; set; }
        public decimal TotalEstimatedValue { get; set; }
    }
}