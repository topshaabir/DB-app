import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../../', import.meta.url));
const result = spawnSync('dotnet', ['run', '--project', 'tools/ExportD1', '--', 'cloudflare/data/migration.sql'], {
  cwd: root, stdio: 'inherit', env: process.env
});
if (result.error) console.error('Export requires the .NET 10 SDK:', result.error.message);
process.exit(result.status ?? 1);
