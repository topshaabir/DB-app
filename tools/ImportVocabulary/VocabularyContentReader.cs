using System.Text.RegularExpressions;

namespace Fluffy.ImportVocabulary;

public sealed record ImportedWord(string Word, string Translation);
public sealed record ImportedTopic(string Title, string? Description, List<ImportedWord> Words);
public sealed record ImportedChapter(string Title, string Description, List<ImportedTopic> Topics);

public static class VocabularyContentReader
{
    public static List<ImportedChapter> Read(IEnumerable<string> lines)
    {
        var chapters = new List<ImportedChapter>();
        ImportedTopic? currentTopic = null;
        foreach (var rawLine in lines)
        {
            var line = rawLine.Trim();
            if (line.Length == 0) continue;
            var parts = line.Split(" — ", 2, StringSplitOptions.TrimEntries);
            if (parts.Length != 2 || parts.Any(part => part.Length == 0))
                throw new InvalidDataException($"Invalid entry: {line}");
            var chapterHeading = Regex.Match(parts[0], @"^Chapter-\d+\.\s*(.+)$");
            if (chapterHeading.Success)
            {
                var title = chapterHeading.Groups[1].Value;
                if (title.Length > 140 || parts[1].Length > 500 || chapters.Any(chapter => chapter.Title.Equals(title, StringComparison.OrdinalIgnoreCase)))
                    throw new InvalidDataException($"Invalid or duplicate chapter: {title}");
                chapters.Add(new(title, parts[1], []));
                currentTopic = null;
                continue;
            }
            if (chapters.Count == 0) throw new InvalidDataException("Content must start with a chapter.");
            var topicHeading = Regex.Match(parts[0], @"^Topic-\d+\.\s*(.+)$");
            if (topicHeading.Success)
            {
                var title = topicHeading.Groups[1].Value;
                if (title.Length > 180 || parts[1].Length > 600 || chapters[^1].Topics.Any(topic => topic.Title.Equals(title, StringComparison.OrdinalIgnoreCase)))
                    throw new InvalidDataException($"Invalid or duplicate topic: {title}");
                currentTopic = new(title, parts[1], []);
                chapters[^1].Topics.Add(currentTopic);
                continue;
            }
            if (parts[0].Length > 120 || parts[1].Length > 160)
                throw new InvalidDataException($"Invalid vocabulary: {line}");
            if (currentTopic is null)
            {
                currentTopic = new("Vocabulary", null, []);
                chapters[^1].Topics.Add(currentTopic);
            }
            if (currentTopic.Words.Any(word => word.Word.Equals(parts[0], StringComparison.OrdinalIgnoreCase)))
                throw new InvalidDataException($"Duplicate word in {currentTopic.Title}: {parts[0]}");
            currentTopic.Words.Add(new(parts[0], parts[1]));
        }
        if (chapters.Count == 0) throw new InvalidDataException("No chapters found.");
        return chapters;
    }
}
