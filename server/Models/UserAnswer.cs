namespace Fluffy.Api.Models;

public sealed class UserAnswer
{
    public int Id { get; set; }
    public int TestResultId { get; set; }
    public int QuestionId { get; set; }
    public int? AnswerId { get; set; }
    public string? AnswerText { get; set; }
    public bool IsCorrect { get; set; }
    public string CorrectAnswerText { get; set; } = string.Empty;
    public string? Explanation { get; set; }

    public TestResult? TestResult { get; set; }
    public TestQuestion? Question { get; set; }
    public TestAnswer? Answer { get; set; }
}
