// src/backend/API/Models/PurchaseOrderModels.cs
namespace API.Models
{
    // ========================================
    // PURCHASE ORDER MODELS
    // ========================================

    /// <summary>
    /// Sipariş listesi request
    /// </summary>
    public class GetPurchaseOrdersRequest
    {
        public string? OrderNumber { get; set; }
        public int? UserId { get; set; }
        public int? DepartmentId { get; set; }
        public string? Status { get; set; }
        public string? SupplierCode { get; set; }
        public string? SupplierName { get; set; }
        public DateTime? FromDate { get; set; }
        public DateTime? ToDate { get; set; }
        public bool IncludeCancelled { get; set; } = false;

        // Pagination
        public int Page { get; set; } = 1;
        public int PageSize { get; set; } = 20;

        // Sorting
        public string? SortBy { get; set; } = "OrderDate";
        public string? SortOrder { get; set; } = "desc";
    }

    /// <summary>
    /// Sipariş listesi response
    /// </summary>
    public class GetPurchaseOrdersResponse
    {
        public List<PurchaseOrderListItemDto> Items { get; set; } = new();
        public int TotalCount { get; set; }
        public int Page { get; set; }
        public int PageSize { get; set; }
        public int TotalPages { get; set; }
    }

    /// <summary>
    /// Sipariş liste item DTO
    /// </summary>
    public class PurchaseOrderListItemDto
    {
        public int Id { get; set; }
        public string OrderNumber { get; set; } = string.Empty;
        public DateTime OrderDate { get; set; }
        public int UserId { get; set; }
        public string UserName { get; set; } = string.Empty;
        public int? DepartmentId { get; set; }
        public string? DepartmentName { get; set; }
        public string? SupplierCode { get; set; }
        public string? SupplierName { get; set; }
        public string? Description { get; set; }
        public string Status { get; set; } = string.Empty;
        public int DetailCount { get; set; }
        public decimal? TotalAmount { get; set; }
        public decimal? GrandTotal { get; set; }
        public string? Currency { get; set; }
        public DateTime? RequestedDeliveryDate { get; set; }
        public DateTime? ConfirmedDeliveryDate { get; set; }
        public DateTime? ActualDeliveryDate { get; set; }
        public string? RelatedRequestIds { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    /// <summary>
    /// Sipariş detay response
    /// </summary>
    public class PurchaseOrderDetailResponse
    {
        // Header
        public int Id { get; set; }
        public string OrderNumber { get; set; } = string.Empty;
        public DateTime OrderDate { get; set; }
        public int UserId { get; set; }
        public string UserName { get; set; } = string.Empty;
        public int? DepartmentId { get; set; }
        public string? DepartmentName { get; set; }

        // Tedarikçi
        public string? SupplierCode { get; set; }
        public string? SupplierName { get; set; }
        public string? SupplierContact { get; set; }
        public string? SupplierPhone { get; set; }
        public string? SupplierEmail { get; set; }
        public string? SupplierAddress { get; set; }

        // Teslimat
        public string? DeliveryAddress { get; set; }
        public DateTime? RequestedDeliveryDate { get; set; }
        public DateTime? ConfirmedDeliveryDate { get; set; }
        public DateTime? ActualDeliveryDate { get; set; }

        // Sipariş Bilgileri
        public string? Description { get; set; }
        public string? PaymentTerms { get; set; }
        public string? DeliveryTerms { get; set; }

        // Fiyat
        public decimal? TotalAmount { get; set; }
        public string? Currency { get; set; }
        public decimal? VATRate { get; set; }
        public decimal? VATAmount { get; set; }
        public decimal? GrandTotal { get; set; }

        // Durum
        public string Status { get; set; } = string.Empty;

        // Onay
        public DateTime? SubmittedDate { get; set; }
        public DateTime? ApprovalDate { get; set; }
        public int? ApprovedBy { get; set; }
        public string? ApprovalNote { get; set; }
        public DateTime? ConfirmationDate { get; set; }
        public int? ConfirmedBy { get; set; }
        public string? ConfirmationNote { get; set; }

        // İptal
        public DateTime? CancelledDate { get; set; }
        public int? CancelledBy { get; set; }
        public string? CancellationReason { get; set; }

        // Bağlantılar
        public string? RelatedRequestIds { get; set; }
        public List<RelatedRequestInfoDto>? RelatedRequests { get; set; }

        // Audit
        public int CreatedBy { get; set; }
        public DateTime CreatedAt { get; set; }
        public int? UpdatedBy { get; set; }
        public DateTime? UpdatedAt { get; set; }

        // Detaylar
        public List<PurchaseOrderDetailDto> Details { get; set; } = new();

        // Geçmiş
        public List<OrderHistoryDto> OrderHistory { get; set; } = new();
    }

    /// <summary>
    /// Sipariş detay item DTO
    /// </summary>
    public class PurchaseOrderDetailDto
    {
        public int Id { get; set; }
        public int OrderId { get; set; }
        public int ItemId { get; set; }
        public string ItemCode { get; set; } = string.Empty;
        public string ItemName { get; set; } = string.Empty;
        public int? ItemGroupId { get; set; }
        public string? ItemGroupName { get; set; }
        public decimal OrderedQuantity { get; set; }
        public decimal? ReceivedQuantity { get; set; }
        public string? Unit { get; set; }
        public decimal UnitPrice { get; set; }
        public decimal TotalPrice { get; set; }
        public string? Currency { get; set; }
        public DateTime? RequestedDeliveryDate { get; set; }
        public DateTime? ActualDeliveryDate { get; set; }
        public string? Description { get; set; }
        public string? SupplierPartNumber { get; set; }
        public int? RequestDetailId { get; set; }
        public string Status { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
    }

    /// <summary>
    /// Sipariş geçmişi DTO
    /// </summary>
    public class OrderHistoryDto
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
    /// Bağlantılı talep bilgisi
    /// </summary>
    public class RelatedRequestInfoDto
    {
        public int Id { get; set; }
        public string RequestNumber { get; set; } = string.Empty;
        public DateTime RequestDate { get; set; }
        public string UserName { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
    }

    /// <summary>
    /// Yeni sipariş oluşturma request
    /// </summary>
    public class CreatePurchaseOrderRequest
    {
        // Tedarikçi
        public string? SupplierCode { get; set; }
        public string? SupplierName { get; set; }
        public string? SupplierContact { get; set; }
        public string? SupplierPhone { get; set; }
        public string? SupplierEmail { get; set; }
        public string? SupplierAddress { get; set; }

        // Teslimat
        public string? DeliveryAddress { get; set; }
        public DateTime? RequestedDeliveryDate { get; set; }

        // Sipariş
        public string? Description { get; set; }
        public string? PaymentTerms { get; set; }
        public string? DeliveryTerms { get; set; }

        // Fiyat
        public string? Currency { get; set; } = "TRY";
        public decimal? VATRate { get; set; } = 20.00M;

        // Bağlantılı talepler
        public List<int>? RelatedRequestIds { get; set; }

        // Detaylar
        public List<CreatePurchaseOrderDetailDto> Details { get; set; } = new();
    }

    /// <summary>
    /// Sipariş detay oluşturma DTO
    /// </summary>
    public class CreatePurchaseOrderDetailDto
    {
        public int ItemId { get; set; }
        public decimal OrderedQuantity { get; set; }
        public string? Unit { get; set; }
        public decimal UnitPrice { get; set; }
        public string? Currency { get; set; } = "TRY";
        public DateTime? RequestedDeliveryDate { get; set; }
        public string? Description { get; set; }
        public string? SupplierPartNumber { get; set; }
        public int? RequestDetailId { get; set; }
    }

    /// <summary>
    /// Sipariş güncelleme request
    /// </summary>
    public class UpdatePurchaseOrderRequest
    {
        public string? SupplierCode { get; set; }
        public string? SupplierName { get; set; }
        public string? SupplierContact { get; set; }
        public string? SupplierPhone { get; set; }
        public string? SupplierEmail { get; set; }
        public string? SupplierAddress { get; set; }
        public string? DeliveryAddress { get; set; }
        public DateTime? RequestedDeliveryDate { get; set; }
        public DateTime? ConfirmedDeliveryDate { get; set; }
        public string? Description { get; set; }
        public string? PaymentTerms { get; set; }
        public string? DeliveryTerms { get; set; }
        public string? Currency { get; set; }
        public decimal? VATRate { get; set; }
        public List<UpdatePurchaseOrderDetailDto>? Details { get; set; }
    }

    /// <summary>
    /// Sipariş detay güncelleme DTO
    /// </summary>
    public class UpdatePurchaseOrderDetailDto
    {
        public int? Id { get; set; }
        public int ItemId { get; set; }
        public decimal OrderedQuantity { get; set; }
        public decimal? ReceivedQuantity { get; set; }
        public string? Unit { get; set; }
        public decimal UnitPrice { get; set; }
        public string? Currency { get; set; }
        public DateTime? RequestedDeliveryDate { get; set; }
        public DateTime? ActualDeliveryDate { get; set; }
        public string? Description { get; set; }
        public string? SupplierPartNumber { get; set; }
        public string? Status { get; set; }
    }

    /// <summary>
    /// Sipariş onay/red işlemi request
    /// </summary>
    public class ApproveRejectOrderRequest
    {
        public string Action { get; set; } = string.Empty; // Approve, Reject, Confirm
        public string? Notes { get; set; }
    }

    /// <summary>
    /// Teslimat güncelleme request
    /// </summary>
    public class UpdateDeliveryRequest
    {
        public int DetailId { get; set; }
        public decimal ReceivedQuantity { get; set; }
        public DateTime ActualDeliveryDate { get; set; }
        public string? Notes { get; set; }
    }

    /// <summary>
    /// Dashboard istatistikleri için DTO
    /// </summary>
    public class PurchaseOrderStatsDto
    {
        public int TotalOrders { get; set; }
        public int PendingOrders { get; set; }
        public int ConfirmedOrders { get; set; }
        public int InDelivery { get; set; }
        public int Completed { get; set; }
        public decimal TotalOrderValue { get; set; }
        public decimal PendingValue { get; set; }
    }

    /// <summary>
    /// Talepten sipariş oluşturma request
    /// </summary>
    public class CreateOrderFromRequestRequest
    {
        public List<int> RequestIds { get; set; } = new();
        public string? SupplierCode { get; set; }
        public string? SupplierName { get; set; }
        public string? SupplierContact { get; set; }
        public string? Description { get; set; }
        public string? PaymentTerms { get; set; }
        public DateTime? RequestedDeliveryDate { get; set; }
    }
}