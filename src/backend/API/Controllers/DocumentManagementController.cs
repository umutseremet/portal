// Controllers/DocumentManagementController.cs
using API.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using VervoPortal.DTOs.DocumentManagement;
using VervoPortal.Models.DocumentManagement;

namespace VervoPortal.Controllers
{
    [Authorize]
    [Route("api/[controller]")]
    [ApiController]
    public class DocumentManagementController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IWebHostEnvironment _environment;

        public DocumentManagementController(ApplicationDbContext context, IWebHostEnvironment environment)
        {
            _context = context;
            _environment = environment;
        }

        #region Categories

        // GET: api/DocumentManagement/categories
        [HttpGet("categories")]
        public async Task<ActionResult<List<DocumentCategoryDto>>> GetCategories()
        {
            var categories = await _context.DocumentCategories
                .Where(c => c.IsActive && c.ParentId == null)
                .OrderBy(c => c.DisplayOrder)
                .Select(c => new DocumentCategoryDto
                {
                    Id = c.Id,
                    Name = c.Name,
                    Icon = c.Icon,
                    ParentId = c.ParentId,
                    DisplayOrder = c.DisplayOrder
                })
                .ToListAsync();

            foreach (var category in categories)
            {
                category.Children = await GetChildCategories(category.Id);
            }

            return Ok(categories);
        }

        // PUT: api/DocumentManagement/categories/{id}
        [HttpPut("categories/{id}")]
        public async Task<IActionResult> UpdateCategory(int id, UpdateDocumentCategoryDto dto)
        {
            var category = await _context.DocumentCategories.FindAsync(id);
            if (category == null)
                return NotFound();

            var username = User.Identity.Name;

            category.Name = dto.Name;
            category.Icon = dto.Icon;
            category.ParentId = dto.ParentId;
            category.UpdatedBy = username;
            category.UpdatedDate = DateTime.Now;

            await _context.SaveChangesAsync();

            return NoContent();
        }

        private async Task<List<DocumentCategoryDto>> GetChildCategories(int parentId)
        {
            var children = await _context.DocumentCategories
                .Where(c => c.IsActive && c.ParentId == parentId)
                .OrderBy(c => c.DisplayOrder)
                .Select(c => new DocumentCategoryDto
                {
                    Id = c.Id,
                    Name = c.Name,
                    Icon = c.Icon,
                    ParentId = c.ParentId,
                    DisplayOrder = c.DisplayOrder
                })
                .ToListAsync();

            foreach (var child in children)
            {
                child.Children = await GetChildCategories(child.Id);
            }

            return children;
        }

        // POST: api/DocumentManagement/categories
        [HttpPost("categories")]
        public async Task<ActionResult<DocumentCategoryDto>> CreateCategory(CreateDocumentCategoryDto dto)
        {
            var username = User.Identity.Name;

            var category = new DocumentCategory
            {
                Name = dto.Name,
                Icon = dto.Icon ?? "📁",
                ParentId = dto.ParentId,
                CreatedBy = username,
                CreatedDate = DateTime.Now
            };

            _context.DocumentCategories.Add(category);
            await _context.SaveChangesAsync();

            return Ok(new DocumentCategoryDto
            {
                Id = category.Id,
                Name = category.Name,
                Icon = category.Icon,
                ParentId = category.ParentId
            });
        }

        // DELETE: api/DocumentManagement/categories/{id}
        [HttpDelete("categories/{id}")]
        public async Task<IActionResult> DeleteCategory(int id)
        {
            var category = await _context.DocumentCategories.FindAsync(id);
            if (category == null)
                return NotFound();

            // Soft delete
            category.IsActive = false;
            await _context.SaveChangesAsync();

            return NoContent();
        }

        #endregion

        #region Documents

        // GET: api/DocumentManagement/documents
        [HttpGet("documents")]
        public async Task<ActionResult<List<DocumentListDto>>> GetDocuments(
            [FromQuery] int? categoryId = null,
            [FromQuery] string type = null,
            [FromQuery] string search = null)
        {
            var query = _context.Documents
                .Where(d => d.IsActive)
                .AsQueryable();

            if (categoryId.HasValue)
            {
                query = query.Where(d => d.CategoryId == categoryId.Value);
            }

            if (!string.IsNullOrEmpty(type) && type != "all")
            {
                query = query.Where(d => d.Type == type);
            }

            if (!string.IsNullOrEmpty(search))
            {
                query = query.Where(d => d.Title.Contains(search) || d.Description.Contains(search));
            }

            var documents = await query
                .Select(d => new DocumentListDto
                {
                    Id = d.Id,
                    CategoryId = d.CategoryId,
                    Type = d.Type,
                    Title = d.Title,
                    Description = d.Description,
                    DocumentDate = d.DocumentDate,
                    CurrentVersion = d.CurrentVersion,
                    FileCount = d.Files.Count(f => f.IsActive),
                    CreatedBy = d.CreatedBy,
                    CreatedDate = d.CreatedDate
                })
                .OrderByDescending(d => d.CreatedDate)
                .ToListAsync();

            return Ok(documents);
        }

