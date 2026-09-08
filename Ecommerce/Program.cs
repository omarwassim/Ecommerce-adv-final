using System.Text;
using EcommerceSystem.Application;
using Ecommerce.RateLimiting;
using Infrastructure;
using Infrastructure.Auth;
using Infrastructure.Logging;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Serilog;

var builder = WebApplication.CreateBuilder(args);

// --- Logging (Reem's Infrastructure/Logging/SerilogConfig.cs) ---
builder.Host.UseSerilog((context, services, config) =>
    SerilogConfig.Configure(config, context.HostingEnvironment));

// --- Layer wiring ---
builder.Services.AddApplication();          // MediatR handlers, FluentValidation, Mapster (Omar)
builder.Services.AddInfrastructure(builder.Configuration); // repos, DbContext, cache, auth, payments (Reem)
builder.Services.AddApiRateLimiting();

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new Microsoft.OpenApi.Models.OpenApiInfo { Title = "Ecommerce API", Version = "v1" });

    // Adds the "Authorize" button/padlock to Swagger UI so a JWT can be pasted in and applied
    // to every protected request, instead of hand-adding the header on each call.
    options.AddSecurityDefinition("Bearer", new Microsoft.OpenApi.Models.OpenApiSecurityScheme
    {
        Description = "Paste your JWT here as: Bearer {token}",
        Name = "Authorization",
        In = Microsoft.OpenApi.Models.ParameterLocation.Header,
        Type = Microsoft.OpenApi.Models.SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });
    options.AddSecurityRequirement(new Microsoft.OpenApi.Models.OpenApiSecurityRequirement
    {
        {
            new Microsoft.OpenApi.Models.OpenApiSecurityScheme
            {
                Reference = new Microsoft.OpenApi.Models.OpenApiReference { Type = Microsoft.OpenApi.Models.ReferenceType.SecurityScheme, Id = "Bearer" }
            },
            Array.Empty<string>()
        }
    });
});

// --- Auth: JWT bearer validation (token issuing itself lives in Infrastructure/Auth) ---
var jwtSettings = builder.Configuration.GetSection("Jwt").Get<JwtSettings>() ?? new JwtSettings();
builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwtSettings.Issuer,
            ValidAudience = jwtSettings.Audience,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSettings.Secret))
        };
    });
builder.Services.AddAuthorization(options => options.AddAdminOnlyPolicy());

var app = builder.Build();

// TODO(Mariam/Reem): plug in ExceptionHandlingMiddleware here once it exists, before
// anything else in the pipeline, so every unhandled DomainException maps to the
// consistent error contract instead of leaking a raw stack trace.

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

app.UseRateLimiter();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();