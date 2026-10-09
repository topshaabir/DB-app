using Fluffy.Api.Data;
using Fluffy.Api.Models;
using Fluffy.Api.Services;
using Microsoft.EntityFrameworkCore;

static void Check(bool condition, string message)
{
    if (!condition) throw new InvalidOperationException(message);
}

static Vocabulary Word(int topic, string word, string translation) => new()
{
    TopicId = topic, Word = word, Translation = translation, ExampleSentence = ""
};

var words = new[]
{
    Word(1, "apple", "яблоко"), Word(1, "bread", "хлеб"), Word(1, "milk", "молоко"),
    Word(1, "cheese", "сыр"), Word(1, "loaf", "ХЛЕБ"), Word(1, "apple", "другое значение"),
    Word(1, "fruit", "яблоко, фрукт"), Word(2, "ticket", "билет")
};
var question = new TestQuestion
{
    Id = 1, TopicId = 1, QuestionText = TranslationChoices.QuestionPrefix + "apple", QuestionType = "MultipleChoice",
    Answers = [new() { Id = 11, AnswerText = "яблоко", IsCorrect = true },
        new() { Id = 12, AnswerText = "билет" }, new() { Id = 13, AnswerText = "семья" }, new() { Id = 14, AnswerText = "поезд" }]
};
for (var attempt = 0; attempt < 30; attempt++)
{
    var options = TranslationChoices.ForQuestion(question, words);
    Check(options.Count == 4, "Expected four choices.");
    Check(options.Single(option => option.Id == 11).AnswerText == "яблоко", "Correct answer ID changed.");
    Check(options.Select(option => option.AnswerText).Distinct(StringComparer.OrdinalIgnoreCase).Count() == 4, "Duplicate choices.");
    Check(options.Where(option => option.Id != 11).All(option => new[] { "хлеб", "молоко", "сыр" }.Contains(option.AnswerText, StringComparer.OrdinalIgnoreCase)), "Foreign topic or ambiguous choice.");
    Check(options.Select(option => option.Id).Order().SequenceEqual(new[] { 11, 12, 13, 14 }), "Answer IDs changed.");
}
var limited = TranslationChoices.ForQuestion(question, words.Take(2));
Check(limited.Count == 2 && limited.Any(option => option.Id == 11), "Small topics must not borrow foreign translations.");
Check(TopicNaming.DisplayTitle("Vocabulary", "Food") == "Food", "Generic topic title not resolved.");
Check(TopicNaming.DisplayTitle("Cooking verbs", "Food") == "Cooking verbs", "Named topic was changed.");
Console.WriteLine("PASS: same-topic choices, synonyms, duplicates, small topics, stable scoring IDs and topic titles.");

if (!args.Contains("--database")) return;
await using var db = new FluffyDbContext(new DbContextOptionsBuilder<FluffyDbContext>()
    .UseSqlServer("Server=.\\SQLEXPRESS;Database=FluffyDb;Trusted_Connection=True;Encrypt=False;TrustServerCertificate=True").Options);
await using var transaction = await db.Database.BeginTransactionAsync();
var prefix = "Checks-" + Guid.NewGuid().ToString("N");
var now = DateTime.UtcNow;
TestResult Result(string name, int score, int total, DateTime date) => new()
{
    UserName = name, Score = score, TotalQuestions = total, Percentage = total == 0 ? 0 : (decimal)score / total * 100, CompletedAt = date
};
db.TestResults.AddRange(Result(prefix + "-Alice", 8, 10, now), Result(" " + prefix + "-alice ", 9, 10, now),
    Result(prefix + "-Bob", 17, 30, now), Result(prefix + "-Old", 50, 50, now.AddDays(-8)), Result(prefix + "-Empty", 0, 0, now));
await db.SaveChangesAsync();
var service = new LeaderboardService(db);
var week = await service.GetAsync("week", null);
var alice = week.Entries.Single(entry => entry.UserName.Contains(prefix, StringComparison.OrdinalIgnoreCase) && entry.UserName.EndsWith("alice", StringComparison.OrdinalIgnoreCase));
var bob = week.Entries.Single(entry => entry.UserName == prefix + "-Bob");
Check(alice.Points == 17 && alice.CompletedTests == 2 && alice.Accuracy == 85, "Leaderboard aggregation or normalization failed.");
Check(alice.Rank < bob.Rank, "Accuracy tiebreaker failed.");
Check(!week.Entries.Any(entry => entry.UserName == prefix + "-Old" || entry.UserName == prefix + "-Empty"), "Period or empty-result filter failed.");
var all = await service.GetAsync("all", null);
Check(all.Entries.Any(entry => entry.UserName == prefix + "-Old"), "All-time result missing.");
var impossibleTopic = await service.GetAsync("all", int.MaxValue);
Check(impossibleTopic.TotalTests == 0 && impossibleTopic.Entries.Count == 0, "Topic filter failed.");
var testService = new TestService(db);
var questions = await testService.GetQuestionsAsync("all", null);
var vocabulary = await db.Vocabulary.AsNoTracking().ToListAsync();
var answers = await db.TestAnswers.AsNoTracking().Where(answer => answer.IsCorrect).ToListAsync();
foreach (var item in questions.Where(item => item.QuestionText.StartsWith(TranslationChoices.QuestionPrefix)))
{
    Check(item.Answers.All(option => vocabulary.Any(word => word.TopicId == item.TopicId && word.Translation.Equals(option.AnswerText, StringComparison.OrdinalIgnoreCase))), "Saved question has foreign-topic options.");
    Check(item.Answers.Any(option => answers.Any(answer => answer.QuestionId == item.Id && answer.Id == option.Id)), "Saved question lost its correct ID.");
}
var correctSubmission = questions.Select(item => new Fluffy.Api.DTOs.TestAnswerSubmissionDto(item.Id,
    answers.Single(answer => answer.QuestionId == item.Id).Id)).ToList();
var correctResult = await testService.SubmitAsync(new(prefix + "-Scoring", "all", null, correctSubmission));
Check(correctResult?.Score == questions.Count && correctResult.Percentage == 100, "Corrected choices broke scoring.");
var wrongSubmission = questions.Select(item => new Fluffy.Api.DTOs.TestAnswerSubmissionDto(item.Id,
    item.Answers.First(option => option.Id != answers.Single(answer => answer.QuestionId == item.Id).Id).Id)).ToList();
var wrongResult = await testService.SubmitAsync(new(prefix + "-Scoring", "all", null, wrongSubmission));
Check(wrongResult?.Score == 0, "Distractors were graded as correct.");
Check(await testService.SubmitAsync(new(prefix + "-Scoring", "all", null, correctSubmission.Skip(1).ToList())) is null, "Incomplete submission accepted.");
await transaction.RollbackAsync();
Console.WriteLine($"PASS: SQL leaderboard grouping, accuracy, ties, week/topic filters and {questions.Count} stored questions; 100%/0% scoring and incomplete submission checks. Fixtures rolled back.");
