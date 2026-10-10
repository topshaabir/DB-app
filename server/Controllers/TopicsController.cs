using Fluffy.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace Fluffy.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public sealed class TopicsController(LearningService learningService) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetTopics()
    {
        var topics = await learningService.GetTopicsAsync();
        return Ok(topics);
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetTopic(int id, [FromQuery] string? language = null)
    {
        var topic = await learningService.GetTopicAsync(id, language);
        return topic is null ? NotFound() : Ok(topic);
    }

    [HttpGet("{id:int}/vocabulary")]
    public async Task<IActionResult> GetVocabulary(int id, [FromQuery] string? language = null)
    {
        var topic = await learningService.GetTopicAsync(id, language);
        if (topic is null)
        {
            return NotFound();
        }

        var vocabulary = await learningService.GetVocabularyAsync(id, language);
        return Ok(vocabulary);
    }

    [HttpGet("{id:int}/questions")]
    public async Task<IActionResult> GetQuestions(int id)
    {
        var topic = await learningService.GetTopicAsync(id);
        if (topic is null)
        {
            return NotFound();
        }

        var questions = await learningService.GetQuestionsForTopicAsync(id);
        return Ok(questions);
    }
}
