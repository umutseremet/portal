using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace API.Data.Entities
{
    [Table("ItemFiles")]
    public class ItemFile
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int ItemId { get; set; }

        [Required]
        [MaxLength(255)]
        public string FileName { get; set; } = string.Empty;

        [Required]
        [MaxLength(500)]
        public string FilePath { get; set; } = string.Empty;

        [Required]
        public long FileSize { get; set; }

        [Required]
        [MaxLength(10)]
        public string FileExtension { get; set; } = string.Empty;

        [MaxLength(100)]
        public string? FileType { get; set; }

        [MaxLength(100)]
        public string? UploadedBy { get; set; }

        public DateTime UploadedAt { get; set; } = DateTime.Now;

        public DateTime? UpdatedAt { get; set; }

        [MaxLength(500)]
        public string? Description { get; set; }

        // Navigation property
        [ForeignKey("ItemId")]
        public virtual Item? Item { get; set; }
    }
}