using EcommerceSystem.Domain.Entities;
using EcommerceSystem.Domain.Interfaces;
using Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Persistence.Repositories;

public class OrderRepository : IOrderRepository
{
    private readonly AppDbContext _db;

    public OrderRepository(AppDbContext db) => _db = db;

    public Task<Order?> GetByIdAsync(int id, CancellationToken ct = default) =>
        _db.Orders.Include(o => o.Items).Include(o => o.Payment)
            .FirstOrDefaultAsync(o => o.Id == id, ct);

    public Task<Order?> GetByIdempotencyKeyAsync(string idempotencyKey, CancellationToken ct = default) =>
        _db.Orders.Include(o => o.Items)
            .FirstOrDefaultAsync(o => o.IdempotencyKey == idempotencyKey, ct);

    public async Task<(IReadOnlyList<Order> Items, int TotalCount)> GetPagedForUserAsync(
        int userId, int page, int pageSize, CancellationToken ct = default)
    {
        var query = _db.Orders.AsNoTracking().Include(o => o.Items).Where(o => o.UserId == userId);

        var total = await query.CountAsync(ct);
        var items = await query
            .OrderByDescending(o => o.CreatedAtUtc)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(ct);

        return (items, total);
    }

    public async Task AddAsync(Order order, CancellationToken ct = default) =>
        await _db.Orders.AddAsync(order, ct);
}
