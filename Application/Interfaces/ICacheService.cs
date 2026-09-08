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
}