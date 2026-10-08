namespace Fluffy.Api.Models;

public sealed class TestAnswer
{
    public int Id { get; set; }
    public int QuestionId { get; set; }
    public required string AnswerText { get; set; }
    public bool IsCorrect { get; set; }

    public TestQuestion? Question { get; set; }
}
