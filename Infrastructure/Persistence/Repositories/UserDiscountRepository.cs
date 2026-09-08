using EcommerceSystem.Domain.Entities;
using EcommerceSystem.Domain.Enums;
using EcommerceSystem.Domain.Interfaces;
using Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Persistence.Repositories;

public class UserDiscountRepository : IUserDiscountRepository
{
    private readonly AppDbContext _db;

    public UserDiscountRepository(AppDbContext db) => _db = db;

    public Task<UserDiscount?> GetActiveAsync(int userId, UserDiscountType type, DateTime nowUtc, CancellationToken ct = default) =>
        _db.UserDiscounts
            .Where(d => d.UserId == userId && d.Type == type && d.UsedAtUtc == null && d.ExpiresAtUtc > nowUtc)
            .OrderByDescending(d => d.GrantedAtUtc)
            .FirstOrDefaultAsync(ct);

    public async Task AddAsync(UserDiscount discount, CancellationToken ct = default) =>
        await _db.UserDiscounts.AddAsync(discount, ct);

    public void Update(UserDiscount discount) => _db.UserDiscounts.Update(discount);
}
