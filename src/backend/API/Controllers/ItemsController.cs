using API.Data;
using API.Data.Entities;
using API.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authorization;

namespace API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
#if !DEBUG
    [Authorize]
#endif
    public class ItemsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<ItemsController> _logger;

        public ItemsController(ApplicationDbContext context, ILogger<ItemsController> logger)
        {
            _context = context;
            _logger = logger;
        }

        [HttpGet]
        public async Task<ActionResult<GetItemsResponse>> GetItems([FromQuery] GetItemsRequest request)
        {
            try
            {
                var query = _context.Items.Include(i => i.ItemGroup).AsQueryable();

                // Filtreleme
                if (request.GroupId.HasValue)
                {
                    query = query.Where(i => i.GroupId == request.GroupId);
                }

                if (!string.IsNullOrEmpty(request.Code))
                {
                    query = query.Where(i => i.Code.Contains(request.Code));
                }

                if (!string.IsNullOrEmpty(request.DocNumber))
                {
                    query = query.Where(i => i.DocNumber.Contains(request.DocNumber));
                }

                if (!string.IsNullOrEmpty(request.Name))
                {
                    query = query.Where(i => i.Name.Contains(request.Name));
                }

                if (request.Number.HasValue)
                {
                    query = query.Where(i => i.Number == request.Number);
                }

                if (!request.IncludeCancelled.GetValueOrDefault())
                {
                    query = query.Where(i => i.Cancelled == null || i.Cancelled == false);
                }

                if (request.TechnicalDrawingCompleted.HasValue)
                {
                    query = query.Where(i => i.TechnicalDrawingCompleted == request.TechnicalDrawingCompleted.Value);
                }

                // Toplam kayıt sayısı
                var totalCount = await query.CountAsync();

                // Sıralama
                query = request.SortBy?.ToLower() switch
                {
                    "number" => request.SortOrder?.ToLower() == "desc" ? query.OrderByDescending(i => i.Number) : query.OrderBy(i => i.Number),
                    "code" => request.SortOrder?.ToLower() == "desc" ? query.OrderByDescending(i => i.Code) : query.OrderBy(i => i.Code),
                    "name" => request.SortOrder?.ToLower() == "desc" ? query.OrderByDescending(i => i.Name) : query.OrderBy(i => i.Name),
                    "docnumber" => request.SortOrder?.ToLower() == "desc" ? query.OrderByDescending(i => i.DocNumber) : query.OrderBy(i => i.DocNumber),
                    "groupname" => request.SortOrder?.ToLower() == "desc" ? query.OrderByDescending(i => i.ItemGroup!.Name) : query.OrderBy(i => i.ItemGroup!.Name),
                    "createdat" => request.SortOrder?.ToLower() == "desc" ? query.OrderByDescending(i => i.CreatedAt) : query.OrderBy(i => i.CreatedAt),
                    _ => query.OrderBy(i => i.Number)
                };

                // Sayfalama
                var items = await query
                    .Skip((request.Page - 1) * request.PageSize)
                    .Take(request.PageSize)
                    .Select(i => new ItemResponse
                    {
                        Id = i.Id,
                        Number = i.Number,
                        Name = i.Name,
                        DocNumber = i.DocNumber,
                        Code = i.Code,
                        GroupId = i.GroupId,
                        GroupName = i.ItemGroup!.Name,
                        X = i.X,
                        Y = i.Y,
                        Z = i.Z,
                        Supplier = i.Supplier,
                        SupplierCode = i.SupplierCode,
                        Unit = i.Unit,
                        Price = i.Price,
                        ImageUrl = i.ImageUrl,
                        Cancelled = i.Cancelled,
                        CreatedAt = i.CreatedAt,
                        UpdatedAt = i.UpdatedAt,
                        TechnicalDrawingCompleted = i.TechnicalDrawingCompleted
                    })
                    .ToListAsync();

                var totalPages = (int)Math.Ceiling((double)totalCount / request.PageSize);

                return Ok(new GetItemsResponse
                {
                    Items = items,
                    TotalCount = totalCount,
                    Page = request.Page,
                    PageSize = request.PageSize,
                    TotalPages = totalPages,
                    HasNextPage = request.Page < totalPages,
                    HasPreviousPage = request.Page > 1
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Ürünler getirilirken hata oluştu");
                return StatusCode(500, "İç sunucu hatası");
            }
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<ItemResponse>> GetItem(int id)
        {
            try
            {
                var item = await _context.Items
                    .Include(i => i.ItemGroup)
                    .FirstOrDefaultAsync(i => i.Id == id);

                if (item == null)
                {
                    return NotFound("Ürün bulunamadı");
                }

                return Ok(new ItemResponse
                {
                    Id = item.Id,
                    Number = item.Number,
                    Code = item.Code,
                    Name = item.Name,
                    DocNumber = item.DocNumber,
                    GroupId = item.GroupId,
                    GroupName = item.ItemGroup?.Name ?? "",
                    X = item.X,
                    Y = item.Y,
                    Z = item.Z,
                    Supplier = item.Supplier,
                    SupplierCode = item.SupplierCode,
                    Unit = item.Unit,
                    Price = item.Price,
                    ImageUrl = item.ImageUrl,
                    Cancelled = item.Cancelled,
                    CreatedAt = item.CreatedAt,
                    UpdatedAt = item.UpdatedAt
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Ürün getirilirken hata oluştu: {Id}", id);
                return StatusCode(500, "İç sunucu hatası");
            }
        }

        [HttpPost]
        public async Task<ActionResult<CreateItemResponse>> CreateItem([FromBody] CreateItemRequest request)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                // Grup var mı kontrol et
                var itemGroup = await _context.ItemGroups
                    .FirstOrDefaultAsync(g => g.Id == request.GroupId && (g.Cancelled == null || g.Cancelled == false));

                if (itemGroup == null)
                {
                    return BadRequest("Geçersiz grup ID");
                }

                // Aynı kod var mı kontrol et
                var existingItem = await _context.Items
                    .FirstOrDefaultAsync(i => i.Code.ToLower() == request.Code.ToLower() && (i.Cancelled == null || i.Cancelled == false));

                if (existingItem != null)
                {
                    return BadRequest($"'{request.Code}' kodlu ürün zaten mevcut");
                }

                var item = new Item
                {
                    Number = request.Number,
                    Code = request.Code.Trim(),
                    Name = request.Name,
                    DocNumber = request.DocNumber,
                    GroupId = request.GroupId,
                    X = request.X,
                    Y = request.Y,
                    Z = request.Z,
                    ImageUrl = request.ImageUrl?.Trim(),
                    Cancelled = false,
                    CreatedAt = DateTime.Now,
                    SupplierCode = request.SupplierCode,
                    Supplier = request.Supplier,
                    Unit = request.Unit,
                    Price = request.Price
                };

                _context.Items.Add(item);
                await _context.SaveChangesAsync();

                // Grup adını almak için tekrar sorgu
                await _context.Entry(item).Reference(i => i.ItemGroup).LoadAsync();

                return Ok(new CreateItemResponse
                {
                    Success = true,
                    Id = item.Id,
                    Message = "Ürün başarıyla oluşturuldu",
                    Item = new ItemResponse
                    {
                        Id = item.Id,
                        Number = item.Number,
                        Code = item.Code,
                        Name = item.Name,
                        DocNumber = item.DocNumber,
                        GroupId = item.GroupId,
                        Supplier = item.Supplier,
                        SupplierCode = item.SupplierCode,
                        Unit = item.Unit,
                        Price = item.Price,
                        GroupName = item.ItemGroup?.Name ?? "",
                        X = item.X,
                        Y = item.Y,
                        Z = item.Z,
                        ImageUrl = item.ImageUrl,
                        Cancelled = item.Cancelled,
                        CreatedAt = item.CreatedAt,
                        UpdatedAt = item.UpdatedAt
                    }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Ürün oluşturulurken hata oluştu");
                return StatusCode(500, "İç sunucu hatası");
            }
        }
        // ItemsController.cs içindeki UpdateItem metoduna eklenecek kod parçası:

        // ❌ TechnicalDrawingCompleted flag'i manuel olarak güncellenemez
        // Bu alan sadece DataCamPreparation ekranından otomatik olarak güncellenir

        [HttpPut("{id}")]
        public async Task<ActionResult<UpdateItemResponse>> UpdateItem(int id, [FromBody] UpdateItemRequest request)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                var item = await _context.Items
                    .Include(i => i.ItemGroup)
                    .FirstOrDefaultAsync(i => i.Id == id);

                if (item == null)
                {
                    return NotFound("Ürün bulunamadı");
                }

                // ✅ Ürün bilgilerini güncelle
                item.Number = request.Number;
                item.Code = request.Code;
                item.Name = request.Name;
                item.DocNumber = request.DocNumber;
                item.GroupId = request.GroupId;
                item.X = request.X;
                item.Y = request.Y;
                item.Z = request.Z;
                item.ImageUrl = request.ImageUrl;
                item.Supplier = request.Supplier;
                item.SupplierCode = request.SupplierCode;
                item.Unit = request.Unit;
                item.Price = request.Price;
                item.UpdatedAt = DateTime.Now;

                // ❌ CRITICAL: TechnicalDrawingCompleted flag'i manuel olarak güncellenemez
                // Bu alan sadece DataCamPreparation controller'dan güncellenebilir
                // Request'te bu alan gönderilse bile ignore edilir

                await _context.SaveChangesAsync();

                // Response oluştur...
                return Ok(new UpdateItemResponse
                {
                    Success = true,
                    Message = "Ürün başarıyla güncellendi",
                    Item = new ItemResponse
                    {
                        Id = item.Id,
                        Number = item.Number,
                        Code = item.Code,
                        Name = item.Name,
                        DocNumber = item.DocNumber,
                        GroupId = item.GroupId,
                        GroupName = item.ItemGroup?.Name ?? "",
                        X = item.X,
                        Y = item.Y,
                        Z = item.Z,
                        ImageUrl = item.ImageUrl,
                        Cancelled = item.Cancelled,
                        TechnicalDrawingCompleted = item.TechnicalDrawingCompleted, // ✅ Response'ta gösterilir
                        CreatedAt = item.CreatedAt,
                        UpdatedAt = item.UpdatedAt,
                        Supplier = item.Supplier,
                        SupplierCode = item.SupplierCode,
                        Unit = item.Unit,
                        Price = item.Price
                    }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Ürün güncellenirken hata oluştu: {Id}", id);
                return StatusCode(500, "İç sunucu hatası");
            }
        }

        // ==================== NOT ====================
        // UpdateItemRequest ve ItemResponse modellerine TechnicalDrawingCompleted eklenmemeli
        // Sadece GetItem response'unda gösterilmeli (read-only)
        // Bu şekilde kullanıcılar bu flag'i manuel olarak değiştiremez
        [HttpDelete("{id}")]
        public async Task<ActionResult<DeleteResponse>> DeleteItem(int id)
        {
            try
            {
                var item = await _context.Items.FirstOrDefaultAsync(i => i.Id == id);

                if (item == null)
                {
                    return NotFound("Ürün bulunamadı");
                }

                // Soft delete - sadece cancelled flag'ini true yap
                item.Cancelled = true;
                item.UpdatedAt = DateTime.Now;

                await _context.SaveChangesAsync();

                return Ok(new DeleteResponse
                {
                    Success = true,
                    Message = "Ürün başarıyla silindi"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Ürün silinirken hata oluştu: {Id}", id);
                return StatusCode(500, "İç sunucu hatası");
            }
        }

        // Ek endpoint'ler
        [HttpGet("by-group/{groupId}")]
        public async Task<ActionResult<List<ItemResponse>>> GetItemsByGroup(int groupId)
        {
            try
            {
                var items = await _context.Items
                    .Include(i => i.ItemGroup)
                    .Where(i => i.GroupId == groupId && (i.Cancelled == null || i.Cancelled == false))
                    .OrderBy(i => i.Number)
                    .Select(i => new ItemResponse
                    {
                        Id = i.Id,
                        Number = i.Number,
                        Code = i.Code,
                        Name = i.Name,
                        DocNumber = i.DocNumber,
                        GroupId = i.GroupId,
                        GroupName = i.ItemGroup!.Name,
                        X = i.X,
                        Y = i.Y,
                        Z = i.Z,
                        Supplier = i.Supplier,
                        SupplierCode = i.SupplierCode,
                        Unit = i.Unit,
                        Price = i.Price,
                        ImageUrl = i.ImageUrl,
                        Cancelled = i.Cancelled,
                        CreatedAt = i.CreatedAt,
                        UpdatedAt = i.UpdatedAt
                    })
                    .ToListAsync();

                return Ok(items);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Grup ürünleri getirilirken hata oluştu: {GroupId}", groupId);
                return StatusCode(500, "İç sunucu hatası");
            }
        }

        [HttpGet("search")]
        public async Task<ActionResult<List<ItemResponse>>> SearchItems([FromQuery] string query)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(query))
                {
                    return BadRequest("Arama terimi gereklidir");
                }

                var items = await _context.Items
                    .Include(i => i.ItemGroup)
                    .Where(i => (i.Cancelled == null || i.Cancelled == false) &&
                               (i.Code.Contains(query) ||
                                i.ItemGroup!.Name.Contains(query) ||
                                i.Number.ToString().Contains(query) ||
                                i.Name!.Contains(query) ||
                                i.DocNumber!.Contains(query)
                                ))
                    .OrderBy(i => i.Number)
                    .Take(20) // Maksimum 20 sonuç
                    .Select(i => new ItemResponse
                    {
                        Id = i.Id,
                        Number = i.Number,
                        Code = i.Code,
                        Name = i.Name,
                        DocNumber = i.DocNumber,
                        GroupId = i.GroupId,
                        GroupName = i.ItemGroup!.Name,
                        X = i.X,
                        Y = i.Y,
                        Z = i.Z,
                        Supplier = i.Supplier,
                        SupplierCode = i.SupplierCode,
                        Unit = i.Unit,
                        Price = i.Price,
                        ImageUrl = i.ImageUrl,
                        Cancelled = i.Cancelled,
                        CreatedAt = i.CreatedAt,
                        UpdatedAt = i.UpdatedAt
                    })
                    .ToListAsync();

                return Ok(items);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Ürün arama yapılırken hata oluştu: {Query}", query);
                return StatusCode(500, "İç sunucu hatası");
            }
        }
    }
}