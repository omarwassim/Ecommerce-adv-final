using EcommerceSystem.Application.Features.Admin.Analytics.Queries;
using Infrastructure.Auth;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Ecommerce.Controllers.Admin;

[ApiController]
[Route("api/v1/admin/audit-log")]
[Authorize(Policy = AdminOnlyPolicy.Name)]
public class AdminAuditLogController : ControllerBase
{
    private readonly IMediator _mediator;

    public AdminAuditLogController(IMediator mediator) => _mediator = mediator;

    [HttpGet]
    public async Task<IActionResult> Get(
        [FromQuery] int page = 1, [FromQuery] int pageSize = 20,
        [FromQuery] int? adminUserId = null, [FromQuery] string? entityType = null,
        CancellationToken ct = default)
    {
        var result = await _mediator.Send(new GetAuditLogsQuery(page, pageSize, adminUserId, entityType), ct);
        return Ok(result);
    }
}
