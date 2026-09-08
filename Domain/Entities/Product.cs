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

    /// <summary>Front-page position - lower shows first. Auto-assigned to MAX+1 by
    /// CreateProductHandler when the admin leaves it null.</summary>
    public int DisplayOrder { get; set; }

    /// <summary>Photo shown in the catalog and admin dashboard - separate from any future
    /// gallery/multi-image feature, this is the one primary image.</summary>
    public string PhotoUrl { get; set; } = default!;

    /// <summary>0 when there's no active admin-set discount. Combined with the window below to
    /// decide whether it's *currently* active - see EffectiveDiscountPercentage.</summary>
    public decimal DiscountPercentage { get; set; }
    public DateTime? DiscountStartsAtUtc { get; set; }
    public DateTime? DiscountEndsAtUtc { get; set; }

    public bool HasActiveDiscount(DateTime nowUtc) =>
        DiscountPercentage > 0
        && DiscountStartsAtUtc is not null && DiscountEndsAtUtc is not null
        && nowUtc >= DiscountStartsAtUtc && nowUtc < DiscountEndsAtUtc;

    /// <summary>What checkout actually snapshots onto each OrderItem - 0 outside the window,
    /// so callers never need to separately check HasActiveDiscount first.</summary>
    public decimal GetEffectiveDiscountPercentage(DateTime nowUtc) =>
        HasActiveDiscount(nowUtc) ? DiscountPercentage : 0m;

    /// <summary>Admin sets or clears a time-boxed discount window on this product. endsAtUtc
    /// must be after startsAtUtc - enforced by SetProductDiscountValidator before this is
    /// ever called, but checked again here since Domain never trusts a caller's validation.</summary>
    public void SetDiscount(decimal percentage, DateTime startsAtUtc, DateTime endsAtUtc)
    {
        if (percentage < 0 || percentage > 100)
            throw new DomainException("Discount percentage must be between 0 and 100.");
        if (endsAtUtc <= startsAtUtc)
            throw new DomainException("Discount end time must be after start time.");

        DiscountPercentage = percentage;
        DiscountStartsAtUtc = startsAtUtc;
        DiscountEndsAtUtc = endsAtUtc;
    }

    public void ClearDiscount()
    {
        DiscountPercentage = 0;
        DiscountStartsAtUtc = null;
        DiscountEndsAtUtc = null;
    }

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