        // GET: api/DocumentManagement/documents/{id}
        [HttpGet("documents/{id}")]
        public async Task<ActionResult<DocumentDto>> GetDocument(int id)
        {
            var document = await _context.Documents
                .Include(d => d.Category)
                .Include(d => d.Files).ThenInclude(f => f.Version)
                .Include(d => d.Versions)
                .FirstOrDefaultAsync(d => d.Id == id && d.IsActive);

            if (document == null)
                return NotFound();

            var dto = new DocumentDto
            {
                Id = document.Id,
                CategoryId = document.CategoryId,
                CategoryName = document.Category.Name,
                Type = document.Type,
                Title = document.Title,
                Description = document.Description,
                DocumentDate = document.DocumentDate,
                CurrentVersion = document.CurrentVersion,
                FileCount = document.Files.Count(f => f.IsActive),
                CreatedBy = document.CreatedBy,
                CreatedDate = document.CreatedDate,
                UpdatedDate = document.UpdatedDate,
                Files = document.Files
                    .Where(f => f.IsActive && f.Version.IsCurrent)
                    .Select(f => new DocumentFileDto
                    {
                        Id = f.Id,
                        FileName = f.FileName,
                        FileExtension = f.FileExtension,
                        FileSize = f.FileSize,
                        FileSizeFormatted = FormatFileSize(f.FileSize),
                        DownloadCount = f.DownloadCount,
                        UploadDate = f.UploadDate,
                        UploadedBy = f.UploadedBy,
                        VersionNumber = f.Version.VersionNumber
                    })
                    .ToList(),
                Versions = document.Versions
                    .OrderByDescending(v => v.CreatedDate)
                    .Select(v => new DocumentVersionDto
                    {
                        Id = v.Id,
                        VersionNumber = v.VersionNumber,
                        ChangeNote = v.ChangeNote,
                        CreatedDate = v.CreatedDate,
                        CreatedBy = v.CreatedBy,
                        IsCurrent = v.IsCurrent
                    })
                    .ToList()
            };

            return Ok(dto);
        }

        // POST: api/DocumentManagement/documents
        [HttpPost("documents")]
        public async Task<ActionResult<DocumentDto>> CreateDocument([FromForm] CreateDocumentDto dto, [FromForm] List<IFormFile> files)
        {
            var username = User.Identity.Name;

            // Doküman oluştur
            var document = new Document
            {
                CategoryId = dto.CategoryId,
                Type = dto.Type,
                Title = dto.Title,
                Description = dto.Description,
                DocumentDate = dto.DocumentDate,
                CurrentVersion = "v1.0",
                ViewPermission = dto.ViewPermission,
                CreatedBy = username,
                CreatedDate = DateTime.Now
            };

            _context.Documents.Add(document);
            await _context.SaveChangesAsync();

            // İlk versiyon oluştur
            var version = new DocumentVersion
            {
                DocumentId = document.Id,
                VersionNumber = "v1.0",
                ChangeNote = "İlk versiyon",
                CreatedBy = username,
                CreatedDate = DateTime.Now,
                IsCurrent = true
            };

            _context.DocumentVersions.Add(version);
            await _context.SaveChangesAsync();

            // Dosyaları kaydet
            if (files != null && files.Count > 0)
            {
                await SaveFiles(document.Id, version.Id, files, username);
            }

            return CreatedAtAction(nameof(GetDocument), new { id = document.Id }, new { id = document.Id });
        }

        // PUT: api/DocumentManagement/documents/{id}
        [HttpPut("documents/{id}")]
        public async Task<IActionResult> UpdateDocument(int id, UpdateDocumentDto dto)
        {
            var document = await _context.Documents.FindAsync(id);
            if (document == null)
                return NotFound();

            var username = User.Identity.Name;

            document.CategoryId = dto.CategoryId;
            document.Type = dto.Type;
            document.Title = dto.Title;
            document.Description = dto.Description;
            document.DocumentDate = dto.DocumentDate;
            document.ViewPermission = dto.ViewPermission;
            document.UpdatedBy = username;
            document.UpdatedDate = DateTime.Now;

            await _context.SaveChangesAsync();

            return NoContent();
        }

        // DELETE: api/DocumentManagement/documents/{id}
        [HttpDelete("documents/{id}")]
        public async Task<IActionResult> DeleteDocument(int id)
        {
            var document = await _context.Documents.FindAsync(id);
            if (document == null)
                return NotFound();

            // Soft delete
            document.IsActive = false;
            await _context.SaveChangesAsync();

            return NoContent();
        }

        #endregion

        #region Versions

