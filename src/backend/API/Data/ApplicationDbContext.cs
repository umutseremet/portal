using API.Data.Entities;
using Microsoft.EntityFrameworkCore;

namespace API.Data
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options)
        {
        }

        // DbSets
        public DbSet<Visitor> Visitors { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Visitor entity konfigürasyonu
            modelBuilder.Entity<Visitor>(entity =>
            {
                // Tablo adı zaten [Table] attribute ile belirtildi
                entity.ToTable("visitors");

                // Primary key
                entity.HasKey(e => e.Id);

                // Identity column
                entity.Property(e => e.Id)
                    .ValueGeneratedOnAdd();

                // Date kolonunu nullable yap
                entity.Property(e => e.Date)
                    .HasColumnType("date");

                // String kolonlar için maksimum uzunluk
                entity.Property(e => e.Company)
                    .HasMaxLength(100)
                    .IsUnicode(false); // varchar için

                entity.Property(e => e.VisitorName)
                    .HasMaxLength(255)
                    .IsUnicode(true); // nvarchar için

                entity.Property(e => e.Description)
                    .HasMaxLength(500)
                    .IsUnicode(false); // varchar için

                // Audit alanları için default değerler
                entity.Property(e => e.CreatedAt)
                    .HasDefaultValueSql("GETUTCDATE()");

                // Index'ler (performans için)
                entity.HasIndex(e => e.Date)
                    .HasDatabaseName("IX_Visitors_Date");

                entity.HasIndex(e => e.Company)
                    .HasDatabaseName("IX_Visitors_Company");
            });
        }

        public override int SaveChanges()
        {
            UpdateTimestamps();
            return base.SaveChanges();
        }

        public override async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
        {
            UpdateTimestamps();
            return await base.SaveChangesAsync(cancellationToken);
        }

        private void UpdateTimestamps()
        {
            var entries = ChangeTracker.Entries<Visitor>();

            foreach (var entry in entries)
            {
                switch (entry.State)
                {
                    case EntityState.Added:
                        entry.Entity.CreatedAt = DateTime.UtcNow;
                        break;
                    case EntityState.Modified:
                        entry.Entity.UpdatedAt = DateTime.UtcNow;
                        break;
                }
            }
        }
    }
}