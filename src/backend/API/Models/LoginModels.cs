using System.ComponentModel.DataAnnotations;

public class LoginRequest
{
    [Required]
    public string Username { get; set; } = string.Empty;

    [Required]
    public string Password { get; set; } = string.Empty;
}

public class LoginResponse
{
    public string Token { get; set; } = string.Empty;
    public User User { get; set; } = new();
    public DateTime ExpiresAt { get; set; }
}

public class User
{
    public int Id { get; set; }
    public string Login { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public bool Admin { get; set; }
    public string FullName => $"{FirstName} {LastName}".Trim();
}

public class RedmineUserResponse
{
    public User User { get; set; } = new();
}

public class ErrorResponse
{
    public string Message { get; set; } = string.Empty;
}