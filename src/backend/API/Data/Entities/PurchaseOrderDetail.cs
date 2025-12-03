// src/backend/API/Data/Entities/PurchaseOrderDetail.cs
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace API.Data.Entities
{
    [Table("PurchaseOrderDetails")]
    public class PurchaseOrderDetail
    {
        [Key]
        public int Id { get; set; }

        // Foreign Key
        [Required]
        public int OrderId { get; set; }

        // Ürün Bilgileri
        [Required]
        public int ItemId { get; set; }

        [Required]
        [MaxLength(100)]
        public string ItemCode { get; set; } = string.Empty;

        [Required]
        [MaxLength(500)]
        public string ItemName { get; set; } = string.Empty;

        public int? ItemGroupId { get; set; }

        [MaxLength(200)]
        public string? ItemGroupName { get; set; }

        // Miktar
        [Required]
        [Column(TypeName = "decimal(18,3)")]
        public decimal OrderedQuantity { get; set; }

        [Column(TypeName = "decimal(18,3)")]
        public decimal? ReceivedQuantity { get; set; } = 0;

        [MaxLength(50)]
        public string? Unit { get; set; }

        // Fiyat Bilgileri
        [Required]
        [Column(TypeName = "decimal(18,2)")]
        public decimal UnitPrice { get; set; }

        [Required]
        [Column(TypeName = "decimal(18,2)")]
        public decimal TotalPrice { get; set; }

        [MaxLength(10)]
        public string? Currency { get; set; } = "TRY";

        // Teslimat
        public DateTime? RequestedDeliveryDate { get; set; }
        public DateTime? ActualDeliveryDate { get; set; }

        // Açıklama
        public string? Description { get; set; }

        [MaxLength(200)]
        public string? SupplierPartNumber { get; set; }

        // Bağlantılı Talep Detayı
        public int? RequestDetailId { get; set; }

        // Durum
        [Required]
        [MaxLength(50)]
        public string Status { get; set; } = "Pending"; // Pending, Confirmed, PartialReceived, Received, Cancelled

        // Audit
        public DateTime CreatedAt { get; set; } = DateTime.Now;
        public DateTime? UpdatedAt { get; set; }

        // Navigation Properties
        [ForeignKey(nameof(OrderId))]
        public virtual PurchaseOrder Order { get; set; } = null!;

        [ForeignKey(nameof(ItemId))]
        public virtual Item Item { get; set; } = null!;

        [ForeignKey(nameof(RequestDetailId))]
        public virtual PurchaseRequestDetail? RequestDetail { get; set; }
    }
}