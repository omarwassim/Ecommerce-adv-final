using EcommerceSystem.Application.Interfaces;
using Microsoft.Extensions.Configuration;
using Stripe;

namespace Infrastructure.Payments;

// Real gateway integration is explicitly out of scope for this task, so this calls Stripe's
// PaymentIntent API in test mode against a test secret key (config, never hardcoded/logged) -
// a genuine Stripe.net call, not a hand-rolled fake, but no real money moves.
public class StripePaymentService : IPaymentService
{
    public StripePaymentService(IConfiguration config)
    {
        StripeConfiguration.ApiKey = config["Stripe:SecretKey"];
    }

    public async Task<PaymentResult> ChargeAsync(int orderId, decimal amount, string currency, CancellationToken ct = default)
    {
        try
        {
            var service = new PaymentIntentService();
            var intent = await service.CreateAsync(new PaymentIntentCreateOptions
            {
                Amount = (long)(amount * 100), // Stripe uses the smallest currency unit
                Currency = currency.ToLowerInvariant(),
                Metadata = new Dictionary<string, string> { ["orderId"] = orderId.ToString() },
                Confirm = true,
                PaymentMethod = "pm_card_visa", // test-mode payment method
                AutomaticPaymentMethods = new PaymentIntentAutomaticPaymentMethodsOptions
                {
                    Enabled = true,
                    AllowRedirects = "never"
                }
            }, cancellationToken: ct);

            return new PaymentResult(
                Succeeded: intent.Status == "succeeded",
                ProviderReference: intent.Id,
                FailureReason: intent.Status == "succeeded" ? null : intent.Status);
        }
        catch (StripeException ex)
        {
            // Never let a payment-provider exception bubble up raw (it can carry card data in
            // its message) - map to a safe PaymentResult; PlaceOrderHandler's compensation
            // path is what actually handles a failed charge.
            return new PaymentResult(false, ProviderReference: string.Empty, FailureReason: ex.StripeError?.Code);
        }
    }

    public async Task<bool> RefundAsync(string providerReference, CancellationToken ct = default)
    {
        // Called by PlaceOrderHandler's compensation path: payment succeeded but something
        // downstream (confirmation) failed, so the charge needs to be voided/refunded.
        try
        {
            var service = new RefundService();
            var refund = await service.CreateAsync(new RefundCreateOptions
            {
                PaymentIntent = providerReference
            }, cancellationToken: ct);

            return refund.Status == "succeeded";
        }
        catch (StripeException)
        {
            return false;
        }
    }
}
