using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace API.Data.Entities
{
    /// <summary>
    /// BOM Excel Dosyası - Her Excel bir çalışmaya aittir ve birden fazla item içerir
    /// </summary>
    [Table("BomExcels")]
    public class BomExcel
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int WorkId { get; set; }

        [Required]
        [StringLength(255)]
        public string FileName { get; set; } = string.Empty;

        [Required]
        [StringLength(500)]
        public string FilePath { get; set; } = string.Empty;

        public long FileSize { get; set; }

        public int RowCount { get; set; }

        public DateTime UploadedAt { get; set; } = DateTime.Now;

        [StringLength(100)]
        public string UploadedBy { get; set; } = string.Empty;

        public bool IsProcessed { get; set; } = false;

        [StringLength(500)]
        public string? ProcessingNotes { get; set; }

        // Navigation Properties
        [ForeignKey("WorkId")]
        public virtual BomWork BomWork { get; set; } = null!;

        public virtual ICollection<BomItem> BomItems { get; set; } = new List<BomItem>();
    }
}