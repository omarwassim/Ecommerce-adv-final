using EcommerceSystem.Domain.ValueObjects;

namespace EcommerceSystem.Domain.Entities;

public class OrderItem
{
    public int Id { get; set; }
    public int OrderId { get; set; }
    public int ProductId { get; set; }

    /// <summary>Product name copied at order time, in case the product is later renamed or removed.</summary>
    public string ProductNameSnapshot { get; set; } = default!;

    /// <summary>
    /// The price at the moment of purchase, copied — never a live FK read
    /// from Product.Price. If we referenced Product.Price directly, every
    /// past order's total would silently change whenever the product's
    /// price changes today. Copying it is what makes an order an immutable
    /// receipt instead of a live view.
    /// </summary>
    public Money UnitPriceAtPurchase { get; set; } = default!;

    /// <summary>Item-level admin discount snapshotted at checkout (from
    /// Product.GetEffectiveDiscountPercentage) - same "snapshot, don't reference live data"
    /// rule as price. 0 when the product had no active discount at purchase time.</summary>
    public decimal DiscountPercentageAtPurchase { get; set; }

    public int Quantity { get; set; }

    public Money LineTotal => UnitPriceAtPurchase.ApplyDiscountPercentage(DiscountPercentageAtPurchase).Multiply(Quantity);
}