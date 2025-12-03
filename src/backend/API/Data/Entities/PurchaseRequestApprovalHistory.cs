// src/backend/API/Data/Entities/PurchaseRequestApprovalHistory.cs
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace API.Data.Entities
{
    [Table("PurchaseRequestApprovalHistory")]
    public class PurchaseRequestApprovalHistory
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int RequestId { get; set; }

        [Required]
        [MaxLength(100)]
        public string StepName { get; set; } = string.Empty; // 'Manager Approval', 'Purchasing Review', etc.

        [Required]
        [MaxLength(50)]
        public string Action { get; set; } = string.Empty; // 'Approved', 'Rejected', 'Returned', 'Cancelled'

        // Kullanıcı
        [Required]
        public int UserId { get; set; }

        [Required]
        [MaxLength(200)]
        public string UserName { get; set; } = string.Empty;

        // Tarih ve Notlar
        [Required]
        public DateTime ActionDate { get; set; } = DateTime.Now;

        public string? Notes { get; set; }

        // Navigation Property
        [ForeignKey(nameof(RequestId))]
        public virtual PurchaseRequest Request { get; set; } = null!;
    }
}