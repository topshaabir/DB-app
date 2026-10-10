namespace Fluffy.Api.Models;

public sealed class Vocabulary
{
    public int Id { get; set; }
    public int TopicId { get; set; }
    public required string Word { get; set; }
    public required string Translation { get; set; }
    public string? TranslationRu { get; set; }
    public string? TranslationKz { get; set; }
    public required string ExampleSentence { get; set; }
    public string? ExampleTranslation { get; set; }
    public string? Ipa { get; set; }
    public string? PartOfSpeech { get; set; }
    public DateTime CreatedAt { get; set; }

    public Topic? Topic { get; set; }
}
