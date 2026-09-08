using Abp.Auditing;
using EcommerceSystem.Domain.Entities;

namespace EcommerceSystem.Domain.Interfaces;

public interface IAuditLogRepository
{
    Task AddAsync(AuditLog log, CancellationToken ct = default);

    Task<(IReadOnlyList<AuditLog> Items, int TotalCount)> GetPagedAsync(
        int page, int pageSize, int? adminUserId = null, string? entityType = null, CancellationToken ct = default);
}