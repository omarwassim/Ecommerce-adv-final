using System;
using System.Collections.Generic;
using System.Text;
using EcommerceSystem.Domain.Entities;

namespace EcommerceSystem.Domain.Interfaces;

public interface IProductRepository
{
    Task<Product?> GetByIdAsync(int id, CancellationToken ct = default);

    /// <summary>Simple offset paging — page/pageSize, matches API design's pagination contract.</summary>
    Task<(IReadOnlyList<Product> Items, int TotalCount)> GetPagedAsync(
        int page, int pageSize, string? category = null, string? search = null, CancellationToken ct = default);

    /// <summary>
    /// Locks the row for update (SELECT ... WITH (UPDLOCK, ROWLOCK) under
    /// SQL Server) so two concurrent checkouts on the same product can't
    /// both read the same stock count and both succeed. Used only inside
    /// PlaceOrderHandler's transaction, never on a plain read.
    /// </summary>
    Task<Product?> GetByIdForUpdateAsync(int id, CancellationToken ct = default);

    void Update(Product product);
}