using EcommerceSystem.Application.DTOs;
using EcommerceSystem.Application.Features.Cart.Commands;
using EcommerceSystem.Domain.Exceptions;
using EcommerceSystem.Domain.Interfaces;
using Mapster;
using MediatR;
using DomainCart = EcommerceSystem.Domain.Entities.Cart;

namespace EcommerceSystem.Application.Features.Cart.Handlers;

public sealed class AddToCartHandler : IRequestHandler<AddToCartCommand, CartDto>
{
    private readonly ICartRepository _cartRepository;
    private readonly IProductRepository _productRepository;
    private readonly IUnitOfWork _unitOfWork;

    public AddToCartHandler(ICartRepository cartRepository, IProductRepository productRepository, IUnitOfWork unitOfWork)
    {
        _cartRepository = cartRepository;
        _productRepository = productRepository;
        _unitOfWork = unitOfWork;
    }

    public async Task<CartDto> Handle(AddToCartCommand request, CancellationToken ct)
    {
        var product = await _productRepository.GetByIdAsync(request.ProductId, ct)
            ?? throw new DomainException($"Product {request.ProductId} not found.");

        if (product.StockQuantity < request.Quantity)
            throw new InsufficientStockException(product.Id);

        var cart = await _cartRepository.GetByUserIdAsync(request.UserId, ct);
        var isNewCart = cart is null;
        if (isNewCart)
        {
            cart = new DomainCart { UserId = request.UserId };
            await _cartRepository.AddAsync(cart, ct);
        }

        cart!.AddItem(request.ProductId, request.Quantity);

        if (!isNewCart)
            _cartRepository.Update(cart);

        await _unitOfWork.SaveChangesAsync(ct);

        return cart.Adapt<CartDto>();
    }
}