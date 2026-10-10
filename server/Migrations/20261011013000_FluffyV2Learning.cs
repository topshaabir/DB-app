using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Fluffy.Api.Migrations
{
    public partial class FluffyV2Learning : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ExampleTranslation",
                table: "Vocabulary",
                type: "nvarchar(600)",
                maxLength: 600,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Ipa",
                table: "Vocabulary",
                type: "nvarchar(120)",
                maxLength: 120,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "TranslationKz",
                table: "Vocabulary",
                type: "nvarchar(220)",
                maxLength: 220,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "TranslationRu",
                table: "Vocabulary",
                type: "nvarchar(220)",
                maxLength: 220,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ParentResultId",
                table: "TestResults",
                type: "nvarchar(80)",
                maxLength: 80,
                nullable: true);

            migrationBuilder.CreateTable(
                name: "UserAnswers",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    TestResultId = table.Column<int>(type: "int", nullable: false),
                    QuestionId = table.Column<int>(type: "int", nullable: false),
                    AnswerId = table.Column<int>(type: "int", nullable: true),
                    AnswerText = table.Column<string>(type: "nvarchar(600)", maxLength: 600, nullable: true),
                    IsCorrect = table.Column<bool>(type: "bit", nullable: false),
                    CorrectAnswerText = table.Column<string>(type: "nvarchar(600)", maxLength: 600, nullable: false),
                    Explanation = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UserAnswers", x => x.Id);
                    table.ForeignKey(
                        name: "FK_UserAnswers_TestAnswers_AnswerId",
                        column: x => x.AnswerId,
                        principalTable: "TestAnswers",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_UserAnswers_TestQuestions_QuestionId",
                        column: x => x.QuestionId,
                        principalTable: "TestQuestions",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_UserAnswers_TestResults_TestResultId",
                        column: x => x.TestResultId,
                        principalTable: "TestResults",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_UserAnswers_AnswerId",
                table: "UserAnswers",
                column: "AnswerId");

            migrationBuilder.CreateIndex(
                name: "IX_UserAnswers_QuestionId",
                table: "UserAnswers",
                column: "QuestionId");

            migrationBuilder.CreateIndex(
                name: "IX_UserAnswers_TestResultId",
                table: "UserAnswers",
                column: "TestResultId");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(name: "UserAnswers");
            migrationBuilder.DropColumn(name: "ExampleTranslation", table: "Vocabulary");
            migrationBuilder.DropColumn(name: "Ipa", table: "Vocabulary");
            migrationBuilder.DropColumn(name: "TranslationKz", table: "Vocabulary");
            migrationBuilder.DropColumn(name: "TranslationRu", table: "Vocabulary");
            migrationBuilder.DropColumn(name: "ParentResultId", table: "TestResults");
        }
    }
}
