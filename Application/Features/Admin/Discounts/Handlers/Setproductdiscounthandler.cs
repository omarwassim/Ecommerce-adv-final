using EcommerceSystem.Application.Features.Admin.Discounts.Commands;
using EcommerceSystem.Application.Interfaces;
using EcommerceSystem.Domain.Exceptions;
using EcommerceSystem.Domain.Interfaces;
using MediatR;

namespace EcommerceSystem.Application.Features.Admin.Discounts.Handlers;

public sealed class SetProductDiscountHandler : IRequestHandler<SetProductDiscountCommand, Unit>
{
    private readonly IProductRepository _productRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IAuditLogger _auditLogger;
    private readonly ICacheService _cache;

    public SetProductDiscountHandler(
        IProductRepository productRepository, IUnitOfWork unitOfWork, IAuditLogger auditLogger, ICacheService cache)
    {
        _productRepository = productRepository;
        _unitOfWork = unitOfWork;
        _auditLogger = auditLogger;
        _cache = cache;
    }

    public async Task<Unit> Handle(SetProductDiscountCommand request, CancellationToken ct)
    {
        var product = await _productRepository.GetByIdAsync(request.ProductId, ct)
            ?? throw new DomainException($"Product {request.ProductId} not found.");

        var now = DateTime.UtcNow;
        product.SetDiscount(request.DiscountPercentage, now, now.AddHours(request.DurationHours));

        _productRepository.Update(product);
        await _unitOfWork.SaveChangesAsync(ct);

        await _auditLogger.LogAsync(
            request.AdminUserId, "ProductDiscountSet", "Product", product.Id,
            details: $"{{\"percentage\":{request.DiscountPercentage},\"durationHours\":{request.DurationHours}}}", ct: ct);

        await _cache.RemoveByPrefixAsync("products:", ct);
        return Unit.Value;
    }
}