using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;

public class RedmineService
{
    private readonly HttpClient _httpClient;
    private readonly IConfiguration _configuration;
    private readonly ILogger<RedmineService> _logger;

    public RedmineService(HttpClient httpClient, IConfiguration configuration, ILogger<RedmineService> logger)
    {
        _httpClient = httpClient;
        _configuration = configuration;
        _logger = logger;
    }

    // MEVCUT METODUNUZ - DÜZELTME YAPILDI
    public async Task<User?> AuthenticateUserAsync(string username, string password)
    {
        try
        {
            // Farklı configuration key'lerini deneyelim
            var redmineBaseUrl = _configuration["RedmineSettings:BaseUrl"]
                               ?? _configuration["Redmine:BaseUrl"]
                               ?? "http://192.168.1.17:9292/"; // Fallback

            _logger.LogInformation("Using Redmine BaseUrl: {BaseUrl}", redmineBaseUrl);

            if (string.IsNullOrEmpty(redmineBaseUrl))
            {
                _logger.LogError("Redmine BaseUrl not configured in any expected location");
                return null;
            }

            // Create basic auth header
            var authValue = Convert.ToBase64String(Encoding.UTF8.GetBytes($"{username}:{password}"));

            _httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Basic", authValue);
            _httpClient.DefaultRequestHeaders.Accept.Clear();
            _httpClient.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));

            // Call Redmine API
            var response = await _httpClient.GetAsync($"{redmineBaseUrl.TrimEnd('/')}/users/current.json");

            if (!response.IsSuccessStatusCode)
            {
                _logger.LogWarning("Redmine authentication failed for user: {Username}. Status: {StatusCode}",
                    username, response.StatusCode);
                return null;
            }

            var content = await response.Content.ReadAsStringAsync();
            _logger.LogDebug("Redmine response: {Content}", content);

            var options = new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            };

            var redmineResponse = JsonSerializer.Deserialize<RedmineUserResponse>(content, options);

            if (redmineResponse?.User != null)
            {
                _logger.LogInformation("Successfully authenticated user: {Username}", username);
                return redmineResponse.User;
            }

            _logger.LogWarning("No user data in Redmine response for: {Username}", username);
            return null;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during Redmine authentication for user: {Username}", username);
            return null;
        }
    }

    /// <summary>
    /// Redmine API'den zaman kayıtlarını getirir
    /// </summary>
    public async Task<TimeEntriesResult?> GetTimeEntriesAsync(
        string username,
        string password,
        int? userId = null,
        int? projectId = null,
        string? from = null,
        string? to = null,
        int limit = 25,
        int offset = 0)
    {
        try
        {
            var redmineBaseUrl = _configuration["RedmineSettings:BaseUrl"]
                               ?? _configuration["Redmine:BaseUrl"]
                               ?? "http://192.168.1.17:9292/";

            if (string.IsNullOrEmpty(redmineBaseUrl))
            {
                _logger.LogError("Redmine BaseUrl not configured");
                return null;
            }

            // Create basic auth header (mevcut login mantığınızla aynı)
            var authValue = Convert.ToBase64String(Encoding.UTF8.GetBytes($"{username}:{password}"));

            _httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Basic", authValue);
            _httpClient.DefaultRequestHeaders.Accept.Clear();
            _httpClient.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));

            // Query parametrelerini oluştur
            var queryParams = new List<string>
            {
                $"limit={limit}",
                $"offset={offset}"
            };

            if (userId.HasValue)
                queryParams.Add($"user_id={userId.Value}");

            if (projectId.HasValue)
                queryParams.Add($"project_id={projectId.Value}");

            if (!string.IsNullOrEmpty(from))
                queryParams.Add($"from={from}");

            if (!string.IsNullOrEmpty(to))
                queryParams.Add($"to={to}");

            var queryString = string.Join("&", queryParams);
            var url = $"{redmineBaseUrl.TrimEnd('/')}/time_entries.json?{queryString}";

            _logger.LogInformation("Getting time entries from Redmine: {Url}", url);

            // Call Redmine API
            var response = await _httpClient.GetAsync(url);

            if (!response.IsSuccessStatusCode)
            {
                _logger.LogWarning("Redmine time entries request failed. Status: {StatusCode}", response.StatusCode);
                return null;
            }

            var content = await response.Content.ReadAsStringAsync();

            var options = new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            };

            var timeEntriesResponse = JsonSerializer.Deserialize<RedmineTimeEntriesResponse>(content, options);

            if (timeEntriesResponse != null)
            {
                _logger.LogInformation("Successfully retrieved {Count} time entries",
                    timeEntriesResponse.TimeEntries?.Count ?? 0);

                // Basitleştirilmiş return
                return new TimeEntriesResult
                {
                    TimeEntries = timeEntriesResponse.TimeEntries ?? new List<RedmineTimeEntry>()
                };
            }

            return null;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during Redmine time entries request");
            return null;
        }
    }

    /// <summary>
    /// Kullanıcının son faaliyetlerini getirir (zaman kayıtları)
    /// </summary>
    public async Task<TimeEntriesResult?> GetRecentActivitiesAsync(
        string username,
        string password,
        int userId,
        int days = 30,
        int limit = 50)
    {
        var fromDate = DateTime.Now.AddDays(-days).ToString("yyyy-MM-dd");
        return await GetTimeEntriesAsync(username, password, userId, null, fromDate, null, limit, 0);
    }

    /// <summary>
    /// Proje için zaman kayıtlarını getirir
    /// </summary>
    public async Task<TimeEntriesResult?> GetProjectTimeEntriesAsync(
        string username,
        string password,
        int projectId,
        int days = 30,
        int limit = 100)
    {
        var fromDate = DateTime.Now.AddDays(-days).ToString("yyyy-MM-dd");
        return await GetTimeEntriesAsync(username, password, null, projectId, fromDate, null, limit, 0);
    }

    /// <summary>
    /// Configuration durumunu kontrol et
    /// </summary>
    public ConfigurationStatus GetConfigurationStatus()
    {
        var baseUrl = _configuration["RedmineSettings:BaseUrl"]
                    ?? _configuration["Redmine:BaseUrl"];

        var apiKey = _configuration["RedmineSettings:ApiKey"]
                   ?? _configuration["Redmine:ApiKey"];

        return new ConfigurationStatus
        {
            BaseUrlConfigured = !string.IsNullOrEmpty(baseUrl),
            BaseUrl = baseUrl,
            ApiKeyConfigured = !string.IsNullOrEmpty(apiKey),
            ConfigurationValid = !string.IsNullOrEmpty(baseUrl)
        };
    }
}

// Configuration status için yardımcı class
public class ConfigurationStatus
{
    public bool BaseUrlConfigured { get; set; }
    public string? BaseUrl { get; set; }
    public bool ApiKeyConfigured { get; set; }
    public bool ConfigurationValid { get; set; }
}