using EcommerceSystem.Application.Features.Admin.Analytics.Queries;
using Infrastructure.Auth;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Ecommerce.Controllers.Admin;

[ApiController]
[Route("api/v1/admin/analytics")]
[Authorize(Policy = AdminOnlyPolicy.Name)]
public class AdminAnalyticsController : ControllerBase
{
    private readonly IMediator _mediator;

    public AdminAnalyticsController(IMediator mediator) => _mediator = mediator;

    [HttpGet("sales")]
    public async Task<IActionResult> GetSales([FromQuery] int? topN, CancellationToken ct)
    {
        var result = await _mediator.Send(new GetSalesAnalyticsQuery(topN), ct);
        return Ok(result);
    }
}
