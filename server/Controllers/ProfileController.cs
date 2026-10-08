using Fluffy.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace Fluffy.Api.Controllers;

[ApiController]
[Route("api/profile")]
public sealed class ProfileController(ProfileService profileService) : ControllerBase
{
    [HttpGet("{name}")]
    public async Task<IActionResult> GetProfile(string name)
    {
        if (string.IsNullOrWhiteSpace(name))
        {
            return BadRequest("Name is required.");
        }

        var profile = await profileService.GetProfileAsync(name);
        return Ok(profile);
    }
}
