// src/backend/API/Controllers/ProjectsController.cs
// GÜNCELLENMIŞ VERSİYON - JWT Token'dan Redmine Credentials Alır

using API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]

#if DEBUG
    // Development'ta JWT'siz test için tüm endpoint'leri aç
#else
    [Authorize] // Sadece Production'da JWT gerekli
#endif
    public class ProjectsController : ControllerBase
    {
        private readonly RedmineService _redmineService;
        private readonly ILogger<ProjectsController> _logger;

        public ProjectsController(RedmineService redmineService, ILogger<ProjectsController> logger)
        {
            _redmineService = redmineService;
            _logger = logger;
        }

        /// <summary>
        /// Redmine projelerini filtreli olarak listeler (JWT korumalı)
        /// ŞİFRE ARTIK FRONTEND'DEN GELMİYOR - JWT TOKEN'DAN ALINACAK
        /// </summary>
        [HttpPost]
        public async Task<IActionResult> GetProjects([FromBody] GetProjectsSimpleRequest request)
        {
            try
            {
                // JWT token'dan kullanıcı bilgilerini al
                var jwtUsername = User.FindFirst("username")?.Value;
                var jwtUserId = User.FindFirst("user_id")?.Value;

                _logger.LogInformation("Getting projects for authenticated user: {Username} with filters: Status={Status}, Name={Name}, Page={Page}",
                    jwtUsername, request.Status, request.Name, request.Page);

                // ⚠️ ŞU ANDA GEÇİCİ ÇÖZÜM: Redmine username'i JWT'den al
                // TODO: Veritabanında User tablosuna RedmineUsername ve RedminePassword kolonları eklenecek
                // TODO: Login sırasında bu bilgiler kaydedilecek ve JWT'ye dahil edilecek

                // GEÇİCİ: Frontend'den gönderilen credentials'ı kullan (sadece development için)
#if DEBUG
                var redmineUsername = request.RedmineUsername ?? jwtUsername;
                var redminePassword = request.RedminePassword ?? string.Empty;
#else
                // Production'da JWT'den alınmalı
                var redmineUsername = User.FindFirst("redmine_username")?.Value ?? jwtUsername;
                var redminePassword = User.FindFirst("redmine_password")?.Value ?? string.Empty;
#endif

                if (string.IsNullOrEmpty(redmineUsername))
                {
                    return Unauthorized(new ErrorResponse { Message = "Redmine kullanıcı bilgisi bulunamadı" });
                }

                // Redmine Service'den projeleri al
                var redmineProjects = await _redmineService.GetProjectsAsync(
                    redmineUsername,
                    redminePassword,
                    request.Status 
                );

                if (redmineProjects == null)
                {
                    _logger.LogWarning("Projects request failed for user: {Username}", jwtUsername);
                    return Unauthorized(new ErrorResponse { Message = "Projeler alınamadı. Redmine bağlantısını kontrol edin." });
                }

                var response = redmineProjects.Projects.Select(p => new ProjectResponse
                {
                    Id = p.Id,
                    Name = p.Name,
                    Identifier = p.Identifier,
                    Description = p.Description,
                    Status = p.Status,
                    IsPublic = p.IsPublic,
                    CreatedOn = p.CreatedOn,
                    UpdatedOn = p.UpdatedOn,
                    Parent = p.Parent != null ? new ProjectParentResponse
                    {
                        Id = p.Parent.Id,
                        Name = p.Parent.Name
                    } : null
                }).ToList();

                _logger.LogInformation("Retrieved {Count} projects for user: {Username}", response.Count, jwtUsername);

                return Ok(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting projects");
                return StatusCode(500, new ErrorResponse { Message = "Projeler alınırken hata oluştu" });
            }
        }

        /// <summary>
        /// Kullanıcının erişebildiği projeleri listeler (JWT korumalı)
        /// </summary>
        [HttpPost("user/{userId}")]
        public async Task<IActionResult> GetUserProjects(int userId, [FromBody] GetProjectSimpleRequest request)
        {
            try
            {
                var jwtUsername = User.FindFirst("username")?.Value;
                var jwtUserId = User.FindFirst("user_id")?.Value;

                if (string.IsNullOrEmpty(jwtUsername))
                {
                    return Unauthorized(new ErrorResponse { Message = "Geçerli authentication token gerekli" });
                }

                _logger.LogInformation("Getting projects for user {UserId} requested by: {Username}", userId, jwtUsername);

                // GEÇİCİ: Frontend'den gönderilen credentials'ı kullan (sadece development için)
#if DEBUG
                var redmineUsername = request.RedmineUsername ?? jwtUsername;
                var redminePassword = request.RedminePassword ?? string.Empty;
#else
                // Production'da JWT'den alınmalı
                var redmineUsername = User.FindFirst("redmine_username")?.Value ?? jwtUsername;
                var redminePassword = User.FindFirst("redmine_password")?.Value ?? string.Empty;
#endif

                var redmineProjects = await _redmineService.GetUserProjectsAsync(
                    redmineUsername,
                    redminePassword,
                    userId,
                    100
                );

                if (redmineProjects == null)
                {
                    _logger.LogWarning("User projects request failed for user: {UserId} requested by: {Username}", userId, jwtUsername);
                    return Unauthorized(new ErrorResponse { Message = "Kullanıcı projeleri alınamadı. Redmine bağlantısını kontrol edin." });
                }

                var response = redmineProjects.Projects.Select(p => new ProjectResponse
                {
                    Id = p.Id,
                    Name = p.Name,
                    Identifier = p.Identifier,
                    Description = p.Description,
                    Status = p.Status,
                    IsPublic = p.IsPublic,
                    CreatedOn = p.CreatedOn,
                    UpdatedOn = p.UpdatedOn,
                    Parent = p.Parent != null ? new ProjectParentResponse
                    {
                        Id = p.Parent.Id,
                        Name = p.Parent.Name
                    } : null
                }).ToList();

                _logger.LogInformation("Retrieved {Count} projects for user {UserId}", response.Count, userId);

                return Ok(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting user projects");
                return StatusCode(500, new ErrorResponse { Message = "Kullanıcı projeleri alınırken hata oluştu" });
            }
        }
    }

    // YENİ MODEL - ŞİFRE OPSİYONEL
    public class GetProjectsSimpleRequest
    {
        public int? Status { get; set; } = 1; // Default: Active projects
        public string? Name { get; set; }
        public int Limit { get; set; } = 100;
        public int Offset { get; set; } = 0;
        public int? Page { get; set; }

        // Geçici - sadece development için
        public string? RedmineUsername { get; set; }
        public string? RedminePassword { get; set; }
    }

    public class GetProjectSimpleRequest
    {
        // Geçici - sadece development için
        public string? RedmineUsername { get; set; }
        public string? RedminePassword { get; set; }
    }

    // ESKİ MODEL (KALDIRILACAK)
    // public class GetProjectsJwtRequest
    // {
    //     public string RedmineUsername { get; set; } = string.Empty;
    //     public string RedminePassword { get; set; } = string.Empty;
    //     ...
    // }
}