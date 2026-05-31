#!/usr/bin/env node
const { spawn } = require('child_process');
const path = require('path');
const { ensureProjectEnv, ROOT } = require('./lib/env');

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
      else reject(new Error(`verify exited with code ${code}`));
    });
  });
}

async function main() {
  const env = ensureProjectEnv();
  const backendDir = path.join(ROOT, 'backend');
  await run(npxCmd, ['tsx', 'scripts/verify-db-init.js'], {
    cwd: backendDir,
    env: { ...process.env, ...env },
  });
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
