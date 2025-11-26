using System.ComponentModel.DataAnnotations;

// MEVCUT MODELLERINIZ - AYNI KALACAK
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
    public string Mail { get; set; } = string.Empty;
    public bool Admin { get; set; }
    public string FullName => $"{FirstName} {LastName}".Trim();
    public string RedmineUsername { get; set; } = string.Empty;
    public string RedminePassword { get; set; } = string.Empty;
}

public class RedmineUserResponse
{
    public User User { get; set; } = new();
}

//public class ErrorResponse
//{
//    public string Message { get; set; } = string.Empty;
//}

// YENİ EKLENEN MODELLER - Mevcut modellerin altına ekleyin

// Time Entries Request/Response Models
public class TimeEntriesRequest
{
    [Required]
    public string Username { get; set; } = string.Empty;

    [Required]
    public string Password { get; set; } = string.Empty;

    public int? UserId { get; set; }
    public int? ProjectId { get; set; }
    public string? From { get; set; }
    public string? To { get; set; }
    public int Limit { get; set; } = 25;
    public int Offset { get; set; } = 0;
}

public class TimeEntriesResponse
{
    public List<RedmineTimeEntry> TimeEntries { get; set; } = new();
    public int TotalCount { get; set; }
    public int Offset { get; set; }
    public int Limit { get; set; }
    public bool HasMore { get; set; }
}

// Recent Activities Request/Response Models
public class RecentActivitiesRequest
{
    [Required]
    public string Username { get; set; } = string.Empty;

    [Required]
    public string Password { get; set; } = string.Empty;

    [Required]
    public int UserId { get; set; }

    public int Days { get; set; } = 30;
    public int Limit { get; set; } = 50;
}

public class RecentActivitiesResponse
{
    public List<RedmineTimeEntry> Activities { get; set; } = new();
    public int TotalCount { get; set; }
    public int UserId { get; set; }
    public int DaysRange { get; set; }
    public string FromDate { get; set; } = string.Empty;
}

// Project Time Entries Request/Response Models
public class ProjectTimeEntriesRequest
{
    [Required]
    public string Username { get; set; } = string.Empty;

    [Required]
    public string Password { get; set; } = string.Empty;

    [Required]
    public int ProjectId { get; set; }

    public int Days { get; set; } = 30;
    public int Limit { get; set; } = 100;
}

public class ProjectTimeEntriesResponse
{
    public List<RedmineTimeEntry> TimeEntries { get; set; } = new();
    public int TotalCount { get; set; }
    public int ProjectId { get; set; }
    public int DaysRange { get; set; }
    public string FromDate { get; set; } = string.Empty;
}

// Redmine API Data Models
public class TimeEntriesResult
{
    public List<RedmineTimeEntry> TimeEntries { get; set; } = new();
    public int TotalCount { get; set; }
    public int Offset { get; set; }
    public int Limit { get; set; }
}

public class RedmineTimeEntriesResponse
{
    public List<RedmineTimeEntry> TimeEntries { get; set; } = new();
    public int TotalCount { get; set; }
    public int Offset { get; set; }
    public int Limit { get; set; }
}

public class RedmineTimeEntry
{
    public int Id { get; set; }
    public RedmineProject? Project { get; set; }
    public RedmineIssue? Issue { get; set; }
    public RedmineUser? User { get; set; }
    public RedmineActivity? Activity { get; set; }
    public decimal Hours { get; set; }
    public string? Comments { get; set; }
    public DateTime SpentOn { get; set; }
    public DateTime CreatedOn { get; set; }
    public DateTime UpdatedOn { get; set; }
}

public class RedmineProject
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Identifier { get; set; } = string.Empty;
}

public class RedmineIssue
{
    public int Id { get; set; }
    public string Subject { get; set; } = string.Empty;
}

public class RedmineUser
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Login { get; set; } = string.Empty;
}

public class RedmineActivity
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
}