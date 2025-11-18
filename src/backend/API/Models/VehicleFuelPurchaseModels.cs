using System;
using System.ComponentModel.DataAnnotations;

namespace API.Models
{
    // Create DTO
    public class VehicleFuelPurchaseCreateDto
    {
        [Required(ErrorMessage = "Plaka zorunludur")]
        [MaxLength(20)]
        public string LicensePlate { get; set; } = string.Empty;

        [Required(ErrorMessage = "Alım ID zorunludur")]
        public long PurchaseId { get; set; }

        [Required]
        public long DistributorId { get; set; }

        [Required]
        public long DistributorCodeId { get; set; }

        [Required]
        [MaxLength(50)]
        public string Code { get; set; } = string.Empty;

        [Required]
        [MaxLength(100)]
        public string FleetCodeName { get; set; } = string.Empty;

        [Required]
        [MaxLength(200)]
        public string Fleet { get; set; } = string.Empty;

        [Required]
        [MaxLength(100)]
        public string City { get; set; } = string.Empty;

        [Required]
        [MaxLength(100)]
        public string Station { get; set; } = string.Empty;

        [Required]
        [MaxLength(50)]
        public string StationCode { get; set; } = string.Empty;

        [MaxLength(100)]
        public string? DeviceGroups { get; set; }

        [Required]
        [MaxLength(100)]
        public string FuelType { get; set; } = string.Empty;

        [Required]
        [MaxLength(50)]
        public string SalesType { get; set; } = string.Empty;

        [Required]
        [MaxLength(50)]
        public string UTTS { get; set; } = string.Empty;

        [Required]
        [Range(0.01, 9999.99)]
        public decimal Quantity { get; set; }

        [Required]
        [Range(0.01, 999999.99)]
        public decimal GrossAmount { get; set; }

        [Required]
        [Range(0.01, 999999.99)]
        public decimal NetAmount { get; set; }

        [Required]
        [Range(0, 100)]
        public decimal Discount { get; set; }

        [Required]
        [MaxLength(20)]
        public string DiscountType { get; set; } = string.Empty;

        [Required]
        [Range(0.01, 999.99)]
        public decimal UnitPrice { get; set; }

        [Required]
        [MaxLength(10)]
        public string VATRate { get; set; } = string.Empty;

        [Range(0, 9999999)]
        public int Mileage { get; set; }

        [Required]
        [MaxLength(50)]
        public string Distributor { get; set; } = string.Empty;

        [Required]
        public DateTime PurchaseDate { get; set; }

        [Required]
        public DateTime Period { get; set; }

        [Required]
        [MaxLength(50)]
        public string TransactionNumber { get; set; } = string.Empty;

        [Required]
        public DateTime InvoiceDate { get; set; }

        [Required]
        [MaxLength(50)]
        public string InvoiceNumber { get; set; } = string.Empty;

        [Required]
        public DateTime ReflectionDate { get; set; }

        [Required]
        public long SalesRepresentativeId { get; set; }

        [Required]
        [MaxLength(200)]
        public string SalesRepresentative { get; set; } = string.Empty;


        [MaxLength(500)]
        public string? DeviceDescription { get; set; } 
    }

    // Update DTO
    public class VehicleFuelPurchaseUpdateDto
    {
        [Range(0.01, 9999.99)]
        public decimal? Quantity { get; set; }

        [Range(0.01, 999999.99)]
        public decimal? GrossAmount { get; set; }

        [Range(0.01, 999999.99)]
        public decimal? NetAmount { get; set; }

        [Range(0, 100)]
        public decimal? Discount { get; set; }

        [MaxLength(20)]
        public string? DiscountType { get; set; }

        [Range(0.01, 999.99)]
        public decimal? UnitPrice { get; set; }

        [MaxLength(10)]
        public string? VATRate { get; set; }

        [Range(0, 9999999)]
        public int? Mileage { get; set; }

        public DateTime? PurchaseDate { get; set; }

