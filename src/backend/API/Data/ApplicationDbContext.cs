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

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // EXISTING - Visitor entity configuration
            modelBuilder.Entity<Visitor>(entity =>
            {
                entity.ToTable("visitors");
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
                entity.ToTable("item_groups");
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
                entity.ToTable("items");
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
                      .HasConstraintName("FK_items_item_groups");

                // Indexes for performance
                entity.HasIndex(e => e.GroupId).HasDatabaseName("IX_Items_GroupId");
                entity.HasIndex(e => e.Code).HasDatabaseName("IX_Items_Code");
                entity.HasIndex(e => e.Number).HasDatabaseName("IX_Items_Number");
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
                        entry.Entity.CreatedAt = DateTime.UtcNow;
                        break;
                    case EntityState.Modified:
                        entry.Entity.UpdatedAt = DateTime.UtcNow;
                        break;
                }
            }

            // Vehicle timestamp updates
            foreach (var entry in vehicleEntries)
            {
                switch (entry.State)
                {
                    case EntityState.Added:
                        entry.Entity.CreatedAt = DateTime.UtcNow;
                        break;
                    case EntityState.Modified:
                        entry.Entity.UpdatedAt = DateTime.UtcNow;
                        // Don't modify CreatedAt
                        entry.Property(x => x.CreatedAt).IsModified = false;
                        break;
                }
            }
        }
    }
}