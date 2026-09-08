using System.Net;
using System.Net.Http.Json;
using EcommerceSystem.Application.DTOs;
using FluentAssertions;
using Xunit;

namespace EcommerceSystem.IntegrationTests.AI;

public class AiIntegrationTests
{
    private readonly HttpClient _client;

    public AiIntegrationTests()
    {
        var factory = new CustomWebApplicationFactory();
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task Chat_WithValidQuery_ReturnsAiAnswer()
    {
        // Arrange
        var request = new AiChatRequestDto
        {
            Query = "What is the return policy?"
        };

        // Act
        var response = await _client.PostAsJsonAsync(
            "/api/Ai/chat",
            request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var result = await response.Content
            .ReadFromJsonAsync<AiChatResponseDto>();

        result.Should().NotBeNull();
        result!.Answer.Should().NotBeNullOrWhiteSpace();
    }
}