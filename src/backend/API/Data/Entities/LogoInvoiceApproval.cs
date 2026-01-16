using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace API.Data.Entities
{
    /// <summary>
    /// Logo Connect fatura onay durumlarını takip eden eşleşme tablosu
    /// Logo veritabanında herhangi bir değişiklik yapılmaz, sadece portal tarafında onay durumu takibi yapılır
    /// </summary>
    [Table("LogoInvoiceApprovals")]
    public class LogoInvoiceApproval
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }

        /// <summary>
        /// Logo'daki LOGICALREF (Unique identifier)
        /// </summary>
        [Required]
        public int LogoLogicalRef { get; set; }

        /// <summary>
        /// Fatura numarası (DOCNR)
        /// </summary>
        [Required]
        [StringLength(50)]
        public string InvoiceNumber { get; set; } = string.Empty;

        /// <summary>
        /// Fatura tarihi (DATE_)
        /// </summary>
        public DateTime InvoiceDate { get; set; }

        /// <summary>
        /// Onaya gönderilme tarihi
        /// </summary>
        public DateTime? SentForApprovalDate { get; set; }

        /// <summary>
        /// Onaya gönderen kullanıcı ID (Redmine user id)
        /// </summary>
        public int? SentForApprovalBy { get; set; }

        /// <summary>
        /// Onaylanma tarihi
        /// </summary>
        public DateTime? ApprovedDate { get; set; }

        /// <summary>
        /// Onaylayan kullanıcı ID (Redmine user id)
        /// </summary>
        public int? ApprovedBy { get; set; }

        /// <summary>
        /// Mevcut durum: Pending (Onay Bekliyor), Approved (Onaylandı)
        /// </summary>
        [Required]
        [StringLength(20)]
        public string Status { get; set; } = "Pending";

        /// <summary>
        /// Kayıt oluşturma tarihi
        /// </summary>
        public DateTime CreatedAt { get; set; } = DateTime.Now;

        /// <summary>
        /// Son güncelleme tarihi
        /// </summary>
        public DateTime UpdatedAt { get; set; } = DateTime.Now;

        /// <summary>
        /// Onay notu
        /// </summary>
        [StringLength(500)]
        public string? Notes { get; set; }

        /// <summary>
        /// Gönderen firma/kişi adı (SENDERTITLE)
        /// </summary>
        [StringLength(250)]
        public string? SenderTitle { get; set; }
    }
}