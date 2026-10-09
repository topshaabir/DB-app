# Fluffy

Fluffy is a responsive English-learning application foundation. It has a separated React frontend, ASP.NET Core Web API backend, SQL Server database model, EF Core migrations, seeded learning data, and a first working test/profile flow.

## Requirements

- .NET 10 SDK
- Node.js 22 or newer
- npm
- Microsoft SQL Server, SQL Server Express, or LocalDB-compatible SQL Server setup

## Technologies

- Frontend: React, TypeScript, Vite, CSS
- Backend: ASP.NET Core Web API, C#
- Database: SQL Server
- Data access: Entity Framework Core with migrations

## Project Structure

```text
Fluffy/
  client/
    src/
      components/
      hooks/
      layouts/
      pages/
      services/
      styles/
      types/
  server/
    Controllers/
    Data/
    DTOs/
    Migrations/
    Models/
    Services/
```

## Database Structure

- `Chapters`: learning chapter/category records.
- `Topics`: lessons inside chapters.
- `Vocabulary`: topic vocabulary with translation, example sentence, and part of speech.
- `TestQuestions`: active questions tied to topics.
- `TestAnswers`: answer choices with one or more correct answers supported by the schema.
- `TestResults`: saved user test results, ready for a future leaderboard.

## Configure SQL Server

The default connection string is in `server/appsettings.json` and `server/appsettings.Development.json`:

```json
"DefaultConnection": "Server=.\\SQLEXPRESS;Database=FluffyDb;Trusted_Connection=True;Encrypt=False;TrustServerCertificate=True;MultipleActiveResultSets=true"
```

For a different SQL Server instance, change only the `Server=` value. Examples:

- SQL Server Express: `Server=.\\SQLEXPRESS;...`
- LocalDB: `Server=(localdb)\\MSSQLLocalDB;...`
- Named server: `Server=YOUR_SERVER_NAME;...`

Do not put database passwords directly in source code. For real credentials, use user secrets or environment-specific configuration.

## EF Migrations

Restore local .NET tools:

```powershell
dotnet tool restore
```

Create or update the database:

```powershell
dotnet tool run dotnet-ef database update --project server\Fluffy.Api.csproj --startup-project server\Fluffy.Api.csproj
```

Add a new migration after changing models:

```powershell
dotnet tool run dotnet-ef migrations add MigrationName --project server\Fluffy.Api.csproj --startup-project server\Fluffy.Api.csproj --output-dir Migrations
```

Seed data is defined in `server/Data/FluffyDbContext.cs` and is applied through the migration/database update process.

## Run Backend

```powershell
dotnet run --project server\Fluffy.Api.csproj --launch-profile https
```

The API runs at:

- `https://localhost:7074/api`
- `http://localhost:5101/api`

## Run Frontend

Install dependencies:

```powershell
cd client
npm install
```

Create `client/.env` from `client/.env.example` if you need to change the API URL:

```text
VITE_API_BASE_URL=/api
```

Start Vite:

```powershell
npm run dev
```

Open `http://localhost:5173`.

Vite forwards `/api` requests to the backend at `http://localhost:5101`.
Keep both terminals running while using the site.

## API Endpoints

- `GET /api/chapters`
- `GET /api/chapters/{id}`
- `GET /api/topics`
- `GET /api/topics/{id}`
- `GET /api/topics/{id}/vocabulary`
- `GET /api/topics/{id}/questions`
- `GET /api/tests/scopes`
- `GET /api/tests/questions?scopeType=all`
- `GET /api/tests/questions?scopeType=chapter&scopeId=1`
- `GET /api/tests/questions?scopeType=topic&scopeId=1`
- `POST /api/tests/submit`
- `GET /api/leaderboard?period=all`
- `GET /api/leaderboard?period=week&topicId=5`
- `GET /api/test-results/{name}`
- `GET /api/profile/{name}`

## Add Learning Content

Translation tests choose distinct distractors from the same topic and shuffle the answer order. Existing imported questions use corrected choices without reinitializing the database; their answer IDs remain stable for scoring. A generic `Vocabulary` topic is displayed using its chapter name and opens directly from the topic list. Named subtopics remain grouped under their chapters.

Leaderboard points are the total number of correctly answered questions across completed tests. Equal points are ordered by weighted accuracy, then name. The leaderboard shows the top 100 learners, supports all-time/last-seven-day periods and topic filtering, and combines names ignoring case and surrounding whitespace. Names are not authenticated accounts yet. Results can only be created through server-scored `POST /api/tests/submit`; the old client-supplied score endpoint has been removed.

To add a chapter, add a `Chapter` row with `Title`, `Description`, and `OrderIndex`.

To add a topic, add a `Topic` row with `ChapterId`, `Title`, `Description`, `OrderIndex`, `IsActive`, and `CreatedAt`.

To add vocabulary, add a `Vocabulary` row with `TopicId`, `Word`, `Translation`, `ExampleSentence`, and optional `PartOfSpeech`.

To add test questions, add a `TestQuestion` row with `TopicId`, `QuestionText`, `QuestionType`, `CreatedAt`, and `IsActive`, then add related `TestAnswer` rows. Mark the correct answer with `IsCorrect = true`.

For development seed data, update `Seed` in `FluffyDbContext`, add a new migration, then run `database update`.

## Build Checks

Backend:

```powershell
dotnet build server\Fluffy.Api.csproj
```

Frontend:

```powershell
cd client
npm run build
```

## First Version Flow

1. Open Fluffy.
2. View `Өтілген тақырыптар`.
3. See Chapter 1 - Traveling and topics loaded from SQL Server through the API.
4. Open a topic and view vocabulary from the database.
5. Go to Test, enter a name, choose a scope, answer questions, and submit.
6. The backend scores the test and stores the result in SQL Server.
7. Open Profile and load statistics by name.

## Next Development Phase

- Add authentication and persistent user accounts.
- Add admin screens for chapters, topics, vocabulary, and questions.
- Add richer exercise types.
- Add automated backend tests and frontend component tests.
