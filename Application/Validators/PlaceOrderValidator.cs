using EcommerceSystem.Application.Features.Orders.Commands;
using FluentValidation;

namespace EcommerceSystem.Application.Validators;

public sealed class PlaceOrderValidator : AbstractValidator<PlaceOrderCommand>
{
    public PlaceOrderValidator()
    {
        RuleFor(x => x.UserId).GreaterThan(0);

        RuleFor(x => x.IdempotencyKey)
            .NotEmpty()
            .MaximumLength(100)
            .WithMessage("Idempotency-Key header is required for checkout.");
    }
}