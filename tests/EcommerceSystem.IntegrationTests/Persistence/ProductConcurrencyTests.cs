using EcommerceSystem.Domain.Entities;
using EcommerceSystem.Domain.ValueObjects;
using FluentAssertions;
using Infrastructure.Persistence;
using Infrastructure.Persistence.Repositories;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Xunit;

namespace EcommerceSystem.IntegrationTests.Persistence;

/// <summary>
/// The actual concurrency guarantee the team's rules require: two simultaneous checkouts on
/// the same product, with only enough stock for ONE of them, must never both succeed. This
/// runs against a real SQL Server (row locking behavior can't be verified against an
/// in-memory provider - EF's InMemory database has no concept of WITH (UPDLOCK, ROWLOCK)).
///
/// Uses the same local ecommerce_dev database as everything else. This is a deliberate
/// simplification over spinning up an isolated Testcontainers instance - reasonable for the
/// project's timeline, and defensible: the test cleans up its own row and doesn't touch
/// existing data.
/// </summary>
public class ProductConcurrencyTests : IAsyncLifetime
{
    private string _connectionString = default!;
    private int _productId;

    public async Task InitializeAsync()
    {
        var config = new ConfigurationBuilder()
            .AddJsonFile("appsettings.test.json")
            .Build();
        _connectionString = config.GetConnectionString("DefaultConnection")!;

        using var db = CreateContext();
        var product = new Product
        {
            Name = "CONCURRENCY_TEST_PRODUCT",
            Description = "Created and deleted by ProductConcurrencyTests - safe to ignore.",
            Price = new Money(10.00m),
            StockQuantity = 1, // only ONE unit - the whole point of this test
            ImageUrl = "test.png",
            Category = "test",
            PhotoUrl = "test.png"
        };
        db.Products.Add(product);
        await db.SaveChangesAsync();
        _productId = product.Id;
    }

    public async Task DisposeAsync()
    {
        using var db = CreateContext();
        var product = await db.Products.FindAsync(_productId);
        if (product is not null)
        {
            db.Products.Remove(product);
            await db.SaveChangesAsync();
        }
    }

    private AppDbContext CreateContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseSqlServer(_connectionString)
            .Options;
        return new AppDbContext(options);
    }

    [Fact]
    public async Task TwoConcurrentCheckouts_OnLastUnitInStock_OnlyOneSucceeds()
    {
        // Both "checkouts" race to lock and reserve the same single unit of stock.
        var task1 = TryReserveOneUnit();
        var task2 = TryReserveOneUnit();

        var results = await Task.WhenAll(task1, task2);

        // The row lock (WITH (UPDLOCK, ROWLOCK) in ProductRepository.GetByIdForUpdateAsync)
        // means the second transaction can't read the row until the first one commits or
        // rolls back - so exactly one of these must succeed, never both, never neither.
        results.Count(succeeded => succeeded).Should().Be(1,
            "with only 1 unit of stock, exactly one of two concurrent reservations must win");

        using var verifyDb = CreateContext();
        var finalStock = await verifyDb.Products.AsNoTracking()
            .Where(p => p.Id == _productId)
            .Select(p => p.StockQuantity)
            .SingleAsync();

        finalStock.Should().Be(0, "the single unit should be reserved exactly once, never oversold");
    }

    private async Task<bool> TryReserveOneUnit()
    {
        using var db = CreateContext();
        using var transaction = await db.Database.BeginTransactionAsync();
        var repo = new ProductRepository(db);

        try
        {
            var product = await repo.GetByIdForUpdateAsync(_productId);
            if (product is null) return false;

            product.ReserveStock(1); // throws InsufficientStockException if already 0
            repo.Update(product);
            await db.SaveChangesAsync();
            await transaction.CommitAsync();
            return true;
        }
        catch
        {
            await transaction.RollbackAsync();
            return false;
        }
    }
}
