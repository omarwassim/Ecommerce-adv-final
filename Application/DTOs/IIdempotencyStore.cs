using EcommerceSystem.Application.DTOs;

namespace EcommerceSystem.Application.Interfaces;

/// <summary>
/// Fast-path idempotency check used by PlaceOrderHandler before it even
/// looks at the database. Infrastructure can implement this over Redis
/// (short TTL) — the real guarantee against duplicates is still the unique
/// index on Order.IdempotencyKey in SQL Server; this is just to avoid
/// hitting the DB and re-running validation for an obvious repeat request.
/// </summary>
public interface IIdempotencyStore
{
    Task<OrderDto?> TryGetCachedResultAsync(string idempotencyKey, CancellationToken ct = default);
    Task StoreResultAsync(string idempotencyKey, OrderDto result, TimeSpan ttl, CancellationToken ct = default);
}