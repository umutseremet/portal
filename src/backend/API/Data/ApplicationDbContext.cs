using API.Controllers;
using API.Data.Entities;
using Microsoft.EntityFrameworkCore;

namespace API.Data
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options)
        {
        }

        // Existing DbSets
        public DbSet<Visitor> Visitors { get; set; }

        // NEW - Vehicle Management DbSets
        public DbSet<Vehicle> Vehicles { get; set; }
        public DbSet<VehicleLog> VehicleLogs { get; set; }

        // NEW - Item Management DbSets
        public DbSet<ItemGroup> ItemGroups { get; set; }
        public DbSet<Item> Items { get; set; }

        public DbSet<VehicleFuelPurchase> VehicleFuelPurchases { get; set; }

        public DbSet<BomWork> BomWorks { get; set; }
        public DbSet<BomExcel> BomExcels { get; set; }
        public DbSet<BomItem> BomItems { get; set; }
        public DbSet<ItemFile> ItemFiles { get; set; }

        // ApplicationDbContext.cs
        public DbSet<TechnicalDrawingDownloadLog> TechnicalDrawingDownloadLogs { get; set; }

        // ✅ YENİ EKLENECEK DbSet'ler
        public DbSet<PurchaseRequest> PurchaseRequests { get; set; }
        public DbSet<PurchaseRequestDetail> PurchaseRequestDetails { get; set; }
        public DbSet<PurchaseOrder> PurchaseOrders { get; set; }
        public DbSet<PurchaseOrderDetail> PurchaseOrderDetails { get; set; }
        public DbSet<PurchaseRequestApprovalHistory> PurchaseRequestApprovalHistory { get; set; }
        public DbSet<PurchaseOrderHistory> PurchaseOrderHistory { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<ItemFile>(entity =>
            {
                entity.HasKey(e => e.Id);

                entity.Property(e => e.FileName)
                    .IsRequired()
                    .HasMaxLength(255);

                entity.Property(e => e.FilePath)
                    .IsRequired()
                    .HasMaxLength(500);

                entity.Property(e => e.FileSize)
                    .IsRequired();

                entity.Property(e => e.FileExtension)
                    .IsRequired()
                    .HasMaxLength(10);

                entity.Property(e => e.FileType)
                    .HasMaxLength(100);

                entity.Property(e => e.UploadedBy)
                    .HasMaxLength(100);

                entity.Property(e => e.UploadedAt)
                    .IsRequired();

                entity.Property(e => e.Description)
                    .HasMaxLength(500);

                // Foreign key relationship
                entity.HasOne(e => e.Item)
                    .WithMany()
                    .HasForeignKey(e => e.ItemId)
                    .OnDelete(DeleteBehavior.Cascade);

                // Index on ItemId for performance
                entity.HasIndex(e => e.ItemId)
                    .HasDatabaseName("IX_ItemFiles_ItemId");
            });

            // ✅ YENİ İLİŞKİLER
            // PurchaseRequest - PurchaseOrder ilişkisi
            modelBuilder.Entity<PurchaseRequest>()
                .HasOne(r => r.PurchaseOrder)
                .WithMany(o => o.Requests)
                .HasForeignKey(r => r.PurchaseOrderId)
                .OnDelete(DeleteBehavior.Restrict);

            // PurchaseRequest - PurchaseRequestDetail ilişkisi
            modelBuilder.Entity<PurchaseRequestDetail>()
                .HasOne(d => d.Request)
                .WithMany(r => r.Details)
                .HasForeignKey(d => d.RequestId)
                .OnDelete(DeleteBehavior.Cascade);

            // PurchaseOrder - PurchaseOrderDetail ilişkisi
            modelBuilder.Entity<PurchaseOrderDetail>()
                .HasOne(d => d.Order)
                .WithMany(o => o.Details)
                .HasForeignKey(d => d.OrderId)
                .OnDelete(DeleteBehavior.Cascade);

            // PurchaseRequestDetail - Item ilişkisi
            modelBuilder.Entity<PurchaseRequestDetail>()
                .HasOne(d => d.Item)
                .WithMany()
                .HasForeignKey(d => d.ItemId)
                .OnDelete(DeleteBehavior.Restrict);

            // PurchaseOrderDetail - Item ilişkisi
            modelBuilder.Entity<PurchaseOrderDetail>()
                .HasOne(d => d.Item)
                .WithMany()
                .HasForeignKey(d => d.ItemId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<BomWork>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.CreatedAt).HasDefaultValueSql("GETUTCDATE()");
                entity.Property(e => e.IsActive).HasDefaultValue(true);
                entity.HasIndex(e => e.ProjectId);
                entity.HasIndex(e => e.CreatedAt);
                entity.HasIndex(e => e.IsActive);
            });

            // BOM Excel konfigürasyonu - EKLE
            modelBuilder.Entity<BomExcel>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.UploadedAt).HasDefaultValueSql("GETUTCDATE()");
                entity.Property(e => e.IsProcessed).HasDefaultValue(false);
                entity.Property(e => e.RowCount).HasDefaultValue(0);
                entity.HasIndex(e => e.WorkId);
                entity.HasIndex(e => e.UploadedAt);

                entity.HasOne(e => e.BomWork)
                    .WithMany(w => w.BomExcels)
                    .HasForeignKey(e => e.WorkId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            // BOM Item konfigürasyonu - REVİZE EDİLDİ (ItemId ile Items tablosuna referans)
            modelBuilder.Entity<BomItem>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.CreatedAt).HasDefaultValueSql("GETUTCDATE()");
                entity.HasIndex(e => e.ExcelId);
                entity.HasIndex(e => e.ItemId);
                entity.HasIndex(e => e.RowNumber);

                // Composite index for Excel + Item
                entity.HasIndex(e => new { e.ExcelId, e.ItemId });

                // BomExcel ile ilişki (Cascade Delete)
                entity.HasOne(e => e.BomExcel)
                    .WithMany(ex => ex.BomItems)
                    .HasForeignKey(e => e.ExcelId)
                    .OnDelete(DeleteBehavior.Cascade);

                // Items tablosu ile ilişki (Restrict Delete - Item silindiğinde BomItem'ı silme)
                entity.HasOne(e => e.Item)
                    .WithMany()
                    .HasForeignKey(e => e.ItemId)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            // EXISTING - Visitor entity configuration
            modelBuilder.Entity<Visitor>(entity =>
            {
                entity.ToTable("Visitors");
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Id).ValueGeneratedOnAdd();
                entity.Property(e => e.Date).HasColumnType("date");
                entity.Property(e => e.Company).HasMaxLength(100).IsUnicode(false);
                entity.Property(e => e.VisitorName).HasMaxLength(255).IsUnicode(true);
                entity.Property(e => e.Description).HasMaxLength(500).IsUnicode(false);
                entity.Property(e => e.CreatedAt).HasDefaultValueSql("GETUTCDATE()");
                entity.HasIndex(e => e.Date).HasDatabaseName("IX_Visitors_Date");
                entity.HasIndex(e => e.Company).HasDatabaseName("IX_Visitors_Company");
            });

            // NEW - Vehicle entity configuration
            modelBuilder.Entity<Vehicle>(entity =>
            {
                entity.ToTable("Vehicles");
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Id).ValueGeneratedOnAdd();
                
                // String properties
                entity.Property(e => e.LicensePlate).HasMaxLength(20).IsRequired();
                entity.Property(e => e.Brand).HasMaxLength(50).IsRequired();
                entity.Property(e => e.Model).HasMaxLength(50).IsRequired();
                entity.Property(e => e.VIN).HasMaxLength(50).IsRequired();
                entity.Property(e => e.CompanyName).HasMaxLength(100).IsRequired();
                entity.Property(e => e.Insurance).HasMaxLength(100).IsRequired();
                entity.Property(e => e.TireCondition).HasMaxLength(20).IsRequired();
                entity.Property(e => e.RegistrationInfo).HasMaxLength(100).IsRequired();
                entity.Property(e => e.OwnershipType).HasMaxLength(50).IsRequired();
                entity.Property(e => e.AssignedUserName).HasMaxLength(100).IsRequired();
                entity.Property(e => e.AssignedUserPhone).HasMaxLength(20).IsRequired();
                entity.Property(e => e.Location).HasMaxLength(100).IsRequired();
                entity.Property(e => e.VehicleImageUrl).HasMaxLength(500);
                
                // Decimal property
                entity.Property(e => e.FuelConsumption).HasPrecision(4, 1);
                
                // Audit fields
                entity.Property(e => e.CreatedAt).HasDefaultValueSql("GETUTCDATE()");
                
                // Indexes for performance
                entity.HasIndex(e => e.LicensePlate).IsUnique().HasDatabaseName("IX_Vehicles_LicensePlate");
                entity.HasIndex(e => e.AssignedUserName).HasDatabaseName("IX_Vehicles_AssignedUserName");
                entity.HasIndex(e => e.CompanyName).HasDatabaseName("IX_Vehicles_CompanyName");
                entity.HasIndex(e => e.Brand).HasDatabaseName("IX_Vehicles_Brand");
            });

            // NEW - VehicleLog entity configuration
            modelBuilder.Entity<VehicleLog>(entity =>
            {
                entity.ToTable("VehicleLogs");
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Id).ValueGeneratedOnAdd();
                
                // Properties
                entity.Property(e => e.OperationType).HasMaxLength(100).IsRequired();
                entity.Property(e => e.Description).HasMaxLength(500).IsRequired();
                entity.Property(e => e.OldValues).HasMaxLength(2000);
                entity.Property(e => e.NewValues).HasMaxLength(2000);
                entity.Property(e => e.UserName).HasMaxLength(100).IsRequired();
                entity.Property(e => e.IpAddress).HasMaxLength(50).IsRequired();
                entity.Property(e => e.OperationDate).IsRequired().HasDefaultValueSql("GETUTCDATE()");

                // Foreign key relationship
                entity.HasOne(e => e.Vehicle)
                      .WithMany(v => v.VehicleLogs)
                      .HasForeignKey(e => e.VehicleId)
                      .OnDelete(DeleteBehavior.Cascade)
                      .HasConstraintName("FK_VehicleLogs_Vehicles");

                // Indexes for performance
                entity.HasIndex(e => e.VehicleId).HasDatabaseName("IX_VehicleLogs_VehicleId");
                entity.HasIndex(e => e.OperationDate).HasDatabaseName("IX_VehicleLogs_OperationDate");
                entity.HasIndex(e => e.UserName).HasDatabaseName("IX_VehicleLogs_UserName");
                entity.HasIndex(e => e.OperationType).HasDatabaseName("IX_VehicleLogs_OperationType");
            });

            // NEW - ItemGroup entity configuration
            modelBuilder.Entity<ItemGroup>(entity =>
            {
                entity.ToTable("ItemGroups");
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Id).ValueGeneratedOnAdd();

                // String properties
                entity.Property(e => e.Name).HasMaxLength(100).IsRequired();

                // Boolean property with default
                entity.Property(e => e.Cancelled).HasDefaultValue(false);

                // Audit fields
                entity.Property(e => e.CreatedAt).HasDefaultValueSql("GETUTCDATE()");

                // Indexes for performance
                entity.HasIndex(e => e.Name).HasDatabaseName("IX_ItemGroups_Name");
            });

            // NEW - Item entity configuration
            modelBuilder.Entity<Item>(entity =>
            {
                entity.ToTable("Items");
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Id).ValueGeneratedOnAdd();

                // Required properties
                entity.Property(e => e.Number).IsRequired();
                entity.Property(e => e.Code).HasMaxLength(50).IsRequired();
                entity.Property(e => e.GroupId).IsRequired();

                // Optional string properties
                entity.Property(e => e.ImageUrl).HasMaxLength(500);

                // Boolean property with default
                entity.Property(e => e.Cancelled).HasDefaultValue(false);

                // Audit fields
                entity.Property(e => e.CreatedAt).HasDefaultValueSql("GETUTCDATE()");

                // Foreign key relationship
                entity.HasOne(e => e.ItemGroup)
                      .WithMany(g => g.Items)
                      .HasForeignKey(e => e.GroupId)
                      .OnDelete(DeleteBehavior.Cascade)
                      .HasConstraintName("FK_Items_ItemGroups");

                // Indexes for performance
                entity.HasIndex(e => e.GroupId).HasDatabaseName("IX_Items_GroupId");
                entity.HasIndex(e => e.Code).HasDatabaseName("IX_Items_Code");
                entity.HasIndex(e => e.Number).HasDatabaseName("IX_Items_Number");
            });

            // VehicleFuelPurchase entity configuration
            modelBuilder.Entity<VehicleFuelPurchase>(entity =>
            {
                entity.ToTable("VehicleFuelPurchases");
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Id).ValueGeneratedOnAdd();

                // String properties
                entity.Property(e => e.Code).HasMaxLength(50).IsRequired();
                entity.Property(e => e.FleetCodeName).HasMaxLength(100).IsRequired();
                entity.Property(e => e.Fleet).HasMaxLength(200).IsRequired();
                entity.Property(e => e.City).HasMaxLength(100).IsRequired();
                entity.Property(e => e.Station).HasMaxLength(100).IsRequired();
                entity.Property(e => e.StationCode).HasMaxLength(50).IsRequired();
                entity.Property(e => e.DeviceGroups).HasMaxLength(100);
                entity.Property(e => e.LicensePlate).HasMaxLength(20).IsRequired();
                entity.Property(e => e.FuelType).HasMaxLength(100).IsRequired();
                entity.Property(e => e.SalesType).HasMaxLength(50).IsRequired();
                entity.Property(e => e.UTTS).HasMaxLength(50).IsRequired();
                entity.Property(e => e.DiscountType).HasMaxLength(20).IsRequired();
                entity.Property(e => e.VATRate).HasMaxLength(10).IsRequired();
                entity.Property(e => e.Distributor).HasMaxLength(50).IsRequired();
                entity.Property(e => e.TransactionNumber).HasMaxLength(50).IsRequired();
                entity.Property(e => e.InvoiceNumber).HasMaxLength(50).IsRequired();
                entity.Property(e => e.SalesRepresentative).HasMaxLength(200).IsRequired();

                // Decimal properties
                entity.Property(e => e.Quantity).HasColumnType("decimal(10,2)").IsRequired();
                entity.Property(e => e.GrossAmount).HasColumnType("decimal(10,2)").IsRequired();
                entity.Property(e => e.NetAmount).HasColumnType("decimal(10,2)").IsRequired();
                entity.Property(e => e.Discount).HasColumnType("decimal(5,2)").IsRequired();
                entity.Property(e => e.UnitPrice).HasColumnType("decimal(10,2)").IsRequired();

                // Audit fields
                entity.Property(e => e.CreatedAt).HasDefaultValueSql("GETUTCDATE()");

                // Foreign key relationship
                entity.HasOne(e => e.Vehicle)
                      .WithMany()
                      .HasForeignKey(e => e.VehicleId)
                      .OnDelete(DeleteBehavior.Restrict)
                      .HasConstraintName("FK_VehicleFuelPurchases_Vehicles");

                // Indexes for performance
                entity.HasIndex(e => e.VehicleId)
                      .HasDatabaseName("IX_VehicleFuelPurchases_VehicleId");
                entity.HasIndex(e => e.LicensePlate)
                      .HasDatabaseName("IX_VehicleFuelPurchases_LicensePlate");
                entity.HasIndex(e => e.PurchaseDate)
                      .HasDatabaseName("IX_VehicleFuelPurchases_PurchaseDate");
                entity.HasIndex(e => e.TransactionNumber)
                      .HasDatabaseName("IX_VehicleFuelPurchases_TransactionNumber");
                entity.HasIndex(e => e.InvoiceNumber)
                      .HasDatabaseName("IX_VehicleFuelPurchases_InvoiceNumber");

                // Composite index for common queries
                entity.HasIndex(e => new { e.VehicleId, e.PurchaseDate })
                      .HasDatabaseName("IX_VehicleFuelPurchases_VehicleId_PurchaseDate");
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
            var visitorEntries = ChangeTracker.Entries<Visitor>();
            var vehicleEntries = ChangeTracker.Entries<Vehicle>();

            // Visitor timestamp updates
            foreach (var entry in visitorEntries)
            {
                switch (entry.State)
                {
                    case EntityState.Added:
                        entry.Entity.CreatedAt = DateTime.Now;
                        break;
                    case EntityState.Modified:
                        entry.Entity.UpdatedAt = DateTime.Now;
                        break;
                }
            }

            // Vehicle timestamp updates
            foreach (var entry in vehicleEntries)
            {
                switch (entry.State)
                {
                    case EntityState.Added:
                        entry.Entity.CreatedAt = DateTime.Now;
                        break;
                    case EntityState.Modified:
                        entry.Entity.UpdatedAt = DateTime.Now;
                        // Don't modify CreatedAt
                        entry.Property(x => x.CreatedAt).IsModified = false;
                        break;
                }
            }
        }
    }
}