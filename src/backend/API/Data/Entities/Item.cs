﻿using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace API.Data.Entities
{
    [Table("items")]
    public class Item
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int Number { get; set; }

        [Required]
        [MaxLength(500)]
        public string Name { get; set; } = string.Empty;

        [Required]
        [MaxLength(50)]
        public string DocNumber { get; set; } = string.Empty;

        [Required]
        [MaxLength(50)]
        public string Code { get; set; } = string.Empty;

        [Required]
        public int GroupId { get; set; }

        public int? X { get; set; }
        public int? Y { get; set; }
        public int? Z { get; set; }

        [MaxLength(500)]
        public string? ImageUrl { get; set; }

        public bool? Cancelled { get; set; } = false;

        // Audit fields
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime? UpdatedAt { get; set; }

        public string SupplierCode { get; set; } = string.Empty;
        public double Price { get; set; }
        public string? Supplier { get; set; }
        public string? Unit { get; set; }

        // Navigation property
        [ForeignKey("GroupId")]
        public virtual ItemGroup? ItemGroup { get; set; }


    }
}