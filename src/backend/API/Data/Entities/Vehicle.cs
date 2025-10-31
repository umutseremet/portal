using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace API.Data.Entities
{
    [Table("Vehicles")]
    public class Vehicle
    {
        public int Id { get; set; }
        
        [Required]
        [MaxLength(20)]
        public string LicensePlate { get; set; } = string.Empty;
        
        [Required]
        [MaxLength(50)]
        public string Brand { get; set; } = string.Empty;
        
        [Required]
        [MaxLength(50)]
        public string Model { get; set; } = string.Empty;
        
        public int Year { get; set; }
        
        [Required]
        [MaxLength(50)]
        public string VIN { get; set; } = string.Empty;
        
        [Required]
        [MaxLength(100)]
        public string CompanyName { get; set; } = string.Empty;
        
        public DateTime? InspectionDate { get; set; }
        
        [Required]
        [MaxLength(100)]
        public string Insurance { get; set; } = string.Empty;
        
        public DateTime? InsuranceExpiryDate { get; set; }
        
        public DateTime? LastServiceDate { get; set; }
        
        public int CurrentMileage { get; set; }
        
        [Column(TypeName = "decimal(4,1)")]
        public decimal FuelConsumption { get; set; }
        
        [Required]
        [MaxLength(20)]
        public string TireCondition { get; set; } = string.Empty;
        
        [Required]
        [MaxLength(100)]
        public string RegistrationInfo { get; set; } = string.Empty;
        
        [Required]
        [MaxLength(50)]
        public string OwnershipType { get; set; } = string.Empty; // Company/Rental
        
        [Required]
        [MaxLength(100)]
        public string AssignedUserName { get; set; } = string.Empty;
        
        [Required]
        [MaxLength(20)]
        public string AssignedUserPhone { get; set; } = string.Empty;
        
        [Required]
        [MaxLength(100)]
        public string Location { get; set; } = string.Empty;
        
        [MaxLength(500)]
        public string? VehicleImageUrl { get; set; }
        
        // Audit fields
        public DateTime CreatedAt { get; set; } = DateTime.Now;
        public DateTime? UpdatedAt { get; set; }
        
        // Navigation properties
        public virtual ICollection<VehicleLog>? VehicleLogs { get; set; }
    }
}