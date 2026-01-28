// Models/DocumentManagement/Document.cs
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace VervoPortal.Models.DocumentManagement
{
    [Table("VrvDocuments")]
    public class Document
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int CategoryId { get; set; }

        [ForeignKey("CategoryId")]
        public DocumentCategory Category { get; set; }

        [Required]
        [MaxLength(50)]
        public string Type { get; set; } // teknik, kalite, operasyon, genel

        [Required]
        [MaxLength(500)]
        public string Title { get; set; }

        [Column(TypeName = "nvarchar(max)")]
        public string Description { get; set; }

        public DateTime? DocumentDate { get; set; }

        [Required]
        [MaxLength(20)]
        public string CurrentVersion { get; set; } = "v1.0";

        public int ViewPermission { get; set; } = 0; // 0=Herkes, 1=Proje, 2=Belirli

        public ICollection<DocumentVersion> Versions { get; set; }

        public ICollection<DocumentFile> Files { get; set; }

        public ICollection<DocumentPermission> Permissions { get; set; }

        public bool IsActive { get; set; } = true;

        public DateTime CreatedDate { get; set; } = DateTime.Now;

        [MaxLength(100)]
        public string CreatedBy { get; set; }

        public DateTime? UpdatedDate { get; set; }

        [MaxLength(100)]
        public string UpdatedBy { get; set; }
    }
}