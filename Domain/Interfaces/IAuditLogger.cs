namespace EcommerceSystem.Application.Interfaces;

/// <summary>
/// Implemented by Reem's SerilogAuditLogger in Infrastructure. Every admin
/// command calls this after a successful write. If this throws, the whole
/// command fails — an admin action with no audit trail is a bug, not
/// something to swallow and move past.
/// </summary>
public interface IAuditLogger
{
    Task LogAsync(int adminUserId, string action, string entityType, int entityId, string? details = null, CancellationToken ct = default);
}