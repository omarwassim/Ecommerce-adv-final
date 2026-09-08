namespace EcommerceSystem.Application.DTOs;

public sealed class OrderDto
{
    public int Id { get; set; }
    public string Status { get; set; } = default!;
    public decimal Total { get; set; }
    public DateTime CreatedAtUtc { get; set; }
    public List<OrderItemDto> Items { get; set; } = new();
}

public sealed class OrderItemDto
{
    public int ProductId { get; set; }
    public string ProductName { get; set; } = default!;
    public decimal UnitPrice { get; set; }
    public int Quantity { get; set; }
    public decimal LineTotal { get; set; }
}