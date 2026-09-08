using EcommerceSystem.Domain.Entities;
using EcommerceSystem.Domain.Enums;

namespace EcommerceSystem.Domain.Interfaces;

public interface IUserDiscountRepository
{
    /// <summary>The active (unused, unexpired) discount of this type for the user, if any.</summary>
    Task<UserDiscount?> GetActiveAsync(int userId, UserDiscountType type, DateTime nowUtc, CancellationToken ct = default);

    Task AddAsync(UserDiscount discount, CancellationToken ct = default);
    void Update(UserDiscount discount);
}
