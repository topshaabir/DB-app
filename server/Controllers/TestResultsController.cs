using Fluffy.Api.DTOs;
using Fluffy.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace Fluffy.Api.Controllers;

[ApiController]
[Route("api/test-results")]
public sealed class TestResultsController(TestService testService) : ControllerBase
{
    [HttpPost]
    public async Task<IActionResult> Create(CreateTestResultDto request)
    {
        if (string.IsNullOrWhiteSpace(request.UserName))
        {
            return BadRequest("User name is required.");
        }

        if (request.TotalQuestions < 0 || request.Score < 0 || request.Score > request.TotalQuestions)
        {
            return BadRequest("Score must be between zero and total questions.");
        }

        var result = await testService.CreateResultAsync(request);
        return CreatedAtAction(nameof(GetByName), new { name = result.UserName }, result);
    }

    [HttpGet("{name}")]
    public async Task<IActionResult> GetByName(string name)
    {
        if (string.IsNullOrWhiteSpace(name))
        {
            return BadRequest("Name is required.");
        }

        var results = await testService.GetResultsByNameAsync(name);
        return Ok(results);
    }
}
