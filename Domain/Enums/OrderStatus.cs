namespace EcommerceSystem.Domain.Enums;

/// <summary>
/// Order state machine.
///
/// Pending      -> order row created, payment not confirmed yet
/// Paid         -> payment provider confirmed the charge
/// Confirmed    -> order fully committed (stock reserved, confirmation sent)
/// Failed       -> payment failed or was declined, no charge went through
/// Compensated  -> payment succeeded but order creation/confirmation failed,
///                 and a refund/void was issued to fix the mismatch
///
/// Valid transitions (enforced in the Order entity, not here):
/// Pending -> Paid -> Confirmed
/// Pending -> Failed
/// Paid -> Compensated   (payment ok, something after it broke)
/// </summary>
public enum OrderStatus
{
    Pending = 0,
    Paid = 1,
    Confirmed = 2,
    Failed = 3,
    Compensated = 4
}