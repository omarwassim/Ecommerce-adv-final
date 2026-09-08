using System.Net.Http.Json;
using EcommerceSystem.Application.DTOs;
using EcommerceSystem.Application.Interfaces;

namespace EcommerceSystem.Infrastructure.AI;

public class AiChatService : IAiChatService
{
    private readonly HttpClient _httpClient;

    public AiChatService(HttpClient httpClient)
    {
        _httpClient = httpClient;
    }

    public async Task<AiChatResponseDto> ChatAsync(
        AiChatRequestDto request,
        CancellationToken ct = default)
    {
        var response = await _httpClient.PostAsJsonAsync(
            "chat/",
            request,
            ct);

        response.EnsureSuccessStatusCode();

        var result = await response.Content
            .ReadFromJsonAsync<AiChatResponseDto>(
                cancellationToken: ct);

        return result ?? throw new InvalidOperationException(
            "Python AI service returned an empty response.");
    }
}