using EcommerceSystem.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Persistence.Configurations;

public class PaymentConfiguration : IEntityTypeConfiguration<Payment>
{
    public void Configure(EntityTypeBuilder<Payment> b)
    {
        b.ToTable("Payments");
        b.HasKey(p => p.Id);
        b.Property(p => p.Provider).IsRequired().HasMaxLength(32);
        b.Property(p => p.ProviderReference).HasMaxLength(128);
        b.Property(p => p.CreatedAtUtc).HasDefaultValueSql("GETUTCDATE()");

        b.OwnsOne(p => p.Amount, amount =>
        {
            amount.Property(m => m.Amount).HasColumnName("Amount").HasColumnType("decimal(18,2)");
            amount.Property(m => m.Currency).HasColumnName("Currency").HasMaxLength(3);
        });
        // ProviderReference and any provider payload are exactly the kind of field that must
        // never hit a log sink - enforced in Logging/SerilogConfig.cs.
    }
}
