using EcommerceSystem.Application.Features.Admin.Discounts.Commands;
using EcommerceSystem.Application.Interfaces;
using EcommerceSystem.Domain.Interfaces;
using MediatR;

namespace EcommerceSystem.Application.Features.Admin.Discounts.Handlers;

public sealed class SetStorewideDiscountHandler : IRequestHandler<SetStorewideDiscountCommand, Unit>
{
    private readonly IProductRepository _productRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IAuditLogger _auditLogger;
    private readonly ICacheService _cache;

    public SetStorewideDiscountHandler(
        IProductRepository productRepository, IUnitOfWork unitOfWork, IAuditLogger auditLogger, ICacheService cache)
    {
        _productRepository = productRepository;
        _unitOfWork = unitOfWork;
        _auditLogger = auditLogger;
        _cache = cache;
    }

    public async Task<Unit> Handle(SetStorewideDiscountCommand request, CancellationToken ct)
    {
        var now = DateTime.UtcNow;
        var endsAt = now.AddHours(request.DurationHours);

        // Bulk-fetches every active product and applies the same window to each.
        // Fine at this scale (per the brief, production-grade scaling is out of
        // scope); a large catalog would want a set-based UPDATE instead.
        var allActive = await _productRepository.GetAllActiveAsync(ct);
        foreach (var product in allActive)
        {
            product.SetDiscount(request.DiscountPercentage, now, endsAt);
            _productRepository.Update(product);
        }

        await _unitOfWork.SaveChangesAsync(ct);

        await _auditLogger.LogAsync(
            request.AdminUserId, "StorewideDiscountSet", "Product", entityId: 0,
            details: $"{{\"percentage\":{request.DiscountPercentage},\"durationHours\":{request.DurationHours},\"affectedCount\":{allActive.Count}}}",
            ct: ct);

        await _cache.RemoveByPrefixAsync("products:", ct);
        return Unit.Value;
    }
}