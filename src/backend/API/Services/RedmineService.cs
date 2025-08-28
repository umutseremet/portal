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

    // MEVCUT METODUNUZ - AYNI KALACAK
    public async Task<User?> AuthenticateUserAsync(string username, string password)
    {
        try
        {
            var redmineBaseUrl = _configuration["Redmine:BaseUrl"];
            if (string.IsNullOrEmpty(redmineBaseUrl))
            {
                _logger.LogError("Redmine BaseUrl not configured");
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

            return null;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during Redmine authentication for user: {Username}", username);
            return null;
        }
    }

    // YENİ EKLENEN METODLAR - Mevcut metodun altına ekleyin

    /// <summary>
    /// Redmine API'den zaman kayıtlarını getirir
    /// </summary>
    /// <param name="username">Kullanıcı adı</param>
    /// <param name="password">Şifre</param>
    /// <param name="userId">Kullanıcı ID (opsiyonel)</param>
    /// <param name="projectId">Proje ID (opsiyonel)</param>
    /// <param name="from">Başlangıç tarihi (yyyy-MM-dd)</param>
    /// <param name="to">Bitiş tarihi (yyyy-MM-dd)</param>
    /// <param name="limit">Maksimum kayıt sayısı</param>
    /// <param name="offset">Başlangıç indeksi</param>
    /// <returns>Zaman kayıtları</returns>
    // RedmineService.cs dosyanızın GetTimeEntriesAsync metodunu güncelleyin:

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
        var redmineBaseUrl = _configuration["Redmine:BaseUrl"];
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
    /// <param name="username">Kullanıcı adı</param>
    /// <param name="password">Şifre</param>
    /// <param name="userId">Kullanıcı ID</param>
    /// <param name="days">Kaç gün öncesine kadar (varsayılan: 30)</param>
    /// <param name="limit">Maksimum kayıt sayısı (varsayılan: 50)</param>
    /// <returns>Son faaliyetler</returns>
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
    /// <param name="username">Kullanıcı adı</param>
    /// <param name="password">Şifre</param>
    /// <param name="projectId">Proje ID</param>
    /// <param name="days">Kaç gün öncesine kadar (varsayılan: 30)</param>
    /// <param name="limit">Maksimum kayıt sayısı (varsayılan: 100)</param>
    /// <returns>Proje zaman kayıtları</returns>
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
}

 