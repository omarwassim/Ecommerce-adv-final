using EcommerceSystem.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Persistence.Configurations;

public class UserDiscountConfiguration : IEntityTypeConfiguration<UserDiscount>
{
    public void Configure(EntityTypeBuilder<UserDiscount> b)
    {
        b.ToTable("UserDiscounts");
        b.HasKey(d => d.Id);
        b.Property(d => d.Type).HasConversion<string>().HasMaxLength(32);
        b.Property(d => d.DiscountPercentage).HasColumnType("decimal(5,2)");

        // GetActiveAsync always filters by exactly these three columns.
        b.HasIndex(d => new { d.UserId, d.Type, d.UsedAtUtc, d.ExpiresAtUtc });

        b.HasOne<Order>().WithMany().HasForeignKey(d => d.SourceOrderId).IsRequired(false).OnDelete(DeleteBehavior.SetNull);
    }
}
