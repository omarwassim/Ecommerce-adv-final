using EcommerceSystem.Domain.Entities;
using EcommerceSystem.Domain.ValueObjects;
using FluentAssertions;
using Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Xunit;

namespace EcommerceSystem.IntegrationTests.Orders;

/// <summary>
/// Tests the actual guarantee behind checkout idempotency: the unique index on
/// Order.IdempotencyKey (OrderConfiguration.cs). PlaceOrderHandler's Redis/DB lookup is the
/// fast path that avoids hitting this in the common case, but THIS constraint is what
/// actually makes a duplicate order impossible even if the fast-path check is somehow
/// bypassed (a race between two nearly-simultaneous retries, a cache miss, etc.).
/// </summary>
public class OrderIdempotencyTests : IAsyncLifetime
{
    private string _connectionString = default!;
    private readonly string _testKey = $"idempotency-test-{Guid.NewGuid()}";
    private int _userId;

    public async Task InitializeAsync()
    {
        var config = new ConfigurationBuilder()
            .AddJsonFile("appsettings.test.json")
            .Build();
        _connectionString = config.GetConnectionString("DefaultConnection")!;

        using var db = CreateContext();
        var user = new User
        {
            Email = $"idempotency-test-{Guid.NewGuid()}@example.com",
            PasswordHash = "not-a-real-hash",
            FullName = "Idempotency Test User"
        };
        db.Users.Add(user);
        await db.SaveChangesAsync();
        _userId = user.Id;
    }

    public async Task DisposeAsync()
    {
        using var db = CreateContext();
        var orders = db.Orders.Where(o => o.IdempotencyKey == _testKey);
        db.Orders.RemoveRange(orders);
        var user = await db.Users.FindAsync(_userId);
        if (user is not null) db.Users.Remove(user);
        await db.SaveChangesAsync();
    }

    private AppDbContext CreateContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>().UseSqlServer(_connectionString).Options;
        return new AppDbContext(options);
    }

    [Fact]
    public async Task SecondOrder_WithSameIdempotencyKey_IsRejectedByUniqueConstraint()
    {
        using var db1 = CreateContext();
        var firstOrder = new Order
        {
            UserId = _userId,
            IdempotencyKey = _testKey,
            Total = new Money(10.00m)
        };
        db1.Orders.Add(firstOrder);
        await db1.SaveChangesAsync(); // first insert succeeds

        using var db2 = CreateContext();
        var duplicateOrder = new Order
        {
            UserId = _userId,
            IdempotencyKey = _testKey, // same key - simulates a retried checkout request
            Total = new Money(10.00m)
        };
        db2.Orders.Add(duplicateOrder);

        // This must throw - the unique index on IdempotencyKey is what actually stops a
        // duplicate order, independent of whether the Application-layer fast-path check ran.
        var act = async () => await db2.SaveChangesAsync();
        await act.Should().ThrowAsync<DbUpdateException>(
            "the unique index on Order.IdempotencyKey must reject a second order with the same key");

        using var verifyDb = CreateContext();
        var count = await verifyDb.Orders.CountAsync(o => o.IdempotencyKey == _testKey);
        count.Should().Be(1, "exactly one order should exist for this idempotency key, never two");
    }
}
