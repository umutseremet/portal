// Models/DocumentManagement/DocumentCategory.cs
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Reflection.Metadata;

namespace VervoPortal.Models.DocumentManagement
{
    [Table("VrvDocumentCategories")]
    public class DocumentCategory
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [MaxLength(200)]
        public string Name { get; set; }

        [MaxLength(10)]
        public string Icon { get; set; } = "📁";

        public int? ParentId { get; set; }

        [ForeignKey("ParentId")]
        public DocumentCategory ParentCategory { get; set; }

        public ICollection<DocumentCategory> ChildCategories { get; set; }

        public ICollection<Document> Documents { get; set; }

        public int DisplayOrder { get; set; } = 0;

        public bool IsActive { get; set; } = true;

        public DateTime CreatedDate { get; set; } = DateTime.Now;

        [MaxLength(100)]
        public string CreatedBy { get; set; }
    }
}