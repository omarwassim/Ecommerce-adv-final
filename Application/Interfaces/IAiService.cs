using EcommerceSystem.Application.DTOs;

namespace EcommerceSystem.Application.Interfaces;

public interface IAiChatService
{
    Task<AiChatResponseDto> ChatAsync(
        AiChatRequestDto request,
        CancellationToken ct = default);
}