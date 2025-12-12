// src/backend/API/Services/PermissionService.cs
// Redmine kullanıcı ve grup yetkilendirme servisi
// ✅ SQL + API Hybrid Approach

using API.Models;
using Microsoft.Data.SqlClient;
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
    /// Redmine veritabanı connection string'i al
    /// </summary>
    private string GetRedmineConnectionString()
    {
        return _configuration["ConnectionStrings:RedmineConnection"]
            ?? throw new InvalidOperationException("Redmine connection string not found");
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
    /// ✅ YENİ: SQL'den yetki custom field'larını çek
    /// </summary>
    private async Task<List<RedmineCustomField>> GetPermissionCustomFieldsFromDatabase()
    {
        try
        {
            var connectionString = GetRedmineConnectionString();
            var customFields = new List<RedmineCustomField>();

            using (var connection = new SqlConnection(connectionString))
            {
                await connection.OpenAsync();

                var sql = @"
                    SELECT 
                        id,
                        name,
                        description,
                        type,
                        field_format,
                        is_required,
                        is_filter,
                        searchable,
                        multiple,
                        default_value,
                        visible,
                        possible_values
                    FROM custom_fields
                    WHERE 
                        (
                            (type IN ('UserCustomField') AND description LIKE '%#yetki_kullanici%')
                            OR
                            (type IN ('GroupCustomField') AND description LIKE '%#yetki_grup%')
                        )
                        AND visible = 1
                    ORDER BY name";

                using (var command = new SqlCommand(sql, connection))
                {
                    using (var reader = await command.ExecuteReaderAsync())
                    {
                        while (await reader.ReadAsync())
                        {
                            var customField = new RedmineCustomField
                            {
                                Id = reader.GetInt32(0),
                                Name = reader.GetString(1),
                                Description = reader.IsDBNull(2) ? null : reader.GetString(2),
                                CustomizedType = reader.GetString(3),
                                FieldFormat = reader.GetString(4),
                                IsRequired = reader.GetBoolean(5),
                                IsFilter = reader.GetBoolean(6),
                                Searchable = reader.GetBoolean(7),
                                Multiple = reader.GetBoolean(8),
                                DefaultValue = reader.IsDBNull(9) ? null : reader.GetString(9),
                                Visible = reader.GetBoolean(10)
                            };

                            // Possible values parse et (YAML formatında olabilir)
                            if (!reader.IsDBNull(11))
                            {
                                var possibleValuesText = reader.GetString(11);
                                if (!string.IsNullOrEmpty(possibleValuesText))
                                {
                                    // YAML formatı: "---\n- value1\n- value2\n"
                                    customField.PossibleValues = possibleValuesText
                                        .Split('\n')
                                        .Where(line => line.Trim().StartsWith("- "))
                                        .Select(line => line.Trim().Substring(2))
                                        .ToList();
                                }
                            }

                            customFields.Add(customField);
                        }
                    }
                }
            }

            _logger.LogInformation("✅ SQL'den {Count} yetki custom field bulundu", customFields.Count);
            return customFields;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ SQL'den custom fields çekilirken hata");
            return new List<RedmineCustomField>();
        }
    }

    /// <summary>
    /// Tüm kullanıcıları ve yetkileri getir
    /// ✅ SQL ile custom field tanımlarını alıp API ile değerleri eşleştir
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

            // 1. SQL'den yetki custom field'larını al
            var permissionFields = await GetPermissionCustomFieldsFromDatabase();
            var userPermissionFieldIds = permissionFields
                .Where(f => f.CustomizedType == "UserCustomField" &&
                           !string.IsNullOrEmpty(f.Description) &&
                           f.Description.Contains("#yetki_kullanici", StringComparison.OrdinalIgnoreCase))
                .Select(f => f.Id)
                .ToList();

            _logger.LogInformation("🔍 Kullanıcı yetki field ID'leri: {Ids}", string.Join(", ", userPermissionFieldIds));

            // 2. API'den kullanıcıları ve custom field değerlerini çek
            var url = $"{redmineBaseUrl.TrimEnd('/')}/users.json?status=1&limit=100&include=custom_fields";
            _logger.LogInformation("📡 Getting users from Redmine: {Url}", url);

            var response = await _httpClient.GetAsync(url);
            if (!response.IsSuccessStatusCode)
            {
                _logger.LogWarning("❌ Redmine users request failed. Status: {StatusCode}", response.StatusCode);
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

                // 3. Kullanıcının custom field değerlerini filtrele - sadece yetki alanları
                if (user.Custom_Fields != null)
                {
                    foreach (var field in user.Custom_Fields)
                    {
                        // Sadece yetki field'larını al
                        if (userPermissionFieldIds.Contains(field.Id) && !string.IsNullOrEmpty(field.Value))
                        {
                            // SQL'den gelen field tanımını bul
                            var fieldDefinition = permissionFields.FirstOrDefault(f => f.Id == field.Id);

                            userInfo.Permissions.Add(new RedmineUserPermission
                            {
                                CustomFieldId = field.Id,
                                CustomFieldName = field.Name,
                                PermissionKey = field.Name,
                                PermissionValue = field.Value,
                                Description = fieldDefinition?.Description
                            });
                        }
                    }

                    _logger.LogDebug("👤 User {Login} has {Count} permissions", user.Login, userInfo.Permissions.Count);
                }

                userInfoList.Add(userInfo);
            }

            _logger.LogInformation("✅ Retrieved {Count} users with permissions", userInfoList.Count);
            return userInfoList;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ Error getting users with permissions");
            return null;
        }
    }

    /// <summary>
    /// Tüm grupları ve yetkileri getir
    /// ✅ SQL ile custom field tanımlarını alıp API ile değerleri eşleştir
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

            // 1. SQL'den yetki custom field'larını al
            var permissionFields = await GetPermissionCustomFieldsFromDatabase();
            var groupPermissionFieldIds = permissionFields
                .Where(f => f.CustomizedType == "GroupCustomField" &&
                           !string.IsNullOrEmpty(f.Description) &&
                           f.Description.Contains("#yetki_grup", StringComparison.OrdinalIgnoreCase))
                .Select(f => f.Id)
                .ToList();

            _logger.LogInformation("🔍 Grup yetki field ID'leri: {Ids}", string.Join(", ", groupPermissionFieldIds));

            // 2. API'den grup listesini al
            var url = $"{redmineBaseUrl.TrimEnd('/')}/groups.json";
            _logger.LogInformation("📡 Getting groups from Redmine: {Url}", url);

            var response = await _httpClient.GetAsync(url);
            if (!response.IsSuccessStatusCode)
            {
                _logger.LogWarning("❌ Redmine groups request failed. Status: {StatusCode}", response.StatusCode);
                return null;
            }

            var content = await response.Content.ReadAsStringAsync();
            var options = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
            var groupsResponse = JsonSerializer.Deserialize<RedmineGroupsResponse>(content, options);

            if (groupsResponse?.Groups == null)
                return new List<RedmineGroupInfo>();

            var groupInfoList = new List<RedmineGroupInfo>();

            // 3. Her grup için detay çağrısı yap (custom fields almak için)
            foreach (var group in groupsResponse.Groups)
            {
                var detailedGroup = await GetGroupDetail(username, password, group.Id, groupPermissionFieldIds, permissionFields);
                if (detailedGroup != null)
                {
                    groupInfoList.Add(detailedGroup);
                }
            }

            _logger.LogInformation("✅ Retrieved {Count} groups with permissions", groupInfoList.Count);
            return groupInfoList;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ Error getting groups with permissions");
            return null;
        }
    }

    /// <summary>
    /// Tek bir grubun detayını ve yetkilerini getir
    /// </summary>
    private async Task<RedmineGroupInfo?> GetGroupDetail(
        string username,
        string password,
        int groupId,
        List<int> groupPermissionFieldIds,
        List<RedmineCustomField> permissionFields)
    {
        try
        {
            var redmineBaseUrl = GetRedmineBaseUrl();
            SetupBasicAuth(username, password);

            var url = $"{redmineBaseUrl.TrimEnd('/')}/groups/{groupId}.json?include=users,custom_fields";
            _logger.LogDebug("📡 Getting group detail: {Url}", url);

            var response = await _httpClient.GetAsync(url);
            if (!response.IsSuccessStatusCode)
            {
                _logger.LogWarning("❌ Redmine group detail request failed. Status: {StatusCode}", response.StatusCode);
                return null;
            }

            var content = await response.Content.ReadAsStringAsync();
            var options = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };

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

            // Gruba ait yetkileri filtrele - sadece yetki alanları
            if (groupResponse.CustomFields != null)
            {
                foreach (var field in groupResponse.CustomFields)
                {
                    // Sadece yetki field'larını al
                    if (groupPermissionFieldIds.Contains(field.Id) && !string.IsNullOrEmpty(field.Value))
                    {
                        // SQL'den gelen field tanımını bul
                        var fieldDefinition = permissionFields.FirstOrDefault(f => f.Id == field.Id);

                        groupInfo.Permissions.Add(new RedmineGroupPermission
                        {
                            CustomFieldId = field.Id,
                            CustomFieldName = field.Name,
                            PermissionKey = field.Name,
                            PermissionValue = field.Value,
                            Description = fieldDefinition?.Description
                        });
                    }
                }

                _logger.LogDebug("👥 Group {Name} has {Count} permissions", groupResponse.Name, groupInfo.Permissions.Count);
            }

            return groupInfo;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ Error getting group detail for group {GroupId}", groupId);
            return null;
        }
    }

    /// <summary>
    /// Kullanıcı ve grup için tanımlı özel alanları getir
    /// ✅ SQL'den çek
    /// </summary>
    public async Task<(List<RedmineCustomField> userFields, List<RedmineCustomField> groupFields)>
        GetPermissionCustomFields(string username, string password)
    {
        try
        {
            var allFields = await GetPermissionCustomFieldsFromDatabase();

            // Kullanıcı alanları
            var userFields = allFields
                .Where(f => f.CustomizedType == "UserCustomField" &&
                           !string.IsNullOrEmpty(f.Description) &&
                           f.Description.Contains("#yetki_kullanici", StringComparison.OrdinalIgnoreCase))
                .ToList();

            // Grup alanları
            var groupFields = allFields
                .Where(f => f.CustomizedType == "GroupCustomField" &&
                           !string.IsNullOrEmpty(f.Description) &&
                           f.Description.Contains("#yetki_grup", StringComparison.OrdinalIgnoreCase))
                .ToList();

            _logger.LogInformation("✅ Found {UserFieldCount} user permission fields and {GroupFieldCount} group permission fields",
                userFields.Count, groupFields.Count);

            return (userFields, groupFields);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ Error getting permission custom fields");
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

            _logger.LogInformation("💾 Updating user {UserId} permission - Field: {FieldId}, Value: {Value}",
                userId, customFieldId, value);

            var response = await _httpClient.PutAsync(url, content);
            if (!response.IsSuccessStatusCode)
            {
                var errorContent = await response.Content.ReadAsStringAsync();
                _logger.LogWarning("❌ Redmine user update failed. Status: {StatusCode}, Error: {Error}",
                    response.StatusCode, errorContent);
                return false;
            }

            _logger.LogInformation("✅ Successfully updated user {UserId} permission", userId);
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ Error updating user permission");
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

            _logger.LogInformation("💾 Updating group {GroupId} permission - Field: {FieldId}, Value: {Value}",
                groupId, customFieldId, value);

            var response = await _httpClient.PutAsync(url, content);
            if (!response.IsSuccessStatusCode)
            {
                var errorContent = await response.Content.ReadAsStringAsync();
                _logger.LogWarning("❌ Redmine group update failed. Status: {StatusCode}, Error: {Error}",
                    response.StatusCode, errorContent);
                return false;
            }

            _logger.LogInformation("✅ Successfully updated group {GroupId} permission", groupId);
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ Error updating group permission");
            return false;
        }
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
            _logger.LogError(ex, "❌ Error getting user permissions for login");
            return null;
        }
    }
}