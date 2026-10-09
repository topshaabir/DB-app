namespace Fluffy.Api.Services;

public static class TopicNaming
{
    public static string DisplayTitle(string title, string chapterTitle) =>
        string.Equals(title, "Vocabulary", StringComparison.OrdinalIgnoreCase) ? chapterTitle : title;
}
