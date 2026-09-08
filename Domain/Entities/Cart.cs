using EcommerceSystem.Domain.Exceptions;

namespace EcommerceSystem.Domain.Entities;

public class Cart
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAtUtc { get; set; } = DateTime.UtcNow;

    public ICollection<CartItem> Items { get; set; } = new List<CartItem>();

    public void AddItem(int productId, int quantity)
    {
        if (quantity <= 0)
            throw new DomainException("Quantity must be positive.");

        var existing = Items.FirstOrDefault(i => i.ProductId == productId);
        if (existing is not null)
        {
            existing.Quantity += quantity;
        }
        else
        {
            Items.Add(new CartItem
            {
                CartId = Id,
                ProductId = productId,
                Quantity = quantity
            });
        }

        UpdatedAtUtc = DateTime.UtcNow;
    }

    public void RemoveItem(int productId)
    {
        var existing = Items.FirstOrDefault(i => i.ProductId == productId);
        if (existing is not null)
        {
            Items.Remove(existing);
            UpdatedAtUtc = DateTime.UtcNow;
        }
    }

    public void Clear()
    {
        Items.Clear();
        UpdatedAtUtc = DateTime.UtcNow;
    }
}