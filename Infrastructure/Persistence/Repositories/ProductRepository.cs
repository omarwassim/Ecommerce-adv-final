using EcommerceSystem.Domain.Entities;
using EcommerceSystem.Domain.Interfaces;
using Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Persistence.Repositories;

public class ProductRepository : IProductRepository
{
    private readonly AppDbContext _db;

    public ProductRepository(AppDbContext db) => _db = db;

    public Task<Product?> GetByIdAsync(int id, CancellationToken ct = default) =>
        _db.Products.FirstOrDefaultAsync(p => p.Id == id, ct);

    public async Task<(IReadOnlyList<Product> Items, int TotalCount)> GetPagedAsync(
        int page, int pageSize, string? category = null, string? search = null, CancellationToken ct = default)
    {
        var query = _db.Products.AsNoTracking().Where(p => p.IsActive).AsQueryable();

        if (!string.IsNullOrWhiteSpace(category))
            query = query.Where(p => p.Category == category);

        if (!string.IsNullOrWhiteSpace(search))
            // SQL Server's default collation is already case-insensitive.
            query = query.Where(p => EF.Functions.Like(p.Name, $"%{search}%"));

        var total = await query.CountAsync(ct);
        var items = await query
            .OrderBy(p => p.DisplayOrder)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(ct);

        return (items, total);
    }

    public async Task<Product?> GetByIdForUpdateAsync(int id, CancellationToken ct = default)
    {
        // Pessimistic row lock (SQL Server query hint) so two concurrent checkouts against the
        // same product can't both read the same stock count and both pass ReserveStock().
        // Must be called inside an active transaction (PlaceOrderHandler does this) - the lock
        // is held until that transaction commits or rolls back.
        var products = await _db.Products
            .FromSqlInterpolated($"SELECT * FROM Products WITH (UPDLOCK, ROWLOCK) WHERE Id = {id}")
            .ToListAsync(ct);

        return products.FirstOrDefault();
    }

    public void Update(Product product) => _db.Products.Update(product);

    public async Task AddAsync(Product product, CancellationToken ct = default) =>
        await _db.Products.AddAsync(product, ct);

    public async Task<int> GetMaxDisplayOrderAsync(CancellationToken ct = default) =>
        await _db.Products.AnyAsync(ct) ? await _db.Products.MaxAsync(p => p.DisplayOrder, ct) : 0;

    public async Task DeleteAsync(int id, CancellationToken ct = default)
    {
        var product = await GetByIdAsync(id, ct);
        if (product is not null)
            _db.Products.Remove(product);
    }

    public Task<List<Product>> GetAllActiveAsync(CancellationToken ct = default) =>
        _db.Products.Where(p => p.IsActive).ToListAsync(ct);
}
