using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using EcommerceSystem.Application.Interfaces;
using EcommerceSystem.Domain.Entities;
using EcommerceSystem.Domain.Enums;
using Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;

namespace Infrastructure.Auth;

// JWT chosen over server-side sessions so the API stays stateless (no sticky sessions needed
// once we run multiple instances behind a load balancer). Frontend stores the token in memory
// / a short-lived cookie, not localStorage, to limit XSS exposure.
//
// IAuthService owns Login/Register directly (not a separate IUserRepository, since there's no
// Domain.Interfaces.IUserRepository) - Infrastructure queries AppDbContext.Users itself here.
public class AuthService : IAuthService
{
    private readonly AppDbContext _db;
    private readonly JwtSettings _settings;

    public AuthService(AppDbContext db, IOptions<JwtSettings> settings)
    {
        _db = db;
        _settings = settings.Value;
    }

    public string HashPassword(string plainPassword) => PasswordHasher.Hash(plainPassword);

    public bool VerifyPassword(string plainPassword, string hash) => PasswordHasher.Verify(plainPassword, hash);

    public async Task<string?> LoginAsync(string email, string password, CancellationToken ct = default)
    {
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Email == email, ct);
        if (user is null || !VerifyPassword(password, user.PasswordHash))
            return null; // caller (controller) maps this to 401 - never reveal which part was wrong

        return GenerateJwtToken(user.Id, user.Email, user.Role.ToString());
    }

    public async Task<int> RegisterAsync(string email, string password, string fullName, CancellationToken ct = default)
    {
        var exists = await _db.Users.AnyAsync(u => u.Email == email, ct);
        if (exists)
            throw new InvalidOperationException("A user with this email already exists.");

        var user = new User
        {
            Email = email,
            PasswordHash = HashPassword(password),
            FullName = fullName,
            Role = UserRole.Customer
        };

        await _db.Users.AddAsync(user, ct);
        await _db.SaveChangesAsync(ct);
        return user.Id;
    }

    public string GenerateJwtToken(int userId, string email, string role)
    {
        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, userId.ToString()),
            new Claim(JwtRegisteredClaimNames.Email, email),
            new Claim(ClaimTypes.Role, role),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
        };

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_settings.Secret));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: _settings.Issuer,
            audience: _settings.Audience,
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(_settings.ExpiryMinutes),
            signingCredentials: creds);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
