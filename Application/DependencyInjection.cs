using System.Reflection;
using FluentValidation;
using Mapster;
using MediatR;
using Microsoft.Extensions.DependencyInjection;

namespace EcommerceSystem.Application;

// NOTE (added by Reem while wiring the WebApi up): this file didn't exist yet, and without it
// Program.cs has no way to register the MediatR handlers, FluentValidation validators, or
// Mapster config - the API would build but every request would fail at runtime with "no
// handler registered". Omar - please review/adjust, this is a reasonable default but it's
// your project to own.
public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        var assembly = Assembly.GetExecutingAssembly();

        services.AddMediatR(cfg => cfg.RegisterServicesFromAssembly(assembly));
        services.AddValidatorsFromAssembly(assembly);
        services.AddTransient(typeof(IPipelineBehavior<,>), typeof(Common.Behaviors.ValidationBehavior<,>));

        // Handlers call the static .Adapt<T>() extension directly (see AddToCartHandler,
        // GetProductsHandler), so all that's needed here is telling Mapster to discover
        // MappingProfile (IRegister) and populate the global config once at startup.
        TypeAdapterConfig.GlobalSettings.Scan(assembly);

        return services;
    }
}
