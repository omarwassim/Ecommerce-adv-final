namespace EcommerceSystem.Application.DTOs;

public sealed class AuditLogDto
{
    public int Id { get; set; }
    public int AdminUserId { get; set; }
    public string Action { get; set; } = default!;
    public string EntityType { get; set; } = default!;
    public int EntityId { get; set; }
    public string? Details { get; set; }
    public DateTime CreatedAtUtc { get; set; }
}