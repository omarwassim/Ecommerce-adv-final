using EcommerceSystem.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Persistence.Configurations;

public class CartConfiguration : IEntityTypeConfiguration<Cart>
{
    public void Configure(EntityTypeBuilder<Cart> b)
    {
        b.ToTable("Carts");
        b.HasKey(c => c.Id);
        b.Property(c => c.CreatedAtUtc).HasDefaultValueSql("GETUTCDATE()");
        b.Property(c => c.UpdatedAtUtc).HasDefaultValueSql("GETUTCDATE()");

        // No User navigation on Cart (Rahaf's entity only keeps UserId) - just the FK,
        // enforced unique so a user can't end up with two carts.
        b.HasIndex(c => c.UserId).IsUnique();

        b.HasMany(c => c.Items)
            .WithOne()
            .HasForeignKey(ci => ci.CartId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
