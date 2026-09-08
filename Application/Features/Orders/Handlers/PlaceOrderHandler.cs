using EcommerceSystem.Application.DTOs;
using EcommerceSystem.Application.Features.Orders.Commands;
using EcommerceSystem.Application.Interfaces;
using EcommerceSystem.Domain.Entities;
using EcommerceSystem.Domain.Enums;
using EcommerceSystem.Domain.Exceptions;
using EcommerceSystem.Domain.Interfaces;
using EcommerceSystem.Domain.ValueObjects;
using Mapster;
using MediatR;

namespace EcommerceSystem.Application.Features.Orders.Handlers;

public sealed class PlaceOrderHandler : IRequestHandler<PlaceOrderCommand, OrderDto>
{
    private readonly ICartRepository _cartRepository;
    private readonly IProductRepository _productRepository;
    private readonly IOrderRepository _orderRepository;
    private readonly IUserDiscountRepository _userDiscountRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IPaymentService _paymentService;
    private readonly IIdempotencyStore _idempotencyStore;

    public PlaceOrderHandler(
        ICartRepository cartRepository,
        IProductRepository productRepository,
        IOrderRepository orderRepository,
        IUserDiscountRepository userDiscountRepository,
        IUnitOfWork unitOfWork,
        IPaymentService paymentService,
        IIdempotencyStore idempotencyStore)
    {
        _cartRepository = cartRepository;
        _productRepository = productRepository;
        _orderRepository = orderRepository;
        _userDiscountRepository = userDiscountRepository;
        _unitOfWork = unitOfWork;
        _paymentService = paymentService;
        _idempotencyStore = idempotencyStore;
    }

    public async Task<OrderDto> Handle(PlaceOrderCommand request, CancellationToken ct)
    {
        // --- Step 1: idempotency fast path (cache) ---
        var cached = await _idempotencyStore.TryGetCachedResultAsync(request.IdempotencyKey, ct);
        if (cached is not null)
            return cached;

        // --- Step 2: idempotency guarantee (DB, unique index on IdempotencyKey) ---
        var existingOrder = await _orderRepository.GetByIdempotencyKeyAsync(request.IdempotencyKey, ct);
        if (existingOrder is not null)
        {
            var existingDto = existingOrder.Adapt<OrderDto>();
            await _idempotencyStore.StoreResultAsync(request.IdempotencyKey, existingDto, TimeSpan.FromMinutes(10), ct);
            return existingDto;
        }

        var cart = await _cartRepository.GetByUserIdAsync(request.UserId, ct)
            ?? throw new CartEmptyException();

        if (cart.Items.Count == 0)
            throw new CartEmptyException();

        var nowUtc = DateTime.UtcNow;
        await _unitOfWork.BeginTransactionAsync(ct);

        Order order;
        UserDiscount? consumedUserDiscount = null;
        try
        {
            // --- Step 3: reserve stock + snapshot prices AND each item's active discount ---
            var orderItems = new List<OrderItem>();
            var subtotal = Money.Zero();

            foreach (var cartItem in cart.Items)
            {
                // Row-locked read (SELECT ... WITH (UPDLOCK, ROWLOCK) under SQL Server)
                // so two concurrent checkouts against the same product can't both
                // read the same stock count and both succeed.
                var product = await _productRepository.GetByIdForUpdateAsync(cartItem.ProductId, ct)
                    ?? throw new DomainException($"Product {cartItem.ProductId} no longer exists.");

                product.ReserveStock(cartItem.Quantity);
                _productRepository.Update(product);

                var orderItem = new OrderItem
                {
                    ProductId = product.Id,
                    ProductNameSnapshot = product.Name,
                    UnitPriceAtPurchase = product.Price, // <- snapshot, not a live reference
                    DiscountPercentageAtPurchase = product.GetEffectiveDiscountPercentage(nowUtc), // <- item-level admin discount, also snapshotted
                    Quantity = cartItem.Quantity
                };
                orderItems.Add(orderItem);
                subtotal = subtotal.Add(orderItem.LineTotal);
            }

            order = new Order
            {
                UserId = request.UserId,
                IdempotencyKey = request.IdempotencyKey,
                Items = orderItems
            };

            // --- Step 3b: resolve the order-level personal discount (FirstPurchase beats PostOrderWindow) ---
            var priorOrderCount = await _orderRepository.GetCompletedOrderCountAsync(request.UserId, ct);

            if (priorOrderCount == 0)
            {
                order.ApplyOrderLevelDiscount(15.00m, "FirstPurchase");
            }
            else
            {
                var postOrderDiscount = await _userDiscountRepository.GetActiveAsync(
                    request.UserId, UserDiscountType.PostOrderWindow, nowUtc, ct);

                if (postOrderDiscount is not null)
                {
                    order.ApplyOrderLevelDiscount(postOrderDiscount.DiscountPercentage, "PostOrderWindow");
                    consumedUserDiscount = postOrderDiscount;
                }
            }

            order.Total = subtotal.ApplyDiscountPercentage(order.AppliedDiscountPercentage);

            await _orderRepository.AddAsync(order, ct);

            if (consumedUserDiscount is not null)
            {
                consumedUserDiscount.MarkUsed(nowUtc);
                _userDiscountRepository.Update(consumedUserDiscount);
            }

            await _unitOfWork.SaveChangesAsync(ct);

            // --- Step 4: charge payment ---
            var paymentResult = await _paymentService.ChargeAsync(order.Id, order.Total.Amount, order.Total.Currency, ct);

            if (!paymentResult.Succeeded)
            {
                order.Fail();
                await _unitOfWork.SaveChangesAsync(ct);
                await _unitOfWork.CommitTransactionAsync(ct);

                throw new DomainException($"Payment failed: {paymentResult.FailureReason}");
            }

            order.MarkPaid();

            // --- Step 5: confirm. If this throws, payment already succeeded — compensate. ---
            try
            {
                order.Confirm();
                await _unitOfWork.SaveChangesAsync(ct);

                // Order fully succeeded — grant the 72h post-order discount window.
                var postOrderWindow = UserDiscount.CreatePostOrderWindow(request.UserId, order.Id, nowUtc);
                await _userDiscountRepository.AddAsync(postOrderWindow, ct);
                await _unitOfWork.SaveChangesAsync(ct);

                await _unitOfWork.CommitTransactionAsync(ct);
            }
            catch (Exception confirmEx)
            {
                order.Compensate($"Confirmation failed after payment: {confirmEx.Message}");
                await _paymentService.RefundAsync(paymentResult.ProviderReference, ct);
                await _unitOfWork.SaveChangesAsync(ct);
                await _unitOfWork.CommitTransactionAsync(ct);
            }

            cart.Clear();
            _cartRepository.Update(cart);
            await _unitOfWork.SaveChangesAsync(ct);
        }
        catch
        {
            await _unitOfWork.RollbackTransactionAsync(ct);
            throw;
        }

        var dto = order.Adapt<OrderDto>();
        await _idempotencyStore.StoreResultAsync(request.IdempotencyKey, dto, TimeSpan.FromMinutes(10), ct);
        return dto;
    }
}