using EcommerceSystem.Application.Features.Admin.Products.Commands;
using EcommerceSystem.Application.Interfaces;
using EcommerceSystem.Domain.Exceptions;
using EcommerceSystem.Domain.Interfaces;
using MediatR;

namespace EcommerceSystem.Application.Features.Admin.Products.Handlers;

public sealed class DeleteProductHandler : IRequestHandler<DeleteProductCommand, Unit>
{
    private readonly IProductRepository _productRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IAuditLogger _auditLogger;
    private readonly ICacheService _cache;

    public DeleteProductHandler(
        IProductRepository productRepository, IUnitOfWork unitOfWork, IAuditLogger auditLogger, ICacheService cache)
    {
        _productRepository = productRepository;
        _unitOfWork = unitOfWork;
        _auditLogger = auditLogger;
        _cache = cache;
    }

    public async Task<Unit> Handle(DeleteProductCommand request, CancellationToken ct)
    {
        var product = await _productRepository.GetByIdAsync(request.ProductId, ct)
            ?? throw new DomainException($"Product {request.ProductId} not found.");

        // Soft delete: an OrderItem may still reference this product's id for
        // historical orders, so we deactivate rather than hard-delete the row.
        product.IsActive = false;
        _productRepository.Update(product);
        await _unitOfWork.SaveChangesAsync(ct);

        await _auditLogger.LogAsync(request.AdminUserId, "ProductDeleted", "Product", product.Id, ct: ct);
        await _cache.RemoveByPrefixAsync("products:", ct);

        return Unit.Value;
    }
}