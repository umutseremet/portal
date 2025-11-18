using API.Data;
using API.Data.Entities;
using API.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
#if !DEBUG
    [Authorize]
#endif
    public class ItemGroupsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<ItemGroupsController> _logger;

        public ItemGroupsController(ApplicationDbContext context, ILogger<ItemGroupsController> logger)
        {
            _context = context;
            _logger = logger;
        }

        [HttpGet]
        public async Task<ActionResult<GetItemGroupsResponse>> GetItemGroups([FromQuery] GetItemGroupsRequest request)
        {
            try
            {
                var query = _context.ItemGroups.AsQueryable();

                // Filtreleme
                if (!string.IsNullOrEmpty(request.Name))
                {
                    query = query.Where(g => g.Name.Contains(request.Name));
                }

                if (!request.IncludeCancelled.GetValueOrDefault())
                {
                    query = query.Where(g => g.Cancelled == null || g.Cancelled == false);
                }

                // Toplam kayıt sayısı
                var totalCount = await query.CountAsync();

                // Sıralama
                query = request.SortBy?.ToLower() switch
                {
                    "name" => request.SortOrder?.ToLower() == "desc" ? query.OrderByDescending(g => g.Name) : query.OrderBy(g => g.Name),
                    "createdat" => request.SortOrder?.ToLower() == "desc" ? query.OrderByDescending(g => g.CreatedAt) : query.OrderBy(g => g.CreatedAt),
                    _ => query.OrderBy(g => g.Name)
                };

                // Sayfalama
                var itemGroups = await query
                    .Skip((request.Page - 1) * request.PageSize)
                    .Take(request.PageSize)
                    .Include(g => g.Items)
                    .Select(g => new ItemGroupResponse
                    {
                        Id = g.Id,
                        Name = g.Name,
                        Cancelled = g.Cancelled,
                        CreatedAt = g.CreatedAt,
                        UpdatedAt = g.UpdatedAt,
                        ItemCount = g.Items != null ? g.Items.Count(i => i.Cancelled == null || i.Cancelled == false) : 0
                    })
                    .ToListAsync();

                var totalPages = (int)Math.Ceiling((double)totalCount / request.PageSize);

                return Ok(new GetItemGroupsResponse
                {
                    ItemGroups = itemGroups,
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
                _logger.LogError(ex, "Ürün grupları getirilirken hata oluştu");
                return StatusCode(500, "İç sunucu hatası");
            }
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<ItemGroupResponse>> GetItemGroup(int id)
        {
            try
            {
                var itemGroup = await _context.ItemGroups
                    .Include(g => g.Items)
                    .FirstOrDefaultAsync(g => g.Id == id);

                if (itemGroup == null)
                {
                    return NotFound("Ürün grubu bulunamadı");
                }

                return Ok(new ItemGroupResponse
                {
                    Id = itemGroup.Id,
                    Name = itemGroup.Name,
                    Cancelled = itemGroup.Cancelled,
                    CreatedAt = itemGroup.CreatedAt,
                    UpdatedAt = itemGroup.UpdatedAt,
                    ItemCount = itemGroup.Items?.Count(i => i.Cancelled == null || i.Cancelled == false) ?? 0
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Ürün grubu getirilirken hata oluştu: {Id}", id);
                return StatusCode(500, "İç sunucu hatası");
            }
        }

        [HttpPost]
        public async Task<ActionResult<CreateItemGroupResponse>> CreateItemGroup([FromBody] CreateItemGroupRequest request)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                // Aynı isimde grup var mı kontrol et
                var existingGroup = await _context.ItemGroups
                    .FirstOrDefaultAsync(g => g.Name.ToLower() == request.Name.ToLower() && (g.Cancelled == null || g.Cancelled == false));

                if (existingGroup != null)
                {
                    return BadRequest($"'{request.Name}' isimli grup zaten mevcut");
                }

                var itemGroup = new ItemGroup
                {
                    Name = request.Name.Trim(),
                    Cancelled = false,
                    CreatedAt = DateTime.Now
                };

                _context.ItemGroups.Add(itemGroup);
                await _context.SaveChangesAsync();

                return Ok(new CreateItemGroupResponse
                {
                    Success = true,
                    Id = itemGroup.Id,
                    Message = "Ürün grubu başarıyla oluşturuldu",
                    ItemGroup = new ItemGroupResponse
                    {
                        Id = itemGroup.Id,
                        Name = itemGroup.Name,
                        Cancelled = itemGroup.Cancelled,
                        CreatedAt = itemGroup.CreatedAt,
                        UpdatedAt = itemGroup.UpdatedAt,
                        ItemCount = 0
                    }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Ürün grubu oluşturulurken hata oluştu");
                return StatusCode(500, "İç sunucu hatası");
            }
        }

        [HttpPut("{id}")]
        public async Task<ActionResult<UpdateItemGroupResponse>> UpdateItemGroup(int id, [FromBody] UpdateItemGroupRequest request)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                var itemGroup = await _context.ItemGroups
                    .Include(g => g.Items)
                    .FirstOrDefaultAsync(g => g.Id == id);

                if (itemGroup == null)
                {
                    return NotFound("Ürün grubu bulunamadı");
                }

                // Aynı isimde başka grup var mı kontrol et
                var existingGroup = await _context.ItemGroups
                    .FirstOrDefaultAsync(g => g.Name.ToLower() == request.Name.ToLower() && g.Id != id && (g.Cancelled == null || g.Cancelled == false));

                if (existingGroup != null)
                {
                    return BadRequest($"'{request.Name}' isimli grup zaten mevcut");
                }

                itemGroup.Name = request.Name.Trim();
                itemGroup.Cancelled = request.Cancelled;
                itemGroup.UpdatedAt = DateTime.Now;

                await _context.SaveChangesAsync();

                return Ok(new UpdateItemGroupResponse
                {
                    Success = true,
                    Message = "Ürün grubu başarıyla güncellendi",
                    ItemGroup = new ItemGroupResponse
                    {
                        Id = itemGroup.Id,
                        Name = itemGroup.Name,
                        Cancelled = itemGroup.Cancelled,
                        CreatedAt = itemGroup.CreatedAt,
                        UpdatedAt = itemGroup.UpdatedAt,
                        ItemCount = itemGroup.Items?.Count(i => i.Cancelled == null || i.Cancelled == false) ?? 0
                    }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Ürün grubu güncellenirken hata oluştu: {Id}", id);
                return StatusCode(500, "İç sunucu hatası");
            }
        }

        [HttpDelete("{id}")]
        public async Task<ActionResult<DeleteResponse>> DeleteItemGroup(int id)
        {
            try
            {
                var itemGroup = await _context.ItemGroups
                    .Include(g => g.Items)
                    .FirstOrDefaultAsync(g => g.Id == id);

                if (itemGroup == null)
                {
                    return NotFound("Ürün grubu bulunamadı");
                }

                // Soft delete - sadece cancelled flag'ini true yap
                itemGroup.Cancelled = true;
                itemGroup.UpdatedAt = DateTime.Now;

                // Bu gruba ait ürünleri de cancelled yap
                if (itemGroup.Items != null)
                {
                    foreach (var item in itemGroup.Items)
                    {
                        item.Cancelled = true;
                        item.UpdatedAt = DateTime.Now;
                    }
                }

                await _context.SaveChangesAsync();

                return Ok(new DeleteResponse
                {
                    Success = true,
                    Message = "Ürün grubu başarıyla silindi"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Ürün grubu silinirken hata oluştu: {Id}", id);
                return StatusCode(500, "İç sunucu hatası");
            }
        }
    }
}