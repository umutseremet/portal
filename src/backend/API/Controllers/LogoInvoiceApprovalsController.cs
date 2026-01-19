using API.Data;
using API.Data.Entities;
using API.Models.LogoInvoice;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace API.Controllers
{
    /// <summary>
    /// Logo Connect fatura onay yönetimi
    /// Sadece Logo veritabanından SELECT yapılır, INSERT/UPDATE/DELETE işlemleri VervoPortal DB'de yapılır
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
#if !DEBUG
    [Authorize]
#endif
    public class LogoInvoiceApprovalsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IConfiguration _configuration;
        private readonly ILogger<LogoInvoiceApprovalsController> _logger;

        public LogoInvoiceApprovalsController(
            ApplicationDbContext context,
            IConfiguration configuration,
            ILogger<LogoInvoiceApprovalsController> logger)
        {
            _context = context;
            _configuration = configuration;
            _logger = logger;
        }

        private int GetCurrentUserId()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return int.TryParse(userIdClaim, out var userId) ? userId : 0;
        }

        private string GetCurrentUserName()
        {
            return User.Identity?.Name ?? "System";
        }

        /// <summary>
        /// Logo Connect faturalarını listele ve onay durumlarını göster
        /// GET: api/LogoInvoiceApprovals
        /// </summary>
        [HttpGet]
        public async Task<ActionResult<LogoInvoiceListResponse>> GetInvoices([FromQuery] LogoInvoiceFilterRequest filter)
        {
            try
            {
                var logoConnectionString = _configuration.GetConnectionString("LogoConnection");
                if (string.IsNullOrEmpty(logoConnectionString))
                {
                    return StatusCode(500, new { message = "Logo veritabanı bağlantısı yapılandırılmamış." });
                }

                var invoices = new List<LogoInvoiceDto>();

                // Logo Connect'ten faturaları çek
                using (var connection = new SqlConnection(logoConnectionString))
                {
                    await connection.OpenAsync();

                    var query = @"
                        SELECT LOGICALREF, DOCNR, DATE_, SENDERTITLE
                        FROM [CONNECT].[dbo].[LG_006_APPROVAL]
                        WHERE EDOCTYPE = 3 
                          AND DOCNR NOT LIKE 'VR%'";

                    // Filtreler
                    var parameters = new List<SqlParameter>();

                    if (filter.StartDate.HasValue)
                    {
                        query += " AND DATE_ >= @StartDate";
                        parameters.Add(new SqlParameter("@StartDate", filter.StartDate.Value));
                    }

                    if (filter.EndDate.HasValue)
                    {
                        query += " AND DATE_ <= @EndDate";
                        parameters.Add(new SqlParameter("@EndDate", filter.EndDate.Value));
                    }

                    if (!string.IsNullOrEmpty(filter.InvoiceNumber))
                    {
                        query += " AND DOCNR LIKE @InvoiceNumber";
                        parameters.Add(new SqlParameter("@InvoiceNumber", $"%{filter.InvoiceNumber}%"));
                    }

                    query += " ORDER BY DATE_ DESC, LOGICALREF DESC";

                    using (var cmd = new SqlCommand(query, connection))
                    {
                        cmd.Parameters.AddRange(parameters.ToArray());

                        using (var reader = await cmd.ExecuteReaderAsync())
                        {
                            while (await reader.ReadAsync())
                            {
                                invoices.Add(new LogoInvoiceDto
                                {
                                    LogicalRef = reader.GetInt32(0),
                                    InvoiceNumber = reader.GetString(1),
                                    InvoiceDate = reader.GetDateTime(2),
                                    SenderTitle = reader.GetString(3)
                                });
                            }
                        }
                    }
                }

                // VervoPortal'dan onay durumlarını al
                var logicalRefs = invoices.Select(i => i.LogicalRef).ToList();

                var approvals = new Dictionary<int, LogoInvoiceApproval>();

                // Liste boş değilse
                if (logicalRefs.Count > 0)
                {
                    // Direkt SQL IN clause
                    var logicalRefsStr = string.Join(",", logicalRefs);
                    var approvalsList = await _context.LogoInvoiceApprovals
                        .FromSqlRaw($"SELECT * FROM LogoInvoiceApprovals WHERE LogoLogicalRef IN ({logicalRefsStr})")
                        .ToListAsync();

                    approvals = approvalsList.ToDictionary(a => a.LogoLogicalRef, a => a);
                }
                else
                {
                    approvals = new Dictionary<int, LogoInvoiceApproval>();
                }

                // Onay durumlarını birleştir
                foreach (var invoice in invoices)
                {
                    if (approvals.TryGetValue(invoice.LogicalRef, out var approval))
                    {
                        invoice.Status = approval.Status;
                        invoice.SentForApprovalDate = approval.SentForApprovalDate;
                        invoice.SentForApprovalBy = approval.SentForApprovalBy;
                        invoice.ApprovedDate = approval.ApprovedDate;
                        invoice.ApprovedBy = approval.ApprovedBy;
                        invoice.Notes = approval.Notes;
                    }
                    else
                    {
                        invoice.Status = "NotSent"; // Henüz onaya gönderilmemiş
                    }
                }

                // Durum filtrelemesi (frontend'den gelen)
                if (!string.IsNullOrEmpty(filter.Status))
                {
                    invoices = invoices.Where(i => i.Status == filter.Status).ToList();
                }

                // ✅ PAGINATION LOGIC
                var totalCount = invoices.Count;
                var totalPages = (int)Math.Ceiling(totalCount / (double)filter.PageSize);

                // Sayfa numarası kontrolü
                if (filter.Page < 1) filter.Page = 1;
                if (filter.Page > totalPages && totalPages > 0) filter.Page = totalPages;

                // Pagination uygula
                var paginatedInvoices = invoices
                    .Skip((filter.Page - 1) * filter.PageSize)
                    .Take(filter.PageSize)
                    .ToList();

                _logger.LogInformation(
                    "Logo invoices listed: Total={Total}, Page={Page}/{TotalPages}, PageSize={PageSize}",
                    totalCount,
                    filter.Page,
                    totalPages,
                    filter.PageSize);

                return Ok(new LogoInvoiceListResponse
                {
                    Invoices = paginatedInvoices,
                    TotalCount = totalCount,
                    Page = filter.Page,
                    PageSize = filter.PageSize,
                    TotalPages = totalPages
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Logo fatura listesi alınırken hata oluştu");
                return StatusCode(500, new { message = $"Hata: {ex.Message}" });
            }
        }

        /// <summary>
        /// Faturayı onaya gönder
        /// POST: api/LogoInvoiceApprovals/send-for-approval
        /// </summary>
        [HttpPost("send-for-approval")]
        public async Task<ActionResult> SendForApproval([FromBody] SendForApprovalRequest request)
        {
            try
            {
                var currentUserId = GetCurrentUserId();
                var currentUserName = GetCurrentUserName();

                if (currentUserId == 0)
                {
                    return Unauthorized(new { message = "Kullanıcı bilgisi alınamadı." });
                }

                // Logo'dan fatura bilgilerini al
                var logoConnectionString = _configuration.GetConnectionString("LogoConnection");
                if (string.IsNullOrEmpty(logoConnectionString))
                {
                    return StatusCode(500, new { message = "Logo veritabanı bağlantısı yapılandırılmamış." });
                }

                string? invoiceNumber = null;
                DateTime? invoiceDate = null;
                string? senderTitle = null;

                using (var connection = new SqlConnection(logoConnectionString))
                {
                    await connection.OpenAsync();

                    var query = @"
                        SELECT DOCNR, DATE_, SENDERTITLE
                        FROM [CONNECT].[dbo].[LG_006_APPROVAL]
                        WHERE LOGICALREF = @LogicalRef";

                    using (var cmd = new SqlCommand(query, connection))
                    {
                        cmd.Parameters.AddWithValue("@LogicalRef", request.LogicalRef);

                        using (var reader = await cmd.ExecuteReaderAsync())
                        {
                            if (await reader.ReadAsync())
                            {
                                invoiceNumber = reader.GetString(0);
                                invoiceDate = reader.GetDateTime(1);
                                senderTitle = reader.IsDBNull(2) ? null : reader.GetString(2);
                            }
                            else
                            {
                                return NotFound(new { message = "Logo'da fatura bulunamadı." });
                            }
                        }
                    }
                }

                // Daha önce kaydedilmiş mi kontrol et
                var existing = await _context.LogoInvoiceApprovals
                    .FirstOrDefaultAsync(a => a.LogoLogicalRef == request.LogicalRef);

                if (existing != null)
                {
                    // Zaten onaylanmışsa tekrar gönderilemez
                    if (existing.Status == "Approved")
                    {
                        return BadRequest(new { message = "Bu fatura zaten onaylanmış." });
                    }

                    // Tekrar onaya gönder
                    existing.SentForApprovalDate = DateTime.Now;
                    existing.SentForApprovalBy = currentUserId;
                    existing.Status = "Pending";
                    existing.UpdatedAt = DateTime.Now;
                    existing.Notes = request.Notes;
                }
                else
                {
                    // Yeni kayıt oluştur
                    var approval = new LogoInvoiceApproval
                    {
                        LogoLogicalRef = request.LogicalRef,
                        InvoiceNumber = invoiceNumber!,
                        InvoiceDate = invoiceDate!.Value,
                        SenderTitle = senderTitle,
                        SentForApprovalDate = DateTime.Now,
                        SentForApprovalBy = currentUserId,
                        Status = "Pending",
                        Notes = request.Notes
                    };

                    _context.LogoInvoiceApprovals.Add(approval);
                }

                await _context.SaveChangesAsync();

                _logger.LogInformation(
                    "Fatura onaya gönderildi: LogicalRef={LogicalRef}, User={UserId}",
                    request.LogicalRef,
                    currentUserId);

                return Ok(new { message = "Fatura başarıyla onaya gönderildi." });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Fatura onaya gönderilirken hata oluştu");
                return StatusCode(500, new { message = $"Hata: {ex.Message}" });
            }
        }

        /// <summary>
        /// Fatura onayını geri al
        /// POST: api/LogoInvoiceApprovals/revoke
        /// </summary>
        [HttpPost("revoke")]
        public async Task<ActionResult> RevokeApproval([FromBody] RevokeApprovalRequest request)
        {
            try
            {
                var currentUserId = GetCurrentUserId();
                var currentUserName = GetCurrentUserName();

                if (currentUserId == 0)
                {
                    return Unauthorized(new { message = "Kullanıcı bilgisi alınamadı." });
                }

                var approval = await _context.LogoInvoiceApprovals
                    .FirstOrDefaultAsync(a => a.LogoLogicalRef == request.LogicalRef);

                if (approval == null)
                {
                    return NotFound(new { message = "Fatura onay kaydı bulunamadı." });
                }

                if (approval.Status == "NotSent")
                {
                    return BadRequest(new { message = "Henüz onaya gönderilmemiş faturanın onayı geri alınamaz." });
                }

                // Approved ise -> Pending'e geri al
                if (approval.Status == "Approved")
                {
                    approval.Status = "Pending";
                    approval.ApprovedDate = null;
                    approval.ApprovedBy = null;
                    approval.UpdatedAt = DateTime.Now;

                    if (!string.IsNullOrEmpty(request.Notes))
                    {
                        approval.Notes = (approval.Notes ?? "") + "\n[Onay Geri Alındı] " + request.Notes;
                    }

                    await _context.SaveChangesAsync();

                    _logger.LogInformation(
                        "Fatura onayı geri alındı (Approved->Pending): LogicalRef={LogicalRef}, User={UserId}",
                        request.LogicalRef,
                        currentUserId);

                    return Ok(new { message = "Fatura onayı başarıyla geri alındı." });
                }

                // Pending ise -> NotSent'e geri al (onaya gönderilmeyi iptal et)
                if (approval.Status == "Pending")
                {
                    approval.Status = "NotSent";
                    approval.SentForApprovalDate = null;
                    approval.SentForApprovalBy = null;
                    approval.UpdatedAt = DateTime.Now;

                    if (!string.IsNullOrEmpty(request.Notes))
                    {
                        approval.Notes = (approval.Notes ?? "") + "\n[Onaya Gönderilme İptal] " + request.Notes;
                    }

                    await _context.SaveChangesAsync();

                    _logger.LogInformation(
                        "Fatura onaya gönderilmesi iptal edildi (Pending->NotSent): LogicalRef={LogicalRef}, User={UserId}",
                        request.LogicalRef,
                        currentUserId);

                    return Ok(new { message = "Fatura onaya gönderilmesi başarıyla iptal edildi." });
                }

                return BadRequest(new { message = "Fatura uygun durumda değil." });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Fatura onayı geri alınırken hata oluştu");
                return StatusCode(500, new { message = $"Hata: {ex.Message}" });
            }
        }

        /// <summary>
        /// Faturayı onayla
        /// POST: api/LogoInvoiceApprovals/approve
        /// </summary>
        [HttpPost("approve")]
        public async Task<ActionResult> ApproveInvoice([FromBody] ApproveInvoiceRequest request)
        {
            try
            {
                var currentUserId = GetCurrentUserId();
                var currentUserName = GetCurrentUserName();

                if (currentUserId == 0)
                {
                    return Unauthorized(new { message = "Kullanıcı bilgisi alınamadı." });
                }

                var approval = await _context.LogoInvoiceApprovals
                    .FirstOrDefaultAsync(a => a.LogoLogicalRef == request.LogicalRef);

                if (approval == null)
                {
                    return NotFound(new { message = "Fatura onay kaydı bulunamadı." });
                }

                if (approval.Status == "Approved")
                {
                    return BadRequest(new { message = "Bu fatura zaten onaylanmış." });
                }

                if (approval.Status != "Pending")
                {
                    return BadRequest(new { message = "Sadece onay bekleyen faturalar onaylanabilir." });
                }

                approval.ApprovedDate = DateTime.Now;
                approval.ApprovedBy = currentUserId;
                approval.Status = "Approved";
                approval.UpdatedAt = DateTime.Now;

                if (!string.IsNullOrEmpty(request.Notes))
                {
                    approval.Notes = (approval.Notes ?? "") + "\n[Onay] " + request.Notes;
                }

                await _context.SaveChangesAsync();

                _logger.LogInformation(
                    "Fatura onaylandı: LogicalRef={LogicalRef}, User={UserId}",
                    request.LogicalRef,
                    currentUserId);

                return Ok(new { message = "Fatura başarıyla onaylandı." });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Fatura onaylanırken hata oluştu");
                return StatusCode(500, new { message = $"Hata: {ex.Message}" });
            }
        }
    }
}