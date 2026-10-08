using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace Fluffy.Api.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Chapters",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Title = table.Column<string>(type: "nvarchar(140)", maxLength: 140, nullable: false),
                    Description = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    OrderIndex = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Chapters", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Topics",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ChapterId = table.Column<int>(type: "int", nullable: false),
                    Title = table.Column<string>(type: "nvarchar(180)", maxLength: 180, nullable: false),
                    Description = table.Column<string>(type: "nvarchar(600)", maxLength: 600, nullable: true),
                    ImageUrl = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    OrderIndex = table.Column<int>(type: "int", nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Topics", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Topics_Chapters_ChapterId",
                        column: x => x.ChapterId,
                        principalTable: "Chapters",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "TestQuestions",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    TopicId = table.Column<int>(type: "int", nullable: false),
                    QuestionText = table.Column<string>(type: "nvarchar(600)", maxLength: 600, nullable: false),
                    QuestionType = table.Column<string>(type: "nvarchar(80)", maxLength: 80, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TestQuestions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TestQuestions_Topics_TopicId",
                        column: x => x.TopicId,
                        principalTable: "Topics",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "TestResults",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    UserName = table.Column<string>(type: "nvarchar(120)", maxLength: 120, nullable: false),
                    TopicId = table.Column<int>(type: "int", nullable: true),
                    ScopeLabel = table.Column<string>(type: "nvarchar(220)", maxLength: 220, nullable: true),
                    Score = table.Column<int>(type: "int", nullable: false),
                    TotalQuestions = table.Column<int>(type: "int", nullable: false),
                    Percentage = table.Column<decimal>(type: "decimal(5,2)", precision: 5, scale: 2, nullable: false),
                    CompletedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TestResults", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TestResults_Topics_TopicId",
                        column: x => x.TopicId,
                        principalTable: "Topics",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "Vocabulary",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    TopicId = table.Column<int>(type: "int", nullable: false),
                    Word = table.Column<string>(type: "nvarchar(120)", maxLength: 120, nullable: false),
                    Translation = table.Column<string>(type: "nvarchar(160)", maxLength: 160, nullable: false),
                    ExampleSentence = table.Column<string>(type: "nvarchar(600)", maxLength: 600, nullable: false),
                    PartOfSpeech = table.Column<string>(type: "nvarchar(80)", maxLength: 80, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Vocabulary", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Vocabulary_Topics_TopicId",
                        column: x => x.TopicId,
                        principalTable: "Topics",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "TestAnswers",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    QuestionId = table.Column<int>(type: "int", nullable: false),
                    AnswerText = table.Column<string>(type: "nvarchar(300)", maxLength: 300, nullable: false),
                    IsCorrect = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TestAnswers", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TestAnswers_TestQuestions_QuestionId",
                        column: x => x.QuestionId,
                        principalTable: "TestQuestions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.InsertData(
                table: "Chapters",
                columns: new[] { "Id", "Description", "OrderIndex", "Title" },
                values: new object[] { 1, "Chapter 1 introduces travel vocabulary, simple trip plans, and describing travel experiences.", 1, "Traveling" });

            migrationBuilder.InsertData(
                table: "Topics",
                columns: new[] { "Id", "ChapterId", "CreatedAt", "Description", "ImageUrl", "IsActive", "OrderIndex", "Title" },
                values: new object[,]
                {
                    { 1, 1, new DateTime(2026, 10, 8, 0, 0, 0, 0, DateTimeKind.Utc), "Learn common vacation words and short travel sentences.", null, true, 1, "We're going on vacation" },
                    { 2, 1, new DateTime(2026, 10, 8, 0, 0, 0, 0, DateTimeKind.Utc), "Practice describing trips, places, and memories.", null, true, 2, "Description of travel experiences" },
                    { 3, 1, new DateTime(2026, 10, 8, 0, 0, 0, 0, DateTimeKind.Utc), "Compare beach, city, adventure, and family vacations.", null, true, 3, "Discussing types of vacation" },
                    { 4, 1, new DateTime(2026, 10, 8, 0, 0, 0, 0, DateTimeKind.Utc), "Use practical phrases for booking, schedules, and packing.", null, true, 4, "Trip planning" }
                });

            migrationBuilder.InsertData(
                table: "TestQuestions",
                columns: new[] { "Id", "CreatedAt", "IsActive", "QuestionText", "QuestionType", "TopicId" },
                values: new object[,]
                {
                    { 1, new DateTime(2026, 10, 8, 0, 0, 0, 0, DateTimeKind.Utc), true, "What does \"vacation\" mean?", "MultipleChoice", 1 },
                    { 2, new DateTime(2026, 10, 8, 0, 0, 0, 0, DateTimeKind.Utc), true, "Choose the correct word: I packed my clothes in a ____.", "MultipleChoice", 1 },
                    { 3, new DateTime(2026, 10, 8, 0, 0, 0, 0, DateTimeKind.Utc), true, "Which word can describe a very good travel experience?", "MultipleChoice", 2 },
                    { 4, new DateTime(2026, 10, 8, 0, 0, 0, 0, DateTimeKind.Utc), true, "Which vacation type is usually connected with excitement and new activities?", "MultipleChoice", 3 },
                    { 5, new DateTime(2026, 10, 8, 0, 0, 0, 0, DateTimeKind.Utc), true, "What is an itinerary?", "MultipleChoice", 4 }
                });

            migrationBuilder.InsertData(
                table: "Vocabulary",
                columns: new[] { "Id", "CreatedAt", "ExampleSentence", "PartOfSpeech", "TopicId", "Translation", "Word" },
                values: new object[,]
                {
                    { 1, new DateTime(2026, 10, 8, 0, 0, 0, 0, DateTimeKind.Utc), "We are going on vacation next week.", "noun", 1, "демалыс", "vacation" },
                    { 2, new DateTime(2026, 10, 8, 0, 0, 0, 0, DateTimeKind.Utc), "I bought a train ticket online.", "noun", 1, "билет", "ticket" },
                    { 3, new DateTime(2026, 10, 8, 0, 0, 0, 0, DateTimeKind.Utc), "My suitcase is ready for the trip.", "noun", 1, "чемодан", "suitcase" },
                    { 4, new DateTime(2026, 10, 8, 0, 0, 0, 0, DateTimeKind.Utc), "The mountain view was amazing.", "adjective", 2, "керемет", "amazing" },
                    { 5, new DateTime(2026, 10, 8, 0, 0, 0, 0, DateTimeKind.Utc), "The station was crowded in the morning.", "adjective", 2, "адам көп", "crowded" },
                    { 6, new DateTime(2026, 10, 8, 0, 0, 0, 0, DateTimeKind.Utc), "An adventure vacation can be exciting.", "noun", 3, "шытырман оқиға", "adventure" },
                    { 7, new DateTime(2026, 10, 8, 0, 0, 0, 0, DateTimeKind.Utc), "A beach vacation is relaxing.", "adjective", 3, "тынықтыратын", "relaxing" },
                    { 8, new DateTime(2026, 10, 8, 0, 0, 0, 0, DateTimeKind.Utc), "Our itinerary includes two museums.", "noun", 4, "сапар жоспары", "itinerary" },
                    { 9, new DateTime(2026, 10, 8, 0, 0, 0, 0, DateTimeKind.Utc), "We made a hotel reservation.", "noun", 4, "бронь", "reservation" }
                });

            migrationBuilder.InsertData(
                table: "TestAnswers",
                columns: new[] { "Id", "AnswerText", "IsCorrect", "QuestionId" },
                values: new object[,]
                {
                    { 1, "жұмыс", false, 1 },
                    { 2, "демалыс", true, 1 },
                    { 3, "сабақ", false, 1 },
                    { 4, "саяхатшы", false, 1 },
                    { 5, "suitcase", true, 2 },
                    { 6, "station", false, 2 },
                    { 7, "passport", false, 2 },
                    { 8, "map", false, 2 },
                    { 9, "amazing", true, 3 },
                    { 10, "late", false, 3 },
                    { 11, "empty", false, 3 },
                    { 12, "usual", false, 3 },
                    { 13, "adventure vacation", true, 4 },
                    { 14, "quiet homework", false, 4 },
                    { 15, "daily routine", false, 4 },
                    { 16, "simple lunch", false, 4 },
                    { 17, "a trip plan", true, 5 },
                    { 18, "a heavy bag", false, 5 },
                    { 19, "a train ticket", false, 5 },
                    { 20, "a beach photo", false, 5 }
                });

            migrationBuilder.CreateIndex(
                name: "IX_Chapters_OrderIndex",
                table: "Chapters",
                column: "OrderIndex");

            migrationBuilder.CreateIndex(
                name: "IX_TestAnswers_QuestionId",
                table: "TestAnswers",
                column: "QuestionId");

            migrationBuilder.CreateIndex(
                name: "IX_TestQuestions_TopicId",
                table: "TestQuestions",
                column: "TopicId");

            migrationBuilder.CreateIndex(
                name: "IX_TestResults_TopicId",
                table: "TestResults",
                column: "TopicId");

            migrationBuilder.CreateIndex(
                name: "IX_TestResults_UserName",
                table: "TestResults",
                column: "UserName");

            migrationBuilder.CreateIndex(
                name: "IX_Topics_ChapterId_OrderIndex",
                table: "Topics",
                columns: new[] { "ChapterId", "OrderIndex" });

            migrationBuilder.CreateIndex(
                name: "IX_Vocabulary_TopicId",
                table: "Vocabulary",
                column: "TopicId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "TestAnswers");

            migrationBuilder.DropTable(
                name: "TestResults");

            migrationBuilder.DropTable(
                name: "Vocabulary");

            migrationBuilder.DropTable(
                name: "TestQuestions");

            migrationBuilder.DropTable(
                name: "Topics");

            migrationBuilder.DropTable(
                name: "Chapters");
        }
    }
}
