using EcommerceSystem.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Persistence.Configurations;

public class OrderConfiguration : IEntityTypeConfiguration<Order>
{
    public void Configure(EntityTypeBuilder<Order> b)
    {
        b.ToTable("Orders");
        b.HasKey(o => o.Id);
        b.Property(o => o.Status).HasConversion<string>().HasMaxLength(32);
        b.Property(o => o.IdempotencyKey).IsRequired().HasMaxLength(128);
        b.Property(o => o.CreatedAtUtc).HasDefaultValueSql("GETUTCDATE()");
        b.Property(o => o.CompensationReason).HasMaxLength(1000);

        // The real guarantee behind checkout idempotency: a duplicate PlaceOrder request
        // (retry/timeout) with the same key can never insert a second row.
        b.HasIndex(o => o.IdempotencyKey).IsUnique();

        b.OwnsOne(o => o.Total, total =>
        {
            total.Property(m => m.Amount).HasColumnName("TotalAmount").HasColumnType("decimal(18,2)");
            total.Property(m => m.Currency).HasColumnName("TotalCurrency").HasMaxLength(3);
        });

        b.HasMany(o => o.Items)
            .WithOne()
            .HasForeignKey(oi => oi.OrderId)
            .OnDelete(DeleteBehavior.Cascade);

        b.HasOne(o => o.Payment)
            .WithOne()
            .HasForeignKey<Payment>(p => p.OrderId);
    }
}
