const { spawn } = require('child_process');
const path = require('path');
const { ensureProjectEnv, ROOT } = require('./lib/env');
const { waitForPostgres } = require('./wait-for-postgres');

const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const npxCmd = process.platform === 'win32' ? 'npx.cmd' : 'npx';

function run(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: 'inherit',
      shell: false,
      ...options,
    });
    child.on('error', reject);
    child.on('exit', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${command} ${args.join(' ')} exited with code ${code}`));
    });
  });
}

async function databaseNeedsSeed(env, backendDir) {
  const childEnv = { ...process.env, ...env };
  return new Promise((resolve) => {
    const child = spawn(npxCmd, ['tsx', 'scripts/check-needs-seed.js'], {
      cwd: backendDir,
      env: childEnv,
      shell: false,
      stdio: ['ignore', 'pipe', 'inherit'],
    });
    let out = '';
    child.stdout?.on('data', (chunk) => {
      out += chunk.toString();
    });
    child.on('exit', (code) => {
      if (code === 2) {
        resolve(false);
        return;
      }
      const count = Number.parseInt(out.trim(), 10);
      resolve(!Number.isFinite(count) || count === 0);
    });
    child.on('error', () => resolve(true));
  });
}

async function main() {
  const env = ensureProjectEnv();
  await waitForPostgres(env.DATABASE_URL);

  const backendDir = path.join(ROOT, 'backend');
  const childEnv = { ...process.env, ...env };

  console.log('[db] generating Prisma client');
  await run(npxCmd, ['prisma', 'generate'], { cwd: backendDir, env: childEnv });

  console.log('[db] applying Prisma migrations (migrate deploy)');
  await run(npxCmd, ['prisma', 'migrate', 'deploy'], { cwd: backendDir, env: childEnv });

  const needsSeed = await databaseNeedsSeed(env, backendDir);
  const shouldSeed =
    process.env.MUNICIPAL_SKIP_SEED !== '1' &&
    (process.env.MUNICIPAL_FORCE_SEED === '1' || needsSeed);

  if (shouldSeed) {
    console.log('[db] empty database — loading demo seed data');
    await run(npmCmd, ['run', 'prisma:seed'], { cwd: backendDir, env: childEnv });
  } else {
    console.log('[db] schema ready (seed skipped — users already exist)');
  }
}

if (require.main === module) {
  main().catch((err) => {
    console.error(err.message);
    process.exit(1);
  });
}

module.exports = { main };
