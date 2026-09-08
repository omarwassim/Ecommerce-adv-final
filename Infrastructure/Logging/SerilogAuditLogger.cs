using EcommerceSystem.Application.Interfaces;
using EcommerceSystem.Domain.Entities;
using EcommerceSystem.Domain.Interfaces;
using Serilog;

namespace Infrastructure.Logging;

// Every admin write (create/update/delete product, set discount) calls this after a
// successful DB change. Does two things per the v2 spec: writes a durable AuditLog row
// (queryable later for the admin dashboard) AND emits a structured Serilog line tagged
// "AuditAction" (searchable in the log sink without touching the DB). If either write
// fails, this throws - an admin action with no audit trail is a bug, not something to
// swallow, per the team's own rule.
//
// Same masking discipline as everywhere else: log the action/entity id, never the raw
// request body - "details" is expected to be a short, deliberately-chosen JSON snapshot
// (see AuditLog.cs's own doc comment), not a full payload dump.
public class SerilogAuditLogger : IAuditLogger
{
    private readonly IAuditLogRepository _auditLogRepository;
    private readonly IUnitOfWork _unitOfWork;

    public SerilogAuditLogger(IAuditLogRepository auditLogRepository, IUnitOfWork unitOfWork)
    {
        _auditLogRepository = auditLogRepository;
        _unitOfWork = unitOfWork;
    }

    public async Task LogAsync(int adminUserId, string action, string entityType, int entityId, string? details = null, CancellationToken ct = default)
    {
        var log = new AuditLog
        {
            AdminUserId = adminUserId,
            Action = action,
            EntityType = entityType,
            EntityId = entityId,
            Details = details,
            CreatedAtUtc = DateTime.UtcNow
        };

        await _auditLogRepository.AddAsync(log, ct);
        await _unitOfWork.SaveChangesAsync(ct);

        Log.ForContext("AuditAction", action)
           .Information("Admin {AdminUserId} performed {AuditAction} on {EntityType} {EntityId}",
               adminUserId, action, entityType, entityId);
    }
}
