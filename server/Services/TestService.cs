using Fluffy.Api.Data;
using Fluffy.Api.DTOs;
using Fluffy.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace Fluffy.Api.Services;

public sealed class TestService(FluffyDbContext db)
{
    public async Task<IReadOnlyList<TestQuestionDto>> GetQuestionsAsync(string scopeType, int? scopeId, string? language = null)
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
                TranslationChoices.ForQuestion(question, vocabularyByTopic[question.TopicId], language),
                CorrectAnswers(question, vocabularyByTopic[question.TopicId], language),
                ExampleFor(question, vocabularyByTopic[question.TopicId]),
                ExplanationFor(question)))
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
        if (request.QuestionIds is { Count: > 0 })
        {
            var requested = request.QuestionIds.Distinct().ToList();
            if (requested.Count != request.QuestionIds.Count || requested.Any(id => !allowedQuestionIds.Contains(id)))
            {
                return null;
            }

            allowedQuestionIds = requested;
        }

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

        var questions = await db.TestQuestions
            .Include(question => question.Topic!).ThenInclude(topic => topic.Chapter)
            .Include(question => question.Answers)
            .Where(question => allowedQuestionIds.Contains(question.Id))
            .ToListAsync();
        var options = questions.SelectMany(question => question.Answers).ToList();
        if (allowedQuestionIds.Any(id => options.Count(answer => answer.QuestionId == id && answer.IsCorrect) < 1))
        {
            return null;
        }
        var submittedAnswers = request.Answers.ToDictionary(answer => answer.QuestionId);
        var vocabulary = await db.Vocabulary.AsNoTracking().Where(word => questions.Select(question => question.TopicId).Contains(word.TopicId)).ToListAsync();
        var vocabularyByTopic = vocabulary.ToLookup(word => word.TopicId);
        var scoredAnswers = new List<UserAnswer>();
        var mistakes = new List<TestMistakeDto>();
        var score = 0;

        foreach (var question in questions.OrderBy(question => allowedQuestionIds.IndexOf(question.Id)))
        {
            var submission = submittedAnswers[question.Id];
            if (submission.AnswerId.HasValue && !options.Any(option => option.QuestionId == question.Id && option.Id == submission.AnswerId.Value))
            {
                return null;
            }

            var correctTexts = CorrectAnswers(question, vocabularyByTopic[question.TopicId], null);
            var correctAnswerText = correctTexts.FirstOrDefault() ?? string.Empty;
            var selectedOption = submission.AnswerId.HasValue ? options.SingleOrDefault(option => option.Id == submission.AnswerId.Value) : null;
            var userAnswerText = selectedOption?.AnswerText ?? submission.AnswerText?.Trim() ?? string.Empty;
            var isCorrect = selectedOption is not null
                ? selectedOption.IsCorrect
                : correctTexts.Any(correct => NormalizeAnswer(correct) == NormalizeAnswer(userAnswerText));
            if (isCorrect) score++;

            scoredAnswers.Add(new UserAnswer
            {
                QuestionId = question.Id,
                AnswerId = submission.AnswerId,
                AnswerText = userAnswerText,
                IsCorrect = isCorrect,
                CorrectAnswerText = correctAnswerText,
                Explanation = ExplanationFor(question)
            });

            if (!isCorrect)
            {
                mistakes.Add(new TestMistakeDto(
                    question.Id,
                    question.TopicId,
                    TopicNaming.DisplayTitle(question.Topic!.Title, question.Topic.Chapter!.Title),
                    question.QuestionText,
                    question.QuestionType,
                    userAnswerText,
                    correctAnswerText,
                    ExampleFor(question, vocabularyByTopic[question.TopicId]),
                    ExplanationFor(question)));
            }
        }

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
            CompletedAt = DateTime.UtcNow,
            ParentResultId = request.ParentResultId
        };

        db.TestResults.Add(result);
        foreach (var answer in scoredAnswers)
        {
            result.UserAnswers.Add(answer);
        }
        await db.SaveChangesAsync();

        return ToDto(result, mistakes);
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
        return ToDto(result, []);
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
                result.CompletedAt,
                result.ParentResultId,
                Array.Empty<TestMistakeDto>()))
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

    private static IReadOnlyList<string> CorrectAnswers(TestQuestion question, IEnumerable<Vocabulary> vocabulary, string? language)
    {
        if (question.QuestionText.StartsWith(TranslationChoices.QuestionPrefix, StringComparison.Ordinal))
        {
            var wordText = question.QuestionText[TranslationChoices.QuestionPrefix.Length..];
            var word = vocabulary.FirstOrDefault(word => word.TopicId == question.TopicId && word.Word == wordText);
            if (word is not null)
            {
                return SplitAnswers(TranslationChoices.TranslationFor(word, language));
            }
        }

        return question.Answers.Where(answer => answer.IsCorrect).SelectMany(answer => SplitAnswers(answer.AnswerText)).ToList();
    }

    private static IReadOnlyList<string> SplitAnswers(string text)
    {
        return text.Split([',', ';', '/'], StringSplitOptions.TrimEntries | StringSplitOptions.RemoveEmptyEntries);
    }

    private static string? ExampleFor(TestQuestion question, IEnumerable<Vocabulary> vocabulary)
    {
        if (question.QuestionText.StartsWith(TranslationChoices.QuestionPrefix, StringComparison.Ordinal))
        {
            var wordText = question.QuestionText[TranslationChoices.QuestionPrefix.Length..];
            return vocabulary.FirstOrDefault(word => word.TopicId == question.TopicId && word.Word == wordText)?.ExampleSentence;
        }

        return null;
    }

    private static string? ExplanationFor(TestQuestion question)
    {
        return question.QuestionType.Contains("Blank", StringComparison.OrdinalIgnoreCase)
            ? "Use the preposition or word that completes the sentence naturally."
            : null;
    }

    private static string NormalizeAnswer(string answer)
    {
        return string.Join(' ', answer.Trim().ToLowerInvariant().Split(' ', StringSplitOptions.RemoveEmptyEntries));
    }

    private static TestResultDto ToDto(TestResult result, IReadOnlyList<TestMistakeDto> mistakes)
    {
        return new TestResultDto(
            result.Id,
            result.UserName,
            result.TopicId,
            result.ScopeLabel,
            result.Score,
            result.TotalQuestions,
            result.Percentage,
            result.CompletedAt,
            result.ParentResultId,
            mistakes);
    }
}
