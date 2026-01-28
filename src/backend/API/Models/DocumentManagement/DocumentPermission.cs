// Models/DocumentManagement/DocumentPermission.cs
using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace VervoPortal.Models.DocumentManagement
{
    [Table("VrvDocumentPermissions")]
    public class DocumentPermission
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int DocumentId { get; set; }

        [ForeignKey("DocumentId")]
        public Document Document { get; set; }

        public int? UserId { get; set; } // Redmine users tablosuna referans

        public int? ProjectId { get; set; } // Redmine projects tablosuna referans

        public bool CanView { get; set; } = true;

        public bool CanEdit { get; set; } = false;

        public bool CanDelete { get; set; } = false;

        public DateTime CreatedDate { get; set; } = DateTime.Now;

        [MaxLength(100)]
        public string CreatedBy { get; set; }
    }
}