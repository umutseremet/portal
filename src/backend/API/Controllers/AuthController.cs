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

            // Redmine ile kimlik doğrulama
            var user = await _redmineService.AuthenticateUserAsync(request.Username, request.Password);

            if (user == null)
            {
                _logger.LogWarning("Login failed for username: {Username}", request.Username);
                return Unauthorized(new ErrorResponse { Message = "Kullanıcı adı veya şifre hatalı" });
            }

            // JWT token oluştur
            var token = GenerateJwtToken(user);
            var expiresAt = DateTime.UtcNow.AddMinutes(_configuration.GetValue<int>("JwtSettings:ExpiryMinutes", 60));

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

    // JWT Token oluşturma metodu burada! 👇
    private string GenerateJwtToken(User user)
    {
        var jwtKey = _configuration["JwtSettings:Secret"] ?? "YourSecretKeyThatIsAtLeast32CharactersLong123456789";
        var key = Encoding.ASCII.GetBytes(jwtKey);

        var claims = new[]
        {
            new Claim("sub", user.Id.ToString()),
            new Claim("username", user.Login),
            new Claim("email", user.Email),
            new Claim("fullname", user.FullName),
            new Claim("admin", user.Admin.ToString().ToLower())
        };

        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(claims),
            Expires = DateTime.UtcNow.AddMinutes(_configuration.GetValue<int>("JwtSettings:ExpiryMinutes", 60)),
            SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
        };

        var tokenHandler = new JwtSecurityTokenHandler();
        var token = tokenHandler.CreateToken(tokenDescriptor);
        return tokenHandler.WriteToken(token);
    }
}