using EcommerceSystem.Application.Features.Admin.Discounts.Commands;
using FluentValidation;

namespace EcommerceSystem.Application.Validators;

public sealed class SetProductDiscountValidator : AbstractValidator<SetProductDiscountCommand>
{
    public SetProductDiscountValidator()
    {
        RuleFor(x => x.ProductId).GreaterThan(0);
        RuleFor(x => x.DiscountPercentage).InclusiveBetween(0, 100);
        RuleFor(x => x.DurationHours).GreaterThan(0)
            .WithMessage("Discount duration must be at least 1 hour.");
    }
}

public sealed class SetStorewideDiscountValidator : AbstractValidator<SetStorewideDiscountCommand>
{
    public SetStorewideDiscountValidator()
    {
        RuleFor(x => x.DiscountPercentage).InclusiveBetween(0, 100);
        RuleFor(x => x.DurationHours).GreaterThan(0)
            .WithMessage("Discount duration must be at least 1 hour.");
    }
}