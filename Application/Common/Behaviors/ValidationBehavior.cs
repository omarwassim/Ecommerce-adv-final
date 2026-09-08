using FluentValidation;
using MediatR;
using System.ComponentModel.DataAnnotations;

namespace EcommerceSystem.Application.Common.Behaviors;

/// <summary>
/// Runs every registered FluentValidation validator for a request before its
/// handler executes. Registered once in Program.cs
/// (services.AddTransient(typeof(IPipelineBehavior&lt;,&gt;), typeof(ValidationBehavior&lt;,&gt;))),
/// so no handler has to remember to call a validator manually.
/// </summary>
public sealed class ValidationBehavior<TRequest, TResponse> : IPipelineBehavior<TRequest, TResponse>
    where TRequest : IRequest<TResponse>
{
    private readonly IEnumerable<IValidator<TRequest>> _validators;

    public ValidationBehavior(IEnumerable<IValidator<TRequest>> validators)
    {
        _validators = validators;
    }

    public async Task<TResponse> Handle(
        TRequest request, RequestHandlerDelegate<TResponse> next, CancellationToken cancellationToken)
    {
        if (!_validators.Any())
            return await next();

        var failures = new List<FluentValidation.Results.ValidationFailure>();
        foreach (var validator in _validators)
        {
            var result = await validator.ValidateAsync(request, cancellationToken);
            failures.AddRange(result.Errors.Where(f => f is not null));
        }

        if (failures.Count != 0)
            throw new ValidationException(failures);

        return await next();
    }
}