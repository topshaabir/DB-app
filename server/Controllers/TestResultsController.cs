using Fluffy.Api.DTOs;
using Fluffy.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace Fluffy.Api.Controllers;

[ApiController]
[Route("api/test-results")]
public sealed class TestResultsController(TestService testService) : ControllerBase
{
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
