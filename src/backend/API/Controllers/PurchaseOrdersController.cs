// src/backend/API/Controllers/PurchaseOrdersController.cs
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
    public class PurchaseOrdersController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<PurchaseOrdersController> _logger;
        private readonly IConfiguration _configuration;

        public PurchaseOrdersController(
            ApplicationDbContext context,
            ILogger<PurchaseOrdersController> logger,
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

        private async Task<string> GenerateOrderNumber()
        {
            try
            {
                var connectionString = _configuration.GetConnectionString("DefaultConnection");
                using var connection = new SqlConnection(connectionString);
                await connection.OpenAsync();

                using var command = new SqlCommand("sp_GenerateOrderNumber", connection);
                command.CommandType = CommandType.StoredProcedure;

                var outputParam = new SqlParameter("@OrderNumber", SqlDbType.NVarChar, 50)
                {
                    Direction = ParameterDirection.Output
                };
                command.Parameters.Add(outputParam);

                await command.ExecuteNonQueryAsync();

                return outputParam.Value?.ToString() ?? "PO-ERROR";
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error generating order number");
                return $"PO-{DateTime.Now:yyyyMMddHHmmss}";
            }
        }

        private async Task AddOrderHistory(int orderId, string stepName, string action, string? notes = null)
        {
            try
            {
                var history = new PurchaseOrderHistory
                {
                    OrderId = orderId,
                    StepName = stepName,
                    Action = action,
                    UserId = GetCurrentUserId(),
                    UserName = GetCurrentUserName(),
                    ActionDate = DateTime.Now,
                    Notes = notes
                };

                _context.Set<PurchaseOrderHistory>().Add(history);
                await _context.SaveChangesAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error adding order history");
            }
        }

        #endregion

        /// <summary>
        /// Sipariş listesini getir (filtreleme, sayfalama ile)
        /// GET: api/PurchaseOrders
        /// </summary>
        [HttpGet]
        public async Task<ActionResult<GetPurchaseOrdersResponse>> GetPurchaseOrders(
            [FromQuery] GetPurchaseOrdersRequest request)
        {
            try
            {
                var query = _context.PurchaseOrders
                    .Include(o => o.Details)
                    .AsQueryable();

                // Filtreleme
                if (!string.IsNullOrEmpty(request.OrderNumber))
                {
                    query = query.Where(o => o.OrderNumber.Contains(request.OrderNumber));
                }

                if (request.UserId.HasValue)
                {
                    query = query.Where(o => o.UserId == request.UserId.Value);
                }

                if (request.DepartmentId.HasValue)
                {
                    query = query.Where(o => o.DepartmentId == request.DepartmentId.Value);
                }

                if (!string.IsNullOrEmpty(request.Status))
                {
                    query = query.Where(o => o.Status == request.Status);
                }

                if (!string.IsNullOrEmpty(request.SupplierCode))
                {
                    query = query.Where(o => o.SupplierCode != null && o.SupplierCode.Contains(request.SupplierCode));
                }

                if (!string.IsNullOrEmpty(request.SupplierName))
                {
                    query = query.Where(o => o.SupplierName != null && o.SupplierName.Contains(request.SupplierName));
                }

                if (request.FromDate.HasValue)
                {
                    query = query.Where(o => o.OrderDate >= request.FromDate.Value);
                }

                if (request.ToDate.HasValue)
                {
                    query = query.Where(o => o.OrderDate <= request.ToDate.Value);
                }

                if (!request.IncludeCancelled)
                {
                    query = query.Where(o => o.CancelledDate == null);
                }

                // Toplam kayıt sayısı
                var totalCount = await query.CountAsync();

                // Sıralama
                query = request.SortBy?.ToLower() switch
                {
                    "ordernumber" => request.SortOrder?.ToLower() == "asc"
                        ? query.OrderBy(o => o.OrderNumber)
                        : query.OrderByDescending(o => o.OrderNumber),
                    "username" => request.SortOrder?.ToLower() == "asc"
                        ? query.OrderBy(o => o.UserName)
                        : query.OrderByDescending(o => o.UserName),
                    "status" => request.SortOrder?.ToLower() == "asc"
                        ? query.OrderBy(o => o.Status)
                        : query.OrderByDescending(o => o.Status),
                    "suppliername" => request.SortOrder?.ToLower() == "asc"
                        ? query.OrderBy(o => o.SupplierName)
                        : query.OrderByDescending(o => o.SupplierName),
                    "grandtotal" => request.SortOrder?.ToLower() == "asc"
                        ? query.OrderBy(o => o.GrandTotal)
                        : query.OrderByDescending(o => o.GrandTotal),
                    _ => request.SortOrder?.ToLower() == "asc"
                        ? query.OrderBy(o => o.OrderDate)
                        : query.OrderByDescending(o => o.OrderDate)
                };

                // Sayfalama
                var items = await query
                    .Skip((request.Page - 1) * request.PageSize)
                    .Take(request.PageSize)
                    .Select(o => new PurchaseOrderListItemDto
                    {
                        Id = o.Id,
                        OrderNumber = o.OrderNumber,
                        OrderDate = o.OrderDate,
                        UserId = o.UserId,
                        UserName = o.UserName,
                        DepartmentId = o.DepartmentId,
                        DepartmentName = o.DepartmentName,
                        SupplierCode = o.SupplierCode,
                        SupplierName = o.SupplierName,
                        Description = o.Description,
                        Status = o.Status,
                        DetailCount = o.Details.Count,
                        TotalAmount = o.TotalAmount,
                        GrandTotal = o.GrandTotal,
                        Currency = o.Currency,
                        RequestedDeliveryDate = o.RequestedDeliveryDate,
                        ConfirmedDeliveryDate = o.ConfirmedDeliveryDate,
                        ActualDeliveryDate = o.ActualDeliveryDate,
                        RelatedRequestIds = o.RelatedRequestIds,
                        CreatedAt = o.CreatedAt
                    })
                    .ToListAsync();

                var response = new GetPurchaseOrdersResponse
                {
                    Items = items,
                    TotalCount = totalCount,
                    Page = request.Page,
                    PageSize = request.PageSize,
                    TotalPages = (int)Math.Ceiling(totalCount / (double)request.PageSize)
                };

                _logger.LogInformation("Retrieved {Count} purchase orders (Page {Page}/{TotalPages})",
                    items.Count, request.Page, response.TotalPages);

                return Ok(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving purchase orders");
                return StatusCode(500, new { message = "Sipariş listesi alınırken bir hata oluştu." });
            }
        }

        /// <summary>
        /// Sipariş detayını getir
        /// GET: api/PurchaseOrders/{id}
        /// </summary>
        [HttpGet("{id}")]
        public async Task<ActionResult<PurchaseOrderDetailResponse>> GetPurchaseOrder(int id)
        {
            try
            {
                var order = await _context.PurchaseOrders
                    .Include(o => o.Details)
                        .ThenInclude(d => d.Item)
                            .ThenInclude(i => i.ItemGroup)
                    .FirstOrDefaultAsync(o => o.Id == id);

                if (order == null)
                {
                    return NotFound(new { message = "Sipariş bulunamadı." });
                }

                // İlişkili talepleri getir
                List<RelatedRequestInfoDto>? relatedRequests = null;
                if (!string.IsNullOrEmpty(order.RelatedRequestIds))
                {
                    var requestIds = order.RelatedRequestIds
                        .Split(',')
                        .Select(id => int.TryParse(id.Trim(), out int val) ? val : 0)
                        .Where(id => id > 0)
                        .ToList();

                    if (requestIds.Any())
                    {
                        relatedRequests = await _context.PurchaseRequests
                            .Where(r => requestIds.Contains(r.Id))
                            .Select(r => new RelatedRequestInfoDto
                            {
                                Id = r.Id,
                                RequestNumber = r.RequestNumber,
                                RequestDate = r.RequestDate,
                                UserName = r.UserName,
                                Status = r.Status
                            })
                            .ToListAsync();
                    }
                }

                // Sipariş geçmişini al
                var orderHistory = await _context.Set<PurchaseOrderHistory>()
                    .Where(h => h.OrderId == id)
                    .OrderBy(h => h.ActionDate)
                    .Select(h => new OrderHistoryDto
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

                var response = new PurchaseOrderDetailResponse
                {
                    Id = order.Id,
                    OrderNumber = order.OrderNumber,
                    OrderDate = order.OrderDate,
                    UserId = order.UserId,
                    UserName = order.UserName,
                    DepartmentId = order.DepartmentId,
                    DepartmentName = order.DepartmentName,
                    SupplierCode = order.SupplierCode,
                    SupplierName = order.SupplierName,
                    SupplierContact = order.SupplierContact,
                    SupplierPhone = order.SupplierPhone,
                    SupplierEmail = order.SupplierEmail,
                    SupplierAddress = order.SupplierAddress,
                    DeliveryAddress = order.DeliveryAddress,
                    RequestedDeliveryDate = order.RequestedDeliveryDate,
                    ConfirmedDeliveryDate = order.ConfirmedDeliveryDate,
                    ActualDeliveryDate = order.ActualDeliveryDate,
                    Description = order.Description,
                    PaymentTerms = order.PaymentTerms,
                    DeliveryTerms = order.DeliveryTerms,
                    TotalAmount = order.TotalAmount,
                    Currency = order.Currency,
                    VATRate = order.VATRate,
                    VATAmount = order.VATAmount,
                    GrandTotal = order.GrandTotal,
                    Status = order.Status,
                    SubmittedDate = order.SubmittedDate,
                    ApprovalDate = order.ApprovalDate,
                    ApprovedBy = order.ApprovedBy,
                    ApprovalNote = order.ApprovalNote,
                    ConfirmationDate = order.ConfirmationDate,
                    ConfirmedBy = order.ConfirmedBy,
                    ConfirmationNote = order.ConfirmationNote,
                    CancelledDate = order.CancelledDate,
                    CancelledBy = order.CancelledBy,
                    CancellationReason = order.CancellationReason,
                    RelatedRequestIds = order.RelatedRequestIds,
                    RelatedRequests = relatedRequests,
                    CreatedBy = order.CreatedBy,
                    CreatedAt = order.CreatedAt,
                    UpdatedBy = order.UpdatedBy,
                    UpdatedAt = order.UpdatedAt,
                    Details = order.Details.Select(d => new PurchaseOrderDetailDto
                    {
                        Id = d.Id,
                        OrderId = d.OrderId,
                        ItemId = d.ItemId,
                        ItemCode = d.ItemCode,
                        ItemName = d.ItemName,
                        ItemGroupId = d.ItemGroupId,
                        ItemGroupName = d.ItemGroupName,
                        OrderedQuantity = d.OrderedQuantity,
                        ReceivedQuantity = d.ReceivedQuantity,
                        Unit = d.Unit,
                        UnitPrice = d.UnitPrice,
                        TotalPrice = d.TotalPrice,
                        Currency = d.Currency,
                        RequestedDeliveryDate = d.RequestedDeliveryDate,
                        ActualDeliveryDate = d.ActualDeliveryDate,
                        Description = d.Description,
                        SupplierPartNumber = d.SupplierPartNumber,
                        RequestDetailId = d.RequestDetailId,
                        Status = d.Status,
                        CreatedAt = d.CreatedAt,
                        UpdatedAt = d.UpdatedAt
                    }).ToList(),
                    OrderHistory = orderHistory
                };

                return Ok(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving purchase order {Id}", id);
                return StatusCode(500, new { message = "Sipariş detayı alınırken bir hata oluştu." });
            }
        }

        /// <summary>
        /// Yeni sipariş oluştur
        /// POST: api/PurchaseOrders
        /// </summary>
        [HttpPost]
        public async Task<ActionResult<PurchaseOrderDetailResponse>> CreatePurchaseOrder(
            [FromBody] CreatePurchaseOrderRequest request)
        {
            try
            {
                if (request.Details == null || !request.Details.Any())
                {
                    return BadRequest(new { message = "Sipariş detayları boş olamaz." });
                }

                var currentUserId = GetCurrentUserId();
                var currentUserName = GetCurrentUserName();

                // Sipariş numarası oluştur
                var orderNumber = await GenerateOrderNumber();

                // Fiyat hesaplamaları
                decimal totalAmount = request.Details.Sum(d => d.OrderedQuantity * d.UnitPrice);
                decimal vatAmount = totalAmount * (request.VATRate ?? 20.0M) / 100;
                decimal grandTotal = totalAmount + vatAmount;

                // RelatedRequestIds string'e çevir
                string? relatedRequestIds = null;
                if (request.RelatedRequestIds != null && request.RelatedRequestIds.Any())
                {
                    relatedRequestIds = string.Join(",", request.RelatedRequestIds);
                }

                // Sipariş oluştur
                var order = new PurchaseOrder
                {
                    OrderNumber = orderNumber,
                    OrderDate = DateTime.Now,
                    UserId = currentUserId,
                    UserName = currentUserName,
                    SupplierCode = request.SupplierCode,
                    SupplierName = request.SupplierName,
                    SupplierContact = request.SupplierContact,
                    SupplierPhone = request.SupplierPhone,
                    SupplierEmail = request.SupplierEmail,
                    SupplierAddress = request.SupplierAddress,
                    DeliveryAddress = request.DeliveryAddress,
                    RequestedDeliveryDate = request.RequestedDeliveryDate,
                    Description = request.Description,
                    PaymentTerms = request.PaymentTerms,
                    DeliveryTerms = request.DeliveryTerms,
                    TotalAmount = totalAmount,
                    Currency = request.Currency ?? "TRY",
                    VATRate = request.VATRate ?? 20.0M,
                    VATAmount = vatAmount,
                    GrandTotal = grandTotal,
                    Status = "Draft",
                    RelatedRequestIds = relatedRequestIds,
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

                    var detail = new PurchaseOrderDetail
                    {
                        ItemId = item.Id,
                        ItemCode = item.Code,
                        ItemName = item.Name,
                        ItemGroupId = item.GroupId,
                        ItemGroupName = item.ItemGroup?.Name,
                        OrderedQuantity = detailDto.OrderedQuantity,
                        ReceivedQuantity = 0,
                        Unit = detailDto.Unit,
                        UnitPrice = detailDto.UnitPrice,
                        TotalPrice = detailDto.OrderedQuantity * detailDto.UnitPrice,
                        Currency = detailDto.Currency ?? "TRY",
                        RequestedDeliveryDate = detailDto.RequestedDeliveryDate,
                        Description = detailDto.Description,
                        SupplierPartNumber = detailDto.SupplierPartNumber,
                        RequestDetailId = detailDto.RequestDetailId,
                        Status = "Pending",
                        CreatedAt = DateTime.Now
                    };

                    order.Details.Add(detail);
                }

                _context.PurchaseOrders.Add(order);
                await _context.SaveChangesAsync();

                // Geçmişe kaydet
                await AddOrderHistory(order.Id, "Order Created", "Created", "Sipariş oluşturuldu");

                _logger.LogInformation("Purchase order created: {OrderNumber} by user {UserId}",
                    order.OrderNumber, currentUserId);

                // Detay response döndür
                return await GetPurchaseOrder(order.Id);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating purchase order");
                return StatusCode(500, new { message = "Sipariş oluşturulurken bir hata oluştu: " + ex.Message });
            }
        }

        /// <summary>
        /// Taleplerden sipariş oluştur
        /// POST: api/PurchaseOrders/create-from-requests
        /// </summary>
        [HttpPost("create-from-requests")]
        public async Task<ActionResult<PurchaseOrderDetailResponse>> CreateOrderFromRequests(
            [FromBody] CreateOrderFromRequestRequest request)
        {
            try
            {
                if (request.RequestIds == null || !request.RequestIds.Any())
                {
                    return BadRequest(new { message = "Talep seçilmedi." });
                }

                // Talepleri getir
                var requests = await _context.PurchaseRequests
                    .Include(r => r.Details)
                        .ThenInclude(d => d.Item)
                            .ThenInclude(i => i.ItemGroup)
                    .Where(r => request.RequestIds.Contains(r.Id) && r.Status == "Approved")
                    .ToListAsync();

                if (!requests.Any())
                {
                    return BadRequest(new { message = "Onaylanmış talep bulunamadı." });
                }

                // Sipariş detaylarını oluştur
                var orderDetails = new List<CreatePurchaseOrderDetailDto>();

                foreach (var req in requests)
                {
                    foreach (var detail in req.Details)
                    {
                        orderDetails.Add(new CreatePurchaseOrderDetailDto
                        {
                            ItemId = detail.ItemId,
                            OrderedQuantity = detail.Quantity,
                            Unit = detail.Unit,
                            UnitPrice = detail.EstimatedUnitPrice ?? 0,
                            Currency = detail.Currency ?? "TRY",
                            RequestedDeliveryDate = detail.RequiredDate ?? request.RequestedDeliveryDate,
                            Description = detail.Description,
                            RequestDetailId = detail.Id
                        });
                    }
                }

                // Sipariş oluştur
                var createRequest = new CreatePurchaseOrderRequest
                {
                    SupplierCode = request.SupplierCode,
                    SupplierName = request.SupplierName,
                    SupplierContact = request.SupplierContact,
                    Description = request.Description ?? $"Taleplerden oluşturulan sipariş: {string.Join(", ", requests.Select(r => r.RequestNumber))}",
                    PaymentTerms = request.PaymentTerms,
                    RequestedDeliveryDate = request.RequestedDeliveryDate,
                    RelatedRequestIds = request.RequestIds,
                    Details = orderDetails
                };

                var result = await CreatePurchaseOrder(createRequest);

                // Başarılıysa talepleri güncelle
                if (result.Result is OkObjectResult okResult && okResult.Value is PurchaseOrderDetailResponse orderResponse)
                {
                    foreach (var req in requests)
                    {
                        req.PurchaseOrderId = orderResponse.Id;
                        req.Status = "Completed";
                        req.UpdatedBy = GetCurrentUserId();
                        req.UpdatedAt = DateTime.Now;
                    }

                    await _context.SaveChangesAsync();
                }

                return result;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating order from requests");
                return StatusCode(500, new { message = "Taleplerden sipariş oluşturulurken bir hata oluştu: " + ex.Message });
            }
        }

        /// <summary>
        /// Sipariş güncelle
        /// PUT: api/PurchaseOrders/{id}
        /// </summary>
        [HttpPut("{id}")]
        public async Task<ActionResult> UpdatePurchaseOrder(int id, [FromBody] UpdatePurchaseOrderRequest request)
        {
            try
            {
                var order = await _context.PurchaseOrders
                    .Include(o => o.Details)
                    .FirstOrDefaultAsync(o => o.Id == id);

                if (order == null)
                {
                    return NotFound(new { message = "Sipariş bulunamadı." });
                }

                if (order.Status != "Draft")
                {
                    return BadRequest(new { message = "Sadece taslak siparişler düzenlenebilir." });
                }

                // Temel bilgileri güncelle
                order.SupplierCode = request.SupplierCode ?? order.SupplierCode;
                order.SupplierName = request.SupplierName ?? order.SupplierName;
                order.SupplierContact = request.SupplierContact ?? order.SupplierContact;
                order.SupplierPhone = request.SupplierPhone ?? order.SupplierPhone;
                order.SupplierEmail = request.SupplierEmail ?? order.SupplierEmail;
                order.SupplierAddress = request.SupplierAddress ?? order.SupplierAddress;
                order.DeliveryAddress = request.DeliveryAddress ?? order.DeliveryAddress;
                order.RequestedDeliveryDate = request.RequestedDeliveryDate ?? order.RequestedDeliveryDate;
                order.ConfirmedDeliveryDate = request.ConfirmedDeliveryDate ?? order.ConfirmedDeliveryDate;
                order.Description = request.Description ?? order.Description;
                order.PaymentTerms = request.PaymentTerms ?? order.PaymentTerms;
                order.DeliveryTerms = request.DeliveryTerms ?? order.DeliveryTerms;
                order.Currency = request.Currency ?? order.Currency;
                order.VATRate = request.VATRate ?? order.VATRate;
                order.UpdatedBy = GetCurrentUserId();
                order.UpdatedAt = DateTime.Now;

                // Detayları güncelle
                if (request.Details != null && request.Details.Any())
                {
                    // Mevcut detayları temizle
                    _context.PurchaseOrderDetails.RemoveRange(order.Details);

                    // Yeni detayları ekle
                    foreach (var detailDto in request.Details)
                    {
                        var item = await _context.Items
                            .Include(i => i.ItemGroup)
                            .FirstOrDefaultAsync(i => i.Id == detailDto.ItemId);

                        if (item == null) continue;

                        var detail = new PurchaseOrderDetail
                        {
                            OrderId = order.Id,
                            ItemId = item.Id,
                            ItemCode = item.Code,
                            ItemName = item.Name,
                            ItemGroupId = item.GroupId,
                            ItemGroupName = item.ItemGroup?.Name,
                            OrderedQuantity = detailDto.OrderedQuantity,
                            ReceivedQuantity = detailDto.ReceivedQuantity ?? 0,
                            Unit = detailDto.Unit,
                            UnitPrice = detailDto.UnitPrice,
                            TotalPrice = detailDto.OrderedQuantity * detailDto.UnitPrice,
                            Currency = detailDto.Currency ?? "TRY",
                            RequestedDeliveryDate = detailDto.RequestedDeliveryDate,
                            ActualDeliveryDate = detailDto.ActualDeliveryDate,
                            Description = detailDto.Description,
                            SupplierPartNumber = detailDto.SupplierPartNumber,
                            Status = detailDto.Status ?? "Pending",
                            UpdatedAt = DateTime.Now
                        };

                        order.Details.Add(detail);
                    }

                    // Fiyat hesaplamaları
                    order.TotalAmount = order.Details.Sum(d => d.TotalPrice);
                    order.VATAmount = order.TotalAmount * (order.VATRate ?? 20.0M) / 100;
                    order.GrandTotal = order.TotalAmount + order.VATAmount;
                }

                await _context.SaveChangesAsync();

                await AddOrderHistory(order.Id, "Order Updated", "Updated", "Sipariş güncellendi");

                _logger.LogInformation("Purchase order updated: {OrderNumber}", order.OrderNumber);

                return Ok(new { message = "Sipariş başarıyla güncellendi.", orderId = order.Id });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating purchase order {Id}", id);
                return StatusCode(500, new { message = "Sipariş güncellenirken bir hata oluştu: " + ex.Message });
            }
        }

        /// <summary>
        /// Sipariş sil
        /// DELETE: api/PurchaseOrders/{id}
        /// </summary>
        [HttpDelete("{id}")]
        public async Task<ActionResult> DeletePurchaseOrder(int id)
        {
            try
            {
                var order = await _context.PurchaseOrders
                    .Include(o => o.Details)
                    .FirstOrDefaultAsync(o => o.Id == id);

                if (order == null)
                {
                    return NotFound(new { message = "Sipariş bulunamadı." });
                }

                if (order.Status != "Draft")
                {
                    return BadRequest(new { message = "Sadece taslak siparişler silinebilir." });
                }

                _context.PurchaseOrders.Remove(order);
                await _context.SaveChangesAsync();

                _logger.LogInformation("Purchase order deleted: {OrderNumber}", order.OrderNumber);

                return Ok(new { message = "Sipariş başarıyla silindi." });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting purchase order {Id}", id);
                return StatusCode(500, new { message = "Sipariş silinirken bir hata oluştu." });
            }
        }

        /// <summary>
        /// Siparişi gönder (tedarikçiye)
        /// POST: api/PurchaseOrders/{id}/submit
        /// </summary>
        [HttpPost("{id}/submit")]
        public async Task<ActionResult> SubmitPurchaseOrder(int id)
        {
            try
            {
                var order = await _context.PurchaseOrders.FindAsync(id);

                if (order == null)
                {
                    return NotFound(new { message = "Sipariş bulunamadı." });
                }

                if (order.Status != "Draft")
                {
                    return BadRequest(new { message = "Sadece taslak siparişler gönderilebilir." });
                }

                order.Status = "Submitted";
                order.SubmittedDate = DateTime.Now;
                order.UpdatedBy = GetCurrentUserId();
                order.UpdatedAt = DateTime.Now;

                await _context.SaveChangesAsync();

                await AddOrderHistory(order.Id, "Order Submitted", "Submitted", "Sipariş tedarikçiye gönderildi");

                _logger.LogInformation("Purchase order submitted: {OrderNumber}", order.OrderNumber);

                return Ok(new { message = "Sipariş başarıyla gönderildi.", orderId = order.Id });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error submitting purchase order {Id}", id);
                return StatusCode(500, new { message = "Sipariş gönderilirken bir hata oluştu." });
            }
        }

        /// <summary>
        /// Siparişi onayla
        /// POST: api/PurchaseOrders/{id}/approve
        /// </summary>
        [HttpPost("{id}/approve")]
        public async Task<ActionResult> ApprovePurchaseOrder(int id, [FromBody] ApproveRejectOrderRequest request)
        {
            try
            {
                var order = await _context.PurchaseOrders.FindAsync(id);

                if (order == null)
                {
                    return NotFound(new { message = "Sipariş bulunamadı." });
                }

                if (order.Status != "Submitted" && order.Status != "SupplierApproval")
                {
                    return BadRequest(new { message = "Sipariş onaylanabilir durumda değil." });
                }

                order.Status = "Confirmed";
                order.ApprovalDate = DateTime.Now;
                order.ApprovedBy = GetCurrentUserId();
                order.ApprovalNote = request.Notes;
                order.UpdatedBy = GetCurrentUserId();
                order.UpdatedAt = DateTime.Now;

                await _context.SaveChangesAsync();

                await AddOrderHistory(order.Id, "Order Approved", "Approved", request.Notes);

                _logger.LogInformation("Purchase order approved: {OrderNumber}", order.OrderNumber);

                return Ok(new { message = "Sipariş başarıyla onaylandı.", orderId = order.Id });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error approving purchase order {Id}", id);
                return StatusCode(500, new { message = "Sipariş onaylanırken bir hata oluştu." });
            }
        }

        /// <summary>
        /// Siparişi confirm et (tedarikçi onayı)
        /// POST: api/PurchaseOrders/{id}/confirm
        /// </summary>
        [HttpPost("{id}/confirm")]
        public async Task<ActionResult> ConfirmPurchaseOrder(int id, [FromBody] ApproveRejectOrderRequest request)
        {
            try
            {
                var order = await _context.PurchaseOrders.FindAsync(id);

                if (order == null)
                {
                    return NotFound(new { message = "Sipariş bulunamadı." });
                }

                order.Status = "Confirmed";
                order.ConfirmationDate = DateTime.Now;
                order.ConfirmedBy = GetCurrentUserId();
                order.ConfirmationNote = request.Notes;
                order.UpdatedBy = GetCurrentUserId();
                order.UpdatedAt = DateTime.Now;

                await _context.SaveChangesAsync();

                await AddOrderHistory(order.Id, "Order Confirmed", "Confirmed", request.Notes);

                _logger.LogInformation("Purchase order confirmed: {OrderNumber}", order.OrderNumber);

                return Ok(new { message = "Sipariş başarıyla confirm edildi.", orderId = order.Id });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error confirming purchase order {Id}", id);
                return StatusCode(500, new { message = "Sipariş confirm edilirken bir hata oluştu." });
            }
        }

        /// <summary>
        /// Siparişi iptal et
        /// POST: api/PurchaseOrders/{id}/cancel
        /// </summary>
        [HttpPost("{id}/cancel")]
        public async Task<ActionResult> CancelPurchaseOrder(int id, [FromBody] ApproveRejectOrderRequest request)
        {
            try
            {
                var order = await _context.PurchaseOrders.FindAsync(id);

                if (order == null)
                {
                    return NotFound(new { message = "Sipariş bulunamadı." });
                }

                if (order.Status == "Completed" || order.Status == "Cancelled")
                {
                    return BadRequest(new { message = "Bu sipariş iptal edilemez." });
                }

                order.Status = "Cancelled";
                order.CancelledDate = DateTime.Now;
                order.CancelledBy = GetCurrentUserId();
                order.CancellationReason = request.Notes;
                order.UpdatedBy = GetCurrentUserId();
                order.UpdatedAt = DateTime.Now;

                await _context.SaveChangesAsync();

                await AddOrderHistory(order.Id, "Order Cancelled", "Cancelled", request.Notes);

                _logger.LogInformation("Purchase order cancelled: {OrderNumber}", order.OrderNumber);

                return Ok(new { message = "Sipariş başarıyla iptal edildi.", orderId = order.Id });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error cancelling purchase order {Id}", id);
                return StatusCode(500, new { message = "Sipariş iptal edilirken bir hata oluştu." });
            }
        }

        /// <summary>
        /// Teslimat güncelle
        /// POST: api/PurchaseOrders/{id}/update-delivery
        /// </summary>
        [HttpPost("{id}/update-delivery")]
        public async Task<ActionResult> UpdateDelivery(int id, [FromBody] UpdateDeliveryRequest request)
        {
            try
            {
                var detail = await _context.PurchaseOrderDetails
                    .Include(d => d.Order)
                    .FirstOrDefaultAsync(d => d.Id == request.DetailId && d.OrderId == id);

                if (detail == null)
                {
                    return NotFound(new { message = "Sipariş detayı bulunamadı." });
                }

                detail.ReceivedQuantity = (detail.ReceivedQuantity ?? 0) + request.ReceivedQuantity;
                detail.ActualDeliveryDate = request.ActualDeliveryDate;
                detail.UpdatedAt = DateTime.Now;

                // Durum güncelle
                if (detail.ReceivedQuantity >= detail.OrderedQuantity)
                {
                    detail.Status = "Received";
                }
                else if (detail.ReceivedQuantity > 0)
                {
                    detail.Status = "PartialReceived";
                }

                // Sipariş durumunu kontrol et
                var order = detail.Order;
                var allDetails = await _context.PurchaseOrderDetails
                    .Where(d => d.OrderId == id)
                    .ToListAsync();

                if (allDetails.All(d => d.ReceivedQuantity >= d.OrderedQuantity))
                {
                    order.Status = "Delivered";
                    order.ActualDeliveryDate = DateTime.Now;
                }
                else if (allDetails.Any(d => d.ReceivedQuantity > 0))
                {
                    order.Status = "PartialDelivered";
                }

                order.UpdatedBy = GetCurrentUserId();
                order.UpdatedAt = DateTime.Now;

                await _context.SaveChangesAsync();

                await AddOrderHistory(id, "Delivery Updated", "DeliveryReceived",
                    $"Ürün teslim alındı: {detail.ItemName}, Miktar: {request.ReceivedQuantity}. {request.Notes}");

                _logger.LogInformation("Delivery updated for order: {OrderNumber}, Detail: {DetailId}",
                    order.OrderNumber, detail.Id);

                return Ok(new { message = "Teslimat başarıyla güncellendi.", orderId = id });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating delivery for order {Id}", id);
                return StatusCode(500, new { message = "Teslimat güncellenirken bir hata oluştu." });
            }
        }

        /// <summary>
        /// Sipariş istatistikleri
        /// GET: api/PurchaseOrders/stats
        /// </summary>
        [HttpGet("stats")]
        public async Task<ActionResult<PurchaseOrderStatsDto>> GetStats()
        {
            try
            {
                var stats = new PurchaseOrderStatsDto
                {
                    TotalOrders = await _context.PurchaseOrders.CountAsync(o => o.CancelledDate == null),
                    PendingOrders = await _context.PurchaseOrders.CountAsync(o => o.Status == "Draft" || o.Status == "Submitted"),
                    ConfirmedOrders = await _context.PurchaseOrders.CountAsync(o => o.Status == "Confirmed"),
                    InDelivery = await _context.PurchaseOrders.CountAsync(o => o.Status == "PartialDelivered"),
                    Completed = await _context.PurchaseOrders.CountAsync(o => o.Status == "Completed"),
                    TotalOrderValue = await _context.PurchaseOrders
                        .Where(o => o.CancelledDate == null)
                        .SumAsync(o => o.GrandTotal ?? 0),
                    PendingValue = await _context.PurchaseOrders
                        .Where(o => o.Status == "Draft" || o.Status == "Submitted")
                        .SumAsync(o => o.GrandTotal ?? 0)
                };

                return Ok(stats);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving purchase order stats");
                return StatusCode(500, new { message = "İstatistikler alınırken bir hata oluştu." });
            }
        }
    }
}