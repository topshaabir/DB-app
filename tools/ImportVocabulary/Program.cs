using System.Text.Json;
using System.Text.RegularExpressions;
using Fluffy.Api.Data;
using Fluffy.Api.Models;
using Microsoft.EntityFrameworkCore;

if (args.Length == 2 && args[0] == "--refresh-tests")
{
    await RefreshTests.RunAsync(args[1]);
    return;
}

if (args.Length != 2)
    throw new ArgumentException("Usage: ImportVocabulary <vocabulary-file> <appsettings-file>");

var sections = new List<(string Title, string Description, List<(string Word, string Translation)> Words)>();
foreach (var rawLine in File.ReadLines(args[0]))
{
    var line = rawLine.Trim();
    if (line.Length == 0) continue;
    var parts = line.Split(" — ", 2, StringSplitOptions.TrimEntries);
    if (parts.Length != 2) throw new InvalidDataException($"Invalid entry: {line}");
    var heading = Regex.Match(parts[0], @"^Chapter-\d+\.\s*(.+)$");
    if (heading.Success)
        sections.Add((heading.Groups[1].Value, parts[1], new()));
    else
    {
        if (sections.Count == 0 || parts[0].Length > 120 || parts[1].Length > 160)
            throw new InvalidDataException($"Invalid vocabulary: {line}");
        sections[^1].Words.Add((parts[0], parts[1]));
    }
}
if (sections.Count == 0) throw new InvalidDataException("No chapters found.");

using var settings = JsonDocument.Parse(File.ReadAllText(args[1]));
var connection = settings.RootElement.GetProperty("ConnectionStrings").GetProperty("DefaultConnection").GetString();
var options = new DbContextOptionsBuilder<FluffyDbContext>().UseSqlServer(connection).Options;
await using var db = new FluffyDbContext(options);
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
    if (section.Words.Count == 0)
    {
        Console.WriteLine($"{section.Title}: 0 words (empty chapter)");
        continue;
    }
    var topic = await db.Topics.SingleOrDefaultAsync(x => x.ChapterId == chapter.Id && x.Title == "Vocabulary");
    if (topic is null)
    {
        topic = new Topic { ChapterId = chapter.Id, Title = "Vocabulary", OrderIndex = (await db.Topics.Where(x => x.ChapterId == chapter.Id).MaxAsync(x => (int?)x.OrderIndex) ?? 0) + 1, CreatedAt = DateTime.UtcNow };
        db.Topics.Add(topic);
        await db.SaveChangesAsync();
    }
    var existing = await db.Vocabulary.Where(x => x.TopicId == topic.Id).ToListAsync();
    foreach (var entry in section.Words)
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
    if (section.Words.Any(entry => saved.Count(x => x.Word == entry.Word && x.Translation == entry.Translation) != 1))
        throw new InvalidDataException($"Verification failed: {section.Title}");
    Console.WriteLine($"{section.Title}: {section.Words.Count} words verified");
}
await transaction.CommitAsync();
Console.WriteLine($"Committed: {added} added, {sections.Sum(x => x.Words.Count)} verified.");
