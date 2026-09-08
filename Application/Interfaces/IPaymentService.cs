namespace EcommerceSystem.Application.Interfaces;

public sealed record PaymentResult(bool Succeeded, string ProviderReference, string? FailureReason);

/// <summary>Implemented against Stripe in Infrastructure (Reem). No provider real charges are made — out of scope per the brief.</summary>
public interface IPaymentService
{
    Task<PaymentResult> ChargeAsync(int orderId, decimal amount, string currency, CancellationToken ct = default);

    /// <summary>Called by PlaceOrderHandler's compensation path when payment succeeded but order creation failed downstream.</summary>
    Task<bool> RefundAsync(string providerReference, CancellationToken ct = default);
}