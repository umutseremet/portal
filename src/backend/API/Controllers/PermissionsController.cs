// src/backend/API/Controllers/PermissionsController.cs
// Redmine kullanıcı ve grup yetkilendirme API

using API.Models;
using API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using static API.Models.PermissionModels;

namespace API.Controllers;

[ApiController]
[Route("api/[controller]")]
#if DEBUG
// Development'ta JWT'siz test için
#else
[Authorize] // Production'da JWT gerekli
#endif
public class PermissionsController : ControllerBase
{
    private readonly PermissionService _permissionService;
    private readonly ILogger<PermissionsController> _logger;

    public PermissionsController(
        PermissionService permissionService,
        ILogger<PermissionsController> logger)
    {
        _permissionService = permissionService;
        _logger = logger;
    }

    /// <summary>
    /// Yetki yönetimi ana ekranı için tüm bilgileri getir
    /// JWT TOKEN'DAN REDMINE CREDENTIALS ALINIYOR
    /// </summary>
    [HttpPost("management")]
    public async Task<IActionResult> GetPermissionManagement()
    {
        try
        {
            // JWT token'dan kullanıcı bilgilerini al
            var jwtUsername = User.FindFirst("username")?.Value;
            var jwtRedmineUsername = User.FindFirst("redmine_username")?.Value ?? jwtUsername;
            var jwtRedminePassword = User.FindFirst("redmine_password")?.Value;

            if (string.IsNullOrEmpty(jwtUsername))
            {
                _logger.LogWarning("JWT token does not contain username");
                return Unauthorized(new { message = "Geçersiz token" });
            }

            //if (string.IsNullOrEmpty(jwtRedminePassword))
            //{
            //    _logger.LogWarning("JWT token does not contain Redmine password for user: {Username}", jwtUsername);
            //    return BadRequest(new
            //    {
            //        message = "Redmine şifresi bulunamadı. Lütfen tekrar giriş yapın.",
            //        requiresRedminePassword = true
            //    });
            //}

            _logger.LogInformation("Getting permission management data for user: {Username}", jwtRedmineUsername);

            // Kullanıcıları getir
            var users = await _permissionService.GetUsersWithPermissions(jwtRedmineUsername, jwtRedminePassword);
            if (users == null)
            {
                _logger.LogWarning("Failed to get users from Redmine for user: {Username}", jwtRedmineUsername);
                return BadRequest(new
                {
                    message = "Kullanıcılar alınamadı. Redmine bağlantısını ve kullanıcı bilgilerini kontrol edin.",
                    username = jwtRedmineUsername
                });
            }

            // Grupları getir
            var groups = await _permissionService.GetGroupsWithPermissions(jwtRedmineUsername, jwtRedminePassword);
            if (groups == null)
            {
                _logger.LogWarning("Failed to get groups from Redmine for user: {Username}", jwtRedmineUsername);
                return BadRequest(new
                {
                    message = "Gruplar alınamadı. Redmine bağlantısını ve kullanıcı bilgilerini kontrol edin.",
                    username = jwtRedmineUsername
                });
            }

            // Özel alanları getir
            var (userFields, groupFields) = await _permissionService.GetPermissionCustomFields(
                jwtRedmineUsername, jwtRedminePassword);

            var response = new PermissionManagementResponse
            {
                Users = users,
                Groups = groups,
                UserCustomFields = userFields,
                GroupCustomFields = groupFields
            };

            _logger.LogInformation("Successfully retrieved permission management data: {UserCount} users, {GroupCount} groups",
                users.Count, groups.Count);

            return Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting permission management data");
            return StatusCode(500, new { message = "Sunucu hatası", error = ex.Message });
        }
    }

