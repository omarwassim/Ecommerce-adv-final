namespace EcommerceSystem.Domain.Enums;

/// <summary>
/// FirstPurchase  -> granted implicitly, available until redeemed on the user's first order
/// PostOrderWindow -> granted right after any completed order, expires 72h after grant
/// </summary>
public enum UserDiscountType
{
    FirstPurchase = 0,
    PostOrderWindow = 1
}
