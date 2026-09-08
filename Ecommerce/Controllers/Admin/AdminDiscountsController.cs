using System.Security.Claims;
using EcommerceSystem.Application.Features.Admin.Discounts.Commands;
using Infrastructure.Auth;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Ecommerce.Controllers.Admin;

[ApiController]
[Route("api/v1/admin/discounts")]
[Authorize(Policy = AdminOnlyPolicy.Name)]
public class AdminDiscountsController : ControllerBase
{
    private readonly IMediator _mediator;

    public AdminDiscountsController(IMediator mediator) => _mediator = mediator;

    private int AdminUserId => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)
        ?? User.FindFirstValue("sub")
        ?? throw new UnauthorizedAccessException());

    public record ProductDiscountRequest(int ProductId, decimal DiscountPercentage, int DurationHours);
    public record StorewideDiscountRequest(decimal DiscountPercentage, int DurationHours);

    [HttpPost("product")]
    public async Task<IActionResult> SetProductDiscount([FromBody] ProductDiscountRequest request, CancellationToken ct)
    {
        await _mediator.Send(new SetProductDiscountCommand(AdminUserId, request.ProductId, request.DiscountPercentage, request.DurationHours), ct);
        return NoContent();
    }

    [HttpPost("storewide")]
    public async Task<IActionResult> SetStorewideDiscount([FromBody] StorewideDiscountRequest request, CancellationToken ct)
    {
        await _mediator.Send(new SetStorewideDiscountCommand(AdminUserId, request.DiscountPercentage, request.DurationHours), ct);
        return NoContent();
    }
}
