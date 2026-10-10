using Fluffy.Api.Data;
using Fluffy.Api.DTOs;
using Microsoft.EntityFrameworkCore;

namespace Fluffy.Api.Services;

public sealed class ProfileService(FluffyDbContext db)
{
    public async Task<ProfileStatsDto> GetProfileAsync(string userName)
    {
        var normalizedName = userName.Trim();

        var results = await db.TestResults
            .AsNoTracking()
            .Where(result => result.UserName == normalizedName)
            .OrderByDescending(result => result.CompletedAt)
            .Select(result => new TestResultDto(
                result.Id,
                result.UserName,
                result.TopicId,
                result.ScopeLabel,
                result.Score,
                result.TotalQuestions,
                result.Percentage,
                result.CompletedAt,
                result.ParentResultId,
                Array.Empty<TestMistakeDto>()))
            .ToListAsync();

        var learnedTopicCount = results
            .Where(result => result.TopicId.HasValue)
            .Select(result => result.TopicId!.Value)
            .Distinct()
            .Count();

        return new ProfileStatsDto(
            normalizedName,
            results.Count,
            results.Count == 0 ? 0 : results.Max(result => result.Score),
            results.Count == 0 ? 0 : Math.Round(results.Average(result => result.Score), 2),
            results.Count == 0 ? 0 : Math.Round(results.Average(result => result.Percentage), 2),
            learnedTopicCount,
            results.Take(5).ToList());
    }
}
