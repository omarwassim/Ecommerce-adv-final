using EcommerceSystem.Domain.Entities;
using EcommerceSystem.Domain.ValueObjects;
using FluentAssertions;
using Infrastructure.Logging;
using Serilog.Events;
using Xunit;

namespace EcommerceSystem.IntegrationTests.Logging;

/// <summary>
/// Verifies the actual guarantee the team's rules require: sensitive fields never reach a
/// log sink, even when a whole Domain entity gets logged carelessly (e.g. a debug log that
/// dumps "the user object" or "the payment object"). This does NOT just check that the
/// masking code compiles - it feeds a real entity with a real password hash through the
/// exact policy Serilog uses at runtime and asserts the hash never appears in the output.
/// </summary>
public class SerilogMaskingTests
{
    private readonly SensitiveDataMaskingPolicy _policy = new(
        new[] { "password", "passwordhash", "token", "accesstoken", "refreshtoken",
                "secret", "cardnumber", "cvv", "authorization", "providerreference" });

    [Fact]
    public void TryDestructure_RedactsPasswordHash_OnUserEntity()
    {
        var user = new User
        {
            Id = 1,
            Email = "reem@example.com",
            PasswordHash = "$2a$12$THIS_IS_A_REAL_BCRYPT_HASH_VALUE_abcdef123456",
            FullName = "Reem Test"
        };

        var factory = new StubPropertyValueFactory();
        var handled = _policy.TryDestructure(user, factory, out var result);

        handled.Should().BeTrue("the policy should intervene on Domain entities");
        result.Should().NotBeNull();

        var rendered = result!.ToString();
        rendered.Should().NotContain("$2a$12$THIS_IS_A_REAL_BCRYPT_HASH_VALUE_abcdef123456",
            "the raw password hash must never reach a rendered log line");
        rendered.Should().Contain("REDACTED");
        rendered.Should().Contain(user.Email, "non-sensitive fields should still log normally");
    }

    [Fact]
    public void TryDestructure_RedactsProviderReference_OnPaymentEntity()
    {
        var payment = new Payment
        {
            Id = 1,
            OrderId = 1,
            Provider = "Stripe",
            ProviderReference = "pi_3S1234567890abcdefTOKENVALUE",
            Amount = new Money(21.25m)
        };

        var factory = new StubPropertyValueFactory();
        _policy.TryDestructure(payment, factory, out var result);

        var rendered = result!.ToString();
        rendered.Should().NotContain("pi_3S1234567890abcdefTOKENVALUE");
        rendered.Should().Contain("REDACTED");
    }

    [Fact]
    public void TryDestructure_DoesNotInterfere_WithNonDomainTypes()
    {
        // Plain strings/primitives aren't Domain/Application types - the policy must leave
        // them alone rather than trying to "mask" a bare string.
        var factory = new StubPropertyValueFactory();
        var handled = _policy.TryDestructure("just a normal log message", factory, out var result);

        handled.Should().BeFalse();
        result.Should().BeNull();
    }

    // Minimal stub - Serilog's real factory does more, but TryDestructure only needs
    // CreatePropertyValue for this test's purposes.
    private class StubPropertyValueFactory : Serilog.Core.ILogEventPropertyValueFactory
    {
        public LogEventPropertyValue CreatePropertyValue(object? value, bool destructureObjects = false) =>
            new ScalarValue(value);
    }
}
