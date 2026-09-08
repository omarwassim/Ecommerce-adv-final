using Microsoft.AspNetCore.Authorization;
using Microsoft.Extensions.DependencyInjection;

namespace Infrastructure.Auth;

// Named policy so every Admin/* controller can use [Authorize(Policy = "AdminOnly")]
// consistently instead of repeating [Authorize(Roles = "Admin")] everywhere - one place to
// change if the rule ever needs a second condition (e.g. also requiring a specific claim).
// UserRole is a closed two-value enum (Admin/User) per the v2 spec, so "Admin" is the only
// role string this will ever need to check against.
public static class AdminOnlyPolicy
{
    public const string Name = "AdminOnly";

    public static AuthorizationOptions AddAdminOnlyPolicy(this AuthorizationOptions options)
    {
        options.AddPolicy(Name, policy => policy.RequireRole("Admin"));
        return options;
    }
}
