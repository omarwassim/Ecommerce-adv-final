namespace EcommerceSystem.Application.Interfaces;

public sealed record AiSearchResult(int ProductId, string Reason);

/// <summary>
/// Contract for the AI product search assistant. Defined here by Omar,
/// implemented by Mariam in Infrastructure/AI/OpenAiService.cs — nothing in
/// Application knows or cares which LLM provider is behind this.
///
/// Implementations MUST NOT throw on provider timeout/error — they should
/// return an empty list so a failing AI call degrades to "no AI suggestions"
/// instead of breaking product browsing.
/// </summary>
public interface IAiService
{
    Task<IReadOnlyList<AiSearchResult>> SearchAsync(string naturalLanguageQuery, CancellationToken ct = default);
}