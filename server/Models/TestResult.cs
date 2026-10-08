namespace Fluffy.Api.Models;

public sealed class TestResult
{
    public int Id { get; set; }
    public required string UserName { get; set; }
    public int? TopicId { get; set; }
    public string? ScopeLabel { get; set; }
    public int Score { get; set; }
    public int TotalQuestions { get; set; }
    public decimal Percentage { get; set; }
    public DateTime CompletedAt { get; set; }

    public Topic? Topic { get; set; }
}
