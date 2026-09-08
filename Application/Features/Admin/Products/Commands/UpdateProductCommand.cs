using EcommerceSystem.Application.DTOs;
using MediatR;

namespace EcommerceSystem.Application.Features.Admin.Products.Commands;

public sealed record UpdateProductCommand(int AdminUserId, int ProductId, AdminProductDto Product) : IRequest<AdminProductDto>;