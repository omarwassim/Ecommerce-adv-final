using EcommerceSystem.Application.DTOs;
using EcommerceSystem.Application.Features.Admin.Products.Commands;
using EcommerceSystem.Application.Interfaces;
using EcommerceSystem.Domain.Entities;
using EcommerceSystem.Domain.Interfaces;
using EcommerceSystem.Domain.ValueObjects;
using Mapster;
using MediatR;

namespace EcommerceSystem.Application.Features.Admin.Products.Handlers;

public sealed class CreateProductHandler : IRequestHandler<CreateProductCommand, AdminProductDto>
{
    private readonly IProductRepository _productRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IAuditLogger _auditLogger;
    private readonly ICacheService _cache;

    public CreateProductHandler(
        IProductRepository productRepository, IUnitOfWork unitOfWork, IAuditLogger auditLogger, ICacheService cache)
    {
        _productRepository = productRepository;
        _unitOfWork = unitOfWork;
        _auditLogger = auditLogger;
        _cache = cache;
    }

    public async Task<AdminProductDto> Handle(CreateProductCommand request, CancellationToken ct)
    {
        var dto = request.Product;

        // DisplayOrder auto-increment: if the admin left it blank, put it last.
        var displayOrder = dto.DisplayOrder ?? await _productRepository.GetMaxDisplayOrderAsync(ct) + 1;

        var product = new Product
        {
            Name = dto.Name,
            Description = dto.Description,
            PhotoUrl = dto.PhotoUrl,
            Price = new Money(dto.Price),
            StockQuantity = dto.Quantity,
            DiscountPercentage = dto.DiscountPercentage,
            DiscountStartsAtUtc = dto.DiscountStartsAtUtc,
            DiscountEndsAtUtc = dto.DiscountEndsAtUtc,
            DisplayOrder = displayOrder
        };

        await _productRepository.AddAsync(product, ct);
        await _unitOfWork.SaveChangesAsync(ct);

        await _auditLogger.LogAsync(request.AdminUserId, "ProductCreated", "Product", product.Id, ct: ct);

        // The product list cache is now stale — clear it rather than wait out the TTL.
        await _cache.RemoveByPrefixAsync("products:", ct);

        return product.Adapt<AdminProductDto>();
    }
}