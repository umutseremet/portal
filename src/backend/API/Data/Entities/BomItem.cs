using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace API.Data.Entities
{
    /// <summary>
    /// BOM Item - Excel'deki her satırı temsil eder
    /// Ürün detayları Items tablosundan gelir, burada sadece Excel'e özel alanlar tutulur
    /// </summary>
    [Table("BomItems")]
    public class BomItem
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int ExcelId { get; set; }

        /// <summary>
        /// Items tablosundaki ürün referansı (Ana ürün bilgileri Items tablosunda)
        /// </summary>
        [Required]
        public int ItemId { get; set; }

        /// <summary>
        /// Excel'deki öğe numarası
        /// </summary>
        [StringLength(50)]
        public string? OgeNo { get; set; }

        /// <summary>
        /// Excel'e özel miktar bilgisi
        /// </summary>
        public int? Miktar { get; set; }

        /// <summary>
        /// Excel'deki satır numarası (sıralama için)
        /// </summary>
        public int RowNumber { get; set; }

        /// <summary>
        /// Excel'e özel notlar veya açıklamalar
        /// </summary>
        [StringLength(500)]
        public string? Notes { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.Now;

        // Navigation Properties
        [ForeignKey("ExcelId")]
        public virtual BomExcel BomExcel { get; set; } = null!;

        /// <summary>
        /// Items tablosundaki ürün bilgisi
        /// </summary>
        [ForeignKey("ItemId")]
        public virtual Item Item { get; set; } = null!;
    }
}