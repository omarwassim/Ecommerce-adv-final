using EcommerceSystem.Domain.ValueObjects;

namespace EcommerceSystem.Domain.Entities;

public class Payment
{
    public int Id { get; set; }
    public int OrderId { get; set; }

    /// <summary>Id returned by the payment provider (e.g. Stripe PaymentIntent id). Never a raw card number.</summary>
    public string ProviderReference { get; set; } = default!;

    public Money Amount { get; set; } = default!;
    public string Provider { get; set; } = default!; // "Stripe", etc.
    public bool Succeeded { get; set; }
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
}