        // POST: api/DocumentManagement/documents/{id}/versions
        [HttpPost("documents/{id}/versions")]
        public async Task<ActionResult> CreateNewVersion(int id, [FromForm] CreateDocumentVersionDto dto, [FromForm] List<IFormFile> files)
        {
            var document = await _context.Documents
                .Include(d => d.Versions)
                .FirstOrDefaultAsync(d => d.Id == id);

            if (document == null)
                return NotFound();

            var username = User.Identity.Name;

            // Mevcut versiyonları güncelle
            var currentVersions = await _context.DocumentVersions
                .Where(v => v.DocumentId == id && v.IsCurrent)
                .ToListAsync();

            foreach (var v in currentVersions)
            {
                v.IsCurrent = false;
            }

            // Yeni versiyon oluştur
            var newVersion = new DocumentVersion
            {
                DocumentId = id,
                VersionNumber = dto.VersionNumber,
                ChangeNote = dto.ChangeNote,
                CreatedBy = username,
                CreatedDate = DateTime.Now,
                IsCurrent = true
            };

            _context.DocumentVersions.Add(newVersion);
            await _context.SaveChangesAsync();

            // Dosyaları kaydet
            if (files != null && files.Count > 0)
            {
                await SaveFiles(id, newVersion.Id, files, username);
            }

            // Dokümanın güncel versiyonunu güncelle
            document.CurrentVersion = dto.VersionNumber;
            document.UpdatedBy = username;
            document.UpdatedDate = DateTime.Now;
            await _context.SaveChangesAsync();

            return Ok(new { id = newVersion.Id });
        }

        #endregion

        #region Files

        // POST: api/DocumentManagement/documents/{documentId}/files
        [HttpPost("documents/{documentId}/files")]
        public async Task<ActionResult> UploadFiles(int documentId, [FromForm] List<IFormFile> files)
        {
            var document = await _context.Documents
                .Include(d => d.Versions)
                .FirstOrDefaultAsync(d => d.Id == documentId);

            if (document == null)
                return NotFound();

            var username = User.Identity.Name;

            // Güncel versiyonu bul
            var currentVersion = document.Versions.FirstOrDefault(v => v.IsCurrent);
            if (currentVersion == null)
                return BadRequest("Güncel versiyon bulunamadı");

            await SaveFiles(documentId, currentVersion.Id, files, username);

            return Ok();
        }

        // GET: api/DocumentManagement/files/{id}/download
        [HttpGet("files/{id}/download")]
        public async Task<IActionResult> DownloadFile(int id)
        {
            var file = await _context.DocumentFiles.FindAsync(id);
            if (file == null || !file.IsActive)
                return NotFound();

            var filePath = Path.Combine(_environment.ContentRootPath, file.FilePath);
            if (!System.IO.File.Exists(filePath))
                return NotFound();

            // İndirme sayısını artır
            file.DownloadCount++;
            await _context.SaveChangesAsync();

            var memory = new MemoryStream();
            using (var stream = new FileStream(filePath, FileMode.Open))
            {
                await stream.CopyToAsync(memory);
            }
            memory.Position = 0;

            return File(memory, file.ContentType, file.FileName);
        }

        // DELETE: api/DocumentManagement/files/{id}
        [HttpDelete("files/{id}")]
        public async Task<IActionResult> DeleteFile(int id)
        {
            var file = await _context.DocumentFiles.FindAsync(id);
            if (file == null)
                return NotFound();

            // Soft delete
            file.IsActive = false;
            await _context.SaveChangesAsync();

            return NoContent();
        }

        #endregion

        #region Helper Methods

        private async Task SaveFiles(int documentId, int versionId, List<IFormFile> files, string username)
        {
            var uploadPath = Path.Combine(_environment.ContentRootPath, "uploads", "documents", documentId.ToString(), versionId.ToString());
            Directory.CreateDirectory(uploadPath);

            foreach (var file in files)
            {
                if (file.Length > 0)
                {
                    var fileName = Path.GetFileName(file.FileName);
                    var filePath = Path.Combine(uploadPath, fileName);

                    using (var stream = new FileStream(filePath, FileMode.Create))
                    {
                        await file.CopyToAsync(stream);
                    }

                    var documentFile = new DocumentFile
                    {
                        DocumentId = documentId,
                        VersionId = versionId,
                        FileName = fileName,
                        FilePath = Path.Combine("uploads", "documents", documentId.ToString(), versionId.ToString(), fileName),
                        FileExtension = Path.GetExtension(fileName),
                        FileSize = file.Length,
                        ContentType = file.ContentType,
                        UploadedBy = username,
                        UploadDate = DateTime.Now
                    };

                    _context.DocumentFiles.Add(documentFile);
                }
            }

            await _context.SaveChangesAsync();
        }

        private string FormatFileSize(long bytes)
        {
            string[] sizes = { "B", "KB", "MB", "GB", "TB" };
            double len = bytes;
            int order = 0;
            while (len >= 1024 && order < sizes.Length - 1)
            {
                order++;
                len = len / 1024;
            }
            return $"{len:0.##} {sizes[order]}";
        }

        #endregion
    }
}