using Fluffy.Api.Data;
using Fluffy.Api.DTOs;
using Fluffy.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace Fluffy.Api.Services;

public sealed class TestService(FluffyDbContext db)
{
    public async Task<IReadOnlyList<TestQuestionDto>> GetQuestionsAsync(string scopeType, int? scopeId)
    {
        var questions = await BuildQuestionQuery(scopeType, scopeId)
            .AsNoTracking()
            .Include(question => question.Answers)
            .Include(question => question.Topic!).ThenInclude(topic => topic.Chapter)
            .Where(question => question.IsActive && question.Topic!.IsActive)
            .OrderBy(question => question.Topic!.Chapter!.OrderIndex)
            .ThenBy(question => question.Topic!.OrderIndex)
            .ThenBy(question => question.Id)
            .ToListAsync();

        var topicIds = questions.Select(question => question.TopicId).Distinct().ToList();
        var vocabulary = await db.Vocabulary.AsNoTracking().Where(word => topicIds.Contains(word.TopicId)).ToListAsync();
        var vocabularyByTopic = vocabulary.ToLookup(word => word.TopicId);
        return questions
            .Select(question => new TestQuestionDto(
                question.Id,
                question.TopicId,
                TopicNaming.DisplayTitle(question.Topic!.Title, question.Topic.Chapter!.Title),
                question.QuestionText,
                question.QuestionType,
                TranslationChoices.ForQuestion(question, vocabularyByTopic[question.TopicId])))
            .ToList();
    }

    public async Task<TestResultDto?> SubmitAsync(SubmitTestRequestDto request)
    {
        var userName = request.UserName.Trim();
        if (string.IsNullOrWhiteSpace(userName) || userName.Length > 120 || request.Answers is null || request.Answers.Count == 0)
        {
            return null;
        }

        var allowedQuestionIds = await BuildQuestionQuery(request.ScopeType, request.ScopeId)
            .Where(question => question.IsActive && question.Topic!.IsActive)
            .Select(question => question.Id)
            .ToListAsync();

        if (allowedQuestionIds.Count == 0)
        {
            return null;
        }

        if (request.Answers.Count != allowedQuestionIds.Count
            || request.Answers.Select(answer => answer.QuestionId).Distinct().Count() != allowedQuestionIds.Count
            || request.Answers.Any(answer => !allowedQuestionIds.Contains(answer.QuestionId)))
        {
            return null;
        }

        var options = await db.TestAnswers.AsNoTracking()
            .Where(answer => allowedQuestionIds.Contains(answer.QuestionId)).ToListAsync();
        if (request.Answers.Any(answer => !options.Any(option => option.QuestionId == answer.QuestionId && option.Id == answer.AnswerId))
            || allowedQuestionIds.Any(id => options.Count(answer => answer.QuestionId == id && answer.IsCorrect) != 1))
        {
            return null;
        }
        var submittedAnswers = request.Answers.ToDictionary(answer => answer.QuestionId, answer => answer.AnswerId);

        var correctAnswers = await db.TestAnswers
            .AsNoTracking()
            .Where(answer => answer.IsCorrect && allowedQuestionIds.Contains(answer.QuestionId))
            .ToDictionaryAsync(answer => answer.QuestionId, answer => answer.Id);

        var score = correctAnswers.Count(correct =>
            submittedAnswers.TryGetValue(correct.Key, out var selectedAnswerId)
            && selectedAnswerId == correct.Value);

        var total = allowedQuestionIds.Count;
        var percentage = total == 0 ? 0 : Math.Round((decimal)score / total * 100, 2);
        var scopeLabel = await ResolveScopeLabelAsync(request.ScopeType, request.ScopeId);

        var result = new TestResult
        {
            UserName = userName,
            TopicId = string.Equals(request.ScopeType, "topic", StringComparison.OrdinalIgnoreCase) ? request.ScopeId : null,
            ScopeLabel = scopeLabel,
            Score = score,
            TotalQuestions = total,
            Percentage = percentage,
            CompletedAt = DateTime.UtcNow
        };

        db.TestResults.Add(result);
        await db.SaveChangesAsync();

        return ToDto(result);
    }

    public async Task<TestResultDto> CreateResultAsync(CreateTestResultDto request)
    {
        var total = Math.Max(0, request.TotalQuestions);
        var score = Math.Clamp(request.Score, 0, total);
        var result = new TestResult
        {
            UserName = request.UserName.Trim(),
            TopicId = request.TopicId,
            ScopeLabel = request.ScopeLabel,
            Score = score,
            TotalQuestions = total,
            Percentage = total == 0 ? 0 : Math.Round((decimal)score / total * 100, 2),
            CompletedAt = DateTime.UtcNow
        };

        db.TestResults.Add(result);
        await db.SaveChangesAsync();
        return ToDto(result);
    }

    public async Task<IReadOnlyList<TestResultDto>> GetResultsByNameAsync(string name)
    {
        var normalizedName = name.Trim();
        return await db.TestResults
            .AsNoTracking()
            .Where(result => result.UserName == normalizedName)
            .OrderByDescending(result => result.CompletedAt)
            .Select(result => new TestResultDto(
                result.Id,
                result.UserName,
                result.TopicId,
                result.ScopeLabel,
                result.Score,
                result.TotalQuestions,
                result.Percentage,
                result.CompletedAt))
            .ToListAsync();
    }

    private IQueryable<TestQuestion> BuildQuestionQuery(string scopeType, int? scopeId)
    {
        var normalizedScope = scopeType?.Trim().ToLowerInvariant();
        var query = db.TestQuestions.AsQueryable();

        return normalizedScope switch
        {
            "topic" when scopeId.HasValue => query.Where(question => question.TopicId == scopeId.Value),
            "chapter" when scopeId.HasValue => query.Where(question => question.Topic!.ChapterId == scopeId.Value),
            "all" when !scopeId.HasValue => query,
            _ => query.Where(question => false)
        };
    }

    private async Task<string> ResolveScopeLabelAsync(string scopeType, int? scopeId)
    {
        var normalizedScope = scopeType.Trim().ToLowerInvariant();

        if (normalizedScope == "topic" && scopeId.HasValue)
        {
            return await db.Topics
                .Where(topic => topic.Id == scopeId.Value)
                .Select(topic => TopicNaming.DisplayTitle(topic.Title, topic.Chapter!.Title))
                .SingleOrDefaultAsync() ?? "Topic";
        }

        if (normalizedScope == "chapter" && scopeId.HasValue)
        {
            return await db.Chapters
                .Where(chapter => chapter.Id == scopeId.Value)
                .Select(chapter => $"Chapter {chapter.OrderIndex} - {chapter.Title}")
                .SingleOrDefaultAsync() ?? "Chapter";
        }

        return "All topics";
    }

    private static TestResultDto ToDto(TestResult result)
    {
        return new TestResultDto(
            result.Id,
            result.UserName,
            result.TopicId,
            result.ScopeLabel,
            result.Score,
            result.TotalQuestions,
            result.Percentage,
            result.CompletedAt);
    }
}
