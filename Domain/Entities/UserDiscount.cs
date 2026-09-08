using EcommerceSystem.Domain.Enums;
using EcommerceSystem.Domain.Exceptions;

namespace EcommerceSystem.Domain.Entities;

/// <summary>
/// A personalized, one-time discount grant. Two kinds: FirstPurchase (implicit, no row needed
/// until first redeemed - PlaceOrderHandler checks order count directly) and PostOrderWindow
/// (an actual row, granted after any completed order, expires 72h later).
/// </summary>
public class UserDiscount
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public UserDiscountType Type { get; set; }
    public decimal DiscountPercentage { get; set; }
    public int? SourceOrderId { get; set; }
    public DateTime GrantedAtUtc { get; set; }
    public DateTime ExpiresAtUtc { get; set; }
    public DateTime? UsedAtUtc { get; set; }

    public bool IsActive(DateTime nowUtc) => UsedAtUtc is null && nowUtc < ExpiresAtUtc;

    /// <summary>Granted automatically when an order completes successfully - a 72h, 15% window.</summary>
    public static UserDiscount CreatePostOrderWindow(int userId, int orderId, DateTime nowUtc) => new()
    {
        UserId = userId,
        Type = UserDiscountType.PostOrderWindow,
        DiscountPercentage = 15.00m,
        SourceOrderId = orderId,
        GrantedAtUtc = nowUtc,
        ExpiresAtUtc = nowUtc.AddHours(72)
    };

    public void MarkUsed(DateTime nowUtc)
    {
        if (UsedAtUtc is not null)
            throw new DomainException("This discount has already been used.");

        UsedAtUtc = nowUtc;
    }
}
