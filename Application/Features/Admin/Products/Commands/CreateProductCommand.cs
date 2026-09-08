using EcommerceSystem.Application.DTOs;
using MediatR;

namespace EcommerceSystem.Application.Features.Admin.Products.Commands;

public sealed record CreateProductCommand(int AdminUserId, AdminProductDto Product) : IRequest<AdminProductDto>;