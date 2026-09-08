namespace EcommerceSystem.Application.DTOs;

public sealed class SalesAnalyticsDto
{
    public List<ProductSalesDto> Items { get; set; } = new();
}

public sealed class ProductSalesDto
{
    public int ProductId { get; set; }
    public string ProductName { get; set; } = default!;
    public int UnitsSold { get; set; }
    public decimal RevenueGenerated { get; set; }

    /// <summary>This product's share of total units sold across the catalog, 0–100.</summary>
    public decimal SalesDistributionPercentage { get; set; }
}