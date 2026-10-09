using Fluffy.Api.Data;
using Fluffy.Api.DTOs;
using Microsoft.EntityFrameworkCore;

namespace Fluffy.Api.Services;

public sealed class LeaderboardService(FluffyDbContext db)
{
    public async Task<LeaderboardDto> GetAsync(string period, int? topicId)
    {
        var results = db.TestResults.AsNoTracking().Where(result => result.TotalQuestions > 0 && result.UserName.Trim() != "");
        if (period == "week")
        {
            var since = DateTime.UtcNow.AddDays(-7);
            results = results.Where(result => result.CompletedAt >= since);
        }
        if (topicId.HasValue) results = results.Where(result => result.TopicId == topicId.Value);

        var players = results.GroupBy(result => result.UserName.Trim().ToUpper())
            .Select(group => new
            {
                UserName = group.Min(result => result.UserName.Trim())!,
                Points = group.Sum(result => (long)result.Score),
                Questions = group.Sum(result => (long)result.TotalQuestions),
                CompletedTests = group.Count(),
                LastCompletedAt = group.Max(result => result.CompletedAt)
            });
        var totalPlayers = await players.CountAsync();
        var totalTests = await results.CountAsync();
        var ranked = await players.OrderByDescending(player => player.Points)
            .ThenByDescending(player => (decimal)player.Points / player.Questions)
            .ThenBy(player => player.UserName)
            .Take(100).ToListAsync();

        return new LeaderboardDto(totalPlayers, totalTests, ranked.Select((player, index) => new LeaderboardEntryDto(
            index + 1, player.UserName, player.Points,
            Math.Round((decimal)player.Points / player.Questions * 100, 2),
            player.CompletedTests, player.LastCompletedAt)).ToList());
    }
}
