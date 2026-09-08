using System.Security.Claims;
using EcommerceSystem.Application.Features.Orders.Commands;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace Ecommerce.Controllers;

[ApiController]
[Route("api/v1/[controller]")]
[Authorize]
[EnableRateLimiting("fixed")]
public class OrdersController : ControllerBase
{
    private readonly IMediator _mediator;

    public OrdersController(IMediator mediator) => _mediator = mediator;

    // Idempotency-Key header is required per the requirements doc - stops a retried/timed-out
    // checkout request from creating a second order.
    [HttpPost]
    public async Task<IActionResult> PlaceOrder([FromHeader(Name = "Idempotency-Key")] string idempotencyKey, CancellationToken ct)
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? User.FindFirstValue("sub")
            ?? throw new UnauthorizedAccessException());

        var result = await _mediator.Send(new PlaceOrderCommand(userId, idempotencyKey), ct);
        return Ok(result);
    }
}
