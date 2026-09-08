using System.Text.Json;
using EcommerceSystem.Application.Interfaces;
using StackExchange.Redis;

namespace Infrastructure.Caching;

// Used for the one required cached endpoint (GET /api/v1/products): read-heavy, changes
// rarely, so a distributed cache in front of SQL Server cuts DB load without a
// cache-invalidation nightmare (short TTL instead of explicit invalidation everywhere).
public class RedisCacheService : ICacheService
{
    private readonly IConnectionMultiplexer _redis;

    public RedisCacheService(IConnectionMultiplexer redis) => _redis = redis;

    private IDatabase Db => _redis.GetDatabase();

    public async Task<T?> GetAsync<T>(string key, CancellationToken ct = default)
    {
        var value = await Db.StringGetAsync(key);
        if (value.IsNullOrEmpty) return default;
        return JsonSerializer.Deserialize<T>((string)value!);
    }

    public async Task SetAsync<T>(string key, T value, TimeSpan expiry, CancellationToken ct = default) =>
        await Db.StringSetAsync(key, JsonSerializer.Serialize(value), expiry);

    public async Task RemoveAsync(string key, CancellationToken ct = default) =>
        await Db.KeyDeleteAsync(key);

    public async Task RemoveByPrefixAsync(string prefix, CancellationToken ct = default)
    {
        // Redis has no "delete by prefix" command - SCAN (not KEYS, which blocks the whole
        // server on a large keyspace) finds matching keys in batches, then delete each batch.
        var endpoints = _redis.GetEndPoints();
        var server = _redis.GetServer(endpoints.First());

        var keys = server.Keys(pattern: $"{prefix}*").ToArray();
        if (keys.Length > 0)
            await Db.KeyDeleteAsync(keys);
    }
}
