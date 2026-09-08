using EcommerceSystem.Application.DTOs;
using EcommerceSystem.Application.Features.Admin.Analytics.Queries;
using EcommerceSystem.Domain.Interfaces;
using Mapster;
using MediatR;

namespace EcommerceSystem.Application.Features.Admin.Analytics.Handlers;

public sealed class GetAuditLogsHandler : IRequestHandler<GetAuditLogsQuery, PagedResult<AuditLogDto>>
{
    private readonly IAuditLogRepository _auditLogRepository;

    public GetAuditLogsHandler(IAuditLogRepository auditLogRepository) =>
        _auditLogRepository = auditLogRepository;

    public async Task<PagedResult<AuditLogDto>> Handle(GetAuditLogsQuery request, CancellationToken ct)
    {
        var (items, total) = await _auditLogRepository.GetPagedAsync(
            request.Page, request.PageSize, request.AdminUserId, request.EntityType, ct);

        return new PagedResult<AuditLogDto>
        {
            Items = items.Adapt<List<AuditLogDto>>(),
            Page = request.Page,
            PageSize = request.PageSize,
            TotalCount = total
        };
    }
}