    /// <summary>
    /// Kullanıcıları listele - JWT TOKEN'DAN CREDENTİALS
    /// </summary>
    [HttpPost("users")]
    public async Task<IActionResult> GetUsers()
    {
        try
        {
            var jwtUsername = User.FindFirst("username")?.Value;
            var jwtRedmineUsername = User.FindFirst("redmine_username")?.Value ?? jwtUsername;
            var jwtRedminePassword = User.FindFirst("redmine_password")?.Value;

            if (string.IsNullOrEmpty(jwtRedminePassword))
            {
                return BadRequest(new { message = "Redmine şifresi bulunamadı" });
            }

            _logger.LogInformation("Getting users with permissions for: {Username}", jwtRedmineUsername);

            var users = await _permissionService.GetUsersWithPermissions(jwtRedmineUsername, jwtRedminePassword);
            if (users == null)
            {
                return BadRequest(new { message = "Kullanıcılar alınamadı" });
            }

            return Ok(users);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting users");
            return StatusCode(500, new { message = "Sunucu hatası", error = ex.Message });
        }
    }

    /// <summary>
    /// Grupları listele - JWT TOKEN'DAN CREDENTİALS
    /// </summary>
    [HttpPost("groups")]
    public async Task<IActionResult> GetGroups()
    {
        try
        {
            var jwtUsername = User.FindFirst("username")?.Value;
            var jwtRedmineUsername = User.FindFirst("redmine_username")?.Value ?? jwtUsername;
            var jwtRedminePassword = User.FindFirst("redmine_password")?.Value;

            if (string.IsNullOrEmpty(jwtRedminePassword))
            {
                return BadRequest(new { message = "Redmine şifresi bulunamadı" });
            }

            _logger.LogInformation("Getting groups with permissions for: {Username}", jwtRedmineUsername);

            var groups = await _permissionService.GetGroupsWithPermissions(jwtRedmineUsername, jwtRedminePassword);
            if (groups == null)
            {
                return BadRequest(new { message = "Gruplar alınamadı" });
            }

            return Ok(groups);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting groups");
            return StatusCode(500, new { message = "Sunucu hatası", error = ex.Message });
        }
    }

