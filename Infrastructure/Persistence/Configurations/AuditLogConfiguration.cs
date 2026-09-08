using EcommerceSystem.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Persistence.Configurations;

public class AuditLogConfiguration : IEntityTypeConfiguration<AuditLog>
{
    public void Configure(EntityTypeBuilder<AuditLog> b)
    {
        b.ToTable("AuditLogs");
        b.HasKey(a => a.Id);
        b.Property(a => a.Action).IsRequired().HasMaxLength(100);
        b.Property(a => a.EntityType).IsRequired().HasMaxLength(100);
        b.Property(a => a.Details).HasMaxLength(2000);
        b.Property(a => a.CreatedAtUtc).HasDefaultValueSql("GETUTCDATE()");

        // Read pattern is always "most recent N, optionally filtered by admin or entity type"
        // (see AuditLogRepository.GetPagedAsync) - index both filters plus the sort column.
        b.HasIndex(a => a.CreatedAtUtc);
        b.HasIndex(a => a.AdminUserId);
        b.HasIndex(a => a.EntityType);
    }
}