        [MaxLength(50)]
        public string? TransactionNumber { get; set; }

        public DateTime? InvoiceDate { get; set; }

        [MaxLength(50)]
        public string? InvoiceNumber { get; set; }

        [MaxLength(200)]
        public string? SalesRepresentative { get; set; }
    }

    // Response DTO
    public class VehicleFuelPurchaseResponseDto
    {
        public int Id { get; set; }
        public int VehicleId { get; set; }
        public string VehicleLicensePlate { get; set; } = string.Empty;
        public string VehicleBrand { get; set; } = string.Empty;
        public string VehicleModel { get; set; } = string.Empty;
        public long PurchaseId { get; set; }
        public string Code { get; set; } = string.Empty;
        public string FleetCodeName { get; set; } = string.Empty;
        public string Fleet { get; set; } = string.Empty;
        public string City { get; set; } = string.Empty;
        public string Station { get; set; } = string.Empty;
        public string StationCode { get; set; } = string.Empty;
        public string? DeviceGroups { get; set; }
        public string LicensePlate { get; set; } = string.Empty;
        public string FuelType { get; set; } = string.Empty;
        public string SalesType { get; set; } = string.Empty;
        public string UTTS { get; set; } = string.Empty;
        public decimal Quantity { get; set; }
        public decimal GrossAmount { get; set; }
        public decimal NetAmount { get; set; }
        public decimal Discount { get; set; }
        public string DiscountType { get; set; } = string.Empty;
        public decimal UnitPrice { get; set; }
        public string VATRate { get; set; } = string.Empty;
        public int Mileage { get; set; }
        public string Distributor { get; set; } = string.Empty;
        public DateTime PurchaseDate { get; set; }
        public DateTime Period { get; set; }
        public string TransactionNumber { get; set; } = string.Empty;
        public DateTime InvoiceDate { get; set; }
        public string InvoiceNumber { get; set; } = string.Empty;
        public DateTime ReflectionDate { get; set; }
        public long SalesRepresentativeId { get; set; }
        public string SalesRepresentative { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
        [MaxLength(500)]
        public string? DeviceDescription { get; set; }
    }

    // List Request with Filters
    public class VehicleFuelPurchaseListRequest
    {
        public int? VehicleId { get; set; }
        public string? LicensePlate { get; set; }
        public DateTime? FromDate { get; set; }
        public DateTime? ToDate { get; set; }
        public string? FuelType { get; set; }
        public string? Station { get; set; }
        public string? City { get; set; }
        public int Page { get; set; } = 1;
        public int PageSize { get; set; } = 25;
        public string? SortBy { get; set; } = "purchaseDate";
        public string? SortOrder { get; set; } = "desc";
    }

    // Statistics Response
    public class VehicleFuelPurchaseStatsDto
    {
        public int TotalPurchases { get; set; }
        public decimal TotalQuantity { get; set; }
        public decimal TotalGrossAmount { get; set; }
        public decimal TotalNetAmount { get; set; }
        public decimal AverageUnitPrice { get; set; }
        public decimal AverageQuantityPerPurchase { get; set; }
        public string MostUsedFuelType { get; set; } = string.Empty;
        public string MostVisitedStation { get; set; } = string.Empty;
        public List<FuelTypeStatDto> FuelTypeStats { get; set; } = new();
        public List<MonthlyStatDto> MonthlyStats { get; set; } = new();
    }

    public class FuelTypeStatDto
    {
        public string FuelType { get; set; } = string.Empty;
        public int Count { get; set; }
        public decimal TotalQuantity { get; set; }
        public decimal TotalAmount { get; set; }
    }

    public class MonthlyStatDto
    {
        public int Year { get; set; }
        public int Month { get; set; }
        public string MonthName { get; set; } = string.Empty;
        public int Count { get; set; }
        public decimal TotalQuantity { get; set; }
        public decimal TotalAmount { get; set; }
    }
}