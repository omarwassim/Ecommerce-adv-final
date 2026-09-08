using System.Security.Claims;
using EcommerceSystem.Application.DTOs;
using EcommerceSystem.Application.Features.Admin.Products.Commands;
using Infrastructure.Auth;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Ecommerce.Controllers.Admin;

[ApiController]
[Route("api/v1/admin/products")]
[Authorize(Policy = AdminOnlyPolicy.Name)]
public class AdminProductsController : ControllerBase
{
    private readonly IMediator _mediator;

    public AdminProductsController(IMediator mediator) => _mediator = mediator;

    private int AdminUserId => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)
        ?? User.FindFirstValue("sub")
        ?? throw new UnauthorizedAccessException());

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] AdminProductDto product, CancellationToken ct)
    {
        var result = await _mediator.Send(new CreateProductCommand(AdminUserId, product), ct);
        return Ok(result);
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] AdminProductDto product, CancellationToken ct)
    {
        var result = await _mediator.Send(new UpdateProductCommand(AdminUserId, id, product), ct);
        return Ok(result);
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id, CancellationToken ct)
    {
        await _mediator.Send(new DeleteProductCommand(AdminUserId, id), ct);
        return NoContent();
    }
}
