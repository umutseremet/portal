// DTOs/DocumentManagement/DocumentDto.cs
using System;
using System.Collections.Generic;

namespace VervoPortal.DTOs.DocumentManagement
{
    public class DocumentDto
    {
        public int Id { get; set; }
        public int CategoryId { get; set; }
        public string CategoryName { get; set; }
        public string Type { get; set; }
        public string Title { get; set; }
        public string Description { get; set; }
        public DateTime? DocumentDate { get; set; }
        public string CurrentVersion { get; set; }
        public int FileCount { get; set; }
        public string CreatedBy { get; set; }
        public DateTime CreatedDate { get; set; }
        public DateTime? UpdatedDate { get; set; }
        public List<DocumentFileDto> Files { get; set; }
        public List<DocumentVersionDto> Versions { get; set; }
    }

    public class DocumentListDto
    {
        public int Id { get; set; }
        public int CategoryId { get; set; }
        public string Type { get; set; }
        public string Title { get; set; }
        public string Description { get; set; }
        public DateTime? DocumentDate { get; set; }
        public string CurrentVersion { get; set; }
        public int FileCount { get; set; }
        public string CreatedBy { get; set; }
        public DateTime CreatedDate { get; set; }
    }

    public class CreateDocumentDto
    {
        public int CategoryId { get; set; }
        public string Type { get; set; }
        public string Title { get; set; }
        public string Description { get; set; }
        public DateTime? DocumentDate { get; set; }
        public int ViewPermission { get; set; }
    }

    public class UpdateDocumentDto
    {
        public int CategoryId { get; set; }
        public string Type { get; set; }
        public string Title { get; set; }
        public string Description { get; set; }
        public DateTime? DocumentDate { get; set; }
        public int ViewPermission { get; set; }
    }
}