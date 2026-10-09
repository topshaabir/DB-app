using Fluffy.Api.Data;
using Fluffy.Api.DTOs;
using Microsoft.EntityFrameworkCore;

namespace Fluffy.Api.Services;

public sealed class LearningService(FluffyDbContext db, TestService testService)
{
    public async Task<IReadOnlyList<ChapterSummaryDto>> GetChaptersAsync()
    {
        return await db.Chapters
            .AsNoTracking()
            .OrderBy(chapter => chapter.OrderIndex)
            .Select(chapter => new ChapterSummaryDto(
                chapter.Id,
                chapter.Title,
                chapter.Description,
                chapter.OrderIndex,
                chapter.Topics
                    .Where(topic => topic.IsActive)
                    .OrderBy(topic => topic.OrderIndex)
                    .Select(topic => new TopicSummaryDto(
                        topic.Id,
                        topic.ChapterId,
                        chapter.Title,
                        topic.Title,
                        topic.Description,
                        topic.ImageUrl,
                        topic.OrderIndex))
                    .ToList()))
            .ToListAsync();
    }

    public async Task<ChapterSummaryDto?> GetChapterAsync(int id)
    {
        return await db.Chapters
            .AsNoTracking()
            .Where(chapter => chapter.Id == id)
            .Select(chapter => new ChapterSummaryDto(
                chapter.Id,
                chapter.Title,
                chapter.Description,
                chapter.OrderIndex,
                chapter.Topics
                    .Where(topic => topic.IsActive)
                    .OrderBy(topic => topic.OrderIndex)
                    .Select(topic => new TopicSummaryDto(
                        topic.Id,
                        topic.ChapterId,
                        chapter.Title,
                        topic.Title,
                        topic.Description,
                        topic.ImageUrl,
                        topic.OrderIndex))
                    .ToList()))
            .SingleOrDefaultAsync();
    }

    public async Task<IReadOnlyList<TopicSummaryDto>> GetTopicsAsync()
    {
        return await db.Topics
            .AsNoTracking()
            .Where(topic => topic.IsActive)
            .OrderBy(topic => topic.Chapter!.OrderIndex)
            .ThenBy(topic => topic.OrderIndex)
            .Select(topic => new TopicSummaryDto(
                topic.Id,
                topic.ChapterId,
                topic.Chapter!.Title,
                topic.Title,
                topic.Description,
                topic.ImageUrl,
                topic.OrderIndex))
            .ToListAsync();
    }

    public async Task<TopicDetailDto?> GetTopicAsync(int id)
    {
        return await db.Topics
            .AsNoTracking()
            .Where(topic => topic.Id == id && topic.IsActive)
            .Select(topic => new TopicDetailDto(
                topic.Id,
                topic.ChapterId,
                topic.Chapter!.Title,
                topic.Title,
                topic.Description,
                topic.ImageUrl,
                topic.OrderIndex,
                topic.Vocabulary
                    .OrderBy(word => word.Id)
                    .Select(word => new VocabularyDto(
                        word.Id,
                        word.TopicId,
                        word.Word,
                        word.Translation,
                        word.ExampleSentence,
                        word.PartOfSpeech))
                    .ToList()))
            .SingleOrDefaultAsync();
    }

    public async Task<IReadOnlyList<VocabularyDto>> GetVocabularyAsync(int topicId)
    {
        return await db.Vocabulary
            .AsNoTracking()
            .Where(word => word.TopicId == topicId && word.Topic!.IsActive)
            .OrderBy(word => word.Id)
            .Select(word => new VocabularyDto(
                word.Id,
                word.TopicId,
                word.Word,
                word.Translation,
                word.ExampleSentence,
                word.PartOfSpeech))
            .ToListAsync();
    }

    public async Task<IReadOnlyList<TestQuestionDto>> GetQuestionsForTopicAsync(int topicId)
    {
        return await testService.GetQuestionsAsync("topic", topicId);
    }

    public async Task<IReadOnlyList<TestScopeDto>> GetTestScopesAsync()
    {
        var scopes = new List<TestScopeDto> { new("all", null, "All topics") };

        var chapters = await db.Chapters
            .AsNoTracking()
            .Where(chapter => chapter.Topics.Count(topic => topic.IsActive && topic.Questions.Any(question => question.IsActive)) > 1)
            .OrderBy(chapter => chapter.OrderIndex)
            .Select(chapter => new TestScopeDto("chapter", chapter.Id, $"Chapter {chapter.OrderIndex} - {chapter.Title}"))
            .ToListAsync();

        var topics = await db.Topics
            .AsNoTracking()
            .Where(topic => topic.IsActive && topic.Questions.Any(question => question.IsActive))
            .OrderBy(topic => topic.Chapter!.OrderIndex)
            .ThenBy(topic => topic.OrderIndex)
            .Select(topic => new TestScopeDto("topic", topic.Id, topic.Title == "Vocabulary" ? topic.Chapter!.Title : topic.Chapter!.Title + " - " + topic.Title))
            .ToListAsync();

        scopes.AddRange(chapters);
        scopes.AddRange(topics);
        return scopes;
    }
}
