import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const client = fileURLToPath(new URL('../../client/', import.meta.url));
const result = spawnSync(process.execPath, ['node_modules/typescript/bin/tsc', '-b'], {
  cwd: client, stdio: 'inherit'
});
if (result.status !== 0) process.exit(result.status ?? 1);
const build = spawnSync(process.execPath, ['node_modules/vite/bin/vite.js', 'build'], {
  cwd: client, stdio: 'inherit', env: { ...process.env, VITE_API_BASE_URL: '/api' }
});
process.exit(build.status ?? 1);
