// src/backend/API/Data/Entities/PurchaseRequest.cs
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace API.Data.Entities
{
    [Table("PurchaseRequests")]
    public class PurchaseRequest
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [MaxLength(50)]
        public string RequestNumber { get; set; } = string.Empty;

        [Required]
        public DateTime RequestDate { get; set; } = DateTime.Now;

        // Kullanıcı Bilgileri (Redmine)
        [Required]
        public int UserId { get; set; }

        [Required]
        [MaxLength(200)]
        public string UserName { get; set; } = string.Empty;

        // Departman (Redmine Custom Field)
        public int? DepartmentId { get; set; }

        [MaxLength(200)]
        public string? DepartmentName { get; set; }

        // Talep Bilgileri
        public string? Description { get; set; }

        [Required]
        [MaxLength(50)]
        public string Priority { get; set; } = "Normal"; // Normal, Urgent, Critical

        [Required]
        [MaxLength(50)]
        public string RequestType { get; set; } = "Standard"; // Standard, Emergency, Project

        // Durum
        [Required]
        [MaxLength(50)]
        public string Status { get; set; } = "Draft";
        // Draft, Submitted, ManagerApproval, PurchasingReview, Approved, Rejected, Cancelled, Completed

        // Onay Bilgileri
        public DateTime? SubmittedDate { get; set; }

        public DateTime? ManagerApprovalDate { get; set; }
        public int? ManagerApprovedBy { get; set; }
        [MaxLength(500)]
        public string? ManagerApprovalNote { get; set; }

        public DateTime? PurchasingReviewDate { get; set; }
        public int? PurchasingReviewedBy { get; set; }
        [MaxLength(500)]
        public string? PurchasingReviewNote { get; set; }

        public DateTime? FinalApprovalDate { get; set; }
        public int? FinalApprovedBy { get; set; }
        [MaxLength(500)]
        public string? FinalApprovalNote { get; set; }

        public DateTime? RejectionDate { get; set; }
        public int? RejectedBy { get; set; }
        [MaxLength(500)]
        public string? RejectionReason { get; set; }

        // Satınalma Sipariş Bağlantısı
        public int? PurchaseOrderId { get; set; }

        // İptal
        public DateTime? CancelledDate { get; set; }
        public int? CancelledBy { get; set; }
        [MaxLength(500)]
        public string? CancellationReason { get; set; }

        // Audit Fields
        [Required]
        public int CreatedBy { get; set; }

        [Required]
        public DateTime CreatedAt { get; set; } = DateTime.Now;

        public int? UpdatedBy { get; set; }
        public DateTime? UpdatedAt { get; set; }

        // Navigation Properties
        public virtual ICollection<PurchaseRequestDetail> Details { get; set; } = new List<PurchaseRequestDetail>();

        [ForeignKey(nameof(PurchaseOrderId))]
        public virtual PurchaseOrder? PurchaseOrder { get; set; }
    }
}