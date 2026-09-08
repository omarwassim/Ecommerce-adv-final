using System;
using System.Collections.Generic;
using System.Text;

namespace EcommerceSystem.Domain.Interfaces;

/// <summary>
/// Wraps SaveChanges + an explicit SQL Server transaction so PlaceOrderHandler
/// can group "reserve stock + create order + create payment row" into one
/// atomic unit. Implemented in Infrastructure with EF Core's
/// DbContext.Database.BeginTransactionAsync.
/// </summary>
public interface IUnitOfWork
{
    Task<int> SaveChangesAsync(CancellationToken ct = default);

    Task BeginTransactionAsync(CancellationToken ct = default);
    Task CommitTransactionAsync(CancellationToken ct = default);
    Task RollbackTransactionAsync(CancellationToken ct = default);
}
