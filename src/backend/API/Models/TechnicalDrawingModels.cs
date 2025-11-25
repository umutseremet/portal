namespace API.Models
{
    // src/backend/API/Models/TechnicalDrawingModels.cs - Eklenecek modeller

    public class DownloadLogResponse
    {
        public int Id { get; set; }
        public int WorkId { get; set; }
        public string WorkName { get; set; } = string.Empty;
        public int? ProjectId { get; set; }
        public string ZipFileName { get; set; } = string.Empty;
        public long ZipFileSize { get; set; }
        public double ZipFileSizeMB { get; set; }
        public int ItemCount { get; set; }
        public int FileCount { get; set; }
        public string? SelectedGroupIds { get; set; }
        public string DownloadedBy { get; set; } = string.Empty;
        public DateTime DownloadedAt { get; set; }
        public string? IpAddress { get; set; }
        public int? ProcessingTimeMs { get; set; }
    }

    public class GetDownloadLogsResponse
    {
        public List<DownloadLogResponse> Logs { get; set; } = new();
        public int TotalCount { get; set; }
        public int Page { get; set; }
        public int PageSize { get; set; }
        public int TotalPages { get; set; }
    }

    public class DownloadStatsResponse
    {
        public int TotalDownloads { get; set; }
        public double TotalSizeMB { get; set; }
        public int TotalFiles { get; set; }
        public int AverageProcessingTimeMs { get; set; }
        public DateTime? LastDownloadDate { get; set; }
        public List<TopDownloaderInfo> TopDownloaders { get; set; } = new();
    }

    public class TopDownloaderInfo
    {
        public string Username { get; set; } = string.Empty;
        public int DownloadCount { get; set; }
        public double TotalSizeMB { get; set; }
    }
}
