using System;
using System.Collections.Generic;

namespace API.Models.LogoInvoice
{
   

    /// <summary>
    /// Logo fatura DTO
    /// </summary>
    public class LogoInvoiceDto
    {
        public int LogicalRef { get; set; }
        public string InvoiceNumber { get; set; } = string.Empty;
        public DateTime InvoiceDate { get; set; }
        public string Status { get; set; } = "NotSent"; // NotSent, Pending, Approved
        public DateTime? SentForApprovalDate { get; set; }
        public int? SentForApprovalBy { get; set; }
        public string? SentForApprovalByName { get; set; }
        public DateTime? ApprovedDate { get; set; }
        public int? ApprovedBy { get; set; }
        public string? ApprovedByName { get; set; }
        public string? Notes { get; set; }
        public string? SenderTitle { get; set; }
    }

    /// <summary>
    /// Logo fatura listesi response modeli
    /// </summary>
    public class LogoInvoiceListResponse
    {
        public List<LogoInvoiceDto> Invoices { get; set; } = new();
        public int TotalCount { get; set; }

        // ✅ YENİ: Pagination bilgileri
        public int Page { get; set; }
        public int PageSize { get; set; }
        public int TotalPages { get; set; }
    }

    /// <summary>
    /// Onaya gönderme request modeli
    /// </summary>
    public class SendForApprovalRequest
    {
        public int LogicalRef { get; set; }
        public string? Notes { get; set; }
    }

    /// <summary>
    /// Onaylama request modeli
    /// </summary>
    public class ApproveInvoiceRequest
    {
        public int LogicalRef { get; set; }
        public string? Notes { get; set; }
    }

    /// <summary>
    /// Onay geri alma request modeli
    /// </summary>
    public class RevokeApprovalRequest
    {
        public int LogicalRef { get; set; }
        public string? Notes { get; set; }
    }

    /// <summary>
    /// Logo fatura listesi filtre request modeli
    /// </summary>
    public class LogoInvoiceFilterRequest
    {
        public DateTime? StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public string? InvoiceNumber { get; set; }
        public string? Status { get; set; } // NotSent, Pending, Approved

        // ✅ YENİ: Pagination parametreleri
        public int Page { get; set; } = 1;
        public int PageSize { get; set; } = 20;
    }
}