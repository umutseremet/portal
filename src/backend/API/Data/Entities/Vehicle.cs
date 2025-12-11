// src/backend/API/Data/Entities/Vehicle.cs
// ✅ DÜZELTİLMİŞ - SADECE PLAKA, MARKA, MODEL ZORUNLU

using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace API.Data.Entities
{
    [Table("Vehicles")]
    public class Vehicle
    {
        public int Id { get; set; }

        // ✅ ZORUNLU ALANLAR - SADECE 3 TANE
        [Required]
        [MaxLength(20)]
        public string LicensePlate { get; set; } = string.Empty;

        [Required]
        [MaxLength(50)]
        public string Brand { get; set; } = string.Empty;

        [Required]
        [MaxLength(50)]
        public string Model { get; set; } = string.Empty;

        // ✅ OPSİYONEL ALANLAR - NULLABLE
        public int? Year { get; set; }

        [MaxLength(50)]
        public string? VIN { get; set; }

        [MaxLength(100)]
        public string? CompanyName { get; set; }

        public DateTime? InspectionDate { get; set; }

        [MaxLength(100)]
        public string? Insurance { get; set; }

        public DateTime? InsuranceExpiryDate { get; set; }

        public DateTime? LastServiceDate { get; set; }

        public int? CurrentMileage { get; set; }

        [Column(TypeName = "decimal(4,1)")]
        public decimal? FuelConsumption { get; set; }

        [MaxLength(20)]
        public string? TireCondition { get; set; }

        [MaxLength(100)]
        public string? RegistrationInfo { get; set; }

        [MaxLength(50)]
        public string? OwnershipType { get; set; } = "company"; // Default value

        [MaxLength(100)]
        public string? AssignedUserName { get; set; }

        [MaxLength(20)]
        public string? AssignedUserPhone { get; set; }

        [MaxLength(100)]
        public string? Location { get; set; }

        [MaxLength(500)]
        public string? VehicleImageUrl { get; set; }

        // Audit fields
        public DateTime CreatedAt { get; set; } = DateTime.Now;
        public DateTime? UpdatedAt { get; set; }

        // Navigation properties
        public virtual ICollection<VehicleLog>? VehicleLogs { get; set; }
    }
}