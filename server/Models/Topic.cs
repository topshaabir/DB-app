namespace Fluffy.Api.Models;

public sealed class Topic
{
    public int Id { get; set; }
    public int ChapterId { get; set; }
    public required string Title { get; set; }
    public string? Description { get; set; }
    public string? ImageUrl { get; set; }
    public int OrderIndex { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; }

    public Chapter? Chapter { get; set; }
    public ICollection<Vocabulary> Vocabulary { get; set; } = new List<Vocabulary>();
    public ICollection<TestQuestion> Questions { get; set; } = new List<TestQuestion>();
    public ICollection<TestResult> TestResults { get; set; } = new List<TestResult>();
}
