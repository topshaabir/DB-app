namespace Fluffy.Api.DTOs;

public sealed record ChapterSummaryDto(int Id, string Title, string? Description, int OrderIndex, IReadOnlyList<TopicSummaryDto> Topics);

public sealed record TopicSummaryDto(int Id, int ChapterId, string ChapterTitle, string Title, string? Description, string? ImageUrl, int OrderIndex);

public sealed record TopicDetailDto(
    int Id,
    int ChapterId,
    string ChapterTitle,
    string Title,
    string? Description,
    string? ImageUrl,
    int OrderIndex,
    IReadOnlyList<VocabularyDto> Vocabulary);

public sealed record VocabularyDto(
    int Id,
    int TopicId,
    string Word,
    string Translation,
    string? TranslationRu,
    string? TranslationKz,
    string ExampleSentence,
    string? ExampleTranslation,
    string? Ipa,
    string? PartOfSpeech);

public sealed record AnswerOptionDto(int Id, string AnswerText);

public sealed record TestQuestionDto(
    int Id,
    int TopicId,
    string TopicTitle,
    string QuestionText,
    string QuestionType,
    IReadOnlyList<AnswerOptionDto> Answers,
    IReadOnlyList<string> CorrectAnswers,
    string? ExampleSentence,
    string? Explanation);

public sealed record TestScopeDto(string Type, int? Id, string Label);
