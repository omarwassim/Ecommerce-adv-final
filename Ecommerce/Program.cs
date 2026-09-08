using Ecommerce.RateLimiting;
using EcommerceSystem.Application;
using EcommerceSystem.Application.Interfaces;
using EcommerceSystem.Infrastructure.AI;
using Infrastructure;

using Infrastructure.Auth;
using Infrastructure.Logging;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Serilog;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

// --- Logging ---
builder.Host.UseSerilog((context, services, config) =>
    SerilogConfig.Configure(config, context.HostingEnvironment));

// --- Layer wiring ---
builder.Services.AddApplication();
builder.Services.AddInfrastructure(builder.Configuration);
builder.Services.AddApiRateLimiting();

// --- AI Integration ---
builder.Services.AddHttpClient<IAiChatService, AiChatService>(client =>
{
    client.BaseAddress = new Uri("http://127.0.0.1:8000/");
});

builder.Services.AddControllers();

builder.Services.AddEndpointsApiExplorer();

builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new Microsoft.OpenApi.Models.OpenApiInfo
    {
        Title = "Ecommerce API",
        Version = "v1"
    });

    options.AddSecurityDefinition("Bearer",
        new Microsoft.OpenApi.Models.OpenApiSecurityScheme
        {
            Description = "Paste your JWT here as: Bearer {token}",
            Name = "Authorization",
            In = Microsoft.OpenApi.Models.ParameterLocation.Header,
            Type = Microsoft.OpenApi.Models.SecuritySchemeType.ApiKey,
            Scheme = "Bearer"
        });

    options.AddSecurityRequirement(
        new Microsoft.OpenApi.Models.OpenApiSecurityRequirement
        {
            {
                new Microsoft.OpenApi.Models.OpenApiSecurityScheme
                {
                    Reference =
                        new Microsoft.OpenApi.Models.OpenApiReference
                        {
                            Type = Microsoft.OpenApi.Models.ReferenceType.SecurityScheme,
                            Id = "Bearer"
                        }
                },
                Array.Empty<string>()
            }
        });
});

// --- Auth ---
var jwtSettings = builder.Configuration.GetSection("Jwt").Get<JwtSettings>()
                  ?? new JwtSettings();

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
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(jwtSettings.Secret))
        };
    });

builder.Services.AddAuthorization(options =>
    options.AddAdminOnlyPolicy());

var app = builder.Build();

// TODO(Mariam/Reem): plug in ExceptionHandlingMiddleware here once it exists.

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

// Required for WebApplicationFactory integration tests
public partial class Program { }