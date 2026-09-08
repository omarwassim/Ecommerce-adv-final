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

    /// <summary>Count of this user's orders that ever reached Confirmed - used to decide
    /// FirstPurchase discount eligibility ("is this their first completed order?").</summary>
    Task<int> GetCompletedOrderCountAsync(int userId, CancellationToken ct = default);

    /// <summary>Units sold and revenue per product, summed across every OrderItem that ever
    /// belonged to a Confirmed order. Backs GetSalesAnalyticsHandler's most-sold/distribution
    /// view - Confirmed only, so a failed/compensated order never inflates the numbers.</summary>
    Task<IReadOnlyList<ProductSalesSummary>> GetProductSalesSummaryAsync(CancellationToken ct = default);
}

public record ProductSalesSummary(int ProductId, string ProductName, int UnitsSold, decimal Revenue);