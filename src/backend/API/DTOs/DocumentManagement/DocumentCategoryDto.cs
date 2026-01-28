// DTOs/DocumentManagement/DocumentCategoryDto.cs
using System.Collections.Generic;

namespace VervoPortal.DTOs.DocumentManagement
{
    public class DocumentCategoryDto
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public string Icon { get; set; }
        public int? ParentId { get; set; }
        public int DisplayOrder { get; set; }
        public List<DocumentCategoryDto> Children { get; set; }
    }

    public class CreateDocumentCategoryDto
    {
        public string Name { get; set; }
        public string Icon { get; set; }
        public int? ParentId { get; set; }
    }
}