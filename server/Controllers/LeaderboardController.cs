using Fluffy.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace Fluffy.Api.Controllers;

[ApiController]
[Route("api/leaderboard")]
public sealed class LeaderboardController(LeaderboardService leaderboardService) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> Get([FromQuery] string period = "all", [FromQuery] int? topicId = null)
    {
        if (period is not ("all" or "week") || topicId is <= 0)
            return BadRequest("Choose all or week and a valid topic ID.");
        return Ok(await leaderboardService.GetAsync(period, topicId));
    }
}
