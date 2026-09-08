using EcommerceSystem.Domain.Entities;
using EcommerceSystem.Domain.Enums;
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

    public Task<int> GetCompletedOrderCountAsync(int userId, CancellationToken ct = default) =>
        _db.Orders.CountAsync(o => o.UserId == userId && o.Status == OrderStatus.Confirmed, ct);

    public async Task<IReadOnlyList<ProductSalesSummary>> GetProductSalesSummaryAsync(CancellationToken ct = default)
    {
        var confirmedOrderIds = _db.Orders
            .Where(o => o.Status == OrderStatus.Confirmed)
            .Select(o => o.Id);

        var summary = await _db.OrderItems
            .Where(oi => confirmedOrderIds.Contains(oi.OrderId))
            .GroupBy(oi => new { oi.ProductId, oi.ProductNameSnapshot })
            .Select(g => new
            {
                g.Key.ProductId,
                g.Key.ProductNameSnapshot,
                UnitsSold = g.Sum(oi => oi.Quantity),
                // LineTotal is computed in C# (Money math), not translatable to SQL - sum the
                // raw stored columns instead and apply the discount here.
                GrossAmount = g.Sum(oi => oi.UnitPriceAtPurchase.Amount * oi.Quantity),
                AvgDiscount = g.Average(oi => oi.DiscountPercentageAtPurchase)
            })
            .ToListAsync(ct);

        return summary
            .Select(s => new ProductSalesSummary(
                s.ProductId,
                s.ProductNameSnapshot,
                s.UnitsSold,
                Math.Round(s.GrossAmount * (1 - s.AvgDiscount / 100m), 2)))
            .ToList();
    }
}
