namespace Infrastructure.Auth;

// Bound from configuration ("Jwt" section). Secret comes from user-secrets/env var in every
// environment - never committed.
public class JwtSettings
{
    public string Secret { get; set; } = string.Empty;
    public string Issuer { get; set; } = "EcommerceSystem";
    public string Audience { get; set; } = "EcommerceSystem.Client";
    public int ExpiryMinutes { get; set; } = 60;
}
