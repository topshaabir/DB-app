using System.Text.Json;
using Fluffy.Api.Data;
using Fluffy.Api.Models;
using Fluffy.Api.DTOs;
using Fluffy.Api.Services;
using Microsoft.EntityFrameworkCore;

internal static class RefreshTests
{
    public static async Task RunAsync(string settingsPath)
    {
        using var settings = JsonDocument.Parse(File.ReadAllText(settingsPath));
        var connection = settings.RootElement.GetProperty("ConnectionStrings").GetProperty("DefaultConnection").GetString();
        await using var db = new FluffyDbContext(new DbContextOptionsBuilder<FluffyDbContext>().UseSqlServer(connection).Options);
        await using var transaction = await db.Database.BeginTransactionAsync(System.Data.IsolationLevel.Serializable);
        var traveling = await db.Chapters.Where(x => x.Title == "Traveling" || x.Title == "Travelling").ToListAsync();
        db.Chapters.RemoveRange(traveling);
        await db.SaveChangesAsync();
        var chapters = await db.Chapters.OrderBy(x => x.OrderIndex).ToListAsync();
        for (var i = 0; i < chapters.Count; i++) chapters[i].OrderIndex = i + 1;
        var words = await db.Vocabulary.Include(x => x.Topic).Where(x => x.Topic!.IsActive).OrderBy(x => x.Id).ToListAsync();
        var added = 0;
        foreach (var word in words)
        {
            var text = $"Выберите перевод: {word.Word}";
            if (await db.TestQuestions.AnyAsync(x => x.TopicId == word.TopicId && x.QuestionText == text)) continue;
            // Use other chapters for distractors to avoid near-synonyms within a vocabulary group.
            var wrong = words.Where(x => x.Topic!.ChapterId != word.Topic!.ChapterId && x.Translation != word.Translation)
                .Select(x => x.Translation).Distinct().OrderBy(_ => Random.Shared.Next()).Take(3).ToList();
            if (wrong.Count != 3) throw new InvalidDataException("Not enough distinct distractors.");
            var options = wrong.Select(x => new TestAnswer { AnswerText = x, IsCorrect = false })
                .Append(new TestAnswer { AnswerText = word.Translation, IsCorrect = true })
                .OrderBy(_ => Random.Shared.Next()).ToList();
            db.TestQuestions.Add(new TestQuestion { TopicId = word.TopicId, QuestionText = text, QuestionType = "MultipleChoice", CreatedAt = DateTime.UtcNow, Answers = options });
            added++;
        }
        await db.SaveChangesAsync();
        var questions = await db.TestQuestions.Include(x => x.Answers).ToListAsync();
        if (questions.Any(x => x.Answers.Count < 2 || x.Answers.Count(a => a.IsCorrect) != 1))
            throw new InvalidDataException("Invalid answer options.");
        var service = new TestService(db);
        var correct = questions.Select(x => new TestAnswerSubmissionDto(x.Id, x.Answers.Single(a => a.IsCorrect).Id)).ToList();
        var request = new SubmitTestRequestDto("Import verification", "all", null, correct);
        var result = await service.SubmitAsync(request);
        if (result is null || result.Score != questions.Count || result.Percentage != 100)
            throw new InvalidDataException("Scoring verification failed.");
        db.TestResults.Remove(await db.TestResults.SingleAsync(x => x.Id == result.Id));
        await db.SaveChangesAsync();
        if (await service.SubmitAsync(request with { Answers = correct.Skip(1).ToList() }) is not null
            || await service.SubmitAsync(request with { ScopeType = "invalid" }) is not null
            || await service.SubmitAsync(request with { Answers = correct.Select(x => x with { AnswerId = -1 }).ToList() }) is not null)
            throw new InvalidDataException("Invalid submissions were accepted.");
        Console.WriteLine("Scoring verified: 100% for correct answers; incomplete, invalid scope and foreign answers rejected.");
        await transaction.CommitAsync();
        Console.WriteLine($"Removed {traveling.Count} Traveling chapters; added {added} questions; verified {questions.Count} questions.");
    }
}
