using EcommerceSystem.Application.DTOs;
using EcommerceSystem.Application.Features.Products.Queries;
using EcommerceSystem.Application.Interfaces;
using EcommerceSystem.Domain.Interfaces;
using Mapster;
using MediatR;

namespace EcommerceSystem.Application.Features.Products.Handlers;

/// <summary>
/// The one required cached endpoint. Product listing is read-heavy and
/// changes rarely compared to how often it's read, which is exactly the
/// read pattern a cache-aside strategy fits: check cache, miss -> hit DB,
/// populate cache, short TTL so stock/price edits show up within a minute
/// instead of needing manual invalidation everywhere a product is touched.
/// </summary>
public sealed class GetProductsHandler : IRequestHandler<GetProductsQuery, PagedResult<ProductDto>>
{
    private readonly IProductRepository _productRepository;
    private readonly ICacheService _cache;

    public GetProductsHandler(IProductRepository productRepository, ICacheService cache)
    {
        _productRepository = productRepository;
        _cache = cache;
    }

    public async Task<PagedResult<ProductDto>> Handle(GetProductsQuery request, CancellationToken ct)
    {
        var cacheKey = $"products:p{request.Page}:s{request.PageSize}:c{request.Category ?? "all"}:q{request.Search ?? "none"}";

        var cached = await _cache.GetAsync<PagedResult<ProductDto>>(cacheKey, ct);
        if (cached is not null)
            return cached;

        var (items, totalCount) = await _productRepository.GetPagedAsync(
            request.Page, request.PageSize, request.Category, request.Search, ct);

        var result = new PagedResult<ProductDto>
        {
            Items = items.Adapt<List<ProductDto>>(),
            Page = request.Page,
            PageSize = request.PageSize,
            TotalCount = totalCount
        };

        await _cache.SetAsync(cacheKey, result, TimeSpan.FromMinutes(2), ct);
        return result;
    }
}