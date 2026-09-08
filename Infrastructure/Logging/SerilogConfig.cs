using Microsoft.Extensions.Hosting;
using Serilog;
using Serilog.Core;
using Serilog.Events;

namespace Infrastructure.Logging;

// Serilog over built-in ILogger: structured (JSON-capable) sinks, per-environment levels, and
// a destructuring policy that redacts sensitive fields at the pipeline level, so a field never
// leaks into a log file just because someone forgot to mark it.
public static class SerilogConfig
{
    private static readonly string[] SensitiveFieldNames =
    {
        "password", "passwordhash", "token", "accesstoken", "refreshtoken",
        "secret", "cardnumber", "cvv", "authorization", "providerreference"
    };

    public static LoggerConfiguration Configure(LoggerConfiguration config, IHostEnvironment env)
    {
        config
            .MinimumLevel.Is(env.IsDevelopment() ? LogEventLevel.Debug : LogEventLevel.Information)
            .MinimumLevel.Override("Microsoft.AspNetCore", LogEventLevel.Warning)
            .Enrich.FromLogContext()
            .Enrich.WithProperty("Application", "EcommerceSystem")
            .Destructure.With(new SensitiveDataMaskingPolicy(SensitiveFieldNames))
            .WriteTo.Console(outputTemplate:
                "[{Timestamp:HH:mm:ss} {Level:u3}] {Message:lj} {Properties:j}{NewLine}{Exception}")
            .WriteTo.File(
                path: "logs/ecommerce-.json",
                rollingInterval: RollingInterval.Day,
                formatter: new Serilog.Formatting.Json.JsonFormatter());

        return config;
    }
}

public class SensitiveDataMaskingPolicy : IDestructuringPolicy
{
    private readonly HashSet<string> _sensitiveNames;

    public SensitiveDataMaskingPolicy(IEnumerable<string> sensitiveFieldNames) =>
        _sensitiveNames = new HashSet<string>(sensitiveFieldNames, StringComparer.OrdinalIgnoreCase);

    public bool TryDestructure(object? value, ILogEventPropertyValueFactory propertyValueFactory, out LogEventPropertyValue? result)
    {
        result = null;
        if (value is null) return false;

        var type = value.GetType();
        // Only intervene for our own DTO/entity types - leave primitives, strings, etc. alone.
        var ns = type.Namespace ?? string.Empty;
        if (!ns.StartsWith("EcommerceSystem.Domain") && !ns.StartsWith("EcommerceSystem.Application"))
            return false;

        var props = type.GetProperties();
        var logProps = props.Select(p =>
        {
            var isSensitive = _sensitiveNames.Contains(p.Name);
            var rawValue = isSensitive ? "***REDACTED***" : p.GetValue(value);
            return new LogEventProperty(p.Name, propertyValueFactory.CreatePropertyValue(rawValue, destructureObjects: false));
        });

        result = new StructureValue(logProps);
        return true;
    }
}
