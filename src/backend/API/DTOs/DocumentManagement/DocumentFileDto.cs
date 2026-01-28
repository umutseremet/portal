// DTOs/DocumentManagement/DocumentFileDto.cs
using System;

namespace VervoPortal.DTOs.DocumentManagement
{
    public class DocumentFileDto
    {
        public int Id { get; set; }
        public string FileName { get; set; }
        public string FileExtension { get; set; }
        public long FileSize { get; set; }
        public string FileSizeFormatted { get; set; }
        public int DownloadCount { get; set; }
        public DateTime UploadDate { get; set; }
        public string UploadedBy { get; set; }
        public string VersionNumber { get; set; }
    }
}