using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace Fluffy.Api.Migrations
{
    /// <inheritdoc />
    public partial class RemoveTravelingSeed : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "TestAnswers",
                keyColumn: "Id",
                keyValue: 1);

            migrationBuilder.DeleteData(
                table: "TestAnswers",
                keyColumn: "Id",
                keyValue: 2);

            migrationBuilder.DeleteData(
                table: "TestAnswers",
                keyColumn: "Id",
                keyValue: 3);

            migrationBuilder.DeleteData(
                table: "TestAnswers",
                keyColumn: "Id",
                keyValue: 4);

            migrationBuilder.DeleteData(
                table: "TestAnswers",
                keyColumn: "Id",
                keyValue: 5);

            migrationBuilder.DeleteData(
                table: "TestAnswers",
                keyColumn: "Id",
                keyValue: 6);

            migrationBuilder.DeleteData(
                table: "TestAnswers",
                keyColumn: "Id",
                keyValue: 7);

            migrationBuilder.DeleteData(
                table: "TestAnswers",
                keyColumn: "Id",
                keyValue: 8);

            migrationBuilder.DeleteData(
                table: "TestAnswers",
                keyColumn: "Id",
                keyValue: 9);

            migrationBuilder.DeleteData(
                table: "TestAnswers",
                keyColumn: "Id",
                keyValue: 10);

            migrationBuilder.DeleteData(
                table: "TestAnswers",
                keyColumn: "Id",
                keyValue: 11);

            migrationBuilder.DeleteData(
                table: "TestAnswers",
                keyColumn: "Id",
                keyValue: 12);

            migrationBuilder.DeleteData(
                table: "TestAnswers",
                keyColumn: "Id",
                keyValue: 13);

            migrationBuilder.DeleteData(
                table: "TestAnswers",
                keyColumn: "Id",
                keyValue: 14);

            migrationBuilder.DeleteData(
                table: "TestAnswers",
                keyColumn: "Id",
                keyValue: 15);

            migrationBuilder.DeleteData(
                table: "TestAnswers",
                keyColumn: "Id",
                keyValue: 16);

            migrationBuilder.DeleteData(
                table: "TestAnswers",
                keyColumn: "Id",
                keyValue: 17);

            migrationBuilder.DeleteData(
                table: "TestAnswers",
                keyColumn: "Id",
                keyValue: 18);

            migrationBuilder.DeleteData(
                table: "TestAnswers",
                keyColumn: "Id",
                keyValue: 19);

            migrationBuilder.DeleteData(
                table: "TestAnswers",
                keyColumn: "Id",
                keyValue: 20);

            migrationBuilder.DeleteData(
                table: "Vocabulary",
                keyColumn: "Id",
                keyValue: 1);

            migrationBuilder.DeleteData(
                table: "Vocabulary",
                keyColumn: "Id",
                keyValue: 2);

            migrationBuilder.DeleteData(
                table: "Vocabulary",
                keyColumn: "Id",
                keyValue: 3);

            migrationBuilder.DeleteData(
                table: "Vocabulary",
                keyColumn: "Id",
                keyValue: 4);

            migrationBuilder.DeleteData(
                table: "Vocabulary",
                keyColumn: "Id",
                keyValue: 5);

            migrationBuilder.DeleteData(
                table: "Vocabulary",
                keyColumn: "Id",
                keyValue: 6);

            migrationBuilder.DeleteData(
                table: "Vocabulary",
                keyColumn: "Id",
                keyValue: 7);

            migrationBuilder.DeleteData(
                table: "Vocabulary",
                keyColumn: "Id",
                keyValue: 8);

            migrationBuilder.DeleteData(
                table: "Vocabulary",
                keyColumn: "Id",
                keyValue: 9);

            migrationBuilder.DeleteData(
                table: "TestQuestions",
                keyColumn: "Id",
                keyValue: 1);

            migrationBuilder.DeleteData(
                table: "TestQuestions",
                keyColumn: "Id",
                keyValue: 2);

            migrationBuilder.DeleteData(
                table: "TestQuestions",
                keyColumn: "Id",
                keyValue: 3);

            migrationBuilder.DeleteData(
                table: "TestQuestions",
                keyColumn: "Id",
                keyValue: 4);

            migrationBuilder.DeleteData(
                table: "TestQuestions",
                keyColumn: "Id",
                keyValue: 5);

            migrationBuilder.DeleteData(
                table: "Topics",
                keyColumn: "Id",
                keyValue: 1);

            migrationBuilder.DeleteData(
                table: "Topics",
                keyColumn: "Id",
                keyValue: 2);

            migrationBuilder.DeleteData(
                table: "Topics",
                keyColumn: "Id",
                keyValue: 3);

            migrationBuilder.DeleteData(
                table: "Topics",
                keyColumn: "Id",
                keyValue: 4);

            migrationBuilder.DeleteData(
                table: "Chapters",
                keyColumn: "Id",
                keyValue: 1);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
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
        }
    }
}
