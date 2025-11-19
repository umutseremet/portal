using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace API.Data.Entities
{
    [Table("Items")]
    public class Item
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int Number { get; set; }

        [Required]
        [MaxLength(500)]
        public string Name { get; set; } = string.Empty;

        [Required]
        [MaxLength(50)]
        public string DocNumber { get; set; } = string.Empty;

        [Required]
        [MaxLength(50)]
        public string Code { get; set; } = string.Empty;

        [Required]
        public int GroupId { get; set; }

        public double? X { get; set; }
        public double? Y { get; set; }
        public double? Z { get; set; }

        [MaxLength(500)]
        public string? ImageUrl { get; set; }

        public bool? Cancelled { get; set; } = false;

        // Audit fields
        public DateTime CreatedAt { get; set; } = DateTime.Now;
        public DateTime? UpdatedAt { get; set; }

        // ✅ DEĞİŞTİ: nullable yapıldı
        public string? SupplierCode { get; set; }
        public double? Price { get; set; }  // ✅ DEĞİŞTİ: nullable
        public string? Supplier { get; set; }
        public string? Unit { get; set; }

        // Navigation property
        [ForeignKey("GroupId")]
        public virtual ItemGroup? ItemGroup { get; set; }

        /// <summary>
        /// Teknik resim çalışması tamamlandı mı?
        /// Bu alan sadece Data/CAM Hazırlama ekranından otomatik olarak güncellenir.
        /// Manuel olarak güncellenemez.
        /// </summary>
        public bool TechnicalDrawingCompleted { get; set; } = false;
    }
}