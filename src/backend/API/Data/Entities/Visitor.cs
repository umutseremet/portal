using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace API.Data.Entities
{
    [Table("Visitors")]
    public class Visitor
    {
        [Key]
        [Column("id")]
        public int Id { get; set; }

        [Column("date")]
        public DateTime? Date { get; set; }

        [Column("company")]
        [MaxLength(100)]
        public string? Company { get; set; }

        [Column("visitor")]
        [MaxLength(255)]
        public string? VisitorName { get; set; }

        [Column("description")]
        [MaxLength(500)]
        public string? Description { get; set; }

        // Audit fields (opsiyonel - gelecekte kullanılabilir)
        public DateTime CreatedAt { get; set; } = DateTime.Now;
        public DateTime? UpdatedAt { get; set; }
    }
}