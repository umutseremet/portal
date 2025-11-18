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
    public class BomItemsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<BomItemsController> _logger;

        public BomItemsController(
            ApplicationDbContext context,
            ILogger<BomItemsController> logger)
        {
            _context = context;
            _logger = logger;
        }

        /// <summary>
        /// Bir Excel dosyasına ait item'ları listeler (Items tablosu bilgileri ile birlikte)
        /// </summary>
        [HttpPost("list")]
        public async Task<ActionResult<GetBomItemsResponse>> GetBomItems([FromBody] GetBomItemsRequest request)
        {
            try
            {
                var username = User.FindFirst("username")?.Value;
                _logger.LogInformation("Getting BOM items for excel {ExcelId} by user: {Username}",
                    request.ExcelId, username);

                // Excel dosyasının var olduğunu kontrol et
                var excel = await _context.BomExcels
                    .FirstOrDefaultAsync(e => e.Id == request.ExcelId);

                if (excel == null)
                {
                    return NotFound(new ErrorResponse { Message = "Excel dosyası bulunamadı" });
                }

                var query = _context.BomItems
                    .Include(i => i.Item)
                        .ThenInclude(item => item.ItemGroup)
                    .Where(i => i.ExcelId == request.ExcelId)
                    .AsQueryable();

                // Arama - Items tablosundaki alanlarda da ara
                if (!string.IsNullOrEmpty(request.SearchTerm))
                {
                    query = query.Where(i =>
                        (i.Item.Code != null && i.Item.Code.Contains(request.SearchTerm)) ||
                        (i.Item.Name != null && i.Item.Name.Contains(request.SearchTerm)) ||
                        (i.Item.DocNumber != null && i.Item.DocNumber.Contains(request.SearchTerm)) ||
                        (i.OgeNo != null && i.OgeNo.Contains(request.SearchTerm)) ||
                        (i.Notes != null && i.Notes.Contains(request.SearchTerm))
                    );
                }

                var totalCount = await query.CountAsync();

                // Sıralama
                query = request.SortBy?.ToLower() switch
                {
                    "itemcode" => request.SortOrder?.ToLower() == "desc"
                        ? query.OrderByDescending(i => i.Item.Code)
                        : query.OrderBy(i => i.Item.Code),
                    "itemname" => request.SortOrder?.ToLower() == "desc"
                        ? query.OrderByDescending(i => i.Item.Name)
                        : query.OrderBy(i => i.Item.Name),
                    "itemdocnumber" => request.SortOrder?.ToLower() == "desc"
                        ? query.OrderByDescending(i => i.Item.DocNumber)
                        : query.OrderBy(i => i.Item.DocNumber),
                    "ogeno" => request.SortOrder?.ToLower() == "desc"
                        ? query.OrderByDescending(i => i.OgeNo)
                        : query.OrderBy(i => i.OgeNo),
                    "miktar" => request.SortOrder?.ToLower() == "desc"
                        ? query.OrderByDescending(i => i.Miktar)
                        : query.OrderBy(i => i.Miktar),
                    _ => request.SortOrder?.ToLower() == "desc"
                        ? query.OrderByDescending(i => i.RowNumber)
                        : query.OrderBy(i => i.RowNumber)
                };

                // Sayfalama
                var items = await query
                    .Skip((request.Page - 1) * request.PageSize)
                    .Take(request.PageSize)
                    .Select(i => new BomItemResponse
                    {
                        Id = i.Id,
                        ExcelId = i.ExcelId,
                        ItemId = i.ItemId,

                        // Items tablosundan gelen bilgiler
                        ItemNumber = i.Item.Number,
                        ItemCode = i.Item.Code,
                        ItemName = i.Item.Name,
                        ItemDocNumber = i.Item.DocNumber,
                        ItemX = i.Item.X,
                        ItemY = i.Item.Y,
                        ItemZ = i.Item.Z,
                        ItemGroupName = i.Item.ItemGroup != null ? i.Item.ItemGroup.Name : null,
                        ItemImageUrl = i.Item.ImageUrl,
                        // Excel'e özel alanlar
                        OgeNo = i.OgeNo,
                        Miktar = i.Miktar,
                        RowNumber = i.RowNumber,
                        Notes = i.Notes,
                        CreatedAt = i.CreatedAt
                    })
                    .ToListAsync();

                return Ok(new GetBomItemsResponse
                {
                    Items = items,
                    TotalCount = totalCount,
                    Page = request.Page,
                    PageSize = request.PageSize,
                    ExcelFileName = excel.FileName
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting BOM items");
                return StatusCode(500, new ErrorResponse { Message = "BOM item'ları alınırken hata oluştu" });
            }
        }

        /// <summary>
        /// BOM item detayını getirir
        /// </summary>
        [HttpGet("{id}")]
        public async Task<ActionResult<BomItemResponse>> GetBomItem(int id)
        {
            try
            {
                var username = User.FindFirst("username")?.Value;
                _logger.LogInformation("Getting BOM item {Id} by user: {Username}", id, username);

                var item = await _context.BomItems
                    .Include(i => i.Item)
                        .ThenInclude(item => item.ItemGroup)
                    .FirstOrDefaultAsync(i => i.Id == id);

                if (item == null)
                {
                    return NotFound(new ErrorResponse { Message = "BOM item bulunamadı" });
                }

                var response = new BomItemResponse
                {
                    Id = item.Id,
                    ExcelId = item.ExcelId,
                    ItemId = item.ItemId,

                    // Items tablosundan gelen bilgiler
                    ItemNumber = item.Item.Number,
                    ItemCode = item.Item.Code,
                    ItemName = item.Item.Name,
                    ItemDocNumber = item.Item.DocNumber,
                    ItemX = item.Item.X,
                    ItemY = item.Item.Y,
                    ItemZ = item.Item.Z,
                    ItemGroupName = item.Item.ItemGroup?.Name,
                    ItemImageUrl = item.Item.ImageUrl,
                    // Excel'e özel alanlar
                    OgeNo = item.OgeNo,
                    Miktar = item.Miktar,
                    RowNumber = item.RowNumber,
                    Notes = item.Notes,
                    CreatedAt = item.CreatedAt
                };

                return Ok(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting BOM item {Id}", id);
                return StatusCode(500, new ErrorResponse { Message = "BOM item alınırken hata oluştu" });
            }
        }

        /// <summary>
        /// BOM item'ın sadece Excel'e özel alanlarını günceller
        /// Items tablosundaki ürün bilgilerini güncellemez
        /// </summary>
        [HttpPut("{id}")]
        public async Task<ActionResult<BomItemResponse>> UpdateBomItem(int id, [FromBody] UpdateBomItemRequest request)
        {
            try
            {
                var username = User.FindFirst("username")?.Value;
                _logger.LogInformation("Updating BOM item {Id} by user: {Username}", id, username);

                var item = await _context.BomItems
                    .Include(i => i.Item)
                        .ThenInclude(item => item.ItemGroup)
                    .FirstOrDefaultAsync(i => i.Id == id);

                if (item == null)
                {
                    return NotFound(new ErrorResponse { Message = "BOM item bulunamadı" });
                }

                // Sadece Excel'e özel alanları güncelle
                item.Miktar = request.Miktar;
                item.OgeNo = request.OgeNo;
                item.Notes = request.Notes;

                await _context.SaveChangesAsync();

                var response = new BomItemResponse
                {
                    Id = item.Id,
                    ExcelId = item.ExcelId,
                    ItemId = item.ItemId,

                    // Items tablosundan gelen bilgiler
                    ItemNumber = item.Item.Number,
                    ItemCode = item.Item.Code,
                    ItemName = item.Item.Name,
                    ItemDocNumber = item.Item.DocNumber,
                    ItemX = item.Item.X,
                    ItemY = item.Item.Y,
                    ItemZ = item.Item.Z,
                    ItemGroupName = item.Item.ItemGroup?.Name,
                    ItemImageUrl = item.Item.ImageUrl,
                    // Excel'e özel alanlar
                    OgeNo = item.OgeNo,
                    Miktar = item.Miktar,
                    RowNumber = item.RowNumber,
                    Notes = item.Notes,
                    CreatedAt = item.CreatedAt
                };

                _logger.LogInformation("BOM item {Id} updated successfully", id);

                return Ok(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating BOM item {Id}", id);
                return StatusCode(500, new ErrorResponse { Message = "BOM item güncellenirken hata oluştu" });
            }
        }

        /// <summary>
        /// BOM item'ı siler (Items tablosundan ürünü silmez, sadece Excel ilişkisini kaldırır)
        /// </summary>
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteBomItem(int id)
        {
            try
            {
                var username = User.FindFirst("username")?.Value;
                _logger.LogInformation("Deleting BOM item {Id} by user: {Username}", id, username);

                var item = await _context.BomItems.FindAsync(id);

                if (item == null)
                {
                    return NotFound(new ErrorResponse { Message = "BOM item bulunamadı" });
                }

                var excelId = item.ExcelId;

                // BomItem'ı sil (Items tablosundaki ürün silinmez)
                _context.BomItems.Remove(item);
                await _context.SaveChangesAsync();

                // Excel'in row count'unu güncelle
                var excel = await _context.BomExcels
                    .Include(e => e.BomItems)
                    .FirstOrDefaultAsync(e => e.Id == excelId);

                if (excel != null)
                {
                    excel.RowCount = excel.BomItems.Count;
                    await _context.SaveChangesAsync();
                }

                _logger.LogInformation("BOM item {Id} deleted successfully", id);

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting BOM item {Id}", id);
                return StatusCode(500, new ErrorResponse { Message = "BOM item silinirken hata oluştu" });
            }
        }

        /// <summary>
        /// Excel'deki tüm item'ları toplu siler
        /// </summary>
        [HttpDelete("excel/{excelId}/all")]
        public async Task<IActionResult> DeleteAllItemsByExcel(int excelId)
        {
            try
            {
                var username = User.FindFirst("username")?.Value;
                _logger.LogInformation("Deleting all BOM items for excel {ExcelId} by user: {Username}",
                    excelId, username);

                var items = await _context.BomItems
                    .Where(i => i.ExcelId == excelId)
                    .ToListAsync();

                if (!items.Any())
                {
                    return NotFound(new ErrorResponse { Message = "BOM item bulunamadı" });
                }

                _context.BomItems.RemoveRange(items);
                await _context.SaveChangesAsync();

                // Excel'in row count'unu güncelle
                var excel = await _context.BomExcels.FindAsync(excelId);
                if (excel != null)
                {
                    excel.RowCount = 0;
                    excel.IsProcessed = false;
                    await _context.SaveChangesAsync();
                }

                _logger.LogInformation("Deleted {Count} BOM items for excel {ExcelId}", items.Count, excelId);

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting all BOM items for excel {ExcelId}", excelId);
                return StatusCode(500, new ErrorResponse { Message = "BOM item'lar silinirken hata oluştu" });
            }
        }

        /// <summary>
        /// Bir ürünün hangi Excel'lerde kullanıldığını listeler
        /// </summary>
        [HttpGet("item/{itemId}/usage")]
        public async Task<ActionResult<List<BomItemUsageResponse>>> GetItemUsage(int itemId)
        {
            try
            {
                var username = User.FindFirst("username")?.Value;
                _logger.LogInformation("Getting item usage for item {ItemId} by user: {Username}",
                    itemId, username);

                var usages = await _context.BomItems
                    .Include(bi => bi.BomExcel)
                        .ThenInclude(e => e.BomWork)
                    .Where(bi => bi.ItemId == itemId)
                    .Select(bi => new BomItemUsageResponse
                    {
                        BomItemId = bi.Id,
                        ExcelId = bi.ExcelId,
                        ExcelFileName = bi.BomExcel.FileName,
                        WorkId = bi.BomExcel.WorkId,
                        WorkName = bi.BomExcel.BomWork.WorkName,
                        ProjectId = bi.BomExcel.BomWork.ProjectId,
                        Miktar = bi.Miktar,
                        OgeNo = bi.OgeNo,
                        CreatedAt = bi.CreatedAt
                    })
                    .ToListAsync();

                return Ok(usages);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting item usage for item {ItemId}", itemId);
                return StatusCode(500, new ErrorResponse { Message = "Ürün kullanım bilgisi alınırken hata oluştu" });
            }
        }
    }

    public class BomItemUsageResponse
    {
        public int BomItemId { get; set; }
        public int ExcelId { get; set; }
        public string ExcelFileName { get; set; } = string.Empty;
        public int WorkId { get; set; }
        public string WorkName { get; set; } = string.Empty;
        public int ProjectId { get; set; }
        public int? Miktar { get; set; }
        public string? OgeNo { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}