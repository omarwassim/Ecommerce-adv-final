using EcommerceSystem.Application.DTOs;
using MediatR;

namespace EcommerceSystem.Application.Features.Orders.Commands;

/// <summary>
/// IdempotencyKey comes from the client's "Idempotency-Key" request header
/// (WebApi reads it and puts it on the command — Application never touches
/// HttpContext directly).
/// </summary>
public sealed record PlaceOrderCommand(int UserId, string IdempotencyKey) : IRequest<OrderDto>;