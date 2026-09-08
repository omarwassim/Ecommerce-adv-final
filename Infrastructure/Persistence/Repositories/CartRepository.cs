using EcommerceSystem.Domain.Entities;
using EcommerceSystem.Domain.Interfaces;
using Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Persistence.Repositories;

public class CartRepository : ICartRepository
{
    private readonly AppDbContext _db;

    public CartRepository(AppDbContext db) => _db = db;

    public Task<Cart?> GetByUserIdAsync(int userId, CancellationToken ct = default) =>
        _db.Carts.Include(c => c.Items).ThenInclude(i => i.Product)
            .FirstOrDefaultAsync(c => c.UserId == userId, ct);

    public async Task AddAsync(Cart cart, CancellationToken ct = default) =>
        await _db.Carts.AddAsync(cart, ct);

    public void Update(Cart cart) => _db.Carts.Update(cart);
}
