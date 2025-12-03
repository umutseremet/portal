// src/backend/API/Data/Entities/PurchaseOrder.cs
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace API.Data.Entities
{
    [Table("PurchaseOrders")]
    public class PurchaseOrder
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [MaxLength(50)]
        public string OrderNumber { get; set; } = string.Empty;

        [Required]
        public DateTime OrderDate { get; set; } = DateTime.Now;

        // Kullanıcı Bilgileri
        [Required]
        public int UserId { get; set; }

        [Required]
        [MaxLength(200)]
        public string UserName { get; set; } = string.Empty;

        // Departman
        public int? DepartmentId { get; set; }

        [MaxLength(200)]
        public string? DepartmentName { get; set; }

        // Tedarikçi Bilgileri
        [MaxLength(100)]
        public string? SupplierCode { get; set; }

        [MaxLength(500)]
        public string? SupplierName { get; set; }

        [MaxLength(200)]
        public string? SupplierContact { get; set; }

        [MaxLength(50)]
        public string? SupplierPhone { get; set; }

        [MaxLength(200)]
        public string? SupplierEmail { get; set; }

        public string? SupplierAddress { get; set; }

        // Teslimat Bilgileri
        public string? DeliveryAddress { get; set; }
        public DateTime? RequestedDeliveryDate { get; set; }
        public DateTime? ConfirmedDeliveryDate { get; set; }
        public DateTime? ActualDeliveryDate { get; set; }

        // Sipariş Bilgileri
        public string? Description { get; set; }

        [MaxLength(500)]
        public string? PaymentTerms { get; set; }

        [MaxLength(500)]
        public string? DeliveryTerms { get; set; }

        // Fiyat Bilgileri
        [Column(TypeName = "decimal(18,2)")]
        public decimal? TotalAmount { get; set; }

        [MaxLength(10)]
        public string? Currency { get; set; } = "TRY";

        [Column(TypeName = "decimal(5,2)")]
        public decimal? VATRate { get; set; } = 20.00M;

        [Column(TypeName = "decimal(18,2)")]
        public decimal? VATAmount { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal? GrandTotal { get; set; }

        // Durum
        [Required]
        [MaxLength(50)]
        public string Status { get; set; } = "Draft";
        // Draft, Submitted, SupplierApproval, Confirmed, PartialDelivered, Delivered, Invoiced, Completed, Cancelled

        // Onay Bilgileri
        public DateTime? SubmittedDate { get; set; }
        public DateTime? ApprovalDate { get; set; }
        public int? ApprovedBy { get; set; }
        [MaxLength(500)]
        public string? ApprovalNote { get; set; }

        public DateTime? ConfirmationDate { get; set; }
        public int? ConfirmedBy { get; set; }
        [MaxLength(500)]
        public string? ConfirmationNote { get; set; }

        // İptal
        public DateTime? CancelledDate { get; set; }
        public int? CancelledBy { get; set; }
        [MaxLength(500)]
        public string? CancellationReason { get; set; }

        // Bağlantılı Talepler
        [MaxLength(500)]
        public string? RelatedRequestIds { get; set; } // "123,124,125"

        // Audit
        [Required]
        public int CreatedBy { get; set; }

        [Required]
        public DateTime CreatedAt { get; set; } = DateTime.Now;

        public int? UpdatedBy { get; set; }
        public DateTime? UpdatedAt { get; set; }

        // Navigation Properties
        public virtual ICollection<PurchaseOrderDetail> Details { get; set; } = new List<PurchaseOrderDetail>();
        public virtual ICollection<PurchaseRequest> Requests { get; set; } = new List<PurchaseRequest>();
    }
}