namespace Infrastructure.Auth;

// BCrypt: adaptive cost factor, salts automatically per-hash, no separate salt column needed.
public static class PasswordHasher
{
    private const int WorkFactor = 12;

    public static string Hash(string plainTextPassword) =>
        BCrypt.Net.BCrypt.HashPassword(plainTextPassword, workFactor: WorkFactor);

    public static bool Verify(string plainTextPassword, string hash) =>
        BCrypt.Net.BCrypt.Verify(plainTextPassword, hash);
}
