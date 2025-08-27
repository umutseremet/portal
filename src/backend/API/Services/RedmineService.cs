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
}