// src/backend/API/Data/Entities/PurchaseRequestDetail.cs
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace API.Data.Entities
{
    [Table("PurchaseRequestDetails")]
    public class PurchaseRequestDetail
    {
        [Key]
        public int Id { get; set; }

        // Foreign Key
        [Required]
        public int RequestId { get; set; }

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
        public decimal Quantity { get; set; }

        [MaxLength(50)]
        public string? Unit { get; set; }

        // Açıklama
        public string? Description { get; set; }

        // İhtiyaç Tarihi
        public DateTime? RequiredDate { get; set; }

        // Fiyat Bilgileri (Opsiyonel)
        [Column(TypeName = "decimal(18,2)")]
        public decimal? EstimatedUnitPrice { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal? EstimatedTotalPrice { get; set; }

        [MaxLength(10)]
        public string? Currency { get; set; } = "TRY";

        // Satınalma Sipariş Detay Bağlantısı
        public int? PurchaseOrderDetailId { get; set; }

        // Audit
        public DateTime CreatedAt { get; set; } = DateTime.Now;
        public DateTime? UpdatedAt { get; set; }

        // Navigation Properties
        [ForeignKey(nameof(RequestId))]
        public virtual PurchaseRequest Request { get; set; } = null!;

        [ForeignKey(nameof(ItemId))]
        public virtual Item Item { get; set; } = null!;

        [ForeignKey(nameof(PurchaseOrderDetailId))]
        public virtual PurchaseOrderDetail? PurchaseOrderDetail { get; set; }
    }
}