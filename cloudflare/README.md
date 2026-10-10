# Cloudflare Workers + D1

Production: https://fluffy.ogeresggg.workers.dev

The React app and API are deployed together at `https://fluffy.<account-subdomain>.workers.dev`.
Requests use `/api` on the same origin, with no Render dependency or SQL Server connection.
Use Workers Free and D1 Free; do not enable Containers or a paid subscription for this setup.

## Install and Test

Requires Node.js 22.13+ and npm. From the repository root:

```powershell
npm --prefix client ci
npm --prefix cloudflare ci
cd cloudflare
npm test
npm run build
npm run db:local
npm run seed
npx wrangler d1 execute DB --local --file=data/seed.sql
npm run dev
```

Open `http://localhost:8787`. Apply the seed only once to an empty database.
Existing ASP.NET development commands remain available in the repository README.

## Create the Cloud Database

```powershell
npx wrangler login
npx wrangler d1 create fluffy-db
```

Replace the placeholder `database_id` in `wrangler.json` with the returned UUID.
If the database already exists, use `npx wrangler d1 list` and reuse its ID.
Then apply the schema:

```powershell
npm run db:remote
```

## Move Existing Data

Prefer exporting the live Azure SQL database so IDs, vocabulary, test answers, and
historical results are retained. Temporarily pause submissions during the final
export and cutover to avoid losing results written to the old API afterwards.

The export tool requires the .NET 10 SDK used by the existing backend.
Set `ConnectionStrings__DefaultConnection` in the shell to the existing database's
connection string. Do not commit credentials or put them in frontend variables.
Alternatively, set that value in the ignored `cloudflare/.env.local` file;
the export command loads it automatically. Remove it after migration.
The export reads SQL Server without changing its data and uses a consistent transaction:

```powershell
npm run export:sqlserver
npx wrangler d1 execute DB --remote --file=data/migration.sql
Remove-Item Env:ConnectionStrings__DefaultConnection
```

Import only into an empty database after applying the schema. Exported data is
ignored by Git under `data/`. Review the exported table counts before importing.

If historical results are not needed, use the bundled vocabulary instead:

```powershell
npm run seed
npx wrangler d1 execute DB --remote --file=data/seed.sql
```

Choose one import source. The vocabulary seed does not include existing results
and assigns fresh IDs, so old saved topic links may change.

## Publish and Verify

```powershell
npm run deploy
```

The build explicitly uses `VITE_API_BASE_URL=/api`, even if the shell contains
an older Render URL. SPA navigation falls back to `index.html`; `/api/*` and
`/health` always go to the Worker.

Verify `/health`, `/api/chapters`, a test submission, profile history, and
the leaderboard at the URL Wrangler returns. Keep the previous deployment
available until this verification succeeds. No automatic deletion of Render,
Netlify, or Azure resources is performed.

For Cloudflare Git builds, set root directory to the repository root,
build command to `npm --prefix client ci && npm --prefix cloudflare ci && npm --prefix cloudflare run build`,
and deploy command to `npm --prefix cloudflare exec -- wrangler deploy`.
Create/import the D1 database once before enabling those builds.

## Behavior and Limits

The API retains the frontend response fields and server-side scoring. Names are
trimmed and grouped case-insensitively, including non-ASCII names, for profiles
and leaderboards. Like the existing application, profiles are identified by
name and do not authenticate users.

Workers and D1 Free have usage quotas. When a quota is exhausted, requests may
fail until it resets. This migration removes the Render service startup wait;
it does not guarantee a fixed response time or unlimited free traffic.

Official references:

- https://developers.cloudflare.com/workers/static-assets/
- https://developers.cloudflare.com/d1/get-started/
- https://developers.cloudflare.com/d1/platform/pricing/
