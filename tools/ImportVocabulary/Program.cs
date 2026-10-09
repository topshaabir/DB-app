using System.Text.Json;
using Fluffy.ImportVocabulary;
using Fluffy.Api.Data;
using Fluffy.Api.Models;
using Microsoft.EntityFrameworkCore;

var initialize = args.Length == 3 && args[0] == "--initialize";
var synchronize = args.Length == 3 && args[0] == "--sync";
if (initialize)
{
    if (string.IsNullOrWhiteSpace(Environment.GetEnvironmentVariable("ConnectionStrings__DefaultConnection")))
        throw new InvalidOperationException("Set ConnectionStrings__DefaultConnection before initializing a hosted database.");
}
if (initialize || synchronize) args = args.Skip(1).ToArray();

if (args.Length == 2 && args[0] == "--refresh-tests")
{
    await RefreshTests.RunAsync(args[1]);
    return;
}

if (args.Length != 2)
    throw new ArgumentException("Usage: ImportVocabulary [--initialize|--sync] <vocabulary-file> <appsettings-file>");

var sections = VocabularyContentReader.Read(File.ReadLines(args[0]));

using var settings = JsonDocument.Parse(File.ReadAllText(args[1]));
var connection = Environment.GetEnvironmentVariable("ConnectionStrings__DefaultConnection")
    ?? settings.RootElement.GetProperty("ConnectionStrings").GetProperty("DefaultConnection").GetString();
var options = new DbContextOptionsBuilder<FluffyDbContext>().UseSqlServer(connection).Options;
await using var db = new FluffyDbContext(options);
if (initialize) await db.Database.MigrateAsync();
await using var transaction = await db.Database.BeginTransactionAsync(System.Data.IsolationLevel.Serializable);
var nextOrder = (await db.Chapters.MaxAsync(x => (int?)x.OrderIndex) ?? 0) + 1;
var added = 0;
foreach (var section in sections)
{
    var chapter = await db.Chapters.SingleOrDefaultAsync(x => x.Title == section.Title);
    if (chapter is null)
    {
        chapter = new Chapter { Title = section.Title, Description = section.Description, OrderIndex = nextOrder++ };
        db.Chapters.Add(chapter);
        await db.SaveChangesAsync();
    }
    if (section.Topics.Count == 0)
    {
        Console.WriteLine($"{section.Title}: 0 words (empty chapter)");
        continue;
    }
    foreach (var topicSection in section.Topics)
    {
        var topic = await db.Topics.SingleOrDefaultAsync(x => x.ChapterId == chapter.Id && x.Title == topicSection.Title);
        if (topic is null)
        {
            topic = new Topic { ChapterId = chapter.Id, Title = topicSection.Title, Description = topicSection.Description, OrderIndex = (await db.Topics.Where(x => x.ChapterId == chapter.Id).MaxAsync(x => (int?)x.OrderIndex) ?? 0) + 1, CreatedAt = DateTime.UtcNow };
            db.Topics.Add(topic);
            await db.SaveChangesAsync();
        }
        else if (topicSection.Description is not null) topic.Description = topicSection.Description;
        var existing = await db.Vocabulary.Where(x => x.TopicId == topic.Id).ToListAsync();
        foreach (var entry in topicSection.Words)
        {
            var matches = existing.Where(x => x.Word == entry.Word).ToList();
            if (matches.Count > 1) throw new InvalidDataException($"Duplicate existing word: {entry.Word}");
            var word = matches.SingleOrDefault();
            if (word is null)
            {
                word = new Vocabulary { TopicId = topic.Id, Word = entry.Word, Translation = entry.Translation, ExampleSentence = "", CreatedAt = DateTime.UtcNow };
                db.Vocabulary.Add(word);
                existing.Add(word);
                added++;
            }
            else word.Translation = entry.Translation;
        }
        await db.SaveChangesAsync();
        var saved = await db.Vocabulary.AsNoTracking().Where(x => x.TopicId == topic.Id).ToListAsync();
        if (topicSection.Words.Any(entry => saved.Count(x => x.Word == entry.Word && x.Translation == entry.Translation) != 1))
            throw new InvalidDataException($"Verification failed: {section.Title} / {topicSection.Title}");
        Console.WriteLine($"{section.Title} / {topicSection.Title}: {topicSection.Words.Count} words verified");
    }
}
await transaction.CommitAsync();
Console.WriteLine($"Committed: {added} added, {sections.Sum(x => x.Topics.Sum(topic => topic.Words.Count))} verified.");
if (initialize || synchronize) await RefreshTests.RunAsync(args[1]);
