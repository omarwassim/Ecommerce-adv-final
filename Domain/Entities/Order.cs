using EcommerceSystem.Domain.Enums;
using EcommerceSystem.Domain.Exceptions;
using EcommerceSystem.Domain.ValueObjects;

namespace EcommerceSystem.Domain.Entities;

public class Order
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public OrderStatus Status { get; set; } = OrderStatus.Pending;

    /// <summary>
    /// The idempotency key the client sent with the checkout request.
    /// Unique index on this column (set up in Infrastructure) is what
    /// actually stops a duplicate order at the database level — the
    /// Application-layer check in Omar's PlaceOrderHandler is the fast path,
    /// this unique constraint is the guarantee.
    /// </summary>
    public string IdempotencyKey { get; set; } = default!;

    public Money Total { get; set; } = default!;
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
    public DateTime? PaidAtUtc { get; set; }
    public DateTime? ConfirmedAtUtc { get; set; }

    /// <summary>0 when no discount applied. Set once, at checkout, by ApplyOrderLevelDiscount -
    /// never changed afterward, same "snapshot, don't reference live data" rule as price.</summary>
    public decimal AppliedDiscountPercentage { get; set; }

    /// <summary>Human-readable reason the discount was applied - "FirstPurchase",
    /// "PostOrderWindow", or null if none. Purely informational (for the order history /
    /// admin view), Total already reflects the discount regardless.</summary>
    public string? DiscountSource { get; set; }

    /// <summary>Set when the order goes to Compensated — why the refund happened.</summary>
    public string? CompensationReason { get; set; }

    public ICollection<OrderItem> Items { get; set; } = new List<OrderItem>();
    public Payment? Payment { get; set; }

    /// <summary>Called once, before Total is computed from the subtotal - see PlaceOrderHandler.
    /// Never called twice on the same order (there's only one discount per order).</summary>
    public void ApplyOrderLevelDiscount(decimal percentage, string source)
    {
        AppliedDiscountPercentage = percentage;
        DiscountSource = source;
    }

    public void MarkPaid()
    {
        if (Status != OrderStatus.Pending)
            throw new InvalidOrderStateTransitionException(Status.ToString(), OrderStatus.Paid.ToString());

        Status = OrderStatus.Paid;
        PaidAtUtc = DateTime.UtcNow;
    }

    public void Confirm()
    {
        if (Status != OrderStatus.Paid)
            throw new InvalidOrderStateTransitionException(Status.ToString(), OrderStatus.Confirmed.ToString());

        Status = OrderStatus.Confirmed;
        ConfirmedAtUtc = DateTime.UtcNow;
    }

    public void Fail()
    {
        if (Status != OrderStatus.Pending)
            throw new InvalidOrderStateTransitionException(Status.ToString(), OrderStatus.Failed.ToString());

        Status = OrderStatus.Failed;
    }

    /// <summary>
    /// Payment succeeded but something downstream (stock reservation,
    /// confirmation) blew up. Money already moved, so this is not a plain
    /// "fail" — it needs an actual refund/void call, which the handler
    /// triggers through IPaymentService after calling this.
    /// </summary>
    public void Compensate(string reason)
    {
        if (Status != OrderStatus.Paid)
            throw new InvalidOrderStateTransitionException(Status.ToString(), OrderStatus.Compensated.ToString());

        Status = OrderStatus.Compensated;
        CompensationReason = reason;
    }
}