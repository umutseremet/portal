// Models/DocumentManagement/DocumentVersion.cs
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace VervoPortal.Models.DocumentManagement
{
    [Table("VrvDocumentVersions")]
    public class DocumentVersion
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int DocumentId { get; set; }

        [ForeignKey("DocumentId")]
        public Document? Document { get; set; }

        [Required]
        [MaxLength(20)]
        public string? VersionNumber { get; set; } // v1.0, v1.1, v2.0

        [Column(TypeName = "nvarchar(max)")]
        public string? ChangeNote { get; set; }

        public ICollection<DocumentFile>? Files { get; set; }

        public DateTime? CreatedDate { get; set; } = DateTime.Now;

        [MaxLength(100)]
        public string? CreatedBy { get; set; }

        public bool IsCurrent { get; set; } = true;
    }
}