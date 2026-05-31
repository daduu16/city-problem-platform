#!/usr/bin/env node
/**
 * Initialize Postgres (Docker), apply migrations, and load demo seed data.
 * Usage: npm run db:init [-- --force-seed] [-- --skip-seed] [-- --reset]
 */
const { spawn } = require('child_process');
const path = require('path');
const { ensureProjectEnv, ROOT } = require('./lib/env');
const { main: applyMigrationsAndSeed } = require('./setup-db');

const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const dockerCmd = process.platform === 'win32' ? 'docker.exe' : 'docker';

function parseArgs(argv) {
  return {
    forceSeed: argv.includes('--force-seed'),
    skipSeed: argv.includes('--skip-seed'),
    reset: argv.includes('--reset'),
    skipDocker: argv.includes('--skip-docker'),
  };
}

function run(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: options.stdio ?? 'inherit',
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

async function resetVolumes(env) {
  console.log('[db:init] removing postgres/redis volumes (docker compose down -v)');
  await run(dockerCmd, ['compose', 'down', '-v'], {
    cwd: ROOT,
    env: { ...process.env, ...env },
  });
}

async function startInfra(env) {
  console.log('[db:init] starting postgres and redis');
  await run(dockerCmd, ['compose', 'up', '-d', '--wait', 'postgres', 'redis'], {
    cwd: ROOT,
    env: { ...process.env, ...env },
  });
}

async function main(argv = process.argv.slice(2)) {
  const flags = parseArgs(argv);

  console.log('');
  console.log('=== Municipal DB init ===');
  console.log('');

  const env = ensureProjectEnv();
  const childEnv = { ...process.env, ...env };

  if (flags.forceSeed) childEnv.MUNICIPAL_FORCE_SEED = '1';
  if (flags.skipSeed) childEnv.MUNICIPAL_SKIP_SEED = '1';

  if (!flags.skipDocker) {
    if (flags.reset) {
      await resetVolumes(childEnv);
    }
    await startInfra(childEnv);
  } else {
    console.log('[db:init] --skip-docker: assuming postgres/redis already running');
  }

  const previousEnv = process.env;
  Object.assign(process.env, childEnv);
  try {
    await applyMigrationsAndSeed();
  } finally {
    process.env = previousEnv;
  }

  console.log('');
  console.log('[db:init] done.');
  console.log('  Demo login: user@municipal.local / 123456');
  console.log('  Start full stack: npm start');
  console.log('');
}

if (require.main === module) {
  main().catch((err) => {
    console.error('[db:init] failed:', err.message);
    process.exit(1);
  });
}

module.exports = { main };
