using System;
using System.Collections.Generic;
using System.Text;

namespace EcommerceSystem.Domain.Exceptions;

/// <summary>
/// Base type for business-rule violations. Caught explicitly by the
/// exception-handling middleware in WebApi and mapped to a 4xx response —
/// never caught generically alongside real bugs.
/// </summary>
public class DomainException : Exception
{
    public DomainException(string message) : base(message) { }
}

public sealed class InvalidOrderStateTransitionException : DomainException
{
    public InvalidOrderStateTransitionException(string from, string to)
        : base($"Cannot transition order from '{from}' to '{to}'.") { }
}

public sealed class InsufficientStockException : DomainException
{
    public InsufficientStockException(int productId)
        : base($"Product {productId} does not have enough stock.") { }
}

public sealed class CartEmptyException : DomainException
{
    public CartEmptyException() : base("Cannot place an order from an empty cart.") { }
}