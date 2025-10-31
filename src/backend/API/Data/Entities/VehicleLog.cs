using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace API.Data.Entities
{
    [Table("VehicleLogs")]
    public class VehicleLog
    {
        public int Id { get; set; }
        
        public int VehicleId { get; set; }
        
        [Required]
        [MaxLength(100)]
        public string OperationType { get; set; } = string.Empty; // "User Update", "Vehicle Update", etc.
        
        [Required]
        [MaxLength(500)]
        public string Description { get; set; } = string.Empty;
        
        [MaxLength(2000)]
        public string? OldValues { get; set; } // JSON format
        
        [MaxLength(2000)]
        public string? NewValues { get; set; } // JSON format
        
        [Required]
        [MaxLength(100)]
        public string UserName { get; set; } = string.Empty;
        
        [Required]
        [MaxLength(50)]
        public string IpAddress { get; set; } = string.Empty;
        
        public DateTime OperationDate { get; set; } = DateTime.Now;
        
        // Navigation property
        [ForeignKey("VehicleId")]
        public virtual Vehicle? Vehicle { get; set; }
    }
}