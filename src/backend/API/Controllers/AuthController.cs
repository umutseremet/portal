using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly RedmineService _redmineService;
    private readonly IConfiguration _configuration;
    private readonly ILogger<AuthController> _logger;

    public AuthController(RedmineService redmineService, IConfiguration configuration, ILogger<AuthController> logger)
    {
        _redmineService = redmineService;
        _configuration = configuration;
        _logger = logger;
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(new ErrorResponse { Message = "Geçersiz giriş bilgileri" });
            }

            _logger.LogInformation("Login attempt for username: {Username}", request.Username);

            // Configuration durumunu kontrol et
            var configStatus = _redmineService.GetConfigurationStatus();
            _logger.LogInformation("Redmine configuration status: BaseUrl={BaseUrl}, Valid={Valid}",
                configStatus.BaseUrl, configStatus.ConfigurationValid);

            if (!configStatus.ConfigurationValid)
            {
                _logger.LogError("Redmine configuration is invalid");
                return StatusCode(500, new ErrorResponse { Message = "Sunucu konfigürasyon hatası" });
            }

            // Redmine ile kimlik doğrulama
            var user = await _redmineService.AuthenticateUserAsync(request.Username, request.Password);

            if (user == null)
            {
                _logger.LogWarning("Login failed for username: {Username}", request.Username);
                return Unauthorized(new ErrorResponse { Message = "Kullanıcı adı veya şifre hatalı" });
            }

            // JWT token oluştur
            var token = GenerateJwtToken(user);
            var expiresAt = DateTime.Now.AddMinutes(_configuration.GetValue<int>("JwtSettings:ExpiryMinutes", 60));

            _logger.LogInformation("User logged in successfully: {Username}", request.Username);

            return Ok(new LoginResponse
            {
                Token = token,
                User = user,
                ExpiresAt = expiresAt
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Login error for username: {Username}", request.Username);
            return StatusCode(500, new ErrorResponse { Message = "Sunucu hatası oluştu" });
        }
    }

    /// <summary>
    /// Configuration ve bağlantı durumunu test eden endpoint
    /// </summary>
    [HttpGet("test")]
    public async Task<IActionResult> TestConfiguration()
    {
        try
        {
            var configStatus = _redmineService.GetConfigurationStatus();

            // Test kullanıcısı ile bağlantı testi (opsiyonel)
            User? testUser = null;
            try
            {
                testUser = await _redmineService.AuthenticateUserAsync("test", "wrongpassword");
            }
            catch (Exception ex)
            {
                _logger.LogDebug("Test connection failed (expected): {Error}", ex.Message);
            }

            return Ok(new
            {
                RedmineConfiguration = configStatus,
                TestConnectionAttempted = true,
                TestUserFound = testUser != null,
                DatabaseConnectionString = !string.IsNullOrEmpty(_configuration.GetConnectionString("DefaultConnection")) ? "Configured" : "Not configured",
                JwtConfiguration = !string.IsNullOrEmpty(_configuration["JwtSettings:Secret"]) ? "Configured" : "Not configured",
                Environment = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT"),
                Timestamp = DateTime.Now
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in test configuration");
            return StatusCode(500, new ErrorResponse { Message = ex.Message });
        }
    }

    // JWT Token oluşturma metodu burada! 👇
    private string GenerateJwtToken(User user)
    {
        var jwtKey = _configuration["JwtSettings:Secret"] ?? "YourSecretKeyThatIsAtLeast32CharactersLong123456789";
        var key = Encoding.ASCII.GetBytes(jwtKey);

        var claims = new[]
        {
            new Claim("sub", user.Id.ToString()),
            new Claim("username", user.Login),
            new Claim("email", user.Mail),
            new Claim("fullname", user.FullName),
            new Claim("admin", user.Admin.ToString().ToLower())
        };

        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(claims),
            Expires = DateTime.Now.AddMinutes(_configuration.GetValue<int>("JwtSettings:ExpiryMinutes", 60)),
            SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
        };

        var tokenHandler = new JwtSecurityTokenHandler();
        var token = tokenHandler.CreateToken(tokenDescriptor);
        return tokenHandler.WriteToken(token);
    }
}