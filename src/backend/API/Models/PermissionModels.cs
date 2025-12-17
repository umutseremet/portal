namespace API.Models
{
    public class PermissionModels
    {
        // src/backend/API/Models/PermissionModels.cs
        // Redmine kullanıcı ve grup yetkilendirme modelleri

        /// <summary>
        /// Redmine kullanıcı bilgileri
        /// </summary>
        public class RedmineUserInfo
        {
            public int Id { get; set; }
            public string Login { get; set; } = string.Empty;
            public string Firstname { get; set; } = string.Empty;
            public string Lastname { get; set; } = string.Empty;
            public string? Mail { get; set; }
            public DateTime? CreatedOn { get; set; }
            public DateTime? UpdatedOn { get; set; }
            public DateTime? LastLoginOn { get; set; }
            public int Status { get; set; } // 1: Active, 3: Locked
            public List<RedmineUserPermission> Permissions { get; set; } = new();
            public bool Admin { get; set; } = false; // ✅ Redmine'dan gelen admin bilgisi
        }

        /// <summary>
        /// Redmine grup bilgileri
        /// </summary>
        public class RedmineGroupInfo
        {
            public int Id { get; set; }
            public string Name { get; set; } = string.Empty;
            public List<int> UserIds { get; set; } = new();
            public List<RedmineUserInfo> Users { get; set; } = new();
            public List<RedmineGroupPermission> Permissions { get; set; } = new();
        }

        /// <summary>
        /// Kullanıcıya ait yetki
        /// </summary>
        public class RedmineUserPermission
        {
            public int CustomFieldId { get; set; }
            public string CustomFieldName { get; set; } = string.Empty;
            public string PermissionKey { get; set; } = string.Empty;
            public string PermissionValue { get; set; } = string.Empty;
            public string? Description { get; set; }
        }

        /// <summary>
        /// Gruba ait yetki
        /// </summary>
        public class RedmineGroupPermission
        {
            public int CustomFieldId { get; set; }
            public string CustomFieldName { get; set; } = string.Empty;
            public string PermissionKey { get; set; } = string.Empty;
            public string PermissionValue { get; set; } = string.Empty;
            public string? Description { get; set; }
        }

        /// <summary>
        /// Redmine özel alan bilgileri
        /// </summary>
        public class RedmineCustomField
        {
            public int Id { get; set; }
            public string Name { get; set; } = string.Empty;
            public string? Description { get; set; }
            public string CustomizedType { get; set; } = string.Empty; // user, group, principal
            public string FieldFormat { get; set; } = string.Empty;
            public bool IsRequired { get; set; }
            public bool IsFilter { get; set; }
            public bool Searchable { get; set; }
            public bool Multiple { get; set; }
            public string? DefaultValue { get; set; }
            public List<string> PossibleValues { get; set; } = new();
            public bool Visible { get; set; }
        }

        /// <summary>
        /// Yetki yönetimi - kullanıcıların ve grupların yetkileri
        /// </summary>
        public class PermissionManagementResponse
        {
            public List<RedmineUserInfo> Users { get; set; } = new();
            public List<RedmineGroupInfo> Groups { get; set; } = new();
            public List<RedmineCustomField> UserCustomFields { get; set; } = new();
            public List<RedmineCustomField> GroupCustomFields { get; set; } = new();
        }

        /// <summary>
        /// Yetki güncelleme request
        /// </summary>
        public class UpdatePermissionRequest
        {
            public string EntityType { get; set; } = string.Empty; // "user" or "group"
            public int EntityId { get; set; }
            public int CustomFieldId { get; set; }
            public string Value { get; set; } = string.Empty;
        }

        /// <summary>
        /// Login sırasında kullanıcı yetkileri response
        /// </summary>
        public class UserPermissionsResponse
        {
            public int UserId { get; set; }
            public string Username { get; set; } = string.Empty;
            public List<RedmineUserPermission> UserPermissions { get; set; } = new();
            public List<RedmineGroupPermission> GroupPermissions { get; set; } = new();
            public Dictionary<string, string> AllPermissions { get; set; } = new();
            public bool IsAdmin { get; set; } = false; // ✅ EKLENDI
        }

        // Redmine API Response Models
        public class RedmineUsersResponse
        {
            public List<RedmineUserResponse> Users { get; set; } = new();
            public int TotalCount { get; set; }
            public int Offset { get; set; }
            public int Limit { get; set; }
        }

        public class RedmineUserResponse
        {
            public int Id { get; set; }
            public string Login { get; set; } = string.Empty;
            public string Firstname { get; set; } = string.Empty;
            public string Lastname { get; set; } = string.Empty;
            public string? Mail { get; set; }
            public DateTime? CreatedOn { get; set; }
            public DateTime? UpdatedOn { get; set; }
            public DateTime? LastLoginOn { get; set; }
            public int Status { get; set; }
            public List<RedmineCustomFieldValue>? Custom_Fields { get; set; }
            public bool Admin { get; set; } = false; // ✅ Redmine API'den gelen admin flag
        }

        public class RedmineGroupsResponse
        {
            public List<RedmineGroupResponse> Groups { get; set; } = new();
        }

        public class RedmineGroupResponse
        {
            public int Id { get; set; }
            public string Name { get; set; } = string.Empty;
            public List<RedmineCustomFieldValue>? CustomFields { get; set; }
            public List<RedmineGroupUser>? Users { get; set; }
        }

        public class RedmineGroupUser
        {
            public int Id { get; set; }
            public string Name { get; set; } = string.Empty;
        }

        public class RedmineCustomFieldValue
        {
            public int Id { get; set; }
            public string Name { get; set; } = string.Empty;
            public string? Value { get; set; }
        }

        public class RedmineCustomFieldsResponse
        {
            public List<RedmineCustomField> CustomFields { get; set; } = new();
        }
    }
}