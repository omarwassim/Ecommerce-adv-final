using EcommerceSystem.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Persistence.Configurations;

public class OrderItemConfiguration : IEntityTypeConfiguration<OrderItem>
{
    public void Configure(EntityTypeBuilder<OrderItem> b)
    {
        b.ToTable("OrderItems");
        b.HasKey(oi => oi.Id);
        b.Property(oi => oi.ProductNameSnapshot).IsRequired().HasMaxLength(256);

        // LineTotal is a computed property on the entity (UnitPriceAtPurchase * Quantity),
        // not a real column - EF must be told to skip it.
        b.Ignore(oi => oi.LineTotal);

        b.OwnsOne(oi => oi.UnitPriceAtPurchase, price =>
        {
            price.Property(m => m.Amount).HasColumnName("UnitPriceAtPurchase").HasColumnType("decimal(18,2)");
            price.Property(m => m.Currency).HasColumnName("Currency").HasMaxLength(3);
        });

        b.HasOne<Product>()
            .WithMany()
            .HasForeignKey(oi => oi.ProductId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
