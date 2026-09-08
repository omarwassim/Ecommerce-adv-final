namespace EcommerceSystem.Domain.Enums;

/// <summary>Exactly two roles. Nothing else is valid — the JWT role claim and every [Authorize(Roles=...)] check depends on this staying a closed set.</summary>
public enum UserRole
{
    User = 0,
    Admin = 1
}