// DTOs/DocumentManagement/DocumentVersionDto.cs
using System;

namespace VervoPortal.DTOs.DocumentManagement
{
    public class DocumentVersionDto
    {
        public int? Id { get; set; }
        public string? VersionNumber { get; set; }
        public string? ChangeNote { get; set; }
        public DateTime? CreatedDate { get; set; }
        public string? CreatedBy { get; set; }
        public bool? IsCurrent { get; set; }
    }

    public class CreateDocumentVersionDto
    {
        public int? DocumentId { get; set; }
        public string? VersionNumber { get; set; }
        public string? ChangeNote { get; set; }
    }
}