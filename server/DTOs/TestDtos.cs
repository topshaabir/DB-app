namespace Fluffy.Api.DTOs;

public sealed record TestAnswerSubmissionDto(int QuestionId, int AnswerId);

public sealed record SubmitTestRequestDto(
    string UserName,
    string ScopeType,
    int? ScopeId,
    IReadOnlyList<TestAnswerSubmissionDto> Answers);

public sealed record TestResultDto(
    int Id,
    string UserName,
    int? TopicId,
    string? ScopeLabel,
    int Score,
    int TotalQuestions,
    decimal Percentage,
    DateTime CompletedAt);

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
