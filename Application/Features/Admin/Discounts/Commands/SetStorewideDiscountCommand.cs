using MediatR;

namespace EcommerceSystem.Application.Features.Admin.Discounts.Commands;

/// <summary>Applies the same discount window to every active product in one shot.</summary>
public sealed record SetStorewideDiscountCommand(
    int AdminUserId, decimal DiscountPercentage, int DurationHours
) : IRequest<Unit>;