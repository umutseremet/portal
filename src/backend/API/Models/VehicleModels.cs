using System.ComponentModel.DataAnnotations;

namespace API.Models
{
    /// <summary>
    /// User information update DTO
    /// </summary>
    public class UserInfoUpdateDto
    {
        [Required(ErrorMessage = "User name is required")]
        [MaxLength(100, ErrorMessage = "User name cannot exceed 100 characters")]
        public string AssignedUserName { get; set; } = string.Empty;

        [Required(ErrorMessage = "User phone is required")]
        [MaxLength(20, ErrorMessage = "Phone number cannot exceed 20 characters")]
        [Phone(ErrorMessage = "Please enter a valid phone number")]
        public string AssignedUserPhone { get; set; } = string.Empty;
    }

    /// <summary>
    /// Vehicle information update DTO
    /// </summary>
    public class VehicleInfoUpdateDto
    {
        [MaxLength(20, ErrorMessage = "License plate cannot exceed 20 characters")]
        public string LicensePlate { get; set; } = string.Empty;

        [MaxLength(50, ErrorMessage = "Brand cannot exceed 50 characters")]
        public string Brand { get; set; } = string.Empty;

        [MaxLength(50, ErrorMessage = "Model cannot exceed 50 characters")]
        public string Model { get; set; } = string.Empty;

        [Range(1900, 2100, ErrorMessage = "Please enter a valid year")]
        public int Year { get; set; }

        [MaxLength(50, ErrorMessage = "VIN cannot exceed 50 characters")]
        public string VIN { get; set; } = string.Empty;

        [MaxLength(100, ErrorMessage = "Company name cannot exceed 100 characters")]
        public string CompanyName { get; set; } = string.Empty;

        public DateTime? InspectionDate { get; set; }

        [MaxLength(100, ErrorMessage = "Insurance info cannot exceed 100 characters")]
        public string Insurance { get; set; } = string.Empty;

        public DateTime? InsuranceExpiryDate { get; set; }

        public DateTime? LastServiceDate { get; set; }

        [Range(0, int.MaxValue, ErrorMessage = "Mileage must be a positive number")]
        public int CurrentMileage { get; set; }

        [Range(0, 99.9, ErrorMessage = "Fuel consumption must be between 0-99.9")]
        public decimal FuelConsumption { get; set; }

        [MaxLength(20, ErrorMessage = "Tire condition cannot exceed 20 characters")]
        public string TireCondition { get; set; } = string.Empty;

        [MaxLength(100, ErrorMessage = "Registration info cannot exceed 100 characters")]
        public string RegistrationInfo { get; set; } = string.Empty;

        [MaxLength(50, ErrorMessage = "Ownership type cannot exceed 50 characters")]
        public string OwnershipType { get; set; } = string.Empty;

        [MaxLength(100, ErrorMessage = "Location cannot exceed 100 characters")]
        public string Location { get; set; } = string.Empty;

        [Url(ErrorMessage = "Please enter a valid URL")]
        public string? VehicleImageUrl { get; set; }
    }

    /// <summary>
    /// Create new vehicle DTO
    /// </summary>
    public class VehicleCreateDto
    {
        [MaxLength(20, ErrorMessage = "License plate cannot exceed 20 characters")]
        public string LicensePlate { get; set; } = string.Empty;

        [MaxLength(50, ErrorMessage = "Brand cannot exceed 50 characters")]
        public string Brand { get; set; } = string.Empty;

        [MaxLength(50, ErrorMessage = "Model cannot exceed 50 characters")]
        public string Model { get; set; } = string.Empty;

        [Range(1900, 2100, ErrorMessage = "Please enter a valid year")]
        public int Year { get; set; }

        [MaxLength(50, ErrorMessage = "VIN cannot exceed 50 characters")]
        public string VIN { get; set; } = string.Empty;

        [MaxLength(100, ErrorMessage = "Company name cannot exceed 100 characters")]
        public string CompanyName { get; set; } = string.Empty;

        public DateTime? InspectionDate { get; set; }

        [MaxLength(100, ErrorMessage = "Insurance info cannot exceed 100 characters")]
        public string Insurance { get; set; } = string.Empty;

        public DateTime? InsuranceExpiryDate { get; set; }

        public DateTime? LastServiceDate { get; set; }

        [Range(0, int.MaxValue, ErrorMessage = "Mileage must be a positive number")]
        public int CurrentMileage { get; set; }

        [Range(0, 99.9, ErrorMessage = "Fuel consumption must be between 0-99.9")]
        public decimal FuelConsumption { get; set; }

        [MaxLength(20, ErrorMessage = "Tire condition cannot exceed 20 characters")]
        public string TireCondition { get; set; } = string.Empty;

        [MaxLength(100, ErrorMessage = "Registration info cannot exceed 100 characters")]
        public string RegistrationInfo { get; set; } = string.Empty;

        [MaxLength(50, ErrorMessage = "Ownership type cannot exceed 50 characters")]
        public string OwnershipType { get; set; } = string.Empty;

        [MaxLength(100, ErrorMessage = "User name cannot exceed 100 characters")]
        public string AssignedUserName { get; set; } = string.Empty;

        [MaxLength(20, ErrorMessage = "Phone number cannot exceed 20 characters")]
        [Phone(ErrorMessage = "Please enter a valid phone number")]
        public string AssignedUserPhone { get; set; } = string.Empty;

        [MaxLength(100, ErrorMessage = "Location cannot exceed 100 characters")]
        public string Location { get; set; } = string.Empty;

        [MaxLength(500, ErrorMessage = "Image URL cannot exceed 500 characters")]
        public string? VehicleImageUrl { get; set; }
    }

    /// <summary>
    /// Vehicle list response DTO
    /// </summary>
    public class VehicleListResponseDto
    {
        public int Id { get; set; }
        public string LicensePlate { get; set; } = string.Empty;
        public string Brand { get; set; } = string.Empty;
        public string Model { get; set; } = string.Empty;
        public int Year { get; set; }
        public string CompanyName { get; set; } = string.Empty;
        public string AssignedUserName { get; set; } = string.Empty;
        public string AssignedUserPhone { get; set; } = string.Empty;
        public string Location { get; set; } = string.Empty;
        public DateTime? InspectionDate { get; set; }
        public DateTime? InsuranceExpiryDate { get; set; }
        public DateTime? LastServiceDate { get; set; }
        public int CurrentMileage { get; set; }
        public string TireCondition { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
        public string OwnershipType { get; set; }
        public string Insurance { get; internal set; }
        public string VIN { get; internal set; }
        public decimal FuelConsumption { get; internal set; }
        public string? VehicleImageUrl { get; internal set; }
    }
}