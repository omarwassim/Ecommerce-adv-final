using MediatR;

namespace EcommerceSystem.Application.Features.Admin.Products.Commands;

public sealed record DeleteProductCommand(int AdminUserId, int ProductId) : IRequest<Unit>;
