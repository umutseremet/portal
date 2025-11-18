using API.Data;
using API.Data.Entities;
using API.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace API.Controllers
{
    [Authorize]
    [Route("api/[controller]")]
    [ApiController]
    public class DataCamPreparationController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<DataCamPreparationController> _logger;

        public DataCamPreparationController(
            ApplicationDbContext context,
            ILogger<DataCamPreparationController> logger)
        {
            _context = context;
            _logger = logger;
        }

        /// <summary>
        /// Teknik resim çalışması yapılmamış ürünleri listeler
        /// Her ürün için ilk eklendiği BomWork ve BomExcel bilgisi gösterilir
        /// </summary>
        [HttpPost("list")]
        public async Task<ActionResult<GetDataCamItemsResponse>> GetDataCamItems([FromBody] GetDataCamItemsRequest request)
        {
            try
            {
                _logger.LogInformation("DataCam items list requested - Page: {Page}, PageSize: {PageSize}",
                    request.Page, request.PageSize);

                // Teknik resim çalışması yapılmamış ürünleri bul
                var query = _context.Items
                    .Include(i => i.ItemGroup)
                    .Where(i => !i.TechnicalDrawingCompleted && i.Cancelled != true);

                // Arama filtresi
                if (!string.IsNullOrWhiteSpace(request.SearchTerm))
                {
                    var searchLower = request.SearchTerm.ToLower();
                    query = query.Where(i =>
                        i.Name.ToLower().Contains(searchLower) ||
                        i.Code.ToLower().Contains(searchLower) ||
                        i.DocNumber.ToLower().Contains(searchLower));
                }

                // Toplam sayı
                var totalCount = await query.CountAsync();

                // Sıralama
                query = request.SortBy?.ToLower() switch
                {
                    "name" => request.SortOrder?.ToLower() == "desc"
                        ? query.OrderByDescending(i => i.Name)
                        : query.OrderBy(i => i.Name),
                    "code" => request.SortOrder?.ToLower() == "desc"
                        ? query.OrderByDescending(i => i.Code)
                        : query.OrderBy(i => i.Code),
                    "number" => request.SortOrder?.ToLower() == "desc"
                        ? query.OrderByDescending(i => i.Number)
                        : query.OrderBy(i => i.Number),
                    "createdat" => request.SortOrder?.ToLower() == "desc"
                        ? query.OrderByDescending(i => i.CreatedAt)
                        : query.OrderBy(i => i.CreatedAt),
                    _ => query.OrderBy(i => i.CreatedAt)
                };

                // Sayfalama
                var items = await query
                    .Skip((request.Page - 1) * request.PageSize)
                    .Take(request.PageSize)
                    .ToListAsync();

                // ✅ FIX: OPENJSON hatasını tamamen önlemek için foreach kullan
                var itemIds = items.Select(i => i.Id).ToList();
                var firstBomItemLookup = new Dictionary<int, BomItem>();
                var additionalBomCountLookup = new Dictionary<int, int>();

                if (itemIds.Any())
                {
                    // Her item için ayrı ayrı işle (OPENJSON kullanmaz)
                    foreach (var itemId in itemIds)
                    {
                        // 1. Bu item için en eski BomItem'ı bul
                        var firstBomItem = await _context.BomItems
                            .Where(bi => bi.ItemId == itemId)
                            .OrderBy(bi => bi.CreatedAt)
                            .Include(bi => bi.BomExcel)
                                .ThenInclude(be => be.BomWork)
                            .FirstOrDefaultAsync();

                        if (firstBomItem != null)
                        {
                            firstBomItemLookup[itemId] = firstBomItem;
                        }

                        // 2. Bu item'ın kaç farklı Excel'de olduğunu say
                        var distinctExcelCount = await _context.BomItems
                            .Where(bi => bi.ItemId == itemId)
                            .Select(bi => bi.ExcelId)
                            .Distinct()
                            .CountAsync();

                        additionalBomCountLookup[itemId] = distinctExcelCount - 1; // İlk BOM hariç
                    }
                }

                // Response oluştur
                var dataCamItems = items.Select(item =>
                {
                    var firstBomItem = firstBomItemLookup.ContainsKey(item.Id)
                        ? firstBomItemLookup[item.Id]
                        : null;

                    var additionalCount = additionalBomCountLookup.ContainsKey(item.Id)
                        ? additionalBomCountLookup[item.Id]
                        : 0;

                    return new DataCamItemResponse
                    {
                        ItemId = item.Id,
                        ItemNumber = item.Number,
                        ItemCode = item.Code,
                        ItemName = item.Name,
                        ItemDocNumber = item.DocNumber,
                        ItemGroupName = item.ItemGroup?.Name,
                        X = item.X,
                        Y = item.Y,
                        Z = item.Z,
                        ImageUrl = item.ImageUrl,
                        CreatedAt = item.CreatedAt,

                        // BOM bilgileri (varsa ilk eklenen)
                        BomWorkId = firstBomItem?.BomExcel?.WorkId,
                        BomWorkName = firstBomItem?.BomExcel?.BomWork?.WorkName,
                        BomExcelId = firstBomItem?.ExcelId,
                        BomExcelFileName = firstBomItem?.BomExcel?.FileName,
                        ProjectId = firstBomItem?.BomExcel?.BomWork?.ProjectId,
                        ProjectName = firstBomItem?.BomExcel?.BomWork?.ProjectName
                                      ?? (firstBomItem?.BomExcel?.BomWork?.ProjectId != null
                                          ? $"Project #{firstBomItem.BomExcel.BomWork.ProjectId}"
                                          : null),

                        // Eğer birden fazla BOM'da varsa
                        AdditionalBomCount = additionalCount
                    };
                }).ToList();

                var response = new GetDataCamItemsResponse
                {
                    Items = dataCamItems,
                    TotalCount = totalCount,
                    Page = request.Page,
                    PageSize = request.PageSize,
                    TotalPages = (int)Math.Ceiling(totalCount / (double)request.PageSize),
                    HasNextPage = request.Page * request.PageSize < totalCount,
                    HasPreviousPage = request.Page > 1
                };

                return Ok(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting DataCam items");
                return StatusCode(500, new ErrorResponse { Message = "Ürünler yüklenirken hata oluştu" });
            }
        }

        /// <summary>
        /// Bir ürünün bulunduğu tüm BOM exceller'i listeler
        /// </summary>
        [HttpGet("item/{itemId}/bom-locations")]
        public async Task<ActionResult<List<BomLocationResponse>>> GetItemBomLocations(int itemId)
        {
            try
            {
                // ✅ FIX: Tek item için zaten OPENJSON yok, direkt kullan
                var bomLocations = await _context.BomItems
                    .Where(bi => bi.ItemId == itemId)
                    .Include(bi => bi.BomExcel)
                        .ThenInclude(be => be.BomWork)
                    .OrderBy(bi => bi.CreatedAt)
                    .Select(bi => new BomLocationResponse
                    {
                        BomItemId = bi.Id,
                        BomWorkId = bi.BomExcel.WorkId,
                        BomWorkName = bi.BomExcel.BomWork.WorkName,
                        BomExcelId = bi.ExcelId,
                        BomExcelFileName = bi.BomExcel.FileName,
                        ProjectId = bi.BomExcel.BomWork.ProjectId,
                        ProjectName = bi.BomExcel.BomWork.ProjectName
                                      ?? $"Project #{bi.BomExcel.BomWork.ProjectId}",
                        CreatedAt = bi.CreatedAt
                    })
                    .ToListAsync();

                return Ok(bomLocations);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting BOM locations for item {ItemId}", itemId);
                return StatusCode(500, new ErrorResponse { Message = "BOM konumları yüklenirken hata oluştu" });
            }
        }

        /// <summary>
        /// Ürün kartı kaydedildiğinde TechnicalDrawingCompleted flag'ini true yapar
        /// Bu endpoint sadece DataCam ekranından ürün kartı kaydedildiğinde çağrılır
        /// </summary>
        [HttpPost("mark-completed/{itemId}")]
        public async Task<ActionResult<MarkCompletedResponse>> MarkTechnicalDrawingCompleted(int itemId)
        {
            try
            {
                var username = User.FindFirst("username")?.Value ?? "System";
                _logger.LogInformation("Marking technical drawing completed for item {ItemId} by user: {Username}",
                    itemId, username);

                // ✅ FIX: FindAsync tek ID için zaten OPENJSON kullanmaz
                var item = await _context.Items.FindAsync(itemId);

                if (item == null)
                {
                    return NotFound(new ErrorResponse { Message = "Ürün bulunamadı" });
                }

                if (item.TechnicalDrawingCompleted)
                {
                    return BadRequest(new ErrorResponse { Message = "Bu ürün için teknik resim çalışması zaten tamamlanmış" });
                }

                item.TechnicalDrawingCompleted = true;
                item.UpdatedAt = DateTime.Now;

                await _context.SaveChangesAsync();

                _logger.LogInformation("Technical drawing marked as completed for item {ItemId}", itemId);

                return Ok(new MarkCompletedResponse
                {
                    Success = true,
                    Message = "Teknik resim çalışması tamamlandı olarak işaretlendi",
                    ItemId = itemId,
                    CompletedAt = item.UpdatedAt.Value
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error marking technical drawing completed for item {ItemId}", itemId);
                return StatusCode(500, new ErrorResponse { Message = "İşlem sırasında hata oluştu" });
            }
        }

        /// <summary>
        /// İstatistik bilgilerini döner
        /// </summary>
        [HttpGet("stats")]
        public async Task<ActionResult<DataCamStatsResponse>> GetStats()
        {
            try
            {
                // ✅ FIX: Bu sorgular OPENJSON kullanmaz, direkt sayım yapıyor
                var totalItems = await _context.Items
                    .Where(i => i.Cancelled != true)
                    .CountAsync();

                var completedItems = await _context.Items
                    .Where(i => i.TechnicalDrawingCompleted && i.Cancelled != true)
                    .CountAsync();

                var pendingItems = totalItems - completedItems;

                var recentlyCompleted = await _context.Items
                    .Where(i => i.TechnicalDrawingCompleted &&
                               i.UpdatedAt.HasValue &&
                               i.UpdatedAt.Value >= DateTime.Now.AddDays(-7) &&
                               i.Cancelled != true)
                    .CountAsync();

                return Ok(new DataCamStatsResponse
                {
                    TotalItems = totalItems,
                    CompletedItems = completedItems,
                    PendingItems = pendingItems,
                    CompletionRate = totalItems > 0 ? (double)completedItems / totalItems * 100 : 0,
                    RecentlyCompleted = recentlyCompleted
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting DataCam stats");
                return StatusCode(500, new ErrorResponse { Message = "İstatistikler yüklenirken hata oluştu" });
            }
        }
    }
}