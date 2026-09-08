using MediatR;

namespace EcommerceSystem.Application.Features.Admin.Discounts.Commands;

/// <summary>Sets a time-boxed discount on a single product. DurationHours becomes ends_at = now + DurationHours.</summary>
public sealed record SetProductDiscountCommand(
    int AdminUserId, int ProductId, decimal DiscountPercentage, int DurationHours
) : IRequest<Unit>;