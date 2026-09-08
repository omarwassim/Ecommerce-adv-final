using EcommerceSystem.Application.Interfaces;
using EcommerceSystem.Domain.Interfaces;
using Infrastructure.Auth;
using Infrastructure.Caching;
using Infrastructure.Logging;
using Infrastructure.Payments;
using Infrastructure.Persistence;
using Infrastructure.Persistence.Repositories;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using StackExchange.Redis;

namespace Infrastructure;

// Single entry point Mariam calls from WebApi/Program.cs: builder.Services.AddInfrastructure(config).
public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration config)
    {
        services.AddDbContext<AppDbContext>(options =>
            options.UseSqlServer(config.GetConnectionString("DefaultConnection")));

        services.AddSingleton<IConnectionMultiplexer>(_ =>
            ConnectionMultiplexer.Connect(config.GetConnectionString("Redis")!));

        services.Configure<JwtSettings>(config.GetSection("Jwt"));

        services.AddScoped<IProductRepository, ProductRepository>();
        services.AddScoped<IOrderRepository, OrderRepository>();
        services.AddScoped<ICartRepository, CartRepository>();
        services.AddScoped<IUnitOfWork, UnitOfWork>();
        services.AddScoped<IAuditLogRepository, AuditLogRepository>();

        services.AddScoped<ICacheService, RedisCacheService>();
        services.AddScoped<IIdempotencyStore, RedisIdempotencyStore>();
        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<IPaymentService, StripePaymentService>();
        services.AddScoped<IAuditLogger, SerilogAuditLogger>();

        // IUserDiscountRepository is intentionally NOT registered yet - blocked on Rahaf
        // fixing UserDiscount (currently only an enum, no entity class) and the interface's
        // method signatures. See INFRASTRUCTURE_SETUP.md for the full gap list.

        // Rate limiting is registered from the Ecommerce (WebApi) project instead of here -
        // AddRateLimiter lives in the ASP.NET Core shared framework, which a plain class
        // library doesn't get automatically the way Microsoft.NET.Sdk.Web does.

        // IAiService is intentionally NOT registered here - Mariam registers her
        // OpenAiService implementation from Infrastructure/AI/ separately.

        return services;
    }
}