    /// <summary>
    /// Yetki için kullanılan özel alanları getir - JWT TOKEN'DAN CREDENTİALS
    /// </summary>
    [HttpPost("custom-fields")]
    public async Task<IActionResult> GetCustomFields()
    {
        try
        {
            var jwtUsername = User.FindFirst("username")?.Value;
            var jwtRedmineUsername = User.FindFirst("redmine_username")?.Value ?? jwtUsername;
            var jwtRedminePassword = User.FindFirst("redmine_password")?.Value;

            if (string.IsNullOrEmpty(jwtRedminePassword))
            {
                return BadRequest(new { message = "Redmine şifresi bulunamadı" });
            }

            _logger.LogInformation("Getting permission custom fields for: {Username}", jwtRedmineUsername);

            var (userFields, groupFields) = await _permissionService.GetPermissionCustomFields(
                jwtRedmineUsername, jwtRedminePassword);

            return Ok(new
            {
                userCustomFields = userFields,
                groupCustomFields = groupFields
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting custom fields");
            return StatusCode(500, new { message = "Sunucu hatası", error = ex.Message });
        }
    }

    /// <summary>
    /// Kullanıcı yetki güncelle - JWT TOKEN'DAN CREDENTİALS
    /// </summary>
    [HttpPut("users/{userId}/permissions")]
    public async Task<IActionResult> UpdateUserPermission(
        int userId,
        [FromBody] UpdateUserPermissionRequest request)
    {
        try
        {
            var jwtUsername = User.FindFirst("username")?.Value;
            var jwtRedmineUsername = User.FindFirst("redmine_username")?.Value ?? jwtUsername;
            var jwtRedminePassword = User.FindFirst("redmine_password")?.Value;

            if (string.IsNullOrEmpty(jwtRedminePassword))
            {
                return BadRequest(new { message = "Redmine şifresi bulunamadı" });
            }

            _logger.LogInformation("Updating user {UserId} permission by {Username}", userId, jwtRedmineUsername);

            var success = await _permissionService.UpdateUserPermission(
                jwtRedmineUsername,
                jwtRedminePassword,
                userId,
                request.CustomFieldId,
                request.Value);

            if (success)
            {
                return Ok(new { message = "Kullanıcı yetkisi güncellendi" });
            }

            return BadRequest(new { message = "Yetki güncellenemedi" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating user permission");
            return StatusCode(500, new { message = "Sunucu hatası", error = ex.Message });
        }
    }

    /// <summary>
    /// Grup yetki güncelle - JWT TOKEN'DAN CREDENTİALS
    /// </summary>
    [HttpPut("groups/{groupId}/permissions")]
    public async Task<IActionResult> UpdateGroupPermission(
        int groupId,
        [FromBody] UpdateGroupPermissionRequest request)
    {
        try
        {
            var jwtUsername = User.FindFirst("username")?.Value;
            var jwtRedmineUsername = User.FindFirst("redmine_username")?.Value ?? jwtUsername;
            var jwtRedminePassword = User.FindFirst("redmine_password")?.Value;

            if (string.IsNullOrEmpty(jwtRedminePassword))
            {
                return BadRequest(new { message = "Redmine şifresi bulunamadı" });
            }

            _logger.LogInformation("Updating group {GroupId} permission by {Username}", groupId, jwtRedmineUsername);

            var success = await _permissionService.UpdateGroupPermission(
                jwtRedmineUsername,
                jwtRedminePassword,
                groupId,
                request.CustomFieldId,
                request.Value);

            if (success)
            {
                return Ok(new { message = "Grup yetkisi güncellendi" });
            }

            return BadRequest(new { message = "Yetki güncellenemedi" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating group permission");
            return StatusCode(500, new { message = "Sunucu hatası", error = ex.Message });
        }
    }

    /// <summary>
    /// Login sırasında kullanıcı yetkilerini getir - JWT TOKEN'DAN CREDENTİALS
    /// </summary>
    [HttpPost("user-login-permissions")]
    public async Task<IActionResult> GetUserLoginPermissions([FromBody] UserLoginPermissionsRequest request)
    {
        try
        {
            var jwtUsername = User.FindFirst("username")?.Value;
            var jwtRedmineUsername = User.FindFirst("redmine_username")?.Value ?? jwtUsername;
            var jwtRedminePassword = User.FindFirst("redmine_password")?.Value;

            if (string.IsNullOrEmpty(jwtRedminePassword))
            {
                _logger.LogWarning("❌ Redmine password not found in JWT for user: {Username}", jwtUsername);
                return BadRequest(new { message = "Redmine şifresi bulunamadı" });
            }

            _logger.LogInformation("🔑 Getting login permissions for user {UserId} by {Username}",
                request.UserId, jwtRedmineUsername);

            var permissions = await _permissionService.GetUserPermissionsForLogin(
                jwtRedmineUsername,
                jwtRedminePassword,
                request.UserId);

            if (permissions == null)
            {
                _logger.LogWarning("❌ User {UserId} not found", request.UserId);
                return NotFound(new { message = "Kullanıcı bulunamadı" });
            }

            // ✅ Response formatı - frontend'in beklediği yapı
            var response = new
            {
                userId = permissions.UserId,
                username = permissions.Username,
                allPermissions = permissions.AllPermissions,  // Dictionary<string, string>
                userPermissions = permissions.UserPermissions,
                groupPermissions = permissions.GroupPermissions,
                isAdmin = permissions.IsAdmin  // ✅ IsAdmin eklendi
            };

            _logger.LogInformation("✅ Permissions returned for user {UserId}: {PermCount} total, isAdmin: {IsAdmin}",
                request.UserId, permissions.AllPermissions.Count, permissions.IsAdmin);

            return Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ Error getting user login permissions");
            return StatusCode(500, new { message = "Sunucu hatası", error = ex.Message });
        }
    }
}

// Request Models - JWT'den credentials alındığı için basitleştirildi
public class UpdateUserPermissionRequest
{
    public int CustomFieldId { get; set; }
    public string Value { get; set; } = string.Empty;
}

public class UpdateGroupPermissionRequest
{
    public int CustomFieldId { get; set; }
    public string Value { get; set; } = string.Empty;
}

public class UserLoginPermissionsRequest
{
    public int UserId { get; set; }
}