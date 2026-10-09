namespace Fluffy.Api.DTOs;

public sealed record LeaderboardEntryDto(int Rank, string UserName, long Points, decimal Accuracy, int CompletedTests, DateTime LastCompletedAt);
public sealed record LeaderboardDto(int TotalPlayers, int TotalTests, IReadOnlyList<LeaderboardEntryDto> Entries);
