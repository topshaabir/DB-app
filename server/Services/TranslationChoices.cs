using Fluffy.Api.DTOs;
using Fluffy.Api.Models;

namespace Fluffy.Api.Services;

public static class TranslationChoices
{
    public const string QuestionPrefix = "Выберите перевод: ";

    public static List<string> GetDistractors(Vocabulary word, IEnumerable<Vocabulary> vocabulary, int count = 3)
    {
        var correctMeanings = word.Translation.Split([',', ';', '/'], StringSplitOptions.TrimEntries | StringSplitOptions.RemoveEmptyEntries);
        return vocabulary
            .Where(candidate => candidate.TopicId == word.TopicId
                && !string.Equals(candidate.Word.Trim(), word.Word.Trim(), StringComparison.OrdinalIgnoreCase)
                && !candidate.Translation.Split([',', ';', '/'], StringSplitOptions.TrimEntries | StringSplitOptions.RemoveEmptyEntries)
                    .Intersect(correctMeanings, StringComparer.OrdinalIgnoreCase).Any())
            .Select(candidate => candidate.Translation.Trim())
            .Where(translation => translation.Length > 0)
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .OrderBy(translation => Math.Abs(translation.Length - word.Translation.Trim().Length))
            .Take(Math.Max(count, 8))
            .OrderBy(_ => Random.Shared.Next())
            .Take(count)
            .ToList();
    }

    public static IReadOnlyList<AnswerOptionDto> ForQuestion(TestQuestion question, IEnumerable<Vocabulary> vocabulary)
    {
        if (!question.QuestionText.StartsWith(QuestionPrefix, StringComparison.Ordinal))
            return question.Answers.OrderBy(_ => Random.Shared.Next()).Select(answer => new AnswerOptionDto(answer.Id, answer.AnswerText)).ToList();

        var wordText = question.QuestionText[QuestionPrefix.Length..];
        var word = vocabulary.FirstOrDefault(word => word.TopicId == question.TopicId && word.Word == wordText);
        var correct = question.Answers.SingleOrDefault(answer => answer.IsCorrect);
        if (word is null || correct is null)
            throw new InvalidOperationException($"Translation question {question.Id} has no matching vocabulary or correct answer.");

        var distractors = GetDistractors(word, vocabulary, question.Answers.Count - 1);
        if (distractors.Count == 0)
            throw new InvalidOperationException($"Topic {question.TopicId} needs at least two distinct translations.");

        // Preserve answer IDs so existing server-side scoring still applies to corrected choices.
        return question.Answers.Where(answer => !answer.IsCorrect).OrderBy(answer => answer.Id)
            .Zip(distractors, (answer, text) => new AnswerOptionDto(answer.Id, text))
            .Append(new AnswerOptionDto(correct.Id, word.Translation))
            .OrderBy(_ => Random.Shared.Next())
            .ToList();
    }
}
