using EcommerceSystem.Application.Interfaces;

namespace Infrastructure.Payments;

/// <summary>
/// Local-development stand-in for <see cref="StripePaymentService"/>. Registered
/// only when no real Stripe secret key is configured (see DependencyInjection),
/// so a developer can run the full checkout flow without a Stripe account.
/// Every charge "succeeds"; every refund "succeeds". No network call, no money.
/// </summary>
public sealed class FakePaymentService : IPaymentService
{
    public Task<PaymentResult> ChargeAsync(int orderId, decimal amount, string currency, CancellationToken ct = default)
        => Task.FromResult(new PaymentResult(
            Succeeded: true,
            ProviderReference: $"fake_pi_{orderId}_{Guid.NewGuid():N}",
            FailureReason: null));

    public Task<bool> RefundAsync(string providerReference, CancellationToken ct = default)
        => Task.FromResult(true);
}
