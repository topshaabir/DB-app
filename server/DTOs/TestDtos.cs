namespace Fluffy.Api.DTOs;

public sealed record TestAnswerSubmissionDto(int QuestionId, int? AnswerId, string? AnswerText);

public sealed record SubmitTestRequestDto(
    string UserName,
    string ScopeType,
    int? ScopeId,
    IReadOnlyList<int>? QuestionIds,
    string? ParentResultId,
    IReadOnlyList<TestAnswerSubmissionDto> Answers);

public sealed record TestMistakeDto(
    int QuestionId,
    int TopicId,
    string TopicTitle,
    string QuestionText,
    string QuestionType,
    string UserAnswer,
    string CorrectAnswer,
    string? ExampleSentence,
    string? Explanation);

public sealed record TestResultDto(
    int Id,
    string UserName,
    int? TopicId,
    string? ScopeLabel,
    int Score,
    int TotalQuestions,
    decimal Percentage,
    DateTime CompletedAt,
    string? ParentResultId,
    IReadOnlyList<TestMistakeDto> Mistakes);

public sealed record CreateTestResultDto(
    string UserName,
    int? TopicId,
    string? ScopeLabel,
    int Score,
    int TotalQuestions);

public sealed record ProfileStatsDto(
    string UserName,
    int CompletedTests,
    int BestScore,
    double AverageScore,
    decimal AveragePercentage,
    int TotalLearnedTopics,
    IReadOnlyList<TestResultDto> RecentResults);
