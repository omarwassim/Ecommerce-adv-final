using EcommerceSystem.Domain.Exceptions;
using EcommerceSystem.Domain.ValueObjects;

namespace EcommerceSystem.Domain.Entities;

public class Product
{
    public int Id { get; set; }
    public string Name { get; set; } = default!;
    public string Description { get; set; } = default!;
    public Money Price { get; set; } = default!;
    public int StockQuantity { get; set; }
    public string ImageUrl { get; set; } = default!;
    public string Category { get; set; } = default!;
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// Called when an order is placed. Throws instead of going negative so
    /// a race under concurrent checkouts fails loudly rather than silently
    /// overselling stock.
    /// </summary>
    public void ReserveStock(int quantity)
    {
        if (quantity <= 0)
            throw new DomainException("Reserve quantity must be positive.");

        if (StockQuantity < quantity)
            throw new InsufficientStockException(Id);

        StockQuantity -= quantity;
    }

    public void ReleaseStock(int quantity)
    {
        if (quantity <= 0) return;
        StockQuantity += quantity;
    }
}