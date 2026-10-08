namespace Fluffy.Api.Models;

public sealed class Chapter
{
    public int Id { get; set; }
    public required string Title { get; set; }
    public string? Description { get; set; }
    public int OrderIndex { get; set; }
    public ICollection<Topic> Topics { get; set; } = new List<Topic>();
}
