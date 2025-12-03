// src/backend/API/Data/Entities/PurchaseOrderHistory.cs
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace API.Data.Entities
{
    [Table("PurchaseOrderHistory")]
    public class PurchaseOrderHistory
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int OrderId { get; set; }

        [Required]
        [MaxLength(100)]
        public string StepName { get; set; } = string.Empty; // 'Order Created', 'Submitted to Supplier', etc.

        [Required]
        [MaxLength(50)]
        public string Action { get; set; } = string.Empty; // 'Created', 'Submitted', 'Approved', 'Confirmed', 'Delivered', 'Cancelled'

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
        [ForeignKey(nameof(OrderId))]
        public virtual PurchaseOrder Order { get; set; } = null!;
    }
}