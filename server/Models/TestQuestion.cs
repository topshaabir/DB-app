namespace Fluffy.Api.Models;

public sealed class TestQuestion
{
    public int Id { get; set; }
    public int TopicId { get; set; }
    public required string QuestionText { get; set; }
    public required string QuestionType { get; set; }
    public DateTime CreatedAt { get; set; }
    public bool IsActive { get; set; } = true;

    public Topic? Topic { get; set; }
    public ICollection<TestAnswer> Answers { get; set; } = new List<TestAnswer>();
}
