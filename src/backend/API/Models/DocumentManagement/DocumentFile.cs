// Models/DocumentManagement/DocumentFile.cs
using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace VervoPortal.Models.DocumentManagement
{
    [Table("VrvDocumentFiles")]
    public class DocumentFile
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int DocumentId { get; set; }

        [ForeignKey("DocumentId")]
        public Document Document { get; set; }

        [Required]
        public int VersionId { get; set; }

        [ForeignKey("VersionId")]
        public DocumentVersion Version { get; set; }

        [Required]
        [MaxLength(500)]
        public string FileName { get; set; }

        [Required]
        [MaxLength(500)]
        public string FilePath { get; set; }

        [MaxLength(100)]
        public string FileExtension { get; set; }

        public long FileSize { get; set; } // Bytes

        [MaxLength(100)]
        public string ContentType { get; set; }

        public int DownloadCount { get; set; } = 0;

        public DateTime UploadDate { get; set; } = DateTime.Now;

        [MaxLength(100)]
        public string UploadedBy { get; set; }

        public bool IsActive { get; set; } = true;
    }
}