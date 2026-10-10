using System.Data;
using System.Globalization;
using System.Text;
using Microsoft.Data.SqlClient;

if (args.Length != 1) throw new ArgumentException("Usage: ExportD1 <output-file>");
var connectionString = Environment.GetEnvironmentVariable("ConnectionStrings__DefaultConnection");
if (string.IsNullOrWhiteSpace(connectionString))
    throw new InvalidOperationException("Set ConnectionStrings__DefaultConnection to the existing SQL Server database.");

await using var connection = new SqlConnection(connectionString);
await connection.OpenAsync();
await using var transaction = (SqlTransaction)await connection.BeginTransactionAsync(IsolationLevel.Serializable);
var tables = new (string Name, string Query)[]
{
    ("chapters", "SELECT Id AS id,Title AS title,Description AS description,OrderIndex AS orderIndex FROM Chapters"),
    ("topics", "SELECT Id AS id,ChapterId AS chapterId,Title AS title,Description AS description,ImageUrl AS imageUrl,OrderIndex AS orderIndex,IsActive AS isActive FROM Topics"),
    ("vocabulary", "SELECT Id AS id,TopicId AS topicId,Word AS word,Translation AS translation,ExampleSentence AS exampleSentence,PartOfSpeech AS partOfSpeech FROM Vocabulary"),
    ("questions", "SELECT Id AS id,TopicId AS topicId,QuestionText AS questionText,QuestionType AS questionType,IsActive AS isActive FROM TestQuestions"),
    ("answers", "SELECT Id AS id,QuestionId AS questionId,AnswerText AS answerText,IsCorrect AS isCorrect FROM TestAnswers"),
    ("results", "SELECT Id AS id,UserName AS userName,TopicId AS topicId,ScopeLabel AS scopeLabel,Score AS score,TotalQuestions AS totalQuestions,Percentage AS percentage,CompletedAt AS completedAt FROM TestResults")
};
var output = new StringBuilder();
foreach (var (name, query) in tables)
{
    await using var command = new SqlCommand(query + " ORDER BY Id", connection, transaction);
    await using var reader = await command.ExecuteReaderAsync();
    var count = 0;
    while (await reader.ReadAsync())
    {
        var row = Enumerable.Range(0, reader.FieldCount).ToDictionary(reader.GetName, reader.GetValue);
        if (name == "results")
        {
            var userName = ((string)row["userName"]).Trim();
            if (userName.Length is < 1 or > 120 || (int)row["totalQuestions"] <= 0)
                throw new InvalidDataException("Invalid legacy result; review before importing.");
            row["userName"] = userName;
            row["userKey"] = userName.ToUpperInvariant();
        }
        output.Append("INSERT INTO ").Append(name).Append(" (")
            .AppendJoin(',', row.Keys).Append(") VALUES (")
            .AppendJoin(',', row.Values.Select(Literal)).AppendLine(");");
        count++;
    }
    Console.WriteLine($"{name}: {count} rows exported");
}
await transaction.CommitAsync();
var path = Path.GetFullPath(args[0]);
Directory.CreateDirectory(Path.GetDirectoryName(path)!);
await File.WriteAllTextAsync(path, output.ToString(), new UTF8Encoding(false));
Console.WriteLine("Export saved. Import only into an empty D1 database after applying its schema.");

static string Literal(object value) => value switch
{
    DBNull => "NULL",
    bool flag => flag ? "1" : "0",
    DateTime date => Quote(DateTime.SpecifyKind(date, DateTimeKind.Utc).ToString("yyyy-MM-dd'T'HH:mm:ss.fff'Z'", CultureInfo.InvariantCulture)),
    string text => Quote(text),
    IFormattable number => number.ToString(null, CultureInfo.InvariantCulture),
    _ => throw new InvalidDataException($"Unsupported SQL value: {value.GetType().Name}")
};
static string Quote(string value) => "'" + value.Replace("'", "''") + "'";
