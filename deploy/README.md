# Render and Azure SQL

## Azure SQL

Create an Azure SQL database using the Free offer. Select **Auto-pause the database until next month**, not paid overage. Create a SQL authentication login and keep its password outside Git.

In the SQL server networking settings, allow your current client IP for administration and the outbound IP addresses listed by your Render service. Keep encrypted connections enabled. Do not expose the database password to the React app.

## Render

Create a Web Service connected to this repository:

- Branch: `main`
- Language: `Docker`
- Root Directory: leave empty
- Dockerfile Path: `./Dockerfile`
- Instance Type: `Free`
- Health Check Path: `/health` (process health only, not database availability)

Set these runtime environment variables before deploying:

| Name | Value |
| --- | --- |
| `ConnectionStrings__DefaultConnection` | Azure SQL ADO.NET connection string |
| `Cors__AllowedOrigins__0` | `https://fluffydb.netlify.app` (no trailing slash); use additional indexed entries for other frontend domains |
| `INITIALIZE_DATABASE` | `true` for the first deployment; change to `false` once initialization succeeds |
| `SYNC_VOCABULARY` | `true` for a one-time vocabulary update on an existing database; return to `false` after the update |

Connection string template (replace placeholders in Render, not in Git):

```text
Server=tcp:YOUR_SERVER.database.windows.net,1433;Database=FluffyDb;User ID=YOUR_LOGIN;Password=YOUR_PASSWORD;Encrypt=True;TrustServerCertificate=False;Connection Timeout=60;
```

Initialization applies EF migrations, imports the Russian vocabulary entries, and creates translation questions. It does not copy local users or their test results. It stops the container if initialization fails. Do not leave initialization enabled for routine deployments: re-importing updates translations from the file.

For an existing database, set `SYNC_VOCABULARY=true` and keep `INITIALIZE_DATABASE=false` for one deployment. This imports the bundled content and generates its tests without running schema migrations. Once the logs confirm success, set `SYNC_VOCABULARY=false` to avoid repeating the import on future starts. Importing again is safe: existing chapters, topics and words are matched by name and reused; test answer IDs are preserved.

## Netlify

Add this environment variable and rebuild the site:

```text
VITE_API_BASE_URL=https://YOUR_SERVICE.onrender.com/api
```

Check `/health`, `/api/chapters`, and `/api/tests/questions?scopeType=all` on the Render URL. Then verify loading and submitting a test from the Netlify site.

The API always permits `https://fluffydb.netlify.app` alongside any configured origins. After CORS changes, redeploy the Render API as well as the Netlify client. A successful `/health` response alone does not confirm browser access: API responses must include `Access-Control-Allow-Origin: https://fluffydb.netlify.app` when requested from that origin.

Free Render services sleep after inactivity. The first request can be slow. The Azure database can pause when its monthly allowance is exhausted.
