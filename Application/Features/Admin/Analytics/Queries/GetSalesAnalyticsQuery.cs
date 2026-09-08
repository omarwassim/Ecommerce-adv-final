using EcommerceSystem.Application.DTOs;
using EcommerceSystem.Application.Features.Admin.Analytics.Queries;
using EcommerceSystem.Application.Interfaces;
using EcommerceSystem.Domain.Interfaces;
using MediatR;

namespace EcommerceSystem.Application.Features.Admin.Analytics.Handlers;

/// <summary>
/// Computed from Order/OrderItem directly — no dedicated stats table.
/// Cached with a short TTL since exact-to-the-second numbers aren't the
/// point of an admin dashboard chart.
/// </summary>
public sealed class GetSalesAnalyticsHandler : IRequestHandler<GetSalesAnalyticsQuery, SalesAnalyticsDto>
{
    private readonly IOrderRepository _orderRepository;
    private readonly ICacheService _cache;

    public GetSalesAnalyticsHandler(IOrderRepository orderRepository, ICacheService cache)
    {
        _orderRepository = orderRepository;
        _cache = cache;
    }

    public async Task<SalesAnalyticsDto> Handle(GetSalesAnalyticsQuery request, CancellationToken ct)
    {
        var cacheKey = $"analytics:sales:top{request.TopN?.ToString() ?? "all"}";
        var cached = await _cache.GetAsync<SalesAnalyticsDto>(cacheKey, ct);
        if (cached is not null)
            return cached;

        var raw = await _orderRepository.GetProductSalesSummaryAsync(ct);

        var totalUnits = raw.Sum(r => r.UnitsSold);

        var items = raw
            .Select(r => new ProductSalesDto
            {
                ProductId = r.ProductId,
                ProductName = r.ProductName,
                UnitsSold = r.UnitsSold,
                RevenueGenerated = r.Revenue,
                SalesDistributionPercentage = totalUnits == 0
                    ? 0
                    : Math.Round(r.UnitsSold * 100m / totalUnits, 2)
            })
            .OrderByDescending(i => i.UnitsSold)
            .ToList();

        if (request.TopN.HasValue)
            items = items.Take(request.TopN.Value).ToList();

        var result = new SalesAnalyticsDto { Items = items };

        await _cache.SetAsync(cacheKey, result, TimeSpan.FromMinutes(5), ct);
        return result;
    }
}