using EcommerceSystem.Application.DTOs;
using EcommerceSystem.Application.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace Ecommerce.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AiController : ControllerBase
{
    private readonly IAiChatService _aiChatService;

    public AiController(IAiChatService aiChatService)
    {
        _aiChatService = aiChatService;
    }

    [HttpPost("chat")]
    public async Task<ActionResult<AiChatResponseDto>> Chat(
        [FromBody] AiChatRequestDto request,
        CancellationToken ct)
    {
        var response = await _aiChatService.ChatAsync(
            request,
            ct);

        return Ok(response);
    }
}
