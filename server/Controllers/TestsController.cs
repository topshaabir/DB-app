using Fluffy.Api.DTOs;
using Fluffy.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace Fluffy.Api.Controllers;

[ApiController]
[Route("api/tests")]
public sealed class TestsController(LearningService learningService, TestService testService) : ControllerBase
{
    [HttpGet("scopes")]
    public async Task<IActionResult> GetScopes()
    {
        var scopes = await learningService.GetTestScopesAsync();
        return Ok(scopes);
    }

    [HttpGet("questions")]
    public async Task<IActionResult> GetQuestions([FromQuery] string scopeType = "all", [FromQuery] int? scopeId = null, [FromQuery] string? language = null)
    {
        var questions = await testService.GetQuestionsAsync(scopeType, scopeId, language);
        return Ok(questions);
    }

    [HttpPost("submit")]
    public async Task<IActionResult> Submit(SubmitTestRequestDto request)
    {
        if (string.IsNullOrWhiteSpace(request.UserName))
        {
            return BadRequest("User name is required.");
        }

        var result = await testService.SubmitAsync(request);
        return result is null ? BadRequest("The selected test has no valid answers to score.") : Ok(result);
    }
}
