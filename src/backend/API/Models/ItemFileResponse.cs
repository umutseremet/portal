namespace API.Models
{
    public class ItemFileResponse
    {
        public int Id { get; set; }
        public int ItemId { get; set; }
        public string FileName { get; set; } = string.Empty;
        public string FilePath { get; set; } = string.Empty;
        public long FileSize { get; set; }
        public string FileExtension { get; set; } = string.Empty;
        public string? FileType { get; set; }
        public string? UploadedBy { get; set; }
        public DateTime UploadedAt { get; set; }
        public string? Description { get; set; }

        // Computed properties
        public string FormattedSize => FormatFileSize(FileSize);
        public string FormattedUploadDate => UploadedAt.ToString("dd.MM.yyyy HH:mm");
        public bool IsPdf => FileExtension.ToLower() == ".pdf";

        private static string FormatFileSize(long bytes)
        {
            string[] sizes = { "B", "KB", "MB", "GB" };
            double len = bytes;
            int order = 0;
            while (len >= 1024 && order < sizes.Length - 1)
            {
                order++;
                len = len / 1024;
            }
            return $"{len:0.##} {sizes[order]}";
        }
    }

    public class GetItemFilesRequest
    {
        public int ItemId { get; set; }
    }

    public class GetItemFilesResponse
    {
        public List<ItemFileResponse> Files { get; set; } = new();
        public int TotalCount { get; set; }
    }

    public class UploadItemFileRequest
    {
        public int ItemId { get; set; }
        public IFormFile File { get; set; } = null!;
        public string? Description { get; set; }
    }

    public class UploadItemFileResponse
    {
        public bool Success { get; set; }
        public string Message { get; set; } = string.Empty;
        public ItemFileResponse? File { get; set; }
    }

    public class DeleteItemFileResponse
    {
        public bool Success { get; set; }
        public string Message { get; set; } = string.Empty;
    }
}