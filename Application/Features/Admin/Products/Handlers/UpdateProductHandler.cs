using EcommerceSystem.Application.DTOs;
using EcommerceSystem.Application.Features.Admin.Products.Commands;
using EcommerceSystem.Application.Interfaces;
using EcommerceSystem.Domain.Exceptions;
using EcommerceSystem.Domain.Interfaces;
using EcommerceSystem.Domain.ValueObjects;
using Mapster;
using MediatR;

namespace EcommerceSystem.Application.Features.Admin.Products.Handlers;

public sealed class UpdateProductHandler : IRequestHandler<UpdateProductCommand, AdminProductDto>
{
    private readonly IProductRepository _productRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IAuditLogger _auditLogger;
    private readonly ICacheService _cache;

    public UpdateProductHandler(
        IProductRepository productRepository, IUnitOfWork unitOfWork, IAuditLogger auditLogger, ICacheService cache)
    {
        _productRepository = productRepository;
        _unitOfWork = unitOfWork;
        _auditLogger = auditLogger;
        _cache = cache;
    }

    public async Task<AdminProductDto> Handle(UpdateProductCommand request, CancellationToken ct)
    {
        var product = await _productRepository.GetByIdAsync(request.ProductId, ct)
            ?? throw new DomainException($"Product {request.ProductId} not found.");

        var dto = request.Product;

        product.Name = dto.Name;
        product.Description = dto.Description;
        product.PhotoUrl = dto.PhotoUrl;
        product.Price = new Money(dto.Price);
        product.StockQuantity = dto.Quantity;
        product.DiscountPercentage = dto.DiscountPercentage;
        product.DiscountStartsAtUtc = dto.DiscountStartsAtUtc;
        product.DiscountEndsAtUtc = dto.DiscountEndsAtUtc;

        // Only touch DisplayOrder if the admin actually supplied one — leaving
        // it null on an edit means "don't change the position".
        if (dto.DisplayOrder.HasValue)
            product.DisplayOrder = dto.DisplayOrder.Value;

        _productRepository.Update(product);
        await _unitOfWork.SaveChangesAsync(ct);

        await _auditLogger.LogAsync(request.AdminUserId, "ProductUpdated", "Product", product.Id, ct: ct);
        await _cache.RemoveByPrefixAsync("products:", ct);

        return product.Adapt<AdminProductDto>();
    }
}