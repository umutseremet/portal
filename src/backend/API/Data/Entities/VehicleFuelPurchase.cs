using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace API.Data.Entities
{
    [Table("VehicleFuelPurchases")]
    public class VehicleFuelPurchase
    {
        [Key]
        public int Id { get; set; }

        // Foreign Key to Vehicles
        [Required]
        public int VehicleId { get; set; }

        // Excel Fields
        [Required]
        public long PurchaseId { get; set; } // ID kolonu

        [Required]
        public long DistributorId { get; set; } // Distributör ID

        [Required]
        public long DistributorCodeId { get; set; } // Distribütör Kodu ID

        [Required]
        [MaxLength(50)]
        public string Code { get; set; } = string.Empty; // Kod

        [Required]
        [MaxLength(100)]
        public string FleetCodeName { get; set; } = string.Empty; // Filo Kod Adı

        [Required]
        [MaxLength(200)]
        public string Fleet { get; set; } = string.Empty; // Filo

        [Required]
        [MaxLength(100)]
        public string City { get; set; } = string.Empty; // Şehir

        [Required]
        [MaxLength(100)]
        public string Station { get; set; } = string.Empty; // İstasyon

        [Required]
        [MaxLength(50)]
        public string StationCode { get; set; } = string.Empty; // İstasyon Kodu

        [MaxLength(100)]
        public string? DeviceGroups { get; set; } // Cihaz Grupları

        [Required]
        [MaxLength(20)]
        public string LicensePlate { get; set; } = string.Empty; // Plaka

        [Required]
        [MaxLength(100)]
        public string FuelType { get; set; } = string.Empty; // Tip

        [Required]
        [MaxLength(50)]
        public string SalesType { get; set; } = string.Empty; // Satış Tipi

        [Required]
        [MaxLength(50)]
        public string UTTS { get; set; } = string.Empty; // UTTS

        [Required]
        [Column(TypeName = "decimal(10,2)")]
        public decimal Quantity { get; set; } // Miktar

        [Required]
        [Column(TypeName = "decimal(10,2)")]
        public decimal GrossAmount { get; set; } // Brüt Tutar

        [Required]
        [Column(TypeName = "decimal(10,2)")]
        public decimal NetAmount { get; set; } // Net Tutar

        [Required]
        [Column(TypeName = "decimal(5,2)")]
        public decimal Discount { get; set; } // İskonto

        [Required]
        [MaxLength(20)]
        public string DiscountType { get; set; } = string.Empty; // İskonto Tipi

        [Required]
        [Column(TypeName = "decimal(10,2)")]
        public decimal UnitPrice { get; set; } // Birim Fiyatı

        [Required]
        [MaxLength(10)]
        public string VATRate { get; set; } = string.Empty; // KDV Oranı

        public int Mileage { get; set; } // Kilometre

        [Required]
        [MaxLength(50)]
        public string Distributor { get; set; } = string.Empty; // Distribütör

        [Required]
        public DateTime PurchaseDate { get; set; } // Tarih

        [Required]
        public DateTime Period { get; set; } // Dönem

        [Required]
        [MaxLength(50)]
        public string TransactionNumber { get; set; } = string.Empty; // İşlem Numarası

        [Required]
        public DateTime InvoiceDate { get; set; } // Fatura Tarihi

        [Required]
        [MaxLength(50)]
        public string InvoiceNumber { get; set; } = string.Empty; // Fatura Numarası

        [Required]
        public DateTime ReflectionDate { get; set; } // Yansıma Tarihi

        [Required]
        public long SalesRepresentativeId { get; set; } // Satış Temsilcisi ID

        [Required]
        [MaxLength(200)]
        public string SalesRepresentative { get; set; } = string.Empty; // Satış Temsilcisi

        // Audit Fields
        public DateTime CreatedAt { get; set; } = DateTime.Now;
        public DateTime? UpdatedAt { get; set; }

        // Navigation Property
        [ForeignKey("VehicleId")]
        public virtual Vehicle? Vehicle { get; set; }

        [MaxLength(500)]
        public string? DeviceDescription { get; internal set; }
    }
}