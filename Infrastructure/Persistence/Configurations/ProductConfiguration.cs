using EcommerceSystem.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Persistence.Configurations;

public class ProductConfiguration : IEntityTypeConfiguration<Product>
{
    public void Configure(EntityTypeBuilder<Product> b)
    {
        b.ToTable("Products");
        b.HasKey(p => p.Id);
        b.Property(p => p.Name).IsRequired().HasMaxLength(256);
        b.Property(p => p.Description).HasMaxLength(2000);
        b.Property(p => p.ImageUrl).HasMaxLength(1000);
        b.Property(p => p.Category).HasMaxLength(100);
        b.Property(p => p.CreatedAtUtc).HasDefaultValueSql("GETUTCDATE()");

        // Money is a value object (record), mapped as an EF owned type so it stays a real
        // object in C# (Product.Price.Amount / .Currency) but two plain columns in SQL.
        b.OwnsOne(p => p.Price, price =>
        {
            price.Property(m => m.Amount).HasColumnName("Price").HasColumnType("decimal(18,2)");
            price.Property(m => m.Currency).HasColumnName("Currency").HasMaxLength(3);
        });

        b.HasIndex(p => p.Category);
    }
}
