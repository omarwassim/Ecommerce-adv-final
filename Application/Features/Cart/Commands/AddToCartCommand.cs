using EcommerceSystem.Application.DTOs;
using MediatR;

namespace EcommerceSystem.Application.Features.Cart.Commands;

public sealed record AddToCartCommand(int UserId, int ProductId, int Quantity) : IRequest<CartDto>;