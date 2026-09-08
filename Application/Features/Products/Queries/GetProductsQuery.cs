using EcommerceSystem.Application.DTOs;
using MediatR;

namespace EcommerceSystem.Application.Features.Products.Queries;

public sealed record GetProductsQuery(
    int Page = 1,
    int PageSize = 20,
    string? Category = null,
    string? Search = null
) : IRequest<PagedResult<ProductDto>>;