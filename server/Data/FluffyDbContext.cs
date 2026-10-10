using Fluffy.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace Fluffy.Api.Data;

public sealed class FluffyDbContext(DbContextOptions<FluffyDbContext> options) : DbContext(options)
{
    public DbSet<Chapter> Chapters => Set<Chapter>();
    public DbSet<Topic> Topics => Set<Topic>();
    public DbSet<Vocabulary> Vocabulary => Set<Vocabulary>();
    public DbSet<TestQuestion> TestQuestions => Set<TestQuestion>();
    public DbSet<TestAnswer> TestAnswers => Set<TestAnswer>();
    public DbSet<TestResult> TestResults => Set<TestResult>();
    public DbSet<UserAnswer> UserAnswers => Set<UserAnswer>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<Chapter>(entity =>
        {
            entity.Property(x => x.Title).HasMaxLength(140).IsRequired();
            entity.Property(x => x.Description).HasMaxLength(500);
            entity.HasIndex(x => x.OrderIndex);
        });

        modelBuilder.Entity<Topic>(entity =>
        {
            entity.Property(x => x.Title).HasMaxLength(180).IsRequired();
            entity.Property(x => x.Description).HasMaxLength(600);
            entity.Property(x => x.ImageUrl).HasMaxLength(1000);
            entity.HasIndex(x => new { x.ChapterId, x.OrderIndex });
            entity.HasOne(x => x.Chapter)
                .WithMany(x => x.Topics)
                .HasForeignKey(x => x.ChapterId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<Vocabulary>(entity =>
        {
            entity.Property(x => x.Word).HasMaxLength(120).IsRequired();
            entity.Property(x => x.Translation).HasMaxLength(160).IsRequired();
            entity.Property(x => x.TranslationRu).HasMaxLength(220);
            entity.Property(x => x.TranslationKz).HasMaxLength(220);
            entity.Property(x => x.ExampleSentence).HasMaxLength(600).IsRequired();
            entity.Property(x => x.ExampleTranslation).HasMaxLength(600);
            entity.Property(x => x.Ipa).HasMaxLength(120);
            entity.Property(x => x.PartOfSpeech).HasMaxLength(80);
            entity.HasOne(x => x.Topic)
                .WithMany(x => x.Vocabulary)
                .HasForeignKey(x => x.TopicId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<TestQuestion>(entity =>
        {
            entity.Property(x => x.QuestionText).HasMaxLength(600).IsRequired();
            entity.Property(x => x.QuestionType).HasMaxLength(80).IsRequired();
            entity.HasOne(x => x.Topic)
                .WithMany(x => x.Questions)
                .HasForeignKey(x => x.TopicId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<TestAnswer>(entity =>
        {
            entity.Property(x => x.AnswerText).HasMaxLength(300).IsRequired();
            entity.HasOne(x => x.Question)
                .WithMany(x => x.Answers)
                .HasForeignKey(x => x.QuestionId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<TestResult>(entity =>
        {
            entity.Property(x => x.UserName).HasMaxLength(120).IsRequired();
            entity.Property(x => x.ScopeLabel).HasMaxLength(220);
            entity.Property(x => x.ParentResultId).HasMaxLength(80);
            entity.Property(x => x.Percentage).HasPrecision(5, 2);
            entity.HasIndex(x => x.UserName);
            entity.HasOne(x => x.Topic)
                .WithMany(x => x.TestResults)
                .HasForeignKey(x => x.TopicId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<UserAnswer>(entity =>
        {
            entity.Property(x => x.AnswerText).HasMaxLength(600);
            entity.Property(x => x.CorrectAnswerText).HasMaxLength(600).IsRequired();
            entity.Property(x => x.Explanation).HasMaxLength(1000);
            entity.HasIndex(x => x.TestResultId);
            entity.HasIndex(x => x.QuestionId);
            entity.HasOne(x => x.TestResult)
                .WithMany(x => x.UserAnswers)
                .HasForeignKey(x => x.TestResultId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(x => x.Question)
                .WithMany()
                .HasForeignKey(x => x.QuestionId)
                .OnDelete(DeleteBehavior.NoAction);
            entity.HasOne(x => x.Answer)
                .WithMany()
                .HasForeignKey(x => x.AnswerId)
                .OnDelete(DeleteBehavior.NoAction);
        });

    }

    private static void Seed(ModelBuilder modelBuilder)
    {
        var createdAt = new DateTime(2026, 10, 8, 0, 0, 0, DateTimeKind.Utc);

        modelBuilder.Entity<Chapter>().HasData(new Chapter
        {
            Id = 1,
            Title = "Traveling",
            Description = "Chapter 1 introduces travel vocabulary, simple trip plans, and describing travel experiences.",
            OrderIndex = 1
        });

        modelBuilder.Entity<Topic>().HasData(
            new Topic { Id = 1, ChapterId = 1, Title = "We're going on vacation", Description = "Learn common vacation words and short travel sentences.", OrderIndex = 1, IsActive = true, CreatedAt = createdAt },
            new Topic { Id = 2, ChapterId = 1, Title = "Description of travel experiences", Description = "Practice describing trips, places, and memories.", OrderIndex = 2, IsActive = true, CreatedAt = createdAt },
            new Topic { Id = 3, ChapterId = 1, Title = "Discussing types of vacation", Description = "Compare beach, city, adventure, and family vacations.", OrderIndex = 3, IsActive = true, CreatedAt = createdAt },
            new Topic { Id = 4, ChapterId = 1, Title = "Trip planning", Description = "Use practical phrases for booking, schedules, and packing.", OrderIndex = 4, IsActive = true, CreatedAt = createdAt });

        modelBuilder.Entity<Vocabulary>().HasData(
            new Vocabulary { Id = 1, TopicId = 1, Word = "vacation", Translation = "демалыс", ExampleSentence = "We are going on vacation next week.", PartOfSpeech = "noun", CreatedAt = createdAt },
            new Vocabulary { Id = 2, TopicId = 1, Word = "ticket", Translation = "билет", ExampleSentence = "I bought a train ticket online.", PartOfSpeech = "noun", CreatedAt = createdAt },
            new Vocabulary { Id = 3, TopicId = 1, Word = "suitcase", Translation = "чемодан", ExampleSentence = "My suitcase is ready for the trip.", PartOfSpeech = "noun", CreatedAt = createdAt },
            new Vocabulary { Id = 4, TopicId = 2, Word = "amazing", Translation = "керемет", ExampleSentence = "The mountain view was amazing.", PartOfSpeech = "adjective", CreatedAt = createdAt },
            new Vocabulary { Id = 5, TopicId = 2, Word = "crowded", Translation = "адам көп", ExampleSentence = "The station was crowded in the morning.", PartOfSpeech = "adjective", CreatedAt = createdAt },
            new Vocabulary { Id = 6, TopicId = 3, Word = "adventure", Translation = "шытырман оқиға", ExampleSentence = "An adventure vacation can be exciting.", PartOfSpeech = "noun", CreatedAt = createdAt },
            new Vocabulary { Id = 7, TopicId = 3, Word = "relaxing", Translation = "тынықтыратын", ExampleSentence = "A beach vacation is relaxing.", PartOfSpeech = "adjective", CreatedAt = createdAt },
            new Vocabulary { Id = 8, TopicId = 4, Word = "itinerary", Translation = "сапар жоспары", ExampleSentence = "Our itinerary includes two museums.", PartOfSpeech = "noun", CreatedAt = createdAt },
            new Vocabulary { Id = 9, TopicId = 4, Word = "reservation", Translation = "бронь", ExampleSentence = "We made a hotel reservation.", PartOfSpeech = "noun", CreatedAt = createdAt });

        modelBuilder.Entity<TestQuestion>().HasData(
            new TestQuestion { Id = 1, TopicId = 1, QuestionText = "What does \"vacation\" mean?", QuestionType = "MultipleChoice", CreatedAt = createdAt, IsActive = true },
            new TestQuestion { Id = 2, TopicId = 1, QuestionText = "Choose the correct word: I packed my clothes in a ____.", QuestionType = "MultipleChoice", CreatedAt = createdAt, IsActive = true },
            new TestQuestion { Id = 3, TopicId = 2, QuestionText = "Which word can describe a very good travel experience?", QuestionType = "MultipleChoice", CreatedAt = createdAt, IsActive = true },
            new TestQuestion { Id = 4, TopicId = 3, QuestionText = "Which vacation type is usually connected with excitement and new activities?", QuestionType = "MultipleChoice", CreatedAt = createdAt, IsActive = true },
            new TestQuestion { Id = 5, TopicId = 4, QuestionText = "What is an itinerary?", QuestionType = "MultipleChoice", CreatedAt = createdAt, IsActive = true });

        modelBuilder.Entity<TestAnswer>().HasData(
            new TestAnswer { Id = 1, QuestionId = 1, AnswerText = "жұмыс", IsCorrect = false },
            new TestAnswer { Id = 2, QuestionId = 1, AnswerText = "демалыс", IsCorrect = true },
            new TestAnswer { Id = 3, QuestionId = 1, AnswerText = "сабақ", IsCorrect = false },
            new TestAnswer { Id = 4, QuestionId = 1, AnswerText = "саяхатшы", IsCorrect = false },
            new TestAnswer { Id = 5, QuestionId = 2, AnswerText = "suitcase", IsCorrect = true },
            new TestAnswer { Id = 6, QuestionId = 2, AnswerText = "station", IsCorrect = false },
            new TestAnswer { Id = 7, QuestionId = 2, AnswerText = "passport", IsCorrect = false },
            new TestAnswer { Id = 8, QuestionId = 2, AnswerText = "map", IsCorrect = false },
            new TestAnswer { Id = 9, QuestionId = 3, AnswerText = "amazing", IsCorrect = true },
            new TestAnswer { Id = 10, QuestionId = 3, AnswerText = "late", IsCorrect = false },
            new TestAnswer { Id = 11, QuestionId = 3, AnswerText = "empty", IsCorrect = false },
            new TestAnswer { Id = 12, QuestionId = 3, AnswerText = "usual", IsCorrect = false },
            new TestAnswer { Id = 13, QuestionId = 4, AnswerText = "adventure vacation", IsCorrect = true },
            new TestAnswer { Id = 14, QuestionId = 4, AnswerText = "quiet homework", IsCorrect = false },
            new TestAnswer { Id = 15, QuestionId = 4, AnswerText = "daily routine", IsCorrect = false },
            new TestAnswer { Id = 16, QuestionId = 4, AnswerText = "simple lunch", IsCorrect = false },
            new TestAnswer { Id = 17, QuestionId = 5, AnswerText = "a trip plan", IsCorrect = true },
            new TestAnswer { Id = 18, QuestionId = 5, AnswerText = "a heavy bag", IsCorrect = false },
            new TestAnswer { Id = 19, QuestionId = 5, AnswerText = "a train ticket", IsCorrect = false },
            new TestAnswer { Id = 20, QuestionId = 5, AnswerText = "a beach photo", IsCorrect = false });
    }
}
