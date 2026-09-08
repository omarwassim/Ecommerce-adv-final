namespace EcommerceSystem.Application.Interfaces;

/// <summary>
/// Implemented with Redis in Infrastructure. Application only knows "get,
/// set, remove" — it never references StackExchange.Redis directly.
/// </summary>
public interface ICacheService
{
    Task<T?> GetAsync<T>(string key, CancellationToken ct = default);
    Task SetAsync<T>(string key, T value, TimeSpan expiry, CancellationToken ct = default);
    Task RemoveAsync(string key, CancellationToken ct = default);

    /// <summary>Removes every cached key starting with the given prefix - e.g.
    /// RemoveByPrefixAsync("products:") clears every cached page/filter combo at once after
    /// an admin write, instead of trying to guess every specific key that might be stale.</summary>
    Task RemoveByPrefixAsync(string prefix, CancellationToken ct = default);
}