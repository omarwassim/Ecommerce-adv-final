using EcommerceSystem.Application.DTOs;
using EcommerceSystem.Domain.Entities;
using Mapster;

namespace EcommerceSystem.Application.Mappings;

/// <summary>
/// Mapster over AutoMapper: Mapster compiles mapping expressions ahead of
/// time (no reflection at request time), which matters here because
/// GetProducts is a cached-but-still-hot endpoint. AutoMapper's reflection
/// based mapping is fine at low volume but adds avoidable overhead per
/// request, and Mapster's config below is explicit enough that "how does
/// Price map to a decimal" isn't a mystery six months from now.
/// </summary>
public sealed class MappingProfile : IRegister
{
    public void Register(TypeAdapterConfig config)
    {
        config.NewConfig<Product, ProductDto>()
            .Map(dest => dest.Price, src => src.Price.Amount)
            .Map(dest => dest.Currency, src => src.Price.Currency);

        config.NewConfig<CartItem, CartItemDto>()
            .Map(dest => dest.ProductName, src => src.Product != null ? src.Product.Name : string.Empty)
            .Map(dest => dest.UnitPrice, src => src.Product != null ? src.Product.Price.Amount : 0)
            .Map(dest => dest.LineTotal, src => src.Product != null ? src.Product.Price.Amount * src.Quantity : 0);
       
        // Cart has no Total property of its own - computed here from each item's price.
        config.NewConfig<Cart, CartDto>()
            .Map(dest => dest.Total, src => src.Items.Sum(i => i.Product != null ? i.Product.Price.Amount * i.Quantity : 0));

        config.NewConfig<Order, OrderDto>()
            .Map(dest => dest.Status, src => src.Status.ToString())
            .Map(dest => dest.Total, src => src.Total.Amount);

        config.NewConfig<OrderItem, OrderItemDto>()
            .Map(dest => dest.ProductName, src => src.ProductNameSnapshot)
            .Map(dest => dest.UnitPrice, src => src.UnitPriceAtPurchase.Amount)
            .Map(dest => dest.LineTotal, src => src.LineTotal.Amount);
    }
}