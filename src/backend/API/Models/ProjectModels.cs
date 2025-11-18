using System.ComponentModel.DataAnnotations;

// JWT Korumalı Project Request Models
public class GetProjectsJwtRequest
{
    [Required(ErrorMessage = "Redmine kullanıcı adı gerekli")]
    public string RedmineUsername { get; set; } = string.Empty;

    [Required(ErrorMessage = "Redmine şifresi gerekli")]
    public string RedminePassword { get; set; } = string.Empty;

    public int? Status { get; set; } // 1=Active, 5=Closed, null=All
    public string? Name { get; set; } // Proje adı filtresi
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 25;
    public int Limit { get; set; } = 25;
    public int Offset => (Page - 1) * PageSize;
    public string? SortBy { get; set; } = "name"; // name, created_on, updated_on
    public string? SortOrder { get; set; } = "asc"; // asc, desc
}

public class GetProjectJwtRequest
{
    [Required(ErrorMessage = "Redmine kullanıcı adı gerekli")]
    public string RedmineUsername { get; set; } = string.Empty;

    [Required(ErrorMessage = "Redmine şifresi gerekli")]
    public string RedminePassword { get; set; } = string.Empty;
}

// Enhanced Response Models (JWT kullanıcı bilgisi ile)
public class GetProjectsResponse
{
    public List<ProjectResponse> Projects { get; set; } = new();
    public int TotalCount { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
    public int TotalPages { get; set; }
    public bool HasNextPage { get; set; }
    public bool HasPreviousPage { get; set; }
    public string? RequestedBy { get; set; } // JWT'den gelen kullanıcı
}

public class ProjectStatsResponse
{
    public int TotalProjects { get; set; }
    public int ActiveProjects { get; set; }
    public int ClosedProjects { get; set; }
    public int PublicProjects { get; set; }
    public int PrivateProjects { get; set; }
    public List<RecentProjectResponse> RecentlyUpdatedProjects { get; set; } = new();
    public string? RequestedBy { get; set; } // JWT'den gelen kullanıcı
}

public class ProjectResponse
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Identifier { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int Status { get; set; }
    public bool IsPublic { get; set; }
    public DateTime CreatedOn { get; set; }
    public DateTime UpdatedOn { get; set; }
    public ProjectParentResponse? Parent { get; set; }
}

public class ProjectParentResponse
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
}

public class RecentProjectResponse
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Identifier { get; set; } = string.Empty;
    public DateTime UpdatedOn { get; set; }
}

// Debug Request Model
public class GetProjectDebugRequest
{
    [Required(ErrorMessage = "Username gerekli")]
    [StringLength(100, ErrorMessage = "Username en fazla 100 karakter olabilir")]
    public string Username { get; set; } = string.Empty;

    [Required(ErrorMessage = "Password gerekli")]
    [StringLength(200, ErrorMessage = "Password en fazla 200 karakter olabilir")]
    public string Password { get; set; } = string.Empty;

    [Range(1, 50, ErrorMessage = "Limit 1-50 arasında olmalı")]
    public int Limit { get; set; } = 5;
}

// Redmine API Data Models
public class RedmineProjectsResponse
{
    public List<RedmineProjectDetail> Projects { get; set; } = new();
    public int TotalCount { get; set; }
    public int Offset { get; set; }
    public int Limit { get; set; }
}

public class RedmineProjectDetail
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Identifier { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int Status { get; set; }
    public bool IsPublic { get; set; }
    public DateTime CreatedOn { get; set; }
    public DateTime UpdatedOn { get; set; }
    public RedmineProjectParent? Parent { get; set; }
}

public class RedmineProjectParent
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
}

public class ProjectsResult
{
    public List<RedmineProjectDetail> Projects { get; set; } = new();
    public int TotalCount { get; set; }
    public int Offset { get; set; }
    public int Limit { get; set; }
}

// Enhanced Error Response
public class ErrorResponse
{
    public string Message { get; set; } = string.Empty;
    public DateTime Timestamp { get; set; } = DateTime.Now;
    public string? RequestId { get; set; }
}