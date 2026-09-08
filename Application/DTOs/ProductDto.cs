namespace EcommerceSystem.Application.DTOs;

/// <summary>
/// Exposed instead of the Product entity so the API contract never leaks
/// Domain internals (e.g. the stock-mutation methods) and stays stable even
/// if the entity's shape changes.
/// </summary>
public sealed class ProductDto
{
    public int Id { get; set; }
    public string Name { get; set; } = default!;
    public string Description { get; set; } = default!;
    public decimal Price { get; set; }
    public string Currency { get; set; } = default!;
    public int StockQuantity { get; set; }
    public string ImageUrl { get; set; } = default!;
    public string Category { get; set; } = default!;
}

public sealed class PagedResult<T>
{
    public IReadOnlyList<T> Items { get; set; } = Array.Empty<T>();
    public int Page { get; set; }
    public int PageSize { get; set; }
    public int TotalCount { get; set; }
    public int TotalPages => PageSize == 0 ? 0 : (int)Math.Ceiling(TotalCount / (double)PageSize);
}