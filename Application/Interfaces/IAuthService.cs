namespace EcommerceSystem.Application.Interfaces;

public interface IAuthService
{
    Task<string?> LoginAsync(string email, string password, CancellationToken ct = default);
    Task<int> RegisterAsync(string email, string password, string fullName, CancellationToken ct = default);
    string HashPassword(string plainPassword);
    bool VerifyPassword(string plainPassword, string hash);
    string GenerateJwtToken(int userId, string email, string role);
}