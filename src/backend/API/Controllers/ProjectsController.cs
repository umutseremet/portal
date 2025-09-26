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
        /// </summary>
        [HttpPost] // POST kullanarak credentials'ı body'de gönderelim
        public async Task<IActionResult> GetProjects([FromBody] GetProjectsJwtRequest request)
        {
            try
            {
                // JWT token'dan kullanıcı bilgilerini al
                var jwtUsername = User.FindFirst("username")?.Value;
                var jwtUserId = User.FindFirst("user_id")?.Value;

                //if (string.IsNullOrEmpty(jwtUsername))
                //{
                //    return Unauthorized(new ErrorResponse { Message = "Geçerli authentication token gerekli" });
                //}

                _logger.LogInformation("Getting projects for authenticated user: {Username} with filters: Status={Status}, Name={Name}, Page={Page}",
                    jwtUsername, request.Status, request.Name, request.Page);

                // Redmine Service'den projeleri al
                var redmineProjects = await _redmineService.GetProjectsAsync(
                    request.RedmineUsername,
                    request.RedminePassword,
                    request.Status,
                    request.Name,
                    request.Limit,
                    request.Offset
                );

                if (redmineProjects == null)
                {
                    _logger.LogWarning("Projects request failed for user: {Username}", jwtUsername);
                    return Unauthorized(new ErrorResponse { Message = "Projeler alınamadı. Redmine credentials'ını kontrol edin." });
                }

                // Toplam kayıt sayısı
                var totalCount = redmineProjects.TotalCount;
                var totalPages = (int)Math.Ceiling(totalCount / (double)request.PageSize);

                var response = new GetProjectsResponse
                {
                    Projects = redmineProjects.Projects.Select(p => new ProjectResponse
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
                    }).ToList(),
                    TotalCount = totalCount,
                    Page = request.Page,
                    PageSize = request.PageSize,
                    TotalPages = totalPages,
                    HasNextPage = request.Page < totalPages,
                    HasPreviousPage = request.Page > 1,
                    RequestedBy = jwtUsername // JWT'den gelen kullanıcı
                };

                _logger.LogInformation("Retrieved {Count} projects out of {Total} total for user: {Username}, Page: {Page}/{TotalPages}",
                    redmineProjects.Projects.Count, totalCount, jwtUsername, request.Page, totalPages);

                return Ok(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting projects");
                return StatusCode(500, new ErrorResponse { Message = "Projeler alınırken hata oluştu" });
            }
        }

        /// <summary>
        /// ID'ye göre tek proje getirir (JWT korumalı)
        /// </summary>
        [HttpPost("{id}")]
        public async Task<IActionResult> GetProject(int id, [FromBody] GetProjectJwtRequest request)
        {
            try
            {
                // JWT token'dan kullanıcı bilgilerini al
                var jwtUsername = User.FindFirst("username")?.Value;

                if (string.IsNullOrEmpty(jwtUsername))
                {
                    return Unauthorized(new ErrorResponse { Message = "Geçerli authentication token gerekli" });
                }

                _logger.LogInformation("Getting project {Id} for authenticated user: {Username}", id, jwtUsername);

                var project = await _redmineService.GetProjectByIdAsync(
                    request.RedmineUsername,
                    request.RedminePassword,
                    id
                );

                if (project == null)
                {
                    _logger.LogWarning("Project not found with ID: {Id} for user: {Username}", id, jwtUsername);
                    return NotFound(new ErrorResponse { Message = "Proje bulunamadı" });
                }

                var response = new ProjectResponse
                {
                    Id = project.Id,
                    Name = project.Name,
                    Identifier = project.Identifier,
                    Description = project.Description,
                    Status = project.Status,
                    IsPublic = project.IsPublic,
                    CreatedOn = project.CreatedOn,
                    UpdatedOn = project.UpdatedOn,
                    Parent = project.Parent != null ? new ProjectParentResponse
                    {
                        Id = project.Parent.Id,
                        Name = project.Parent.Name
                    } : null
                };

                _logger.LogInformation("Retrieved project: {Id} - {Name} for user: {Username}",
                    project.Id, project.Name, jwtUsername);

                return Ok(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting project with ID: {Id}", id);
                return StatusCode(500, new ErrorResponse { Message = "Proje alınırken hata oluştu" });
            }
        }

        /// <summary>
        /// Sadece aktif projeleri listeler (JWT korumalı)
        /// </summary>
        [HttpPost("active")]
        public async Task<IActionResult> GetActiveProjects([FromBody] GetProjectJwtRequest request)
        {
            try
            {
                // JWT token'dan kullanıcı bilgilerini al
                var jwtUsername = User.FindFirst("username")?.Value;

                if (string.IsNullOrEmpty(jwtUsername))
                {
                    return Unauthorized(new ErrorResponse { Message = "Geçerli authentication token gerekli" });
                }

                _logger.LogInformation("Getting active projects for authenticated user: {Username}", jwtUsername);

                var redmineProjects = await _redmineService.GetActiveProjectsAsync(
                    request.RedmineUsername,
                    request.RedminePassword,
                    100 // Aktif projeler için daha yüksek limit
                );

                if (redmineProjects == null)
                {
                    _logger.LogWarning("Active projects request failed for user: {Username}", jwtUsername);
                    return Unauthorized(new ErrorResponse { Message = "Aktif projeler alınamadı. Redmine credentials'ını kontrol edin." });
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

                _logger.LogInformation("Retrieved {Count} active projects for user: {Username}", response.Count, jwtUsername);

                return Ok(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting active projects");
                return StatusCode(500, new ErrorResponse { Message = "Aktif projeler alınırken hata oluştu" });
            }
        }

        /// <summary>
        /// Kullanıcının erişebildiği projeleri listeler (JWT korumalı)
        /// </summary>
        [HttpPost("user/{userId}")]
        public async Task<IActionResult> GetUserProjects(int userId, [FromBody] GetProjectJwtRequest request)
        {
            try
            {
                // JWT token'dan kullanıcı bilgilerini al
                var jwtUsername = User.FindFirst("username")?.Value;
                var jwtUserId = User.FindFirst("user_id")?.Value;

                if (string.IsNullOrEmpty(jwtUsername))
                {
                    return Unauthorized(new ErrorResponse { Message = "Geçerli authentication token gerekli" });
                }

                _logger.LogInformation("Getting projects for user {UserId} requested by: {Username}", userId, jwtUsername);

                var redmineProjects = await _redmineService.GetUserProjectsAsync(
                    request.RedmineUsername,
                    request.RedminePassword,
                    userId,
                    100
                );

                if (redmineProjects == null)
                {
                    _logger.LogWarning("User projects request failed for user: {UserId} requested by: {Username}", userId, jwtUsername);
                    return Unauthorized(new ErrorResponse { Message = "Kullanıcı projeleri alınamadı. Redmine credentials'ını kontrol edin." });
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

                _logger.LogInformation("Retrieved {Count} projects for user: {UserId} requested by: {Username}", response.Count, userId, jwtUsername);

                return Ok(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting projects for user: {UserId}", userId);
                return StatusCode(500, new ErrorResponse { Message = "Kullanıcı projeleri alınırken hata oluştu" });
            }
        }

        /// <summary>
        /// Proje istatistikleri (JWT korumalı)
        /// </summary>
        [HttpPost("stats")]
        public async Task<IActionResult> GetProjectStats([FromBody] GetProjectJwtRequest request)
        {
            try
            {
                // JWT token'dan kullanıcı bilgilerini al
                var jwtUsername = User.FindFirst("username")?.Value;

                if (string.IsNullOrEmpty(jwtUsername))
                {
                    return Unauthorized(new ErrorResponse { Message = "Geçerli authentication token gerekli" });
                }

                _logger.LogInformation("Getting project statistics for authenticated user: {Username}", jwtUsername);

                var projects = await _redmineService.GetProjectsAsync(
                    request.RedmineUsername,
                    request.RedminePassword,
                    null, // Tüm statuslar
                    null, // Tüm isimler
                    1000, // Yüksek limit
                    0
                );

                if (projects == null)
                {
                    return Unauthorized(new ErrorResponse { Message = "Proje istatistikleri alınamadı" });
                }

                var stats = new ProjectStatsResponse
                {
                    TotalProjects = projects.TotalCount,
                    ActiveProjects = projects.Projects.Count(p => p.Status == 1),
                    ClosedProjects = projects.Projects.Count(p => p.Status == 5),
                    PublicProjects = projects.Projects.Count(p => p.IsPublic),
                    PrivateProjects = projects.Projects.Count(p => !p.IsPublic),
                    RequestedBy = jwtUsername
                };

                // En son güncellenen projeler (son 7 gün)
                var recentlyUpdated = projects.Projects
                    .Where(p => p.UpdatedOn >= DateTime.Now.AddDays(-7))
                    .OrderByDescending(p => p.UpdatedOn)
                    .Take(5)
                    .Select(p => new RecentProjectResponse
                    {
                        Id = p.Id,
                        Name = p.Name,
                        Identifier = p.Identifier,
                        UpdatedOn = p.UpdatedOn
                    })
                    .ToList();

                stats.RecentlyUpdatedProjects = recentlyUpdated;

                _logger.LogInformation("Project statistics calculated for user {Username}: Total={Total}, Active={Active}, Closed={Closed}",
                    jwtUsername, stats.TotalProjects, stats.ActiveProjects, stats.ClosedProjects);

                return Ok(stats);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting project statistics");
                return StatusCode(500, new ErrorResponse { Message = "Proje istatistikleri alınırken hata oluştu" });
            }
        }

        /// <summary>
        /// Test endpoint - Development için Redmine bağlantı testi (JWT korumalı)
        /// </summary>
        [HttpPost("debug")]
#if DEBUG
        [AllowAnonymous] // Development'ta test için açık
#endif
        public async Task<IActionResult> GetDebugInfo([FromBody] GetProjectDebugRequest request)
        {
            try
            {
                // JWT var mı kontrol et (development'ta opsiyonel)
                var jwtUsername = User.FindFirst("username")?.Value;

                _logger.LogInformation("Debug request from user: {Username}", jwtUsername ?? "Anonymous");

                var configStatus = _redmineService.GetConfigurationStatus();

                // Auth test
                var authTest = await _redmineService.AuthenticateUserAsync(request.Username, request.Password);

                return Ok(new
                {
                    JwtUser = jwtUsername ?? "Not authenticated",
                    RedmineConfiguration = new
                    {
                        BaseUrlConfigured = configStatus.BaseUrlConfigured,
                        BaseUrl = configStatus.BaseUrl,
                        ApiKeyConfigured = configStatus.ApiKeyConfigured,
                        ConfigurationValid = configStatus.ConfigurationValid
                    },
                    RedmineAuthTest = authTest != null ? "Success" : "Failed",
                    RedmineUserInfo = authTest != null ? new
                    {
                        Id = authTest.Id,
                        Login = authTest.Login,
                        FirstName = authTest.FirstName,
                        LastName = authTest.LastName,
                        Email = authTest.Mail
                    } : null,
                    Timestamp = DateTime.UtcNow
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Debug endpoint error");
                return StatusCode(500, new
                {
                    Error = ex.Message,
                    Timestamp = DateTime.UtcNow
                });
            }
        }
    }
}