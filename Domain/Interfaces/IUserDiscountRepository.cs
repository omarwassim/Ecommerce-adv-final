using EcommerceSystem.Domain.Entities;
using EcommerceSystem.Domain.Enums;

namespace EcommerceSystem.Domain.Interfaces;

public interface IUserDiscountRepository
{
    /// <summary>The most relevant unused, unexpired discount of this type for the user, if any.</summary>
    Task<UserDiscountType?> GetAvailableAsync(int userId, UserDiscountType type, DateTime nowUtc, CancellationToken ct = default);

    /// <summary>True if the user has ever completed an order — used to decide FirstPurchase eligibility.</summary>
    Task<bool> HasAnyCompletedOrderAsync(int userId, CancellationToken ct = default);

    Task AddAsync(UserDiscountType discount, CancellationToken ct = default);
    void Update(UserDiscountType discount);
}