namespace EcommerceSystem.Application.DTOs;

/// <summary>
/// Admin CRUD payload for products — matches the figure fields exactly:
/// PhotoUrl, Name, Description, Price, Quantity, Discount, DisplayOrder.
/// DisplayOrder is nullable on input: leave it null and the handler
/// auto-assigns MAX(display_order) + 1.
/// </summary>
public sealed class AdminProductDto
{
    public int Id { get; set; }
    public string PhotoUrl { get; set; } = default!;
    public string Name { get; set; } = default!;
    public string Description { get; set; } = default!;
    public decimal Price { get; set; }
    public int Quantity { get; set; }
    public decimal DiscountPercentage { get; set; }
    public DateTime? DiscountStartsAtUtc { get; set; }
    public DateTime? DiscountEndsAtUtc { get; set; }
    public int? DisplayOrder { get; set; }
}