using System.Text.Json;
using EcommerceSystem.Application.DTOs;
using EcommerceSystem.Application.Interfaces;
using StackExchange.Redis;

namespace Infrastructure.Caching;

// Fast path Omar's PlaceOrderHandler checks before touching SQL Server at all. This is
// purely a latency/load optimization for an obvious repeat request - the actual guarantee
// against duplicate orders is the unique index on Order.IdempotencyKey (Reem's
// OrderConfiguration), which still catches a duplicate even on a cache miss/eviction.
public class RedisIdempotencyStore : IIdempotencyStore
{
    private readonly IConnectionMultiplexer _redis;
    private static string Key(string idempotencyKey) => $"idempotency:order:{idempotencyKey}";

    public RedisIdempotencyStore(IConnectionMultiplexer redis) => _redis = redis;

    private IDatabase Db => _redis.GetDatabase();

    public async Task<OrderDto?> TryGetCachedResultAsync(string idempotencyKey, CancellationToken ct = default)
    {
        var value = await Db.StringGetAsync(Key(idempotencyKey));
        if (value.IsNullOrEmpty) return null;
        return JsonSerializer.Deserialize<OrderDto>((string)value!);
    }

    public async Task StoreResultAsync(string idempotencyKey, OrderDto result, TimeSpan ttl, CancellationToken ct = default) =>
        await Db.StringSetAsync(Key(idempotencyKey), JsonSerializer.Serialize(result), ttl);
}
