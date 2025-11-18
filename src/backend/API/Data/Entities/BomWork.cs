using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace API.Data.Entities
{
    /// <summary>
    /// BOM Çalışması - Her çalışma bir projeye bağlıdır ve birden fazla Excel içerebilir
    /// </summary>
    [Table("BomWorks")]
    public class BomWork
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int ProjectId { get; set; }

        /// <summary>
        /// Redmine proje adı (CreateBomWork sırasında frontend'den gelir)
        /// </summary>
        [StringLength(200)]
        public string? ProjectName { get; set; }

        [Required]
        [StringLength(200)]
        public string WorkName { get; set; } = string.Empty;

        [StringLength(500)]
        public string? Description { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.Now;

        public DateTime? UpdatedAt { get; set; }

        [StringLength(100)]
        public string CreatedBy { get; set; } = string.Empty;

        public bool IsActive { get; set; } = true;

        // Navigation Properties
        public virtual ICollection<BomExcel> BomExcels { get; set; } = new List<BomExcel>();
    }
}