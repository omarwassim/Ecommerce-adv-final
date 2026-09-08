namespace EcommerceSystem.Domain.Entities;

/// <summary>
/// One row per admin mutation. Written by IAuditLogger (Reem's
/// SerilogAuditLogger) right after a successful admin command — never
/// speculative, never for reads.
/// </summary>
public class AuditLog
{
    public int Id { get; set; }
    public int AdminUserId { get; set; }

    /// <summary>e.g. "ProductCreated", "ProductUpdated", "ProductDeleted", "ProductDiscountSet", "StorewideDiscountSet".</summary>
    public string Action { get; set; } = default!;

    /// <summary>e.g. "Product".</summary>
    public string EntityType { get; set; } = default!;
    public int EntityId { get; set; }

    /// <summary>Structured JSON snapshot of what changed (old/new values). Never raw request bodies — see masking rule.</summary>
    public string? Details { get; set; }

    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
}