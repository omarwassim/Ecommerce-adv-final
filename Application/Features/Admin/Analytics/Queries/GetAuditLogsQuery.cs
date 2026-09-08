using EcommerceSystem.Application.DTOs;
using MediatR;

namespace EcommerceSystem.Application.Features.Admin.Analytics.Queries;

public sealed record GetAuditLogsQuery(
    int Page = 1, int PageSize = 20, int? AdminUserId = null, string? EntityType = null
) : IRequest<PagedResult<AuditLogDto>>;
