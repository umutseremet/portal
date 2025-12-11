// src/backend/API/Controllers/PurchaseRequestsController.cs
// FULL VERSION - Tüm metodlar eklenmiş
using API.Data;
using API.Data.Entities;
using API.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Data.SqlClient;
using System.Data;
using System.Security.Claims;

namespace API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
#if !DEBUG
    [Authorize]
#endif
    public class PurchaseRequestsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<PurchaseRequestsController> _logger;
        private readonly IConfiguration _configuration;

        public PurchaseRequestsController(
            ApplicationDbContext context,
            ILogger<PurchaseRequestsController> logger,
            IConfiguration configuration)
        {
            _context = context;
            _logger = logger;
            _configuration = configuration;
        }

        #region Helper Methods

        private int GetCurrentUserId()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return int.TryParse(userIdClaim, out int userId) ? userId : 0;
        }

        private string GetCurrentUserName()
        {
            return User.FindFirst(ClaimTypes.Name)?.Value ?? "System";
        }

        private async Task<string> GenerateRequestNumber()
        {
            try
            {
                var connectionString = _configuration.GetConnectionString("DefaultConnection");
                using var connection = new SqlConnection(connectionString);
                await connection.OpenAsync();

                using var command = new SqlCommand("sp_GenerateRequestNumber", connection);
                command.CommandType = CommandType.StoredProcedure;

                var outputParam = new SqlParameter("@RequestNumber", SqlDbType.NVarChar, 50)
                {
                    Direction = ParameterDirection.Output
                };
                command.Parameters.Add(outputParam);

                await command.ExecuteNonQueryAsync();

                return outputParam.Value?.ToString() ?? "TR-ERROR";
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error generating request number");
                return $"TR-{DateTime.Now:yyyyMMddHHmmss}";
            }
        }

        private async Task AddApprovalHistory(int requestId, string stepName, string action, string? notes = null)
        {
            try
            {
                var history = new PurchaseRequestApprovalHistory
                {
                    RequestId = requestId,
                    StepName = stepName,
                    Action = action,
                    UserId = GetCurrentUserId(),
                    UserName = GetCurrentUserName(),
                    ActionDate = DateTime.Now,
                    Notes = notes
                };

                _context.Set<PurchaseRequestApprovalHistory>().Add(history);
                await _context.SaveChangesAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error adding approval history");
            }
        }

        #endregion

        /// <summary>
        /// Talep listesini getir (filtreleme, sayfalama ile)
        /// GET: api/PurchaseRequests
        /// </summary>
        [HttpGet]
        public async Task<ActionResult<GetPurchaseRequestsResponse>> GetPurchaseRequests(
            [FromQuery] GetPurchaseRequestsRequest request)
        {
            try
            {
                var query = _context.PurchaseRequests
                    .Include(r => r.Details)
                    .Include(r => r.PurchaseOrder)
                    .AsQueryable();

                // Filtreleme
                if (!string.IsNullOrEmpty(request.RequestNumber))
                {
                    query = query.Where(r => r.RequestNumber.Contains(request.RequestNumber));
                }

                if (request.UserId.HasValue)
                {
                    query = query.Where(r => r.UserId == request.UserId.Value);
                }

                if (request.DepartmentId.HasValue)
                {
                    query = query.Where(r => r.DepartmentId == request.DepartmentId.Value);
                }

                if (!string.IsNullOrEmpty(request.Status))
                {
                    query = query.Where(r => r.Status == request.Status);
                }

                if (!string.IsNullOrEmpty(request.Priority))
                {
                    query = query.Where(r => r.Priority == request.Priority);
                }

                if (request.FromDate.HasValue)
                {
                    query = query.Where(r => r.RequestDate >= request.FromDate.Value);
                }

                if (request.ToDate.HasValue)
                {
                    query = query.Where(r => r.RequestDate <= request.ToDate.Value);
                }

                if (!request.IncludeCancelled)
                {
                    query = query.Where(r => r.CancelledDate == null);
                }

                // Toplam kayıt sayısı
                var totalCount = await query.CountAsync();

                // Sıralama
                query = request.SortBy?.ToLower() switch
                {
                    "requestnumber" => request.SortOrder?.ToLower() == "asc"
                        ? query.OrderBy(r => r.RequestNumber)
                        : query.OrderByDescending(r => r.RequestNumber),
                    "username" => request.SortOrder?.ToLower() == "asc"
                        ? query.OrderBy(r => r.UserName)
                        : query.OrderByDescending(r => r.UserName),
                    "status" => request.SortOrder?.ToLower() == "asc"
                        ? query.OrderBy(r => r.Status)
                        : query.OrderByDescending(r => r.Status),
                    "priority" => request.SortOrder?.ToLower() == "asc"
                        ? query.OrderBy(r => r.Priority)
                        : query.OrderByDescending(r => r.Priority),
                    _ => request.SortOrder?.ToLower() == "asc"
                        ? query.OrderBy(r => r.RequestDate)
                        : query.OrderByDescending(r => r.RequestDate)
                };

                // Sayfalama
                var items = await query
                    .Skip((request.Page - 1) * request.PageSize)
                    .Take(request.PageSize)
                    .Select(r => new PurchaseRequestListItemDto
                    {
                        Id = r.Id,
                        RequestNumber = r.RequestNumber,
                        RequestDate = r.RequestDate,
                        RequesterName = r.UserName, // ✅ EKLE
                        UserId = r.UserId,
                        UserName = r.UserName,
                        DepartmentId = r.DepartmentId,
                        DepartmentName = r.DepartmentName,
                        Description = r.Description,
                        Priority = r.Priority,
                        RequestType = r.RequestType,
                        Status = r.Status,
                        DetailCount = r.Details.Count,
                        TotalEstimatedAmount = r.Details.Sum(d => d.EstimatedTotalPrice),
                        SubmittedDate = r.SubmittedDate,
                        PurchaseOrderId = r.PurchaseOrderId,
                        PurchaseOrderNumber = r.PurchaseOrder != null ? r.PurchaseOrder.OrderNumber : null,
                        CreatedAt = r.CreatedAt,
                        // ✅ DETAYLARI EKLE
                        Details = r.Details.Select(d => new PurchaseRequestDetailDto
                        {
                            Id = d.Id,
                            RequestId = d.RequestId,
                            ItemId = d.ItemId,
                            ItemCode = d.ItemCode,
                            ItemName = d.ItemName,
                            ItemGroupId = d.ItemGroupId,
                            ItemGroupName = d.ItemGroupName,
                            Quantity = d.Quantity,
                            Unit = d.Unit,
                            Description = d.Description,
                            RequiredDate = d.RequiredDate,
                            EstimatedUnitPrice = d.EstimatedUnitPrice,
                            EstimatedTotalPrice = d.EstimatedTotalPrice,
                            Currency = d.Currency,
                            CreatedAt = d.CreatedAt,
                            UpdatedAt = d.UpdatedAt
                        }).ToList()
                    })
                    .ToListAsync();

                var response = new GetPurchaseRequestsResponse
                {
                    Items = items,
                    TotalCount = totalCount,
                    Page = request.Page,
                    PageSize = request.PageSize,
                    TotalPages = (int)Math.Ceiling(totalCount / (double)request.PageSize)
                };

                _logger.LogInformation("Retrieved {Count} purchase requests (Page {Page}/{TotalPages})",
                    items.Count, request.Page, response.TotalPages);

                return Ok(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving purchase requests");
                return StatusCode(500, new { message = "Talep listesi alınırken bir hata oluştu." });
            }
        }

        /// <summary>
        /// Benim taleplerim
        /// GET: api/PurchaseRequests/my-requests
        /// </summary>
        [HttpGet("my-requests")]
        public async Task<ActionResult<GetPurchaseRequestsResponse>> GetMyRequests([FromQuery] GetPurchaseRequestsRequest request)
        {
            request.UserId = GetCurrentUserId();
            return await GetPurchaseRequests(request);
        }

        /// <summary>
        /// Benim onayıma sunulan talepler
        /// GET: api/PurchaseRequests/pending-my-approval
        /// </summary>
        [HttpGet("pending-my-approval")]
        public async Task<ActionResult<GetPurchaseRequestsResponse>> GetPendingMyApproval([FromQuery] GetPurchaseRequestsRequest request)
        {
            // TODO: Permission kontrolü yapılacak
            // Kullanıcının hangi aşamada onay yetkisi olduğunu kontrol et
            // Manager -> ManagerApproval
            // Purchasing -> PurchasingReview
            // Final -> FinalApproval

            request.Status = "Submitted"; // veya ManagerApproval, PurchasingReview
            return await GetPurchaseRequests(request);
        }

        /// <summary>
        /// Talep detayını getir
        /// GET: api/PurchaseRequests/{id}
        /// </summary>
        [HttpGet("{id}")]
        public async Task<ActionResult<PurchaseRequestDetailResponse>> GetPurchaseRequest(int id)
        {
            try
            {
                var request = await _context.PurchaseRequests
                    .Include(r => r.Details)
                        .ThenInclude(d => d.Item)
                            .ThenInclude(i => i.ItemGroup)
                    .Include(r => r.PurchaseOrder)
                    .FirstOrDefaultAsync(r => r.Id == id);

                if (request == null)
                {
                    return NotFound(new { message = "Talep bulunamadı." });
                }

                // Onay geçmişini al
                var approvalHistory = await _context.Set<PurchaseRequestApprovalHistory>()
                    .Where(h => h.RequestId == id)
                    .OrderBy(h => h.ActionDate)
                    .Select(h => new ApprovalHistoryDto
                    {
                        Id = h.Id,
                        StepName = h.StepName,
                        Action = h.Action,
                        UserId = h.UserId,
                        UserName = h.UserName,
                        ActionDate = h.ActionDate,
                        Notes = h.Notes
                    })
                    .ToListAsync();

                var response = new PurchaseRequestDetailResponse
                {
                    Id = request.Id,
                    RequestNumber = request.RequestNumber,
                    RequestDate = request.RequestDate,
                    UserId = request.UserId,
                    UserName = request.UserName,
                    DepartmentId = request.DepartmentId,
                    DepartmentName = request.DepartmentName,
                    Description = request.Description,
                    Priority = request.Priority,
                    RequestType = request.RequestType,
                    Status = request.Status,
                    SubmittedDate = request.SubmittedDate,
                    ManagerApprovalDate = request.ManagerApprovalDate,
                    ManagerApprovedBy = request.ManagerApprovedBy,
                    ManagerApprovalNote = request.ManagerApprovalNote,
                    PurchasingReviewDate = request.PurchasingReviewDate,
                    PurchasingReviewedBy = request.PurchasingReviewedBy,
                    PurchasingReviewNote = request.PurchasingReviewNote,
                    FinalApprovalDate = request.FinalApprovalDate,
                    FinalApprovedBy = request.FinalApprovedBy,
                    FinalApprovalNote = request.FinalApprovalNote,
                    RejectionDate = request.RejectionDate,
                    RejectedBy = request.RejectedBy,
                    RejectionReason = request.RejectionReason,
                    PurchaseOrderId = request.PurchaseOrderId,
                    PurchaseOrderNumber = request.PurchaseOrder?.OrderNumber,
                    CancelledDate = request.CancelledDate,
                    CancelledBy = request.CancelledBy,
                    CancellationReason = request.CancellationReason,
                    CreatedBy = request.CreatedBy,
                    CreatedAt = request.CreatedAt,
                    UpdatedBy = request.UpdatedBy,
                    UpdatedAt = request.UpdatedAt,
                    Details = request.Details.Select(d => new PurchaseRequestDetailDto
                    {
                        Id = d.Id,
                        RequestId = d.RequestId,
                        ItemId = d.ItemId,
                        ItemCode = d.ItemCode,
                        ItemName = d.ItemName,
                        ItemGroupId = d.ItemGroupId,
                        ItemGroupName = d.ItemGroupName,
                        Quantity = d.Quantity,
                        Unit = d.Unit,
                        Description = d.Description,
                        RequiredDate = d.RequiredDate,
                        EstimatedUnitPrice = d.EstimatedUnitPrice,
                        EstimatedTotalPrice = d.EstimatedTotalPrice,
                        Currency = d.Currency,
                        PurchaseOrderDetailId = d.PurchaseOrderDetailId,
                        CreatedAt = d.CreatedAt,
                        UpdatedAt = d.UpdatedAt
                    }).ToList(),
                    ApprovalHistory = approvalHistory
                };

                return Ok(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving purchase request {Id}", id);
                return StatusCode(500, new { message = "Talep detayı alınırken bir hata oluştu." });
            }
        }

        /// <summary>
        /// Yeni talep oluştur
        /// POST: api/PurchaseRequests
        /// </summary>
        [HttpPost]
        public async Task<ActionResult<PurchaseRequestDetailResponse>> CreatePurchaseRequest(
            [FromBody] CreatePurchaseRequestRequest request)
        {
            try
            {
                if (request.Details == null || !request.Details.Any())
                {
                    return BadRequest(new { message = "Talep detayları boş olamaz." });
                }

                var currentUserId = GetCurrentUserId();
                var currentUserName = GetCurrentUserName();

                // Talep numarası oluştur
                var requestNumber = await GenerateRequestNumber();

                // Talep oluştur
                var purchaseRequest = new PurchaseRequest
                {
                    RequestNumber = requestNumber,
                    RequestDate = DateTime.Now,
                    UserId = currentUserId,
                    UserName = currentUserName,
                    Description = request.Description,
                    Priority = request.Priority,
                    RequestType = request.RequestType,
                    Status = "Draft",
                    CreatedBy = currentUserId,
                    CreatedAt = DateTime.Now
                };

                // Detayları ekle
                foreach (var detailDto in request.Details)
                {
                    var item = await _context.Items
                        .Include(i => i.ItemGroup)
                        .FirstOrDefaultAsync(i => i.Id == detailDto.ItemId);

                    if (item == null)
                    {
                        return BadRequest(new { message = $"Ürün bulunamadı: {detailDto.ItemId}" });
                    }

                    var detail = new PurchaseRequestDetail
                    {
                        ItemId = item.Id,
                        ItemCode = item.Code,
                        ItemName = item.Name,
                        ItemGroupId = item.GroupId,
                        ItemGroupName = item.ItemGroup?.Name,
                        Quantity = detailDto.Quantity,
                        Unit = detailDto.Unit,
                        Description = detailDto.Description,
                        RequiredDate = detailDto.RequiredDate,
                        EstimatedUnitPrice = detailDto.EstimatedUnitPrice,
                        EstimatedTotalPrice = detailDto.EstimatedUnitPrice.HasValue
                            ? detailDto.Quantity * detailDto.EstimatedUnitPrice.Value
                            : null,
                        Currency = "TRY",
                        CreatedAt = DateTime.Now
                    };

                    purchaseRequest.Details.Add(detail);
                }

                _context.PurchaseRequests.Add(purchaseRequest);
                await _context.SaveChangesAsync();

                // Geçmişe kaydet
                await AddApprovalHistory(purchaseRequest.Id, "Request Created", "Created", "Talep oluşturuldu");

                _logger.LogInformation("Purchase request created: {RequestNumber} by user {UserId}",
                    purchaseRequest.RequestNumber, currentUserId);

                // Detay response döndür
                return await GetPurchaseRequest(purchaseRequest.Id);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating purchase request");
                return StatusCode(500, new { message = "Talep oluşturulurken bir hata oluştu: " + ex.Message });
            }
        }

        /// <summary>
        /// Talep güncelle
        /// PUT: api/PurchaseRequests/{id}
        /// </summary>
        [HttpPut("{id}")]
        public async Task<ActionResult> UpdatePurchaseRequest(int id, [FromBody] UpdatePurchaseRequestRequest request)
        {
            try
            {
                var purchaseRequest = await _context.PurchaseRequests
                    .Include(r => r.Details)
                    .FirstOrDefaultAsync(r => r.Id == id);

                if (purchaseRequest == null)
                {
                    return NotFound(new { message = "Talep bulunamadı." });
                }

                if (purchaseRequest.Status != "Draft")
                {
                    return BadRequest(new { message = "Sadece taslak talepler düzenlenebilir." });
                }

                // Temel bilgileri güncelle
                purchaseRequest.Description = request.Description ?? purchaseRequest.Description;
                purchaseRequest.Priority = request.Priority ?? purchaseRequest.Priority;
                purchaseRequest.RequestType = request.RequestType ?? purchaseRequest.RequestType;
                purchaseRequest.UpdatedBy = GetCurrentUserId();
                purchaseRequest.UpdatedAt = DateTime.Now;

                // Detayları güncelle
                if (request.Details != null && request.Details.Any())
                {
                    // Mevcut detayları temizle
                    _context.PurchaseRequestDetails.RemoveRange(purchaseRequest.Details);

                    // Yeni detayları ekle
                    foreach (var detailDto in request.Details)
                    {
                        var item = await _context.Items
                            .Include(i => i.ItemGroup)
                            .FirstOrDefaultAsync(i => i.Id == detailDto.ItemId);

                        if (item == null) continue;

                        var detail = new PurchaseRequestDetail
                        {
                            RequestId = purchaseRequest.Id,
                            ItemId = item.Id,
                            ItemCode = item.Code,
                            ItemName = item.Name,
                            ItemGroupId = item.GroupId,
                            ItemGroupName = item.ItemGroup?.Name,
                            Quantity = detailDto.Quantity,
                            Unit = detailDto.Unit,
                            Description = detailDto.Description,
                            RequiredDate = detailDto.RequiredDate,
                            EstimatedUnitPrice = detailDto.EstimatedUnitPrice,
                            EstimatedTotalPrice = detailDto.EstimatedUnitPrice.HasValue
                                ? detailDto.Quantity * detailDto.EstimatedUnitPrice.Value
                                : null,
                            Currency = "TRY",
                            UpdatedAt = DateTime.Now
                        };

                        purchaseRequest.Details.Add(detail);
                    }
                }

                await _context.SaveChangesAsync();

                await AddApprovalHistory(purchaseRequest.Id, "Request Updated", "Updated", "Talep güncellendi");

                _logger.LogInformation("Purchase request updated: {RequestNumber}", purchaseRequest.RequestNumber);

                return Ok(new { message = "Talep başarıyla güncellendi.", requestId = purchaseRequest.Id });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating purchase request {Id}", id);
                return StatusCode(500, new { message = "Talep güncellenirken bir hata oluştu: " + ex.Message });
            }
        }

        /// <summary>
        /// Talep sil
        /// DELETE: api/PurchaseRequests/{id}
        /// </summary>
        [HttpDelete("{id}")]
        public async Task<ActionResult> DeletePurchaseRequest(int id)
        {
            try
            {
                var request = await _context.PurchaseRequests
                    .Include(r => r.Details)
                    .FirstOrDefaultAsync(r => r.Id == id);

                if (request == null)
                {
                    return NotFound(new { message = "Talep bulunamadı." });
                }

                if (request.Status != "Draft")
                {
                    return BadRequest(new { message = "Sadece taslak talepler silinebilir." });
                }

                _context.PurchaseRequests.Remove(request);
                await _context.SaveChangesAsync();

                _logger.LogInformation("Purchase request deleted: {RequestNumber}", request.RequestNumber);

                return Ok(new { message = "Talep başarıyla silindi." });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting purchase request {Id}", id);
                return StatusCode(500, new { message = "Talep silinirken bir hata oluştu." });
            }
        }

        /// <summary>
        /// Talebi gönder (onaya sun)
        /// POST: api/PurchaseRequests/{id}/submit
        /// </summary>
        [HttpPost("{id}/submit")]
        public async Task<ActionResult> SubmitPurchaseRequest(int id)
        {
            try
            {
                var request = await _context.PurchaseRequests.FindAsync(id);

                if (request == null)
                {
                    return NotFound(new { message = "Talep bulunamadı." });
                }

                if (request.Status != "Draft")
                {
                    return BadRequest(new { message = "Sadece taslak talepler gönderilebilir." });
                }

                request.Status = "Submitted";
                request.SubmittedDate = DateTime.Now;
                request.UpdatedBy = GetCurrentUserId();
                request.UpdatedAt = DateTime.Now;

                await _context.SaveChangesAsync();

                await AddApprovalHistory(request.Id, "Request Submitted", "Submitted", "Talep onaya gönderildi");

                _logger.LogInformation("Purchase request submitted: {RequestNumber}", request.RequestNumber);

                return Ok(new { message = "Talep başarıyla gönderildi.", requestId = request.Id });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error submitting purchase request {Id}", id);
                return StatusCode(500, new { message = "Talep gönderilirken bir hata oluştu." });
            }
        }

        /// <summary>
        /// Talebi onayla
        /// POST: api/PurchaseRequests/{id}/approve
        /// </summary>
        [HttpPost("{id}/approve")]
        public async Task<ActionResult> ApprovePurchaseRequest(int id, [FromBody] ApproveRejectRequestRequest approveRequest)
        {
            try
            {
                var request = await _context.PurchaseRequests.FindAsync(id);

                if (request == null)
                {
                    return NotFound(new { message = "Talep bulunamadı." });
                }

                var currentUserId = GetCurrentUserId();
                var currentUserName = GetCurrentUserName();

                // TODO: Permission kontrolü yapılacak
                // Kullanıcının hangi aşamada onay yetkisi olduğunu kontrol et

                // Duruma göre işlem yap
                if (request.Status == "Submitted")
                {
                    // Yönetici onayı
                    request.Status = "ManagerApproval";
                    request.ManagerApprovalDate = DateTime.Now;
                    request.ManagerApprovedBy = currentUserId;
                    request.ManagerApprovalNote = approveRequest.Notes;

                    await AddApprovalHistory(request.Id, "Manager Approval", "Approved", approveRequest.Notes);
                }
                else if (request.Status == "ManagerApproval")
                {
                    // Satınalma incelemesi
                    request.Status = "PurchasingReview";
                    request.PurchasingReviewDate = DateTime.Now;
                    request.PurchasingReviewedBy = currentUserId;
                    request.PurchasingReviewNote = approveRequest.Notes;

                    await AddApprovalHistory(request.Id, "Purchasing Review", "Approved", approveRequest.Notes);
                }
                else if (request.Status == "PurchasingReview")
                {
                    // Final onay
                    request.Status = "Approved";
                    request.FinalApprovalDate = DateTime.Now;
                    request.FinalApprovedBy = currentUserId;
                    request.FinalApprovalNote = approveRequest.Notes;

                    await AddApprovalHistory(request.Id, "Final Approval", "Approved", approveRequest.Notes);
                }
                else
                {
                    return BadRequest(new { message = "Talep onaylanabilir durumda değil." });
                }

                request.UpdatedBy = currentUserId;
                request.UpdatedAt = DateTime.Now;

                await _context.SaveChangesAsync();

                _logger.LogInformation("Purchase request approved: {RequestNumber} by user {UserId}",
                    request.RequestNumber, currentUserId);

                return Ok(new { message = "Talep başarıyla onaylandı.", requestId = request.Id, status = request.Status });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error approving purchase request {Id}", id);
                return StatusCode(500, new { message = "Talep onaylanırken bir hata oluştu." });
            }
        }

        /// <summary>
        /// Talebi reddet
        /// POST: api/PurchaseRequests/{id}/reject
        /// </summary>
        [HttpPost("{id}/reject")]
        public async Task<ActionResult> RejectPurchaseRequest(int id, [FromBody] ApproveRejectRequestRequest rejectRequest)
        {
            try
            {
                var request = await _context.PurchaseRequests.FindAsync(id);

                if (request == null)
                {
                    return NotFound(new { message = "Talep bulunamadı." });
                }

                if (request.Status == "Draft" || request.Status == "Approved" || request.Status == "Completed")
                {
                    return BadRequest(new { message = "Bu talep reddedilemez." });
                }

                request.Status = "Rejected";
                request.RejectionDate = DateTime.Now;
                request.RejectedBy = GetCurrentUserId();
                request.RejectionReason = rejectRequest.Notes;
                request.UpdatedBy = GetCurrentUserId();
                request.UpdatedAt = DateTime.Now;

                await _context.SaveChangesAsync();

                await AddApprovalHistory(request.Id, "Request Rejected", "Rejected", rejectRequest.Notes);

                _logger.LogInformation("Purchase request rejected: {RequestNumber}", request.RequestNumber);

                return Ok(new { message = "Talep reddedildi.", requestId = request.Id });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error rejecting purchase request {Id}", id);
                return StatusCode(500, new { message = "Talep reddedilirken bir hata oluştu." });
            }
        }

        /// <summary>
        /// Talebi iptal et
        /// POST: api/PurchaseRequests/{id}/cancel
        /// </summary>
        [HttpPost("{id}/cancel")]
        public async Task<ActionResult> CancelPurchaseRequest(int id, [FromBody] ApproveRejectRequestRequest cancelRequest)
        {
            try
            {
                var request = await _context.PurchaseRequests.FindAsync(id);

                if (request == null)
                {
                    return NotFound(new { message = "Talep bulunamadı." });
                }

                if (request.Status == "Completed" || request.Status == "Cancelled")
                {
                    return BadRequest(new { message = "Bu talep iptal edilemez." });
                }

                request.Status = "Cancelled";
                request.CancelledDate = DateTime.Now;
                request.CancelledBy = GetCurrentUserId();
                request.CancellationReason = cancelRequest.Notes;
                request.UpdatedBy = GetCurrentUserId();
                request.UpdatedAt = DateTime.Now;

                await _context.SaveChangesAsync();

                await AddApprovalHistory(request.Id, "Request Cancelled", "Cancelled", cancelRequest.Notes);

                _logger.LogInformation("Purchase request cancelled: {RequestNumber}", request.RequestNumber);

                return Ok(new { message = "Talep iptal edildi.", requestId = request.Id });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error cancelling purchase request {Id}", id);
                return StatusCode(500, new { message = "Talep iptal edilirken bir hata oluştu." });
            }
        }

        /// <summary>
        /// Talep istatistikleri
        /// GET: api/PurchaseRequests/stats
        /// </summary>
        [HttpGet("stats")]
        public async Task<ActionResult<PurchaseRequestStatsDto>> GetStats()
        {
            try
            {
                var stats = new PurchaseRequestStatsDto
                {
                    TotalRequests = await _context.PurchaseRequests.CountAsync(r => r.CancelledDate == null),
                    PendingApproval = await _context.PurchaseRequests.CountAsync(r =>
                        r.Status == "Submitted" || r.Status == "ManagerApproval" || r.Status == "PurchasingReview"),
                    Approved = await _context.PurchaseRequests.CountAsync(r => r.Status == "Approved"),
                    Rejected = await _context.PurchaseRequests.CountAsync(r => r.Status == "Rejected"),
                    InProgress = await _context.PurchaseRequests.CountAsync(r =>
                        r.Status == "Submitted" || r.Status == "ManagerApproval" || r.Status == "PurchasingReview"),
                    Completed = await _context.PurchaseRequests.CountAsync(r => r.Status == "Completed"),
                    TotalEstimatedValue = await _context.PurchaseRequestDetails
                        .Where(d => d.Request.CancelledDate == null)
                        .SumAsync(d => d.EstimatedTotalPrice ?? 0)
                };

                return Ok(stats);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving purchase request stats");
                return StatusCode(500, new { message = "İstatistikler alınırken bir hata oluştu." });
            }
        }
    }
}