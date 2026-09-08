using EcommerceSystem.Domain.Exceptions;

namespace EcommerceSystem.Domain.ValueObjects;

/// <summary>
/// Wraps a decimal amount so "price" is never a bare decimal floating around
/// the codebase. Maps to SQL Server decimal(18,2) in Infrastructure's EF
/// configuration (Reem owns that mapping).
/// </summary>
public sealed record Money
{
    public decimal Amount { get; }
    public string Currency { get; }

    public Money(decimal amount, string currency = "USD")
    {
        if (amount < 0)
            throw new DomainException("Money amount cannot be negative.");

        if (string.IsNullOrWhiteSpace(currency))
            throw new DomainException("Currency is required.");

        Amount = decimal.Round(amount, 2);
        Currency = currency.ToUpperInvariant();
    }

    public static Money Zero(string currency = "USD") => new(0, currency);

    public Money Add(Money other)
    {
        EnsureSameCurrency(other);
        return new Money(Amount + other.Amount, Currency);
    }

    public Money Multiply(int quantity)
    {
        if (quantity < 0)
            throw new DomainException("Quantity cannot be negative.");
        return new Money(Amount * quantity, Currency);
    }

    private void EnsureSameCurrency(Money other)
    {
        if (Currency != other.Currency)
            throw new DomainException($"Currency mismatch: {Currency} vs {other.Currency}.");
    }

    public override string ToString() => $"{Amount:0.00} {Currency}";
}
