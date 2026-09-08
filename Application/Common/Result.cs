namespace EcommerceSystem.Application.Common;

/// <summary>
/// Lightweight result wrapper so handlers can return "failed, here's why"
/// without throwing for expected business failures (e.g. out of stock).
/// Domain exceptions are still thrown for genuine rule violations; this is
/// for expected, user-facing outcomes the controller needs to turn into a
/// specific status code.
/// </summary>
public sealed class Result<T>
{
    public bool IsSuccess { get; }
    public T? Value { get; }
    public string? Error { get; }

    private Result(bool isSuccess, T? value, string? error)
    {
        IsSuccess = isSuccess;
        Value = value;
        Error = error;
    }

    public static Result<T> Success(T value) => new(true, value, null);
    public static Result<T> Failure(string error) => new(false, default, error);
}