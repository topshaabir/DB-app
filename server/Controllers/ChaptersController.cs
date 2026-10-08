using Fluffy.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace Fluffy.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public sealed class ChaptersController(LearningService learningService) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetChapters()
    {
        var chapters = await learningService.GetChaptersAsync();
        return Ok(chapters);
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetChapter(int id)
    {
        var chapter = await learningService.GetChapterAsync(id);
        return chapter is null ? NotFound() : Ok(chapter);
    }
}
