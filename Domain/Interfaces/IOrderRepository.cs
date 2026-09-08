using System;
using System.Collections.Generic;
using System.Text;
using EcommerceSystem.Domain.Entities;

namespace EcommerceSystem.Domain.Interfaces;

public interface IOrderRepository
{
    Task<Order?> GetByIdAsync(int id, CancellationToken ct = default);

    /// <summary>
    /// Looks up an existing order by idempotency key. Called first inside
    /// PlaceOrderHandler — if this returns non-null, the handler returns the
    /// existing order instead of creating a new one.
    /// </summary>
    Task<Order?> GetByIdempotencyKeyAsync(string idempotencyKey, CancellationToken ct = default);

    Task<(IReadOnlyList<Order> Items, int TotalCount)> GetPagedForUserAsync(
        int userId, int page, int pageSize, CancellationToken ct = default);

    Task AddAsync(Order order, CancellationToken ct = default);
}