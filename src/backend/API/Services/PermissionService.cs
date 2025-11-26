// src/backend/API/Services/PermissionService.cs
// Redmine kullanıcı ve grup yetkilendirme servisi
// RedmineService mantığıyla - HttpClient ile doğrudan API çağrısı

using API.Models;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using static API.Models.PermissionModels;

namespace API.Services;

public class PermissionService
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<PermissionService> _logger;
    private readonly IConfiguration _configuration;

    public PermissionService(
        HttpClient httpClient,
        ILogger<PermissionService> logger,
        IConfiguration configuration)
    {
        _httpClient = httpClient;
        _logger = logger;
        _configuration = configuration;
    }

    /// <summary>
    /// Redmine BaseUrl'i configuration'dan al
    /// </summary>
    private string GetRedmineBaseUrl()
    {
        return _configuration["RedmineSettings:BaseUrl"]
            ?? _configuration["Redmine:BaseUrl"]
            ?? "http://192.168.1.17:9292/";
    }

    /// <summary>
    /// Basic Auth header ayarla
    /// </summary>
    private void SetupBasicAuth(string username, string password)
    {
        var credentials = Convert.ToBase64String(Encoding.UTF8.GetBytes($"{username}:{password}"));
        _httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Basic", credentials);
        _httpClient.DefaultRequestHeaders.Accept.Clear();
        _httpClient.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
    }

    /// <summary>
    /// Tüm kullanıcıları ve yetkileri getir
    /// </summary>
    public async Task<List<RedmineUserInfo>?> GetUsersWithPermissions(string username, string password)
    {
        try
        {
            var redmineBaseUrl = GetRedmineBaseUrl();
            if (string.IsNullOrEmpty(redmineBaseUrl))
            {
                _logger.LogError("Redmine BaseUrl not configured");
                return null;
            }

            SetupBasicAuth(username, password);

            // Kullanıcıları çek (limit 100 - ihtiyaca göre artırılabilir)
            var url = $"{redmineBaseUrl.TrimEnd('/')}/users.json?status=1&limit=100";
            _logger.LogInformation("Getting users from Redmine: {Url}", url);

            var response = await _httpClient.GetAsync(url);
            if (!response.IsSuccessStatusCode)
            {
                _logger.LogWarning("Redmine users request failed. Status: {StatusCode}", response.StatusCode);
                return null;
            }

            var content = await response.Content.ReadAsStringAsync();
            var options = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
            var usersResponse = JsonSerializer.Deserialize<RedmineUsersResponse>(content, options);

            if (usersResponse?.Users == null)
                return new List<RedmineUserInfo>();

            var userInfoList = new List<RedmineUserInfo>();

            foreach (var user in usersResponse.Users)
            {
                var userInfo = new RedmineUserInfo
                {
                    Id = user.Id,
                    Login = user.Login,
                    Firstname = user.Firstname,
                    Lastname = user.Lastname,
                    Mail = user.Mail,
                    CreatedOn = user.CreatedOn,
                    UpdatedOn = user.UpdatedOn,
                    LastLoginOn = user.LastLoginOn,
                    Status = user.Status
                };

                // Kullanıcıya ait yetkileri filtrele
                if (user.CustomFields != null)
                {
                    userInfo.Permissions = ExtractPermissionsFromCustomFields(user.CustomFields, "#yetki_kullanici");
                }

                userInfoList.Add(userInfo);
            }

            _logger.LogInformation("Retrieved {Count} users with permissions", userInfoList.Count);
            return userInfoList;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting users with permissions");
            return null;
        }
    }

    /// <summary>
    /// Tüm grupları ve yetkileri getir
    /// </summary>
    public async Task<List<RedmineGroupInfo>?> GetGroupsWithPermissions(string username, string password)
    {
        try
        {
            var redmineBaseUrl = GetRedmineBaseUrl();
            if (string.IsNullOrEmpty(redmineBaseUrl))
            {
                _logger.LogError("Redmine BaseUrl not configured");
                return null;
            }

            SetupBasicAuth(username, password);

            var url = $"{redmineBaseUrl.TrimEnd('/')}/groups.json";
            _logger.LogInformation("Getting groups from Redmine: {Url}", url);

            var response = await _httpClient.GetAsync(url);
            if (!response.IsSuccessStatusCode)
            {
                _logger.LogWarning("Redmine groups request failed. Status: {StatusCode}", response.StatusCode);
                return null;
            }

            var content = await response.Content.ReadAsStringAsync();
            var options = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
            var groupsResponse = JsonSerializer.Deserialize<RedmineGroupsResponse>(content, options);

            if (groupsResponse?.Groups == null)
                return new List<RedmineGroupInfo>();

            var groupInfoList = new List<RedmineGroupInfo>();

            foreach (var group in groupsResponse.Groups)
            {
                // Her grup için detay bilgisi çek
                var groupDetail = await GetGroupDetail(username, password, group.Id);
                if (groupDetail != null)
                {
                    groupInfoList.Add(groupDetail);
                }
            }

            _logger.LogInformation("Retrieved {Count} groups with permissions", groupInfoList.Count);
            return groupInfoList;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting groups with permissions");
            return null;
        }
    }

    /// <summary>
    /// Grup detayını getir (kullanıcılar ve yetkiler dahil)
    /// </summary>
    private async Task<RedmineGroupInfo?> GetGroupDetail(string username, string password, int groupId)
    {
        try
        {
            var redmineBaseUrl = GetRedmineBaseUrl();
            SetupBasicAuth(username, password);

            var url = $"{redmineBaseUrl.TrimEnd('/')}/groups/{groupId}.json?include=users";

            _logger.LogInformation("Getting group detail from Redmine: {Url}", url);

            var response = await _httpClient.GetAsync(url);

            if (!response.IsSuccessStatusCode)
            {
                _logger.LogWarning("Redmine group detail request failed. Status: {StatusCode}", response.StatusCode);
                return null;
            }

            var content = await response.Content.ReadAsStringAsync();
            var options = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };

            // JSON'dan sadece group objesini parse et
            var jsonDoc = JsonDocument.Parse(content);
            var groupElement = jsonDoc.RootElement.GetProperty("group");
            var groupResponse = JsonSerializer.Deserialize<RedmineGroupResponse>(groupElement.GetRawText(), options);

            if (groupResponse == null)
                return null;

            var groupInfo = new RedmineGroupInfo
            {
                Id = groupResponse.Id,
                Name = groupResponse.Name
            };

            // Kullanıcıları ekle
            if (groupResponse.Users != null)
            {
                groupInfo.UserIds = groupResponse.Users.Select(u => u.Id).ToList();
                groupInfo.Users = groupResponse.Users.Select(u => new RedmineUserInfo
                {
                    Id = u.Id,
                    Login = u.Name,
                    Firstname = u.Name,
                    Lastname = ""
                }).ToList();
            }

            // Gruba ait yetkileri filtrele
            if (groupResponse.CustomFields != null)
            {
                groupInfo.Permissions = ExtractGroupPermissionsFromCustomFields(groupResponse.CustomFields, "#yetki_grup");
            }

            return groupInfo;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting group detail for group {GroupId}", groupId);
            return null;
        }
    }

    /// <summary>
    /// Kullanıcı ve grup için tanımlı özel alanları getir
    /// </summary>
    public async Task<(List<RedmineCustomField> userFields, List<RedmineCustomField> groupFields)>
        GetPermissionCustomFields(string username, string password)
    {
        try
        {
            var redmineBaseUrl = GetRedmineBaseUrl();
            if (string.IsNullOrEmpty(redmineBaseUrl))
            {
                _logger.LogError("Redmine BaseUrl not configured");
                return (new List<RedmineCustomField>(), new List<RedmineCustomField>());
            }

            SetupBasicAuth(username, password);

            var url = $"{redmineBaseUrl.TrimEnd('/')}/custom_fields.json";
            _logger.LogInformation("Getting custom fields from Redmine: {Url}", url);

            var response = await _httpClient.GetAsync(url);
            if (!response.IsSuccessStatusCode)
            {
                _logger.LogWarning("Redmine custom fields request failed. Status: {StatusCode}", response.StatusCode);
                return (new List<RedmineCustomField>(), new List<RedmineCustomField>());
            }

            var content = await response.Content.ReadAsStringAsync();
            var options = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
            var fieldsResponse = JsonSerializer.Deserialize<RedmineCustomFieldsResponse>(content, options);

            if (fieldsResponse?.CustomFields == null)
                return (new List<RedmineCustomField>(), new List<RedmineCustomField>());

            // Kullanıcı alanları: description içinde #yetki_kullanici olan
            var userFields = fieldsResponse.CustomFields
                .Where(f => (f.CustomizedType == "user" || f.CustomizedType == "principal") &&
                           !string.IsNullOrEmpty(f.Description) &&
                           f.Description.Contains("#yetki_kullanici", StringComparison.OrdinalIgnoreCase))
                .ToList();

            // Grup alanları: description içinde #yetki_grup olan
            var groupFields = fieldsResponse.CustomFields
                .Where(f => (f.CustomizedType == "group" || f.CustomizedType == "principal") &&
                           !string.IsNullOrEmpty(f.Description) &&
                           f.Description.Contains("#yetki_grup", StringComparison.OrdinalIgnoreCase))
                .ToList();

            _logger.LogInformation("Found {UserFieldCount} user permission fields and {GroupFieldCount} group permission fields",
                userFields.Count, groupFields.Count);

            return (userFields, groupFields);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting permission custom fields");
            return (new List<RedmineCustomField>(), new List<RedmineCustomField>());
        }
    }

    /// <summary>
    /// Kullanıcı yetki bilgisini güncelle
    /// </summary>
    public async Task<bool> UpdateUserPermission(string username, string password, int userId, int customFieldId, string value)
    {
        try
        {
            var redmineBaseUrl = GetRedmineBaseUrl();
            if (string.IsNullOrEmpty(redmineBaseUrl))
            {
                _logger.LogError("Redmine BaseUrl not configured");
                return false;
            }

            SetupBasicAuth(username, password);

            var url = $"{redmineBaseUrl.TrimEnd('/')}/users/{userId}.json";

            var updateData = new
            {
                user = new
                {
                    custom_fields = new[]
                    {
                        new
                        {
                            id = customFieldId,
                            value = value
                        }
                    }
                }
            };

            var json = JsonSerializer.Serialize(updateData);
            var content = new StringContent(json, Encoding.UTF8, "application/json");

            _logger.LogInformation("Updating user {UserId} permission field {CustomFieldId} to {Value}",
                userId, customFieldId, value);

            var response = await _httpClient.PutAsync(url, content);

            if (response.IsSuccessStatusCode)
            {
                _logger.LogInformation("Successfully updated user permission");
                return true;
            }

            _logger.LogWarning("Failed to update user permission. Status: {StatusCode}", response.StatusCode);
            return false;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating user permission");
            return false;
        }
    }

    /// <summary>
    /// Grup yetki bilgisini güncelle
    /// </summary>
    public async Task<bool> UpdateGroupPermission(string username, string password, int groupId, int customFieldId, string value)
    {
        try
        {
            var redmineBaseUrl = GetRedmineBaseUrl();
            if (string.IsNullOrEmpty(redmineBaseUrl))
            {
                _logger.LogError("Redmine BaseUrl not configured");
                return false;
            }

            SetupBasicAuth(username, password);

            var url = $"{redmineBaseUrl.TrimEnd('/')}/groups/{groupId}.json";

            var updateData = new
            {
                group = new
                {
                    custom_fields = new[]
                    {
                        new
                        {
                            id = customFieldId,
                            value = value
                        }
                    }
                }
            };

            var json = JsonSerializer.Serialize(updateData);
            var content = new StringContent(json, Encoding.UTF8, "application/json");

            _logger.LogInformation("Updating group {GroupId} permission field {CustomFieldId} to {Value}",
                groupId, customFieldId, value);

            var response = await _httpClient.PutAsync(url, content);

            if (response.IsSuccessStatusCode)
            {
                _logger.LogInformation("Successfully updated group permission");
                return true;
            }

            _logger.LogWarning("Failed to update group permission. Status: {StatusCode}", response.StatusCode);
            return false;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating group permission");
            return false;
        }
    }

    /// <summary>
    /// Özel alanlardan kullanıcı yetkilerini çıkar
    /// </summary>
    private List<RedmineUserPermission> ExtractPermissionsFromCustomFields(
        List<RedmineCustomFieldValue> customFields, string prefix)
    {
        var permissions = new List<RedmineUserPermission>();

        foreach (var field in customFields)
        {
            if (!string.IsNullOrEmpty(field.Value))
            {
                permissions.Add(new RedmineUserPermission
                {
                    CustomFieldId = field.Id,
                    CustomFieldName = field.Name,
                    PermissionKey = field.Name,
                    PermissionValue = field.Value
                });
            }
        }

        return permissions;
    }

    /// <summary>
    /// Özel alanlardan grup yetkilerini çıkar
    /// </summary>
    private List<RedmineGroupPermission> ExtractGroupPermissionsFromCustomFields(
        List<RedmineCustomFieldValue> customFields, string prefix)
    {
        var permissions = new List<RedmineGroupPermission>();

        foreach (var field in customFields)
        {
            if (!string.IsNullOrEmpty(field.Value))
            {
                permissions.Add(new RedmineGroupPermission
                {
                    CustomFieldId = field.Id,
                    CustomFieldName = field.Name,
                    PermissionKey = field.Name,
                    PermissionValue = field.Value
                });
            }
        }

        return permissions;
    }

    /// <summary>
    /// Login sırasında kullanıcının tüm yetkilerini getir (kullanıcı + grup yetkileri)
    /// </summary>
    public async Task<UserPermissionsResponse?> GetUserPermissionsForLogin(string username, string password, int userId)
    {
        try
        {
            // Kullanıcının kendi yetkilerini al
            var users = await GetUsersWithPermissions(username, password);
            var user = users?.FirstOrDefault(u => u.Id == userId);

            if (user == null)
                return null;

            var response = new UserPermissionsResponse
            {
                UserId = userId,
                Username = user.Login,
                UserPermissions = user.Permissions
            };

            // Kullanıcının üye olduğu grupları ve grup yetkilerini al
            var groups = await GetGroupsWithPermissions(username, password);
            if (groups != null)
            {
                var userGroups = groups.Where(g => g.UserIds.Contains(userId)).ToList();
                foreach (var group in userGroups)
                {
                    response.GroupPermissions.AddRange(group.Permissions);
                }
            }

            // Tüm yetkileri birleştir (grup yetkileri öncelikli)
            response.AllPermissions = new Dictionary<string, string>();

            // Önce kullanıcı yetkilerini ekle
            foreach (var perm in response.UserPermissions)
            {
                response.AllPermissions[perm.PermissionKey] = perm.PermissionValue;
            }

            // Sonra grup yetkilerini ekle (üzerine yaz)
            foreach (var perm in response.GroupPermissions)
            {
                response.AllPermissions[perm.PermissionKey] = perm.PermissionValue;
            }

            return response;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting user permissions for login");
            return null;
        }
    }
}