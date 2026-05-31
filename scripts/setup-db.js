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

async function verifyDatabase(env, backendDir) {
  const childEnv = { ...process.env, ...env };
  await run(npxCmd, ['tsx', 'scripts/verify-db-init.js'], {
    cwd: backendDir,
    env: childEnv,
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

  if (process.env.MUNICIPAL_SKIP_SEED !== '1') {
    console.log(
      '[db] running demo seed (roles, users, categories, executors, incidents if empty…)',
    );
    await run(npmCmd, ['run', 'prisma:seed'], { cwd: backendDir, env: childEnv });
    await verifyDatabase(env, backendDir);
  } else {
    console.log('[db] seed skipped (MUNICIPAL_SKIP_SEED=1)');
  }
}

if (require.main === module) {
  main().catch((err) => {
    console.error(err.message);
    process.exit(1);
  });
}

module.exports = { main };
